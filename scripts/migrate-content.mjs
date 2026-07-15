// 内容迁移脚本：Docusaurus(JadeView_docs) → dumi(JadeView_docs_dumi)
// 作用：复制 in-scope 文档段的 MDX，按旧 sidebars-*.js 注入 dumi frontmatter(group/order)，
//       并把 Docusaurus admonition(:::note 等)转换为 dumi 容器(:::info{title=...})。
// 用法：node scripts/migrate-content.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const SRC = 'D:/nodejsApp/JadeView_docs';
const DST = 'D:/nodejsApp/JadeView_docs_dumi';

// 迁移范围（除 v1api / guides / plugin-sdk 外）。sidebar 文件位于旧项目根。
const SECTIONS = [
  { id: 'spec', sidebar: 'sidebars-spec.js' },
  { id: 'v2api', sidebar: 'sidebars-v2api.js' },
  { id: 'web-sdk', sidebar: 'sidebars-web-sdk.js' },
  { id: 'python-sdk', sidebar: 'sidebars-python-sdk.js' },
  { id: 'easy-language-sdk', sidebar: 'sidebars-easy-language-sdk.js' },
  { id: 'voldp-sdk', sidebar: 'sidebars-voldp-sdk.js' },
];

// 旧站未注册到 sidebar、且依赖未迁移组件的孤立页（按 D-1 / 决策排除）
const EXCLUDE_IDS = new Set(['changelog']);

// Docusaurus admonition 类型 → dumi 容器类型
const TYPE_MAP = { note: 'info', tip: 'success', info: 'info', caution: 'warning', warning: 'warning', danger: 'error' };

// ---- 工具函数 ----
function walkMdx(dir, base = dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...walkMdx(full, base));
    else if (name.endsWith('.mdx')) out.push(path.relative(base, full).replace(/\\/g, '/'));
  }
  return out;
}

// 从 sidebars-*.js 构建 docId → { order, group? } 映射
function buildOrderMap(sidebarFile) {
  const mod = require(path.join(SRC, sidebarFile));
  const arr = Object.values(mod)[0];
  const map = {};
  arr.forEach((item, idx) => {
    if (typeof item === 'string') {
      map[item] = { order: idx };
    } else if (item.type === 'doc') {
      map[item.id] = { order: idx };
    } else if (item.type === 'category') {
      const title = item.label;
      (item.items || []).forEach((sub, j) => {
        const id = typeof sub === 'string' ? sub : sub.id;
        map[id] = { order: j, group: { title, order: idx } };
      });
    }
  });
  return map;
}

let admonitionCount = 0;
function transformAdmonitions(body) {
  const lines = body.split(/\r?\n/);
  let inFence = false;
  const out = lines.map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    const m = line.match(/^:::(note|tip|info|caution|warning|danger)\b[ \t]*(.*)$/);
    if (m) {
      admonitionCount++;
      const dtype = TYPE_MAP[m[1]];
      let title = (m[2] || '').trim();
      const bracket = title.match(/^\[(.*)\]$/);
      if (bracket) title = bracket[1].trim();
      if (title) return `:::${dtype}{title="${title.replace(/"/g, '\\"')}"}`;
      return `:::${dtype}`;
    }
    return line;
  });
  return out.join('\n');
}

// 修正大小写导致的路由变化：JavaScript-API → javascript-api（dumi 会把驼峰 slug 成 java-script--api）
function rewriteLinks(body) {
  return body.replace(/\/v2api\/JavaScript-API/g, '/v2api/javascript-api');
}

function splitFrontmatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fmLines: null, body: content };
  return { fmLines: m[1].split(/\r?\n/), body: content.slice(m[0].length) };
}

function buildFrontmatter(fmLines, meta) {
  // 保留原有 frontmatter（去掉 sidebar_position），追加 order / group
  const kept = (fmLines || []).filter((l) => l.trim() && !/^sidebar_position\s*:/.test(l));
  kept.push(`order: ${meta.order}`);
  if (meta.group) {
    kept.push('group:');
    kept.push(`  title: "${meta.group.title.replace(/"/g, '\\"')}"`);
    kept.push(`  order: ${meta.group.order}`);
  }
  return `---\n${kept.join('\n')}\n---\n`;
}

// ---- 主流程 ----
const report = [];
for (const sec of SECTIONS) {
  const srcDir = path.join(SRC, 'docs', sec.id);
  const dstDir = path.join(DST, 'docs', sec.id);
  const orderMap = buildOrderMap(sec.sidebar);
  const files = walkMdx(srcDir);
  const orphans = [];
  let count = 0;
  let orphanOrder = 90;

  for (const rel of files) {
    const id = rel.replace(/\.mdx$/, '');
    if (EXCLUDE_IDS.has(id) || EXCLUDE_IDS.has(path.basename(id))) {
      report.push(`  [skip] ${sec.id}/${rel}`);
      continue;
    }
    let meta = orderMap[id];
    if (!meta) {
      meta = { order: orphanOrder++ };
      orphans.push(id);
    }
    const raw = fs.readFileSync(path.join(srcDir, rel), 'utf8');
    const { fmLines, body } = splitFrontmatter(raw);
    const newBody = rewriteLinks(transformAdmonitions(body));
    const out = buildFrontmatter(fmLines, meta) + '\n' + newBody.replace(/^\n+/, '');
    // dumi 路由由文件名推导；统一小写 basename 以获得稳定、规范的路由（保留子目录原样）
    const relMd = rel.replace(/\.mdx$/, '.md');
    const dstRel = path.posix.join(path.posix.dirname(relMd.replace(/\\/g, '/')), path.basename(relMd).toLowerCase());
    const dstPath = path.join(dstDir, dstRel);
    fs.mkdirSync(path.dirname(dstPath), { recursive: true });
    fs.writeFileSync(dstPath, out, 'utf8');
    count++;
  }
  report.push(`[${sec.id}] migrated ${count} docs` + (orphans.length ? `  | orphan(ungrouped): ${orphans.join(', ')}` : ''));
}

console.log(report.join('\n'));
console.log(`\nAdmonitions converted: ${admonitionCount}`);
console.log('Done.');
