/**
 * Dev helper: build the index and (optionally) run a query, without starting the server.
 *   tsx src/cli.ts                 -> index stats
 *   tsx src/cli.ts "创建窗口"       -> search
 *   tsx src/cli.ts --lang en window
 */
import { config } from './config.js';
import { buildIndex } from './indexer.js';
import { createSearcher } from './search.js';

async function main() {
  const args = process.argv.slice(2);
  let lang: 'zh' | 'en' | undefined;
  const langIdx = args.indexOf('--lang');
  if (langIdx !== -1) {
    lang = args[langIdx + 1] as 'zh' | 'en';
    args.splice(langIdx, 2);
  }
  const query = args.join(' ').trim();

  const store = await buildIndex(config.docsDir, { baseUrl: config.baseUrl });
  const pages = new Set([...store.pages.values()].map((p) => p.route)).size;
  console.log(`indexed ${pages} pages / ${store.sections.length} sections from ${config.docsDir}\n`);

  if (!query) {
    console.log('sample routes:');
    [...new Set([...store.pages.values()].map((p) => p.route))].slice(0, 20).forEach((r) => console.log('  ' + r));
    console.log('\npass a query to search, e.g.  tsx src/cli.ts 创建窗口');
    return;
  }

  const searcher = createSearcher(store);
  const hits = searcher.search(query, { lang, limit: 10 });
  console.log(`query="${query}"${lang ? ` lang=${lang}` : ''} -> ${hits.length} hits\n`);
  for (const h of hits) {
    console.log(`[${h.score}] ${h.lang}  ${h.hierarchy.join(' › ')}`);
    console.log(`      ${h.url}`);
    console.log(`      ${h.snippet.slice(0, 160)}\n`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
