/**
 * Dev/CI helper: refresh content/ from a JadeView docs checkout.
 *
 *   node scripts/sync-content.mjs <path-to-docs-repo/docs>
 *
 * The source path is required (pass it explicitly, or set JADEVIEW_DOCS_SRC).
 * In CI the docs repo is checked out to a sibling directory first and the path
 * is passed in. Only *.md files are copied (both zh `*.md` and `*.en-US.md`);
 * everything else is skipped to keep the npm package lean. content/ ships in
 * the package, so re-run this + version bump + publish to ship doc updates.
 */
import { cpSync, existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dest = path.join(pkgRoot, 'content');
const src = path.resolve(process.argv[2] ?? process.env.JADEVIEW_DOCS_SRC ?? '');

if (!src || !existsSync(src)) {
  console.error(`source not found: ${src || '(empty)'}`);
  console.error('usage: node scripts/sync-content.mjs <path-to-docs-repo/docs>');
  console.error('   or: set JADEVIEW_DOCS_SRC=<path-to-docs-repo/docs>');
  process.exit(1);
}

let files = 0;
let bytes = 0;
const count = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) count(full);
    else {
      files++;
      bytes += st.size;
    }
  }
};

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, {
  recursive: true,
  filter: (s) => statSync(s).isDirectory() || /\.md$/i.test(s),
});
count(dest);

console.log(`synced ${files} markdown files (${(bytes / 1024).toFixed(0)} KB)`);
console.log(`  from: ${src}`);
console.log(`  to:   ${dest}`);
