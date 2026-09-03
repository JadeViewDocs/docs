---
order: 0
---

# Introduction

The Golang SDK (JadeViewGo) is a Go wrapper for JadeView 2.x that lets you build Windows desktop applications with Go + HTML/CSS/JS. Windows, events, bidirectional IPC, tray, dialogs, notifications, YAML persistence, JAPK resource packages and NTP time — every exported function in the header is wrapped.

The SDK's API naming follows the JadeView frontend JS API, lowering the learning cost when working across languages.

## Key Features

- **Zero-dependency builds**: pure Go implementation (direct syscall), with the DLL embedded via `go:embed` — only the Go toolchain is required, no MinGW/CGO, and the output is a single self-contained exe
- **Multi-arch**: Windows amd64 / 386 / arm64, cross-compiled from any platform by just switching `GOARCH`
- **Window management**: standard / borderless windows; size, position, fullscreen, always-on-top, window level, taskbar progress, Mica/Acrylic backdrops
- **IPC**: event subscription (`On`/`Off`), IPC channel handlers (`RegisterIPCHandler`), push messages (`SendIPCMessage`)
- **Dialogs**: open/save file dialogs, message boxes, error boxes — both synchronous and asynchronous APIs
- **System tray & menus**: tray icon with flat-table menus, window context menus
- **JAPK resource packages**: encrypted/obfuscated frontend bundles, loadable directly from memory (zero frontend files on disk)
- **System tools**: clipboard, system paths, display info, global hotkeys, login autostart, URL schemes, file associations, printing, encoding conversion, NTP network time
- **YAML config store**: built-in persistent configuration with key-path access
- **Type-safe enums**: two-level namespaced enums like `Theme.Dark`, `FrameStyle.TitleOverlay`, `Backdrop.Mica` — no bare strings

## Use Cases

- Windows desktop apps in Go (HTML/CSS/JS frontend, Go backend)
- Utility apps that need **single-file distribution** (single self-contained exe)
- Commercial apps that need encrypted frontend distribution (JAPK)
- Rapid prototypes and internal tools

## Architecture

```
┌───────────────────────────────────────────────┐
│           Go backend (single package)          │
│  windows / WebView / IPC events / dialogs /   │
│  tray / tools                                  │
└──────────────────────┬────────────────────────┘
                       │ direct syscall
┌──────────────────────┴────────────────────────┐
│        JadeView.dll (go:embed built-in)        │
└──────────────────────┬────────────────────────┘
                       │
┌──────────────────────┴────────────────────────┐
│              WebView2 rendering                │
│        HTML / CSS / JavaScript (frontend UI)   │
└───────────────────────────────────────────────┘
```

## System Requirements

| Platform | Arch | Build deps | Runtime deps |
|------|------|----------|------------|
| **Windows 10 / 11** | amd64 / 386 / arm64 | Go toolchain only | WebView2 Runtime (bundled with Win11) |

- **Go version**: Go 1.23+
- **External Go dependencies**: none (standard library only)

:::info
Windows is currently supported. Linux support is planned to arrive with upcoming upstream JadeView releases (2.4 / 2.5).
:::

## Installation

```bash
go get github.com/luoxueyousheng/JadeViewGo@latest
```

To try the built-in example first (a runnable module subpackage):

```bash
go run github.com/luoxueyousheng/JadeViewGo/example@latest
```

## Quick Example

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

## Project Info

- **Version**: always use `@latest`; see [GitHub Releases](https://github.com/luoxueyousheng/JadeViewGo/releases) for changelogs
- **License**: wrapper code is MIT (binaries under `lib/` are produced by the JadeView authors and not covered by MIT)
- **Source**: [GitHub](https://github.com/luoxueyousheng/JadeViewGo)
