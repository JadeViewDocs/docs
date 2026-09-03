/**
 * End-to-end smoke test: spawn the built stdio server as a real MCP client and
 * exercise both tools. Run after `npm run build`:
 *
 *   npm run build && npm run test:client
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';

const serverJs = fileURLToPath(new URL('../dist/stdio.js', import.meta.url));

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [serverJs],
});
const client = new Client({ name: 'jadeview-docs-mcp-smoke', version: '0.0.0' });
await client.connect(transport);

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failures++;
};

const tools = await client.listTools();
check(
  'tools/list',
  tools.tools.length === 2 && tools.tools.every((t) => ['search_docs', 'get_doc'].includes(t.name)),
  tools.tools.map((t) => t.name).join(', '),
);

const search = await client.callTool({
  name: 'search_docs',
  arguments: { query: '创建窗口', limit: 3 },
});
const searchBody = JSON.parse(search.content[0].text);
check(
  'search_docs(创建窗口)',
  searchBody.count === 3 && searchBody.hits[0].url.includes('/docs/api/window-api'),
  `top hit: ${searchBody.hits[0]?.hierarchy?.join(' › ')}`,
);

const searchEn = await client.callTool({
  name: 'search_docs',
  arguments: { query: 'notification', lang: 'en', limit: 3 },
});
const searchEnBody = JSON.parse(searchEn.content[0].text);
check(
  'search_docs(notification, lang=en)',
  searchEnBody.count > 0 && searchEnBody.hits.every((h) => h.lang === 'en'),
  `${searchEnBody.count} hits`,
);

const page = await client.callTool({
  name: 'get_doc',
  arguments: { path: '/docs/api/window-api' },
});
const pageText = page.content[0].text;
check(
  'get_doc(/docs/api/window-api)',
  pageText.includes('create_webview_window') && pageText.length > 10000,
  `${pageText.length} chars`,
);

const byRepoPath = await client.callTool({
  name: 'get_doc',
  arguments: { path: 'docs/docs/api/ipc-api.md' },
});
check(
  'get_doc(repo path)',
  !byRepoPath.isError && byRepoPath.content[0].text.includes('ipc'),
);

const missing = await client.callTool({
  name: 'get_doc',
  arguments: { path: '/docs/api/nonexistent' },
});
check('get_doc(missing) -> isError + suggestions', missing.isError === true);

await client.close();
process.exit(failures ? 1 : 0);
