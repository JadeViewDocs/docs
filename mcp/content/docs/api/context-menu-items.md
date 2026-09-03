---
title: 菜单项类型与原生菜单项
order: 4
group:
  title: 原生 UI
  order: 4
---

# 菜单项类型与原生菜单项

## kind 参数说明

创建菜单项时通过 `kind` 参数指定菜单项的类型和行为。

| kind | 类型 | 作用 |
|------|------|------|
| 0 | 普通命令 | 点击触发回调，执行操作 |
| 1 | 分隔线 | 视觉分隔，不可点击 |
| 2 | 复选框 | 带勾选状态，点击切换勾选 |
| 3 | 单选 | 同组内互斥选择，点击选中该项 |
| 4 | 子菜单 | 展开下级菜单 |
| **5** | **默认菜单项** | **WebView2 原生操作，不发事件** |

`kind=5` 时 `label` 参数填写 WebView2 默认菜单项的 Name，点击时由 WebView2 执行原生操作，**不触发 `menu-item-clicked` 事件**。

> 以下数据基于 WebView2 Runtime 实际运行输出采集。WebView2 对部分菜单项（分隔线、扩展注入项等）不暴露程序化 Name（返回 `"other"`），此类项无法通过 `jade_menu_item_create(kind=5)` 引用，已从列表中排除。

---

## 原生菜单项 Name 列表

### 按右键上下文分类

#### 页面空白处（kind=page）

| Name | Label | 类型 |
|------|-------|------|
| `back` | 返回(&B) | 命令 |
| `forward` | 前进(&F) | 命令 |
| `reload` | 刷新(&R) | 命令 |
| 分隔线 | | 分隔线 |
| `saveAs` | 另存为(&A) | 命令 |
| `print` | 打印(&P) | 命令 |
| 分隔线 | | 分隔线 |
| `moreTools` | 更多工具(&L) | 子菜单 |
| ↳ `share` | 共享(&S) | 命令 |
| 分隔线 | | 分隔线 |
| `inspectElement` | 检查(&N) | 命令 |

#### 选中文本（kind=selected_text）

| Name | Label | 类型 |
|------|-------|------|
| `copy` | 复制(&C) | 命令 |
| `copyLinkToHighlight` | 复制指向突出显示的链接 | 命令 |
| `print` | 打印(&P) | 命令 |
| 分割线 | | 分隔线 |
| `moreTools` | 更多工具(&L) | 子菜单 |
| ↳ `share` | 共享(&S) | 命令 |
| 分割线 | | 分隔线 |
| `inspectElement` | 检查(&N) | 命令 |

#### 可编辑区域（is_editable=true）

| Name | Label | 类型 |
|------|-------|------|
| `emoji` | 表情符号(&E) | 命令 |
| 分割线 | | 分隔线 |
| `undo` | 撤消(&U) | 命令 |
| `redo` | 恢复(&R) | 命令 |
| 分割线 | | 分隔线 |
| `cut` | 剪切(&T) | 命令 |
| `copy` | 复制(&C) | 命令 |
| `paste` | 粘贴(&P) | 命令 |
| `pasteAndMatchStyle` | 粘贴为纯文本(&A) | 命令 |
| `selectAll` | 全选(&A) | 命令 |
| 分割线 | | 分隔线 |
| `moreTools` | 更多工具(&L) | 子菜单 |
| ↳ `share` | 共享(&S) | 命令 |
| 分割线 | | 分隔线 |
| `inspectElement` | 检查(&N) | 命令 |

#### 链接（has_link=true）

| Name | Label | 类型 |
|------|-------|------|
| `openLinkInNewWindow` | 在新窗口中打开链接(&W) | 命令 |
| 分割线 | | 分隔线 |
| `saveLinkAs` | 将链接另存为(&K) | 命令 |
| `copyLinkLocation` | 复制链接(&O) | 命令 |
| 分割线 | | 分隔线 |
| `moreTools` | 更多工具(&L) | 子菜单 |
| ↳ `share` | 共享(&S) | 命令 |
| 分割线 | | 分隔线 |
| `inspectElement` | 检查(&N) | 命令 |

