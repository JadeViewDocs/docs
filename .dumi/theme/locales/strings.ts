// 自定义 slot / 组件的多语言文案字典（dumi 内置外壳文案已自带中/英，这里只放「我们自己写的」文案）。
// 取词：useT() 读当前路由语言（useSiteStore(s => s.locale.id)），返回对应语言对象；未知语言回退中文。
// 约定：两套语言对象「结构必须一致」（同样的键），新增文案两边都要加。
// @ts-ignore 主题 store 深层路径无类型声明
import { useSiteStore } from 'dumi-theme-lobehub/dist/store/useSiteStore';

const zh = {
  // 顶部导航项（按 link 映射，见 JadeNavbar）
  nav: { docs: '文档', sdks: 'SDKs', products: '产品', showcase: '案例', releases: '发行版本' },
  // 导航「文档」「SDKs」下拉
  navbar: {
    countSuffix: ' 篇', // {n} 篇
    sdkGroupTitles: { frontend: '前端 & Python', more: '更多语言' },
    sdk: {
      web: { title: 'Web SDK', desc: '前端 / JavaScript 集成' },
      py: { title: 'Python SDK', desc: 'Python 桌面应用开发' },
      py2: { title: 'Python SDK 2', desc: '基于 ctypes 的新版绑定' },
      go: { title: 'Golang SDK', desc: 'Go 封装，纯 Go 零依赖构建' },
      ey: { title: '易语言 SDK', desc: '易语言模块封装' },
      vol: { title: '火山 SDK', desc: '火山窗口 SDK 适配' },
    },
    docsSections: {
      spec: { title: '文档指南', desc: '入门教程、核心设计原理与程序发行行为。' },
      api: { title: 'API', desc: '窗口、WebView、IPC、原生 UI 等完整 C API 参考。' },
    },
    download: { title: 'SDK 下载中心', desc: '获取各端 SDK 安装包与历史版本' },
    products: {
      jadepack: { title: 'JadePack', desc: '官方图形化打包工具：JAPK 混淆 / 签名加密与安装包构建。' },
      jadeEc: { title: 'Jade EC 查看器', desc: '易语言 .ec 模块现代化查看器，三栏布局 + 多维度搜索。' },
    },
  },
  // 首页 HomeExtra
  home: {
    features: [
      { image: '🦀', title: 'Rust 核心', desc: '核心库采用 Rust 编写，内存安全、线程安全，杜绝空指针与数据竞争；约 3MB 运行时，完整启动仅需约 16ms。', link: '/docs/spec/behavior' },
      { image: '🌐', title: '跨平台 · 系统 WebView', desc: '一套代码同时支持 Windows 与 Linux，复用系统自带 WebView（Windows 上的 WebView2、Linux 上的 WebKitGTK），享受与系统浏览器同级别的安全更新与兼容性。', link: '/docs/spec/compatibility' },
      { image: '🔗', title: 'C 语言 API', desc: '稳定的二进制接口（ABI），跨语言调用无性能损耗，接口向后兼容。', link: '/docs/api' },
      { image: '⚡', title: 'IPC 双向通信', desc: '前后端双向通信延迟低于 1ms、每秒 800+ 请求；jade.invoke / jade.on 高效互通。', link: '/docs/spec/ipc-communication' },
      { image: '🧩', title: 'MCP 协议支持', desc: '基于 Model Context Protocol 标准，支持 AI 模型直接调用 JadeView API，实现智能体驱动的桌面应用开发。', link: '/docs/spec/mcp' },
      { image: '🔒', title: '资源安全 · JAPK', desc: 'JAPK 资源包支持代码混淆、AES-256-GCM 加密与 Ed25519 签名，可内存载入、无需落地磁盘。', link: '/docs/api/japk' },
    ],
    stepsTitle: '三步上手',
    stepsSub: '用熟悉的 C 接口，三步即可跑起一个 WebView 窗口。',
    steps: [
      {
        no: '1', title: '初始化库', lang: 'c',
        desc: '注册 app-ready 事件后初始化 DLL，完整流程仅需约 16ms（不含 HTML 加载）。',
        code: `#include "jadeview.h"

int main() {
    jade_on("app-ready", app_ready_callback);
    JadeView_init(1, NULL, NULL, "我的应用", "com.example.myapp", 0);
    run_message_loop();
    return 0;
}`,
      },
      {
        no: '2', title: '创建窗口', lang: 'c',
        desc: '配置参数，一行调用即可创建 WebView 窗口，支持自定义标题栏、无边框窗口。',
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
        no: '3', title: 'IPC 通信与运行', lang: 'javascript',
        desc: '前后端双向 IPC，低于 1ms 延迟，jade.invoke / jade.on 即可高效通信。',
        code: `// 前端调用后端 API
const res = await jade.invoke('getData', {});
// 前端监听后端事件
jade.on('backend-event', (data) => {});`,
      },
    ],
    techTitle: '使用你喜欢的前端技术栈',
    techSub: '从 React、Vue 到原生 HTML，用任何熟悉的前端技术构建桌面应用。',
    freeTitle: '全功能 · 永久免费',
    freeSub: 'DLL 与 Lib 提供完全一致的 C API，仅链接方式不同；全功能免费，无需商业授权。',
    recommend: '推荐',
    viewApi: '查看 API 文档 →',
    plans: [
      { name: 'DLL 动态库', desc: '运行时动态加载，适合快速集成。', popular: false, items: ['WebView 窗口创建', '事件系统支持', '自定义标题栏', 'IPC 双向通信', '完整 C API', '全功能免费'] },
      { name: 'Lib 静态库', desc: '编译时静态链接，可编译进可执行文件，独立部署无依赖。', popular: true, items: ['以上 DLL 全部能力', '编译进可执行文件', '无运行时依赖', '独立分发'] },
      { name: '企业定制', desc: '专属技术支持与定制开发。', popular: false, items: ['源码级定制', '专属技术支持', '性能优化咨询', '长期版本维护'] },
    ],
    devsTitle: '核心开发者',
    devsSub: '由 JadeView 开发委员会维护。',
    devs: [
      { name: 'Tuyang', avatar: '/avatar/B.jpg', url: 'https://github.com/tuyangJs', bio: 'JadeView 核心架构师，负责 Rust 核心库开发与 IPC 通信协议设计。' },
      { name: '洛洛', avatar: '/avatar/L.jpg', url: 'https://github.com/PatrickAlex2019', bio: '负责 UI 设计 ＆ Logo 设计。' },
      { name: '花生', avatar: '/avatar/D.jpg', url: 'https://github.com/245867', bio: '全能型开发者，负责 JadeView 项目的对外宣传与维护。' },
      { name: '落雪有声', avatar: '/avatar/C.jpg', url: 'https://github.com/luoxueyousheng', bio: '火山视窗 SDK 核心开发者，负责适配火山视窗 API。' },
      { name: '哪有不湿鞋', avatar: '/avatar/A.jpg', url: 'https://github.com/a657938016', bio: '易语言 SDK 核心开发者，负责适配易语言模块维护。' },
      { name: '青舟', avatar: '/avatar/Q.jpg', url: 'https://github.com/lazyso', bio: '全栈开发者，负责 Python SDK2 的开发及维护。' },
    ],
  },
  // 文档页面包屑行（DocBreadcrumb）
  doc: {
    editPage: '编辑此页',
    contributorsTip: (name: string, commits: number) => `${name} · ${commits} 次提交`,
  },
  // 发行版本页（ReleaseNotes builtin）
  releases: {
    title: '发行版本',
    subtitle: 'JadeView 各版本的更新内容、发布日期与下载入口。',
    today: '今天',
    yesterday: '昨天',
    dateLocale: 'zh-CN',
    loading: '加载中…',
    loadFailed: '加载失败 · ',
    retry: '重试',
    backToList: '返回列表',
    noDetail: '暂无详细说明',
    notFound: '未找到该版本',
    tabReleases: '发行版本',
    tabCalendar: '发行日历',
    tabAll: '所有发行',
    latestStable: '最新稳定版',
    stable: '稳定版',
    prerelease: '预发布',
    filterAll: '全部',
    prev: '上一页',
    next: '下一页',
    pageInfo: (page: number, total: number, count: number) => `第 ${page} / ${total} 页 · 共 ${count} 个发行`,
    policy: [
      { t: '主版本号', d: '含破坏性更新和新特性，不在发布周期内' },
      { t: '次版本号', d: '每月发布带有新特性的向下兼容版本' },
      { t: '修订版本号', d: '每周末日常 bugfix 更新，紧急修复随时发布' },
    ],
    week: ['日', '一', '二', '三', '四', '五', '六'],
    months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
  },
  // SDK 下载页（SdkDownload builtin）
  sdkDownload: {
    title: 'SDK 下载中心',
    subtitle: '选择对应平台的 SDK 模块进行下载，每个 SDK 均包含完整的 API 封装与示例代码。',
    about: 'SDK 介绍',
    changelog: '更新日志',
    authorPrefix: '作者 ',
    compatPrefix: '兼容 JadeView ',
    fetching: '获取中…',
    download: '下载',
    noFile: '暂无下载文件',
    empty: '暂无 SDK 信息，请稍后重试。',
  },
  // 页底（自定义 Footer slot）；备案号 / 服务商等法务文案保持中文。
  footer: {
    copyright:
      '<a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">蜀ICP备2022000695号-9</a><br>由 <a href="https://www.dkdun.cn/" target="_blank" rel="noreferrer">林枫云</a> 提供云计算服务',
    tagline: '轻量、安全、易用的 WebView 窗口库。',
    rights: '保留所有权利',
    columns: [
      {
        title: 'SDK',
        items: [
          { title: 'Web SDK', url: '/sdks/web-sdk', openExternal: false },
          { title: 'Python SDK', url: '/sdks/python-sdk', openExternal: false },
          { title: '易语言 SDK', url: '/sdks/easy-language-sdk', openExternal: false },
          { title: '火山 SDK', url: '/sdks/voldp-sdk', openExternal: false },
        ],
      },
      {
        title: '社区',
        items: [
          { title: 'QQ 群：703623743', url: 'https://qm.qq.com/q/MVsl5VWokC', openExternal: true },
          { title: 'GitHub Issues', url: 'https://github.com/JadeViewDocs/JadeView/issues', openExternal: true },
          { title: 'Gitee', url: 'https://gitee.com/ilinxuan/JadeView_library', openExternal: true },
          { title: '邮箱', url: 'mailto:ihanlong@qq.com', openExternal: false },
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
  // 案例页（Showcase builtin）；案例为真实项目，名称保留、描述/徽标本地化。
  showcase: {
    subtitle: '卓越的高性能应用，汇聚现代原生美学。',
    cta: '获取应用',
    cases: [
      {
        name: 'Electron asar GUI 工具',
        desc: '一款简洁易用的 Electron asar 文件打包 / 解包工具，图形界面操作，开箱即用。',
        link: 'https://github.com/HyJunYaa/Electron-asar-Gui-Tool',
        image: '/showcase/electron-asar.jpg',
        badge: '社区生态',
      },
      {
        name: 'Jade EC 查看器',
        desc: '易语言 .ec 模块文件现代化查看器，支持浏览子程序、DLL 命令、类、自定义数据类型、全局变量与常量；三栏布局、亚克力背景、深浅主题与多维度搜索。',
        link: '/jade-ec',
        image: '/showcase/jade-ec.jpg',
        badge: '',
      },
    ],
  },
  jadepack: {
    hero: {
      eyebrow: '官方打包工具',
      logo: '/product/jadepack.svg',
      title: 'JadePack',
      tagline: '把前端资源一键构建为 JAPK 资源包（混淆 / 签名加密），或生成 Windows 安装包。无需命令行，桌面客户端可视化操作。',
      note: '按月付费 · Windows 10 / 11 · NSIS 安装包',
      actions: [
        { text: '下载 JadePack', link: 'https://store.jade.run/downloads/jadepack/latest', external: true, primary: true },
        { text: '查看接入文档', link: '/docs/api/jadepack' },
      ],
    },
    features: {
      title: '核心能力',
      sub: '从轻量混淆到签名加密，覆盖资源分发全链路。',
      items: [
        { icon: '🔒', title: '资源混淆', desc: '3 层可逆变换（XOR + 字节置换 + 位旋转），生成非明文混淆包，加载无需公钥，适合内部工具与原型分发。' },
        { icon: '🛡️', title: '签名加密', desc: 'Ed25519 签名 + AES-256-GCM 加密双重保护，验证来源与完整性、防篡改，面向生产与商业分发。' },
        { icon: '📦', title: '解包文件', desc: '可将 .node 原生模块等指定文件设为解包存储，不混淆 / 加密，便于从文件系统直接加载。' },
        { icon: '🏗️', title: '编译安装包', desc: '一键打包为 NSIS 安装包，内含主程序、资源与 WebView2 运行时；压缩级别、图标、语言、快捷方式可配。' },
      ],
    },
    integration: {
      title: '与 JadeView 集成',
      sub: 'JadePack 产出的 JAPK 包通过 JadeView API 加载。',
      items: [
        { code: 'set_protocol_service_path', title: '本地文件加载', desc: '注册本地 JAPK / 目录到自定义协议，拿到可直接打开的 URL', link: '/docs/api/japk' },
        { code: 'JadeView_load_from_bytes', title: '从内存加载', desc: '直接从内存字节加载；签名包加载前用 set_public_key 设公钥', link: '/docs/api/japk-load-memory' },
      ],
    },
    cta: {
      title: '开始打包你的应用',
      desc: '下载 JadePack，几步生成受保护的 JAPK 资源包与安装程序。',
      action: { text: '下载 JadePack', link: 'https://store.jade.run/downloads/jadepack/latest', external: true },
    },
  },
  jadeEc: {
    hero: {
      eyebrow: '易语言 · 模块查看器',
      logo: '/product/jade-ec.svg',
      title: 'Jade EC 查看器',
      tagline: '易语言 .ec 模块文件的现代化查看器：解析浏览子程序、DLL 命令、类、数据类型、全局变量与常量，三栏布局 + 多维度搜索，像读 IDE 一样读模块。',
      note: '基于 JadeView 构建 · 约 3MB 运行时 · 毫秒级启动',
      actions: [
        { text: '下载最新版', link: 'https://github.com/tuyangJs/Jade_ec/releases', external: true, primary: true },
        { text: 'GitHub 源码', link: 'https://github.com/tuyangJs/Jade_ec', external: true },
      ],
    },
    features: {
      title: '核心功能',
      sub: '解析、检索、跳转，一应俱全。',
      items: [
        { icon: '🗂️', title: '分类浏览', desc: '子程序、DLL 命令、类、自定义数据类型、全局变量、常量分区清晰，拖拽或双击 .ec 直接打开。' },
        { icon: '🔍', title: '多维度搜索', desc: '按名称 / 类型 / 备注 / 方法 / 参数检索，空格分词搜多个关键词，多种匹配模式。' },
        { icon: '⌨️', title: '命令面板', desc: 'Ctrl + P 跨所有分类模糊跳转任意符号，前缀 / 子串 / 子序列匹配，键盘上下选择。' },
        { icon: '💡', title: '参数提示 / 跳转', desc: '参数类、返回类悬浮即得 VSCode 式类型提示，自定义类一键跳转到详情。' },
        { icon: '🔗', title: '交叉引用', desc: '类与数据类型详情页列出所有被引用位置，配合类型跳转形成双向导航。' },
        { icon: '⭐', title: '收藏 / 记忆', desc: '☆ 收藏常用项、记录搜索历史与导航位置，按文件 MD5 独立存储。' },
      ],
    },
    shots: {
      title: '界面一览',
      sub: '现代化三栏布局，亚克力材质，深浅主题与可调侧边栏。',
      items: [
        { cap: '主界面 · 三栏布局', src: 'https://github.com/user-attachments/assets/364c856f-18ff-4d4c-8d8a-8ae4af2d1448' },
        { cap: '多维度搜索 · 多模式 / 空格分词', src: 'https://github.com/user-attachments/assets/f0b8c5b2-2c24-4b3b-8d81-7a928de6d7d3' },
        { cap: '背景材质与透明度', src: 'https://github.com/user-attachments/assets/f95f2a97-8c63-4fe7-b4a1-69e521e73ed9' },
        { cap: '深色 / 浅色主题', src: 'https://github.com/user-attachments/assets/4647f635-d403-489c-8d1d-11600879b97d' },
      ],
    },
    cta: {
      title: '用现代方式阅读 .ec 模块',
      desc: '下载 Jade EC 查看器，或在 GitHub 查看源码与更新日志。',
      action: { text: '下载最新版', link: 'https://github.com/tuyangJs/Jade_ec/releases', external: true },
    },
  },
};

const en: typeof zh = {
  nav: { docs: 'Docs', sdks: 'SDKs', products: 'Products', showcase: 'Showcase', releases: 'Releases' },
  navbar: {
    countSuffix: ' docs', // {n} docs
    sdkGroupTitles: { frontend: 'Frontend & Python', more: 'More Languages' },
    sdk: {
      web: { title: 'Web SDK', desc: 'Frontend / JavaScript integration' },
      py: { title: 'Python SDK', desc: 'Python desktop app development' },
      py2: { title: 'Python SDK 2', desc: 'New ctypes-based bindings' },
      go: { title: 'Golang SDK', desc: 'Go wrapper, pure-Go zero-dependency build' },
      ey: { title: 'E-Language SDK', desc: 'E-Language (易语言) module wrapper' },
      vol: { title: 'VolDP SDK', desc: 'VolDP window SDK adaptation' },
    },
    docsSections: {
      spec: { title: 'Guide', desc: 'Getting-started tutorials, core design principles and release behavior.' },
      api: { title: 'API', desc: 'Complete C API reference: windows, WebView, IPC, native UI and more.' },
    },
    download: { title: 'SDK Download Center', desc: 'Get SDK installers and past versions for every platform' },
    products: {
      jadepack: { title: 'JadePack', desc: 'Official GUI packaging tool: JAPK obfuscation / signing and installer builds.' },
      jadeEc: { title: 'Jade EC Viewer', desc: 'A modern viewer for E-Language .ec modules — three-column layout + search.' },
    },
  },
  home: {
    features: [
      { image: '🦀', title: 'Rust Core', desc: 'The core library is written in Rust — memory-safe and thread-safe, eliminating null pointers and data races. ~3MB runtime, full startup in ~16ms.', link: '/docs/spec/behavior' },
      { image: '🌐', title: 'Cross-platform · System WebView', desc: 'One codebase for both Windows and Linux, reusing the system WebView (WebView2 on Windows, WebKitGTK on Linux) for browser-grade security updates and compatibility.', link: '/docs/spec/compatibility' },
      { image: '🔗', title: 'C API', desc: 'A stable binary interface (ABI) with zero-overhead cross-language calls and backward-compatible APIs.', link: '/docs/api' },
      { image: '⚡', title: 'Two-way IPC', desc: 'Two-way front-end/back-end communication with sub-1ms latency and 800+ requests per second via jade.invoke / jade.on.', link: '/docs/spec/ipc-communication' },
      { image: '🧩', title: 'MCP Protocol Support', desc: 'Based on the Model Context Protocol standard, enabling AI models to directly invoke JadeView APIs for intelligent agent-driven desktop application development.', link: '/docs/spec/mcp' },
      { image: '🔒', title: 'Asset Security · JAPK', desc: 'JAPK asset packages support code obfuscation, AES-256-GCM encryption and Ed25519 signing, and can be loaded in memory without touching disk.', link: '/docs/api/japk' },
    ],
    stepsTitle: 'Get Started in 3 Steps',
    stepsSub: 'Spin up a WebView window in three steps using the familiar C API.',
    steps: [
      {
        no: '1', title: 'Initialize', lang: 'c',
        desc: 'Register the app-ready event then initialize the DLL — the whole flow takes ~16ms (excluding HTML loading).',
        code: `#include "jadeview.h"

int main() {
    jade_on("app-ready", app_ready_callback);
    JadeView_init(1, NULL, NULL, "My App", "com.example.myapp", 0);
    run_message_loop();
    return 0;
}`,
      },
      {
        no: '2', title: 'Create a Window', lang: 'c',
        desc: 'Configure the options and create a WebView window in one call — with custom title bars and frameless windows.',
        code: `WebViewWindowOptions opts = {
    .title = "My Desktop App",
    .width = 1024, .height = 768,
    .resizable = 1, .remove_titlebar = 0
};
uint32_t win = create_webview_window(
    "https://myapp.com", 0, &opts, NULL
);`,
      },
      {
        no: '3', title: 'IPC & Run', lang: 'javascript',
        desc: 'Two-way IPC with sub-1ms latency — communicate efficiently via jade.invoke / jade.on.',
        code: `// Frontend calls a backend API
const res = await jade.invoke('getData', {});
// Frontend listens for backend events
jade.on('backend-event', (data) => {});`,
      },
    ],
    techTitle: 'Use the Front-end Stack You Love',
    techSub: 'From React and Vue to plain HTML — build desktop apps with any front-end tech you know.',
    freeTitle: 'Full-featured · Free Forever',
    freeSub: 'DLL and Lib expose the exact same C API — only the linking differs. Fully free, no commercial license required.',
    recommend: 'Popular',
    viewApi: 'View API docs →',
    plans: [
      { name: 'DLL (Dynamic)', desc: 'Loaded dynamically at runtime — great for quick integration.', popular: false, items: ['WebView window creation', 'Event system', 'Custom title bar', 'Two-way IPC', 'Full C API', 'All features free'] },
      { name: 'Lib (Static)', desc: 'Statically linked at compile time — compile into your executable for dependency-free deployment.', popular: true, items: ['Everything in DLL', 'Compiled into the executable', 'No runtime dependencies', 'Standalone distribution'] },
      { name: 'Enterprise', desc: 'Dedicated support and custom development.', popular: false, items: ['Source-level customization', 'Dedicated technical support', 'Performance consulting', 'Long-term maintenance'] },
    ],
    devsTitle: 'Core Developers',
    devsSub: 'Maintained by the JadeView development committee.',
    devs: [
      { name: 'Tuyang', avatar: '/avatar/B.jpg', url: 'https://github.com/tuyangJs', bio: 'Lead architect of JadeView, responsible for the Rust core library and IPC protocol design.' },
      { name: '洛洛', avatar: '/avatar/L.jpg', url: 'https://github.com/PatrickAlex2019', bio: 'In charge of UI and logo design.' },
      { name: '花生', avatar: '/avatar/D.jpg', url: 'https://github.com/245867', bio: 'All-round developer, handling JadeView’s outreach and maintenance.' },
      { name: '落雪有声', avatar: '/avatar/C.jpg', url: 'https://github.com/luoxueyousheng', bio: 'Core developer of the VolDP SDK, adapting the VolDP API.' },
      { name: '哪有不湿鞋', avatar: '/avatar/A.jpg', url: 'https://github.com/a657938016', bio: 'Core developer of the E-Language SDK, maintaining the E-Language module.' },
      { name: '青舟', avatar: '/avatar/Q.jpg', url: 'https://github.com/lazyso', bio: 'Full-stack developer, building and maintaining Python SDK 2.' },
    ],
  },
  doc: {
    editPage: 'Edit this page',
    contributorsTip: (name: string, commits: number) =>
      `${name} · ${commits} commit${commits > 1 ? 's' : ''}`,
  },
  releases: {
    title: 'Releases',
    subtitle: 'Update notes, release dates and downloads for each version of JadeView.',
    today: 'Today',
    yesterday: 'Yesterday',
    dateLocale: 'en-US',
    loading: 'Loading…',
    loadFailed: 'Failed to load · ',
    retry: 'Retry',
    backToList: 'Back to list',
    noDetail: 'No details available',
    notFound: 'Version not found',
    tabReleases: 'Releases',
    tabCalendar: 'Calendar',
    tabAll: 'All Releases',
    latestStable: 'Latest Stable',
    stable: 'Stable',
    prerelease: 'Prerelease',
    filterAll: 'All',
    prev: 'Previous',
    next: 'Next',
    pageInfo: (page: number, total: number, count: number) => `Page ${page} / ${total} · ${count} releases`,
    policy: [
      { t: 'Major', d: 'Breaking changes and new features; outside the regular release cadence.' },
      { t: 'Minor', d: 'Backward-compatible feature releases, shipped monthly.' },
      { t: 'Patch', d: 'Routine weekly bugfix updates; urgent fixes ship anytime.' },
    ],
    week: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  },
  sdkDownload: {
    title: 'SDK Download Center',
    subtitle: 'Pick the SDK module for your platform. Each SDK ships with complete API wrappers and example code.',
    about: 'About',
    changelog: 'Changelog',
    authorPrefix: 'By ',
    compatPrefix: 'Compatible with JadeView ',
    fetching: 'Fetching…',
    download: 'Download',
    noFile: 'No download available',
    empty: 'No SDK information available. Please try again later.',
  },
  footer: {
    copyright:
      '<a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">蜀ICP备2022000695号-9</a><br>Cloud services by <a href="https://www.dkdun.cn/" target="_blank" rel="noreferrer">林枫云</a>',
    tagline: 'A lightweight, secure and easy-to-use WebView window library.',
    rights: 'All rights reserved',
    columns: [
      {
        title: 'SDK',
        items: [
          { title: 'Web SDK', url: '/sdks/web-sdk', openExternal: false },
          { title: 'Python SDK', url: '/sdks/python-sdk', openExternal: false },
          { title: 'E-Language SDK', url: '/sdks/easy-language-sdk', openExternal: false },
          { title: 'VolDP SDK', url: '/sdks/voldp-sdk', openExternal: false },
        ],
      },
      {
        title: 'Community',
        items: [
          { title: 'QQ Group: 703623743', url: 'https://qm.qq.com/q/MVsl5VWokC', openExternal: true },
          { title: 'GitHub Issues', url: 'https://github.com/JadeViewDocs/JadeView/issues', openExternal: true },
          { title: 'Gitee', url: 'https://gitee.com/ilinxuan/JadeView_library', openExternal: true },
          { title: 'Email', url: 'mailto:ihanlong@qq.com', openExternal: false },
        ],
      },
      {
        title: 'Friends',
        items: [
          { title: 'JingXin API', url: 'https://api2.wer.plus/', openExternal: true },
          { title: 'XiaoWei API', url: 'https://openapi.52vmy.cn/', openExternal: true },
          { title: 'Colithel', url: 'https://www.colithel.com/', openExternal: true },
        ],
      },
    ],
  },
  showcase: {
    subtitle: 'Exceptional high-performance apps with modern, native aesthetics.',
    cta: 'Get the app',
    cases: [
      {
        name: 'Electron asar GUI Tool',
        desc: 'A clean, easy-to-use tool for packing and unpacking Electron asar files — graphical and ready to use out of the box.',
        link: 'https://github.com/HyJunYaa/Electron-asar-Gui-Tool',
        image: '/showcase/electron-asar.jpg',
        badge: 'Community',
      },
      {
        name: 'Jade EC Viewer',
        desc: 'A modern viewer for E-Language .ec module files — browse subroutines, DLL commands, classes, custom data types, globals and constants; with a three-column layout, acrylic background, light/dark themes and multi-dimensional search.',
        link: '/en-US/jade-ec',
        image: '/showcase/jade-ec.jpg',
        badge: '',
      },
    ],
  },
  jadepack: {
    hero: {
      eyebrow: 'Official packaging tool',
      logo: '/product/jadepack.svg',
      title: 'JadePack',
      tagline: 'Turn your frontend assets into JAPK packages (obfuscated / signed & encrypted) or a Windows installer in one click — a visual desktop client, no command line.',
      note: 'Monthly subscription · Windows 10 / 11 · NSIS installer',
      actions: [
        { text: 'Download JadePack', link: 'https://store.jade.run/downloads/jadepack/latest', external: true, primary: true },
        { text: 'Integration docs', link: '/docs/api/jadepack' },
      ],
    },
    features: {
      title: 'Capabilities',
      sub: 'From lightweight obfuscation to signed encryption — the whole distribution chain.',
      items: [
        { icon: '🔒', title: 'Obfuscation', desc: 'A 3-layer reversible transform (XOR + byte permutation + bit rotation) produces a non-plaintext package; loads without a public key, ideal for internal tools and prototypes.' },
        { icon: '🛡️', title: 'Sign & encrypt', desc: 'Ed25519 signature + AES-256-GCM encryption verify origin and integrity and prevent tampering — for production and commercial distribution.' },
        { icon: '📦', title: 'Unpacked files', desc: 'Mark files such as .node native modules as unpacked — neither obfuscated nor encrypted — so they load straight from the filesystem.' },
        { icon: '🏗️', title: 'Build installer', desc: 'Package into an NSIS installer with the main program, assets and WebView2 runtime; configurable compression, icon, language and shortcuts.' },
      ],
    },
    integration: {
      title: 'Integrates with JadeView',
      sub: 'JAPK packages from JadePack load through the JadeView API.',
      items: [
        { code: 'set_protocol_service_path', title: 'Load from a local file', desc: 'Register a local JAPK / directory to the custom protocol and get a ready-to-open URL', link: '/docs/api/japk' },
        { code: 'JadeView_load_from_bytes', title: 'Load from memory', desc: 'Load straight from in-memory bytes; set a public key before loading signed packages', link: '/docs/api/japk-load-memory' },
      ],
    },
    cta: {
      title: 'Start packaging your app',
      desc: 'Download JadePack and produce protected JAPK packages and an installer in a few steps.',
      action: { text: 'Download JadePack', link: 'https://store.jade.run/downloads/jadepack/latest', external: true },
    },
  },
  jadeEc: {
    hero: {
      eyebrow: 'E-Language · Module viewer',
      logo: '/product/jade-ec.svg',
      title: 'Jade EC Viewer',
      tagline: 'A modern viewer for E-Language .ec module files: browse subroutines, DLL commands, classes, data types, globals and constants — a three-column layout with multi-dimensional search, so you read a module like in an IDE.',
      note: 'Built with JadeView · ~3 MB runtime · millisecond startup',
      actions: [
        { text: 'Download latest', link: 'https://github.com/tuyangJs/Jade_ec/releases', external: true, primary: true },
        { text: 'Source on GitHub', link: 'https://github.com/tuyangJs/Jade_ec', external: true },
      ],
    },
    features: {
      title: 'Core features',
      sub: 'Parse, search and jump — everything you need.',
      items: [
        { icon: '🗂️', title: 'Browse by category', desc: 'Subroutines, DLL commands, classes, custom data types, globals and constants, clearly sectioned; drag or double-click an .ec to open.' },
        { icon: '🔍', title: 'Multi-dimensional search', desc: 'Search by name / type / remark / method / parameter, multi-keyword with spaces, multiple matching modes.' },
        { icon: '⌨️', title: 'Command palette', desc: 'Ctrl + P fuzzy-jumps to any symbol across all categories — prefix / substring / subsequence — with keyboard navigation.' },
        { icon: '💡', title: 'Hints & jumps', desc: 'Hover any parameter/return class for VSCode-style type hints; click a custom class to jump to its detail.' },
        { icon: '🔗', title: 'Cross-references', desc: 'Class and data-type pages list every place a type is referenced, pairing with type jumps for two-way navigation.' },
        { icon: '⭐', title: 'Favorites & memory', desc: 'Star (☆) frequent items and remember search history and navigation position, stored per file by MD5.' },
      ],
    },
    shots: {
      title: 'A look at the interface',
      sub: 'A modern three-column layout with acrylic material, light/dark themes and a resizable sidebar.',
      items: [
        { cap: 'Main interface · three-column layout', src: 'https://github.com/user-attachments/assets/364c856f-18ff-4d4c-8d8a-8ae4af2d1448' },
        { cap: 'Search · multiple modes / space keywords', src: 'https://github.com/user-attachments/assets/f0b8c5b2-2c24-4b3b-8d81-7a928de6d7d3' },
        { cap: 'Background material & opacity', src: 'https://github.com/user-attachments/assets/f95f2a97-8c63-4fe7-b4a1-69e521e73ed9' },
        { cap: 'Light / Dark theme', src: 'https://github.com/user-attachments/assets/4647f635-d403-489c-8d1d-11600879b97d' },
      ],
    },
    cta: {
      title: 'Read .ec modules the modern way',
      desc: 'Download Jade EC Viewer, or browse the source and changelog on GitHub.',
      action: { text: 'Download latest', link: 'https://github.com/tuyangJs/Jade_ec/releases', external: true },
    },
  },
};

const STRINGS = { 'zh-CN': zh, 'en-US': en } as const;
export type Strings = typeof zh;

export function useT(): Strings {
  const id = useSiteStore((s: any) => s?.locale?.id) as keyof typeof STRINGS;
  return STRINGS[id] ?? zh;
}

// 当前语言的路由前缀（zh-CN 默认为 '/'，en-US 为 '/en-US'）。
export function useLocaleBase(): string {
  return useSiteStore((s: any) => s?.locale?.base) || '/';
}

// 把站内绝对链接补上当前语言前缀；默认语言（base '/'）或外链/已带前缀的不变。
export function localeHref(base: string, link?: string): string | undefined {
  if (!link || !link.startsWith('/') || base === '/') return link;
  const b = base.replace(/\/$/, '');
  return link === b || link.startsWith(b + '/') ? link : b + link;
}
