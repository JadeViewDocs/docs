#!/usr/bin/env node
/**
 * stdio entry — the bin this package publishes.
 * Runs an MCP server over stdin/stdout; logs go to stderr only.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from './config.js';
import { buildIndex } from './indexer.js';
import { createSearcher } from './search.js';
import { createMcpServer } from './mcp.js';

async function main() {
  const t0 = Date.now();
  const store = await buildIndex(config.docsDir, { baseUrl: config.baseUrl });
  const searcher = createSearcher(store);
  const pageCount = new Set([...store.pages.values()].map((p) => p.route)).size;
  console.error(
    `[jadeview-docs-mcp] indexed ${pageCount} pages / ${store.sections.length} sections ` +
      `from ${config.docsDir} in ${Date.now() - t0}ms`,
  );

  const server = createMcpServer(store, searcher);
  await server.connect(new StdioServerTransport());
  // StdioServerTransport keeps the event loop alive while the client is connected.
}

main().catch((err) => {
  console.error('[jadeview-docs-mcp] fatal:', err);
  process.exit(1);
});
