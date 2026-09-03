import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Package root = parent of dist/ (this file compiles to dist/config.js).
 * The markdown docs ship inside the npm package under content/, so the
 * server works anywhere npx installs it — no repo checkout required.
 */
const packageRoot = path.resolve(__dirname, '..');

export const config = {
  /** Markdown root. Defaults to the bundled copy; set DOCS_DIR to index a local docs checkout instead. */
  docsDir: process.env.DOCS_DIR
    ? path.resolve(process.env.DOCS_DIR)
    : path.join(packageRoot, 'content'),
  /** Base URL used when building the doc links returned by search_docs. */
  baseUrl: process.env.BASE_URL ?? 'https://jade.run',
};
