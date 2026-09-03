/**
 * Simulates the end-user flow against the packed tarball:
 *   npm pack && npm run test:npx
 * Spawns `npx -y <tarball>` (same code path as `npx -y jadeview-docs-mcp`
 * after publish) and calls both tools over MCP.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';

const tarball = fileURLToPath(new URL('../jadeview-docs-mcp-1.0.0.tgz', import.meta.url));

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', tarball],
});
const client = new Client({ name: 'jadeview-docs-mcp-npx-sim', version: '0.0.0' });
await client.connect(transport);

const tools = await client.listTools();
console.log('tools:', tools.tools.map((t) => t.name).join(', '));

const search = await client.callTool({ name: 'search_docs', arguments: { query: '托盘', limit: 2 } });
const body = JSON.parse(search.content[0].text);
console.log(`search_docs(托盘) top hit: ${body.hits[0].hierarchy.join(' › ')}`);

const page = await client.callTool({ name: 'get_doc', arguments: { path: '/docs/api/tray-api' } });
console.log(`get_doc(/docs/api/tray-api): ${page.content[0].text.length} chars`);

await client.close();
console.log('npx simulation OK');