#### 图片（kind=image）

| Name | Label | 类型 |
|------|-------|------|
| `saveImageAs` | 将图像另存为(&V) | 命令 |
| `copyImage` | 复制图像(&Y) | 命令 |
| `copyImageLocation` | 复制图像链接(&M) | 命令 |
| 分割线 | | 分隔线 |
| `moreTools` | 更多工具(&L) | 子菜单 |
| ↳ `magnifyImage` | 放大图像(&M) | 命令 |
| ↳ `share` | 共享(&S) | 命令 |
| 分割线 | | 分隔线 |
| `inspectElement` | 检查(&N) | 命令 |

#### 视频（kind=video）

| Name | Label | 类型 |
|------|-------|------|
| `saveMediaAs` | 将视频另存为 | 命令 |
| `copyLink` | 复制链接(&O) | 命令 |
| 分割线 | | 分隔线 |
| `inspectElement` | 检查(&N) | 命令 |

#### 音频（kind=audio）

| Name | Label | 类型 |
|------|-------|------|
| `saveMediaAs` | 将音频另存为(&V) | 命令 |
| `copyLink` | 复制链接(&O) | 命令 |
| 分割线 | | 分隔线 |
| `inspectElement` | 检查(&N) | 命令 |

### 完整 Name 索引

| # | Name | 说明 | 出现场景 |
|---|------|------|----------|
| 1 | `back` | 后退 | 页面 |
| 2 | `forward` | 前进 | 页面 |
| 3 | `reload` | 刷新 | 页面 |
| 4 | `cut` | 剪切 | 可编辑区域 |
| 5 | `copy` | 复制 | 选中文本 / 可编辑区域 |
| 6 | `paste` | 粘贴 | 可编辑区域 |
| 7 | `pasteAndMatchStyle` | 粘贴为纯文本 | 可编辑区域 |
| 8 | `selectAll` | 全选 | 可编辑区域 |
| 9 | `undo` | 撤消 | 可编辑区域 |
| 10 | `redo` | 恢复 | 可编辑区域 |
| 11 | `emoji` | 表情符号 | 可编辑区域 |
| 12 | `saveAs` | 另存为 | 页面 |
| 13 | `saveLinkAs` | 将链接另存为 | 链接 |
| 14 | `saveImageAs` | 图片另存为 | 图片 |
| 15 | `saveMediaAs` | 将媒体另存为 | 视频 / 音频 |
| 16 | `copyImage` | 复制图片 | 图片 |
| 17 | `copyImageLocation` | 复制图片地址 | 图片 |
| 18 | `copyLinkLocation` | 复制链接 | 链接 |
| 19 | `copyLink` | 复制链接 | 视频 / 音频 |
| 20 | `copyLinkToHighlight` | 复制指向突出显示的链接 | 选中文本 |
| 21 | `openLinkInNewWindow` | 在新窗口打开链接 | 链接 |
| 22 | `print` | 打印 | 页面 / 选中文本 |
| 23 | `inspectElement` | 检查元素 | 所有场景 |
| 24 | `moreTools` | 更多工具（子菜单） | 大部分场景 |
| 25 | `magnifyImage` | 放大图像 | 图片（moreTools 子项） |
| 26 | `share` | 共享 | 大部分场景（moreTools 子项） |
| 27 | `spellCheck` | 拼写检查（子菜单） | 可编辑区域（取决于 WebView2 版本） |
| 28 | `extension` | 扩展（子菜单） | 取决于已安装扩展 |

:::warning
Name 列表取决于 WebView2 Runtime 版本和右键上下文，部分项仅在特定场景下可用（如 `copy` 仅在选中文本时存在）。如果指定的 Name 在当前右键上下文中不存在，`jade_menu_item_create` 将返回 `0`。[context-menu](/docs/api/context-menu-api) 事件的 `default_menu_names` 字段会返回当前右键上下文中实际可用的完整列表。
:::
