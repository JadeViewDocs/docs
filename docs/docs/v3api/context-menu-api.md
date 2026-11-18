---
title: 网页右键菜单
order: 1
group:
  title: 菜单
  order: 3.5
---

# 网页右键菜单

Windows 和 Linux 的网页右键菜单由 JadeView 接管。默认显示浏览器原生菜单；需要自定义时，用 `jade_webview_set_context_menu` 给 WebView 设置模板，可以保留打印、另存为、复制等原生动作，也可以插入自己的菜单项。

## 默认菜单

未设置模板时，JadeView 自动显示当前上下文的原生菜单，不需要宿主注册事件：

- **Windows**：监听 WebView2 的 `ContextMenuRequested`，读取当前右键上下文里的原生菜单项，用 ImGui 自绘；用户选择后把该项的原生 `CommandId` 交回 WebView2，由 WebView2 执行打印、另存为、复制、撤销等原生动作。
- **Linux**：读取 WebKitGTK 的上下文菜单，用同一套 ImGui 菜单显示并执行原生 `gio::Action`。

是否允许打开右键菜单仍由 WebView 的 `allow_right_click` 控制。默认菜单项由当前 WebView 运行时和右键目标决定，常见项如下（实际列表随 WebView2 / WebKitGTK 版本变化）：

| 右键目标 | 常见原生项 | 平台 |
|---|---|---|
| 页面空白 | 返回、前进、刷新、另存为、打印、检查元素| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 选中文本 | 复制、打印、检查元素| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 可编辑区域 | 撤销、重做、剪切、复制、粘贴、粘贴为纯文本、全选、检查元素| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 链接 | 在新窗口打开链接、链接另存为、复制链接、检查元素| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 图片 | 图片另存为、复制图片、复制图片地址、放大图像、检查元素| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| 视频 / 音频 | 媒体另存为、复制链接、检查元素| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |

默认菜单的打印、另存为、复制、撤销等全部由浏览器执行，不会派发 `menu-command`。

## 自定义模板

```c
typedef struct JadeContextMenuItemDesc {
    uint32_t struct_size;
    const char* id;
    const char* parent_id;
    const char* label;
    const char* accelerator;
    const char* role;         /* 跨平台原生动作 */
    const char* native_name;  /* 当前平台原生菜单项 Name */
    uint32_t kind;            /* 0 普通项、1 子菜单、2 分隔线、3 复选、4 单选 */
    uint32_t flags;           /* bit0 禁用，bit1 已选中 */
    JadeMenuIconDesc icon;
} JadeContextMenuItemDesc;

int32_t jade_webview_set_context_menu(
    uint32_t webview_id,
    const JadeContextMenuItemDesc* items,
    uint32_t item_count);

int32_t jade_webview_clear_context_menu(uint32_t webview_id);
```

模板按 WebView 保存，调用时同步复制；不设置模板时使用默认菜单，设置后完全替换默认菜单。`jade_webview_clear_context_menu` 或 `item_count=0` 恢复默认菜单。

### 菜单项

`kind` 与普通菜单一致：

| kind | 类型 | 说明 |
|---:|---|---|
| 0 | 普通项 | 点击执行动作；没有 `role`/`native_name` 时回传事件 |
| 1 | 子菜单 | 子项通过 `parent_id` 指向它的 `id` |
| 2 | 分隔线 | 不可点击 |
| 3 | 复选框 | 点击切换勾选，`flags` bit1 表示已选 |
| 4 | 单选框 | 同组互斥，`flags` bit1 表示已选 |

完整的 `kind` 与原生动作说明、WebView2 原生 Name 列表见 [菜单项类型与原生动作](/docs/v3api/context-menu-items)。

约束：

- `struct_size` 必须等于 `sizeof(JadeContextMenuItemDesc)`。
- `role` / `native_name` 项、分隔线的 `id` 可以留空，运行时会生成内部 id；自定义项和子菜单必须提供唯一 `id`。
- 自定义项的 `id` 会原样出现在 `context-menu-click` 事件里。
- 子菜单的 `id` 作为子项的 `parent_id`；最多 512 项、三级子菜单。
- 除分隔线外，`label` 和 `role`/`native_name` 至少要有一个；`role` 项没有 `label` 时使用原生菜单的本地化文案。

### 原生动作

`role` 和 `native_name` 二选一：

