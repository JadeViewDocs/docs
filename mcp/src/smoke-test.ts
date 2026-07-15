/** End-to-end check: connect a real MCP client to the running HTTP server. */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const url = process.env.MCP_URL ?? 'http://127.0.0.1:8848/mcp';

async function main() {
  const client = new Client({ name: 'smoke-test', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(url)));

  const tools = await client.listTools();
  console.log('tools:', tools.tools.map((t) => t.name).join(', '));

  const search = await client.callTool({
    name: 'search_docs',
    arguments: { query: '创建窗口', lang: 'zh', limit: 3 },
  });
  const parsed = JSON.parse((search.content as any)[0].text);
  console.log(`\nsearch_docs "创建窗口" -> ${parsed.count} hits, top:`);
  console.log('  ', parsed.hits[0].hierarchy.join(' › '));
  console.log('  ', parsed.hits[0].url);

  const doc = await client.callTool({
    name: 'get_doc',
    arguments: { path: parsed.hits[0].path },
  });
  const md = (doc.content as any)[0].text as string;
  console.log(`\nget_doc "${parsed.hits[0].path}" -> ${md.length} chars`);
  console.log('  contains create_webview_window:', md.includes('create_webview_window'));

  await client.close();
  console.log('\nOK');
}

main().catch((e) => {
  console.error('SMOKE FAIL:', e);
  process.exit(1);
});
