---
title: 菜单 API
order: 0
group:
  title: 菜单
  order: 3.5
---

# 菜单

同一套 `JadeMenuItemDesc` 支持两种菜单：

- **弹出菜单**：`jade_menu_popup`，用于右键、托盘等浮层。
- **窗口菜单栏**：`jade_set_application_menu` / `jade_window_set_menu`，显示在标题栏下方。

普通窗口未设置自定义菜单时，显示默认的“编辑 / 视图 / 窗口 / 帮助”。

## 菜单项

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
|---|---|
| `id` | 非空唯一 ID，用于 `parent_id` 和事件回传。 |
| `parent_id` | 父项 ID；根项填 `NULL`。 |
| `label` | UTF-8 文本；分隔线填 `NULL`。 |
| `accelerator` | 快捷键提示，如 `"Ctrl+O"`；只显示，不注册快捷键。 |
| `kind` | `0` 普通项、`1` 子菜单、`2` 分隔线、`3` 复选、`4` 单选。 |
| `flags` | bit0 禁用，bit1 选中。 |
| `icon` | 可选图标；全零表示无图标。 |

子菜单的 `id` 是子项的 `parent_id`；最多 512 项、三级子菜单。除分隔线外，`label` 不能为空。

## 图标

| 字段 | 说明 |
|---|---|
| `icon_path` | PNG/ICO 或 TTF/OTF/TTC/OTC 路径，支持已挂载的 JAPK `app/...`。字体集合读取第一个字体。 |
| `icon_data` / `icon_data_size` | PNG/ICO 字节，调用期间同步复制，最大 8 MiB。 |
| `icon_codepoint` | 指定字体中的 Unicode 编码，如 `0xE749`。省略字体路径时使用默认图标字体。Windows 的 Segoe Fluent Icons 编码见[图标列表](https://learn.microsoft.com/zh-cn/windows/apps/design/iconography/segoe-fluent-icons-font)。 |

非零的 `icon_codepoint` 优先于图片。此时字体路径指定字形来源。编码为零时，图片数据优先于图片路径。指定字体缺少字形时，菜单调用返回 `0`，错误码为 `JADE_INVALID_ARGUMENT`。

```c
JadeMenuItemDesc items[] = {
    { "file",  NULL,   "文件", NULL,    1, 0, { 0 } },
    { "open",  "file", "打开", "Ctrl+O", 0, 0,
      { NULL, open_png, sizeof(open_png), 0 } },
    { "print", "file", "打印", "Ctrl+P", 0, 0,
      { NULL, NULL, 0, 0xE749 } },
    { "quit",  "file", "退出", NULL,    0, 0,
      { "C:/icons/quit.ico", NULL, 0, 0 } },
};

jade_menu_popup(window_id, items, 4, NULL); /* NULL = 鼠标位置 */
```

Python：

```python
menu = Menu.build_from_template(runtime, [
    {"id": "print", "label": "打印", "icon_codepoint": 0xE749},
    {"id": "open", "label": "打开", "icon_path": "C:/icons/open.png"},
])
```

## 弹出菜单

```c
int32_t jade_menu_popup(uint32_t window_id, const JadeMenuItemDesc* items,
                        uint32_t item_count, const JadeMenuPosition* position);
```

- `window_id=0` 表示无主窗口。
- `position` 传 `NULL` 时使用当前鼠标位置；有窗口时坐标是客户区逻辑像素。
- Wayland 下必须传有效的 `window_id`。
- 返回 `1` 表示请求已入队；失败用 `jade_last_error_code()` / `jade_last_error_message()` 查询。

选择自定义项后派发 `menu-command`，数据为 `{"item_id":"..."}`。事件注册见 [事件类型](/docs/v3api/messaging/event-types)。

## 窗口菜单栏

```c
int32_t jade_set_application_menu(const JadeMenuItemDesc* items, uint32_t item_count);
int32_t jade_window_set_menu(uint32_t window_id, const JadeMenuItemDesc* items,
                             uint32_t item_count);
```

| 设置 | 作用范围 |
|---|---|
| `jade_window_set_menu` | 指定窗口，优先级最高。 |
| `jade_set_application_menu` | 所有没有单独菜单的普通窗口。 |
| 未设置 | 普通窗口显示内置默认菜单。 |

- 顶层项必须是子菜单（`kind=1`）。
- `item_count=0` 隐藏菜单栏。
- 菜单栏全屏时自动隐藏；无边框窗口不会自动挂载。

```c
JadeMenuItemDesc bar[] = {
    { "file",      NULL,   "文件", NULL,   1, 0, { 0 } },
    { "file-new",  "file", "新建", "Ctrl+N", 0, 0, { 0 } },
    { "file-quit", "file", "退出", NULL,   0, 0, { 0 } },
};

jade_set_application_menu(bar, 3);
```

## 事件

| 事件 | 触发时机 | 数据 |
|---|---|---|
| `menu-command` | 选择了自定义菜单项 | `{"item_id":"..."}` |
| `menu-error` | 弹出菜单无法显示 | `{"message":"..."}` |

来源 ID 是所属窗口 ID；无主弹窗为 `0`。

## 网页右键菜单

网页右键菜单使用独立模板，详见 [网页右键菜单](/docs/v3api/menu/context-menu-api)。
