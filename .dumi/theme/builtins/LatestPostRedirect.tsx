// 博客首页（/blog）：打开后自动跳转到「最新一篇」文章。
// · 跳转用 dumi 的 useNavigate（SPA 内部路由，replace 语义）——不整页刷新站点；
// · 「最新」判定：贡献者快照 posts[route].date（文章首次提交时间，CI 工作流自动生成，
//   frontmatter 已无 date 字段）；快照未到达/缺失时先跳路由表第一篇，到达后再纠正。
// 数据来源：dumi 的 useAppData().routes。umi 路由 path 无前导斜杠（zh: blog/welcome，
// en: en-US/blog/welcome），按当前语言 base 过滤出 /blog/* 文章；快照 key 不带语言前缀。
import { useAppData, useNavigate } from 'dumi';
import { memo, useEffect, useMemo, useState } from 'react';
import { loadSnapshot } from './PostHeader';
import { useLocaleBase } from '../locales/strings';

export default memo(function LatestPostRedirect() {
  const base = useLocaleBase();
  const strip = base.replace(/^\//, ''); // ''（zh）或 'en-US'
  const prefix = strip ? `${strip}/blog/` : 'blog/';
  const indexPath = strip ? `${strip}/blog` : 'blog';
  const navigate = useNavigate();

  const { routes } = useAppData() as any;
  // 当前语言下的博客文章 umi path 列表（如 'blog/welcome'）
  const posts = useMemo(() => {
    const list: string[] = [];
    if (!routes) return list;
    for (const r of Object.values(routes) as any[]) {
      const p: string | undefined = r?.path;
      if (!p || !p.startsWith(prefix) || p === indexPath) continue;
      if (!r?.meta?.frontmatter?.title) continue;
      list.push(p);
    }
    return list;
  }, [routes, prefix, indexPath]);

  // 快照到达后按首次提交时间挑最新；未到达时先用路由表第一篇（单篇文章时两者一致）
  const [dated, setDated] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadSnapshot().then((snap) => {
      if (!alive) return;
      const best = posts
        .map((p) => {
          const t = new Date(snap?.posts?.[`/${p}`]?.date ?? 0).getTime() || 0;
          return { p, t };
        })
        .sort((a, b) => b.t - a.t)[0];
      if (best) setDated(best.p);
    });
    return () => {
      alive = false;
    };
  }, [posts]);

  const target = dated ?? posts[0] ?? null;

  useEffect(() => {
    // replace：不留 /blog 历史记录，避免后退键回到 /blog 又被瞬间跳走
    if (target) navigate(`/${target}`, { replace: true });
  }, [target, navigate]);

  return null;
});
