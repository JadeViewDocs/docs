---
order: 4
---

# 示例代码

模块自带可交互示例（`example/` 子包），可直接运行：

```bash
go run github.com/luoxueyousheng/JadeViewGo/example@latest
```

演示了主题/材质切换、IPC 回声与推送、窗口操作、对话框、通知、剪贴板、NTP、YAML、托盘、JAPK 三种前端加载方式。以下为可直接套用的代码片段。

## 完整桌面应用示例

窗口 + IPC + 托盘 + 通知的完整骨架：

```go
package main

import (
    "fmt"

    jadeview "github.com/luoxueyousheng/JadeViewGo"
)

var (
    mainWinID uint32
    trayID    uint32
)

func onAppReady(windowID uint32, data string) string {
    if windowID != 1 {
        fmt.Println("初始化失败:", data)
        jadeview.Exit()
        return ""
    }
    fmt.Println("JadeView", jadeview.Version())

    // 本地资源经协议服务加载（与库同源，IPC 无跨域问题）
    baseURL, ok := jadeview.SetProtocolServicePath("web", false)
    if !ok {
        jadeview.Exit()
        return ""
    }

    opts := jadeview.DefaultWindowOptions()
    opts.Title = "我的应用"
    opts.Width, opts.Height = 1100, 800
    opts.MinWidth, opts.MinHeight = 800, 600
    opts.Theme = jadeview.Theme.System

    settings := jadeview.DefaultWebViewSettings()
    mainWinID = jadeview.CreateWindow(baseURL, 0, &opts, &settings)

    setupTray()
    jadeview.ShowNotification(jadeview.NotificationParams{
        Summary: "应用已启动",
        Body:    "欢迎使用我的应用",
        Timeout: -1,
    })
    return ""
}

func setupTray() {
    trayID = jadeview.TrayCreate()
    if trayID == 0 {
        return
    }
    jadeview.TraySetTooltip(trayID, "我的应用 - 运行中")
    jadeview.TraySetIconFromFile(trayID, "icon.ico")
    jadeview.TraySetMenu(trayID, []jadeview.TrayMenuItem{
        {Type: jadeview.TrayItem.Normal, Key: "show", Label: "显示窗口"},
        {Type: jadeview.TrayItem.Divider, Key: "sep"},
        {Type: jadeview.TrayItem.Normal, Key: "quit", Label: "退出", Dangerous: true},
    })
}

func main() {
    jadeview.On(jadeview.EventAppReady, onAppReady)
    jadeview.On(jadeview.EventWindowAllClosed, func(uint32, string) string {
        if trayID != 0 {
            jadeview.TrayDestroy(trayID)
        }
        jadeview.Exit()
        return ""
    })
    jadeview.On(jadeview.EventTrayMenuCommand, func(windowID uint32, data string) string {
        // data 为 JSON，含被点击项的 key
        fmt.Println("托盘菜单:", data)
        return ""
    })
    // IPC 通道：前端 jade.invoke("get-info") 调用
    jadeview.RegisterIPCHandler("get-info", func(windowID uint32, payload string) string {
        locale, _ := jadeview.GetLocale()
        return fmt.Sprintf(`{"version":%q,"locale":%q,"windows":%d}`,
            jadeview.Version(), locale, jadeview.WindowCount())
    })

    jadeview.Init(true, "", "", "MyApp", "com.example.myapp", false)
    jadeview.RunMessageLoop()
}
```

## JAPK 内存加载示例

前端资源打成 `app.japk` 随二进制嵌入，磁盘零前端文件：

```go
package main

import (
    _ "embed"
    "fmt"

    jadeview "github.com/luoxueyousheng/JadeViewGo"
)

//go:embed app.japk
var appJAPK []byte

func main() {
    jadeview.On(jadeview.EventJapkLoadFailed, func(_ uint32, data string) string {
        fmt.Println("[JAPK] 加载失败:", data)
        return ""
    })
    jadeview.On(jadeview.EventAppReady, func(windowID uint32, data string) string {
        if windowID != 1 {
            jadeview.Exit()
            return ""
        }
        if rc := jadeview.LoadFromBytes(appJAPK); rc != 0 {
            fmt.Println("LoadFromBytes 失败:", rc)
            jadeview.Exit()
            return ""
        }
        // 空路径 = 内存 JAPK 模式；返回 JADE://com.example.myapp
        url, ok := jadeview.SetProtocolServicePath("", false)
        if !ok {
            jadeview.Exit()
            return ""
        }
        jadeview.CreateWindow(url, 0, nil, nil)
        return ""
    })
    jadeview.On(jadeview.EventWindowAllClosed, func(uint32, string) string {
        jadeview.Exit()
        return ""
    })

    // JAPK 的 app_name/app_signature 必须与打包时一致
    jadeview.Init(true, "", "", "MyApp", "com.example.myapp", false)
    jadeview.RunMessageLoop()
}
```

