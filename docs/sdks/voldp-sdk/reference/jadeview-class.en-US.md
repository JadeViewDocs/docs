---
title: JadeView Class
order: 2
group:
  title: "API Reference"
  order: 4
---

# JadeView 类

`JadeView` is the module's main entry point, responsible for runtime initialization, window and view management, event subscription, IPC, dialogs, notifications, and system capability invocation.

## Recommended Usage Order

1. Set the IPC callback
2. Register the IPC channel
3. Manually subscribe to special events
4. Call `初始化(...)`
5. Enter `运行消息循环()`

## Initialization

### 初始化

- Initializes the runtime
- Automatically subscribes to the default non-intercepting events

### 运行消息循环

- Starts the message loop
- The main thread usually ends the startup phase here

## Window and View Capabilities

These mainly include:

- Creating windows and frameless windows
- Navigating and refreshing pages
- Executing scripts
- Controlling window title, position, size, visibility, always-on-top, minimize, and maximize
- Controlling theme, material, background color, content protection, and zoom

## Events

### Automatic Subscription

`初始化()` automatically subscribes to most ordinary events, for example:

- Application ready
- Second instance
- Window creation, close, and state change
- Page load start, load complete, title update, and icon update
- Page message
- Global hotkey
- Notification events

### Manual Subscription

The following events require an explicit call to `订阅事件(...)`:

- `窗口即将关闭`
- `即将导航`
- `请求新窗口`
- `下载开始`
- `文件拖入`

### Interceptable Events

For the following events, returning `1` indicates interception, and returning `0` indicates passing through:

- `窗口即将关闭`
- `即将导航`
- `请求新窗口`
- `下载开始`

## IPC

Using object method callbacks is recommended:

- `置IPC频道回调(...)`
  - All callbacks only require creating a single callback instance

- `注册IPC通道(...)`

Handling IPC as ordinary events is not recommended.

## Dialogs and Notifications

### Synchronous

- Open file dialog
- Save file dialog
- Message box
- Error box

### Asynchronous

- Open file dialog asynchronously
- Save file dialog asynchronously
- Message box asynchronously

Using object method callbacks is recommended for asynchronous dialogs.

## System Capabilities

These also include:

- Protocol registration and unregistration
- File association registration and unregistration
- Global hotkey registration and unregistration
- Path retrieval
- YAML reading and writing
- Display information
- Locale settings
- Version information
