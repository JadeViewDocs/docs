---
order: 0
---

# 介绍

Golang SDK（JadeViewGo）是 JadeView 2.x 的 Go 封装库，用 Go + HTML/CSS/JS 编写 Windows 桌面应用程序。窗口、事件、双向 IPC、托盘、对话框、通知、YAML 持久化、JAPK 资源包、NTP 授时一应俱全，头文件全部导出函数均已封装。

SDK 的 API 命名风格与 JadeView 前端 JS API 保持一致，降低跨语言使用的学习成本。

## 核心特性

- **零依赖构建**：纯 Go 实现（syscall 直调），DLL 已 `go:embed` 内置——只需 Go 工具链，无需 MinGW/CGO，产物是单个自包含 exe
- **多架构**：支持 Windows amd64 / 386 / arm64，任意平台交叉编译只需切换 `GOARCH`
- **窗口管理**：标准 / 无边框窗口，大小、位置、全屏、置顶、层级、任务栏进度、Mica/Acrylic 材质
- **IPC 通信**：事件订阅（`On`/`Off`）、IPC 通道处理器（`RegisterIPCHandler`）、主动推送（`SendIPCMessage`）
- **对话框**：打开/保存文件对话框、消息框、错误框，同步与异步两套 API
- **系统托盘与菜单**：托盘图标 + 扁平表菜单、窗口右键上下文菜单
- **JAPK 资源包**：前端资源加密/混淆打包，支持从内存直接加载（磁盘零前端文件）
- **系统工具**：剪贴板、系统路径、显示器信息、全局热键、开机自启、URL Scheme、文件关联、打印、编码转换、NTP 网络时间
- **YAML 配置存储**：内置键路径读写的持久化配置
- **类型安全枚举**：`Theme.Dark`、`FrameStyle.TitleOverlay`、`Backdrop.Mica` 等二级命名空间枚举，不必裸写字符串

## 适用场景

- 使用 Go 开发 Windows 桌面应用（前端 HTML/CSS/JS，后端 Go）
- 需要**单文件分发**的工具类应用（单 exe 自包含）
- 需要前端资源加密分发（JAPK）的商业应用
- 快速原型与内部工具

## 技术架构

```
┌───────────────────────────────────────────────┐
│                  Go 后端（单包 jadeview）        │
│  窗口 / WebView / IPC事件 / 对话框 / 托盘 / 工具  │
└──────────────────────┬────────────────────────┘
                       │ syscall 直调
┌──────────────────────┴────────────────────────┐
│          JadeView.dll（go:embed 内置）          │
└──────────────────────┬────────────────────────┘
                       │
┌──────────────────────┴────────────────────────┐
│                 WebView2 渲染                   │
│        HTML / CSS / JavaScript（前端 UI）        │
└───────────────────────────────────────────────┘
```

## 系统要求

| 平台 | 架构 | 构建依赖 | 运行时依赖 |
|------|------|----------|------------|
| **Windows 10 / 11** | amd64 / 386 / arm64 | 仅 Go 工具链 | WebView2 Runtime（Win11 自带） |

- **Go 版本**：Go 1.23+
- **外部 Go 依赖**：无（仅标准库）

:::info
当前支持 Windows。Linux 支持计划随 JadeView 上游后续版本（2.4 / 2.5）提供。
:::

## 安装方式

```bash
go get github.com/luoxueyousheng/JadeViewGo@latest
```

只想先跑一眼内置示例（示例是模块子包，可直接运行）：

```bash
go run github.com/luoxueyousheng/JadeViewGo/example@latest
```

## 快速示例

```go
package main

import jadeview "github.com/luoxueyousheng/JadeViewGo"

func main() {
    jadeview.On(jadeview.EventAppReady, func(windowID uint32, data string) string {
        if windowID == 1 {
            opts := jadeview.DefaultWindowOptions()
            opts.Title = "Hello JadeView"
            jadeview.CreateWindow("https://example.com", 0, &opts, nil)
        }
        return ""
    })
    jadeview.On(jadeview.EventWindowAllClosed, func(uint32, string) string {
        jadeview.Exit()
        return ""
    })
    jadeview.Init(true, "", "", "my-app", "com.example.myapp", false)
    jadeview.RunMessageLoop()
}
```

## 项目信息

- **版本**：始终建议使用 `@latest`，各版本变更见 [GitHub Releases](https://github.com/luoxueyousheng/JadeViewGo/releases)
- **许可证**：封装层代码 MIT（`lib/` 下二进制为 JadeView 作者产物，不在 MIT 范围内）
- **源码**：[GitHub](https://github.com/luoxueyousheng/JadeViewGo)
