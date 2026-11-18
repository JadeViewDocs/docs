---
title: 菜单 API
order: 0
group:
  title: 菜单
  order: 3.5
---

# 菜单

Windows 和 Linux 使用同一套菜单定义，分为两种用法：

- **弹出菜单**：右键菜单、托盘菜单等独立浮层，使用 `jade_menu_popup`。
- **窗口菜单栏**：显示在标题栏下方，使用 `jade_set_application_menu` 或 `jade_window_set_menu`。

菜单项由 `JadeMenuItemDesc` 描述。调用时菜单项和字符串会被复制，返回后可以立即释放。

普通有边框窗口未设置自定义菜单时，默认显示“编辑 / 视图 / 窗口 / 帮助”菜单；“关闭窗口”位于“窗口”菜单，“关于”位于“帮助”菜单。关于对话框显示官网 `https://jade.run` 和发行仓库 `https://github.com/JadeViewDocs/JadeView`。

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
| `id` | 菜单内唯一的非空 ID，用于 `parent_id` 和事件回传。 |
| `parent_id` | 父项 ID；根项填 `NULL` 或空串。 |
| `label` | 显示文本，UTF-8；分隔线可以为 `NULL`。 |
| `accelerator` | 快捷键提示文本，例如 `"Ctrl+O"`。只负责显示，不会注册快捷键。 |
| `kind` | `0` 普通项、`1` 子菜单、`2` 分隔线、`3` 复选项、`4` 单选项。 |
| `flags` | 第 0 位表示禁用，第 1 位表示已选中（复选/单选）。 |
| `icon` | 可选的 `JadeMenuIconDesc`；全零表示无图标。 |

约束：

- 子菜单的 `id` 作为子项的 `parent_id`，父项必须是 `kind=1` 的子菜单。
- 一个菜单最多 512 项，最多三级子菜单。
- 除分隔线外，`label` 不能为空。

## 菜单项图标

`JadeMenuItemDesc` 末尾的 `icon` 字段直接描述图标。

