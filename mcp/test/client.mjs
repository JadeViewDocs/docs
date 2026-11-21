/**
 * Smoke test for a running Streamable HTTP server.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const endpoint = new URL(process.env.MCP_TEST_URL ?? 'http://127.0.0.1:8848/mcp');
const token = process.env.MCP_AUTH_TOKEN;
const headers = token ? { Authorization: `Bearer ${token}` } : {};
const transport = new StreamableHTTPClientTransport(endpoint, {
  requestInit: { headers },
});
const client = new Client({ name: 'jadeview-docs-mcp-smoke', version: '0.0.0' });
await client.connect(transport);

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failures++;
};

const health = await fetch(new URL('/health', endpoint));
check('health', health.ok && (await health.json()).pages > 0);
const invalidOrigin = await fetch(endpoint, { headers: { ...headers, Origin: 'https://example.invalid' } });
await invalidOrigin.text();
check('invalid Origin', invalidOrigin.status === 403);
if (token) {
  const unauthorized = await fetch(endpoint);
  await unauthorized.text();
  check('missing bearer token', unauthorized.status === 401);
}

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
  searchBody.count === 3 && searchBody.hits.some((hit) => /\/docs\/(v3)?api\/window-api/.test(hit.url)),
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
  arguments: { path: '/docs/v3api/window-api' },
});
const pageText = page.content[0].text;
check(
  'get_doc(/docs/v3api/window-api)',
  pageText.includes('create_webview_window') && pageText.includes('JadeWindowFeatures'),
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
process.exitCode = failures ? 1 : 0;
