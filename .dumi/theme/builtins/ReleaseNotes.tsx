// 发行版本页（从旧站 static/releases/index.html 迁移，样式按新站 lobehub 风格重做）。
// 数据：运行时直接拉线上发行列表（AtomGit + GitHub 公开接口），无需重建站点即可看到新版本。
//   两个来源共用一套闸门：任意两次请求至少间隔 2 秒（上游 AtomGit 限 2 次/秒、GitHub 未登录 60 次/小时），
//   各自响应缓存 10 秒。GitHub 数据为准（日期/正文准、历史全），AtomGit 兜底 + 国内更快出内容。
// 功能保留：发行版本(语义化说明 + 最新稳定版 + 稳定/预发布列表) / 发行日历(热力图) / 所有发行(筛选+分页) / 详情(Markdown)。
import { Github } from '@lobehub/icons';
import { Segmented, theme as antdTheme } from 'antd';
import { createStyles } from 'antd-style';
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { lazy, memo, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useT } from '../locales/strings';

// Markdown（@lobehub/ui）内部静态依赖 katex/shiki，builtins 又是静态注册的，
// 会拖进所有页面的首屏 chunk。lazy 化后只在打开版本详情时加载。
const Markdown = lazy(() => import('@lobehub/ui').then((m) => ({ default: m.Markdown })));

const PAGE_SIZE = 10;
// AtomGit 发行页：单版本直链为 `${ATOMGIT_RELEASES_URL}/{tag_name}`，正式版与预发布版一致
const ATOMGIT_RELEASES_URL = 'https://atomgit.com/ituyang/JadeView/releases';
// AtomGit 官方单色标志（24×24 svg）
const ATOMGIT_MARK_URL = 'https://atomcode.atomgit.com/assets/atomgit-mark.svg';
// 线上发行列表，两个上游（均免认证、CORS 放开任意 Origin）：
//   AtomGit 国内快，但历史版本少、只有 created_at；GitHub 数据全、日期准，国内可能不通。
const ATOMGIT_API_URL = 'https://api.atomgit.com/api/v5/repos/ituyang/JadeView/releases?per_page=100';
const GITHUB_API_URL = 'https://api.github.com/repos/JadeViewDocs/JadeView/releases?per_page=100';
const GITHUB_TAG_BASE = 'https://github.com/JadeViewDocs/JadeView/releases/tag';
// 上游限流都很紧（AtomGit 2 次/秒、GitHub 未登录 60 次/小时）：两个来源共用一套闸门——
//   任意两次请求至少间隔 2 秒，各自响应缓存 10 秒，命中缓存不发请求。
const ATOMGIT_CACHE_KEY = 'jadeview:releases:atomgit';
const GITHUB_CACHE_KEY = 'jadeview:releases:github';
const RELEASES_LAST_REQ_KEY = 'jadeview:releases:last-req';
const RELEASES_CACHE_TTL = 10_000;
const RELEASES_MIN_INTERVAL = 2_000;

type Release = {
  tag_name: string;
  name: string;
  published_at: string;
  prerelease?: boolean;
  html_url?: string;
  body?: string;
};

type AtomgitRelease = {
  tag_name?: string;
  name?: string;
  body?: string;
  prerelease?: boolean;
  created_at?: string;
};

type GithubRelease = {
  tag_name?: string;
  name?: string;
  body?: string;
  prerelease?: boolean;
  published_at?: string;
  html_url?: string;
};

type CacheEntry = { at: number; releases: Release[] };

type DateWords = {
  justNow: string;
  minutesAgo: (minutes: number) => string;
  halfHourAgo: string;
  almostAnHourAgo: string;
  hoursAgo: (hours: number) => string;
  yesterday: string;
  dateLocale: string;
};

