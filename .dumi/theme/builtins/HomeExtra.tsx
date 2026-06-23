import { Avatar, theme } from 'antd';
import { SpotlightCard } from '@lobehub/ui/awesome';
import { motion, useReducedMotion } from 'motion/react';
import { scrollContainer, scrollItem, scrollViewport } from '../components/scrollIn';

// 核心特性卡片：原本写在首页 frontmatter.features（由 lobehub Features slot 渲染、无法加动画），
// 移到这里自渲染，以便和其它区块一样做「滚动错峰浮现」。
const features = [
  { image: '🦀', title: 'Rust 核心', desc: '核心库采用 Rust 编写，内存安全、线程安全，杜绝空指针与数据竞争；约 3MB 运行时，完整启动仅需约 16ms。' },
  { image: '🌐', title: '跨平台 · 系统 WebView', desc: '一套代码同时支持 Windows 与 Linux，复用系统自带 WebView（Windows 上的 WebView2、Linux 上的 WebKitGTK），享受与系统浏览器同级别的安全更新与兼容性。' },
  { image: '🔗', title: 'C 语言 API', desc: '稳定的二进制接口（ABI），跨语言调用无性能损耗，接口向后兼容。' },
  { image: '⚡', title: 'IPC 双向通信', desc: '前后端双向通信延迟低于 1ms、每秒 800+ 请求；jade.invoke / jade.on 高效互通。' },
  { image: '🧩', title: '多语言 SDK', desc: '提供 Web、Python、易语言、火山视窗等多端 SDK，覆盖主流开发语言。' },
  { image: '🔒', title: '资源安全 · JAPK', desc: 'JAPK 资源包支持代码混淆、AES-256-GCM 加密与 Ed25519 签名，可内存载入、无需落地磁盘。' },
];

const steps = [
  {
    no: '1',
    title: '初始化库',
    desc: '注册 app-ready 事件后初始化 DLL，完整流程仅需约 16ms（不含 HTML 加载）。',
    lang: 'c',
    code: `#include "jadeview.h"

int main() {
    jade_on("app-ready", app_ready_callback);
    JadeView_init(1, NULL, NULL, "我的应用", "com.example.myapp", 0);
    run_message_loop();
    return 0;
}`,
  },
  {
    no: '2',
    title: '创建窗口',
    desc: '配置参数，一行调用即可创建 WebView 窗口，支持自定义标题栏、无边框窗口。',
    lang: 'c',
    code: `WebViewWindowOptions opts = {
    .title = "我的桌面应用",
    .width = 1024, .height = 768,
    .resizable = 1, .remove_titlebar = 0
};
uint32_t win = create_webview_window(
    "https://myapp.com", 0, &opts, NULL
);`,
  },
  {
    no: '3',
    title: 'IPC 通信与运行',
    desc: '前后端双向 IPC，低于 1ms 延迟，jade.invoke / jade.on 即可高效通信。',
    lang: 'javascript',
    code: `// 前端调用后端 API
const res = await jade.invoke('getData', {});
// 前端监听后端事件
jade.on('backend-event', (data) => {});`,
  },
];

const techs = [
  'HTML5', 'React', 'Vue.js', 'TypeScript', 'Tailwind CSS', 'Next.js',
  'Three.js', 'Webpack', 'Sass', 'Bootstrap', 'Angular', 'Playwright',
];

const plans = [
  {
    name: 'DLL 动态库',
    desc: '运行时动态加载，适合快速集成。',
    items: ['WebView 窗口创建', '事件系统支持', '自定义标题栏', 'IPC 双向通信', '完整 C API', '全功能免费'],
    popular: false,
  },
  {
    name: 'Lib 静态库',
    desc: '编译时静态链接，可编译进可执行文件，独立部署无依赖。',
    items: ['以上 DLL 全部能力', '编译进可执行文件', '无运行时依赖', '独立分发'],
    popular: true,
  },
  {
    name: '企业定制',
    desc: '专属技术支持与定制开发。',
    items: ['源码级定制', '专属技术支持', '性能优化咨询', '长期版本维护'],
    popular: false,
  },
];

