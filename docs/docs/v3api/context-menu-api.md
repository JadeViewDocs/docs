---
title: 网页右键菜单
order: 1
group:
  title: 菜单
  order: 3.5
---

# 网页右键菜单

未设置模板时显示当前上下文的原生菜单；需要自定义时，用 `jade_webview_set_context_menu` 给 WebView 设置模板。

## 默认菜单

默认菜单由当前上下文决定，打印、另存为、复制等动作由浏览器执行，不派发 `menu-command`。是否允许打开右键菜单由 `allow_right_click` 控制。

| 右键目标 | 常见菜单项 |
|---|---|
| 页面空白 | 返回、前进、刷新、另存为、打印、检查元素 |
| 选中文本 | 复制、打印、检查元素 |
| 可编辑区域 | 撤销、重做、剪切、复制、粘贴、粘贴为纯文本、全选、检查元素 |
| 链接 | 在新窗口打开链接、链接另存为、复制链接、检查元素 |
| 图片 | 图片另存为、复制图片、复制图片地址、放大图像、检查元素 |
| 视频 / 音频 | 媒体另存为、复制链接、检查元素 |

Windows 和 Linux 的项目随运行时版本和右键目标变化。

## 自定义模板

```c
typedef struct JadeContextMenuItemDesc {
    uint32_t struct_size;
    const char* id;
    const char* parent_id;
    const char* label;
    const char* accelerator;
    const char* role;         /* 统一动作名 */
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

模板按 WebView 保存；`item_count=0` 或 `jade_webview_clear_context_menu` 恢复默认菜单。

## 菜单项

| kind | 类型 | 说明 |
|---:|---|---|
| 0 | 普通项 | 点击执行动作；没有 `role` 时回传事件 |
| 1 | 子菜单 | 子项通过 `parent_id` 指向它的 `id` |
| 2 | 分隔线 | 不可点击 |
| 3 | 复选框 | `flags` bit1 表示已选 |
| 4 | 单选框 | 同组互斥，`flags` bit1 表示已选 |

约束：

- `struct_size` 必须等于 `sizeof(JadeContextMenuItemDesc)`。
- `role` 项和分隔线的 `id` 可留空；自定义项和子菜单必须提供唯一 `id`。
- 子菜单的 `id` 是子项的 `parent_id`；最多 512 项、三级子菜单。
- 除分隔线外，`label` 和 `role` 至少提供一个。

完整的 kind 和 role 列表见 [菜单项类型与原生动作](/docs/v3api/context-menu-items)。

使用字体图标时，一起设置 `icon_path` 和 `icon_codepoint`。例如，Python 模板项可写成 `{"id": "open", "label": "打开", "icon_path": "app/fonts/icons.ttf", "icon_codepoint": 0xE001}`。先挂载 JAPK，并使用该字体实际包含的编码。C 将这两个字段填入 `JadeContextMenuItemDesc.icon`。 [图标配置](/docs/v3api/menu-api)

## 动作（role）

`role` 使用统一动作名；平台兼容和完整列表见 [菜单项类型与原生动作](/docs/v3api/context-menu-items)。

| role | 说明 |
|---|---|
| `undo` `redo` `cut` `copy` `paste` `pasteAndMatchStyle` `delete` `selectAll` | 编辑 |
| `back` `forward` `reload` `forceReload` | 导航 |
| `print` `saveAs` `viewSource` `inspectElement` `toggleDevTools` | 页面 |
| `zoomIn` `zoomOut` `resetZoom` | 缩放 |
| `togglefullscreen` `minimize` `close` `quit` | 窗口 |

`role` 不区分大小写和分隔符（`saveAs`、`save-as`、`saveas` 等价）。

## 事件

没有 `role` 的普通项由宿主处理。点击后派发：

```json
{"window_id":1,"webview_id":2,"item_id":"copy-link"}
```

`role` 项由浏览器或运行时执行，不派发该事件。

## 示例

```c
JadeContextMenuItemDesc items[] = {
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "undo", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "redo", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, NULL, 2, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "copy", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "saveImageAs", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), "copy-link", NULL, "复制链接", NULL, NULL, 0, 0, { 0 } },
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
    {"role": "saveImageAs"},
    {"role": "copyImage"},
    {"kind": "separator"},
    {"role": "reload"},
    {"role": "toggleDevTools"},
    {"kind": "separator"},
    {"id": "copy-link", "label": "复制链接"},
])

view.clear_context_menu()  # 恢复默认菜单
```

## 完全自绘菜单

需要完全控制菜单内容、且不需要原生动作时，在页面监听 DOM `contextmenu`，`preventDefault()` 后通过 IPC 调用 `jade_menu_popup`：

```c
JadeMenuItemDesc items[] = {
    { "copy", NULL, "复制", NULL, 0, 0, { 0 } },
    { "sep",  NULL, NULL,   NULL, 2, 0, { 0 } },
    { "about", NULL, "关于", NULL, 0, 0, { 0 } },
};
jade_menu_popup(window_id, items, 3, NULL); /* NULL = 当前鼠标位置 */
```

点击后通过 `menu-command` 收到 `{"item_id":"..."}`。完全自绘菜单不包含原生项；需要打印、另存为、复制时，优先使用上面的模板。
