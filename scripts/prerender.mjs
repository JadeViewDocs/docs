// 构建后 SEO 预渲染：dumi 导出的是空 SPA 壳，用无头浏览器逐页渲染，
// 把含完整正文 + antd-style 运行时 <style> 的 DOM 写回各路由 index.html（SEO 伪静态化）。
// 主题正确性：客户端 React 会以 createRoot 全量接管 #root（非 hydration），
// 用户端主题按本机偏好渲染，预渲染 HTML 只喂爬虫，不存在 SSG 的主题烤死问题。
//
// 运行方式：
//   CI（Docker）: CHROME_PATH=/usr/bin/chromium-browser node scripts/prerender.mjs
//   本机 Windows: 自动探测 Edge/Chrome
// 失败路由自动回退空壳，不中断构建。

import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const DIST = path.resolve(process.cwd(), 'dist');
const PORT = 4173;
const NAV_TIMEOUT = 30000; // 单页导航超时
const ROOT_TIMEOUT = 20000; // #root 出现内容的等待上限
const SETTLE_MS = 600; // DOM 静默窗口：连续这么久无节点变更才算渲染完成
const SETTLE_TIMEOUT = 15000; // 静默检测的等待上限（懒加载区块挂载慢时兜底超时放行）
// DOM 静默检测拉长了单页存活时间，16 并发下浏览器后期会内存耗尽（尾批集体超时），
// 上限压到 8：速度略降但稳定。CI（2-4 核）会取更小值。
const CONCURRENCY = Math.max(2, Math.min(8, os.cpus().length));
const BATCH_SIZE = CONCURRENCY * 3; // 分批渲染，批间重启浏览器，防内存泄漏与尾部挂起

// 对爬虫无价值的资源：拦截后页面照样渲染出文本 DOM，速度大幅提升
const BLOCKED_RESOURCE_TYPES = new Set(['image', 'media', 'font']);
const BLOCKED_URL_RE = /\.(glb|hdr|wasm|png|jpe?g|gif|webp|avif|svg|woff2?|ttf|otf|mp4|webm)(\?|$)/i;

/** 探测本机可用的 Chromium 系浏览器可执行文件 */
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  throw new Error('未找到可用浏览器：请设置 CHROME_PATH 或安装 Edge/Chrome');
}

/** 枚举 dist 内所有路由（每个含 index.html 的目录） */
function collectRoutes() {
  const routes = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (name === 'index.html' && full !== path.join(DIST, 'index.html')) {
        routes.push(path.relative(DIST, path.dirname(full)).replace(/\\/g, '/'));
      }
    }
  };
  walk(DIST);
  routes.unshift(''); // 根路由
  return routes;
}

/** 静态服务器：目录请求自动映射到该目录下的 index.html */
function startServer() {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    let file = path.join(DIST, urlPath);
    if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(DIST, urlPath, 'index.html');
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.statusCode = 404;
      res.end('not found');
      return;
    }
    const ext = path.extname(file);
    const mime = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
    }[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function launchBrowser() {
  return puppeteer.launch({
    executablePath: findChrome(),
    headless: 'shell',
    // 固定 profile 目录：浏览器缓存跨批/跨页复用，后续路由单页数百毫秒
    userDataDir: path.join(os.tmpdir(), 'jadeview-prerender-profile'),
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      // three.js 需要 WebGL：无 GPU 环境用软件模拟，避免渲染报错阻断 DOM 输出
      '--enable-unsafe-swiftshader',
      '--disable-gpu',
    ],
  });
}

