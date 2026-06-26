// 覆盖 lobehub 的 DocumentLayout：唯一目的——给「侧栏在 mobile 断点的显隐」加 motion 动画。
//
// 背景：lobehub 原版用 @lobehub/ui 的 <Layout>，其内部写死 `!mobile && sidebar && <aside>`，
//   即过窄到 mobile 断点(≤575)时把整个 <aside> 直接卸载、变宽时再挂载 —— 纯 mount/unmount，
//   无任何过渡（用户反馈「出现和消失没有动画」）。motion 在 Sidebar slot 内部抓不到这个 exit
//   （元素已被 React 卸载），所以必须在「布局层」让侧栏始终挂载，改用动画收起宽度。
//
// 做法：不再用 <Layout> 的 sidebar 分支，改为按 <Layout> 同款结构自建外壳
//   （LayoutHeader / LayoutMain / LayoutToc / LayoutFooter 均由 @lobehub/ui 主包直出，
//    与原版逐像素一致），仅把 aside 换成常驻的 motion.aside：
//     · 文档页恒定挂载；宽度在 sidebarWidth ↔ 0、透明度 1 ↔ 0 间动画（!mobile 控制）；
//     · align-self:flex-start + 显式视口高度 —— 顺手根治原 aside 因 main 的 align-items:stretch
//       被拉伸到正文全高、导致 position:sticky 失去可粘滞行程而「跟随页面滚动」的隐患；
//     · 去掉 DraggablePanel（其宽度/折叠已被 .dumirc 全局 CSS 架空，留之无益且是 sticky 隐患源）。
//
// 导入约束：不引用 `dumi/theme/*` 子路径别名（dev 下 .dumi/tmp 重建会致 'dumi' 解析报错）；
//   本地覆盖的 slot 走相对路径，未覆盖的主题内部件/页面/ store 一律走 `dumi-theme-lobehub/dist/*`。
import { LayoutFooter, LayoutHeader, LayoutMain, LayoutToc } from '@lobehub/ui';
import { useResponsive, useTheme } from 'antd-style';
import { Helmet, useIntl, useLocation } from 'dumi';
import isEqual from 'fast-deep-equal';
import { motion } from 'motion/react';
import { memo, useCallback, useEffect } from 'react';
// @ts-ignore 主题内部页面/ slot / store，深层路径无类型声明
import Changelog from 'dumi-theme-lobehub/dist/pages/Changelog';
// @ts-ignore
import Docs from 'dumi-theme-lobehub/dist/pages/Docs';
// @ts-ignore
import Home from 'dumi-theme-lobehub/dist/pages/Home';
// 本地自定义页底（栏目本地化 + 语言切换移到这里）；是普通组件、非 slot，避免触发 .dumi/tmp 重扫崩坏
import Footer from '../../components/JadeFooter';
// @ts-ignore
import { heroSelectors, siteSelectors, useSiteStore } from 'dumi-theme-lobehub/dist/store';
// 本地覆盖的 slot（相对路径，避免 dumi/theme/* 别名）
import Header from '../../slots/Header';
import Sidebar from '../../slots/Sidebar';
import Toc from '../../slots/Toc';
// 文档主路由面包屑（antd Breadcrumb），注入到 Docs 正文顶部
import DocBreadcrumb from '../../components/DocBreadcrumb';

