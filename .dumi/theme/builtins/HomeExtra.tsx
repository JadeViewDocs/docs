import { Avatar, theme } from 'antd';
import { SpotlightCard } from '@lobehub/ui/awesome';
import { motion, useReducedMotion } from 'motion/react';
import { scrollContainer, scrollItem, scrollViewport } from '../components/scrollIn';
import { useT, useLocaleBase, localeHref } from '../locales/strings';

// 文案（特性 / 三步 / 套餐 / 开发者 / 各区标题）已抽到 ../locales/strings 的 home.*，按语言取值。
// 技术栈是中性专有名词，保持单一来源。
const techs = [
  'HTML5', 'React', 'Vue.js', 'TypeScript', 'Tailwind CSS', 'Next.js',
  'Three.js', 'Webpack', 'Sass', 'Bootstrap', 'Angular', 'Playwright',
];

export default function HomeExtra() {
  const { token } = theme.useToken();
  const t = useT();
  const base = useLocaleBase();
  // JadeView 品牌蓝：lobehub 暗色主题下 colorPrimary 偏白，做徽标/高亮会白底白字，改用固定品牌色
  const BRAND = '#007ee5';

  // 滚动进场动画的触发属性。尊重「减少动态效果」系统偏好：开启时不挂 initial/whileInView，
  // 元素直接以最终态渲染（variants 未被激活即为自然显示），完全跳过动画。
  const reduce = useReducedMotion();
  const reveal = reduce
    ? {}
    : ({ initial: 'hidden', whileInView: 'show', viewport: scrollViewport } as const);

  const card: React.CSSProperties = {
    background: token.colorBgContainer,
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusLG,
    padding: 24,
  };
  const sectionTitle: React.CSSProperties = {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 700,
    margin: '8px 0 4px',
    color: token.colorText,
  };
  const sectionSub: React.CSSProperties = {
    textAlign: 'center',
    color: token.colorTextSecondary,
    margin: '0 0 32px',
  };
  const grid = (min: number): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`,
    gap: 16,
  });
  const preStyle: React.CSSProperties = {
    margin: 0,
    padding: '12px 14px',
    borderRadius: token.borderRadius,
    background: token.colorFillQuaternary,
    border: `1px solid ${token.colorBorderSecondary}`,
    color: token.colorText,
    fontFamily: token.fontFamilyCode,
    fontSize: 12,
    lineHeight: 1.6,
    overflowX: 'auto',
  };

  return (
    <div style={{ width: '100%', maxWidth: 1080, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1, userSelect: 'text' }}>
      {/* 核心特性：用 lobehub SpotlightCard（鼠标悬浮光晕，与下方「核心开发者」一致）；整体作为一个单元滚动浮现 */}
      <motion.div style={{ marginTop: 8 }} variants={scrollItem} {...reveal}>
        <SpotlightCard
          items={t.home.features}
          columns={3}
          gap={16}
          borderRadius={token.borderRadiusLG}
          renderItem={(f) => (
            <div style={{ padding: 24, height: '100%' }}>
              <div style={{ fontSize: 30, lineHeight: 1, marginBottom: 14 }}>{f.image}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: token.colorText, margin: '0 0 8' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: token.colorTextSecondary, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          )}
        />
      </motion.div>

      {/* 三步上手 */}
      <motion.section style={{ marginTop: 64 }} variants={scrollContainer} {...reveal}>
        <motion.h2 style={sectionTitle} variants={scrollItem}>{t.home.stepsTitle}</motion.h2>
        <motion.p style={sectionSub} variants={scrollItem}>{t.home.stepsSub}</motion.p>
        <motion.div style={grid(320)} variants={scrollContainer}>
          {t.home.steps.map((s) => (
            <motion.div key={s.no} style={card} variants={scrollItem}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28, borderRadius: '50%', fontSize: 14, fontWeight: 700,
                  background: BRAND, color: '#fff',
                }}>{s.no}</span>
                <span style={{ fontSize: 17, fontWeight: 600, color: token.colorText }}>{s.title}</span>
              </div>
              <p style={{ color: token.colorTextSecondary, minHeight: 44, marginBottom: 12 }}>{s.desc}</p>
              <pre style={preStyle}><code>{s.code}</code></pre>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* 技术栈 */}
      <motion.section style={{ marginTop: 64 }} variants={scrollContainer} {...reveal}>
        <motion.h2 style={sectionTitle} variants={scrollItem}>{t.home.techTitle}</motion.h2>
        <motion.p style={sectionSub} variants={scrollItem}>{t.home.techSub}</motion.p>
        <motion.div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }} variants={scrollItem}>
          {techs.map((tech) => (
            <span key={tech} style={{
              padding: '6px 16px', borderRadius: 999, fontSize: 13,
              background: token.colorFillTertiary, border: `1px solid ${token.colorBorderSecondary}`,
              color: token.colorText,
            }}>{tech}</span>
          ))}
        </motion.div>
      </motion.section>

      {/* 全功能永久免费 */}
      <motion.section style={{ marginTop: 64 }} variants={scrollContainer} {...reveal}>
        <motion.h2 style={sectionTitle} variants={scrollItem}>{t.home.freeTitle}</motion.h2>
        <motion.p style={sectionSub} variants={scrollItem}>{t.home.freeSub}</motion.p>
        <motion.div style={grid(260)} variants={scrollContainer}>
          {t.home.plans.map((p) => (
            <motion.div key={p.name} variants={scrollItem} style={{
              ...card,
              borderColor: p.popular ? BRAND : token.colorBorderSecondary,
              boxShadow: p.popular ? `0 0 0 1px ${BRAND}` : undefined,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: token.colorText }}>{p.name}</span>
                {p.popular && (
                  <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999, background: BRAND, color: '#fff' }}>{t.home.recommend}</span>
                )}
              </div>
              <p style={{ color: token.colorTextSecondary, marginBottom: 16 }}>{p.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {p.items.map((it) => (
                  <li key={it} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', color: token.colorText }}>
                    <span style={{ color: token.colorSuccess, fontWeight: 700 }}>✓</span>{it}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
        <motion.p style={{ textAlign: 'center', marginTop: 20 }} variants={scrollItem}>
          <a href={localeHref(base, '/docs/api')}>{t.home.viewApi}</a>
        </motion.p>
      </motion.section>

      {/* 核心开发者 */}
      <motion.section style={{ marginTop: 64, marginBottom: 24 }} variants={scrollContainer} {...reveal}>
        <motion.h2 style={sectionTitle} variants={scrollItem}>{t.home.devsTitle}</motion.h2>
        <motion.p style={sectionSub} variants={scrollItem}>{t.home.devsSub}</motion.p>
        <motion.div variants={scrollItem}>
        <SpotlightCard
          items={t.home.devs}
          columns={3}
          gap={16}
          borderRadius={token.borderRadiusLG}
          renderItem={(d) => (
            <a href={d.url} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 24, height: '100%', color: 'inherit', textDecoration: 'none' }}>
              <Avatar src={d.avatar} size={48} style={{ flexShrink: 0 }}>{d.name.slice(0, 1)}</Avatar>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: token.colorText, marginBottom: 4 }}>{d.name}</div>
                <div style={{ fontSize: 13, color: token.colorTextSecondary, lineHeight: 1.6 }}>{d.bio}</div>
              </div>
            </a>
          )}
        />
        </motion.div>
      </motion.section>
    </div>
  );
}
