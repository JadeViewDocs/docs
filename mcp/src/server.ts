import express, { type Request, type Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { config } from './config.js';
import { buildIndex } from './indexer.js';
import { createSearcher } from './search.js';
import { createMcpServer } from './mcp.js';

const jsonError = (res: Response, code: number, message: string, status = 200) =>
  res.status(status).json({ jsonrpc: '2.0', error: { code, message }, id: null });

async function main() {
  const t0 = Date.now();
  const store = await buildIndex(config.docsDir, { baseUrl: config.baseUrl });
  const searcher = createSearcher(store);
  const pageCount = new Set([...store.pages.values()].map((p) => p.route)).size;
  console.error(
    `[jadeview-docs-mcp] indexed ${pageCount} pages / ${store.sections.length} sections ` +
      `from ${config.docsDir} in ${Date.now() - t0}ms`,
  );

  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/health', (_req, res) => {
    res.json({ ok: true, pages: pageCount, sections: store.sections.length });
  });

  app.post('/mcp', async (req: Request, res: Response) => {
    if (config.authToken) {
      const auth = req.header('authorization') ?? '';
      if (auth !== `Bearer ${config.authToken}`) {
        return jsonError(res, -32001, 'Unauthorized', 401);
      }
    }
    try {
      // Stateless: fresh server+transport per request, sharing the global index.
      const server = createMcpServer(store, searcher);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on('close', () => {
        transport.close();
        server.close();
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error('[jadeview-docs-mcp] request error:', err);
      if (!res.headersSent) jsonError(res, -32603, 'Internal server error', 500);
    }
  });

  // Session-less transport does not use GET (SSE stream) or DELETE.
  const methodNotAllowed = (_req: Request, res: Response) =>
    jsonError(res, -32000, 'Method not allowed. Use POST /mcp.', 405);
  app.get('/mcp', methodNotAllowed);
  app.delete('/mcp', methodNotAllowed);

  app.listen(config.port, config.host, () => {
    console.error(`[jadeview-docs-mcp] listening on http://${config.host}:${config.port}/mcp`);
  });
}

main().catch((err) => {
  console.error('[jadeview-docs-mcp] fatal:', err);
  process.exit(1);
});
