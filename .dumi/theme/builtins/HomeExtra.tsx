import { Avatar, theme } from 'antd';
import { SpotlightCard } from '@lobehub/ui/awesome';
import { motion, useReducedMotion } from 'motion/react';
import MagicBento from '../components/MagicBento';
import HomeNews from './HomeNews';
import { scrollContainer, scrollItem, scrollViewport } from '../components/scrollIn';
import { useT } from '../locales/strings';

// 文案（特性 / Bento / 套餐 / 开发者 / 各区标题）已抽到 ../locales/strings 的 home.*，按语言取值。
// 技术栈是中性专有名词，保持单一来源。
const techs = [
  'HTML5', 'React', 'Vue.js', 'TypeScript', 'Tailwind CSS', 'Next.js',
  'Three.js', 'Webpack', 'Sass', 'Bootstrap', 'Angular', 'Playwright',
];

export default function HomeExtra() {
  const { token } = theme.useToken();
  const t = useT();
  // 滚动进场动画的触发属性。尊重「减少动态效果」系统偏好：开启时不挂 initial/whileInView，
  // 元素直接以最终态渲染（variants 未被激活即为自然显示），完全跳过动画。
  const reduce = useReducedMotion();
  const reveal = reduce
    ? {}
    : ({ initial: 'hidden', whileInView: 'show', viewport: scrollViewport } as const);

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
            <a
              href={f.link}
              style={{
                display: 'block',
                padding: 24,
                height: '100%',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: 30, lineHeight: 1, marginBottom: 14 }}>{f.image}</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: token.colorText, margin: '0 0 8' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: token.colorTextSecondary, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </a>
          )}
        />
      </motion.div>

      {/* 快速上手：Magic Bento 卡片墙（reactbits 风格，品牌橙光晕） */}
      <motion.section style={{ marginTop: 64 }} variants={scrollContainer} {...reveal}>
        <motion.h2 style={sectionTitle} variants={scrollItem}>{t.home.bentoTitle}</motion.h2>
        <motion.p style={sectionSub} variants={scrollItem}>{t.home.bentoSub}</motion.p>
        <motion.div variants={scrollItem}>
          <MagicBento items={t.home.bento} glowColor="249, 115, 22" disableAnimations={!!reduce} />
        </motion.div>
      </motion.section>

      {/* 动态 / 新闻（最近 3 条，横向带封面） */}
      <motion.section style={{ marginTop: 64 }} variants={scrollContainer} {...reveal}>
        <motion.div variants={scrollItem}>
          <HomeNews />
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
