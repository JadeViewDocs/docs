/**
 * Post-publish live check: run `npx -y jadeview-docs-mcp` from a neutral cwd
 * (forces a registry fetch, exactly what end users do) and call both tools.
 *
 *   node test/live-npx.mjs
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { tmpdir } from 'node:os';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', 'jadeview-docs-mcp'],
  cwd: tmpdir(), // 不在包目录里,确保 npx 从 registry 拉取
});
const client = new Client({ name: 'live-check', version: '0.0.0' });
await client.connect(transport);

const tools = await client.listTools();
console.log('tools:', tools.tools.map((t) => t.name).join(', '));

const search = await client.callTool({ name: 'search_docs', arguments: { query: '创建窗口', limit: 2 } });
const body = JSON.parse(search.content[0].text);
console.log('search_docs(创建窗口) top:', body.hits[0].hierarchy.join(' › '));

const nav = await client.callTool({ name: 'search_docs', arguments: { query: 'GoBack', lang: 'zh', limit: 2 } });
const navBody = JSON.parse(nav.content[0].text);
console.log('search_docs(GoBack) top:', navBody.hits[0]?.hierarchy?.join(' › ') ?? '(none)');

const page = await client.callTool({ name: 'get_doc', arguments: { path: '/docs/api/tray-api' } });
console.log(`get_doc(/docs/api/tray-api): ${page.content[0].text.length} chars`);

await client.close();
console.log('LIVE CHECK OK');
