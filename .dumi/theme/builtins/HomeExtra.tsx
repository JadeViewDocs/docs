import { Avatar, theme } from 'antd';
import { Link, usePrefersColor } from 'dumi';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import BorderGlow from '../components/BorderGlow';
import ElectricBorder from '../components/ElectricBorder';
import MagicBento from '../components/MagicBento';
import MetallicPaint from '../components/MetallicPaint';
import SpecularButton from '../components/SpecularButton';
import StarBorder from '../components/StarBorder';
import { scrollContainer, scrollItem, scrollViewport } from '../components/scrollIn';
import { localeHref, useLocaleBase, useT } from '../locales/strings';

// 文案（特性 / Bento / 套餐 / 开发者 / 各区标题）已抽到 ../locales/strings 的 home.*，按语言取值。
// 技术栈是中性专有名词，保持单一来源。
const techs = [
  'HTML5', 'React', 'Vue.js', 'TypeScript', 'Tailwind CSS', 'Next.js',
  'Three.js', 'Webpack', 'Sass', 'Bootstrap', 'Angular', 'Playwright',
];

const BRAND = '#F97316';

// BorderGlow 的边框网格渐变三色（首页特性卡 / 开发者卡 / 页底共用）。
// 采用 reactbits 官方 Border Glow 的默认三色（紫 / 粉 / 蓝），与「NEXT」横幅的电黄、
// MagicBento 的橙光形成冷暖对比，边框在鼠标环绕时才有明显色相变化。
const GLOW_COLORS = ['#c084fc', '#f472b6', '#38bdf8'];

// BorderGlow 的外圈光晕色（HSL 三段式，组件按它生成 7 档透明度）。
// 深色沿用官方默认的暖白；浅色需要压深，否则近白光晕在白底上完全看不见。
const glowHalo = (isDark: boolean) => (isDark ? '40 80 80' : '28 88 52');

// 窄屏检测（与 MagicBento 的 useMobileDetection 同思路）：用于 V3 横幅的移动端布局切换。
function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return narrow;
}

