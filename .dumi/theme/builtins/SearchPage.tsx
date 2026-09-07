// 独立全站搜索页 /search（由文档路由 docs/search.md 中 <SearchPage /> 渲染）。
// 默认全站搜索，可通过「全部/文档/SDK/博客」分区筛选（按 hint link 顶层路由段，与侧栏分区口径一致）。
// 复用 dumi 的 useSiteSearch（同一套索引）与主题的 SearchResult，表单放大到整页版式。
import { SearchBar as Input } from '@lobehub/ui';
import { Segmented } from 'antd';
import { createStyles } from 'antd-style';
import { useSiteSearch } from 'dumi';
import { Search } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
// @ts-ignore 主题内部组件，深层路径无类型声明
import SearchResult from 'dumi-theme-lobehub/dist/slots/SearchResult';
import { useLocaleBase } from '../locales/strings';

const useStyles = createStyles(({ css, token }) => ({
  wrap: css`
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
    padding: 48px 24px 24px;
  `,
  title: css`
    margin: 0 0 8px;
    font-size: 26px;
    font-weight: 700;
    color: ${token.colorText};
  `,
  hint: css`
    margin: 0 0 24px;
    font-size: 14px;
    color: ${token.colorTextSecondary};
  `,
  bar: css`
    margin-bottom: 20px;
  `,
  results: css`
    overflow: auto;
    max-height: 65vh;
  `,
}));

export default memo(function SearchPage() {
  const { styles } = useStyles();
  const base = useLocaleBase();
  const zh = !base.includes('/en-US');
  const { keywords, setKeywords, result, loading } = useSiteSearch();
  const [mode, setMode] = useState<'all' | 'docs' | 'sdks' | 'blog'>('all');
  const placeholder = zh ? '输入关键词，搜索整个站点…' : 'Search across the whole site…';

  const filterOptions = [
    { label: zh ? '全部' : 'All', value: 'all' },
    { label: zh ? '文档' : 'Docs', value: 'docs' },
    { label: 'SDK', value: 'sdks' },
    { label: zh ? '博客' : 'Blog', value: 'blog' },
  ];
  // 内容分区筛选：hint 的 link 去掉语言前缀后取首段（docs/sdks/blog），其余仅归「全部」。
  // 与侧栏分区搜索口径一致（/docs→docs、/sdks→sdks、/blog→blog）。
  const filtered = useMemo(() => {
    if (mode === 'all' || !keywords.trim() || !result) return result;
    const nb = base.replace(/\/{2,}/g, '/').replace(/\/$/, '');
    const top = (link: string) => {
      let p = link || '';
      if (nb && nb !== '/' && p.startsWith(nb)) p = p.slice(nb.length) || '/';
      return p.replace(/^\/+/, '').split('/')[0] || '';
    };
    return result
      .map((grp: any) => ({ ...grp, hints: (grp.hints || []).filter((h: any) => top(h?.link) === mode) }))
      .filter((grp: any) => (grp.hints || []).length > 0);
  }, [result, keywords, mode]);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>{zh ? '全站搜索' : 'Site Search'}</h1>
      <p className={styles.hint}>
        {zh
          ? '覆盖所有文档、SDK 与博客内容；输入后即时出结果。'
          : 'Covers all docs, SDKs and blog posts; results appear as you type.'}
      </p>
      <div className={styles.bar}>
        <Input
          autoFocus
          enableShortKey
          icon={Search}
          onChange={(e: any) => setKeywords(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%' }}
          type="block"
        />
      </div>
      <Segmented
        block
        onChange={(v: any) => setMode(v)}
        options={filterOptions}
        style={{ marginBottom: 16 }}
        value={mode}
      />
      {keywords.trim() && (
        <div className={styles.results}>
          <SearchResult data={filtered} loading={loading} />
        </div>
      )}
    </div>
  );
});