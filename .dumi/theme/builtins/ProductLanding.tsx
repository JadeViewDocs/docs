// 产品落地页（/jadepack、/jade-ec 内嵌 <ProductLanding name="jadepack|jadeEc" />）。
// 设计语言对齐首页 HomeExtra / Showcase：antd token + @lobehub/ui SpotlightCard +
//   motion 的 scrollIn 滚动浮现 + 品牌色 #F97316。各区(hero/features/shots/integration/cta)按数据存在与否渲染。
// 文案数据见 ../locales/strings 的 t[name]（中英按 typeof zh 对齐）。
// 注意：新增本地 builtin 需重启 dumi dev 才会被扫描注册（dumi build 每次重扫，无碍）。
import { Button } from '@lobehub/ui';
import { SpotlightCard } from '@lobehub/ui/awesome';
import { theme } from 'antd';
import { createStyles } from 'antd-style';
import { Link } from 'dumi';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { memo } from 'react';
import { scrollContainer, scrollItem, scrollViewport } from '../components/scrollIn';
import { useT, useLocaleBase, localeHref } from '../locales/strings';

const BRAND = '#F97316';
const ACCENT = '#FBBF24';

// 每个产品 Hero / 底部 CTA 背景的强调色（取自各自 logo 配色）：
// jadepack 的 logo 是浅灰 + 深灰的极简图标 → 冷调石板灰；jadeEc 的 logo 是蓝底白图形 → 蓝。
const ACCENTS: Record<string, { a: string; b: string }> = {
  jadepack: { a: '#b9c2d4', b: '#6b7588' },
  jadeEc: { a: '#0c87ff', b: '#66b2ff' },
};

