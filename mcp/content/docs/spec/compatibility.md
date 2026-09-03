---
title: 兼容性报告
order: 2
group:
  title: "概览"
  order: 0
---

# 兼容性报告

JadeView 目前支持 **Windows** 与 **Linux** 两大桌面平台，并提供一致的 C API：

- **Windows**：基于 Microsoft Edge WebView2 渲染；
- **Linux**：基于 GTK3 + WebKitGTK 渲染。

下面分别说明两个平台的兼容性情况。

## Windows

JadeView 在 Windows 上经过全面测试，确保在各种 Windows 环境下稳定运行。

### 系统要求

#### 最低配置

| 组件     | 要求                                             |
| -------- | ------------------------------------------------ |
| 操作系统 | Windows 10 版本 1809 或更高版本 (64位)           |
| 处理器   | Intel Pentium 4 或 AMD Athlon 64 处理器 (或更高) |
| 内存     | 2 GB RAM                                         |
| 存储空间 | 50 MB 可用空间                                   |

#### 推荐配置

| 组件     | 要求                                |
| -------- | ----------------------------------- |
| 操作系统 | Windows 11 64位                     |
| 处理器   | Intel Core i5 或 AMD Ryzen 5 处理器 |
| 内存     | 8 GB RAM                            |
| 显卡     | 支持 DirectX 11 的显卡              |
| 存储空间 | 100 MB 可用空间                     |

### 已测试的操作系统

| 操作系统版本 | 架构 | WebView2 Runtime | 测试结果 |
| ------------ | ---- | ---------------- | -------- |
| Windows 10 1809 | x64 | 91+ | ✅ 兼容 |
| Windows 10 2004 | x64 | 92+ | ✅ 兼容 |
| Windows 10 21H2 | x64 | 95+ | ✅ 兼容 |
| Windows 10 22H2 | x64 | 96+ | ✅ 兼容 |
| Windows 11 21H2 | x64 | 97+ | ✅ 兼容 |
| Windows 11 22H2 | x64 | 98+ | ✅ 兼容 |
| Windows 11 23H2 | x64 | 100+ | ✅ 兼容 |
| Windows 11 24H2 | x64 | 120+ | ✅ 兼容 |
| Windows 11 25H2 | x64 | 140+ | ✅ 兼容 |

### 渲染引擎与浏览器兼容性

JadeView 在 Windows 上使用 Microsoft Edge WebView2 作为渲染引擎，因此与 Edge 浏览器具有相同的兼容性特性。

| 功能 | 支持情况 |
| --- | --- |
| HTML5 | ✅ 完全支持 |
| CSS3 | ✅ 完全支持 |
| JavaScript ES6+ | ✅ 完全支持 |
| WebGL | ✅ 支持 |
| WebRTC | ✅ 支持 |
| WebSocket | ✅ 支持 |
| Service Worker | ✅ 支持 |
| PWA 特性 | ✅ 部分支持 |

## Linux

> JadeView 已支持 Linux：**窗口、WebView 渲染、自定义标题栏、库层缩放、双向 IPC** 等核心能力均可正常使用。

### 运行环境要求

Linux 版 `libJadeView.so` 基于 **tao + wry**，使用 **GTK3 + WebKitGTK 4.1** 渲染。其渲染内核为 WebKit（与 Safari 同源），特性支持以 WebKit 为准，与 Chromium 略有差异。运行需满足：

| 项目 | 要求 |
| --- | --- |
| 渲染引擎 | WebKitGTK 4.1（soup3 版，`libwebkit2gtk-4.1.so.0`）；**不兼容**旧的 4.0（soup2） |
| 窗口 / 控件 | GTK 3（`libgtk-3-0`） |
| C 运行时 | glibc（非 musl）。预编译产物的 glibc 下限 = 构建机 glibc 版本 |
| 架构 | **x86_64** 与 **arm64（aarch64）** 均已构建发布 |
| 显示后端 | X11（推荐）或 Wayland（GTK3） |
| 中文显示 | 需安装 CJK 字体（如 `fonts-noto-cjk` / `fonts-wqy-zenhei`），否则中文显示为方块 |

### 已测试 / 兼容的发行版

是否兼容的硬性判据是系统能否提供 **WebKitGTK 4.1（soup3）**——旧发行版只有 4.0（soup2），不兼容。

