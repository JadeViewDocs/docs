import { timingSafeEqual } from 'node:crypto';
import express, { type Request, type Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { config } from './config.js';
import { buildIndex } from './indexer.js';
import { createSearcher } from './search.js';
import { createMcpServer } from './mcp.js';

const jsonError = (res: Response, code: number, message: string, status: number) =>
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
  app.disable('x-powered-by');
  const allowedOrigins = new Set([
    config.publicOrigin,
    `http://127.0.0.1:${config.port}`,
    `http://localhost:${config.port}`,
  ]);
  const credential = config.authToken ? Buffer.from(`Bearer ${config.authToken}`) : undefined;

  app.get('/health', (_req, res) => {
    res.json({ ok: true, pages: pageCount, sections: store.sections.length });
  });

  app.use('/mcp', (req, res, next) => {
    const origin = req.header('origin');
    if (origin !== undefined && !allowedOrigins.has(origin)) {
      return jsonError(res, -32000, 'Origin not allowed', 403);
    }
    if (credential) {
      const auth = Buffer.from(req.header('authorization') ?? '');
      if (auth.length !== credential.length || !timingSafeEqual(auth, credential)) {
        return jsonError(res, -32001, 'Unauthorized', 401);
      }
    }
    next();
  });

  app.post('/mcp', express.json({ limit: '1mb' }), async (req: Request, res: Response) => {
    try {
      // Stateless: fresh server+transport per request, sharing the global index.
      const server = createMcpServer(store, searcher);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.once('close', () => {
        void server.close().catch((err) => console.error('[jadeview-docs-mcp] close error:', err));
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
