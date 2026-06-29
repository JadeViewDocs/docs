// 自定义顶部导航（替换 lobehub 扁平 Tabs）：
//   - 普通项（首页 / 文档指南 / API）为胶囊式链接，按当前路由高亮；
//   - 「SDKs」做成 lobehub.com 那种「悬浮下拉 mega 卡片」：悬停展开，多列 + 图标 + 标题 + 描述。
// 由 Header slot 以相对路径引用（不走 dumi/theme 别名，也不依赖 slot 覆盖注册，HMR 即生效）。
// 路由/激活用 dumi 主包核心导出（Link / useLocation，主题自带 Navbar 也这么用），安全。
import { createStyles, useTheme } from 'antd-style';
import { Link, useFullSidebarData, useLocation } from 'dumi';
import { BookOpen, ChevronRight, Code2, Download } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
// @ts-ignore 主题 store，深层路径无类型声明
import { useSiteStore } from 'dumi-theme-lobehub/dist/store/useSiteStore';
import { useT, useLocaleBase, localeHref } from '../locales/strings';
import { useLiquidGlass, GLASS_PARAMS, GLASS_SATURATION } from './JadeGlass';

type SdkKey = 'web' | 'py' | 'py2' | 'ey' | 'vol';

// 图标：能用真实品牌 logo 的用真实 logo（彩色 SVG，存于 public/sdk/，devicon 来源）；
// 易语言 / 火山无公开 logo，用品牌色「字徽」（比抽象线条统一、清晰）。
const SDK_ICON: Record<string, { type: 'img'; src: string } | { type: 'char'; char: string; color: string }> = {
  web: { type: 'img', src: '/sdklogo/javascript.svg' },
  py: { type: 'img', src: '/sdklogo/python.svg' },
  py2: { type: 'img', src: '/sdklogo/python.svg' },
  ey: { type: 'char', char: '易', color: '#2b7de9' },
  vol: { type: 'char', char: '火', color: '#e8533f' },
};

// 结构（key/链接）固定；标题与描述走 useT()（见 ../locales/strings）。
const SDK_GROUPS: { key: 'frontend' | 'more'; items: { key: SdkKey; link: string }[] }[] = [
  {
    key: 'frontend',
    items: [
      { key: 'web', link: '/web-sdk' },
      { key: 'py', link: '/python-sdk' },
      { key: 'py2', link: '/python-sdk2' },
    ],
  },
  {
    key: 'more',
    items: [
      { key: 'ey', link: '/easy-language-sdk' },
      { key: 'vol', link: '/voldp-sdk' },
    ],
  },
];

const SDK_LINKS = ['/sdk', ...SDK_GROUPS.flatMap((g) => g.items.map((i) => i.link))];

// 「文档」下拉的两张大卡片（仿 lobehub.com 顶部导航左侧大卡片）：顶部色块 + 图标 + 页数角标，下方标题/描述。
// 标题/描述走 useT()；这里只放结构（key/链接/图标/配色）。
const DOCS_SECTIONS = [
  {
    key: 'spec' as const,
    link: '/docs/spec',
    icon: <BookOpen size={18} />,
    grad: 'linear-gradient(135deg, rgba(0,126,229,0.22), rgba(0,126,229,0.04))',
    iconBg: '#007ee5',
  },
  {
    key: 'api' as const,
    link: '/docs/api',
    icon: <Code2 size={18} />,
    grad: 'linear-gradient(135deg, rgba(124,77,255,0.22), rgba(0,200,170,0.10))',
    iconBg: 'linear-gradient(135deg, #7c4dff, #00c8aa)',
  },
];

// 「产品」下拉的两张卡片（复用「文档」的 docBig 卡壳）：JadePack / Jade EC 查看器。
// 标题/描述走 useT()（见 ../locales/strings 的 navbar.products）；logo 为各产品自带的 app 图标（public/product/）。
const PRODUCTS = [
  { key: 'jadepack' as const, link: '/jadepack', logo: '/product/jadepack.svg' },
  { key: 'jadeEc' as const, link: '/jade-ec', logo: '/product/jade-ec.svg' },
];

