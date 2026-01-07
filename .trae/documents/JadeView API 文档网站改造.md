# JadeView API 文档网站改造计划（符合现有风格）

## 一、清理和调整现有内容
1. **删除 Dyte Guides 文档**：删除 `docs/guides/` 目录下的所有内容
2. **删除 API 文件**：删除 `static/api/` 下的 v1.yaml 和 v2.yaml
3. **删除 API 参考页面**：删除 `src/pages/api.jsx`
4. **清理 partials**：删除 `docs/partials/` 下不需要的 Dyte 特定文件
5. **保留 SDK 文档结构**：保留 `docs/` 下的 SDK 目录（web-core, react-web-core, android-core, flutter-core, ios-core, rn-core, ui-kit, react-ui-kit, angular-ui-kit, android, flutter, ios, react-native 等），但内容先清空或放占位符

## 二、创建 JadeView 文档结构（遵循现有风格）

### 主页面结构
创建 `docs/guides.mdx` 作为主页面（访问路径：http://localhost:3000/guides），使用 CardSection 和 Card 组件展示功能模块

### 文档目录结构
```
docs/
├── guides.mdx                          # 主页面（/guides）
├── introduction.mdx                     # 介绍页面
├── quickstart.mdx                      # 快速开始
├── core/                               # 核心 API
│   ├── _category_.json
│   ├── initialization.mdx               # 初始化
│   ├── message-loop.mdx                # 消息循环
│   └── cleanup.mdx                     # 清理
├── window-management/                   # 窗口管理
│   ├── _category_.json
│   ├── create-window.mdx               # 创建窗口
│   ├── close-window.mdx                # 关闭窗口
│   └── event-handlers.mdx              # 事件处理
├── window-properties/                   # 窗口属性
│   ├── _category_.json
│   ├── title.mdx                       # 标题
│   ├── size.mdx                        # 大小
│   ├── position.mdx                    # 位置
│   └── visibility.mdx                  # 可见性
├── window-state/                       # 窗口状态
│   ├── _category_.json
│   ├── minimize.mdx                     # 最小化
│   ├── maximize.mdx                    # 最大化
│   └── always-on-top.mdx               # 置顶
├── webview/                            # WebView 功能
│   ├── _category_.json
│   ├── navigation.mdx                  # 导航
│   └── javascript.mdx                  # 执行 JS
├── events/                             # 事件系统
│   ├── _category_.json
│   ├── register-events.mdx             # 注册事件
│   └── event-types.mdx                 # 事件类型（包含所有事件：核心、窗口、WebView、主题、其他）
├── theme/                              # 主题外观
│   ├── _category_.json
│   ├── set-theme.mdx                   # 设置主题
│   └── backdrop.mdx                    # 背景材料
├── ipc/                                # IPC 通信
│   ├── _category_.json
│   ├── send-message.mdx                # 发送消息
│   └── register-handler.mdx            # 注册处理器
├── local-server/                       # 本地服务器
│   ├── _category_.json
│   └── create-server.mdx                # 创建服务器
├── reference/                          # API 参考
│   ├── _category_.json
│   ├── data-structures.mdx              # 数据结构
│   └── c-api.mdx                       # C API 列表
├── faq/                                # FAQ
│   ├── _category_.json
│   └── index.mdx                       # 常见问题
└── changelog/                          # 更新日志
    ├── _category_.json
    └── index.mdx                       # 版本更新记录
```

### SDK 文档（保留结构，内容待填充）
```
docs/
├── web-core/                           # Web Core SDK（占位符）
├── react-web-core/                     # React Web Core SDK（占位符）
├── android-core/                       # Android Core SDK（占位符）
├── flutter-core/                       # Flutter Core SDK（占位符）
├── ios-core/                          # iOS Core SDK（占位符）
├── rn-core/                           # React Native Core SDK（占位符）
├── ui-kit/                            # UI Kit（占位符）
├── react-ui-kit/                      # React UI Kit（占位符）
├── angular-ui-kit/                    # Angular UI Kit（占位符）
├── android/                           # Android UI Kit（占位符）
├── flutter/                           # Flutter UI Kit（占位符）
├── ios/                              # iOS UI Kit（占位符）
└── react-native/                      # React Native UI Kit（占位符）
```

### 每个文档页面的风格
- 使用 MDX 格式
- 包含 frontmatter（title, description, sidebar_position 等）
- 使用代码块展示 C 语言示例
- 使用表格展示参数说明
- 使用 CardSection 和 Card 组件组织相关内容
- 使用 Tabs 组件展示不同场景的代码示例（如果需要）
- **重写描述性文字**，使其更符合现有网站的风格，但保持所有 API 函数签名、参数、返回值等核心数据不变

## 三、更新配置文件

### docusaurus.config.js
1. **更新元信息**：
   - title: "JadeView Docs"
   - tagline: "基于 Rust 的 WebView 窗口库 API 文档"
   - url: "/"
   - baseUrl: "/"

2. **调整 navbar**：
   - Logo: 暂时保留现有 logo
   - 导航项：文档、SDKs、FAQ、更新日志
   - 删除 Dyte 特定的 Resources、Support 等

3. **更新 footer**（模拟联系信息）：
   - Logo: 暂时保留现有 logo
   - 产品：文档、SDKs、更新日志
   - 公司：关于我们、联系我们、隐私政策
   - 资源：GitHub、博客

4. **调整插件**：
   - 保留所有 SDK 文档插件（web-core, react-web-core, android-core, flutter-core, ios-core, rn-core, ui-kit, react-ui-kit, angular-ui-kit, android, flutter, ios, react-native, cli, plugin-sdk, community-packages）
   - 保留必要的插件（tailwind, webpack）
   - 删除所有 Dyte 相关的重定向规则

