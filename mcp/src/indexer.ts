import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export type Lang = 'zh' | 'en';

/** One searchable slice of a page — mirrors an Algolia docsearch record. */
export interface Section {
  /** stable unique id, also the MiniSearch document id */
  id: string;
  /** repo-relative source file, e.g. docs/api/window-api.md */
  path: string;
  /** site route, e.g. /docs/api/window-api (en gets /en-US prefix) */
  route: string;
  /** absolute doc url (baseUrl + route + #anchor) */
  url: string;
  lang: Lang;
  /** page <title> from frontmatter (or first H1) */
  pageTitle: string;
  /** frontmatter group.title, used as the top hierarchy level */
  group: string;
  /** heading text this slice sits under ('' for the page intro) */
  heading: string;
  /** anchor slug for the heading */
  anchor: string;
  /** breadcrumb: [group, pageTitle, h2, h3, ...] down to this slice */
  hierarchy: string[];
  /** plain-text body of this slice */
  content: string;
}

export interface Page {
  path: string;
  route: string;
  url: string;
  lang: Lang;
  pageTitle: string;
  group: string;
  /** raw markdown body (frontmatter stripped) */
  raw: string;
}

export interface DocStore {
  sections: Section[];
  /** lookup by route (no lang prefix trims applied) and by repo-relative path */
  pages: Map<string, Page>;
  baseUrl: string;
}

export interface BuildOptions {
  baseUrl?: string;
}

/** GitHub-style slug, keeping CJK characters intact (dumi encodes them in the URL). */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Strip the markdown syntax that adds noise to search/snippets, keep the words. */
function stripMarkdown(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')          // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')         // links -> text
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')           // inline / fenced code ticks
    .replace(/^[>\s]*:::.*$/gm, ' ')                 // dumi :::warning containers
    .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, '')       // list markers
    .replace(/[*_~]/g, '')                           // emphasis
    .replace(/\|/g, ' ')                             // table pipes
    .replace(/^-{3,}$/gm, ' ')                        // hr / table sep
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface RawSection {
  heading: string;
  level: number; // 0 = intro, 1 = H1, 2 = H2 ...
  lines: string[];
}

/** Split a markdown body into heading-delimited sections, ignoring headings inside code fences. */
function splitSections(body: string): RawSection[] {
  const lines = body.split('\n');
  const out: RawSection[] = [{ heading: '', level: 0, lines: [] }];
  let inFence = false;
  let fenceToken = '';

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);
    if (fenceMatch) {
      const token = fenceMatch[1][0];
      if (!inFence) {
        inFence = true;
        fenceToken = token;
      } else if (token === fenceToken) {
        inFence = false;
      }
      out[out.length - 1].lines.push(line);
      continue;
    }

    const headingMatch = !inFence ? line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/) : null;
    if (headingMatch) {
      out.push({ heading: headingMatch[2].trim(), level: headingMatch[1].length, lines: [] });
    } else {
      out[out.length - 1].lines.push(line);
    }
  }
  return out;
}

function fileToRoute(relPath: string, lang: Lang): string {
  // relPath like: docs/api/window-api.md  or  docs/api/index.md
  let p = relPath.replace(/\\/g, '/').replace(/\.(en-US\.)?md$/i, '');
  p = p.replace(/\/index$/i, ''); // index page maps to its folder
  let route = '/' + p.replace(/^\/+/, '');
  if (route === '/') route = '/';
  if (lang === 'en') route = '/en-US' + route;
  return route;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      files.push(...(await walk(full)));
    } else if (/\.md$/i.test(e.name)) {
      files.push(full);
    }
  }
  return files;
}

export async function buildIndex(docsDir: string, opts: BuildOptions = {}): Promise<DocStore> {
  const baseUrl = (opts.baseUrl ?? 'https://jade.run').replace(/\/+$/, '');
  const absDocsDir = path.resolve(docsDir);
  const files = await walk(absDocsDir);

  const sections: Section[] = [];
  const pages = new Map<string, Page>();

  for (const file of files) {
    const rel = path.relative(absDocsDir, file).replace(/\\/g, '/');
    const lang: Lang = /\.en-US\.md$/i.test(file) ? 'en' : 'zh';
    const rawFile = await fs.readFile(file, 'utf8');
    const parsed = matter(rawFile);
    const fm = parsed.data as { title?: string; group?: { title?: string } | string };

    const rawSections = splitSections(parsed.content);
    const h1 = rawSections.find((s) => s.level === 1)?.heading;
    const pageTitle = (fm.title || h1 || path.basename(rel).replace(/\.(en-US\.)?md$/i, '')).trim();
    const group =
      (typeof fm.group === 'object' ? fm.group?.title : (fm.group as string)) ?? '';
    const route = fileToRoute(rel, lang);

    // repo-relative path (relative to the JadeView_docs root, i.e. under docs/)
    const repoPath = path.posix.join('docs', rel);

    pages.set(route, { path: repoPath, route, url: baseUrl + route, lang, pageTitle, group, raw: parsed.content });
    pages.set(repoPath, pages.get(route)!);

    // Build a heading stack to compute the breadcrumb for each slice.
    const stack: { level: number; text: string }[] = [];
    let sliceIdx = 0;

    for (const rs of rawSections) {
      if (rs.level >= 1) {
        while (stack.length && stack[stack.length - 1].level >= rs.level) stack.pop();
        stack.push({ level: rs.level, text: rs.heading });
      }
      const text = stripMarkdown(rs.lines.join('\n'));
      const heading = rs.level >= 1 ? rs.heading : '';
      // Skip empty intro slices, but always keep heading slices (heading itself is searchable).
      if (!text && !heading) continue;

      const headingCrumb = stack.filter((s) => s.level >= 2).map((s) => s.text); // H2..H6 (drop the H1/page title dup)
      const hierarchy = [group, pageTitle, ...headingCrumb].filter(Boolean);
      const anchor = heading ? slugify(heading) : '';
      const id = `${lang}:${route}#${anchor || 'intro'}:${sliceIdx++}`;

      sections.push({
        id,
        path: repoPath,
        route,
        url: baseUrl + route + (anchor ? '#' + anchor : ''),
        lang,
        pageTitle,
        group,
        heading,
        anchor,
        hierarchy,
        content: text,
      });
    }
  }

  return { sections, pages, baseUrl };
}
