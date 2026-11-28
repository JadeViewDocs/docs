---
title: 菜单 API
order: 0
group:
  title: 菜单
  order: 3.5
---

# 菜单

JadeView 提供原生风格的独立弹出菜单 `jade_menu_popup`，用于下拉选择、自定义右键菜单和托盘浮层。显示在标题栏下方的窗口菜单栏单独成页，见[窗口菜单栏](/docs/v3api/window/window-menu)。

![JadeView 弹出菜单示例（浅色模式下拉菜单，支持勾选与 10pt 连续曲率亚克力外观）](/screenshot/menu-overview.jpg)

## 选择菜单类型

| 类型 | 接口 | 适用场景 |
| --- | --- | --- |
| 独立弹出菜单 | `jade_menu_popup` | 下拉菜单、托盘右键菜单、页面拦截 `contextmenu` 后的自定义浮层。 |
| 窗口菜单栏 | [`jade_window_set_menu`](/docs/v3api/window/window-menu) | 固定在默认标题栏下方的应用级菜单栏（Windows / Linux）。 |
| 网页右键菜单 | [`jade_webview_set_context_menu`](/docs/v3api/menu/context-menu-api) | 保留浏览器原生动作（复制、检查元素、图片另存为）的页面右键菜单模板。 |

## 菜单结构与视觉规范

弹出菜单在 Windows 11 下使用亚克力半透明材质，在 Windows 10 与 Linux 下使用圆角实心底色，全平台统一采用 **10pt 连续曲率圆角（Squircle）**、1px 抗锯齿描边与同心圆角悬浮高亮。

![弹出菜单实拍结构与批注](/screenshot/menu-overview-annotated.png)

对照上图编号，各区域说明如下：

1. **10pt 连续曲率外框与 1px 描边**：外轮廓采用 10 DIP 连续曲率圆角（Squircle）与 1px 抗锯齿描边。
2. **勾选与图标列（`kind = 3 / 4`）**：支持复选、单选的勾选标记，以及 PNG/ICO 或字体字形图标；点击带 `accelerator` 的项时快捷键提示右对齐展示。
3. **亚克力半透明背景材质**：Windows 11 下实时透出下方窗口并保持文字清晰；Windows 10 与 Linux 下使用同曲率圆角实心底色。
4. **智能避让与软阴影**：靠近屏幕边缘或任务栏时自动夹紧或向上翻转，全平台统一附带柔和投影与 6pt 同心连续曲率悬浮高亮（详见[网页右键菜单](/docs/v3api/menu/context-menu-api)）。

## 弹出菜单（`jade_menu_popup`）

```c
int32_t jade_menu_popup(
    uint32_t window_id,
    const JadeMenuItemDesc* items,
    uint32_t item_count,
    const JadeMenuPosition* position
);
```

### 参数说明

| 参数 | 说明 |
| --- | --- |
| `window_id` | 所属窗口 ID；托盘等无主弹窗传 `0`。Wayland 下必须传有效的 `window_id`。 |
| `items` / `item_count` | 扁平菜单项数组与数量；树形层级通过 `parent_id` 关联。 |
| `position` | 弹出坐标；传 `NULL` 时自动弹出在当前鼠标位置。 |

:::tip{title="坐标与 DPI 说明"}
`position` 在传入有效 `window_id` 时使用**窗口客户区逻辑像素（DIP）**，JadeView 会按窗口当前 DPI 自动换算为屏幕物理坐标并避开任务栏与屏幕边缘；`window_id = 0` 时直接使用屏幕物理坐标。
:::

### 快速示例

下面的示例构建一个包含勾选状态、分隔线、图标与二级子菜单的弹出菜单，并在鼠标当前位置显示：

```c
JadeMenuItemDesc items[] = {
    { "builtin", NULL, "内置服务器", NULL, 4, 2, { 0 } },   /* kind=4 单选, flags=2 已选中 */
    { "aliyun",  NULL, "阿里云",     NULL, 4, 0, { 0 } },
    { "sep1",    NULL, NULL,         NULL, 2, 0, { 0 } },   /* 分隔线 */
    { "more",    NULL, "更多设置",   NULL, 1, 0, { 0 } },   /* 子菜单容器 */
    { "print",   "more", "打印",     "Ctrl+P", 0, 0,
      { NULL, NULL, 0, 0xE749 } },                          /* 字体图标 */
};

if (!jade_menu_popup(window_id, items, 5, NULL)) {
    /* 失败可通过 jade_last_error_code() / jade_last_error_message() 查看原因 */
}
```