export default function HomeExtra() {
  const { token } = theme.useToken();
  const t = useT();
  const base = useLocaleBase();
  const [prefersColor] = usePrefersColor();
  const isDark = prefersColor === 'dark';
  const narrow = useNarrow();
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
      {/* V3 宣传横幅：品牌橙微光 + 渐变描边；桌面左右分栏，窄屏自动换行 */}
      <motion.section
        style={{ marginTop: 24 }}
        variants={scrollContainer}
        {...reveal}
      >
        <motion.div variants={scrollItem}>
          {/* 黄色电光边框（ReactBits ElectricBorder，#eab308）：电流随鼠标在边缘跃动 */}
          <ElectricBorder
            color="#eab308"
            theme={isDark ? 'dark' : 'light'}
            speed={0.9}
            chaos={narrow ? 0.2 : 0.35}
            spread={narrow ? 0.25 : 0.42}
            thickness={narrow ? 1 : 1.4}
            strands={narrow ? 2 : 3}
            glow={narrow ? 0.3 : 0.5}
            intensity={narrow ? 0.5 : 0.72}
            arcs={narrow ? 0 : 1}
            flicker={narrow ? 0.2 : 0.32}
            borderRadius={token.borderRadiusLG}
            intro={!reduce}
            interactive={!reduce}
          >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: narrow ? 18 : 28,
              padding: narrow ? '26px 20px' : '32px 36px',
              borderRadius: token.borderRadiusLG,
              background: `linear-gradient(120deg, ${BRAND}14 0%, ${token.colorBgContainer} 45%, ${token.colorBgContainer} 100%)`,
              overflow: 'hidden',
            }}
          >
            {/* 右上角柔光点缀 */}
            <div aria-hidden style={{
              position: 'absolute', top: -70, right: -40, width: 220, height: 220,
              borderRadius: '50%', background: `radial-gradient(circle, ${BRAND}26, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            {/* 版本代号 NEXT：ReactBits MetallicPaint 液态金属文字，置于右上角 */}
            <div aria-hidden style={{
              position: 'absolute',
              top: narrow ? -2 : 0, right: narrow ? 12 : 20,
              width: narrow ? 116 : 190, height: narrow ? 44 : 72,
              opacity: narrow ? 0.75 : 1,
              zIndex: 0, pointerEvents: 'none',
            }}>
              {/* Chrome（液态铬）预设：保持默认字体色，不覆写 color */}
              <MetallicPaint
                text="NEXT"
                fontFamily="system-ui, sans-serif"
                fontWeight={800}
                lightMode={!isDark}
                speed={reduce ? 0 : 1}
                intro={!reduce}
                paused={reduce}
                mouseTilt={reduce ? 0 : 0.5}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* 左侧：标签 + 标题 + 描述 + CTA */}
            <div style={{ flex: narrow ? '1 1 100%' : '1 1 360px', minWidth: 0, position: 'relative', zIndex: 1 }}>
              <span style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 999,
                background: `${BRAND}1f`, border: `1px solid ${BRAND}55`,
                color: BRAND, fontSize: 12, fontWeight: 600, marginBottom: 12,
              }}>{t.home.v3.badge}</span>
              <h2 style={{ fontSize: narrow ? 25 : 30, fontWeight: 700, lineHeight: 1.2, margin: '0 0 10', color: token.colorText }}>
                {t.home.v3.title}
              </h2>
              <p style={{ fontSize: narrow ? 13 : 14, lineHeight: 1.75, color: token.colorTextSecondary, margin: '0 0 20', maxWidth: 560 }}>
                {t.home.v3.desc}
              </p>
              <Link to={localeHref(base, t.home.v3.link) || t.home.v3.link} style={{ textDecoration: 'none' }}>
                <StarBorder
                  as="span"
                  color="#ffcf8a"
                  trailColor="#ff4d2e"
                  trailLength={0.45}
                  glow={0.8}
                  theme={isDark ? 'dark' : 'light'}
                  duration={4}
                  hover="lap"
                  clickPulse
                >
                  {t.home.v3.cta}
                </StarBorder>
              </Link>
            </div>

            {/* 右侧：特性标签（SpecularButton 镜面高光描边，鼠标靠近时高光增强） */}
            <div style={{ flex: narrow ? '1 1 100%' : '0 1 260px', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: 8 }}>
                {t.home.v3.points.map((p: string) => (
                  <SpecularButton
                    key={p}
                    size="sm"
                    radius={8}
                    thickness={0.8}
                    glow={0.6}
                    intensity={0.65}
                    idleIntensity={0.28}
                    shineSize={8}
                    lineColor={isDark ? '#fff7e0' : '#d97706'}
                    baseColor={isDark ? '#3a3a3a' : '#d4d4d4'}
                    tint={isDark ? '#ffffff' : '#000000'}
                    tintOpacity={isDark ? 0.05 : 0.03}
                    textColor={isDark ? '#f5f5f5' : '#262626'}
                    followMouse={!reduce}
                    proximity={180}
                    autoAnimate={!reduce}
                    tabIndex={-1}
                    style={{ width: '100%', height: '100%', pointerEvents: 'none', fontSize: 12 }}
                  >
                    {p}
                  </SpecularButton>
                ))}
              </div>
            </div>
          </div>
          </ElectricBorder>
        </motion.div>
      </motion.section>

      {/* 核心特性：BorderGlow 卡片（边框网格渐变随鼠标环绕，ReactBits）；整体作为一个单元滚动浮现 */}
      {/* marginTop 48：ElectricBorder 的 canvas 外扩约 64px 画电弧，留出间距避免贴住下方卡片 */}
      <motion.div style={{ marginTop: narrow ? 36 : 48 }} variants={scrollItem} {...reveal}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))', gap: 16 }}>
          {t.home.features.map((f: { image: string; title: string; desc: string; link: string }) => (
            <BorderGlow
              key={f.title}
              backgroundColor={token.colorBgContainer}
              borderRadius={20}
              edgeSensitivity={30}
              glowRadius={40}
              glowIntensity={1}
              coneSpread={25}
              colors={GLOW_COLORS}
              glowColor={glowHalo(isDark)}
              fillOpacity={isDark ? 0.5 : 0.18}
            >
              <a
                href={f.link}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  padding: 24,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{ fontSize: 30, lineHeight: 1, marginBottom: 14 }}>{f.image}</div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: token.colorText, margin: '0 0 8' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: token.colorTextSecondary, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </a>
            </BorderGlow>
          ))}
        </div>
      </motion.div>

      {/* 快速上手：Magic Bento 卡片墙（reactbits 风格，品牌橙光晕） */}
      <motion.section style={{ marginTop: 64 }} variants={scrollContainer} {...reveal}>
        <motion.h2 style={sectionTitle} variants={scrollItem}>{t.home.bentoTitle}</motion.h2>
        <motion.p style={sectionSub} variants={scrollItem}>{t.home.bentoSub}</motion.p>
        <motion.div variants={scrollItem}>
          <MagicBento items={t.home.bento} glowColor="249, 115, 22" disableAnimations={!!reduce} />
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))', gap: 16 }}>
          {t.home.devs.map((d: { name: string; avatar: string; url: string; bio: string }) => (
            <BorderGlow
              key={d.name}
              backgroundColor={token.colorBgContainer}
              borderRadius={20}
              edgeSensitivity={30}
              glowRadius={40}
              glowIntensity={1}
              coneSpread={25}
              colors={GLOW_COLORS}
              glowColor={glowHalo(isDark)}
              fillOpacity={isDark ? 0.5 : 0.18}
            >
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', flex: 1, gap: 14, alignItems: 'flex-start', padding: 24, color: 'inherit', textDecoration: 'none' }}
              >
                <Avatar src={d.avatar} size={48} style={{ flexShrink: 0 }}>{d.name.slice(0, 1)}</Avatar>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: token.colorText, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 13, color: token.colorTextSecondary, lineHeight: 1.6 }}>{d.bio}</div>
                </div>
              </a>
            </BorderGlow>
          ))}
        </div>
        </motion.div>
      </motion.section>
    </div>
  );
}
