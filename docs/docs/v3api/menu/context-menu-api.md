---
title: 网页右键菜单
order: 1
group:
  title: 菜单
  order: 3.5
---

# 网页右键菜单

网页右键菜单用于响应页面内的右键点击。未设置自定义模板时，JadeView 会按右键命中的元素自动展示对应上下文的原生菜单；需要增删或重排菜单项时，通过 `jade_webview_set_context_menu` 为指定 WebView 绑定模板。

![网页右键菜单与二级子菜单批注示例](/screenshot/menu-context-annotated.png)

对照上图编号，网页右键菜单的组成如下：

1. **10pt 连续曲率圆角与 1px 描边**：与独立弹出菜单共用同一套渲染引擎，支持实时亚克力模糊与首帧抗锯齿边框。
2. **原生动作（`role`）与分隔线**：带有 `role` 的条目由浏览器或运行时直接执行（如复制图片链接、检查元素），不额外派发自定义事件。
3. **6pt 同心连续曲率 Hover 高亮**：悬浮态内缩 4 DIP，带子菜单标记的条目悬浮后自动展开下一级。
4. **级联二级子菜单**：通过 `parent_id` 将子项挂载到子菜单条目下，最多支持 3 级嵌套、512 项。
5. **快捷键提示区**：`accelerator` 右对齐展示（如 `Ctrl, Ctrl`），仅作提示。

## 默认菜单

未调用 `jade_webview_set_context_menu` 时，JadeView 自动根据点击目标展示系统/浏览器原生菜单，是否允许右键菜单由窗口配置中的 `allow_right_click` 控制：

| 右键目标 | 常见默认菜单项 |
| --- | --- |
| 页面空白 | 返回、前进、刷新、另存为、打印、检查元素 |
| 选中文本 | 复制、打印、检查元素 |
| 可编辑区域 | 撤销、重做、剪切、复制、粘贴、粘贴为纯文本、全选、检查元素 |
| 链接 | 在新窗口打开链接、链接另存为、复制链接、检查元素 |
| 图片 | 图片另存为、复制图片、复制图片地址、放大图像、检查元素 |
| 视频 / 音频 | 媒体另存为、复制链接、检查元素 |

:::tip{title="高 DPI 定位"}
WebView2 在高缩放屏幕下的右键位置会自动按所属窗口 DPI 换算后再定位，页面内编辑框、滚动容器或图片右键均会准确贴合光标弹出。
:::

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
    uint32_t item_count
);

int32_t jade_webview_clear_context_menu(uint32_t webview_id);
```

模板按 `webview_id` 独立保存；传入 `item_count = 0` 或调用 `jade_webview_clear_context_menu` 会恢复默认菜单。

### 菜单项类型与约束

| `kind` | 类型 | 说明 |
| ---: | --- | --- |
| `0` | 普通项 | 点击执行 `role` 动作；没有 `role` 时向宿主派发自定义事件。 |
| `1` | 子菜单 | 容器项，子项通过 `parent_id` 指向它的 `id`。 |
| `2` | 分隔线 | 不可点击的分组横线。 |
| `3` | 复选框 | `flags` bit1（`2`）表示已选中。 |
| `4` | 单选框 | 同组互斥，`flags` bit1（`2`）表示已选中。 |

- `struct_size` 必须等于 `sizeof(JadeContextMenuItemDesc)`。
- `role` 项和分隔线的 `id` 可留空；自定义项和子菜单必须提供唯一 `id`。
- 除分隔线外，`label` 和 `role` 至少提供一个；只填 `role` 时会自动使用系统本地化默认文案。
- 图标规则与 `jade_menu_popup` 一致，见[菜单 API 图标规则](/docs/v3api/menu/menu-api#图标规则)。完整的 `kind` 和 `role` 列表见[菜单项类型与原生动作](/docs/v3api/menu/context-menu-items)。

## 常用原生动作（`role`）

`role` 不区分大小写和连字符（`saveAs`、`save-as`、`saveas` 等价）：

| 类别 | 常用 `role` |
| --- | --- |
| 编辑 | `undo`、`redo`、`cut`、`copy`、`paste`、`pasteAndMatchStyle`、`delete`、`selectAll` |
| 导航 | `back`、`forward`、`reload`、`forceReload` |
| 页面与调试 | `print`、`saveAs`、`viewSource`、`inspectElement`、`toggleDevTools` |
| 缩放 | `zoomIn`、`zoomOut`、`resetZoom` |
| 窗口 | `togglefullscreen`、`minimize`、`close`、`quit` |

## 示例

下面示例将「撤销 / 重做 / 复制 / 图片另存为」等原生动作与一个自定义条目「复制链接」混排在一起：

```c
JadeContextMenuItemDesc items[] = {
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "undo", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "redo", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, NULL,   2, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "copy", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "saveImageAs", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), "copy-link", NULL, "复制链接", NULL, NULL, 0, 0, { 0 } },
};

if (!jade_webview_set_context_menu(webview_id, items, 6)) {
    /* 失败可通过 jade_last_error_code() / jade_last_error_message() 查看原因 */
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

# 恢复默认菜单
view.clear_context_menu()
```

## 事件

没有设置 `role` 的自定义项在点击后触发 `context-menu-click` 事件，负载如下：

```json
{"window_id":1,"webview_id":2,"item_id":"copy-link"}
```

带有 `role` 的条目由浏览器或运行时直接处理，不会重复派发该事件。

## 完全自绘菜单

如果希望完全接管右键逻辑且不需要任何浏览器内置动作，可在页面监听 DOM `contextmenu`，调用 `e.preventDefault()` 后通过 IPC 触发 [`jade_menu_popup`](/docs/v3api/menu/menu-api#弹出菜单jade_menu_popup)：

```c
JadeMenuItemDesc items[] = {
    { "copy",  NULL, "复制", NULL, 0, 0, { 0 } },
    { "sep",   NULL, NULL,   NULL, 2, 0, { 0 } },
    { "about", NULL, "关于", NULL, 0, 0, { 0 } },
};
jade_menu_popup(window_id, items, 3, NULL); /* NULL = 当前鼠标位置 */
```
