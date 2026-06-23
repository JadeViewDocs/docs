import { defineConfig } from 'dumi';

// JadeView 文档站 dumi 配置
// 主题：dumi-theme-lobehub（安装后由 dumi 自动启用，无需显式声明）
// 迁移规划见旧项目：JadeView_docs/dumi-migration/迁移规划.md
export default defineConfig({
  // 构建产物目录，与部署链路（amplify.yml / Dockerfile / nginx）对齐
  outputPath: 'dist',
  // 浏览器标签页图标
  favicons: ['/favicon.png'],
  // 搜索框中文占位：lobehub 自带 SearchBar 用 @lobehub/ui 默认英文 "Type keywords..."。
  // 用 head 脚本在客户端把它改成中文，避免覆盖 SearchBar slot 引发 dev 的 'dumi' 解析报错。
  headScripts: [
    {
      // 旧 URL 重定向：文档迁入 /docs 子路由后，把旧路径 /spec/* → /docs/spec/*、/v2api/* → /docs/api/*
      // 客户端早跳转（在 <head> 内、SPA 渲染前执行），保住旧书签 / 外链 / 搜索引擎收录不 404。
      content:
        "(function(){if(typeof window==='undefined')return;var p=location.pathname,m=[['/v2api','/docs/api'],['/spec','/docs/spec']];for(var i=0;i<m.length;i++){var o=m[i][0],n=m[i][1];if(p===o||p.indexOf(o+'/')===0){location.replace(n+p.slice(o.length)+location.search+location.hash);return;}}})();",
    },
    {
      content:
        "(function(){function f(){document.querySelectorAll('input').forEach(function(i){if(i.placeholder&&/keyword/i.test(i.placeholder)){i.placeholder='搜索文档…';}});}if(typeof window!=='undefined'){try{new MutationObserver(f).observe(document.documentElement,{subtree:true,childList:true});}catch(e){}setInterval(f,1000);f();}})();",
    },
    {
      // 底栏顶部边框跟随鼠标高光：给 <footer> 绑 mousemove，写 CSS 变量驱动 footer::after
      content:
        "(function(){function b(){var f=document.querySelector('footer');if(!f||f.__jvSpot)return;f.__jvSpot=1;f.addEventListener('mousemove',function(e){var r=f.getBoundingClientRect();f.style.setProperty('--footer-spot-x',(e.clientX-r.left)+'px');f.style.setProperty('--footer-spot-o','1');});f.addEventListener('mouseleave',function(){f.style.setProperty('--footer-spot-o','0');});}if(typeof window!=='undefined'){setInterval(b,800);}})();",
    },
  ],
  // lobehub 主题在 Windows 上建议关闭 mfsu，规避兼容问题
  mfsu: false,
  // 全局样式补丁
  styles: [
    `
/* 修复：lobehub GradientButton（首页主按钮）悬停时 ::after 背景突变、缺少过渡 */
.ant-btn,
.ant-btn::before,
.ant-btn::after {
  transition: background 0.3s ease, background-color 0.3s ease, border-color 0.3s ease,
    box-shadow 0.3s ease, color 0.3s ease, opacity 0.3s ease, filter 0.3s ease !important;
}

/* 悬浮胶囊标题栏（桌面）：把外层 <header> 由全宽磨砂条改为透明、去边框/阴影，
   并留出上下/左右边距，让内层 .jade-capsule-header 胶囊真正“浮”在内容之上。
   胶囊本体（圆角 / 磨砂 / 主题色 / 滚动阴影）由 Header slot 内联控制。 */
header:has(> .jade-capsule-header) {
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border: none !important;
  box-shadow: none !important;
  /* 胶囊 56px + 顶部留白：header 高度 80（themeConfig.token.headerHeight）− 上下各 12px = 56px */
  padding-block: 12px !important;
  padding-inline: 16px !important;
}

/* 移动端顶栏（无胶囊，含 +36 的 TOC 行）：去掉 header 自身的 backdrop-filter。
   否则它会成为 backdrop 根，掐断其内部移动 TOC 展开浮层的背景模糊（页面内容采样不到）。
   改用不透明背景，TOC 浮层即可正常显示自身毛玻璃。 */
header:not(:has(> .jade-capsule-header)) {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background: var(--ant-color-bg-layout) !important;
}

/* 胶囊内的导航（antd Tabs）：去掉底部分割线与激活下划线（白条），改为「胶囊按钮」——
   hover / 激活显示圆角背景，激活文字取常规色（不再是主题蓝下划线）。 */
.jade-capsule-header .ant-tabs-nav::before { display: none !important; }
.jade-capsule-header .ant-tabs-ink-bar { display: none !important; }
.jade-capsule-header .ant-tabs-nav { margin: 0 !important; }
.jade-capsule-header .ant-tabs-tab {
  margin: 0 4px !important;
  padding: 4px 14px !important;
  border-radius: 9999px !important;
  transition: background-color 0.2s ease, color 0.2s ease !important;
}
.jade-capsule-header .ant-tabs-tab:hover {
  background-color: rgba(128, 128, 128, 0.12) !important;
}
.jade-capsule-header .ant-tabs-tab.ant-tabs-tab-active {
  background-color: rgba(128, 128, 128, 0.18) !important;
}
.jade-capsule-header .ant-tabs-tab:hover .ant-tabs-tab-btn,
.jade-capsule-header .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
  color: inherit !important;
}

/* 首页首屏：标题栏改成透明悬浮胶囊后，顶部会露出页面底色显得空白。
   根因：Hero 的极光背景(AuroraBackground)定位于内容区 <main>(默认从 header 下方 y=headerHeight 开始)，
   够不到胶囊后面。修复：把首页的 <main> 上移整个 headerHeight 到胶囊之下，让极光一直铺到最顶(y=0)；
   再用首屏容器 padding-top 把标题压到胶囊下方合适位置。
   ⚠️ 此值必须等于 themeConfig.siteToken.headerHeight——headerHeight 由 64 调成 80 后这里若仍是
   -64px，顶部会残留 (80−64)=16px 白边（即顶部留白）。 */
main:has(> .layoutkit-flexbox[style*="64vh"]),
main:has(.layoutkit-flexbox[style*="64vh"]) {
  margin-top: -80px !important;
}
.layoutkit-flexbox[style*="64vh"] {
  padding-top: 40px !important;
}
`,
    `
/* 底栏氛围背景（全局 CSS，不用 slot 覆盖，避免 dev 'dumi' 解析问题）：
   ::before 大尺寸渐变 + background-position 动画做流动；顶部 mask 渐隐与上方页面衔接。 */
footer {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
/* 顶部边框「跟随鼠标」高光：--footer-spot-x / --footer-spot-o 由 headScripts 更新，离开淡出 */
footer::after {
  content: '';
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 96px;
  z-index: 2;
  pointer-events: none;
  background:
    radial-gradient(260px 2px at var(--footer-spot-x, 50%) 0, rgba(0, 126, 229, 1), rgba(124, 77, 255, 0.6) 40%, transparent 78%),
    radial-gradient(360px 96px at var(--footer-spot-x, 50%) 0, rgba(0, 126, 229, 0.28), transparent 72%);
  opacity: var(--footer-spot-o, 0);
  transition: opacity 0.3s ease;
}
footer::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: linear-gradient(120deg, rgba(0,126,229,0.20), rgba(124,77,255,0.16), rgba(0,200,170,0.16), rgba(0,126,229,0.20));
  background-size: 300% 300%;
  animation: jvFooterFlow 16s ease infinite;
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 55%);
  mask-image: linear-gradient(to bottom, transparent, #000 55%);
}
@keyframes jvFooterFlow {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`,
    `
/* 浅色模式：页面背景纯白。
   lobehub 的 GlobalStyle 把 html/body/#root 背景设为 colorBgLayout（浅色下是 #f8f8f8 浅灰）；
   正文卡片去掉后正文露出这层浅灰，用户要求浅色文档页为纯白。
   仅用 html[data-prefers-color='light'] 作用域（该属性由 antd-style 按当前 appearance 设置，
   auto/手动浅色都会是 'light'，暗色为 'dark' 不受影响）。 */
html[data-prefers-color='light'],
html[data-prefers-color='light'] body,
html[data-prefers-color='light'] #root {
  background: #fff !important;
}
/* 侧栏（及右侧 TOC）由 lobehub Layout 包在 .ant-draggable-panel-fixed 里，
   该面板自带 colorBgLayout（浅色 #f8f8f8 灰）背景，html/body 的白覆盖不到，
   会导致正文已变白但侧栏仍是灰。浅色下一并设为纯白。 */
html[data-prefers-color='light'] .ant-draggable-panel-fixed {
  background: #fff !important;
}
/* 修复「侧栏收窄折叠后无法恢复」：
   lobehub Layout 在窗口 < laptop 断点(≈992) 时把侧栏折叠（setExpand(false)），
   且折叠后展开开关被内联设为 opacity:0、setExpand 仅随 laptop 断点变化触发 →
   桌面折叠或卡在 768–992 区间时侧栏消失且无法可靠恢复。
   直接让侧栏面板在渲染时（仅非移动端会渲染）始终保持宽度、隐藏折叠开关 → 侧栏稳定常驻。 */
.ant-draggable-panel {
  width: 240px !important;
  min-width: 240px !important;
}
.ant-draggable-panel-fixed {
  width: 240px !important;
  min-width: 240px !important;
}
.ant-draggable-panel-toggle {
  display: none !important;
}
`,
    `
/* 移动端汉堡抽屉菜单美化（作用域 .jade-burger；用 antd v6 cssVar 变量取色）。
   原主题：激活项 background:colorText（暗色=纯白块）+ 深色文字，过于刺眼；分组标题是整条灰条；
   且菜单顶部有与 headerHeight 等高的冗余留白。这里改成与桌面侧栏一致的柔和品牌风格。 */
.jade-burger .ant-menu {
  padding-block-start: 8px !important; /* 去掉与 header 等高的冗余顶部留白 */
}
.jade-burger .ant-menu-item-group-title {
  margin-block: 4px;
  padding-block: 6px;
  letter-spacing: 0.05em;
  color: var(--ant-color-text-tertiary) !important;
  background: transparent !important;
}
.jade-burger .ant-menu-item,
.jade-burger .ant-menu-submenu-title {
  width: calc(100% - 16px) !important;
  margin-inline: 8px !important;
  border-radius: 10px !important;
}
/* 可展开的顶级项（如 文档指南）：标题加粗，hover 反馈，右侧箭头指示可展开 */
.jade-burger .ant-menu-submenu-title {
  font-weight: 600 !important;
}
.jade-burger .ant-menu-submenu-title:hover {
  color: var(--ant-color-text) !important;
  background: var(--ant-color-fill-tertiary) !important;
}
.jade-burger .ant-menu-submenu-arrow {
  color: var(--ant-color-text-tertiary) !important;
}
/* 激活项：柔和品牌色（浅蓝底 + 蓝字），替代刺眼白块 */
.jade-burger .ant-menu-item-selected,
.jade-burger .ant-menu-item-selected:hover,
.jade-burger .ant-menu-item-selected:active {
  font-weight: 600 !important;
  color: #007ee5 !important;
  background: color-mix(in srgb, #007ee5 12%, transparent) !important;
}
`,
    `
/* 文档面包屑（antd Breadcrumb）：注入在 Markdown 正文容器内，会被文章排版的有序列表样式波及
   （内部 <ol> 渲染出 1. 2. 3. 序号、外补外边距）。在 .ant-breadcrumb 作用域内复位列表样式；
   但要保留分隔符「/」两侧的水平间距（清零 li 边距会一并抹掉，故显式补回）。 */
.ant-breadcrumb ol,
.ant-breadcrumb li {
  margin: 0 !important;
  padding: 0 !important;
  list-style: none !important;
}
.ant-breadcrumb li::marker {
  content: '' !important;
}
.ant-breadcrumb .ant-breadcrumb-separator {
  margin-inline: 8px !important;
}
`,
    `
/* 移动端标题栏两个胶囊里的图标按钮（菜单 / 搜索）：lobehub ActionIcon 默认是圆角方形，
   与圆形胶囊不搭，这里改成圆形。 */
.jade-mpill button,
.jade-mpill [role='button'] {
  border-radius: 50% !important;
  background: var(--ant-color-fill-secondary) !important; /* 常驻背景（菜单/搜索按钮）*/
}
.jade-mpill button:hover,
.jade-mpill [role='button']:hover {
  background: var(--ant-color-fill) !important;
}
/* lobehub Head 的 logo/actions 槽容器是 overflow:hidden，会把两个胶囊的圆角与阴影裁掉；
   放开「直接包裹胶囊」的那层容器即可。 */
*:has(> .jade-mpill) {
  overflow: visible !important;
}
`,
  ],
  // 仅中文
  locales: [{ id: 'zh-CN', name: '中文' }],
  themeConfig: {
    name: 'JadeView',
    title: 'JadeView',
    description: '基于 Rust 的轻量、安全、易用的 WebView 窗口库',
    logo: '/favicon.png', // JadeView 方形图标（lobehub 以 36px Avatar 渲染）+ name 文本
    // 加高顶栏（默认 64）：让悬浮胶囊离顶部留出空间（胶囊 56 + 上下各 12 = 80）。
    // 注意键名是 siteToken（store/selectors/site.js: merge(fm.token, themeConfig.siteToken) → customToken），
    // 用 token 不生效。
    siteToken: { headerHeight: 80 },
    // 覆盖 lobehub 主题默认 metadata：否则 Favicons.js 会强行用 lobehub 自己的图标
    //（store/initialState.js 默认 icons.shortcut = https://lobehub.com/favicon.ico，
    // 且 themeConfig = merge(默认, 本配置)，不显式覆盖就会回退到 lobehub 的 favicon）。
    // 顺带把 OG / Twitter 的 lobehub 品牌也改成 JadeView。
    metadata: {
      icons: {
        apple: '/favicon.png',
        icon: '/favicon.png',
        shortcut: '/favicon.png',
      },
      openGraph: { siteName: 'JadeView' },
      twitter: { site: '' },
    },
    // 默认暗色 + 提供切换（lobehub 主题标志性外观）
    prefersColor: { default: 'dark', switch: true },
    socialLinks: {
      github: 'https://github.com/JadeViewDocs/JadeView',
    },
    // 顶部导航：文档指南(/docs/spec) 与 API(/docs/api) 收纳进单一「文档」主入口（子路由）；
    //   「文档」内部的分区切换（文档指南 / API）由 Sidebar slot 顶部的分区按钮负责（见参考图）。
    // 注意：lobehub 主题导航为扁平 Tabs，不支持 children 下拉；SDKs 仍为单链接（指向 /sdk 总览）。
    nav: [
      { title: '文档', link: '/docs/spec' },
      { title: 'SDKs', link: '/sdk' },
      { title: '案例', link: '/showcase' },
      { title: '发行版本', link: '/releases' },
    ],
    // 底栏版权行（lobehub 以 dangerouslySetInnerHTML 渲染，可放链接）：备案号 + 云服务来源
    footer:
      'JadeView · <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">蜀ICP备2022000695号-9</a> · 由 <a href="https://www.dkdun.cn/" target="_blank" rel="noreferrer">dk盾</a> 提供云计算服务',
    footerConfig: {
      columns: [
        {
          title: '文档',
          items: [
            { title: '快速开始', url: '/docs/spec/quickstart' },
            { title: 'API 参考', url: '/docs/api' },
            { title: 'SDK 总览', url: '/sdk' },
          ],
        },
        {
          title: 'SDK',
          items: [
            { title: 'Web SDK', url: '/web-sdk' },
            { title: 'Python SDK', url: '/python-sdk' },
            { title: '易语言 SDK', url: '/easy-language-sdk' },
            { title: '火山 SDK', url: '/voldp-sdk' },
          ],
        },
        {
          title: '社区',
          items: [
            { title: 'QQ 群：703623743', url: 'https://qm.qq.com/q/MVsl5VWokC', openExternal: true },
            { title: 'GitHub Issues', url: 'https://github.com/JadeViewDocs/JadeView/issues', openExternal: true },
            { title: 'Gitee', url: 'https://gitee.com/ilinxuan/JadeView_library', openExternal: true },
            { title: '邮箱', url: 'mailto:ihanlong@qq.com' },
          ],
        },
        {
          title: '友情链接',
          items: [
            { title: '镜芯 API', url: 'https://api2.wer.plus/', openExternal: true },
            { title: '小维 API', url: 'https://openapi.52vmy.cn/', openExternal: true },
            { title: '科利特尔网', url: 'https://www.colithel.com/', openExternal: true },
          ],
        },
      ],
    },
  },
});
