// 覆盖 lobehub 的 Sidebar slot：参考 lobehub.com 文档站左侧栏：
//   1) 顶部内置「搜索框」（顶栏胶囊里不再放搜索框，见 Header slot）；
//   2) 分组（dl 组）改为「可展开/收缩」的手风琴：点击分组标题切换，带 chevron 指示。
//
// 数据来源：lobehub store 的 s.sidebar = [{ title, children: [{ title, link }] }]。
// 导入约束：本地 slot 只用 `dumi` 主包核心导出（NavLink / useSiteSearch，主题自身也这么用），
//   绝不引用 `dumi/theme/*` 子路径别名（那会导致 dev 下 .dumi/tmp 重建时 'dumi' 解析报错）；
//   需要主题内部组件时一律走 `dumi-theme-lobehub/dist/*`。
import { SearchBar as Input } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { Link, NavLink, useLocation, useSiteSearch } from 'dumi';
import isEqual from 'fast-deep-equal';
import { BookOpen, Code2, Library, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useState } from 'react';
import { useT, useLocaleBase, localeHref } from '../../locales/strings';
// @ts-ignore 主题内部组件，深层路径无类型声明
import SearchResult from 'dumi-theme-lobehub/dist/slots/SearchResult';
// @ts-ignore
import { useSiteStore } from 'dumi-theme-lobehub/dist/store/useSiteStore';