const useStyles = createStyles(({ css, token, responsive }) => ({
  root: css`
    width: 100%;
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 24px 16px;
    position: relative;
    z-index: 1;
  `,
  hero: css`
    position: relative;
    overflow: hidden;
    margin-top: 8px;
    padding: 76px 32px 84px;
    text-align: center;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 24px;
    background:
      radial-gradient(58% 80% at 50% -6%, color-mix(in srgb, ${BRAND} 22%, transparent), transparent 70%),
      radial-gradient(46% 64% at 88% 8%, color-mix(in srgb, ${ACCENT} 18%, transparent), transparent 72%),
      radial-gradient(40% 60% at 8% 18%, color-mix(in srgb, #EA580C 12%, transparent), transparent 72%),
      ${token.colorBgContainer};
    ${responsive.mobile} {
      padding: 52px 20px 56px;
      border-radius: 18px;
    }
  `,
  heroLogo: css`
    display: block;
    width: 78px;
    height: 78px;
    margin: 0 auto 20px;
    border-radius: 18px;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.2);
  `,
  eyebrow: css`
    display: inline-block;
    margin-bottom: 18px;
    padding: 5px 15px;
    font-size: 13px;
    font-weight: 600;
    color: ${BRAND};
    background: color-mix(in srgb, ${BRAND} 12%, transparent);
    border: 1px solid color-mix(in srgb, ${BRAND} 32%, transparent);
    border-radius: 999px;
    backdrop-filter: blur(6px);
  `,
  title: css`
    margin: 0;
    font-size: min(76px, 9vw);
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.025em;
    color: ${token.colorText};
    ${responsive.mobile} {
      font-size: 40px;
    }
  `,
  tagline: css`
    max-width: 680px;
    margin: 20px auto 0;
    font-size: 18px;
    line-height: 1.75;
    color: ${token.colorTextSecondary};
    ${responsive.mobile} {
      font-size: 15px;
    }
  `,
  actions: css`
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    justify-content: center;
    margin-top: 34px;
    button {
      padding-inline: 30px !important;
      font-weight: 600;
    }
    ${responsive.mobile} {
      flex-direction: column;
      align-items: stretch;
    }
  `,
  note: css`
    margin: 20px 0 0;
    font-size: 13px;
    color: ${token.colorTextTertiary};
  `,
  section: css`
    margin-top: 76px;
  `,
  secTitle: css`
    margin: 0 0 8px;
    text-align: center;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: ${token.colorText};
    ${responsive.mobile} {
      font-size: 25px;
    }
  `,
  secSub: css`
    max-width: 620px;
    margin: 0 auto 38px;
    text-align: center;
    font-size: 16px;
    line-height: 1.7;
    color: ${token.colorTextSecondary};
  `,
  feat: css`
    height: 100%;
    padding: 26px 24px;
  `,
  featIcon: css`
    margin-bottom: 14px;
    font-size: 30px;
    line-height: 1;
  `,
  featTitle: css`
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
    color: ${token.colorText};
  `,
  featDesc: css`
    margin: 0;
    font-size: 14px;
    line-height: 1.75;
    color: ${token.colorTextSecondary};
  `,
  shots: css`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 22px;
    ${responsive.mobile} {
      grid-template-columns: 1fr;
    }
  `,
  shotCard: css`
    overflow: hidden;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    &:hover {
      border-color: ${token.colorBorder};
      box-shadow: ${token.boxShadow};
    }
    &:hover .jv-shot-img {
      transform: scale(1.035);
    }
  `,
  shotMedia: css`
    overflow: hidden;
    aspect-ratio: 16 / 10;
    background: ${token.colorFillQuaternary};
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  shotImg: css`
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    transition: transform 0.6s ease;
  `,
  shotCap: css`
    padding: 14px 18px;
    font-size: 14px;
    color: ${token.colorTextSecondary};
  `,
  intg: css`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    ${responsive.mobile} {
      grid-template-columns: 1fr;
    }
  `,
  intgCard: css`
    display: block;
    padding: 24px 26px;
    color: inherit;
    text-decoration: none !important;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    background: ${token.colorBgContainer};
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    &:hover {
      border-color: ${BRAND};
      box-shadow: ${token.boxShadow};
      transform: translateY(-3px);
    }
  `,
  intgCode: css`
    display: inline-block;
    margin-bottom: 12px;
    padding: 3px 10px;
    font-family: ${token.fontFamilyCode};
    font-size: 13px;
    color: ${BRAND};
    background: color-mix(in srgb, ${BRAND} 10%, transparent);
    border-radius: 6px;
  `,
  intgTitle: css`
    margin: 0 0 6px;
    font-size: 17px;
    font-weight: 600;
    color: ${token.colorText};
  `,
  intgDesc: css`
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 14px;
    line-height: 1.65;
    color: ${token.colorTextSecondary};
  `,
  cta: css`
    position: relative;
    overflow: hidden;
    margin: 82px 0 28px;
    padding: 60px 32px;
    text-align: center;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 24px;
    background:
      radial-gradient(50% 120% at 50% 0%, color-mix(in srgb, ${BRAND} 20%, transparent), transparent 70%),
      linear-gradient(120deg, color-mix(in srgb, ${ACCENT} 12%, ${token.colorBgContainer}), ${token.colorBgContainer});
  `,
  ctaTitle: css`
    margin: 0 0 10px;
    font-size: 28px;
    font-weight: 700;
    color: ${token.colorText};
    ${responsive.mobile} {
      font-size: 22px;
    }
  `,
  ctaDesc: css`
    max-width: 540px;
    margin: 0 auto 26px;
    font-size: 16px;
    line-height: 1.7;
    color: ${token.colorTextSecondary};
  `,
}));

const hoverSpring = { type: 'spring', stiffness: 380, damping: 20, mass: 0.7 } as const;

function Action({ a, base }: { a: any; base: string }) {
  const btn = (
    <motion.div
      style={{ display: 'inline-block' }}
      transition={hoverSpring}
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ y: -1, scale: 0.97 }}
    >
      <Button size="large" type={a.primary ? 'primary' : 'default'}>
        {a.text}
      </Button>
    </motion.div>
  );
  return a.external ? (
    <a href={a.link} rel="noreferrer" target="_blank">
      {btn}
    </a>
  ) : (
    <Link to={localeHref(base, a.link) || a.link}>{btn}</Link>
  );
}

export default memo(function ProductLanding({ name }: { name: string }) {
  const { styles, cx } = useStyles();
  const { token } = theme.useToken();
  const base = useLocaleBase();
  const data: any = (useT() as any)[name];
  const reduce = useReducedMotion();
  const reveal = reduce
    ? {}
    : ({ initial: 'hidden', whileInView: 'show', viewport: scrollViewport } as const);
  const heroAnim = reduce ? {} : ({ initial: 'hidden', animate: 'show' } as const);

  if (!data) return null;
  const { hero, features, shots, integration, cta } = data;
  const featCols = features ? (features.items.length === 4 ? 2 : 3) : 3;
  // 按产品 logo 配色生成 Hero / CTA 背景（覆盖 CSS 里的通用渐变）
  const accent = ACCENTS[name];
  const heroBg = accent
    ? `radial-gradient(58% 80% at 50% -6%, color-mix(in srgb, ${accent.a} 30%, transparent), transparent 70%), radial-gradient(48% 64% at 85% 6%, color-mix(in srgb, ${accent.b} 22%, transparent), transparent 72%), radial-gradient(42% 62% at 10% 16%, color-mix(in srgb, ${accent.a} 14%, transparent), transparent 72%), ${token.colorBgContainer}`
    : undefined;
  const ctaBg = accent
    ? `radial-gradient(50% 120% at 50% 0%, color-mix(in srgb, ${accent.a} 24%, transparent), transparent 70%), linear-gradient(120deg, color-mix(in srgb, ${accent.b} 14%, ${token.colorBgContainer}), ${token.colorBgContainer})`
    : undefined;

  return (
    <div className={styles.root}>
      {/* Hero */}
      <motion.section
        className={styles.hero}
        style={heroBg ? { background: heroBg } : undefined}
        variants={scrollContainer}
        {...heroAnim}
      >
        {hero.logo && (
          <motion.img className={styles.heroLogo} src={hero.logo} alt="" variants={scrollItem} />
        )}
        {hero.eyebrow && (
          <motion.span className={styles.eyebrow} variants={scrollItem}>
            {hero.eyebrow}
          </motion.span>
        )}
        <motion.h1 className={styles.title} variants={scrollItem}>
          {hero.title}
        </motion.h1>
        <motion.p className={styles.tagline} variants={scrollItem}>
          {hero.tagline}
        </motion.p>
        <motion.div className={styles.actions} variants={scrollItem}>
          {hero.actions.map((a: any) => (
            <Action a={a} base={base} key={a.text} />
          ))}
        </motion.div>
        {hero.note && (
          <motion.p className={styles.note} variants={scrollItem}>
            {hero.note}
          </motion.p>
        )}
      </motion.section>

      {/* Features */}
      {features && (
        <motion.section className={styles.section} variants={scrollContainer} {...reveal}>
          <motion.h2 className={styles.secTitle} variants={scrollItem}>
            {features.title}
          </motion.h2>
          <motion.p className={styles.secSub} variants={scrollItem}>
            {features.sub}
          </motion.p>
          <motion.div variants={scrollItem}>
            <SpotlightCard
              borderRadius={token.borderRadiusLG}
              columns={featCols}
              gap={16}
              items={features.items}
              renderItem={(f: any) => (
                <div className={styles.feat}>
                  <div className={styles.featIcon}>{f.icon}</div>
                  <h3 className={styles.featTitle}>{f.title}</h3>
                  <p className={styles.featDesc}>{f.desc}</p>
                </div>
              )}
            />
          </motion.div>
        </motion.section>
      )}

      {/* Screenshots */}
      {shots && (
        <motion.section className={styles.section} variants={scrollContainer} {...reveal}>
          <motion.h2 className={styles.secTitle} variants={scrollItem}>
            {shots.title}
          </motion.h2>
          <motion.p className={styles.secSub} variants={scrollItem}>
            {shots.sub}
          </motion.p>
          <motion.div className={styles.shots} variants={scrollContainer}>
            {shots.items.map((s: any) => (
              <motion.div className={styles.shotCard} key={s.cap} variants={scrollItem}>
                <div className={styles.shotMedia}>
                  <img alt={s.cap} className={cx(styles.shotImg, 'jv-shot-img')} loading="lazy" src={s.src} />
                </div>
                <div className={styles.shotCap}>{s.cap}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* Integration */}
      {integration && (
        <motion.section className={styles.section} variants={scrollContainer} {...reveal}>
          <motion.h2 className={styles.secTitle} variants={scrollItem}>
            {integration.title}
          </motion.h2>
          <motion.p className={styles.secSub} variants={scrollItem}>
            {integration.sub}
          </motion.p>
          <motion.div className={styles.intg} variants={scrollContainer}>
            {integration.items.map((it: any) => (
              <motion.div variants={scrollItem} key={it.code}>
                <Link className={styles.intgCard} to={localeHref(base, it.link) || it.link}>
                  <code className={styles.intgCode}>{it.code}</code>
                  <h3 className={styles.intgTitle}>{it.title}</h3>
                  <p className={styles.intgDesc}>
                    {it.desc} <ArrowRight size={15} />
                  </p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* Bottom CTA */}
      {cta && (
        <motion.section
          className={styles.cta}
          style={ctaBg ? { background: ctaBg } : undefined}
          variants={scrollContainer}
          {...reveal}
        >
          <motion.h2 className={styles.ctaTitle} variants={scrollItem}>
            {cta.title}
          </motion.h2>
          <motion.p className={styles.ctaDesc} variants={scrollItem}>
            {cta.desc}
          </motion.p>
          <motion.div className={styles.actions} variants={scrollItem} style={{ marginTop: 0 }}>
            <Action a={{ ...cta.action, primary: true }} base={base} />
          </motion.div>
        </motion.section>
      )}
    </div>
  );
});
