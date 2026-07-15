import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DocStore } from './indexer.js';
import { Searcher } from './search.js';

/**
 * Build an McpServer wired to a prebuilt index. Cheap to call per request
 * (the heavy index/searcher are shared), which suits stateless HTTP.
 */
export function createMcpServer(store: DocStore, searcher: Searcher): McpServer {
  const server = new McpServer(
    { name: 'jadeview-docs', version: '2.0.0' },
    {
      instructions:
        'Search and read the JadeView documentation (local markdown source). ' +
        'Use search_docs to find relevant sections, then get_doc to read the full page ' +
        'when you need complete API signatures or code samples.',
    },
  );

  server.registerTool(
    'search_docs',
    {
      title: 'Search JadeView docs',
      description:
        'Full-text search over the JadeView documentation. Returns ranked sections with ' +
        'a breadcrumb, URL, source path, and a snippet. Chinese and English are both indexed. ' +
        'Pass lang to restrict to one language. Follow up with get_doc(path) for full content.',
      inputSchema: {
        query: z.string().min(1).describe('Search query (Chinese or English keywords).'),
        lang: z.enum(['zh', 'en']).optional().describe('Restrict to a language. Omit for both.'),
        limit: z.number().int().min(1).max(50).optional().describe('Max hits (default 8).'),
      },
    },
    async ({ query, lang, limit }) => {
      const hits = searcher.search(query, { lang, limit });
      if (hits.length === 0) {
        return { content: [{ type: 'text', text: `No results for "${query}".` }] };
      }
      return { content: [{ type: 'text', text: JSON.stringify({ query, count: hits.length, hits }, null, 2) }] };
    },
  );

  server.registerTool(
    'get_doc',
    {
      title: 'Read a full JadeView doc page',
      description:
        'Return the complete markdown of one documentation page. Accepts either a site route ' +
        '(e.g. /docs/api/window-api) or a repo path (e.g. docs/api/window-api.md), as returned ' +
        'by search_docs in the "path"/"url" fields.',
      inputSchema: {
        path: z
          .string()
          .min(1)
          .describe('Route like /docs/api/window-api or repo path like docs/api/window-api.md'),
      },
    },
    async ({ path: key }) => {
      const page = resolvePage(store, key);
      if (!page) {
        const suggestions = suggestRoutes(store, key);
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text:
                `No page found for "${key}".` +
                (suggestions.length ? `\nDid you mean:\n${suggestions.map((s) => '  ' + s).join('\n')}` : ''),
            },
          ],
        };
      }
      const header = `# ${page.pageTitle}\n<!-- route: ${page.route} | url: ${page.url} | lang: ${page.lang} -->\n\n`;
      return { content: [{ type: 'text', text: header + page.raw }] };
    },
  );

  return server;
}

function resolvePage(store: DocStore, key: string) {
  const k = key.trim();
  if (store.pages.has(k)) return store.pages.get(k);
  // normalize a few common forms
  const noBase = k.replace(/^https?:\/\/[^/]+/, '').replace(/#.*$/, '');
  if (store.pages.has(noBase)) return store.pages.get(noBase);
  const asRoute = noBase.startsWith('/') ? noBase : '/' + noBase;
  if (store.pages.has(asRoute)) return store.pages.get(asRoute);
  const asRepo = k.replace(/^\/+/, '');
  if (store.pages.has(asRepo)) return store.pages.get(asRepo);
  return undefined;
}

function suggestRoutes(store: DocStore, key: string): string[] {
  const needle = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  const routes = [...new Set([...store.pages.values()].map((p) => p.route))];
  return routes
    .filter((r) => r.toLowerCase().replace(/[^a-z0-9]/g, '').includes(needle))
    .slice(0, 8);
}
