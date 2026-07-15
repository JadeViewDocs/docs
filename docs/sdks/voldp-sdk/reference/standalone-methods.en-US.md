---
title: Standalone Methods & Helpers
order: 4
group:
  title: "API Reference"
  order: 4
---

# Standalone Methods & Helpers

This page covers some notes that do not fit into a single class chapter.

## 取Jade文本并释放

Purpose:

- Copies the UTF-8 text pointer returned by Jade into VolDP text
- Then calls `jade_text_free(...)` to release the original pointer

Currently used mainly for the synchronous dialog return value scenario.

## Subscription Rules Summary

### Automatic Subscription

- `JadeView.初始化()` automatically subscribes to default non-intercepting events
- `JadeView_托盘.创建()` automatically subscribes to tray events

### Manual Subscription

Typical events that must be subscribed manually:

- `窗口即将关闭`
- `即将导航`
- `请求新窗口`
- `下载开始`
- `文件拖入`

## Return Value Rules Summary

### Events

- Only a few interceptable events interpret the return value
- Return values of ordinary events are ignored

### IPC

- Returning empty text: nothing is sent back
- Returning non-empty text: the module automatically constructs the return text

### Asynchronous Dialogs

- The callback return value is ignored

## What Users Need to Care About

When using the module, you only need to focus on:

- Installing the module
- Referencing the module
- Calling classes and methods
- Handling events and callbacks
