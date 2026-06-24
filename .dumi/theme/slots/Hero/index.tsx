// 覆盖 lobehub 的 Hero slot：首屏标题 / 副标题 / 按钮组改用 framer-motion 做「从下往上飘入」错峰动画
// （替换原先 hack lobehub Hero `.acss-*` 类的 CSS 关键帧——那种写法依赖易变的哈希类名，不稳）。
// 外观沿用 @lobehub/ui 公开组件：AuroraBackground 极光背景、GradientButton 主按钮、Button 次按钮，
// 标题/副标题样式按 @lobehub/ui Hero 原值还原。数据直接取首页 frontmatter.hero。
// 注意：此 slot 为新增覆盖，需「清 .dumi/tmp + dumi setup + 重启」才注册（改已有 slot 才走 HMR）。
import { Button } from '@lobehub/ui';
import { AuroraBackground } from '@lobehub/ui/awesome';
import { createStyles, useResponsive } from 'antd-style';
import { Link } from 'dumi';
import { Github } from 'lucide-react';
import { motion } from 'motion/react';
import { memo } from 'react';
// @ts-ignore 主题 store，深层路径无类型声明
import { useSiteStore } from 'dumi-theme-lobehub/dist/store/useSiteStore';
import { floatContainer as container, floatItem as item, floatStyle } from '../../components/floatIn';
// 「快速开始」主按钮：motion 驱动的渐变描边/glow/悬停按压（替代 lobehub GradientButton 的纯 CSS 动画）
import JadeStartButton from '../../components/JadeStartButton';

const useStyles = createStyles(({ css, token }) => ({
  // @lobehub/ui 的 AuroraBackground 在 ≤575.98px 把极光强制 `transform: scale(2); max-height: 25vh`，
  // 极光被裁到只剩屏幕顶部 1/4 并被放大成一片纯色，叠加低 opacity + 收向右上角的 mask 后手机端几乎不可见。
  // 这里按 DOM 结构（root > 第一个子节点=wrapper > 内层 bg div）覆盖那条移动端规则——
  // 不去 hack 易变的 `acss-*` 哈希类名（与本 slot 顶部注释的约定一致）。
  aurora: css`
    @media (max-width: 575.98px) {
      > div:first-child > div {
        max-height: 100vh;
        opacity: 0.55;
        transform: none;
      }
    }
  `,
  wrap: css`
    position: relative;
    z-index: 1;

    display: flex;
    flex-direction: column;
    align-items: center;

    width: 100%;
    text-align: center;
  `,
  title: css`
    z-index: 10;

    margin: 0;

    font-size: min(100px, 10vw);
    font-weight: 700;
    line-height: 1.2;
    text-align: center;

    /* 标题若含 <b> 则做渐变描边（与 lobehub 一致；当前配置为纯文本，留作兜底） */
    b {
      background: linear-gradient(90deg, #007ee5, #7c4dff 60%, #00c8aa);
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    @media (max-width: 575px) {
      font-size: 64px;
    }
  `,
  desc: css`
    max-width: 760px;
    margin: 16px 0 0;

    font-size: ${token.fontSizeHeading3}px;
    color: ${token.colorTextSecondary};
    text-align: center;

    @media (max-width: 575px) {
      margin-block: 20px;
      margin-inline: 16px;
      font-size: ${token.fontSizeHeading5}px;
    }
  `,
  actions: css`
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;

    margin-block-start: 28px;

    button {
      padding-inline: 32px !important;
      font-weight: 500;
    }

    @media (max-width: 575px) {
      flex-direction: column;
      width: 100%;

      button {
        width: 100%;
      }
    }
  `,
}));

export default memo(function Hero() {
  const { styles } = useStyles();
  const { mobile } = useResponsive();
  const hero = useSiteStore((s: any) => s.routeMeta?.frontmatter?.hero) || {};
  const { title, description, actions = [] } = hero;

  return (
    <>
      <AuroraBackground className={styles.aurora} />
      <motion.div animate="show" className={styles.wrap} initial="hidden" variants={container}>
        {title && (
          <motion.h1
            className={styles.title}
            dangerouslySetInnerHTML={{ __html: title }}
            style={floatStyle}
            variants={item}
          />
        )}
        {description && (
          <motion.p
            className={styles.desc}
            dangerouslySetInnerHTML={{ __html: description }}
            style={floatStyle}
            variants={item}
          />
        )}
        {actions.length > 0 && (
          <motion.div className={styles.actions} style={floatStyle} variants={item}>
            {actions.map(({ text, link, openExternal, github, type }: any) => {
              const content =
                type === 'primary' ? (
                  <JadeStartButton block={mobile}>{text}</JadeStartButton>
                ) : (
                  // 次按钮（查看 API / GitHub）：motion 悬停「上浮」——仅位移+微缩放，不改变色彩；按压回缩。
                  <motion.div
                    style={{ display: mobile ? 'block' : 'inline-block', width: mobile ? '100%' : 'auto' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 20, mass: 0.7 }}
                    whileHover={{ y: -5, scale: 1.04 }}
                    whileTap={{ y: -1, scale: 0.97 }}
                  >
                    <Button block={mobile} icon={github ? Github : undefined} size="large" type="primary">
                      {text}
                    </Button>
                  </motion.div>
                );
              return openExternal ? (
                <a key={text} href={link} rel="noreferrer" target="_blank">
                  {content}
                </a>
              ) : (
                <Link key={text} to={link}>
                  {content}
                </Link>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </>
  );
});
