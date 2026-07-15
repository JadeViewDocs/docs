import MiniSearch from 'minisearch';
import type { DocStore, Lang, Section } from './indexer.js';

/**
 * Tokenizer for mixed Chinese/English text.
 * - Latin/number runs -> whole lowercased token.
 * - CJK runs -> unigrams + bigrams, so "窗口" matches inside "创建窗口" and single-char
 *   queries still hit. Query and documents use the same tokenizer, so recall is symmetric.
 */
export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const re = /[\p{Script=Han}]+|[A-Za-z0-9_]+/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const seg = m[0];
    if (/[A-Za-z0-9_]/.test(seg[0])) {
      tokens.push(seg.toLowerCase());
    } else {
      const chars = [...seg];
      if (chars.length === 1) {
        tokens.push(chars[0]);
      } else {
        for (let i = 0; i < chars.length; i++) {
          tokens.push(chars[i]);
          if (i < chars.length - 1) tokens.push(chars[i] + chars[i + 1]);
        }
      }
    }
  }
  return tokens;
}

export interface SearchHit {
  score: number;
  lang: Lang;
  title: string;
  hierarchy: string[];
  heading: string;
  url: string;
  path: string;
  snippet: string;
}

export interface SearchParams {
  lang?: Lang;
  limit?: number;
}

function snippet(content: string, max = 280): string {
  const clean = content.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max) + '…';
}

export class Searcher {
  private mini: MiniSearch<Section & { hierarchyText: string }>;
  private byId = new Map<string, Section>();

  constructor(private store: DocStore) {
    this.mini = new MiniSearch({
      idField: 'id',
      fields: ['pageTitle', 'heading', 'hierarchyText', 'content'],
      storeFields: ['id'],
      tokenize,
      processTerm: (t) => t.toLowerCase(),
      searchOptions: {
        tokenize,
        processTerm: (t) => t.toLowerCase(),
        prefix: true,
        fuzzy: 0.1,
        boost: { pageTitle: 4, heading: 3, hierarchyText: 2, content: 1 },
        combineWith: 'OR',
      },
    });

    const docs = store.sections.map((s) => ({ ...s, hierarchyText: s.hierarchy.join(' ') }));
    for (const s of store.sections) this.byId.set(s.id, s);
    this.mini.addAll(docs);
  }

  search(query: string, params: SearchParams = {}): SearchHit[] {
    const limit = Math.min(Math.max(params.limit ?? 8, 1), 50);
    const raw = this.mini.search(query, {
      filter: params.lang ? (r) => this.byId.get(r.id as string)?.lang === params.lang : undefined,
    });

    return raw.slice(0, limit).map((r) => {
      const s = this.byId.get(r.id as string)!;
      return {
        score: Math.round(r.score * 1000) / 1000,
        lang: s.lang,
        title: s.heading || s.pageTitle,
        hierarchy: s.hierarchy,
        heading: s.heading,
        url: s.url,
        path: s.path,
        snippet: snippet(s.content),
      };
    });
  }

  get size(): number {
    return this.store.sections.length;
  }
}

export function createSearcher(store: DocStore): Searcher {
  return new Searcher(store);
}