const devs = [
  { name: 'Tuyang', avatar: '/avatar/B.jpg', bio: 'JadeView 核心架构师，负责 Rust 核心库开发与 IPC 通信协议设计。', url: 'https://github.com/tuyangJs' },
  { name: '洛洛', avatar: '/avatar/L.jpg', bio: '负责UI设计＆Logo设计', url: 'https://github.com/PatrickAlex2019' },
  { name: '花生', avatar: '/avatar/D.jpg', bio: '全能型开发者，负责 JadeView 项目的对外宣传与维护。', url: 'https://github.com/245867' },
  { name: '落雪有声', avatar: '/avatar/C.jpg', bio: '火山视窗 SDK 核心开发者，负责适配火山视窗 API。', url: 'https://github.com/luoxueyousheng' },
  { name: '哪有不湿鞋', avatar: '/avatar/A.jpg', bio: '易语言 SDK 核心开发者，负责适配易语言模块维护。', url: 'https://github.com/a657938016' },
  { name: '青舟', avatar: '/avatar/Q.jpg', bio: '全栈开发者，负责 Python SDK2 的开发及维护。', url: 'https://github.com/lazyso' },
];

export default function HomeExtra() {
  const { token } = theme.useToken();
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
          items={features}
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
        <motion.h2 style={sectionTitle} variants={scrollItem}>三步上手</motion.h2>
        <motion.p style={sectionSub} variants={scrollItem}>用熟悉的 C 接口，三步即可跑起一个 WebView 窗口。</motion.p>
        <motion.div style={grid(320)} variants={scrollContainer}>
          {steps.map((s) => (
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
        <motion.h2 style={sectionTitle} variants={scrollItem}>使用你喜欢的前端技术栈</motion.h2>
        <motion.p style={sectionSub} variants={scrollItem}>从 React、Vue 到原生 HTML，用任何熟悉的前端技术构建桌面应用。</motion.p>
        <motion.div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }} variants={scrollItem}>
          {techs.map((t) => (
            <span key={t} style={{
              padding: '6px 16px', borderRadius: 999, fontSize: 13,
              background: token.colorFillTertiary, border: `1px solid ${token.colorBorderSecondary}`,
              color: token.colorText,
            }}>{t}</span>
          ))}
        </motion.div>
      </motion.section>

      {/* 全功能永久免费 */}
      <motion.section style={{ marginTop: 64 }} variants={scrollContainer} {...reveal}>
        <motion.h2 style={sectionTitle} variants={scrollItem}>全功能 · 永久免费</motion.h2>
        <motion.p style={sectionSub} variants={scrollItem}>DLL 与 Lib 提供完全一致的 C API，仅链接方式不同；全功能免费，无需商业授权。</motion.p>
        <motion.div style={grid(260)} variants={scrollContainer}>
          {plans.map((p) => (
            <motion.div key={p.name} variants={scrollItem} style={{
              ...card,
              borderColor: p.popular ? BRAND : token.colorBorderSecondary,
              boxShadow: p.popular ? `0 0 0 1px ${BRAND}` : undefined,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: token.colorText }}>{p.name}</span>
                {p.popular && (
                  <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999, background: BRAND, color: '#fff' }}>推荐</span>
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
          <a href="/docs/api">查看 API 文档 →</a>
        </motion.p>
      </motion.section>

      {/* 核心开发者 */}
      <motion.section style={{ marginTop: 64, marginBottom: 24 }} variants={scrollContainer} {...reveal}>
        <motion.h2 style={sectionTitle} variants={scrollItem}>核心开发者</motion.h2>
        <motion.p style={sectionSub} variants={scrollItem}>由 JadeView 开发委员会维护。</motion.p>
        <motion.div variants={scrollItem}>
        <SpotlightCard
          items={devs}
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
