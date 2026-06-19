// 从 Docusaurus build 输出生成本地 Algolia 索引 JSON
// 用法：bun run algolia:gen
// 输出：./algolia-records.json

import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, sep, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = join(__dirname, '..', 'build');
const OUTPUT_FILE = join(__dirname, '..', 'algolia-records.json');

const SITE_URL = 'https://jade.run';
const SKIP_PATTERNS = ['/releases', '/showcase', '/sdks', '/tags', '/404.html', '/search.html'];
const DOC_ROOTS = ['/spec/', '/v1api/', '/v2api/', '/easy-language-sdk/', '/python-sdk/', '/python-sdk2/', '/web-sdk/', '/voldp-sdk/'];

function walk(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files.push(...walk(p));
    else if (p.endsWith('.html')) files.push(p);
  }
  return files;
}

function htmlFileToUrl(absPath) {
  const rel = relative(BUILD_DIR, absPath).replaceAll(sep, '/');
  let url = '/' + rel;
  if (url.endsWith('/index.html')) url = url.slice(0, -10) || '/';
  else if (url.endsWith('.html')) url = url.slice(0, -5);
  return url;
}

function isDocPath(url) {
  return DOC_ROOTS.some((r) => url.startsWith(r) || url === r.slice(0, -1));
}

function stripTags(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function genObjectId(prefix, idx) {
  return `${prefix}-${idx}`;
}

const records = [];
let counter = 0;

const htmlFiles = walk(BUILD_DIR);
const docFiles = htmlFiles.filter((f) => {
  const url = htmlFileToUrl(f);
  return url !== '/' && isDocPath(url);
});

console.log(`找到 ${docFiles.length} 个文档页面`);

for (const file of docFiles) {
  const html = readFileSync(file, 'utf-8');
  const url = htmlFileToUrl(file);

  // 提取 <article>...</article>
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (!articleMatch) continue;
  const article = articleMatch[1];

  // 找标题
  const h1Match = article.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const pageTitle = h1Match ? stripTags(h1Match[1]) : url.split('/').pop();

  // 一级页面记录
  records.push({
    objectID: genObjectId('doc', counter++),
    hierarchy: { lvl0: 'JadeView 文档', lvl1: pageTitle, lvl2: null, lvl3: null, lvl4: null, lvl5: null, lvl6: null },
    type: 'lvl0',
    url: `${SITE_URL}${url}`,
    url_without_anchor: `${SITE_URL}${url}`,
    content: null,
    language: 'zh-cn',
    version: ['current'],
    docusaurus_tag: 'docs-default-current',
    anchor: null,
  });

  // 按 h2 / h3 切分内容
  const sectionRegex = /<(h[23])[^>]*?(?:id="([^"]*)")?[^>]*>([\s\S]*?)<\/\1>([\s\S]*?)(?=<h[23]|$)/gi;
  let m;
  let secIdx = 0;
  while ((m = sectionRegex.exec(article)) !== null) {
    const tag = m[1].toLowerCase();
    const anchor = m[2] || '';
    const title = stripTags(m[3]);
    const body = stripTags(m[4]);
    if (!title) continue;
    const lvl = tag === 'h2' ? 'lvl1' : 'lvl2';
    records.push({
      objectID: genObjectId('doc', counter++),
      hierarchy: {
        lvl0: 'JadeView 文档',
        lvl1: pageTitle,
        lvl2: tag === 'h2' ? title : null,
        lvl3: tag === 'h3' ? title : null,
        lvl4: null,
        lvl5: null,
        lvl6: null,
      },
      type: lvl,
      url: anchor ? `${SITE_URL}${url}#${anchor}` : `${SITE_URL}${url}`,
      url_without_anchor: `${SITE_URL}${url}`,
      content: body.slice(0, 8000),
      language: 'zh-cn',
      version: ['current'],
      docusaurus_tag: 'docs-default-current',
      anchor: anchor || null,
    });
    secIdx++;
  }
}

writeFileSync(OUTPUT_FILE, JSON.stringify(records, null, 2), 'utf-8');
console.log(`\n已生成 ${records.length} 条记录 → ${OUTPUT_FILE}`);
console.log(`\n示例前 2 条：`);
console.log(JSON.stringify(records.slice(0, 2), null, 2));
