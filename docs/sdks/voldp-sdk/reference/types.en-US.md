---
title: Data Types
order: 1
group:
  title: "API Reference"
  order: 4
---

# Data Types

## JadeView_窗口选项

Purpose:

- Passed to `创建窗口(...)`
- Controls the window title, position, size, border style, theme, background color, and so on

Common fields:

- `标题`
- `左边`
- `顶边`
- `宽度`
- `高度`
- `可调整大小`
- `允许最小化`
- `允许最大化`
- `透明窗口`
- `边框风格`
- `主题`
- `背景颜色`
- `内容保护`

## JadeView_视图选项

Purpose:

- Passed to `创建窗口(...)`
- Configures WebView behavior

Common fields:

- `允许全屏`
- `后台节流`
- `自动播放`

## JadeView_通知参数

Purpose:

- Passed to `显示通知(...)`

Common fields:

- `标题`
- `正文`
- `图标`
- `超时毫秒`
- `按钮1`
- `按钮2`
- `文本3`
- `动作`

## Callback Templates

### IPC Channel Message Template

Used with `置IPC频道回调(...)`; using object methods and output names is recommended.

### Dialog Async Object Callback Template

Used for async dialog result callbacks; the parameter is `文本型 JSON`.
