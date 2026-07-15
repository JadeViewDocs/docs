#!/usr/bin/env node

/**
 * 按文档页生成「贡献者」静态快照 public/contributors/data.json + 同源头像
 * public/contributors/avatars/<login>.png，供 DocBreadcrumb 右侧 Avatar.Group 消费。
 * 快照同时带 sources（路由 → zh/en 源文件路径），供「编辑此页」拼 GitHub 编辑链接。
 *
 * 为什么这样做：与发行快照（update-changelog.mjs）同一哲学 —— 用户浏览器只读本站
 *   同源静态文件，不在运行时直连 GitHub（头像域 avatars.githubusercontent.com 国内
 *   经常不可达）。「拉 GitHub」只发生在构建机 / CI（海外，可达）。
 *
 * 两种数据源（自动选择）：
 *   · 有 GITHUB_TOKEN（CI）：按文件调 GitHub commits?path= API，拿 login/头像，
 *     并把头像下载为本站静态文件（96px）。
 *   · 无 token（本地 dev）：走 `git log` 提取作者，noreply 邮箱可还原 GitHub 用户名；
 *     不下载头像（avatar=null），前端回退首字母 Avatar。
 *
 * 失败处理：单文件失败仅告警跳过；整体失败保留既有快照，绝不覆盖成空。
 * 仅用 Node 内置模块（fetch 为 Node 18+ 内置），CI 无需安装依赖即可单独运行。
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const OWNER = 'JadeViewDocs';
const REPO = 'docs';
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const CONCURRENCY = 6;
// 机器人 / 自动提交不算贡献者
const BOT_LOGINS = new Set(['github-actions', 'dependabot']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs');
const OUT_DIR = path.join(ROOT, 'public', 'contributors');
const AVATAR_DIR = path.join(OUT_DIR, 'avatars');
const OUTPUT_PATH = path.join(OUT_DIR, 'data.json');

const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

// ---------- 文件扫描 / 路由 ----------

/** 递归收集 docs 下所有 md，返回仓库相对路径（docs/docs/api/window-api.md 这种） */
function collectMdFiles(dir = DOCS_DIR) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...collectMdFiles(full));
    else if (/\.md$/i.test(e.name)) out.push(path.relative(ROOT, full).replace(/\\/g, '/'));
  }
  return out;
}

/** 仓库相对路径 → 站点路由（中英合并到同一 zh 路由 key；index.md 归到所在目录） */
function fileToRoute(repoPath) {
  let p = repoPath.replace(/^docs\//, '').replace(/\.(en-US\.)?md$/i, '');
  p = p.replace(/\/index$/i, '').replace(/^index$/i, '');
  return '/' + p;
}

// ---------- GitHub API 模式 ----------

async function ghJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'JadeViewDocs',
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${TOKEN}`,
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}：${url}`);
  return res.json();
}

/** 单文件 → [{login,name,avatarUrl,url,commits}]（API 模式，squash 合并归属 PR 作者） */
async function contributorsViaApi(repoPath) {
  const commits = await ghJson(
    `${API_BASE}/commits?path=${encodeURIComponent(repoPath)}&per_page=100`,
  );
  const byKey = new Map();
  for (const c of commits) {
    const login = c.author?.login;
    const name = c.commit?.author?.name || login;
    if (!name) continue;
    if (login && (BOT_LOGINS.has(login) || login.endsWith('[bot]'))) continue;
    const key = login || `name:${name}`;
    const cur = byKey.get(key) || {
      login: login || null,
      name,
      avatarUrl: c.author?.avatar_url || null,
      url: login ? `https://github.com/${login}` : null,
      commits: 0,
    };
    cur.commits += 1;
    byKey.set(key, cur);
  }
  return [...byKey.values()];
}

// ---------- 本地 git 模式 ----------

/** noreply 邮箱还原 GitHub 用户名：12345+user@users.noreply.github.com / user@users.noreply.github.com */
function loginFromEmail(email) {
  const m = email.match(/^(?:\d+\+)?([^@]+)@users\.noreply\.github\.com$/i);
  return m ? m[1] : null;
}

