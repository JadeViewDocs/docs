// 文档类路由面包屑：用 antd 自带 <Breadcrumb>（https://ant.design/components/breadcrumb-cn）。
// 覆盖两类分区（中英文前缀均支持）：
//   · /docs/*     → 文档 / <文档指南|API> / <当前页标题>
//   · /sdks/*     → SDKs / <SDK 名> / <当前页标题>（首级链到 /sdks 总览页）
// 其它页面（产品落地页、发行版本、案例等）不渲染。
// 由 DocumentLayout 作为 <Docs> 的首个子节点注入 → 落在正文 <Content> 顶部、页面 H1 之上，并随正文居中对齐。
//
// 行最右侧：「文档贡献者」（antd Avatar.Group）+「编辑此页」（跳 GitHub 仓库对应源文件）。
// 数据读本站静态快照 /contributors/data.json（scripts/update-contributors.mjs 生成：
// pages=按路由的贡献者、sources=路由→zh/en 源文件；CI 构建时头像已下载为同源文件，
// 运行时不连 GitHub）。快照缺失时贡献者安静不渲染；编辑链接回退按路由猜 docs<route>.md
//（仅目录 index 页可能猜偏）。中英文件在快照里合并到同一 zh 路由 key，前端按语言挑源文件。
import { EditOutlined } from '@ant-design/icons';
import { Avatar, Breadcrumb, Button, Tooltip } from 'antd';
import { Link, useLocation } from 'dumi';
import isEqual from 'fast-deep-equal';
import { memo, useEffect, useState } from 'react';
// @ts-ignore 主题 store，深层路径无类型声明
import { useSiteStore } from 'dumi-theme-lobehub/dist/store/useSiteStore';
import { localeHref, useLocaleBase, useT } from '../locales/strings';

const REPO_EDIT_BASE = 'https://github.com/JadeViewDocs/docs/edit/main/';

// SDK 分区路由段 → strings.ts navbar.sdk 词条 key（标题双语走文案字典）
const SDK_SECTIONS: Record<string, 'web' | 'py' | 'py2' | 'go' | 'ey' | 'vol'> = {
  'web-sdk': 'web',
  'python-sdk': 'py',
  'python-sdk2': 'py2',
  'golang-sdk': 'go',
  'easy-language-sdk': 'ey',
  'voldp-sdk': 'vol',
};

type LocaleId = 'zh-CN' | 'en-US';

interface Contributor {
  login: string | null;
  name: string;
  avatar: string | null;
  url: string | null;
  commits: number;
}

interface Snapshot {
  pages: Record<string, Contributor[]>;
  sources: Record<string, Partial<Record<LocaleId, string>>>;
}

// 快照全站一份，模块级缓存：首个组件实例发起 fetch，之后路由切换零请求
let snapshotCache: Promise<Snapshot> | null = null;
const loadSnapshot = () =>
  (snapshotCache ??= fetch('/contributors/data.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => ({ pages: d?.pages ?? {}, sources: d?.sources ?? {} }))
    .catch(() => ({ pages: {}, sources: {} })));

// 面包屑行右端：贡献者头像组 + 编辑此页（两者共用同一份快照）
const DocPageActions = memo(function DocPageActions({
  route,
  locale,
}: {
  route: string;
  locale: LocaleId;
}) {
  const t = useT();
  const [snap, setSnap] = useState<Snapshot | null>(null);

  useEffect(() => {
    let alive = true;
    loadSnapshot().then((s) => {
      if (alive) setSnap(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const list = snap?.pages[route] ?? [];
  // 编辑目标：当前语言源文件 → 回退 zh 文件 → 回退按路由猜（快照缺失时仍可用）
  const src = snap?.sources[route];
  const file = src?.[locale] ?? src?.['zh-CN'] ?? `docs${route}.md`;

  return (
    <div style={{ alignItems: 'center', display: 'flex', flexShrink: 0, gap: 8 }}>
      {list.length > 0 && (
        <Avatar.Group max={{ count: 5 }} size={24}>
          {list.map((c) => {
            const avatar = (
              <Avatar key={c.login ?? c.name} src={c.avatar ?? undefined}>
                {c.name?.[0]?.toUpperCase()}
              </Avatar>
            );
            return (
              <Tooltip key={c.login ?? c.name} title={t.doc.contributorsTip(c.name, c.commits)}>
                {c.url ? (
                  <a href={c.url} rel="noreferrer" target="_blank">
                    {avatar}
                  </a>
                ) : (
                  avatar
                )}
              </Tooltip>
            );
          })}
        </Avatar.Group>
      )}
      <Button
        href={`${REPO_EDIT_BASE}${file}`}
        icon={<EditOutlined />}
        rel="noreferrer"
        size="small"
        target="_blank"
        type="text"
      >
        {t.doc.editPage}
      </Button>
    </div>
  );
});

export default memo(function DocBreadcrumb() {
  const { pathname } = useLocation();
  const title = useSiteStore((s: any) => s.routeMeta?.frontmatter?.title, isEqual);
  const t = useT();
  const base = useLocaleBase();

  // 语言前缀归一：/en-US/docs/xx → /docs/xx（快照路由 key 与 zh 路由一致）
  const b = base.replace(/\/$/, '');
  const rel = b && pathname.startsWith(b) ? pathname.slice(b.length) || '/' : pathname;
  const route = rel.replace(/\/+$/, '');
  const locale: LocaleId = b === '/en-US' ? 'en-US' : 'zh-CN';

  const [, seg1, seg2] = route.split('/'); // seg1: docs | sdks；seg2: 分区
  const items: { title: React.ReactNode }[] = [];

  if (seg1 === 'docs') {
    items.push({ title: <Link to={localeHref(base, '/docs/spec')!}>{t.nav.docs}</Link> });
    if (seg2 === 'spec' || seg2 === 'api') {
      const sec = { title: t.navbar.docsSections[seg2].title, root: `/docs/${seg2}` };
      const atRoot = route === sec.root;
      items.push({
        title: atRoot ? sec.title : <Link to={localeHref(base, sec.root)!}>{sec.title}</Link>,
      });
      if (!atRoot && title) items.push({ title });
    }
  } else if (seg1 === 'sdks') {
    const atOverview = route === '/sdks';
    items.push({
      title: atOverview ? t.nav.sdks : <Link to={localeHref(base, '/sdks')!}>{t.nav.sdks}</Link>,
    });
    const sdkKey = seg2 ? SDK_SECTIONS[seg2] : undefined;
    if (sdkKey) {
      const sdkTitle = t.navbar.sdk[sdkKey].title;
      const root = `/sdks/${seg2}`;
      const atRoot = route === root;
      items.push({
        title: atRoot ? sdkTitle : <Link to={localeHref(base, root)!}>{sdkTitle}</Link>,
      });
      if (!atRoot && title) items.push({ title });
    }
  } else {
    return null;
  }

  return (
    <div
      className="jade-doc-breadcrumb"
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: 12,
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <Breadcrumb items={items} style={{ fontSize: 14 }} />
      <DocPageActions locale={locale} route={route} />
    </div>
  );
});