| 发行版 | 兼容 | 说明 |
| --- | --- | --- |
| **Ubuntu 24.04 LTS** | ✅ 已测试 | 官方开发 / 验证环境 |
| Ubuntu 22.04 LTS | ✅ | 仓库含 `libwebkit2gtk-4.1-0` |
| Debian 12 (Bookworm) | ✅ | webkit2gtk 2.40+，含 4.1 |
| Fedora 38+ | ✅ | `webkit2gtk4.1` |
| Arch / Manjaro | ✅ | `webkit2gtk-4.1` |
| openSUSE Tumbleweed | ✅ | 滚动更新 |
| RHEL / Rocky / Alma 9 | ✅ | `webkit2gtk4.1` |
| Debian 11 (Bullseye) | ⚠️ | 默认只有 4.0；需 backports 或自编译 4.1 |
| Ubuntu 20.04 LTS | ❌ | 仅 webkit2gtk-4.0（soup2），无 4.1 |
| RHEL / CentOS 8 及更早 | ❌ | webkit 过旧 |
| Alpine 等 musl 系 | ❌ | 需 musl 构建（暂未提供）+ webkit2gtk |
| arm64（aarch64） | ✅ | 已构建并随版本发布 |
| 其它架构（如 RISC-V） | ❌（暂） | 仅发布 x86_64 与 arm64 |

> 经验法则：**2022 年及以后发布的主流发行版基本可用**；2020 年前后的旧 LTS 不行。

### 已支持的功能

- ✅ 窗口创建、WebView 渲染（WebKitGTK），自定义 `jade://` 协议与资源服务路径
- ✅ **无边框窗口 + HTML 自定义标题栏**：拖动移动、双击最大化/还原、最小化/最大化/关闭按钮
- ✅ **库层边缘/角缩放**：等价 Windows 的缩放体验，带缩放光标
- ✅ **双向 IPC**：页面 `window.jade.invoke()` ↔ Rust，Rust 亦可主动回推 JavaScript
- ✅ 窗口操作：标题、大小、位置、显隐、焦点、最大化、最小化、全屏、置顶等
- ✅ 系统语言、剪贴板、网络时间（纯 Rust NTP）
- ✅ 纯 Rust 子系统不受平台影响：加解密、JAPK 签名/解密、asar 资源包

### 显示后端（X11 / Wayland）

- **X11（推荐）**：窗口、输入、缩放均正常；全局热键也仅能在 X11 上实现。
- **Wayland**：窗口与渲染可用，但全局热键不可用（协议限制）、客户端无法设置窗口绝对位置（由合成器决定）。如遇输入异常，可设置 `GDK_BACKEND=x11` 走 Xwayland。

### 在 WSL2（WSLg）下运行

WSL2（含 WSLg）可直接运行 GUI，用于开发 / 验证。需设置以下环境变量（真机 Linux 桌面通常不需要）：

```bash
export GDK_BACKEND=x11                              # Wayland 输入异常，改用 X11
export WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1   # WSL 无 user namespace，否则渲染进程起不来
export WEBKIT_DISABLE_DMABUF_RENDERER=1             # 关闭 DMABUF，避免黑屏
# 中文字体：sudo apt install -y fonts-wqy-zenhei
```

## 常见问题

### Q: 为什么在 Windows 7 上无法运行？

A: JadeView 在 Windows 上基于 WebView2 技术，该技术仅支持 Windows 10 1809 及以上版本。

### Q: 如何检查 WebView2 Runtime 版本？

A: 可以通过以下命令检查：

```bash
reg query "HKLM\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" /v pv
```

### Q: 无法下载 WebView2 Runtime 怎么办？

A: 可以手动下载并安装：

1. 访问 [WebView2 Runtime 下载页面](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section)
2. 下载最新版本的 Evergreen Bootstrapper
3. 运行安装程序

### Q: 为什么我的 Linux 发行版无法运行？

A: 最常见的原因是系统缺少 **WebKitGTK 4.1（soup3）**。旧发行版（如 Ubuntu 20.04）只提供 4.0（soup2），不兼容。请升级到 2022 年及以后的主流发行版，或自行安装 `libwebkit2gtk-4.1-0`。若中文显示为方块，则需安装 CJK 字体。

## 兼容性测试工具

我们使用以下工具和方法进行兼容性测试：

- **自动化测试**：使用 Selenium 和 Playwright 进行 UI 自动化测试
- **手动测试**：在多台物理设备和虚拟机上进行手动测试
- **性能测试**：使用 Lighthouse 和 Chrome DevTools 进行性能分析
- **稳定性测试**：进行 24/7 持续运行测试

## 获取支持

如果您遇到兼容性问题，请：

1. 检查您的系统是否满足对应平台的运行要求
2. Windows 上确保已安装最新版本的 WebView2 Runtime；Linux 上确保已安装 WebKitGTK 4.1
3. 查看 [常见问题解答](/faq)
4. 提交 [GitHub Issue](https://github.com/JadeViewDocs/JadeView/issues)