Python：

```python
menu = Menu.build_from_template(runtime, [
    {"id": "builtin", "label": "内置服务器", "kind": "radio", "checked": True},
    {"id": "aliyun", "label": "阿里云", "kind": "radio"},
    {"kind": "separator"},
    {
        "id": "more",
        "label": "更多设置",
        "submenu": [
            {"id": "print", "label": "打印", "accelerator": "Ctrl+P", "icon_codepoint": 0xE749},
            {"id": "open", "label": "打开目录", "icon_path": "C:/icons/open.png"},
        ],
    },
])

menu.popup(window)  # 省略 x / y 即在当前鼠标位置弹出
```

## 菜单项结构（`JadeMenuItemDesc`）

```c
typedef struct JadeMenuIconDesc {
    const char* icon_path;
    const uint8_t* icon_data;
    size_t icon_data_size;
    uint32_t icon_codepoint;
} JadeMenuIconDesc;

typedef struct JadeMenuItemDesc {
    const char* id;
    const char* parent_id;
    const char* label;
    const char* accelerator;
    uint32_t kind;
    uint32_t flags;
    JadeMenuIconDesc icon;
} JadeMenuItemDesc;
```

| 字段 | 说明 |
| --- | --- |
| `id` | 非空唯一 ID，用于 `parent_id` 关联和点击事件回传。 |
| `parent_id` | 父菜单项 ID；顶层项填 `NULL`。 |
| `label` | UTF-8 显示文本；除分隔线外不能为空。 |
| `accelerator` | 快捷键提示文本（如 `"Ctrl+O"`）；仅作显示，不自动注册快捷键。 |
| `kind` | `0` 普通项、`1` 子菜单、`2` 分隔线、`3` 复选框、`4` 单选框。 |
| `flags` | bit0（`1`）禁用，bit1（`2`）已选中。 |
| `icon` | 可选图标配置；全零表示无图标。 |

## 图标规则

![带图标、禁用态与快捷键提示的系统菜单示例](/screenshot/menu-icons-annotated.png)

| 字段 | 说明 |
| --- | --- |
| `icon_path` | PNG/ICO 图片路径或 TTF/OTF/TTC/OTC 字体路径，支持已挂载的 JAPK `app/...`。字体集合读取第一个字体。 |
| `icon_data` / `icon_data_size` | 内存中的 PNG/ICO 字节，调用期间同步复制，最大 8 MiB。 |
| `icon_codepoint` | 图标字体中的 Unicode 码位（如 `0xE749`）。省略 `icon_path` 时使用默认图标字体（Windows 为 Segoe MDL2 Assets，码位表见[图标列表](https://learn.microsoft.com/zh-cn/windows/apps/design/iconography/segoe-ui-symbol-font)）。如需 Segoe Fluent Icons，可通过 `icon_path` 指定字体文件或设置环境变量 `JADEVIEW_MENU_ICON_FONT`。 |

:::warning{title="图标优先级与校验"}
非零的 `icon_codepoint` 优先于位图图标，此时 `icon_path` 指定字体文件；`icon_codepoint == 0` 时，`icon_data` 优先于 `icon_path`。若指定字体中不存在该字形，菜单调用返回 `0`，错误码为 `JADE_INVALID_ARGUMENT`。
:::

## 事件

弹出菜单与窗口菜单栏共用同一组事件，来源 ID 为所属 `window_id`（无主弹窗为 `0`），订阅方式见[事件类型](/docs/v3api/messaging/event-types)：

| 事件 | 触发时机 | 数据 |
| --- | --- | --- |
| `menu-command` | 用户点击了非禁用的菜单项 | `{"item_id":"..."}` |
| `menu-error` | 弹出菜单创建或显示失败 | `{"message":"..."}` |

## 相关页面

- [网页右键菜单](/docs/v3api/menu/context-menu-api)：配置浏览器内置动作（复制、粘贴、检查元素等）与自定义混合模板。
- [窗口菜单栏](/docs/v3api/window/window-menu)：给标准标题栏窗口绑定顶部菜单栏。
- [托盘菜单](/docs/v3api/menu/tray-menu)：结合系统托盘右键事件弹出菜单。
