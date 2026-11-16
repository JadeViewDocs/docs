---
title: 菜单
order: 3
group:
  title: 原生 UI
  order: 4
---

# 菜单

Windows 和 Linux 使用同一套菜单定义，分为两种用法：

- **弹出菜单**：右键菜单、托盘菜单等独立浮层，使用 `jade_menu_popup`。
- **窗口菜单栏**：显示在标题栏下方，使用 `jade_set_application_menu` 或 `jade_window_set_menu`。

菜单项由 `JadeMenuItemDesc` 描述。调用时菜单项和字符串会被复制，返回后可以立即释放。

## 能力检查

发行包默认启用 `experimental-imgui-menu`。自定义构建可能关闭该 feature，使用前先查询：

```c
uint32_t caps = get_menu_capabilities();

if (caps & JADE_MENU_CAPABILITY_POPUP) {
    /* 可以调用 jade_menu_popup */
}
if (caps & JADE_MENU_CAPABILITY_BAR) {
    /* 可以设置窗口菜单栏 */
}
```

| 宏 | 值 | 含义 |
|---|---:|---|
| `JADE_MENU_CAPABILITY_POPUP` | `1` | 支持独立弹出菜单 |
| `JADE_MENU_CAPABILITY_BAR` | `2` | 支持窗口菜单栏 |

没有菜单后端时，能力查询返回 `0`；菜单操作函数返回 `0` 并把 `jade_last_error_code()` 设为 `JADE_PLATFORM_ERROR`。

## 菜单项

```c
typedef struct JadeMenuItemDesc {
    const char* id;
    const char* parent_id;
    const char* label;
    const char* accelerator;
    uint32_t kind;
    uint32_t flags;
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

约束：

- 子菜单的 `id` 作为子项的 `parent_id`，父项必须是 `kind=1` 的子菜单。
- 一个菜单最多 512 项，最多三级子菜单。
- 除分隔线外，`label` 不能为空。

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

## 自定义右键菜单

Windows 和 Linux 的网页默认右键菜单由 JadeView 绘制；是否允许打开仍由 WebView 配置控制。按元素放行/禁用见 [窗口交互控制](/docs/v3api/window-styling)。

需要自定义时，在页面监听 DOM `contextmenu`，调用 `preventDefault()`，再通过 IPC 通知宿主调用 `jade_menu_popup`。位置传 `NULL` 使用当前鼠标位置，点击结果仍通过 `menu-command` 回传。