const useStyles = createStyles(({ css, token }) => ({
  inner: css`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 16px 12px;
  `,
  search: css`
    position: relative;
    flex-shrink: 0;
    margin-bottom: 12px;
  `,
  // 顶部分区切换（/docs/* 显示文档分区、/sdks/* 显示 SDK 列表）：参考 lobehub.com 文档站左栏顶部的分区列表。
  secNav: css`
    flex-shrink: 0;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  secLabel: css`
    display: flex;
    gap: 6px;
    align-items: center;

    margin: 0 0 6px;
    padding-inline: 8px;

    font-size: 12px;
    font-weight: 600;
    color: ${token.colorTextTertiary};
    letter-spacing: 0.04em;
  `,
  secItem: css`
    display: flex;
    gap: 10px;
    align-items: center;

    padding: 6px 8px;
    border-radius: 8px;

    font-size: 14px;
    font-weight: 500;
    color: ${token.colorTextSecondary};
    text-decoration: none;

    transition: background 0.15s ease, color 0.15s ease;

    & + & {
      margin-top: 2px;
    }
    /* hover 用 colorFill（深色 ~白 15%）而非 quaternary（~4%，深色下几乎不可见） */
    &:hover {
      color: ${token.colorText};
      background: ${token.colorFill};
    }
  `,
  // 选中态：品牌橙色调底，深/浅色都清晰可见（原 colorFillSecondary 深色下太淡看不出）。
  // 自带 &:hover（与 .secItem:hover 同特异性，靠定义顺序在此后生效）以免 hover 时被中性灰盖掉。
  secItemActive: css`
    color: ${token.colorText};
    background: color-mix(in srgb, #F97316 18%, transparent);

    &:hover {
      background: color-mix(in srgb, #F97316 24%, transparent);
    }
  `,
  secIcon: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 28px;
    height: 28px;
    border-radius: 8px;

    color: ${token.colorTextSecondary};
    background: ${token.colorFillTertiary};

    transition: background 0.15s ease, color 0.15s ease;
  `,
  secIconActive: css`
    color: #fff;
    background: #F97316;
  `,
  // 搜索结果浮层：宽度跟随侧栏（区别于顶栏 540px 固定宽，避免溢出屏幕）
  popover: css`
    position: absolute;
    z-index: 50;
    inset-inline: 0;
    top: 100%;
    overflow: auto;
    overscroll-behavior: contain;
    max-height: 60vh;
    margin-top: 8px;
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgElevated};
    box-shadow: ${token.boxShadow};
  `,
  list: css`
    overflow: auto;
    flex: 1;
    margin: 0 -4px;
    padding: 0 4px;
  `,
  group: css`
    & + & {
      margin-top: 2px;
    }
  `,
  groupHeader: css`
    cursor: pointer;
    user-select: none;

    display: flex;
    align-items: center;
    justify-content: space-between;

    width: 100%;
    margin: 0;
    padding: 7px 8px;
    border: none;
    border-radius: 6px;

    font-size: 13px;
    font-weight: 600;
    color: ${token.colorText};
    text-align: start;

    background: transparent;
    transition: background 0.15s ease;

    &:hover {
      background: ${token.colorFillQuaternary};
    }

    svg {
      flex-shrink: 0;
      opacity: 0.55;
      transition: transform 0.2s ease;
    }

    &[data-open='false'] svg {
      transform: rotate(-90deg);
    }
  `,
  // 展开/收缩动画改用 framer-motion（height 0↔auto），见下方 JSX；这里仅保留内容内边距
  items: css`
    padding: 2px 0 6px;
  `,
  link: css`
    overflow: hidden;
    display: block;

    margin: 1px 0;
    padding: 6px 12px 6px 18px;
    border-radius: 6px;

    font-size: ${token.fontSize}px;
    line-height: ${token.lineHeight};
    color: ${token.colorTextSecondary};
    text-overflow: ellipsis;
    text-decoration: none;
    white-space: nowrap;

    transition:
      color 0.2s ease,
      background-color 0.1s ease;

    &:hover {
      color: ${token.colorText};
      background: ${token.colorFillTertiary};
    }

    &.active {
      font-weight: 500;
      color: ${token.colorText};
      background: ${token.colorFillSecondary};
    }
  `,
}));

// 「文档」主路由下的子分区（title 走 useT 本地化；仅在 /docs/* 页面顶部展示切换）。
const SECTIONS: { key: 'spec' | 'api'; root: string; icon: () => React.ReactNode }[] = [
  { key: 'spec', root: '/docs/spec', icon: () => <BookOpen size={16} /> },
  { key: 'api', root: '/docs/api', icon: () => <Code2 size={16} /> },
];

// 「SDKs」主路由下的 SDK 列表（title 走 useT 本地化）。
// 图标与 JadeNavbar 下拉同源：有品牌 logo 的用彩色 SVG（public/sdklogo/），易语言/火山用品牌色字徽；
// 字徽选中态跟随 secIconActive 反白（图标为 active 的函数）。
const SDK_SECTIONS: { key: 'web' | 'py' | 'go' | 'ey' | 'vol'; root: string; bg?: string; icon: (active: boolean) => React.ReactNode }[] = [
  { key: 'web', root: '/sdks/web-sdk', icon: () => <img alt="" height={15} src="/sdklogo/javascript.svg" width={15} /> },
  { key: 'py', root: '/sdks/python-sdk', icon: () => <img alt="" height={15} src="/sdklogo/python.svg" width={15} /> },
  { key: 'go', root: '/sdks/golang-sdk', bg: '#007D9C', icon: () => <img alt="" height={15} src="/sdklogo/go.svg" width={15} /> },
  { key: 'ey', root: '/sdks/easy-language-sdk', icon: (a) => <b style={{ color: a ? '#fff' : '#F97316', fontSize: 13 }}>易</b> },
  { key: 'vol', root: '/sdks/voldp-sdk', icon: (a) => <b style={{ color: a ? '#fff' : '#e8533f', fontSize: 13 }}>火</b> },
];

const Chevron = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default memo(function Sidebar() {
  const { styles, cx } = useStyles();
  const t = useT();
  const base = useLocaleBase();
  const sidebar = useSiteStore((s: any) => s.sidebar, isEqual);
  const { pathname } = useLocation();
  // 收起状态（默认全部展开）；key 用分组标题
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [focusing, setFocusing] = useState(false);
  const { keywords, setKeywords, result, loading } = useSiteSearch();

  if (!sidebar || sidebar.length === 0) return null;

  // 文档主路由（/docs/*）顶部展示「文档」分区切换，SDK 主路由（/sdks/*）展示 SDK 列表切换；
  // 发行版本等其它文档区不显示。
  // ⚠️ 必须先剥掉当前语言前缀：英文路径是 /en-US/docs|sdks/…，不剥则 inDocs/inSdks 全 false →
  // 顶部分区切换整块不渲染（即「英文版文档/SDK 页侧边栏导航没了」）。
  const rel = base !== '/' && pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
  const inDocs = rel === '/docs' || rel.startsWith('/docs/');
  const inSdks = rel === '/sdks' || rel.startsWith('/sdks/');

  return (
    <section className={styles.inner}>
      <div className={styles.search}>
        <Input
          enableShortKey
          shortKey="k"
          spotlight
          type="block"
          placeholder={base === '/' ? '搜索文档…' : 'Search docs…'}
          style={{ width: '100%' }}
          onBlur={() => setTimeout(() => setFocusing(false), 150)}
          onChange={(e: any) => setKeywords(e.target.value)}
          onFocus={() => setFocusing(true)}
        />
        {keywords.trim() && focusing && (result.length > 0 || !loading) && (
          <div className={styles.popover}>
            <SearchResult data={result} loading={loading} />
          </div>
        )}
      </div>

      {(inDocs || inSdks) && (
        <div className={styles.secNav}>
          <p className={styles.secLabel}>
            {inDocs ? (
              <>
                <Library size={14} /> {t.nav.docs}
              </>
            ) : (
              <>
                <Package size={14} /> {t.nav.sdks}
              </>
            )}
          </p>
          {(inDocs ? SECTIONS : SDK_SECTIONS).map((s: any) => {
            const active = rel === s.root || rel.startsWith(s.root + '/');
            const title = inDocs ? t.navbar.docsSections[s.key].title : t.navbar.sdk[s.key].title;
            return (
              <Link
                key={s.root}
                className={cx(styles.secItem, active && styles.secItemActive)}
                to={localeHref(base, s.root)}
              >
                <span
                  className={cx(styles.secIcon, active && styles.secIconActive)}
                  style={s.bg && !active ? { background: s.bg, boxShadow: 'none' } : undefined}
                >
                  {s.icon(active)}
                </span>
                {title}
              </Link>
            );
          })}
        </div>
      )}

      <nav className={styles.list}>
        {sidebar.map((item: any, index: number) => {
          const hasTitle = Boolean(item.title);
          const key = item.title || `__group_${index}`;
          const open = hasTitle ? !collapsed[key] : true;
          const links = (
            <div className={styles.items}>
              {item.children.map((child: any) => (
                <NavLink key={child.link} className={styles.link} end title={child.title} to={child.link}>
                  {child.title}
                </NavLink>
              ))}
            </div>
          );
          return (
            <div key={key} className={styles.group}>
              {hasTitle ? (
                <>
                  <button
                    className={styles.groupHeader}
                    data-open={open}
                    type="button"
                    onClick={() => setCollapsed((c) => ({ ...c, [key]: open }))}
                  >
                    <span>{item.title}</span>
                    <Chevron />
                  </button>
                  {/* 折叠/展开动画：单一常驻 motion.div，animate height auto↔0（展开/收起两个方向都平滑，
                      无需 AnimatePresence/exit/key —— 之前 exit 在条件渲染下不触发，故收起无动画）。 */}
                  <motion.div
                    animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                    initial={false}
                    style={{ overflow: 'hidden' }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  >
                    {links}
                  </motion.div>
                </>
              ) : (
                links
              )}
            </div>
          );
        })}
      </nav>
    </section>
  );
});
