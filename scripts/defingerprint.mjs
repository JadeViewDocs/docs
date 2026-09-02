// 构建后「去指纹」：对抗 Wappalyzer 等被动技术栈探测。
// dist 里的产物文件名暴露技术栈：umi.<hash>.js（UmiJS 官方特征）、
// node_modules_shiki/katex/antd_*.js（依赖名）、_dumi_*.css（dumi）。
// 这些探测全部基于文件名字符串匹配，把文件名换成中性短名并全量改写引用即可隐去。
//
// 安全性：文件名带内容哈希，旧名（含哈希的长路径名）是全局唯一字符串，
// 直接做全量字符串替换不会误伤；运行时（umi.js）里的 chunk 映射表同样引用这些名字，
// 一并替换后动态 import 路径保持一致，不影响加载。
//
// 运行时机：prerender 之后、gzip 预压缩之前。
// 用法：node scripts/defingerprint.mjs

import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');

// 泄露技术栈的文件名前缀
const LEAKY_RE = /^(umi\.|node_modules_|_dumi_)/;

const files = fs.readdirSync(DIST);
const leaky = files.filter((n) => LEAKY_RE.test(n));
if (leaky.length === 0) {
  console.log('[defingerprint] 无需处理');
  process.exit(0);
}

// —— 构建替换映射 ——
// chunk 引用形态有两种，都要替换：
//   1) 完整文件名：node_modules_shiki_xxx.hash.async.js（HTML 的 src/href、静态引用）
//   2) 不带哈希的名部：node_modules_shiki_xxx（umi 运行时 chunk 映射表的 key）
// umi.<hash>.js 例外：名部是 "umi"，直接全局替换会误伤，只能替换带哈希的完整段。
const replacements = new Map(); // old string -> new string
let seq = 0;
const renamed = []; // [oldFile, newFile]

for (const name of leaky) {
  const dot = name.indexOf('.');
  const namePart = name.slice(0, dot); // 不含哈希的名部
  const rest = name.slice(dot); // .hash.ext
  const ext = path.extname(name);

  if (namePart === 'umi') {
    // 运行时入口：替换带哈希段（umi.5939c530 -> a0.5939c530），不碰裸 "umi" 字符串
    const withHash = name.slice(0, name.length - ext.length); // umi.<hash>
    const short = `a${seq}`;
    replacements.set(withHash, `${short}${rest.slice(0, rest.lastIndexOf('.'))}`);
    renamed.push([name, `${short}${rest}`]);
  } else {
    const short = `a${seq}`;
    replacements.set(namePart, short);
    renamed.push([name, `${short}${rest}`]);
  }
  seq++;
}

// —— 全量改写 HTML/JS/CSS 中的引用 ——
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(html|js|css|json)$/.test(entry.name)) {
      let content = fs.readFileSync(full, 'utf8');
      let changed = false;
      for (const [oldStr, newStr] of replacements) {
        if (content.includes(oldStr)) {
          content = content.split(oldStr).join(newStr);
          changed = true;
        }
      }
      if (changed) fs.writeFileSync(full, content);
    }
  }
};
walk(DIST);

// —— 物理改名 ——
for (const [oldFile, newFile] of renamed) {
  fs.renameSync(path.join(DIST, oldFile), path.join(DIST, newFile));
}

console.log(`[defingerprint] 已重命名 ${renamed.length} 个文件（umi/node_modules/_dumi 前缀），引用已全量改写`);
