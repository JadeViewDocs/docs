// 覆盖 lobehub 的 Header slot：把标题栏改成 lobehub.com 那种「悬浮胶囊」样式。
//
// 桌面端：
//   - 内层 <Header>(section) 变成一个圆角、内缩、磨砂(blur)的悬浮胶囊；
//   - 外层 <header>(LayoutHeader) 由全宽磨砂条改为透明、去边框（见 .dumirc.ts 全局样式
//     里的 `header:has(> .jade-capsule-header)`），让胶囊真正“浮”在内容之上；
//   - 页面在顶部时无阴影/无描边，滚动后出现描边 + 柔和阴影。
// 移动端：保持默认结构（仅做顶部无阴影处理），避免与 LayoutToc 叠加导致布局异常。
//
// 结构与 lobehub 原版一致（dist/slots/Header/index.js），仅追加 className/style。
import { Header as Head } from '@lobehub/ui';
import { useResponsive, useTheme } from 'antd-style';
import { motion } from 'motion/react';
import { memo, useEffect, useState, type CSSProperties } from 'react';
// 与首屏 Hero 共用同一套「飘带飘入」（标题栏胶囊自身带 backdrop-filter，用无 filter 版以保留背景模糊）
import { floatItemNoBlur, floatStyle } from '../../components/floatIn';

// 让胶囊「自身」做飘入：自身 transform 不会破坏自身 backdrop-filter（背景模糊得以保留）；
// 若改用外层 motion.div 包裹，wrapper 静止时残留的 transform 会成为 backdrop 根、掐断胶囊模糊。
const MotionHead = motion.create(Head as any);
// 直接从主题包导入（不走 `dumi/theme/slots/*` 别名）：避免本地 slot 覆盖文件依赖
// `dumi` 别名，从而规避 dev 下 .dumi/tmp 重新生成时的 "Can't resolve 'dumi'" 报错。
// @ts-ignore lobehub 内部 slot / store / 子组件，深层路径无类型声明
import Logo from 'dumi-theme-lobehub/dist/slots/Logo';
// @ts-ignore
import { useSiteStore } from 'dumi-theme-lobehub/dist/store/useSiteStore';
// 自定义导航（含 SDKs 悬浮 mega 下拉）；相对路径引用，不走 dumi/theme 别名
import Navbar from '../../components/JadeNavbar';
// 自定义移动端汉堡菜单（美化 + 正确 headerHeight）
import Burger from '../../components/JadeBurger';
// 移动端标题栏右侧搜索入口
import MobileSearch from '../../components/JadeMobileSearch';
// @ts-ignore
import DiscordButton from 'dumi-theme-lobehub/dist/slots/Header/DiscordButton';
// @ts-ignore
import GithubButton from 'dumi-theme-lobehub/dist/slots/Header/GithubButton';
// @ts-ignore
import LangSwitch from 'dumi-theme-lobehub/dist/slots/Header/LangSwitch';
// @ts-ignore
import ThemeSwitch from 'dumi-theme-lobehub/dist/slots/Header/ThemeSwitch';

