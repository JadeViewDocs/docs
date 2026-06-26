// 覆盖 lobehub 的 Header slot：标题栏 = lobehub.com 那种「悬浮胶囊」，所有形态切换都有 iOS 动画。
//
// 三种形态：
//   · ≥768  桌面：单胶囊 = 图标 + 「JadeView」文字 + 横排导航 + 右侧动作（Discord/语言/主题/GitHub）
//   · 576–767 窄桌面：单胶囊 = 图标（文字收起）+ 收紧的横排导航（见 JadeNavbar 媒体查询）+ 右侧动作
//   · ≤575  手机：左右「两个独立胶囊」——左=汉堡+图标，右=搜索；Head 透明（导航收进汉堡抽屉 JadeBurger）。
//
// 动画分两类：
//  1) 桌面 ↔ 窄桌面（同一套单胶囊内）：Logo 文字常驻挂载，spring 动画其 width/opacity；导航容器同步动画 marginLeft。
//     文字宽度连续收缩时 flex 每帧重排 → 导航平滑滑动到位（不用 layout/AnimatePresence，避免「闪现」）。
//  2) 单胶囊 ↔ 手机双胶囊（跨 575）：两套结构都用 absolute 叠放，AnimatePresence 交叉淡入淡出（桌面侧再加轻微缩放）。
//
// 背景模糊铁律：backdrop-filter 只会被「祖先」的 transform 破坏，不被「自身」transform 破坏。故：
//   · 飘入/缩放等 transform 必须作用在「带 backdrop-filter 的那个元素自身」（桌面胶囊 / 各 pill），不能套在其祖先上；
//   · 手机双胶囊的外层 section 透明、是 pill 的祖先 → 它「静止时绝不能留 transform」，所以手机侧交叉淡入只用 opacity
//     （不用 scale，scale:1 也会残留 transform 掐断 pill 模糊）；桌面胶囊自身带模糊，可安心用 scale。
//   · 最外层 wrapper 不加任何 transform（仅 position:relative 定位），承载 .jade-capsule-header 类名供全局 CSS 命中。
//   · 导航下拉面板 portal 到 body，不是胶囊子级，不受影响。
//
// 导入约束：不引用 `dumi/theme/slots/*` 别名（dev 下 .dumi/tmp 重建会致 'dumi' 解析报错）；
//   未覆盖的主题内部件/ store 走 `dumi-theme-lobehub/dist/*`，本地组件走相对路径。
import { useResponsive, useTheme } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { floatItemNoBlur, floatStyle } from '../../components/floatIn';
import { useLiquidGlass, GLASS_PARAMS, GLASS_BG_OPACITY, GLASS_SATURATION } from '../../components/JadeGlass';
// @ts-ignore 主题 store / selectors，深层路径无类型声明
import { siteSelectors, useSiteStore } from 'dumi-theme-lobehub/dist/store';
import Navbar from '../../components/JadeNavbar';
import Burger from '../../components/JadeBurger';
import MobileSearch from '../../components/JadeMobileSearch';
// @ts-ignore
import DiscordButton from 'dumi-theme-lobehub/dist/slots/Header/DiscordButton';
// @ts-ignore
import GithubButton from 'dumi-theme-lobehub/dist/slots/Header/GithubButton';
// @ts-ignore
import ThemeSwitch from 'dumi-theme-lobehub/dist/slots/Header/ThemeSwitch';

// 形态内重排（Logo 文字 / 导航间距）与跨形态交叉淡入共用的 iOS 手感 spring。
const reflow = { type: 'spring', stiffness: 300, damping: 30 } as const;
const swap = { type: 'spring', stiffness: 280, damping: 30 } as const;

// 手机端单个胶囊药丸：各自持有一份独立的液态玻璃滤镜（尺寸不同 → 位移贴图需各自生成）。
// decorate(supported, filterId) 由 Header 传入（闭包里取主题色 / 滚动态），按是否支持选玻璃或回退磨砂。
const GlassPill = memo(function GlassPill({
  baseStyle,
  decorate,
  children,
}: {
  baseStyle: CSSProperties;
  decorate: (supported: boolean, filterId: string) => CSSProperties;
  children: ReactNode;
}) {
  const glass = useLiquidGlass(GLASS_PARAMS);
  return (
    <div className="jade-mpill" ref={glass.ref} style={{ ...baseStyle, ...decorate(glass.supported, glass.filterId) }}>
      {glass.svg}
      {children}
    </div>
  );
});