/** 渲染单个路由并写回 dist。返回是否成功。 */
async function renderRoute(page, route) {
  const url = `http://127.0.0.1:${PORT}/${route}`;
  try {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (BLOCKED_RESOURCE_TYPES.has(req.resourceType()) || BLOCKED_URL_RE.test(req.url())) {
        req.abort().catch(() => {});
      } else {
        req.continue().catch(() => {});
      }
    });

    // 不等 networkidle（慢）：DOM 就绪 + #root 出内容后，用「DOM 静默检测」等懒加载区块
    // （首页 HomeExtra 等 React.lazy/动画区块）真正挂载完——并发渲染 CPU 抢占下，
    // 固定延时不可靠（曾导致首页只有导航没有正文）。
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    await page.waitForFunction(
      () => document.getElementById('root')?.childElementCount > 0,
      { timeout: ROOT_TIMEOUT },
    );
    await page.evaluate((quietMs) => {
      window.__lastMut = Date.now();
      const obs = new MutationObserver(() => {
        window.__lastMut = Date.now();
      });
      // 只看节点增删：motion 动画改 style 属性会每帧触发 attributes 事件，不能纳入
      obs.observe(document.documentElement, { subtree: true, childList: true });
    }, SETTLE_MS);
    await page
      .waitForFunction(
        (quietMs) => Date.now() - window.__lastMut >= quietMs,
        { timeout: SETTLE_TIMEOUT, polling: 200 },
        SETTLE_MS,
      )
      .catch(() => {
        // 兜底：15s 内 DOM 一直有变更（常驻动画等），超时放行，内容大多已在内
      });

    const html = await page.evaluate(() => {
      // umi 运行时动态注入的 <script> 默认非阻塞，但序列化进 HTML 后若缺 async/defer
      // 会变成同步脚本阻塞 HTML 解析（首屏 JS 数 MB，阻塞明显）。统一补 async 恢复非阻塞语义。
      document.querySelectorAll('script[src]').forEach((s) => {
        if (!s.async && !s.defer) s.setAttribute('async', '');
      });
      return '<!DOCTYPE html>' + document.documentElement.outerHTML;
    });

    const outFile = path.join(DIST, route, 'index.html');
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, html);
    return true;
  } catch (e) {
    console.error(`[prerender] 失败 ${route}: ${e.message}`);
    return false;
  }
}

/** 渲染一批路由（批内并发）。返回失败路由列表。 */
async function renderBatch(routes) {
  const browser = await launchBrowser();
  const failed = [];
  const queue = [...routes];

  const worker = async () => {
    while (queue.length > 0) {
      const route = queue.shift();
      const page = await browser.newPage();
      try {
        const ok = await renderRoute(page, route);
        if (!ok) failed.push(route);
        else console.log(`[prerender] ok ${route || '/'}`);
      } finally {
        await page.close().catch(() => {});
      }
    }
  };

  try {
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  } finally {
    // 批间重启浏览器：清内存、解挂起
    await browser.close().catch(() => {});
  }
  return failed;
}

async function main() {
  if (!fs.existsSync(DIST)) {
    console.error('[prerender] dist 不存在，请先构建');
    process.exit(1);
  }
  const routes = collectRoutes();
  console.log(`[prerender] ${routes.length} 个路由，并发 ${CONCURRENCY}，批大小 ${BATCH_SIZE}`);

  const server = await startServer();
  const failed = [];
  const started = Date.now();

  try {
    for (let i = 0; i < routes.length; i += BATCH_SIZE) {
      const batch = routes.slice(i, i + BATCH_SIZE);
      failed.push(...(await renderBatch(batch)));
    }

    // 失败路由统一重试一轮（重启后的全新浏览器）
    if (failed.length > 0) {
      console.log(`[prerender] 重试 ${failed.length} 个失败路由`);
      const retry = [...failed];
      failed.length = 0;
      for (let i = 0; i < retry.length; i += BATCH_SIZE) {
        failed.push(...(await renderBatch(retry.slice(i, i + BATCH_SIZE))));
      }
    }
  } finally {
    server.close();
  }

  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`[prerender] 完成 ${routes.length - failed.length}/${routes.length}，失败 ${failed.length} · 总耗时 ${secs}s`);
  // 失败路由保留空壳不中断构建；失败数过半才报错
  if (failed.length > routes.length / 2) {
    console.error('[prerender] 失败过半，构建终止');
    process.exit(1);
  }
}

main();