export default memo(function DocumentLayout({ children }: any) {
  const intl = useIntl();
  const { hash } = useLocation();
  const theme = useTheme() as any;
  const { mobile, laptop } = useResponsive();

  const { loading, page, siteTitle, noToc } = useSiteStore((s: any) => {
    // lobehub 的 heroSelectors.isHeroPage 写死 pathname==='/'，不认 /en-US 这类「语言根」→
    // 英文首页被当成文档页（出现侧栏、Hero/极光消失、正文偏右）。改为「pathname == 当前语言 base 根」
    // 即首页，兼容多语言（zh base '/'，en base '/en-US'）。
    const norm = (pp: string) => (pp !== '/' && pp.endsWith('/') ? pp.slice(0, -1) : pp);
    const localeBase = norm(s.locale?.base || '/');
    const isHomePage = norm(s.location.pathname) === localeBase;
    const isChangelogPage = s.location.pathname === `${localeBase === '/' ? '' : localeBase}/changelog`;
    const p = isHomePage ? 'home' : isChangelogPage ? 'changelog' : 'docs';
    return {
      loading: s.siteData.loading,
      noToc: siteSelectors.tocAnchorItem(s).length === 0,
      page: p,
      siteTitle: siteSelectors.siteTitle(s),
    };
  });
  const fm = useSiteStore((s: any) => s.routeMeta.frontmatter, isEqual);

  // 侧栏是否「适用」（文档页且未在 frontmatter 关闭）—— 决定是否挂载 aside / 是否给左侧占位
  const sidebarApplicable = page === 'docs' && fm.sidebar !== false;
  // 是否展开显示（适用 且 非 mobile）；mobile 下保持挂载但宽度动画收起到 0
  const showSidebar = sidebarApplicable && !mobile;

  const shouldHideToc = fm.toc === false || noToc;
  const hideToc = mobile ? shouldHideToc : !laptop || shouldHideToc;

  // 移动端不再在顶栏内放 TOC 行（与悬浮胶囊冲突，已移除），故无需额外 +36
  const headerHeight = theme.headerHeight;
  const tocWidth = hideToc ? 0 : theme.tocWidth;
  const asideWidth = theme.sidebarWidth;

  const HelmetBlock = useCallback(
    () => (
      <Helmet>
        <html lang={intl.locale.replace(/-.+$/, '')} />
        {fm.title && <meta content={fm.title} property="og:title" />}
        {fm.description && <meta content={fm.description} name="description" />}
        {fm.description && <meta content={fm.description} property="og:description" />}
        {fm.keywords && <meta content={fm.keywords.join(',')} name="keywords" />}
        {fm.keywords && <meta content={fm.keywords.join(',')} property="og:keywords" />}
        {!fm.title || page === 'home' ? (
          <title>{siteTitle}</title>
        ) : (
          <title>{siteTitle ? `${fm.title}-${siteTitle}` : fm.title}</title>
        )}
      </Helmet>
    ),
    [intl, fm, siteTitle, page],
  );

  // 处理 hash 滚动（异步 chunk 加载后跳转锚点）—— 与原版一致
  useEffect(() => {
    const id = hash.replace('#', '');
    if (!id) return;
    setTimeout(() => {
      const elm = document.querySelector(`#${decodeURIComponent(id)}`);
      if (elm) {
        elm.scrollIntoView();
        window?.scrollBy({ top: -80 });
      }
    }, 1);
  }, [loading, hash]);
  useEffect(() => {
    document.body.scrollTo(0, 0);
  }, [siteTitle]);

  const toc = hideToc ? null : <Toc />;

  return (
    <>
      <HelmetBlock />
      <div style={{ ['--layout-header-height' as any]: `${headerHeight}px` }}>
        <LayoutHeader headerHeight={headerHeight}>
          <Header />
        </LayoutHeader>
        <LayoutMain>
          {/* 侧栏不适用（首页/变更日志/ fm.sidebar=false）且桌面端：左侧占位，保持正文居中（与原版一致） */}
          {!mobile && !sidebarApplicable && <nav style={{ width: tocWidth }} />}
          {/* 侧栏适用：恒定挂载的 motion.aside —— 宽度/透明度随 showSidebar 平滑收展，两个方向都有过渡 */}
          {sidebarApplicable && (
            <motion.aside
              animate={{ width: showSidebar ? asideWidth : 0, opacity: showSidebar ? 1 : 0 }}
              initial={false}
              style={{
                position: 'sticky',
                zIndex: 2,
                top: 'var(--layout-header-height, 80px)',
                alignSelf: 'flex-start', // 关键：抵消 main 的 align-items:stretch，避免 aside 被拉到正文全高而 sticky 失效
                height: 'calc(100dvh - var(--layout-header-height, 80px))',
                flexShrink: 0,
                overflow: 'hidden', // 宽度收起时裁剪内容（作用于 sticky 元素自身，不影响其吸顶）
              }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* 内层固定宽度：收起动画期间内容不重排，仅被外层裁剪 */}
              <div style={{ width: asideWidth, height: '100%', overflow: 'hidden' }}>
                {/* 页面载入飘入：整列作为一个单元上飘 + 去雾化 + 微缩放，沿用 floatIn.ts 的招牌
                    欠阻尼 spring 与淡入/去模糊时序，和首屏 Hero / 标题栏胶囊的「飘带」观感一致；
                    竖向窄列改用上飘(去掉大幅 rotateX，否则会被外层 overflow 裁切)。
                    仅首次挂载播放(initial→animate)：docs 间切换侧栏常驻不重播；mobile↔桌面的
                    收展由外层 aside 的 width/opacity 负责，二者互不干扰。 */}
                <motion.div
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  initial={{ opacity: 0, y: 28, scale: 0.98, filter: 'blur(10px)' }}
                  style={{ height: '100%' }}
                  transition={{
                    type: 'spring',
                    stiffness: 46,
                    damping: 11,
                    mass: 1.1,
                    opacity: { duration: 0.8, ease: 'easeOut' },
                    filter: { duration: 0.9, ease: 'easeOut' },
                  }}
                >
                  <Sidebar />
                </motion.div>
              </div>
            </motion.aside>
          )}
          <section style={{ position: 'relative', flex: 1, maxWidth: '100%' }}>
            {page === 'home' && <Home>{children}</Home>}
            {page === 'changelog' && <Changelog>{children}</Changelog>}
            {page === 'docs' && (
              <Docs>
                <DocBreadcrumb />
                {children}
              </Docs>
            )}
          </section>
          {!mobile && toc && <LayoutToc tocWidth={tocWidth}>{toc}</LayoutToc>}
        </LayoutMain>
        <LayoutFooter>
          <Footer />
        </LayoutFooter>
      </div>
    </>
  );
});
