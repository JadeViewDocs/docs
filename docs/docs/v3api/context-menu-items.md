---
title: 菜单项类型与原生动作
order: 2
sidebar_parent: 网页右键菜单
group:
  title: 菜单
  order: 3.5
---

# 菜单项类型与原生动作

网页右键菜单模板里的每一项都由 `kind` 描述类型，并可以用 `role` 或 `native_name` 绑定原生动作。完整 API 和示例见 [网页右键菜单](/docs/v3api/context-menu-api)。

## 菜单项类型（kind）

| kind | 类型 | 说明 |
|---:|---|---|
| 0 | 普通项 | 点击执行动作；没有 `role`/`native_name` 时派发 `context-menu-click` |
| 1 | 子菜单 | 子项通过 `parent_id` 指向它的 `id` |
| 2 | 分隔线 | 不可点击 |
| 3 | 复选框 | 点击切换勾选，`flags` bit1 表示已选 |
| 4 | 单选框 | 同组互斥，`flags` bit1 表示已选 |

`role`/`native_name` 只用于普通项、复选框和单选框；子菜单和分隔线不需要。

## 原生动作

- `role`：跨平台动作，例如 `copy`、`paste`、`print`、`reload`、`toggleDevTools`。运行时会按当前右键上下文找对应原生项；没有原生项时按内置回退执行或置灰。
- `native_name`：直接引用当前平台的原生菜单项 Name。Windows 使用 WebView2 原生 Name（下面列表），Linux 使用 WebKitGTK 的 `gio::Action` 名称（例如 `go-back`、`go-forward`、`reload`、`copy`、`cut`、`paste`、`select-all`）。

当前上下文不存在该原生项时，对应菜单项会置灰。分享、导入密码等项默认被过滤。

## Windows WebView2 原生 Name

以下数据基于 WebView2 Runtime 实际运行输出采集；实际列表随 WebView2 版本和右键上下文变化。`native_name` 按这些 Name 匹配。

### 页面空白

| Name | 说明 | 类型 |
|---|---|---|
| `back` | 返回 | 命令 |
| `forward` | 前进 | 命令 |
| `reload` | 刷新 | 命令 |
| `saveAs` | 另存为 | 命令 |
| `print` | 打印 | 命令 |
| `moreTools` | 更多工具 | 子菜单 |
| `inspectElement` | 检查元素 | 命令 |

### 选中文本

| Name | 说明 | 类型 |
|---|---|---|
| `copy` | 复制 | 命令 |
| `copyLinkToHighlight` | 复制指向高亮的链接 | 命令 |
| `print` | 打印 | 命令 |
| `moreTools` | 更多工具 | 子菜单 |
| `inspectElement` | 检查元素 | 命令 |

### 可编辑区域

| Name | 说明 | 类型 |
|---|---|---|
| `emoji` | 表情符号 | 命令 |
| `undo` | 撤销 | 命令 |
| `redo` | 重做 | 命令 |
| `cut` | 剪切 | 命令 |
| `copy` | 复制 | 命令 |
| `paste` | 粘贴 | 命令 |
| `pasteAndMatchStyle` | 粘贴为纯文本 | 命令 |
| `selectAll` | 全选 | 命令 |
| `moreTools` | 更多工具 | 子菜单 |
| `inspectElement` | 检查元素 | 命令 |

### 链接

| Name | 说明 | 类型 |
|---|---|---|
| `openLinkInNewWindow` | 在新窗口打开链接 | 命令 |
| `saveLinkAs` | 链接另存为 | 命令 |
| `copyLinkLocation` | 复制链接 | 命令 |
| `moreTools` | 更多工具 | 子菜单 |
| `inspectElement` | 检查元素 | 命令 |

### 图片

| Name | 说明 | 类型 |
|---|---|---|
| `saveImageAs` | 图片另存为 | 命令 |
| `copyImage` | 复制图片 | 命令 |
| `copyImageLocation` | 复制图片地址 | 命令 |
| `magnifyImage` | 放大图像 | 命令 |
| `share` | 共享（默认过滤） | 命令 |
| `inspectElement` | 检查元素 | 命令 |

### 视频 / 音频

| Name | 说明 | 类型 |
|---|---|---|
| `saveMediaAs` | 媒体另存为 | 命令 |
| `copyLink` | 复制链接 | 命令 |
| `inspectElement` | 检查元素 | 命令 |

## 完整 Name 索引

| Name | 说明 | 出现场景 |
|---|---|---|
| `back` | 后退 | 页面 |
| `forward` | 前进 | 页面 |
| `reload` | 刷新 | 页面 |
| `cut` | 剪切 | 可编辑区域 |
| `copy` | 复制 | 选中文本 / 可编辑区域 |
| `paste` | 粘贴 | 可编辑区域 |
| `pasteAndMatchStyle` | 粘贴为纯文本 | 可编辑区域 |
| `selectAll` | 全选 | 可编辑区域 |
| `undo` | 撤销 | 可编辑区域 |
| `redo` | 重做 | 可编辑区域 |
| `emoji` | 表情符号 | 可编辑区域 |
| `saveAs` | 另存为 | 页面 |
| `saveLinkAs` | 链接另存为 | 链接 |
| `saveImageAs` | 图片另存为 | 图片 |
| `saveMediaAs` | 媒体另存为 | 视频 / 音频 |
| `copyImage` | 复制图片 | 图片 |
| `copyImageLocation` | 复制图片地址 | 图片 |
| `copyLinkLocation` | 复制链接 | 链接 |
| `copyLink` | 复制链接 | 视频 / 音频 |
| `copyLinkToHighlight` | 复制指向高亮的链接 | 选中文本 |
| `openLinkInNewWindow` | 在新窗口打开链接 | 链接 |
| `print` | 打印 | 页面 / 选中文本 |
| `inspectElement` | 检查元素 | 所有场景 |
| `moreTools` | 更多工具（子菜单） | 大部分场景 |
| `magnifyImage` | 放大图像 | 图片 |
| `share` | 共享（默认过滤） | 大部分场景 |
| `spellCheck` | 拼写检查（子菜单） | 可编辑区域（取决于 WebView2 版本） |
| `extension` | 扩展（子菜单） | 取决于已安装扩展 |

> `share`、导入密码等项默认被过滤；需要类似能力时请在 `role`/`native_name` 之外自行实现。