// 展示规则（按本地时间）：
//   不足 1 小时 → 口语化（刚刚 / x 分钟前 / 半个小时前 / 快一个小时前），跨不跨自然日都一样
//   同一自然日内 → x 个小时前
//   前一自然日   → 昨天
//   更早         → 年月日
function formatDate(dateStr: string, t: DateWords) {
  const date = new Date(dateStr);
  const elapsedMinutes = (Date.now() - date.getTime()) / 60000;
  if (elapsedMinutes < 1) return t.justNow;
  if (elapsedMinutes < 20) return t.minutesAgo(Math.floor(elapsedMinutes));
  if (elapsedMinutes < 45) return t.halfHourAgo;
  if (elapsedMinutes < 60) return t.almostAnHourAgo;

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  // round 而不是 floor：夏令时会让两天相差 23 或 25 小时
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (diffDays === 0) return t.hoursAgo(Math.floor(elapsedMinutes / 60));
  if (diffDays === 1) return t.yesterday;
  return date.toLocaleDateString(t.dateLocale, { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// 拉线上发行列表。
// 为什么不读站点里的 /releases/data.json：快照是构建期随镜像发出去的，发版后不重建站点就一直是旧数据。
function readCache(key: string): Release[] | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!Array.isArray(entry.releases)) return null;
    return Date.now() - entry.at < RELEASES_CACHE_TTL ? entry.releases : null;
  } catch {
    // 存储不可用（隐私模式 / 配额满）时当作无缓存
    return null;
  }
}

function writeCache(key: string, releases: Release[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ at: Date.now(), releases } satisfies CacheEntry));
  } catch {
    // 写不进缓存不影响展示
  }
}

// 共用闸门：两次上游请求至少间隔 2 秒（时间戳落 localStorage，刷新页面 / 多标签页同样生效）
async function passGate() {
  let lastReq = 0;
  try {
    lastReq = Number(window.localStorage.getItem(RELEASES_LAST_REQ_KEY)) || 0;
  } catch {
    // 读不到时间戳时不额外等待
  }
  const wait = RELEASES_MIN_INTERVAL - (Date.now() - lastReq);
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  try {
    window.localStorage.setItem(RELEASES_LAST_REQ_KEY, String(Date.now()));
  } catch {
    // 记不了时间戳，退化为不跨页节流
  }
}

async function loadReleaseList<T>(
  cacheKey: string,
  url: string,
  toRelease: (r: T) => Release | null,
): Promise<Release[]> {
  const cached = readCache(cacheKey);
  if (cached) return cached;

  await passGate();
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error('接口返回格式异常');
  const releases = (data as T[])
    .map(toRelease)
    .filter((r): r is Release => r !== null)
    // 接口按创建顺序返回（旧→新），页面约定首项为最新
    .sort((a, b) => (Date.parse(b.published_at) || 0) - (Date.parse(a.published_at) || 0));
  writeCache(cacheKey, releases);
  return releases;
}

const fetchAtomgitReleases = () =>
  loadReleaseList<AtomgitRelease>(ATOMGIT_CACHE_KEY, ATOMGIT_API_URL, (r) =>
    r.tag_name
      ? {
          tag_name: r.tag_name,
          name: r.name || r.tag_name,
          // AtomGit 只有 created_at：新发布的版本它≈发布时间，更早的版本是迁移进 AtomGit 的时间
          published_at: r.created_at || '',
          prerelease: Boolean(r.prerelease),
          html_url: `${GITHUB_TAG_BASE}/${r.tag_name}`,
          body: r.body || '',
        }
      : null,
  );

const fetchGithubReleases = () =>
  loadReleaseList<GithubRelease>(GITHUB_CACHE_KEY, GITHUB_API_URL, (r) =>
    r.tag_name
      ? {
          tag_name: r.tag_name,
          name: r.name || r.tag_name,
          published_at: r.published_at || '',
          prerelease: Boolean(r.prerelease),
          html_url: r.html_url || `${GITHUB_TAG_BASE}/${r.tag_name}`,
          body: r.body || '',
        }
      : null,
  );

// 合并两份列表：primary（GitHub：日期/正文准、历史全）优先，再补它没有的版本，按发布时间倒序
function mergeReleases(primary: Release[], extra: Release[]): Release[] {
  const seen = new Set(primary.map((r) => r.tag_name));
  return [...primary, ...extra.filter((r) => !seen.has(r.tag_name))].sort(
    (a, b) => (Date.parse(b.published_at) || 0) - (Date.parse(a.published_at) || 0),
  );
}