- `role`：跨平台常用动作，运行时会按当前右键上下文找对应的原生项；找不到时按表里的回退方式执行或置灰。
- `native_name`：直接引用当前平台的原生菜单项 Name（v2 `kind=5` 的等价能力），适合 `saveImageAs`、`copyImage`、`openLinkInNewWindow` 这类上下文相关动作；当前上下文没有该项时置灰。

常用 `role`：

| role | 执行方式 | 平台 |
|---|---|---|
| `undo` `redo` `cut` `copy` `paste` `pasteAndMatchStyle` `delete` `selectAll` | 当前上下文里的原生编辑动作| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| `back` `forward` `reload` | 原生导航项；没有原生项时调用导航 API| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| `print` `saveAs` | WebView2 / WebKitGTK 的打印、另存为| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| `viewSource` `inspectElement` | 原生检查项；没有时打开 DevTools| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| `toggleDevTools` | 打开 DevTools| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| `resetZoom` `zoomIn` `zoomOut` | 设置 WebView 缩放（0.25–5.0）| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| `togglefullscreen` `minimize` `close` `quit` | 窗口动作| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |

原生项的文案和快捷键默认取当前系统语言；模板里的 `label` / `accelerator` 可以覆盖；`flags` 的 bit0 强制禁用，bit1 设置复选/单选选中状态。

### 自定义项事件

没有 `role` / `native_name` 的普通项由宿主处理。点击后菜单关闭，派发 `context-menu-click`：

```json
{"window_id":1,"webview_id":2,"item_id":"copy-link"}
```

`role` / `native_name` 项由浏览器或运行时执行，不会派发 `context-menu-click`。

### 示例

```c
JadeContextMenuItemDesc items[] = {
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "undo", NULL, 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "redo", NULL, 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, NULL, NULL, 2, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "copy", NULL, 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, NULL, "saveImageAs", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), "copy-link", NULL, "复制链接", NULL, NULL, NULL, 0, 0, { 0 } },
};

if (!jade_webview_set_context_menu(webview_id, items, 6)) {
    /* 已拒绝：查看 jade_last_error_code()/jade_last_error_message() */
}
```

Python：

```python
view.set_context_menu([
    {"role": "undo"},
    {"role": "redo"},
    {"kind": "separator"},
    {"role": "cut"},
    {"role": "copy"},
    {"role": "paste"},
    {"kind": "separator"},
    {"native_name": "saveImageAs"},
    {"native_name": "copyImage"},
    {"kind": "separator"},
    {"role": "reload"},
    {"role": "toggleDevTools"},
    {"kind": "separator"},
    {"id": "copy-link", "label": "复制链接"},
])
```

恢复默认菜单：

```python
view.clear_context_menu()
```

## 完全自绘菜单

需要完全控制菜单内容、且不需要原生动作时，也可以在页面监听 DOM `contextmenu`，调用 `preventDefault()`，通过 IPC 通知宿主调用 `jade_menu_popup`：

```c
JadeMenuItemDesc items[] = {
    { "copy", NULL, "复制", NULL, 0, 0, { 0 } },
    { "sep",  NULL, NULL,   NULL, 2, 0, { 0 } },
    { "about", NULL, "关于", NULL, 0, 0, { 0 } },
};
jade_menu_popup(window_id, items, 3, NULL); /* NULL = 当前鼠标位置 */
```

点击后通过 `menu-command` 事件收到 `{"item_id":"..."}`。

完全自绘菜单不会自动包含默认菜单的原生项；需要打印、另存为、复制等能力时，优先使用 `jade_webview_set_context_menu` 模板。

## 与 v2 的差异

v2 的右键菜单使用 `context-menu` 事件、`default_menu_names`、`jade_menu_item_create(kind=5)` 和 `jade_set_context_menu_items`。v3 改为：

- 默认自动镜像原生菜单，不再需要 `default_menu_names` 或 `kind=5`；
- 自定义使用 `jade_webview_set_context_menu` 模板，`native_name` 等价于 v2 的 `kind=5`，`role` 提供跨平台常用动作；
- 自定义项通过 `context-menu-click` 回传；v2 的 `context-menu` 动态事件目前没有在 v3 公开，模板按 WebView 静态保存，角色在每次右键时按上下文解析。

v2 的旧接口和字段只在 v2 文档中维护；v3 项目请使用本页的模板接口。
