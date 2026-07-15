---
order: 4
---

# Examples

The module ships an interactive example (the `example/` subpackage) that you can run directly:

```bash
go run github.com/luoxueyousheng/JadeViewGo/example@latest
```

It demonstrates theme/backdrop switching, IPC echo & push, window operations, dialogs, notifications, clipboard, NTP, YAML, tray, and all three frontend-loading approaches for JAPK. Below are snippets you can drop into your own code.

## Complete Desktop App Skeleton

Window + IPC + tray + notification:

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
        fmt.Println("init failed:", data)
        jadeview.Exit()
        return ""
    }
    fmt.Println("JadeView", jadeview.Version())

    // Serve local assets via the protocol service (same-origin with the library — no cross-origin IPC issues)
    baseURL, ok := jadeview.SetProtocolServicePath("web", false)
    if !ok {
        jadeview.Exit()
        return ""
    }

    opts := jadeview.DefaultWindowOptions()
    opts.Title = "My App"
    opts.Width, opts.Height = 1100, 800
    opts.MinWidth, opts.MinHeight = 800, 600
    opts.Theme = jadeview.Theme.System

    settings := jadeview.DefaultWebViewSettings()
    mainWinID = jadeview.CreateWindow(baseURL, 0, &opts, &settings)

    setupTray()
    jadeview.ShowNotification(jadeview.NotificationParams{
        Summary: "App started",
        Body:    "Welcome to My App",
        Timeout: -1,
    })
    return ""
}

func setupTray() {
    trayID = jadeview.TrayCreate()
    if trayID == 0 {
        return
    }
    jadeview.TraySetTooltip(trayID, "My App - running")
    jadeview.TraySetIconFromFile(trayID, "icon.ico")
    jadeview.TraySetMenu(trayID, []jadeview.TrayMenuItem{
        {Type: jadeview.TrayItem.Normal, Key: "show", Label: "Show Window"},
        {Type: jadeview.TrayItem.Divider, Key: "sep"},
        {Type: jadeview.TrayItem.Normal, Key: "quit", Label: "Quit", Dangerous: true},
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
        // data is JSON with the clicked item's key
        fmt.Println("tray menu:", data)
        return ""
    })
    // IPC channel: called from the frontend via jade.invoke("get-info")
    jadeview.RegisterIPCHandler("get-info", func(windowID uint32, payload string) string {
        locale, _ := jadeview.GetLocale()
        return fmt.Sprintf(`{"version":%q,"locale":%q,"windows":%d}`,
            jadeview.Version(), locale, jadeview.WindowCount())
    })

    jadeview.Init(true, "", "", "MyApp", "com.example.myapp", false)
    jadeview.RunMessageLoop()
}
```

## In-memory JAPK Loading

Bundle the frontend as `app.japk` inside the binary — zero frontend files on disk:

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
        fmt.Println("[JAPK] load failed:", data)
        return ""
    })
    jadeview.On(jadeview.EventAppReady, func(windowID uint32, data string) string {
        if windowID != 1 {
            jadeview.Exit()
            return ""
        }
        if rc := jadeview.LoadFromBytes(appJAPK); rc != 0 {
            fmt.Println("LoadFromBytes failed:", rc)
            jadeview.Exit()
            return ""
        }
        // Empty path = in-memory JAPK mode; returns JADE://com.example.myapp
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

    // The JAPK's app_name/app_signature must match the packaging values
    jadeview.Init(true, "", "", "MyApp", "com.example.myapp", false)
    jadeview.RunMessageLoop()
}
```

## File Dialogs

```go
// Sync: pick images (multi-select)
result := jadeview.ShowOpenDialog(jadeview.FileDialogParams{
    WindowID:   mainWinID,
    Title:      "Select Images",
    Filters:    `[{"name":"Images","extensions":["jpg","png","gif"]}]`,
    Properties: `["openFile","multiSelections"]`,
})
fmt.Println("result JSON:", result) // empty on cancel

// Sync: save a file
result = jadeview.ShowSaveDialog(jadeview.FileDialogParams{
    WindowID:    mainWinID,
    Title:       "Save File",
    DefaultPath: "report.txt",
    Filters:     `[{"name":"Text","extensions":["txt","md"]},{"name":"All Files","extensions":["*"]}]`,
})

// Async: doesn't block message processing; result arrives via callback
jadeview.ShowOpenDialogAsync(jadeview.FileDialogParams{
    WindowID:   mainWinID,
    Title:      "Async Open",
    Properties: `["openFile"]`,
}, func(result string) {
    fmt.Println("async result:", result)
})

// Message box
answer := jadeview.ShowMessageBox(jadeview.MessageBoxParams{
    WindowID: mainWinID,
    Title:    "Confirm",
    Message:  "Delete this item?",
    Buttons:  `["Delete","Cancel"]`,
    CancelID: 1,
    Type:     jadeview.MsgBoxType.Warning,
})
fmt.Println("clicked button:", answer) // JSON with the button index
```

## Multi-window Management

```go
var (
    mainWin  uint32
    children []uint32
)

jadeview.RegisterIPCHandler("create-child", func(windowID uint32, payload string) string {
    opts := jadeview.DefaultWindowOptions()
    opts.Title = fmt.Sprintf("Child #%d", len(children)+1)
    opts.Width, opts.Height = 640, 480
    id := jadeview.CreateWindow(childURL, mainWin, &opts, nil) // second arg = parent window
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

## Global Hotkey + Notification

```go
jadeview.On(jadeview.EventAppReady, func(windowID uint32, data string) string {
    if windowID != 1 {
        return ""
    }
    mainWinID = jadeview.CreateWindow("https://example.com", 0, nil, nil)
    // Ctrl+Alt+J (MOD_ALT=0x1, MOD_CONTROL=0x2)
    id := jadeview.RegisterGlobalHotkey(0x2|0x1, 'J')
    fmt.Println("hotkey registered:", id)
    return ""
})

jadeview.On(jadeview.EventGlobalHotkey, func(windowID uint32, data string) string {
    jadeview.ShowNotification(jadeview.NotificationParams{
        Summary: "Hotkey triggered",
        Body:    "You pressed Ctrl+Alt+J",
        Button1: "Open Window",
        Action:  "show_window",
        Timeout: -1,
    })
    jadeview.SetFocus(mainWinID)
    return ""
})

jadeview.On(jadeview.EventNotificationAction, func(windowID uint32, data string) string {
    fmt.Println("notification button clicked:", data)
    return ""
})
```

## Async ExecuteJavaScript Results

JS results are not returned directly — they arrive via the `javascript-result` event (data contains the call id and result):

```go
jadeview.On(jadeview.EventJavascriptResult, func(windowID uint32, data string) string {
    fmt.Println("JS result:", data)
    return ""
})

callID := jadeview.ExecuteJavaScript(mainWinID, "document.title")
fmt.Println("call id:", callID)
```
