// 博客文章顶部信息栏：投稿人（头像+昵称）、投稿时间、编辑此页。
// 数据全部由 CI 工作流 scripts/update-contributors.mjs 自动生成（Git 提交记录），无 frontmatter 字段：
//   · pages[route][0] —— 文件首要贡献者（PR 作者）：昵称、头像、GitHub 主页
//   · posts[route].date —— 首次提交时间（投稿时间）
//   · sources[route][locale] —— 博客源文件路径，供「编辑此页」拼 GitHub 编辑链接
// 快照缺失（如本机未跑工作流、或该页非博客）时安静降级，不渲染投稿人/时间；编辑链接回退按路由猜文件。
import { EditOutlined } from '@ant-design/icons';
import { Avatar, Button } from 'antd';
import { useLocation } from 'dumi';
import isEqual from 'fast-deep-equal';
import { CalendarDays } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
// @ts-ignore 主题 store，深层路径无类型声明
import { useSiteStore } from 'dumi-theme-lobehub/dist/store/useSiteStore';
import { useLocaleBase, useT } from '../locales/strings';

const REPO_EDIT_BASE = 'https://github.com/JadeViewDocs/docs/edit/main/';

type LocaleId = 'zh-CN' | 'en-US';

interface PostMeta {
  date?: string | null;
}

/** 单个 git 贡献者（工作流自动生成，来自 GitHub commits API / git log） */
interface Contributor {
  login?: string | null;
  name?: string | null;
  avatar?: string | null;
  url?: string | null;
}

interface Snapshot {
  posts: Record<string, PostMeta>;
  sources: Record<string, Partial<Record<LocaleId, string>>>;
  pages: Record<string, Contributor[]>;
}

// 与 DocBreadcrumb 共用同一份快照缓存，模块级只取一次
let snapshotCache: Promise<Snapshot | null> | null = null;
const loadSnapshot = () =>
  (snapshotCache ??= fetch('/contributors/data.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => ({ posts: d?.posts ?? {}, sources: d?.sources ?? {}, pages: d?.pages ?? {} }))
    .catch(() => ({ posts: {}, sources: {}, pages: {} })));

// frontmatter date（YYYY-MM-DD）格式化为投稿时间，中英适配；非法值原样返回
function formatDate(value: string, zh: boolean): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return zh
    ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// 博客文章页正文顶部信息栏（由 markdown 内 <PostHeader /> 插入使用）
export default memo(function PostHeader() {
  const t = useT();
  const { pathname } = useLocation();
  const base = useLocaleBase();
  const locale: LocaleId = base.includes('/en-US') ? 'en-US' : 'zh-CN';
  const zh = locale === 'zh-CN';
  // 标题仅用于辅助判断博客页面（保持与主题数据一致）
  useSiteStore((s: any) => s.routeMeta?.frontmatter?.title, isEqual);

  // 语言前缀归一 → /blog/<slug> 路由 key
  const b = base.replace(/\/$/, '');
  const rel = b && pathname.startsWith(b) ? pathname.slice(b.length) || '/' : pathname;
  const route = rel.replace(/\/+$/, '');
  const isBlog = route.startsWith('/blog/');

  const [snap, setSnap] = useState<Snapshot | null>(null);
  useEffect(() => {
    // 非 /blog/* 文档页（如 API 页）不发请求；快照模块级缓存，整站最多取一次
    if (!isBlog) return;
    let alive = true;
    loadSnapshot().then((s) => {
      if (alive) setSnap(s);
    });
    return () => {
      alive = false;
    };
  }, [isBlog]);

  if (!isBlog) return null;

  // 投稿人信息全部来自工作流自动生成的贡献者数据（GitHub API / git log）：
  // 博客文章的投稿人 = 首要贡献者（squash 合并下即 PR 作者），昵称/头像/GitHub 主页
  // 均取自这里；投稿时间取文件首次提交时间（posts[route].date），投稿人无需填任何字段
  const contributor = snap?.pages?.[route]?.[0];
  const author = contributor?.name;
  const avatar = contributor?.avatar;
  const date = snap?.posts?.[route]?.date;
  const authorUrl = contributor?.url;
  // 编辑目标：当前语言源文件 → 回退 zh 文件 → 回退按路由猜
  const src = snap?.sources?.[route];
  const slug = route.split('/').pop() || '';
  const file = src?.[locale] ?? src?.['zh-CN'] ?? `docs/blog/${slug}${locale === 'en-US' ? '.en-US' : ''}.md`;

  // 无投稿人信息（快照缺失）→ 安静降级，不渲染
  if (!author && !date) return null;

  return (
    <div
      className="jade-post-header"
      style={{
        alignItems: 'center',
        borderBottom: '1px solid var(--ant-color-split, rgba(5,5,5,0.06))',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 14,
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {author && (
          <span style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
            {authorUrl ? (
              <a
                href={authorUrl}
                rel="noreferrer"
                style={{
                  alignItems: 'center',
                  color: 'inherit',
                  display: 'inline-flex',
                  gap: 8,
                  textDecoration: 'none',
                }}
                target="_blank"
                title={authorUrl}
              >
                <Avatar
                  size={24}
                  src={avatar ?? undefined}
                  style={{ background: 'color-mix(in srgb, var(--ant-color-primary) 18%, transparent)', color: 'var(--ant-color-primary)' }}
                >
                  {author[0]?.toUpperCase()}
                </Avatar>
                <span style={{ color: 'var(--ant-color-text)', fontSize: 14, fontWeight: 500 }}>{author}</span>
              </a>
            ) : (
              <>
                <Avatar
                  size={24}
                  src={avatar ?? undefined}
                  style={{ background: 'color-mix(in srgb, var(--ant-color-primary) 18%, transparent)', color: 'var(--ant-color-primary)' }}
                >
                  {author[0]?.toUpperCase()}
                </Avatar>
                <span style={{ color: 'var(--ant-color-text)', fontSize: 14, fontWeight: 500 }}>{author}</span>
              </>
            )}
          </span>
        )}
        {date && (
          <span style={{ alignItems: 'center', color: 'var(--ant-color-text-tertiary)', display: 'inline-flex', fontSize: 13, gap: 6 }}>
            <CalendarDays size={14} />
            {formatDate(date, zh)}
          </span>
        )}
      </div>
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