| 字段 | 说明 |
|---|---|
| `icon_path` | PNG/ICO 文件路径，UTF-8；已挂载的 JAPK `app/...` 路径可直接使用。没有 `icon_data` 且 `icon_codepoint` 为 `0` 时使用。 |
| `icon_data` | PNG/ICO 二进制数据指针。调用期间同步复制，返回后可释放。 |
| `icon_data_size` | `icon_data` 的字节数；有 `icon_data` 时必须大于 `0`，最大 8 MiB。 |
| `icon_codepoint` | Segoe Fluent Icons 的 Unicode codepoint，可在[图标列表](https://learn.microsoft.com/zh-cn/windows/apps/design/iconography/segoe-fluent-icons-font)查询。非 `0` 时优先于图片数据。 |

优先级为 `icon_codepoint` > `icon_data` > `icon_path`。三者都为空表示无图标。`icon_path` 支持 JAPK 挂载路径（如 `app/icons/open.png`）；JAPK 尚未挂载时请改用 `icon_data`。

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

JadeMenuPosition position = { 24, 48 };
jade_menu_popup(window_id, items, 4, &position);
```

窗口菜单栏使用同一份 `items`：

```c
jade_set_application_menu(items, 4);
jade_window_set_menu(window_id, items, 4);
```

- ICO 多尺寸文件优先选择不超过 64px 的最大帧（64 → 48 → 32 → 16）；PNG/ICO 会做高质量缩小并生成 mipmap，避免 16 DIP 菜单槽位出现锯齿。
- Windows 使用系统 Segoe Fluent Icons，Windows 10 回退 Segoe MDL2 Assets；Linux 默认没有该字体，可用 `JADEVIEW_MENU_ICON_FONT` 指定兼容字体。
- 图标无效、数据超过 8 MiB 或图片无法解码时，菜单调用返回 `0`，`jade_last_error_code()` 为 `JADE_INVALID_ARGUMENT`。

Python SDK 仍在模板项里设置 `icon_path` / `icon_data` / `icon_codepoint`：

```python
from pathlib import Path
from jadeview_next import Menu

menu = Menu.build_from_template(runtime, [
    {"id": "print", "label": "打印", "icon_codepoint": 0xE749},
    {"id": "open", "label": "打开", "icon_path": "C:/icons/open.png"},
    {"id": "save", "label": "保存", "icon_data": Path("save.ico").read_bytes()},
])
```

## 弹出菜单（`jade_menu_popup`）

```c
int32_t jade_menu_popup(uint32_t window_id, const JadeMenuItemDesc* items,
                        uint32_t item_count, const JadeMenuPosition* position);
```

- `window_id` 是所属窗口。传 `0` 表示无主窗口。
- `position` 是 `JadeMenuPosition { int32_t x, y; }`。传 `NULL` 时使用当前鼠标位置。有窗口时，`x`/`y` 是窗口客户区的逻辑像素；无窗口时，Windows 使用物理屏幕坐标，Linux X11 使用桌面坐标。
- Wayland 下弹出菜单需要窗口锚点，请传入有效的 `window_id`。
- 返回 `1` 表示请求已入队，返回 `0` 表示被拒绝。失败原因通过 `jade_last_error_code()` / `jade_last_error_message()` 查询，后者返回的字符串用 `jade_text_free` 释放。

用户点击自定义菜单项后，通过 `menu-command` 事件收到 `{"item_id":"..."}`。先在启动阶段注册一次回调：

```c
#include <string.h>
#include "JadeView.h"

static const char* JADEVIEW_CALL on_menu_command(uint32_t source_id, const char* data) {
    (void)source_id; /* 所属窗口 ID；无主弹窗为 0 */

    /* data 形如 {"item_id":"quit"}，实际项目请使用 JSON 解析 */
    if (strstr(data, "\"quit\"")) {
        /* 执行退出逻辑 */
    }
    return NULL;
}

void register_menu_events(void) {
    jade_on("menu-command", on_menu_command); /* 启动时调用一次 */
}

void show_edit_menu(uint32_t window_id) {
    JadeMenuItemDesc items[] = {
        { "open",     NULL,       "打开...",   "Ctrl+O", 0, 0 },
        { "recent",   NULL,       "最近打开",  NULL,     1, 0 },
        { "recent-a", "recent",   "a.txt",     NULL,     0, 0 },
        { "sep-1",    NULL,       NULL,        NULL,     2, 0 },
        { "wrap",     NULL,       "自动换行",  NULL,     3, 2 },
        { "quit",     NULL,       "退出",      NULL,     0, 0 },
    };
    JadeMenuPosition position = { 24, 48 };

    if (!jade_menu_popup(window_id, items, 6, &position)) {
        /* 已拒绝：查看 jade_last_error_code()/jade_last_error_message() */
    }
}
```

## 窗口菜单栏

```c
int32_t jade_set_application_menu(const JadeMenuItemDesc* items, uint32_t item_count);
int32_t jade_window_set_menu(uint32_t window_id, const JadeMenuItemDesc* items,
                             uint32_t item_count);
```

设置优先级从高到低：

| 设置 | 作用范围 |
|---|---|
| `jade_window_set_menu` | 仅指定窗口，优先级最高。 |
| `jade_set_application_menu` | 所有没有单独菜单的普通窗口。 |
| 未设置自定义菜单 | 普通窗口显示内置默认菜单。 |

- 自定义菜单栏的**顶层项必须都是子菜单**（`kind=1`）。
- `item_count=0` 隐藏菜单栏：`jade_window_set_menu` 只隐藏指定窗口，`jade_set_application_menu` 隐藏所有普通窗口的默认菜单。
- 内置默认菜单由库直接执行动作，不派发 `menu-command`；设置自定义菜单后，选中项通过 `menu-command` 交给宿主处理。
- 菜单栏全屏时自动隐藏。无边框窗口不会自动挂载默认/应用菜单栏；需要时用 `jade_window_set_menu` 单独设置。

```c
void set_main_menu(void) {
    JadeMenuItemDesc bar[] = {
        { "file",      NULL,   "文件",     NULL,   1, 0 },
        { "file-new",  "file", "新建",     "Ctrl+N", 0, 0 },
        { "file-quit", "file", "退出",     NULL,   0, 0 },
        { "view",      NULL,   "视图",     NULL,   1, 0 },
        { "view-wrap", "view", "自动换行", NULL,   3, 2 },
    };

    if (!jade_set_application_menu(bar, 5)) {
        /* 设置失败 */
    }
}
```

## 事件

| 事件 | 触发时机 | 数据 |
|---|---|---|
| `menu-command` | 选择了自定义菜单项 | `{"item_id":"..."}` |
| `menu-error` | 已受理的弹出菜单无法显示 | `{"message":"..."}` |

两个事件的来源 ID 都是所属窗口 ID；无主弹窗为 `0`。`menu-error` 只用于异步显示失败，参数错误会在调用时直接返回 `0`。事件注册方式见 [事件类型](/docs/v3api/event-types)。

## 网页右键菜单

默认菜单自动镜像当前上下文；需要自定义时，使用 `jade_webview_set_context_menu` 模板，按 `role` / `native_name` 执行原生动作，普通项通过 `context-menu-click` 回传。完整说明、角色表、示例和与 v2 的差异见 [网页右键菜单](/docs/v3api/context-menu-api)。
