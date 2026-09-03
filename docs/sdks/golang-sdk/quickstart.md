---
order: 1
---

# 快速开始

## 环境要求

- **Go 1.23+**
- **Windows 10 / 11** + WebView2 Runtime（Win11 自带；Win10 用微软 Evergreen Bootstrapper 安装）

构建机**只需 Go 工具链**——无需 MinGW / MSYS2，无需设置 `CC` / `CGO_ENABLED`。对应架构的 `JadeView.dll` 已用 `go:embed` 编进二进制，**无需随程序分发 DLL**。

## 安装

```bash
go get github.com/luoxueyousheng/JadeViewGo@latest
```

## 最小示例

```go
package main

import (
    "fmt"

    jadeview "github.com/luoxueyousheng/JadeViewGo"
)

func main() {
    // 1. 注册事件（app-ready 必须在 Init 之前注册）
    jadeview.On(jadeview.EventAppReady, func(windowID uint32, data string) string {
        // windowID == 1 才表示初始化成功；0 = 失败，data 为错误描述
        if windowID != 1 {
            fmt.Println("初始化失败:", data)
            jadeview.Exit()
            return ""
        }
        opts := jadeview.DefaultWindowOptions()
        opts.Title = "我的第一个 JadeView 应用"
        opts.Width, opts.Height = 1024, 768
        winID := jadeview.CreateWindow("https://example.com", 0, &opts, nil)
        fmt.Println("窗口已创建:", winID)
        return ""
    })
    jadeview.On(jadeview.EventWindowAllClosed, func(uint32, string) string {
        jadeview.Exit() // 所有窗口关闭后退出
        return ""
    })

    // 2. 初始化应用
    // Init(开发模式, 日志路径, 数据目录, 应用名, 应用签名, 单实例)
    // 签名 ≥6 字符，建议反域名格式——JAPK 模式下它就是 JADE:// URL 的主机名
    if !jadeview.Init(true, "", "", "my-app", "com.example.myapp", false) {
        fmt.Println("Init 失败")
        return
    }

    // 3. 启动消息循环（阻塞，直到退出）
    jadeview.RunMessageLoop()
}
```

## 应用生命周期

1. **注册事件回调** — 用 `jadeview.On()` 注册 `EventAppReady` 等生命周期事件（**必须在 `Init` 之前**）
2. **初始化** — 调用 `jadeview.Init()` 启动 JadeView 引擎
3. **创建窗口** — 在 `app-ready` 回调中确认 `windowID == 1` 后调用 `jadeview.CreateWindow()`
4. **消息循环** — 调用 `jadeview.RunMessageLoop()` 进入阻塞消息循环
5. **退出** — 在 `window-all-closed` 回调中调用 `jadeview.Exit()` 结束循环

## 加载本地 HTML

使用协议服务把本地目录映射为可访问的 URL，比 `file://` 更安全、与库同源（IPC 无跨域问题）：

```go
jadeview.On(jadeview.EventAppReady, func(windowID uint32, data string) string {
    if windowID != 1 {
        return ""
    }
    // hotReload=true：改动站点文件页面即时刷新（开发期好用）
    baseURL, ok := jadeview.SetProtocolServicePath("C:/myapp/web", true)
    if !ok {
        jadeview.Exit()
        return ""
    }
    // 返回的 URL 直接用于建窗导航
    jadeview.CreateWindow(baseURL, 0, nil, nil)
    return ""
})
```

:::warning
协议服务的站点目录**不要**与 `Init` 的数据目录相同或嵌套——库持续写数据会触发「写 → 热载刷新」死循环。
:::

## 构建与分发

```powershell
go build -o myapp.exe .                             # 控制台版（能看日志）
go build -ldflags "-H windowsgui" -o myapp.exe .    # GUI 版（无 cmd 黑窗）

# 交叉编译其它架构（纯 Go，任何机器上都行）
$env:GOARCH="386";   go build -ldflags "-H windowsgui" -o myapp_x86.exe .
$env:GOARCH="arm64"; go build -ldflags "-H windowsgui" -o myapp_arm64.exe .
```

产物是**单个 exe**。首次运行时 DLL 自动释放到 `%TEMP%\jadeview\` 下的内容寻址目录（多版本/多架构并存互不覆盖）；exe 同目录若放了 `JadeView.dll` 则优先使用（便于调试换库）。

## 功能分区总览

SDK 是**单个 Go 包**（`jadeview`），按功能分区如下：

| 分区 | 主要函数 |
|------|----------|
| 生命周期 | `Init` / `Version` / `RunMessageLoop` / `Exit` / `Preload` |
| 窗口 | `CreateWindow` / `CreateBorderlessWindow` / `SetTitle` / `SetSize` / `Close` … |
| WebView | `Navigate` / `Reload` / `ExecuteJavaScript` / `SetZoom` / DevTools |
| 事件与 IPC | `On` / `Off` / `RegisterIPCHandler` / `SendIPCMessage` |
| 对话框 | `ShowOpenDialog` / `ShowSaveDialog` / `ShowMessageBox`（含 `*Async` 异步版） |
| 托盘 / 菜单 | `TrayCreate` / `TraySetMenu` / `MenuItemCreate` / `SetContextMenuItems` |
| 通知 | `ShowNotification` |
| YAML 存储 | `YAMLSet` / `YAMLGet` / `YAMLGetAll` / `YAMLKeys` … |
| JAPK 资源包 | `SetPublicKey` / `LoadFromBytes` / `SetProtocolServicePath` |
| 系统工具 | 剪贴板 / `GetPath` / 全局热键 / 开机自启 / URL Scheme / NTP … |
| 枚举与常量 | `Theme` / `FrameStyle` / `Backdrop` / `Event*` 事件名常量 |
