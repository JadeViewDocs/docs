// 博客首页（/blog）：打开后自动跳转到「最新一篇」文章。
// 数据来源：dumi 的 useAppData().routes。umi 路由 path 无前导斜杠（zh: blog/welcome，en: en-US/blog/welcome），
// 按当前语言的 base 剥离 '/' 后拼接前缀过滤出一 /blog/* 文章，再按 frontmatter date 取最新。
// 新增文章会自动成为最新，无需改任何代码。
import { useAppData } from 'dumi';
import { memo, useEffect, useMemo } from 'react';
import { useLocaleBase } from '../locales/strings';

interface Post {
  path: string;
  date?: string;
  title: string;
}

export default memo(function LatestPostRedirect() {
  const base = useLocaleBase();
  const strip = base.replace(/^\//, ''); // ''（zh）或 'en-US'
  const prefix = strip ? `${strip}/blog/` : 'blog/';
  const indexPath = strip ? `${strip}/blog` : 'blog';

  const { routes } = useAppData() as any;
  const target = useMemo<string | null>(() => {
    if (!routes) return null;
    const list: Post[] = [];
    for (const r of Object.values(routes) as any[]) {
      const p: string | undefined = r?.path;
      if (!p || !p.startsWith(prefix) || p === indexPath) continue;
      const title: string = r?.meta?.frontmatter?.title || '';
      if (!title) continue;
      list.push({ path: p, title, date: r?.meta?.frontmatter?.date });
    }
    if (!list.length) return null;
    const sorted = [...list].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : NaN;
      const db = b.date ? new Date(b.date).getTime() : NaN;
      if (!Number.isNaN(da) && !Number.isNaN(db)) return db - da;
      if (!Number.isNaN(da)) return -1;
      if (!Number.isNaN(db)) return 1;
      return 0;
    });
    return `/${sorted[0].path}`;
  }, [routes, prefix, indexPath]);

  useEffect(() => {
    if (target && typeof window !== 'undefined') window.location.replace(target);
  }, [target]);

  return null;
});