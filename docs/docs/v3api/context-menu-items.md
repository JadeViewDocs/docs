---
title: 菜单项类型与原生动作
order: 2
sidebar_parent: 网页右键菜单
group:
  title: 菜单
  order: 3.5
---

# 菜单项类型与原生动作

网页右键菜单模板里的每一项都由 `kind` 描述类型，并可以用 `role` 绑定动作。完整 API 和示例见 [网页右键菜单](/docs/v3api/context-menu-api)。

## 菜单项类型（kind）

| kind | 类型 | 说明 | 平台 |
|---:|---|---|---|
| 0 | 普通项 | 点击执行动作；没有 `role` 时派发 `context-menu-click` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 1 | 子菜单 | 子项通过 `parent_id` 指向它的 `id` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 2 | 分隔线 | 不可点击 | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 3 | 复选框 | 点击切换勾选，`flags` bit1 表示已选 | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 4 | 单选框 | 同组互斥，`flags` bit1 表示已选 | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |

`role` 只用于普通项、复选框和单选框；子菜单和分隔线不需要。

## 动作（role）

### 编辑

| 动作 | role | 平台 |
|---|---|---|
| 撤销 | `undo` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 重做 | `redo` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 剪切 | `cut` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 复制 | `copy` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 粘贴 | `paste` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 粘贴为纯文本 | `pasteAndMatchStyle` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 删除 | `delete` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 全选 | `selectAll` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 表情符号 | `emoji` | ![Windows](/platform-windows.svg) |

### 导航

| 动作 | role | 平台 |
|---|---|---|
| 后退 | `back` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 前进 | `forward` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 刷新 | `reload` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 强制刷新 | `forceReload` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |

### 页面

| 动作 | role | 平台 |
|---|---|---|
| 打印 | `print` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 另存为 | `saveAs` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 查看源代码 | `viewSource` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 检查元素 | `inspectElement` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 开发者工具 | `toggleDevTools` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 放大 | `zoomIn` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 缩小 | `zoomOut` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 重置缩放 | `resetZoom` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 切换全屏 | `togglefullscreen` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 最小化 | `minimize` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 关闭窗口 | `close` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 退出 | `quit` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |

### 链接

| 动作 | role | 平台 |
|---|---|---|
| 在新窗口打开 | `openLinkInNewWindow` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 链接另存为 | `saveLinkAs` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 复制链接 | `copyLink` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 复制指向高亮的链接 | `copyLinkToHighlight` | ![Windows](/platform-windows.svg) |

### 图片

| 动作 | role | 平台 |
|---|---|---|
| 图片另存为 | `saveImageAs` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 复制图片 | `copyImage` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 复制图片地址 | `copyImageAddress` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 放大图像 | `magnifyImage` | ![Windows](/platform-windows.svg) |
| 共享 | `share` | ![Windows](/platform-windows.svg) |

### 媒体

| 动作 | role | 平台 |
|---|---|---|
| 媒体另存为 | `saveMediaAs` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 复制链接 | `copyLink` | ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 显示/隐藏控件 | `toggleMediaControls` | ![Linux](/platform-linux.svg) |

平台列表示可用系统；其余平台置灰。`role` 不区分大小写和分隔符。