// —— URL 状态同步（SPA 单页，用查询参数；刷新可还原、可分享、前进后退可用）——
const VALID_TABS = ['releases', 'calendar', 'all'];
const VALID_FILTERS = ['all', 'stable', 'prerelease'];

function readParams() {
  if (typeof window === 'undefined') return { v: null as string | null, tab: 'releases', filter: 'all', page: 1 };
  const p = new URLSearchParams(window.location.search);
  const tab = p.get('tab') || '';
  const filter = p.get('filter') || '';
  return {
    v: p.get('v') || null,
    tab: VALID_TABS.includes(tab) ? tab : 'releases',
    filter: VALID_FILTERS.includes(filter) ? filter : 'all',
    page: Math.max(1, parseInt(p.get('page') || '1', 10) || 1),
  };
}

function buildUrl(v: string | null, tab: string, filter: string, page: number) {
  const p = new URLSearchParams();
  if (v) {
    p.set('v', v);
  } else {
    if (tab !== 'releases') p.set('tab', tab);
    if (tab === 'all' && filter !== 'all') p.set('filter', filter);
    if (tab === 'all' && page > 1) p.set('page', String(page));
  }
  const qs = p.toString();
  return window.location.pathname + (qs ? `?${qs}` : '');
}

const useStyles = createStyles(({ css, token, responsive }) => ({
  root: css`
    width: 100%;
  `,
  header: css`
    margin-bottom: 24px;
  `,
  title: css`
    margin: 0 0 8px;
    font-size: 34px;
    font-weight: 700;
    line-height: 1.2;
    color: ${token.colorText};

    ${responsive.mobile} {
      font-size: 26px;
    }
  `,
  subtitle: css`
    margin: 0;
    font-size: 15px;
    color: ${token.colorTextSecondary};
  `,
  /* 包裹 Segmented 的块级容器：Segmented 本身是 inline-block，相邻会并排，故各自包一层 block div 独占一行 */
  tabs: css`
    margin-bottom: 28px;
  `,
  filterBar: css`
    margin-bottom: 16px;
  `,
  // 语义化版本说明
  policy: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 32px;
  `,
  policyCard: css`
    padding: 16px 18px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
  `,
  policyTitle: css`
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorText};
  `,
  policyDesc: css`
    font-size: 12px;
    line-height: 1.6;
    color: ${token.colorTextTertiary};
  `,
  // 最新稳定版
  latest: css`
    margin-bottom: 36px;
    padding: 28px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
  `,
  latestTop: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  `,
  latestVer: css`
    cursor: pointer;

    margin: 0;
    font-size: 44px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: ${token.colorText};

    &:hover {
      color: ${token.colorLink};
    }

    ${responsive.mobile} {
      font-size: 32px;
    }
  `,
  latestDate: css`
    margin-top: 8px;
    font-size: 13px;
    color: ${token.colorTextTertiary};
  `,
  sectionTitle: css`
    display: flex;
    gap: 8px;
    align-items: center;

    margin: 0 0 12px;

    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: ${token.colorTextSecondary};
    text-transform: uppercase;
  `,
  dot: css`
    width: 7px;
    height: 7px;
    border-radius: 50%;
  `,
  section: css`
    margin-bottom: 28px;
  `,
  rows: css`
    overflow: hidden;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
  `,
  row: css`
    cursor: pointer;

    display: flex;
    gap: 12px;
    align-items: center;

    padding: 14px 18px;

    transition: background 0.15s ease;

    & + & {
      border-top: 1px solid ${token.colorBorderSecondary};
    }

    &:hover {
      background: ${token.colorFillQuaternary};
    }
  `,
  rowVer: css`
    flex-shrink: 0;
    width: 130px;
    font-family: ${token.fontFamilyCode};
    font-size: 14px;
    font-weight: 600;
    color: ${token.colorText};

    ${responsive.mobile} {
      width: auto;
    }
  `,
  rowVerPre: css`
    color: ${token.colorWarning};
  `,
  rowName: css`
    overflow: hidden;
    flex: 1;
    min-width: 0;

    font-size: 14px;
    color: ${token.colorTextSecondary};
    text-overflow: ellipsis;
    white-space: nowrap;

    ${responsive.mobile} {
      display: none;
    }
  `,
  rowType: css`
    flex-shrink: 0;
  `,
  rowDate: css`
    flex-shrink: 0;
    width: 96px;
    font-size: 12px;
    color: ${token.colorTextTertiary};
    text-align: right;
  `,
  badge: css`
    display: inline-block;
    padding: 2px 9px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.5;
  `,
  link: css`
    display: inline-flex;
    gap: 4px;
    align-items: center;

    padding: 5px 12px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 9999px;

    font-size: 12px;
    color: ${token.colorTextSecondary};
    text-decoration: none;

    transition: color 0.15s ease, border-color 0.15s ease;

    &:hover {
      color: ${token.colorText};
      border-color: ${token.colorBorder};
    }
  `,
  links: css`
    display: flex;
    gap: 8px;
    align-items: center;
  `,
  // 分页
  pager: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 18px;
  `,
  pageInfo: css`
    font-size: 13px;
    color: ${token.colorTextTertiary};
  `,
  pageBtns: css`
    display: flex;
    gap: 8px;
  `,
  pageBtn: css`
    cursor: pointer;

    display: inline-flex;
    gap: 4px;
    align-items: center;

    padding: 6px 14px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 9999px;

    font-size: 13px;
    color: ${token.colorTextSecondary};

    background: transparent;

    transition: color 0.15s ease, border-color 0.15s ease;

    &:hover:not(:disabled) {
      color: ${token.colorText};
      border-color: ${token.colorBorder};
    }

    &:disabled {
      cursor: default;
      opacity: 0.4;
    }
  `,
  // 日历
  calBar: css`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
  `,
  calYearBtn: css`
    cursor: pointer;

    padding: 5px 14px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 9999px;

    font-size: 13px;
    color: ${token.colorTextTertiary};

    background: transparent;

    transition: all 0.15s ease;

    &:hover {
      color: ${token.colorText};
    }

    &[data-active='true'] {
      color: ${token.colorText};
      border-color: ${token.colorBorder};
      background: ${token.colorFillSecondary};
    }
  `,
  calGrid: css`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 22px;
  `,
  calMonth: css`
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorText};
    margin-bottom: 8px;
  `,
  calDays: css`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 3px;
    text-align: center;
  `,
  calWeek: css`
    font-size: 10px;
    color: ${token.colorTextTertiary};
    padding-bottom: 2px;
  `,
  calCell: css`
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    font-size: 11px;
    color: ${token.colorTextSecondary};
    background: ${token.colorFillTertiary};
  `,
  calEmpty: css`
    background: transparent;
  `,
  // 详情
  back: css`
    cursor: pointer;

    display: inline-flex;
    gap: 6px;
    align-items: center;

    margin-bottom: 24px;
    padding: 0;
    border: none;

    font-size: 14px;
    color: ${token.colorTextSecondary};

    background: transparent;

    &:hover {
      color: ${token.colorText};
    }
  `,
  detail: css`
    padding: 32px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
  `,
  detailVer: css`
    margin: 10px 0 6px;
    font-size: 40px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: ${token.colorText};

    ${responsive.mobile} {
      font-size: 30px;
    }
  `,
  detailMeta: css`
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;

    padding-bottom: 20px;
    margin-bottom: 24px;
    border-bottom: 1px solid ${token.colorBorderSecondary};

    font-size: 13px;
    color: ${token.colorTextTertiary};
  `,
  state: css`
    padding: 80px 0;
    font-size: 15px;
    color: ${token.colorTextTertiary};
    text-align: center;
  `,
}));

// 周/月/版本策略文案见 ../locales/strings 的 releases.week / releases.months / releases.policy

export default memo(function ReleaseNotes() {
  const { styles, theme } = useStyles();
  const t = useT().releases;
  antdTheme.useToken();
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // 初始状态从 URL 还原（刷新 / 直达链接）
  const [tab, setTab] = useState(() => readParams().tab);
  const [detailTag, setDetailTag] = useState<string | null>(() => readParams().v);
  const [allFilter, setAllFilter] = useState(() => readParams().filter);
  const [allPage, setAllPage] = useState(() => readParams().page);
  const [calYear, setCalYear] = useState<number | null>(null);

  // 浏览器前进/后退：从 URL 同步回状态
  useEffect(() => {
    const onPop = () => {
      const p = readParams();
      setDetailTag(p.v);
      setTab(p.tab);
      setAllFilter(p.filter);
      setAllPage(p.page);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // 列表态（非详情）：标签 / 筛选 / 分页变化写回 URL（replace，不堆历史）
  useEffect(() => {
    if (typeof window === 'undefined' || detailTag) return;
    window.history.replaceState(null, '', buildUrl(null, tab, allFilter, allPage));
  }, [tab, allFilter, allPage, detailTag]);

  const load = () => {
    setLoading(true);
    setError(false);
    // AtomGit 国内快，先出内容；GitHub 数据更全（日期/正文准确、历史版本完整），拿到后按它为准合并。
    fetchAtomgitReleases()
      .then((atomgit) => {
        setReleases(atomgit);
        fetchGithubReleases()
          .then((github) => setReleases((prev) => mergeReleases(github, prev)))
          .catch(() => {
            // GitHub 不通（国内常见）就只用 AtomGit 的列表
          });
      })
      // AtomGit 也不可用时，反过来只靠 GitHub
      .catch(() =>
        fetchGithubReleases()
          .then(setReleases)
          .catch(() => setError(true)),
      )
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // 日历用：年份列表 + 日期→发行映射（须在任何 early return 之前调用，保证 hooks 顺序稳定）
  const years = useMemo(() => {
    const ys = Array.from(new Set(releases.map((r) => new Date(r.published_at).getFullYear())));
    return ys.sort((a, b) => b - a);
  }, [releases]);
  const dateMap = useMemo(() => {
    const m: Record<string, Release[]> = {};
    releases.forEach((r) => {
      // 按本地自然日归档（日历格子用的也是本地日期）；
      // 直接切 ISO 串前 10 位是 UTC 日期，跟展示/日历会差一天
      const d = new Date(r.published_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      (m[key] ||= []).push(r);
    });
    return m;
  }, [releases]);

  const open = (tag: string) => {
    setDetailTag(tag);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', buildUrl(tag, tab, allFilter, allPage));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const stableBadge = { color: theme.colorSuccess, background: theme.colorSuccessBg };
  const preBadge = { color: theme.colorWarning, background: theme.colorWarningBg };

  const ExtLink = ({ href, label, icon }: { href?: string; label: string; icon?: ReactNode }) =>
    href ? (
      <a className={styles.link} href={href} rel="noreferrer" target="_blank">
        {icon}
        {label}
        <ExternalLink size={12} />
      </a>
    ) : null;

  const Row = ({ r, showType }: { r: Release; showType?: boolean }) => (
    <div className={styles.row} onClick={() => open(r.tag_name)}>
      <span className={`${styles.rowVer} ${r.prerelease ? styles.rowVerPre : ''}`}>{r.tag_name}</span>
      <span className={styles.rowName}>{r.name && r.name !== r.tag_name ? r.name : ''}</span>
      {showType && (
        <span className={styles.rowType}>
          <span className={styles.badge} style={r.prerelease ? preBadge : stableBadge}>
            {r.prerelease ? t.prerelease : t.stable}
          </span>
        </span>
      )}
      <span className={styles.rowDate}>{formatDate(r.published_at, t)}</span>
    </div>
  );

  // —— 详情 ——
  if (detailTag) {
    const r = releases.find((x) => x.tag_name === detailTag);
    return (
      <div className={styles.root}>
        <button className={styles.back} onClick={() => setDetailTag(null)} type="button">
          <ArrowLeft size={16} /> {t.backToList}
        </button>
        {loading ? (
          <div className={styles.state}>{t.loading}</div>
        ) : r ? (
          <div className={styles.detail}>
            <span className={styles.badge} style={r.prerelease ? preBadge : stableBadge}>
              {r.prerelease ? t.prerelease : t.stable}
            </span>
            <h1 className={styles.detailVer}>{r.tag_name}</h1>
            <div className={styles.detailMeta}>
              <span>{formatDate(r.published_at, t)}</span>
              <span className={styles.links}>
                <ExtLink href={r.html_url} icon={<Github size={14} />} label="GitHub" />
                <ExtLink
                  href={`${ATOMGIT_RELEASES_URL}/${r.tag_name}`}
                  icon={<img alt="" height={14} src={ATOMGIT_MARK_URL} width={14} />}
                  label="AtomGit"
                />
              </span>
            </div>
            {r.body ? (
              <Suspense>
                <Markdown>{r.body}</Markdown>
              </Suspense>
            ) : (
              <p className={styles.state}>{t.noDetail}</p>
            )}
          </div>
        ) : (
          <div className={styles.state}>{t.notFound}</div>
        )}
      </div>
    );
  }

  const stable = releases.filter((r) => !r.prerelease);
  const prerelease = releases.filter((r) => r.prerelease);
  const latest = stable[0];

  // 预发布展示策略：只展示最新的一个 beta；若对应正式版已发布，则隐藏该 beta。
  // baseVer：去掉 v 前缀与 -beta.x / -rc.x 等预发布后缀，得到对应正式版号（v2.4.0-beta.1 → 2.4.0）。
  const baseVer = (tag: string) => {
    let v = tag.replace(/^v/i, '');
    const dash = v.indexOf('-');
    return dash > -1 ? v.slice(0, dash) : v;
  };
  const stableBaseSet = new Set(stable.map((r) => baseVer(r.tag_name)));
  // releases 按时间倒序，首个即最新；同一 base 只保留最新一个，且跳过已有正式版的。
  const visiblePre: Release[] = [];
  const seenBase = new Set<string>();
  for (const r of prerelease) {
    const base = baseVer(r.tag_name);
    if (stableBaseSet.has(base) || seenBase.has(base)) continue;
    seenBase.add(base);
    visiblePre.push(r);
  }

  // —— 所有发行（筛选 + 分页）——
  const filtered = allFilter === 'stable' ? stable : allFilter === 'prerelease' ? prerelease : releases;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(allPage, totalPages);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // —— 日历 ——
  const activeYear = calYear ?? years[0] ?? new Date().getFullYear();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>{t.subtitle}</p>
      </div>

      {loading ? (
        <div className={styles.state}>加载中…</div>
      ) : error ? (
        <div className={styles.state}>
          {t.loadFailed}{' '}
          <button className={styles.back} onClick={load} style={{ display: 'inline-flex', margin: 0 }} type="button">
            {t.retry}
          </button>
        </div>
      ) : (
        <>
          <div className={styles.tabs}>
            <Segmented
              onChange={(v) => setTab(v as string)}
              options={[
                { label: t.tabReleases, value: 'releases' },
                { label: t.tabCalendar, value: 'calendar' },
                { label: t.tabAll, value: 'all' },
              ]}
              value={tab}
            />
          </div>

          {tab === 'releases' && (
            <>
              <div className={styles.policy}>
                {t.policy.map((p) => (
                  <div className={styles.policyCard} key={p.t}>
                    <div className={styles.policyTitle}>{p.t}</div>
                    <div className={styles.policyDesc}>{p.d}</div>
                  </div>
                ))}
              </div>

              {latest && (
                <div className={styles.latest}>
                  <div className={styles.latestTop}>
                    <span className={styles.badge} style={stableBadge}>
                      {t.latestStable}
                    </span>
                    <span className={styles.links}>
                      <ExtLink href={latest.html_url} icon={<Github size={14} />} label="GitHub" />
                      <ExtLink
                        href={`${ATOMGIT_RELEASES_URL}/${latest.tag_name}`}
                        icon={<img alt="" height={14} src={ATOMGIT_MARK_URL} width={14} />}
                        label="AtomGit"
                      />
                    </span>
                  </div>
                  <h2 className={styles.latestVer} onClick={() => open(latest.tag_name)}>
                    {latest.tag_name}
                  </h2>
                  <div className={styles.latestDate}>{formatDate(latest.published_at, t)}</div>
                </div>
              )}

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.dot} style={{ background: theme.colorSuccess }} />
                  {t.stable}
                </h3>
                <div className={styles.rows}>
                  {stable.slice(0, 5).map((r) => (
                    <Row key={r.tag_name} r={r} />
                  ))}
                </div>
              </div>

              {visiblePre.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.dot} style={{ background: theme.colorWarning }} />
                    {t.prerelease}
                  </h3>
                  <div className={styles.rows}>
                    {visiblePre.slice(0, 1).map((r) => (
                      <Row key={r.tag_name} r={r} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'all' && (
            <>
              <div className={styles.filterBar}>
                <Segmented
                  onChange={(v) => {
                    setAllFilter(v as string);
                    setAllPage(1);
                  }}
                  options={[
                    { label: t.filterAll, value: 'all' },
                    { label: t.stable, value: 'stable' },
                    { label: t.prerelease, value: 'prerelease' },
                  ]}
                  size="small"
                  value={allFilter}
                />
              </div>
              <div className={styles.rows}>
                {pageItems.map((r) => (
                  <Row key={r.tag_name} r={r} showType />
                ))}
              </div>
              <div className={styles.pager}>
                <span className={styles.pageInfo}>
                  {t.pageInfo(page, totalPages, filtered.length)}
                </span>
                <div className={styles.pageBtns}>
                  <button
                    className={styles.pageBtn}
                    disabled={page <= 1}
                    onClick={() => setAllPage((p) => Math.max(1, p - 1))}
                    type="button"
                  >
                    <ChevronLeft size={14} /> {t.prev}
                  </button>
                  <button
                    className={styles.pageBtn}
                    disabled={page >= totalPages}
                    onClick={() => setAllPage((p) => Math.min(totalPages, p + 1))}
                    type="button"
                  >
                    {t.next} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === 'calendar' && (
            <>
              <div className={styles.calBar}>
                {years.map((y) => (
                  <button
                    className={styles.calYearBtn}
                    data-active={y === activeYear}
                    key={y}
                    onClick={() => setCalYear(y)}
                    type="button"
                  >
                    {y}
                  </button>
                ))}
              </div>
              <div className={styles.calGrid}>
                {t.months.map((mName, m) => {
                  const firstDay = new Date(activeYear, m, 1).getDay();
                  const daysInMonth = new Date(activeYear, m + 1, 0).getDate();
                  const cells: (number | null)[] = Array.from({ length: firstDay }, () => null);
                  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                  return (
                    <div key={mName}>
                      <div className={styles.calMonth}>{mName}</div>
                      <div className={styles.calDays}>
                        {t.week.map((w) => (
                          <div className={styles.calWeek} key={w}>
                            {w}
                          </div>
                        ))}
                        {cells.map((day, i) => {
                          if (day === null) return <div className={`${styles.calCell} ${styles.calEmpty}`} key={i} />;
                          const ds = `${activeYear}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const rs = dateMap[ds];
                          if (!rs?.length) {
                            return (
                              <div className={styles.calCell} key={i}>
                                {day}
                              </div>
                            );
                          }
                          const hasStable = rs.some((r) => !r.prerelease);
                          const accent = hasStable ? theme.colorSuccess : theme.colorWarning;
                          return (
                            <div
                              className={styles.calCell}
                              key={i}
                              onClick={() => open(rs[0].tag_name)}
                              style={{
                                background: `color-mix(in srgb, ${accent} 32%, transparent)`,
                                color: theme.colorText,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                              title={rs.map((r) => r.tag_name).join(', ')}
                            >
                              {day}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
});