const useStyles = createStyles(({ css, token, cx, isDarkMode }) => {
  // 玻璃胶囊很通透，导航文字必须高对比：深色纯白、浅色纯黑，避免与背后折射画面糊在一起。
  const fg = isDarkMode ? '#fff' : '#000';
  return {
  nav: css`
    display: flex;
    align-items: center;
    gap: 2px;
  `,
  item: css`
    cursor: pointer;
    user-select: none;

    display: inline-flex;
    gap: 4px;
    align-items: center;

    height: 36px; /* 与右侧动作按钮（GitHub 等 36px）等高 */
    padding: 0 14px;
    border: none;
    border-radius: 9999px;

    font-size: 14px;
    font-weight: 500;
    line-height: 1;
    color: ${fg};
    white-space: nowrap;
    text-decoration: none;

    background: transparent;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;

    &:hover {
      color: ${fg};
      background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};
    }

    /* 窄桌面（576–767，>575 仍是横排导航但空间吃紧）：收紧内边距，配合 Header 的「图标 Logo + 小间距」
       让 5 个导航项仍能完整排下、不被胶囊 overflow:hidden 裁切。 */
    @media (max-width: 767.98px) {
      gap: 2px;
      padding: 0 9px;
    }
  `,
  // 激活项：磨砂底牌——半透明白/黑底 + 背景模糊，让当前页在通透玻璃上清晰凸出。
  //（backdrop-filter 若被胶囊自身 transform 掐断，半透明底色仍保证可读。）
  active: css`
    color: ${fg};
    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)'};
    backdrop-filter: blur(8px) saturate(150%);
    -webkit-backdrop-filter: blur(8px) saturate(150%);
    box-shadow: ${isDarkMode
      ? '0 0 0 1px rgba(255, 255, 255, 0.12) inset'
      : '0 0 0 1px rgba(0, 0, 0, 0.08) inset'};
  `,
  chevron: css`
    width: 14px;
    height: 14px;
    opacity: 0.55;
    transition: transform 0.2s ease;
  `,
  chevronOpen: css`
    transform: rotate(180deg);
  `,
  // 共享下拉「定位层」：portal 到 body、fixed 定位；left/top 由 motion 动画（用非 transform 属性，
  //   避免成为 backdrop 根而掐断子级玻璃层的背景模糊）。
  ddPositioner: css`
    position: fixed;
    z-index: 1100;
  `,
  // 玻璃「面板层」：背景与标题栏胶囊一致（colorBgContainer 72% + saturate180% blur16）。
  //   关键：背景模糊只会被「祖先」的 transform/filter 破坏；面板自身做 layout 形变（transform）不影响自己的 backdrop。
  //   故定位层只动 left/top（非 transform），面板层可安心用 motion layout 做尺寸形变。
  panel: css`
    position: relative;
    overflow: hidden;

    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 18px;

    background: color-mix(in srgb, ${token.colorBgContainer} 72%, transparent);
    box-shadow:
      0 12px 40px -8px rgba(0, 0, 0, 0.18),
      0 2px 8px -2px rgba(0, 0, 0, 0.1);

    backdrop-filter: saturate(180%) blur(16px);
    -webkit-backdrop-filter: saturate(180%) blur(16px);
  `,
  card: css`
    overflow: hidden;
    width: max-content;
    max-width: 560px;
  `,
  cols: css`
    display: flex;
    gap: 28px;
    padding: 20px 22px;
  `,
  col: css`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 200px;
  `,
  colTitle: css`
    margin: 0 0 6px;
    padding-inline-start: 10px;

    font-size: 12px;
    font-weight: 500;
    color: ${token.colorTextTertiary};
    letter-spacing: 0.02em;
    text-transform: uppercase;
  `,
  menuItem: css`
    display: flex;
    gap: 12px;
    align-items: flex-start;

    padding: 8px 10px;
    border-radius: 10px;

    color: inherit;
    text-decoration: none;

    transition: background-color 0.15s ease;

    &:hover {
      background: ${token.colorFillTertiary};
    }
  `,
  // 真实 logo 容器：中性浅底，img 居中（logo 自带配色）
  icon: css`
    overflow: hidden;
    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 36px;
    height: 36px;
    border-radius: 9px;

    background: ${token.colorFillSecondary};

    img {
      width: 22px;
      height: 22px;
      object-fit: contain;
    }
  `,
  // 字徽（易语言 / 火山）：品牌色底 + 白字
  iconChar: css`
    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 36px;
    height: 36px;
    border-radius: 9px;

    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    color: #fff;
  `,
  mTitle: css`
    display: block;

    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    color: ${token.colorText};
  `,
  mDesc: css`
    display: block;

    margin-top: 3px;
    font-size: 12px;
    line-height: 1.4;
    color: ${token.colorTextSecondary};
  `,
  // 底部「SDK 下载中心」高亮卡片条（仿 lobehub.com 下拉底部那条）：整条可点，hover 浅底 + 箭头微移。
  footer: css`
    padding: 8px 10px;
    border-top: 1px solid ${token.colorBorderSecondary};
  `,
  downloadCard: css`
    display: flex;
    gap: 12px;
    align-items: center;

    padding: 10px 12px;
    border-radius: 12px;

    color: inherit;
    text-decoration: none;

    transition: background-color 0.15s ease;

    &:hover {
      background: ${token.colorFillTertiary};
    }
    &:hover .jade-dl-arrow {
      color: ${token.colorText};
      transform: translateX(3px);
    }
  `,
  // 图标徽标：品牌渐变底 + 白色下载图标（与卡片其余图标体量一致）
  downloadIcon: css`
    flex-shrink: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 36px;
    height: 36px;
    border-radius: 9px;

    color: #fff;
    background: linear-gradient(135deg, #2b9bff, #007ee5);
  `,
  downloadBody: css`
    overflow: hidden;
    flex: 1;
    min-width: 0;
  `,
  downloadTitle: css`
    display: block;

    font-size: 14px;
    font-weight: 600;
    line-height: 1.3;
    color: ${token.colorText};
  `,
  downloadDesc: css`
    display: block;

    margin-top: 2px;
    font-size: 12px;
    line-height: 1.4;
    color: ${token.colorTextSecondary};
  `,
  downloadArrow: css`
    flex-shrink: 0;
    color: ${token.colorTextTertiary};
    transition: transform 0.15s ease, color 0.15s ease;
  `,
  // 「文档」下拉：大卡片网格（参考图左侧 Marketplace 卡片）
  docCard: css`
    display: flex;
    gap: 12px;
    padding: 16px;
  `,
  docBig: css`
    display: flex;
    flex-direction: column;
    overflow: hidden;

    width: 232px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 14px;

    color: inherit;
    text-decoration: none;

    background: ${token.colorBgContainer};
    transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;

    &:hover {
      border-color: ${token.colorBorder};
      box-shadow: ${token.boxShadowTertiary};
      transform: translateY(-2px);
    }
    &:hover .jade-doc-arrow {
      opacity: 1;
      transform: translateX(2px);
    }
  `,
  docMedia: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    height: 78px;
    padding: 14px;
  `,
  docMediaIcon: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 34px;
    height: 34px;
    border-radius: 10px;

    color: #fff;
  `,
  docCount: css`
    font-size: 12px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
    font-variant-numeric: tabular-nums;
  `,
  docBody: css`
    padding: 12px 14px 14px;
  `,
  docCardTitle: css`
    display: flex;
    gap: 4px;
    align-items: center;

    font-size: 15px;
    font-weight: 600;
    color: ${token.colorText};
  `,
  docArrow: css`
    flex-shrink: 0;
    opacity: 0;
    color: ${token.colorTextTertiary};
    transition: transform 0.18s ease, opacity 0.18s ease;
  `,
  docCardDesc: css`
    margin-top: 4px;
    font-size: 12.5px;
    line-height: 1.5;
    color: ${token.colorTextSecondary};
  `,
  prodInner: css`
    display: flex;
    flex-direction: column;
    padding: 16px;
  `,
  prodLogo: css`
    width: 46px;
    height: 46px;
    margin-bottom: 12px;
    border-radius: 11px;
  `,
  };
});

