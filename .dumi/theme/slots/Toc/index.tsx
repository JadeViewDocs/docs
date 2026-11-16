// 覆盖 lobehub 的 Toc slot，解决三个问题：
//
// 1) 锚点不滚动：lobehub 原版给 antd <Anchor> 传 getContainer={() => document.body}，
//    而本站文档区是「窗口滚动」（滚动元素为 <html>/documentElement，body 不滚动）。
//    antd 的 scrollTo 对非 window/Document 的容器执行 `container.scrollTop = y`，
//    在标准模式下对 body 设置 scrollTop 无效 → 页面不动。改回 window 即恢复滚动与高亮。
//
// 2) 标题写死英文：原版 <h4>Table of Contents</h4> 没有 i18n。桌面端改为自己渲染，
//    标题走 strings.ts 的 tocTitle 词条（中文「本页目录」，英文 "Table of Contents"）。
//
// 3) 目录被截断：原版样式写死 `max-height: 60dvh !important`，长文档只能看到前 60%
//    视口高度。桌面端改为按视口可用高度计算（顶部偏移 + 底部留白），内容少时自动收缩，
//    内容多时在面板内滚动，所有条目都能到达。
//
// 注意：这个 <section> 带 grid-area: toc，必须是布局 grid 的直接子元素，
// 因此不能在外面套一层 div 来覆盖样式（会破坏右侧栏定位）。移动端仍沿用 lobehub 原组件。
import { Toc as LobeToc } from '@lobehub/ui';
import { Anchor } from 'antd';
import { createStyles, useResponsive, useTheme } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { memo, useEffect, useState } from 'react';
// @ts-ignore 复用 lobehub 内部 store（与主题同一实例），该深层路径无类型声明
import { siteSelectors, useSiteStore } from 'dumi-theme-lobehub/dist/store';
import { useT } from '../../locales/strings';

const GAP = 48;

// 与 lobehub 的 Toc/style.ts 中 container + anchor 保持一致，仅把 60dvh 换成
// 跟随视口可用高度；backdrop-filter / 半透明背景对应原 lobeStaticStylish.blur。
const useStyles = createStyles(({ css, token }) => ({
  container: css`
    position: sticky;
    inset-block-start: calc(var(--toc-header-height, 64px) + 64px);
    overscroll-behavior: contain;
    grid-area: toc;

    width: var(--toc-width, 176px);
    margin-inline-end: 24px;
    border-radius: 3px;
    -webkit-overflow-scrolling: touch;

    overflow: hidden auto;
    max-height: calc(100dvh - var(--toc-header-height, 64px) - 96px);
    backdrop-filter: blur(8px);
    background-color: color-mix(in srgb, ${token.colorBgLayout} 50%, transparent);

    > h4 {
      margin-block: 0 8px;
      margin-inline: 0;
      font-size: 12px;
      line-height: 1;
      color: ${token.colorTextDescription};
    }

    @media (max-width: 768px) {
      position: relative;
      inset-inline-start: 0;
      width: 100%;
      margin-block-start: 0;
      max-height: none;
    }
  `,
}));

// 与 @lobehub/ui/es/Toc/utils.mjs 的 mapItems 等价，避免依赖组件库深层路径。
const mapItems = (items: any[]) =>
  items.map((item) => ({
    href: `#${item.id}`,
    key: item.id,
    title: item.title,
    ...(item.children
      ? {
          children: item.children.map((child: any) => ({
            href: `#${child.id}`,
            key: child.id,
            title: child.title,
          })),
        }
      : {}),
  }));

export default memo(function Toc() {
  const items = useSiteStore(siteSelectors.tocAnchorItem, isEqual);
  const { mobile } = useResponsive();
  const theme = useTheme() as any;
  const hash = useSiteStore((s: any) => s.location.hash, isEqual);
  const t = useT();
  const { styles } = useStyles();
  const [spacing, setSpacing] = useState(GAP);

  useEffect(() => {
    const apiTitle = document?.querySelector('#api-header');
    if (apiTitle) setSpacing(apiTitle.clientHeight + GAP);
  }, [hash, items]);

  if (!items || items.length < 1) return null;

  // 移动端沿用 lobehub 的折叠目录（标题是 'TOC' / 当前锚点，不涉及写死的英文标题）
  if (mobile) {
    return (
      <LobeToc
        getContainer={() => window as any}
        headerHeight={theme.headerHeight}
        isMobile
        items={items}
        tocWidth={theme.tocWidth}
      />
    );
  }

  const headerHeight = theme.headerHeight ?? 64;

  return (
    <>
      <div style={{ height: spacing }} />
      <section
        className={styles.container}
        style={
          {
            '--toc-header-height': `${headerHeight}px`,
            '--toc-width': `${theme.tocWidth ?? 176}px`,
          } as any
        }
      >
        <h4>{t.tocTitle}</h4>
        <Anchor
          // 关键修复：窗口滚动容器用 window，而非 document.body
          getContainer={() => window as any}
          items={mapItems(items)}
          targetOffset={headerHeight + 12}
        />
      </section>
    </>
  );
});
