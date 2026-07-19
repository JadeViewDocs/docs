---
order: 0
---

# 介绍

JadeUI Python SDK 是一个用于 Python 开发桌面应用的库，提供了基于 JadeView WebView 技术的窗口管理、IPC 通信、系统集成和 Web 前端集成功能。当前文档对应 SDK **2.3.x**，对齐 JadeView **v2.3.0 (Build 26G02)**。

## 什么是 JadeUI Python SDK

JadeUI Python SDK 是一套面向对象的 Python 库，为 Python 开发者提供了创建现代桌面应用的完整工具链。它基于 JadeView 的 WebView 技术，允许开发者使用 Python 作为后端，Web 技术（HTML/CSS/JavaScript）作为前端，快速构建跨平台桌面应用。

## 核心功能

- **应用管理**：`JadeUIApp` 类提供应用生命周期管理
- **窗口管理**：`Window` 类支持创建、配置和控制 WebView 窗口
- **IPC 通信**：`IPCManager` 类实现 Python 后端与 Web 前端的双向通信
- **本地服务器**：`LocalServer` 类提供内置 HTTP 服务器用于托管 Web 内容
- **路由系统**：`Router` 类提供后端主导的路由系统，支持内置模板和自定义模板
- **事件系统**：`EventEmitter` 类提供灵活的事件订阅和发布机制
- **对话框与通知**：`Dialog`、`Notification` 封装系统文件对话框、消息框和桌面通知
- **系统集成**：`Tray`、`HotKey`、`Clipboard`、`System` 支持托盘、全局热键、剪贴板、系统路径/显示器/版本信息
- **YAML 存储**：`Storage` 封装 JadeView 2.3 的 YAML 持久化 API
- **原生菜单**：`Menu.attach_context_menu` 绑定右键菜单（含 WebView2 native 项）
- **窗口增强**：支持 DevTools、缩放、任务栏进度/闪烁、内容保护、窗口层级、跳过任务栏、不抢焦点和 HWND 反查
- **CLI 工具链**：`jadeui init` / `run` / `doctor` / `japk` / `build` / `download` / `clean`，支持 `pyproject.toml` 项目约定

## 适用场景

JadeUI Python SDK 适用于以下场景：

1. **桌面应用开发**：使用 Python 开发跨平台桌面应用
2. **工具类应用**：创建具有现代 UI 的工具和实用程序
3. **数据可视化**：结合 Web 技术展示 Python 处理的数据
4. **原型开发**：快速构建应用原型和演示

## 技术架构

JadeUI Python SDK 采用以下技术架构：

```
┌─────────────────────────────────────────┐
│              Python 后端                 │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ JadeUIApp   │  │ IPCManager  │       │
│  │ (生命周期)   │  │ (通信管理)   │       │
│  └─────────────┘  └─────────────┘       │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ Window      │  │ LocalServer │       │
│  │ (窗口管理)   │  │ (资源服务)   │       │
│  └─────────────┘  └─────────────┘       │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ Router      │  │ EventEmitter│       │
│  │ (路由系统)   │  │ (事件系统)   │       │
│  └─────────────┘  └─────────────┘       │
└─────────────────┬───────────────────────┘
                  │ FFI/ctypes
┌─────────────────┴───────────────────────┐
│           JadeView DLL (Rust)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│        WebView2 / 系统 WebView          │
│  ┌───────────────────────────────────┐  │
│  │       HTML / CSS / JavaScript      │  │
│  │            (前端 UI)               │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 系统要求

- **Python 版本**：Python 3.7+
- **操作系统**：Windows 10/11
- **运行时**：Windows 需要 WebView2 Runtime
- **Python 架构**：Windows 支持 x86 / x64 / arm64。SDK 会按当前 Python 解释器架构下载并加载匹配的 JadeView 原生库。
- **暂不支持**：官方 JadeView 暂未提供 Linux 原生库（仍在开发中），当前 SDK 仅支持 Windows。

## 版本与 DLL 更新规则

JadeUI SDK 会自动下载已适配的 JadeView DLL。当前版本适配 `v2.3.0`，默认可在同一个 release tag 内选择最新 build，例如从 `26G02` 更新到同 tag 的后续修订号。

:::warning{title="兼容性边界"}
自动更新只限同一 API 版本 / release tag 内的 build 修订号。类似 `2.2 -> 2.3`、`2.3 -> 2.4` 这类 minor/major 升级可能包含 ABI 或行为变化，需要 SDK 明确适配后再升级。
:::

## 安装方式

通过 pip 安装 JadeUI Python SDK：

```bash
pip install jadeui
```

或者使用 poetry：

```bash
poetry add jadeui
```

安装后即可使用 CLI：

```bash
jadeui init my-app --frontend html
cd my-app
jadeui run
```

完整命令见 [CLI 工具](./cli)，打包见 [应用打包](./packaging)。

## 快速示例

```python
from jadeui import Window

Window(title="Hello JadeUI", url="https://example.com").run()
```

## 许可证

JadeUI Python SDK 遵循 MIT 许可证，允许自由使用、修改和分发。

## 社区和支持

- GitHub 仓库：[https://github.com/HG-ha/Jadeui](https://github.com/HG-ha/Jadeui)
- 文档网站：[https://jade.run/sdks/python-sdk](https://jade.run/sdks/python-sdk)
- 如有问题或建议，欢迎提交 Issue 或 Pull Request
