---
order: 0
---

# Introduction

The JadeUI Python SDK is a library for building desktop apps with Python. It provides window management, IPC communication, system integration, and Web front-end integration based on JadeView WebView technology. The current SDK version is **2.3.0**, aligned with JadeView **v2.3.0 (Build 26G02)**.

## What is the JadeUI Python SDK

The JadeUI Python SDK is an object-oriented Python library that gives Python developers a complete toolchain for creating modern desktop apps. Built on JadeView's WebView technology, it lets developers use Python as the backend and Web technologies (HTML/CSS/JavaScript) as the front end to quickly build cross-platform desktop apps.

## Core Features

- **Application management**: The `JadeUIApp` class provides application lifecycle management
- **Window management**: The `Window` class supports creating, configuring, and controlling WebView windows
- **IPC communication**: The `IPCManager` class enables bidirectional communication between the Python backend and the Web front end
- **Local server**: The `LocalServer` class provides a built-in HTTP server for hosting Web content
- **Routing system**: The `Router` class provides a backend-driven routing system that supports built-in and custom templates
- **Event system**: The `EventEmitter` class provides a flexible mechanism for subscribing to and publishing events
- **Dialogs and notifications**: `Dialog` and `Notification` wrap system file dialogs, message boxes, and desktop notifications
- **System integration**: `Tray`, `HotKey`, `Clipboard`, and `System` support tray icons, global shortcuts, clipboard access, system paths, display info, and version queries
- **YAML storage**: `Storage` wraps the JadeView 2.3 YAML persistence APIs
- **Window enhancements**: DevTools, zoom, taskbar progress/flash, content protection, window levels, skip taskbar, no activate, and HWND-to-window-id lookup

## Use Cases

The JadeUI Python SDK is suitable for the following scenarios:

1. **Desktop app development**: Build cross-platform desktop apps with Python
2. **Utility applications**: Create tools and utilities with a modern UI
3. **Data visualization**: Combine Web technologies to present data processed by Python
4. **Prototyping**: Quickly build app prototypes and demos

## Technical Architecture

The JadeUI Python SDK uses the following technical architecture:

```
┌─────────────────────────────────────────┐
│              Python backend              │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ JadeUIApp   │  │ IPCManager  │       │
│  │ (lifecycle) │  │ (comms mgmt)│       │
│  └─────────────┘  └─────────────┘       │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ Window      │  │ LocalServer │       │
│  │ (window mgmt)│ │ (asset svc) │       │
│  └─────────────┘  └─────────────┘       │
│  ┌─────────────┐  ┌─────────────┐       │
│  │ Router      │  │ EventEmitter│       │
│  │ (routing)   │  │ (events)    │       │
│  └─────────────┘  └─────────────┘       │
└─────────────────┬───────────────────────┘
                  │ FFI/ctypes
┌─────────────────┴───────────────────────┐
│           JadeView DLL (Rust)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│        WebView2 / system WebView        │
│  ┌───────────────────────────────────┐  │
│  │       HTML / CSS / JavaScript      │  │
│  │            (front-end UI)          │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## System Requirements

- **Python version**: Python 3.7+
- **Operating system**: Windows 10/11
- **Runtime**: WebView2 Runtime on Windows
- **Python architecture**: Windows supports x86 / x64 / arm64. The SDK downloads and loads the matching JadeView native library for the active Python interpreter architecture.
- **Not supported**: Upstream JadeView does not ship a Linux native library yet (still in development), so the SDK currently supports Windows only.

## Version and DLL Update Rules

JadeUI automatically downloads the adapted JadeView DLL. The current SDK targets `v2.3.0` and may select the latest build within the same release tag, such as a later build after `26G02`.

:::warning{title="Compatibility Boundary"}
Automatic updates are limited to build revisions within the same API version / release tag. Minor or major jumps such as `2.2 -> 2.3` or `2.3 -> 2.4` may include ABI or behavior changes and require an explicit SDK adaptation first.
:::

:::info{title="IPC Message Limit"}
Keep a single business `jade.invoke` payload below `1000KB`; an exact `1MiB` payload plus IPC framing exceeds the native bridge limit and is rejected. Use chunks, temporary files, or resource URLs for larger content.
:::

## Installation

Install the JadeUI Python SDK via pip:

```bash
pip install jadeui
```

Or use poetry:

```bash
poetry add jadeui
```

## Quick Example

```python
from jadeui import Window

Window(title="Hello JadeUI", url="https://example.com").run()
```

## License

The JadeUI Python SDK is released under the MIT License, allowing free use, modification, and distribution.

## Community and Support

- GitHub repository: [https://github.com/HG-ha/Jadeui](https://github.com/HG-ha/Jadeui)
- Documentation site: [https://jade.run/sdks/python-sdk](https://jade.run/sdks/python-sdk)
- For questions or suggestions, feel free to submit an Issue or Pull Request
