---
order: 0
---

# Introduction

The VolDP SDK (JadeView VolDP module) is the Volcano Development Platform (VolDP, PC edition) binding for JadeView 2.x, letting you build Windows desktop applications with VolDP + HTML/CSS/JS. Windows, events, bidirectional IPC, tray, context menus, dialogs, notifications, YAML persistence, JAPK resource packages, and NTP time are all covered, with a built-in nlohmann/json wrapper for parsing IPC payloads.

Method names follow Chinese VolDP conventions (`创建窗口`, `置标题`, `订阅事件`), while event names and IPC channel semantics stay consistent with the JadeView frontend JS API, keeping frontend/backend collaboration friction low.

## Key Features

- **Statically linked module**: the module integrates as `.wsv` + C++ bridge + static library (`JadeView.lib`); the build output is a **single exe** with no DLL to ship
- **Multi-architecture**: x86 (win32) / x64; the module's `lib\$(p)\` picks the right library for the build target automatically
- **Native VolDP experience**: events hook up via "receive event" methods (click the lightning icon next to the variable to generate callbacks), fixed values use constant classes (`窗口主题.深色`, `窗口边框样式.标题覆盖`) instead of raw strings
- **Member-object partitioning**: `Jade.窗口`, `Jade.系统`, `Jade.YAML`, `Jade.托盘`, `Jade.菜单`, `Jade.应用包` group capabilities by domain
- **Window management**: standard / borderless windows; size, position, fullscreen, always-on-top, window level (including desktop wallpaper layer), taskbar progress and flash, Mica / Acrylic backdrops, content protection, click-through
- **IPC**: event subscription (`订阅事件`), IPC channel object-method callbacks (`置IPC频道回调` + `注册IPC通道`), host push (`发送IPC消息`)
- **Dialogs**: open / save file dialogs, message box, error box, about dialog — both sync and async (object-method callback) APIs
- **System tray & menus**: tray icon + key-dispatched flat menu table (submenus / dividers / disabled / dangerous items), WebView context-menu takeover (native and custom items mixed)
- **JAPK resource packages**: encrypted / obfuscated frontend bundles, loadable from a byte set or embedded resource (zero frontend files on disk)
- **System tools**: clipboard, predefined paths, display info, global hotkeys, login autostart, URL schemes, file associations, printing, smart encoding conversion, file icon extraction, NTP network time
- **YAML config storage**: key-path based persistence (path-traversal safe, atomic writes, file locking) with auto-growing reads
- **Built-in JSON**: `json_object` / `json_array` / `json_value` (nlohmann/json wrapper) for parsing IPC payloads and building replies in one step

## Use Cases

- Windows desktop apps with a modern UI built on VolDP (HTML/CSS/JS frontend, VolDP backend)
- Tools that need **single-file distribution** (statically linked, one exe)
- Commercial apps that need encrypted frontend distribution (JAPK)
- Adding a WebView UI layer to an existing VolDP project

## Architecture

```
┌────────────────────────────────────────────────┐
│              VolDP layer (JadeView.wsv)          │
│  JadeView / 窗口 / 系统 / YAML / 托盘 / 菜单 / 应用包 │
└───────────────────────┬────────────────────────┘
                        │ embedded C++ (automatic UTF-16 ⇄ UTF-8)
┌───────────────────────┴────────────────────────┐
│        C++ bridge (Vol_JadeEventBridge)          │
│   event dispatch / IPC slots / async dialogs / JSON │
└───────────────────────┬────────────────────────┘
                        │ static link
┌───────────────────────┴────────────────────────┐
│            JadeView.lib (static library)         │
└───────────────────────┬────────────────────────┘
                        │
┌───────────────────────┴────────────────────────┐
│                WebView2 rendering                │
│        HTML / CSS / JavaScript (frontend UI)     │
└────────────────────────────────────────────────┘
```

## System Requirements

| Platform | Arch | Build dependency | Runtime dependency |
|------|------|----------|------------|
| **Windows 10 / 11** | x86 / x64 | Volcano Development Platform (VolDP) | WebView2 Runtime (bundled with Win11) |

:::info
Windows only for now. VolDP text project files (`.wsv` / `.vprj`, etc.) default to UTF-8 without BOM in current versions.
:::

## Installation

1. Download the module installation package and install it into the VolDP module directory
2. **Reference the JadeView module** (`火山.JadeView`) in your project
3. Declare a JadeView base-class variable: `变量 Jade <类型 = JadeView>`
4. Click the **lightning icon** next to the variable to quickly declare the event callback methods you need (`JadeView_应用就绪`, etc.)

## Quick Example

```wsv
<火山程序 类型 = "通常" 版本 = 1 />

包 火山.样例

类 启动类 <公开 基础类 = 程序类>
{
    变量 Jade <类型 = JadeView>

    方法 启动方法 <公开 类型 = 整数>
    {
        如果 (Jade.初始化 (真, "", "", "Hello JadeView", "com.example.hello", 真) == 假)
        {
            返回 (0)
        }
        Jade.运行消息循环 ()
        返回 (1)
    }

    方法 JadeView_应用就绪 <接收事件 类型 = 整数>
    参数 来源对象 <类型 = JadeView>
    参数 标记值 <类型 = 整数>
    参数 窗口ID <类型 = 整数>
    参数 数据 <类型 = 文本型>
    {
        如果 (来源对象 == Jade)
        {
            Jade.创建窗口 ("https://example.com", 0, , )
        }
        返回 (0)
    }

    方法 JadeView_全部窗口已关闭 <接收事件 类型 = 整数>
    参数 来源对象 <类型 = JadeView>
    参数 标记值 <类型 = 整数>
    参数 窗口ID <类型 = 整数>
    {
        如果 (来源对象 == Jade)
        {
            Jade.退出程序 ()
        }
        返回 (0)
    }
}
```

## Project Info

- **Version**: always use the latest release; see the repository Releases for change history
- **GitHub repository**: [Download the SDK source code](https://github.com/JadeViewDocs/JadeView/)
- **Gitee repository**: [Download the SDK source code](https://gitee.com/ilinxuan/JadeView_library)
