---
order: 1
---

# Quick Start

## Requirements

- **Go 1.23+**
- **Windows 10 / 11** + WebView2 Runtime (bundled with Win11; on Win10 install via Microsoft's Evergreen Bootstrapper)

Build machines need **only the Go toolchain** — no MinGW / MSYS2, no `CC` / `CGO_ENABLED` setup. The `JadeView.dll` for each architecture is embedded into the binary via `go:embed`, so **no DLL needs to ship with your app**.

## Installation

```bash
go get github.com/luoxueyousheng/JadeViewGo@latest
```

## Minimal Example

```go
package main

import (
    "fmt"

    jadeview "github.com/luoxueyousheng/JadeViewGo"
)

func main() {
    // 1. Register events (app-ready MUST be registered before Init)
    jadeview.On(jadeview.EventAppReady, func(windowID uint32, data string) string {
        // windowID == 1 means success; 0 = failure, data holds the error message
        if windowID != 1 {
            fmt.Println("Init failed:", data)
            jadeview.Exit()
            return ""
        }
        opts := jadeview.DefaultWindowOptions()
        opts.Title = "My First JadeView App"
        opts.Width, opts.Height = 1024, 768
        winID := jadeview.CreateWindow("https://example.com", 0, &opts, nil)
        fmt.Println("Window created:", winID)
        return ""
    })
    jadeview.On(jadeview.EventWindowAllClosed, func(uint32, string) string {
        jadeview.Exit() // quit after all windows are closed
        return ""
    })

    // 2. Initialize the app
    // Init(devMode, logPath, dataDir, appName, appSignature, singleInstance)
    // Signature must be >= 6 chars; reverse-domain style recommended —
    // in JAPK mode it becomes the JADE:// URL host
    if !jadeview.Init(true, "", "", "my-app", "com.example.myapp", false) {
        fmt.Println("Init failed")
        return
    }

    // 3. Start the message loop (blocks until exit)
    jadeview.RunMessageLoop()
}
```

## Application Lifecycle

1. **Register event callbacks** — subscribe to lifecycle events like `EventAppReady` via `jadeview.On()` (**must happen before `Init`**)
2. **Initialize** — call `jadeview.Init()` to start the JadeView engine
3. **Create windows** — in the `app-ready` callback, confirm `windowID == 1` then call `jadeview.CreateWindow()`
4. **Message loop** — call `jadeview.RunMessageLoop()` to enter the blocking message loop
5. **Exit** — call `jadeview.Exit()` in the `window-all-closed` callback to end the loop

## Loading Local HTML

Use the protocol service to map a local directory to a servable URL. It is safer than `file://` and same-origin with the library (no cross-origin IPC issues):

```go
jadeview.On(jadeview.EventAppReady, func(windowID uint32, data string) string {
    if windowID != 1 {
        return ""
    }
    // hotReload=true: pages refresh instantly when site files change (great for development)
    baseURL, ok := jadeview.SetProtocolServicePath("C:/myapp/web", true)
    if !ok {
        jadeview.Exit()
        return ""
    }
    // The returned URL can be used directly for window navigation
    jadeview.CreateWindow(baseURL, 0, nil, nil)
    return ""
})
```

:::warning
The protocol service site directory must **not** be the same as (or nested with) the `Init` data directory — the library continuously writes data there, triggering an endless "write → hot-reload refresh" loop.
:::

## Build & Distribution

```powershell
go build -o myapp.exe .                             # console build (shows logs)
go build -ldflags "-H windowsgui" -o myapp.exe .    # GUI build (no cmd window)

# Cross-compile other architectures (pure Go, works on any machine)
$env:GOARCH="386";   go build -ldflags "-H windowsgui" -o myapp_x86.exe .
$env:GOARCH="arm64"; go build -ldflags "-H windowsgui" -o myapp_arm64.exe .
```

The output is a **single exe**. On first run the DLL is extracted to a content-addressed directory under `%TEMP%\jadeview\` (multiple versions/architectures coexist safely); if a `JadeView.dll` sits next to the exe it takes priority (handy for debugging with a different library build).

## Feature Overview

The SDK is a **single Go package** (`jadeview`), organized by feature area:

| Area | Main functions |
|------|----------|
| Lifecycle | `Init` / `Version` / `RunMessageLoop` / `Exit` / `Preload` |
| Windows | `CreateWindow` / `CreateBorderlessWindow` / `SetTitle` / `SetSize` / `Close` … |
| WebView | `Navigate` / `Reload` / `ExecuteJavaScript` / `SetZoom` / DevTools |
| Events & IPC | `On` / `Off` / `RegisterIPCHandler` / `SendIPCMessage` |
| Dialogs | `ShowOpenDialog` / `ShowSaveDialog` / `ShowMessageBox` (plus `*Async` variants) |
| Tray / Menus | `TrayCreate` / `TraySetMenu` / `MenuItemCreate` / `SetContextMenuItems` |
| Notifications | `ShowNotification` |
| YAML store | `YAMLSet` / `YAMLGet` / `YAMLGetAll` / `YAMLKeys` … |
| JAPK packages | `SetPublicKey` / `LoadFromBytes` / `SetProtocolServicePath` |
| System tools | clipboard / `GetPath` / global hotkeys / autostart / URL schemes / NTP … |
| Enums & constants | `Theme` / `FrameStyle` / `Backdrop` / `Event*` event-name constants |