function contributorsViaGit(repoPath) {
  // --follow：跨文件改名追完整历史（如 SDK 分区迁入 docs/sdks/ 的批量移动）
  const out = execFileSync('git', ['log', '--follow', '--format=%an\t%ae', '--', repoPath], {
    cwd: ROOT,
    encoding: 'utf-8',
  });
  const byKey = new Map();
  for (const line of out.split('\n')) {
    if (!line.trim()) continue;
    const [name, email] = line.split('\t');
    if (/\[bot\]|github-actions/i.test(name)) continue;
    const login = loginFromEmail(email);
    const key = login || `name:${name}`;
    const cur = byKey.get(key) || {
      login,
      name,
      avatarUrl: null,
      url: login ? `https://github.com/${login}` : null,
      commits: 0,
    };
    cur.commits += 1;
    byKey.set(key, cur);
  }
  return [...byKey.values()];
}

// ---------- 头像下载（仅 API 模式） ----------

async function downloadAvatar(login, avatarUrl) {
  const dest = path.join(AVATAR_DIR, `${login}.png`);
  const res = await fetch(`${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}s=96`);
  if (!res.ok) throw new Error(`头像 ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return `/contributors/avatars/${login}.png`;
}

// ---------- 主流程 ----------

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    }),
  );
  return out;
}

async function main() {
  try {
    const files = collectMdFiles();
    const mode = TOKEN ? 'GitHub API' : '本地 git log';
    console.log(`共 ${files.length} 个 md，数据源：${mode}`);

    // 每个文件取贡献者（单文件失败仅告警）
    const perFile = await mapLimit(files, CONCURRENCY, async (f) => {
      try {
        return { file: f, list: TOKEN ? await contributorsViaApi(f) : contributorsViaGit(f) };
      } catch (e) {
        console.warn(`⚠️ 跳过 ${f}：${e.message}`);
        return { file: f, list: [] };
      }
    });

    // 中英文件合并到同一路由 key，提交数累加
    const pages = new Map();
    for (const { file, list } of perFile) {
      const route = fileToRoute(file);
      const byKey = pages.get(route) || new Map();
      for (const c of list) {
        const key = c.login || `name:${c.name}`;
        const cur = byKey.get(key);
        if (cur) cur.commits += c.commits;
        else byKey.set(key, { ...c });
      }
      pages.set(route, byKey);
    }

    // 下载头像（去重、失败回退 null → 前端首字母兜底）
    const avatarPath = new Map();
    if (TOKEN) {
      fs.mkdirSync(AVATAR_DIR, { recursive: true });
      const uniq = new Map();
      for (const byKey of pages.values())
        for (const c of byKey.values()) if (c.login && c.avatarUrl) uniq.set(c.login, c.avatarUrl);
      console.log(`下载 ${uniq.size} 个头像…`);
      await mapLimit([...uniq.entries()], CONCURRENCY, async ([login, url]) => {
        try {
          avatarPath.set(login, await downloadAvatar(login, url));
        } catch (e) {
          console.warn(`⚠️ 头像失败 ${login}：${e.message}`);
        }
      });
    }

    // 路由 → 源文件映射（zh-CN / en-US），供前端「编辑此页」拼 GitHub 编辑链接；
    // 与贡献者数据无关，覆盖全部 md（包括取不到贡献者的页面）。
    const sources = {};
    for (const f of files) {
      const route = fileToRoute(f);
      const locale = /\.en-US\.md$/i.test(f) ? 'en-US' : 'zh-CN';
      (sources[route] ??= {})[locale] = f;
    }

    const json = {
      updated_at: new Date().toISOString(),
      sources,
      pages: Object.fromEntries(
        [...pages.entries()]
          .filter(([, byKey]) => byKey.size > 0)
          .map(([route, byKey]) => [
            route,
            [...byKey.values()]
              .sort((a, b) => b.commits - a.commits)
              .map((c) => ({
                login: c.login,
                name: c.name,
                avatar: (c.login && avatarPath.get(c.login)) || null,
                url: c.url,
                commits: c.commits,
              })),
          ]),
      ),
    };

    const total = Object.keys(json.pages).length;
    if (total === 0) {
      console.log('未取到任何贡献者数据，跳过（保留现有快照）');
      return;
    }
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(json, null, 2), 'utf-8');
    console.log(`已写入 ${OUTPUT_PATH}（${total} 个路由）`);
  } catch (e) {
    console.warn('⚠️ 生成贡献者数据失败：', e.message);
    console.warn('跳过更新、保留现有快照，继续构建…');
  }
}

main();