export default memo(function JadeNavbar() {
  const { styles, cx } = useStyles();
  const t = useT();
  const base = useLocaleBase();
  const L = (link?: string) => localeHref(base, link); // 站内链接补当前语言前缀
  // 顶部导航标题本地化：link 不变，按 link 取字典标题（themeConfig.nav 里的中文标题被覆盖）。
  const navTitle = (item: any): string => {
    const l = String(item.link || '');
    if (l.startsWith('/docs')) return t.nav.docs;
    if (l === '/sdk' || item.title === 'SDKs') return t.nav.sdks;
    if (l === '/jadepack' || item.title === '产品') return t.nav.products;
    if (l === '/showcase') return t.nav.showcase;
    if (l === '/releases') return t.nav.releases;
    return item.title;
  };
  const nav = useSiteStore((s: any) => s.navData) || [];
  const { pathname } = useLocation();
  const fullSidebar = useFullSidebarData();
  const theme = useTheme() as any;
  // 下拉面板的「液态玻璃」：与标题栏胶囊同款位移折射；圆角对齐面板自身(18)。
  // 注意「背景模糊铁律」：面板的 backdrop-filter 只会被「祖先」transform 掐断 → 故 scale 弹入动画必须放在
  //   面板自身（自身 transform 不破坏自身 backdrop），定位层只动 left/top/opacity（见下方面板/定位层）。
  const panelGlass = useLiquidGlass({ ...GLASS_PARAMS, borderRadius: 18 });
  // 霜底「透明度 70%」= 不透明度 30%（按深浅模式取色：colorBgContainer 浅色白/深色暗，只是把 alpha 统一到 30%）。
  // 足够通透才能看清液态玻璃折射（之前 50% 太实、把折射糊没了）。
  const panelGlassStyle = panelGlass.supported
    ? {
        background: `color-mix(in srgb, ${theme.colorBgContainer} 68%, transparent)`,
        backdropFilter: `url(#${panelGlass.filterId}) saturate(${GLASS_SATURATION})`,
        WebkitBackdropFilter: 'saturate(180%) blur(16px)',
      }
    : {};
  // 共享下拉：active=当前展开的菜单；coords=面板 fixed 定位（落在触发器所在胶囊下方、并相对触发器居中）。
  const [active, setActive] = useState<'docs' | 'sdk' | 'products' | null>(null);
  const [coords, setCoords] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [mounted, setMounted] = useState(false);
  const closeTimer = useRef<any>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const centerXRef = useRef(0); // 当前激活触发器的水平中心（用于把面板居中其下）
  const widthCache = useRef<Record<'docs' | 'sdk' | 'products', number>>({ docs: 510, sdk: 474, products: 510 }); // 面板宽度缓存（实测自愈）
  useEffect(() => setMounted(true), []);

  const matches = (link: string) => {
    if (link === '/') return pathname === '/';
    return pathname === link || pathname.startsWith(link + '/');
  };
  const sdkActive = SDK_LINKS.some((l) => matches(l));
  const productsActive = ['/jadepack', '/jade-ec'].some((l) => matches(l));

  // 「文档」项链接到 /docs/spec，但需在整个文档主路由（含 /docs/api 子分区）下都高亮。
  const itemActive = (link: string) =>
    link?.startsWith('/docs') ? pathname === '/docs' || pathname.startsWith('/docs/') : matches(link);

  // 某文档分区（/docs/spec、/docs/api）下的文档篇数 —— 作为大卡片右上角角标。
  const countOf = (prefix: string) => {
    const entry: any = (fullSidebar as any)?.[prefix];
    const groups = Array.isArray(entry) ? entry : [];
    return groups.reduce((n: number, g: any) => n + (g?.children?.length || 0), 0);
  };

  const isSdk = (item: any) => item.title === 'SDKs' || item.link === '/sdk';
  const isDocs = (item: any) => String(item.link || '').startsWith('/docs');
  const isProducts = (item: any) => item.title === '产品' || item.link === '/jadepack';
  const menuOf = (item: any): 'docs' | 'sdk' | 'products' | null =>
    isSdk(item) ? 'sdk' : isProducts(item) ? 'products' : isDocs(item) ? 'docs' : null;

  // 悬停某个带下拉的触发器：测量其所在胶囊底边 → 面板定位到「胶囊下方 12px」、并相对触发器水平居中。
  // 切换菜单时 active/coords 变化驱动面板滑动 + 内容交叉淡入（见下方共享面板）。
  const openMenu = (key: 'docs' | 'sdk' | 'products', el: HTMLElement) => {
    clearTimeout(closeTimer.current);
    const cap = (el.closest('.jade-capsule-header') as HTMLElement) || el;
    const tr = el.getBoundingClientRect();
    const cr = cap.getBoundingClientRect();
    const centerX = tr.left + tr.width / 2;
    centerXRef.current = centerX;
    setCoords({ left: Math.round(centerX - widthCache.current[key] / 2), top: Math.round(cr.bottom + 12) });
    setActive(key);
  };
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActive(null), 140);
  };

  // 面板挂载/切换后实测宽度，精确居中（缓存自愈，应对内容变化）。openMenu 已用缓存宽度先行估算，
  // 故此处通常仅微调、不产生可见跳动。
  useEffect(() => {
    if (!active || !panelRef.current) return;
    const w = panelRef.current.offsetWidth;
    if (!w) return;
    widthCache.current[active] = w;
    const target = Math.round(centerXRef.current - w / 2);
    setCoords((c) => (Math.abs(c.left - target) > 1 ? { ...c, left: target } : c));
  }, [active]);

  // 触发项右侧的下拉箭头（SDKs / 文档共用）
  const chevron = (o: boolean) => (
    <svg
      className={cx(styles.chevron, o && styles.chevronOpen)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );

  const docsCard = (
    <div className={styles.docCard}>
      {DOCS_SECTIONS.map((s) => {
        const n = countOf(s.link);
        return (
          <Link key={s.link} className={styles.docBig} to={L(s.link)}>
            <div className={styles.docMedia} style={{ background: s.grad }}>
              <span className={styles.docMediaIcon} style={{ background: s.iconBg }}>
                {s.icon}
              </span>
              {n > 0 && <span className={styles.docCount}>{n}{t.navbar.countSuffix}</span>}
            </div>
            <div className={styles.docBody}>
              <span className={styles.docCardTitle}>
                {t.navbar.docsSections[s.key].title}
                <ChevronRight className={cx(styles.docArrow, 'jade-doc-arrow')} size={15} />
              </span>
              <span className={styles.docCardDesc}>{t.navbar.docsSections[s.key].desc}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );

  const megaCard = (
    <div className={styles.card}>
      <div className={styles.cols}>
        {SDK_GROUPS.map((g) => (
          <div key={g.key} className={styles.col}>
            <p className={styles.colTitle}>{t.navbar.sdkGroupTitles[g.key]}</p>
            {g.items.map((it) => {
              const ic = SDK_ICON[it.key];
              return (
                <Link key={it.link} className={styles.menuItem} to={L(it.link)}>
                  {ic.type === 'img' ? (
                    <span className={styles.icon}>
                      <img alt="" src={ic.src} />
                    </span>
                  ) : (
                    <span className={styles.iconChar} style={{ background: ic.color }}>
                      {ic.char}
                    </span>
                  )}
                  <span>
                    <span className={styles.mTitle}>{t.navbar.sdk[it.key].title}</span>
                    <span className={styles.mDesc}>{t.navbar.sdk[it.key].desc}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        <Link className={styles.downloadCard} to={L('/download')}>
          <span className={styles.downloadIcon}>
            <Download size={18} strokeWidth={2.2} />
          </span>
          <span className={styles.downloadBody}>
            <span className={styles.downloadTitle}>{t.navbar.download.title}</span>
            <span className={styles.downloadDesc}>{t.navbar.download.desc}</span>
          </span>
          <ChevronRight className={cx(styles.downloadArrow, 'jade-dl-arrow')} size={18} />
        </Link>
      </div>
    </div>
  );

  // 「产品」下拉：复用「文档」的卡壳（docBig），展示各产品自带 app 图标 + 标题/描述。
  const productsCard = (
    <div className={styles.docCard}>
      {PRODUCTS.map((p) => (
        <Link key={p.link} className={styles.docBig} to={L(p.link)}>
          <div className={styles.prodInner}>
            <img className={styles.prodLogo} src={p.logo} alt="" />
            <span className={styles.docCardTitle}>
              {t.navbar.products[p.key].title}
              <ChevronRight className={cx(styles.docArrow, 'jade-doc-arrow')} size={15} />
            </span>
            <span className={styles.docCardDesc}>{t.navbar.products[p.key].desc}</span>
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <nav className={styles.nav}>
      {nav.map((item: any) => {
        const key = String(item.activePath || item.link);
        const menu = menuOf(item);
        if (menu) {
          // 带下拉的触发器（文档 / SDKs）：悬停打开共享面板；点击仍按链接跳转。
          const itemActiveNow = menu === 'sdk' ? sdkActive : menu === 'products' ? productsActive : itemActive(item.link);
          return (
            <Link
              key={key}
              className={cx(styles.item, itemActiveNow && styles.active)}
              onMouseEnter={(e) => openMenu(menu, e.currentTarget as HTMLElement)}
              onMouseLeave={scheduleClose}
              to={L(item.link || (menu === 'sdk' ? '/sdk' : '/docs/spec'))}
            >
              {navTitle(item)}
              {chevron(active === menu)}
            </Link>
          );
        }
        return (
          <Link key={key} className={cx(styles.item, itemActive(item.link) && styles.active)} to={L(item.link)}>
            {navTitle(item)}
          </Link>
        );
      })}

      {/* 共享下拉面板：portal 到 body、fixed 定位。切换菜单时整张面板滑动到新触发器下方（动画 left/top），
          尺寸用 motion layout 形变，内容用 AnimatePresence 交叉淡入淡出。 */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {active && (
              <motion.div
                key="jade-nav-dropdown"
                // 定位层「任何时刻都不能有 transform 或 opacity<1」（祖先的 transform/opacity 都会掐断面板玻璃的
                //   背景折射，导致「动画完才有玻璃」）→ 这里只动 left/top（非 transform、非 opacity）。
                //   淡入(opacity) + 缩放(scale) 全部下放到「带玻璃的面板自身」。
                animate={{ left: coords.left, top: coords.top }}
                className={styles.ddPositioner}
                initial={{ left: coords.left, top: coords.top }}
                onMouseEnter={() => clearTimeout(closeTimer.current)}
                onMouseLeave={scheduleClose}
                transition={{
                  // 切换触发器时的「来回滑动」：用 duration+bounce 的弹簧，bounce 0.42 给明显过冲回弹 → iOS Q 弹手感。
                  left: { type: 'spring', duration: 0.52, bounce: 0.42 },
                  top: { type: 'spring', duration: 0.52, bounce: 0.42 },
                }}
              >
                <motion.div
                  // iOS 风：从顶边中心淡入 + 轻微缩放弹入。opacity/scale 都在「面板自身」上 —— 自身的
                  //   transform/opacity 不破坏自身 backdrop → 玻璃从出现第一帧就在（淡入/缩放过程中持续折射）。
                  animate={{ opacity: 1, scale: 1 }}
                  className={styles.panel}
                  exit={{ opacity: 0, scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  layout="size"
                  ref={(el) => {
                    panelRef.current = el;
                    panelGlass.ref(el);
                  }}
                  style={{ transformOrigin: 'top center', ...panelGlassStyle }}
                  transition={{
                    default: { type: 'spring', stiffness: 360, damping: 26 }, // scale 弹入（轻微回弹）
                    layout: { type: 'spring', duration: 0.52, bounce: 0.42 }, // 尺寸随触发器切换 Q 弹形变，与滑动同手感
                    opacity: { duration: 0.16, ease: 'easeOut' },
                  }}
                >
                  {panelGlass.svg}
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.div
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      initial={{ opacity: 0 }}
                      key={active}
                      onClick={() => setActive(null)}
                      transition={{ duration: 0.16 }}
                    >
                      {active === 'docs' ? docsCard : active === 'products' ? productsCard : megaCard}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </nav>
  );
});