## 文件对话框示例

```go
// 同步：选择图片（多选）
result := jadeview.ShowOpenDialog(jadeview.FileDialogParams{
    WindowID:   mainWinID,
    Title:      "选择图片",
    Filters:    `[{"name":"图片","extensions":["jpg","png","gif"]}]`,
    Properties: `["openFile","multiSelections"]`,
})
fmt.Println("结果 JSON:", result) // 取消时为空

// 同步：保存文件
result = jadeview.ShowSaveDialog(jadeview.FileDialogParams{
    WindowID:    mainWinID,
    Title:       "保存文件",
    DefaultPath: "report.txt",
    Filters:     `[{"name":"文本","extensions":["txt","md"]},{"name":"所有文件","extensions":["*"]}]`,
})

// 异步：不阻塞消息处理，回调收结果
jadeview.ShowOpenDialogAsync(jadeview.FileDialogParams{
    WindowID:   mainWinID,
    Title:      "异步选择文件",
    Properties: `["openFile"]`,
}, func(result string) {
    fmt.Println("异步结果:", result)
})

// 消息框
answer := jadeview.ShowMessageBox(jadeview.MessageBoxParams{
    WindowID: mainWinID,
    Title:    "确认",
    Message:  "确定要删除吗？",
    Buttons:  `["删除","取消"]`,
    CancelID: 1,
    Type:     jadeview.MsgBoxType.Warning,
})
fmt.Println("点击的按钮:", answer) // JSON 含按钮索引
```

## 多窗口管理示例

```go
var (
    mainWin  uint32
    children []uint32
)

jadeview.RegisterIPCHandler("create-child", func(windowID uint32, payload string) string {
    opts := jadeview.DefaultWindowOptions()
    opts.Title = fmt.Sprintf("子窗口 #%d", len(children)+1)
    opts.Width, opts.Height = 640, 480
    id := jadeview.CreateWindow(childURL, mainWin, &opts, nil) // 第二参数=父窗口
    if id != 0 {
        children = append(children, id)
    }
    return fmt.Sprintf(`{"id":%d}`, id)
})

jadeview.On(jadeview.EventWindowClosed, func(windowID uint32, data string) string {
    for i, id := range children {
        if id == windowID {
            children = append(children[:i], children[i+1:]...)
            break
        }
    }
    return ""
})
```

## 全局热键 + 通知示例

```go
jadeview.On(jadeview.EventAppReady, func(windowID uint32, data string) string {
    if windowID != 1 {
        return ""
    }
    mainWinID = jadeview.CreateWindow("https://example.com", 0, nil, nil)
    // Ctrl+Alt+J（MOD_ALT=0x1, MOD_CONTROL=0x2）
    id := jadeview.RegisterGlobalHotkey(0x2|0x1, 'J')
    fmt.Println("热键注册:", id)
    return ""
})

jadeview.On(jadeview.EventGlobalHotkey, func(windowID uint32, data string) string {
    jadeview.ShowNotification(jadeview.NotificationParams{
        Summary: "快捷键触发",
        Body:    "您按下了 Ctrl+Alt+J",
        Button1: "打开窗口",
        Action:  "show_window",
        Timeout: -1,
    })
    jadeview.SetFocus(mainWinID)
    return ""
})

jadeview.On(jadeview.EventNotificationAction, func(windowID uint32, data string) string {
    fmt.Println("通知按钮被点击:", data)
    return ""
})
```

## ExecuteJavaScript 异步结果示例

JS 执行结果不直接返回，经 `javascript-result` 事件回来（data 含调用 id 与结果）：

```go
jadeview.On(jadeview.EventJavascriptResult, func(windowID uint32, data string) string {
    fmt.Println("JS 结果:", data)
    return ""
})

callID := jadeview.ExecuteJavaScript(mainWinID, "document.title")
fmt.Println("调用 id:", callID)
```
