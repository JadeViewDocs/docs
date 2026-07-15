---
title: FAQ
order: 3
---

# FAQ

## Which events require manual subscription

- `窗口即将关闭`
- `即将导航`
- `请求新窗口`
- `下载开始`
- `文件拖入`

## How to return from interceptable events

- Return `1`: intercept
- Return `0`: allow through

## Recommended way to write IPC

Use object method callbacks to avoid the constraints of static methods:

```wsv
Jade.置IPC频道回调 (本对象, "ipcChannelMessageCallback")

// IPC回调只需要在初始化前设置一次即可

```

## Do asynchronous dialogs need to be released manually

No.

## Are tray events subscribed automatically

Yes. `JadeView_托盘.创建()` automatically subscribes to tray events.

> Tray event callbacks can be quickly created by clicking the declared tray class variable. It is recommended to declare the tray class within the startup method.