export default memo(function Header() {
  const hasHeader = useSiteStore((s: any) => Boolean(s.routeMeta.frontmatter));
  const { mobile } = useResponsive();
  const theme = useTheme() as any;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 4);
    onScroll(); // 初始化（刷新后可能不在顶部）
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!hasHeader) return null;

  // 桌面端：悬浮胶囊；顶部无描边无阴影，滚动后出现
  const capsuleStyle: CSSProperties = {
    width: '100%',
    maxWidth: 712, // 居中胶囊宽度上限，避免铺满整行（可调）
    marginInline: 'auto',
    height: '100%',
    paddingInline: 10,
    borderRadius: 9999,
    border: 'none', // 无边框（与移动端一致）
    background: `color-mix(in srgb, ${theme.colorBgContainer} 72%, transparent)`,
    backdropFilter: 'saturate(180%) blur(16px)',
    WebkitBackdropFilter: 'saturate(180%) blur(16px)',
    // 顶部无阴影；滚动后柔和外阴影 + 1px inset 内描边（与移动端同款）
    boxShadow: scrolled
      ? '0 0 32px -8px rgba(0, 0, 0, 8%), 0 0 16px -4px rgba(0, 0, 0, 10%), 0 0 0 1px var(--ant-color-fill-tertiary) inset'
      : 'none',
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease',
  } as CSSProperties;

  // 移动端：左右「两个独立胶囊」。Head 本体透明，胶囊视觉放到左右两组上。
  const pill: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 50,
    // 左右内边距 = (高度 - 按钮)/2 = (50-36)/2 = 7，使圆形按钮与胶囊圆头同心对齐
    paddingInline: 7,
    borderRadius: 9999,
    border: 'none', // 胶囊始终不要边框
    background: `color-mix(in srgb, ${theme.colorBgContainer} 72%, transparent)`,
    backdropFilter: 'saturate(180%) blur(16px)',
    WebkitBackdropFilter: 'saturate(180%) blur(16px)',
    // 无边框；顶部时无阴影（干净），滚动后才出现柔和外阴影 + 1px inset 内描边
    boxShadow: scrolled
      ? '0 0 32px -8px rgba(0, 0, 0, 8%), 0 0 16px -4px rgba(0, 0, 0, 10%), 0 0 0 1px var(--ant-color-fill-tertiary) inset'
      : 'none',
    transition: 'box-shadow 0.2s ease, background 0.2s ease',
  } as CSSProperties;
  // 移动端 Head 本体透明（不再是整条胶囊）；不挂 floatStyle，避免其 transform 破坏两个胶囊各自的背景模糊
  const mobileHeadStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    background: 'transparent',
    border: 'none',
    boxShadow: 'none',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
  } as CSSProperties;
  // 左胶囊：菜单按钮(汉堡) + Logo（仅图标、无标题文字）
  const mobileLogo = (
    <div className="jade-mpill" style={pill}>
      <Burger />
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', paddingInline: 2 }}>
        <img alt="JadeView" src="/favicon.png" style={{ display: 'block', width: 36, height: 36, borderRadius: 10 }} />
      </a>
    </div>
  );

  return (
    // 胶囊自身做「飘带飘入」(motion.create(Head))；style 合并 capsuleStyle(含背景模糊) + floatStyle(透视/旋转轴)，
    // framer-motion 再把动画 transform/opacity 合进 style → transform 与 backdrop-filter 同在胶囊本身，模糊不被破坏。
    <MotionHead
      animate="show"
      className="jade-capsule-header"
      initial="hidden"
      style={mobile ? mobileHeadStyle : { ...capsuleStyle, ...floatStyle }}
      variants={floatItemNoBlur}
      // lobehub Header 桌面布局里 actions 区是 flex:1 + space-between（左侧塞了个空 div），
      // 会强占剩余宽度的一半 → nav 右侧出现大段空白、且 nav 只剩一半宽导致 Tabs 弹出「…」溢出。
      // 注意：FlexBasic 对「横向 + space-between + 无显式宽度」会强制 width:100%，
      // 故仅改 flex 不够（basis:auto 会吃到 100% 反把 nav 挤成 0）；需同时把 width 设回 auto。
      // 结果：actions 收成内容宽贴最右，nav(flex:1 1 0%) 吃满剩余宽度，Tabs 溢出消失。
      actionsStyle={mobile ? undefined : { flex: '0 0 auto', width: 'auto' }}
      actions={
        mobile ? (
          <div className="jade-mpill" style={pill}>
            <MobileSearch />
          </div>
        ) : (
          <>
            <DiscordButton />
            <LangSwitch />
            <ThemeSwitch />
            <GithubButton />
          </>
        )
      }
      logo={mobile ? mobileLogo : <Logo />}
      nav={mobile ? undefined : <Navbar />}
    />
  );
});
