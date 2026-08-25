// 覆盖 lobehub 的 Content slot：去掉文档正文的「卡片」外观（填充背景 / 阴影 / 圆角），
// 让正文与整页同色、铺平（参考 lobehub.com 文档页）。
//
// 实现：沿用主题原结构（Flexbox > Block > Skeleton + Typography + ContentFooter），
//   仅把 <Block> 由默认 `variant='filled' + shadow` 改成 `variant='borderless' + shadow={false}`，
//   即无背景 / 无边框 / 无阴影；并复用主题 Content 的 styles.content（保留 badge / 表格等正文样式）。
// 导入约束：本地 slot 不引用 `dumi/theme/*` 子路径别名（会致 dev 'dumi' 解析报错），
//   主题内部组件 / 样式一律走 `dumi-theme-lobehub/dist/*`。
import { Block, Typography } from '@lobehub/ui';
import { Skeleton } from 'antd';
import { createStyles, useResponsive } from 'antd-style';
import { useRouteMeta } from 'dumi';
import { memo, useEffect } from 'react';
import { Flexbox } from 'react-layout-kit';
// @ts-ignore 主题内部组件 / 样式，深层路径无类型声明
import ContentFooter from 'dumi-theme-lobehub/dist/slots/ContentFooter';
// @ts-ignore
import { styles } from 'dumi-theme-lobehub/dist/slots/Content/style';
// @ts-ignore
import { useSiteStore } from 'dumi-theme-lobehub/dist/store/useSiteStore';

const useTitleStyles = createStyles(({ css }) => ({
  versionBadge: css`
    .markdown .jv-version-badge {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;

      min-width: 34px;
      height: 20px;
      margin-inline-start: 6px;
      padding-inline: 7px;
      border-radius: 999px;

      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      color: #fff;
      vertical-align: 2px;
      background: #f97316;
    }
  `,
  titleWithBadge: css`
    .markdown > h1 {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }

    .markdown > h1::after {
      content: var(--jv-title-badge);
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;

      min-width: 34px;
      height: 22px;
      padding-inline: 8px;
      border-radius: 999px;

      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      color: #fff;
      background: #f97316;
    }
  `,
}));

export default memo(function Content({ children, ...props }: any) {
  const loading = useSiteStore((s: any) => s.siteData.loading);
  const { mobile } = useResponsive();
  const { styles: titleStyles } = useTitleStyles();
  const routeMeta = useRouteMeta();
  const badge = (routeMeta?.frontmatter as any)?.badge;

  useEffect(() => {
    document.body.scrollTo(0, 0);
  }, [loading]);

  return (
    <Flexbox gap={mobile ? 0 : 24} width="100%" {...props}>
      <Block
        className={`${styles.content} ${titleStyles.versionBadge}${badge ? ` ${titleStyles.titleWithBadge}` : ''}`}
        shadow={false}
        style={{
          padding: mobile ? '8px 16px' : 0,
          background: 'transparent',
          ['--jv-title-badge' as any]: badge ? `"${badge}"` : undefined,
        }}
        variant="borderless"
      >
        <Skeleton active loading={loading} paragraph />
        <Typography headerMultiple={0.5} style={{ display: loading ? 'none' : undefined }}>
          {children}
        </Typography>
      </Block>
      <ContentFooter />
    </Flexbox>
  );
});