5. **更新预设**：
   - 保留 guides 文档
   - 删除 blog
   - 保留 sitemap 和 Google Tag Manager

6. **保留搜索功能**：
   - 保留 Algolia 搜索配置

### sidebars-default.js
创建 JadeView 的侧边栏结构，按功能模块分组

## 四、更新页面组件

### src/pages/index.jsx
更新为 JadeView 首页，展示：
- 项目介绍
- 主要功能
- 快速开始链接
- API 文档链接
- SDK 文档链接

### docs/guides.mdx（主页面）
创建主页面（访问路径：/guides），包含以下 CardSection：
- **快速开始**：介绍、快速开始指南
- **核心 API**：初始化、消息循环、清理
- **窗口管理**：创建窗口、关闭窗口、事件处理
- **窗口属性**：标题、大小、位置、可见性
- **窗口状态**：最小化、最大化、置顶
- **WebView 功能**：导航、执行 JavaScript
- **事件系统**：注册事件、事件类型
- **主题外观**：设置主题、背景材料
- **IPC 通信**：发送消息、注册处理器
- **本地服务器**：创建服务器
- **API 参考**：数据结构、C API 列表

### src/pages/faq.jsx
创建 FAQ 页面，包含以下常见问题（基于 JadeView 功能生成）：
1. JadeView 是什么？
2. JadeView 支持哪些平台？
3. 如何开始使用 JadeView？
4. JadeView 的内存管理机制是怎样的？
5. 如何创建一个 WebView 窗口？
6. 如何处理事件？
7. 如何设置主题？
8. 如何使用本地服务器？
9. JadeView 是线程安全的吗？
10. 如何清理资源？

### src/pages/changelog/
创建更新日志页面

### 删除不需要的组件
- 删除 Dyte 特定的组件（如 RunInPostmanButton 等）

## 五、更新静态资源

### Logo
- 暂时保留现有 logo（后续替换为 JadeView logo）

### 清理资源
- 删除 Dyte 特定的图片和资源
- 保留通用的资源文件

## 六、文档内容转换与重写

### 从参数文档转换并重写
将 `参数文档/docs/` 下的文件转换为符合现有风格的 MDX 格式，并重写描述性文字：

- `introduction.md` → `docs/introduction.mdx`
  - 重写项目介绍，使其更符合技术文档风格
  - 保持所有功能特性描述不变
  
- `core_api.md` → 拆分为：
  - `docs/core/initialization.mdx`：JadeView_init 函数
  - `docs/core/message-loop.mdx`：run_message_loop 函数
  - `docs/core/cleanup.mdx`：cleanup_all_windows、get_window_count、get_webview_version 函数
  
- `window_management_api.md` → 拆分为：
  - `docs/window-management/create-window.mdx`：create_webview_window 函数
  - `docs/window-management/close-window.mdx`：close_window、request_redraw 函数
  - `docs/window-management/event-handlers.mdx`：set_window_event_handlers 函数
  
- `window_properties_api.md` → 拆分为：
  - `docs/window-properties/title.mdx`：set_window_title 函数
  - `docs/window-properties/size.mdx`：set_window_size 函数
  - `docs/window-properties/position.mdx`：set_window_position 函数
  - `docs/window-properties/visibility.mdx`：set_window_visible、set_window_focus、set_window_enabled 函数
  
- `window_state_api.md` → 拆分为：
  - `docs/window-state/minimize.mdx`：minimize_window 函数
  - `docs/window-state/maximize.mdx`：toggle_maximize_window 函数
  - `docs/window-state/always-on-top.mdx`：set_window_always_on_top 函数
  
- `webview_api.md` → 拆分为：
  - `docs/webview/navigation.mdx`：navigate_to_url 函数
  - `docs/webview/javascript.mdx`：execute_javascript 函数
  
- `event_system.md` → 拆分为：
  - `docs/events/register-events.mdx`：jade_on、jade_off、register_ipc_handler 函数
  - `docs/events/event-types.mdx`：所有事件类型列表（核心、窗口、WebView、主题、其他）
  
- `theme_api.md` → 拆分为：
  - `docs/theme/set-theme.mdx`：set_window_theme、get_window_theme 函数
  - `docs/theme/backdrop.mdx`：set_window_backdrop 函数
  
- `ipc_api.md` → 拆分为：
  - `docs/ipc/send-message.mdx`：send_ipc_message 函数
  - `docs/ipc/register-handler.mdx`：register_ipc_handler、jade_on、jade_off 函数
  
- `local_server_api.md` → `docs/local-server/create-server.mdx`：create_local_server 函数
  
- `data_structures.md` → `docs/reference/data-structures.mdx`：所有数据结构定义
- `c_api.md` → `docs/reference/c-api.mdx`：完整的 C API 函数列表

### 重写原则
- 保持所有 API 函数签名、参数、返回值、数据结构定义等核心数据完全不变
- 重写描述性文字，使其更清晰、更符合技术文档风格
- 添加更多的使用场景说明和最佳实践
- 使用更友好的语言风格
- 添加代码示例的详细说明
- 使用表格清晰展示参数说明

### SDK 占位符内容
为每个 SDK 目录创建占位符内容，说明"SDK 文档即将推出"

### FAQ 内容生成
根据 JadeView 的功能特性生成常见问题和解答，包括：
- 基本概念和功能介绍
- 常见使用场景
- 错误处理和调试
- 最佳实践建议

### 更新日志内容
创建初始的更新日志，记录当前版本信息

## 七、待后续填充的内容

1. **JadeView Logo**：后续替换
2. **SDK 文档**：后续提供各个编程语言的 SDK 文档
3. **更新日志**：后续填充版本更新记录
4. **联系信息**：后续更新为真实信息