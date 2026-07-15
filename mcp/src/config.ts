import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Project root = parent of mcp/. Works from src/ (tsx) and dist/ (compiled). */
const projectRoot = path.resolve(__dirname, '..', '..');

export const config = {
  /** Markdown root that dumi serves; routes are computed relative to this. */
  docsDir: process.env.DOCS_DIR
    ? path.resolve(process.env.DOCS_DIR)
    : path.join(projectRoot, 'docs'),
  /** Absolute base for generated doc URLs. */
  baseUrl: process.env.BASE_URL ?? 'https://jade.run',
  /** HTTP listen config. */
  host: process.env.HOST ?? '127.0.0.1',
  port: Number(process.env.PORT ?? 8848),
  /** Optional bearer token; when set, POST /mcp requires Authorization: Bearer <token>. */
  authToken: process.env.MCP_AUTH_TOKEN ?? '',
  projectRoot,
};