export default memo(function Header() {
  const hasHeader = useSiteStore((s: any) => Boolean(s.routeMeta.frontmatter));
  const config = useSiteStore(siteSelectors.themeConfig, isEqual);
  const { mobile, tablet } = useResponsive();
  const theme = useTheme() as any;
  const [scrolled, setScrolled] = useState(false);
  // 首屏「飘带飘入」只在首次加载播一次；之后跨 575 的形态切换走交叉淡入（不重播飘入）。
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 4);
    onScroll(); // 初始化（刷新后可能不在顶部）
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 1300);
    return () => clearTimeout(t);
  }, []);

  // 桌面单胶囊的液态玻璃滤镜（hook 必须在任何提前 return 之前无条件调用）。
  const capsuleGlass = useLiquidGlass(GLASS_PARAMS);

  if (!hasHeader) return null;

  const showBrand = tablet; // ≥768 才显示「JadeView」文字（窄桌面收起，给横排导航腾空间）
  const logoSrc = (config && (config as any).logo) || '/favicon.png';
  const brand = (config && (config as any).name) || 'JadeView';

  const dark = theme.isDarkMode ?? (theme.appearance ? theme.appearance === 'dark' : true);
  // 回退态（Safari/FF/不支持位移滤镜）仍用较实的磨砂底保证可读；玻璃态用极薄霜底让背后画面折射透出。
  const glassBg = `color-mix(in srgb, ${theme.colorBgContainer} 72%, transparent)`;
  // reactbits backgroundOpacity=0.1：霜底极薄，否则盖住背景、折射不可见。
  const frostBg = `color-mix(in srgb, ${theme.colorBgContainer} ${Math.round(GLASS_BG_OPACITY * 100)}%, transparent)`;
  const scrolledShadow =
    '0 0 32px -8px rgba(0, 0, 0, 8%), 0 0 16px -4px rgba(0, 0, 0, 10%), 0 0 0 1px var(--ant-color-fill-tertiary) inset';
  const blur = 'saturate(180%) blur(16px)';
  // 玻璃边缘「镜环」内阴影（让胶囊读起来像一块真实玻璃，而非平涂半透明）。
  const rings = dark
    ? '0 0 2px 1px rgba(255, 255, 255, 0.16) inset, 0 0 18px 7px rgba(255, 255, 255, 0.05) inset'
    : '0 1px 0 0 rgba(255, 255, 255, 0.7) inset, 0 0 2px 1px rgba(0, 0, 0, 0.12) inset, 0 0 12px 4px rgba(0, 0, 0, 0.04) inset';
  const edgeRing = dark ? '0 0 0 1px rgba(255, 255, 255, 0.1)' : '0 0 0 1px rgba(0, 0, 0, 0.07)';

  // 玻璃/磨砂二选一的「装饰层」样式（背景 + backdrop-filter + 阴影）。布局尺寸不在此、在各自 baseStyle。
  //  · 支持位移滤镜：backdrop-filter = url(#位移) + saturate（不叠背景 blur，保留清晰折射）；薄霜底 + 镜环内阴影。
  //  · 不支持：维持原来的磨砂胶囊外观。
  const decorate = (supported: boolean, filterId: string): CSSProperties =>
    supported
      ? {
          background: frostBg,
          backdropFilter: `url(#${filterId}) saturate(${GLASS_SATURATION})`,
          WebkitBackdropFilter: blur,
          boxShadow: [rings, edgeRing, scrolled ? scrolledShadow : ''].filter(Boolean).join(', '),
        }
      : {
          background: glassBg,
          backdropFilter: blur,
          WebkitBackdropFilter: blur,
          boxShadow: scrolled ? scrolledShadow : 'none',
        };

  // 桌面单胶囊视觉（圆角 / 内缩 / 磨砂或玻璃）；顶部无描边无阴影，滚动后出现。定位/居中在 JSX 里补。
  const capsuleVisual: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    paddingInline: 10,
    borderRadius: 9999,
    transition: 'box-shadow 0.2s ease, background 0.2s ease',
    ...decorate(capsuleGlass.supported, capsuleGlass.filterId),
  };

  // 手机端单个胶囊药丸的「布局」部分（高度 50，左右内边距 7 使 36px 圆形按钮与圆头同心）；
  // 玻璃/磨砂装饰由 GlassPill 内按各自 supported/filterId 套用。
  const pillBase: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 50,
    paddingInline: 7,
    borderRadius: 9999,
    transition: 'box-shadow 0.2s ease, background 0.2s ease',
  };

  // 跨形态交叉淡入：桌面侧带轻微缩放（自身有模糊，transform 安全）；手机侧仅 opacity（避免残留 transform 掐断 pill 模糊）。
  // 首屏首次加载：桌面播「飘带飘入」（与 Hero 一致），手机仅淡入（飘入的 transform 会留在 pill 祖先上，故避开）。
  const desktopMotion = entered
    ? {
        initial: { opacity: 0, scale: 0.97 },
        animate: { opacity: 1, scale: 1, transition: swap },
        exit: { opacity: 0, scale: 0.98, transition: { duration: 0.18, ease: 'easeOut' } },
      }
    : {
        initial: floatItemNoBlur.hidden,
        animate: floatItemNoBlur.show,
        exit: { opacity: 0, transition: { duration: 0.18 } },
      };
  const mobileMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: entered ? swap : { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.18 } },
  };

  return (
    // 最外层 wrapper：承载 .jade-capsule-header 类名（全局 CSS 据此把 <header> 透明化），仅做定位、绝不加 transform。
    <div className="jade-capsule-header" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <AnimatePresence>
        {mobile ? (
          // 手机：透明壳 + 左右两个独立胶囊（absolute 叠放，便于与桌面胶囊交叉淡入）
          <motion.section
            key="mobile"
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}
            {...mobileMotion}
          >
            <GlassPill baseStyle={pillBase} decorate={decorate}>
              <Burger />
              <a href="/" style={{ display: 'inline-flex', alignItems: 'center', paddingInline: 2 }}>
                <img
                  alt={brand}
                  src={logoSrc}
                  style={{ display: 'block', width: 36, height: 36, borderRadius: 10 }}
                />
              </a>
            </GlassPill>
            <div style={{ flex: 1 }} />
            <GlassPill baseStyle={pillBase} decorate={decorate}>
              <MobileSearch />
            </GlassPill>
          </motion.section>
        ) : (
          // 桌面 / 窄桌面：单胶囊横排。宽度按内容自适应（width:max-content）→ Logo 文字收起时胶囊整体跟着变窄；
          // 用 left/right:0 + marginInline:auto 让这个内容宽的 absolute 元素水平居中；maxWidth 兜底、并以 100% 防溢出窗口。
          // 自身带模糊与飘入/缩放 transform。
          <motion.section
            key="desktop"
            ref={capsuleGlass.ref}
            style={{
              position: 'absolute',
              insetBlock: 0,
              insetInline: 0,
              width: 'max-content',
              // 上限放宽到 860：英文导航词更长（Showcase/Releases），720 会裁掉「Releases」；
              // 中文是 max-content 更窄，不受影响。
              maxWidth: 'min(860px, 100%)',
              marginInline: 'auto',
              ...capsuleVisual,
              ...floatStyle,
            }}
            {...desktopMotion}
          >
            {capsuleGlass.svg}
            <a
              href="/"
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', flex: '0 0 auto', zIndex: 10 }}
            >
              <img
                alt={brand}
                src={logoSrc}
                style={{ display: 'block', width: 32, height: 32, borderRadius: 9, flexShrink: 0 }}
              />
              {/* 文字常驻挂载，靠 width/opacity spring 平滑收起/展开（窄桌面 width→0）。overflow:hidden + nowrap 防换行。 */}
              <motion.span
                animate={{ width: showBrand ? 'auto' : 0, opacity: showBrand ? 1 : 0, marginLeft: showBrand ? 8 : 0 }}
                initial={false}
                style={{
                  display: 'inline-block',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  fontSize: 18,
                  fontWeight: 600,
                  color: dark ? '#fff' : '#000',
                }}
                transition={reflow}
              >
                {brand}
              </motion.span>
            </a>
            {/* 导航容器：marginLeft 即 Logo↔导航间距，随文字收起同步 spring 收紧（48↔16）→ 导航平滑滑动。 */}
            <motion.div
              animate={{ marginLeft: showBrand ? 18 : 12 }}
              initial={false}
              style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', alignItems: 'center', overflow: 'hidden' }}
              transition={reflow}
            >
              <Navbar />
            </motion.div>
            {/* 右侧动作：content-width 胶囊下导航与动作相邻，补一点左间距避免贴太紧。 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto', marginLeft: 10, zIndex: 10 }}>
              <DiscordButton />
              <ThemeSwitch />
              <GithubButton />
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
});
