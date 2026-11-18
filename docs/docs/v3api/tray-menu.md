---
title: 托盘菜单
order: 3
group:
  title: 菜单
  order: 3.5
---

# 托盘菜单

托盘图标通过系统托盘 API 创建；**托盘菜单不是单独创建的对象**，而是在 `tray-event` 里用 `Menu.popup()` / `jade_menu_popup` 弹出。托盘图标本身的 API 见 [系统托盘](/docs/v3api/tray-api)。

## 快速开始

### 创建托盘

```c
uint32_t tray = tray_create();
tray_set_icon_from_file(tray, "app/tray.ico");
tray_set_tooltip(tray, "JadeView");
```

`tray_create` 返回进程内唯一的 `tray_id`；重复调用只会返回同一个 id。`app/tray.ico` 可以是已挂载的 JAPK 路径；JAPK 尚未挂载时改用 `tray_set_icon_from_data` / `set_tray_icon_from_data` 传 PNG/ICO 字节。

### 监听托盘事件

```c
static const char* JADEVIEW_CALL on_tray_event(uint32_t source, const char* data) {
    /* data 形如 {"tray_id":1,"event":"right-click","x":1200,"y":760,...} */
    if (strstr(data, "\"right-click\"")) {
        JadeMenuItemDesc items[] = {
            { "open", NULL, "打开主窗口", NULL, 0, 0, { 0 } },
            { "sep",  NULL, NULL,         NULL, 2, 0, { 0 } },
            { "about", NULL, "关于",      NULL, 0, 0, { 0 } },
            { "quit", NULL, "退出",       NULL, 0, 0, { 0 } },
        };
        jade_menu_popup(0, items, 4, NULL); /* 0 = 无主窗口，NULL = 鼠标位置 */
    }
    return NULL;
}

jade_on("tray-event", on_tray_event);
```

- `jade_menu_popup` 的 `window_id` 传 `0` 表示无主窗口；托盘菜单通常这样用，位置默认跟随鼠标。
- 也可以把事件里的 `x` / `y` 填进 `JadeMenuPosition`，传 `window_id=0`，使用桌面坐标。
- 菜单项支持子菜单、分隔线、复选/单选、图标，定义见 [菜单 API](/docs/v3api/menu-api)。

### 处理菜单点击

```c
static const char* JADEVIEW_CALL on_menu_command(uint32_t source, const char* data) {
    /* data 形如 {"item_id":"open"} */
    if (strstr(data, "\"open\"")) {
        /* 显示主窗口 */
    } else if (strstr(data, "\"quit\"")) {
        /* 退出应用 */
    }
    return NULL;
}

jade_on("menu-command", on_menu_command);
```

## 托盘事件

`tray-event` 的 `event_data` 是 JSON：

```json
{
  "tray_id": 1,
  "event": "right-click",
  "x": 1200,
  "y": 760,
  "timestamp": 1760000000000
}
```

| 字段 | 说明 |
|---|---|
| `tray_id` | 托盘 ID |
| `event` | 事件名，见下表 |
| `x` / `y` | 屏幕坐标 |
| `timestamp` | 本地毫秒时间戳 |

| event | 触发 |
|---|---|
| `left-click` | 左键单击 |
| `right-click` | 右键单击（Windows 通知区域可能发 `WM_CONTEXTMENU`，JadeView 已统一为 `right-click`） |
| `middle-click` | 中键单击 |
| `double-click-left` | 左键双击 |
| `double-click-right` | 右键双击 |
| `double-click-middle` | 中键双击 |
| `enter` | 鼠标进入托盘图标 |
| `leave` | 鼠标离开托盘图标 |

常见组合：

- 左键单击：显示并聚焦主窗口。
- 右键单击：弹出托盘菜单。
- 左键双击：执行默认动作，例如打开主窗口。
- 中键单击：执行次要动作，例如刷新。

## Python 示例

Python SDK 目前没有封装托盘函数，直接调用运行时导出的 C API；菜单使用 SDK 的 `Menu`：

```python
import ctypes as C
import json
from jadeview_next import Menu

lib = runtime.lib

lib.tray_create.restype = C.c_uint32
tray_id = lib.tray_create()

lib.tray_set_tooltip.argtypes = [C.c_uint32, C.c_char_p]
lib.tray_set_icon_from_file.argtypes = [C.c_uint32, C.c_char_p]
lib.tray_set_tooltip(tray_id, "JadeView".encode())
lib.tray_set_icon_from_file(tray_id, b"C:/icons/tray.ico")

tray_cb_type = C.WINFUNCTYPE(C.c_void_p, C.c_uint32, C.c_char_p)

@tray_cb_type
def on_tray_event(source, data):
    event = json.loads(C.string_at(data))
    if event.get("event") == "right-click":
        Menu.build_from_template(runtime, [
            {"id": "open", "label": "打开主窗口"},
            {"type": "separator"},
            {"id": "about", "label": "关于"},
            {"id": "quit", "label": "退出"},
        ]).popup()  # window=None -> 无主窗口，位置跟随鼠标
    return None

lib.jade_on(b"tray-event", on_tray_event)
```

菜单点击仍通过 `menu-command` 返回 `item_id`：

```python
@tray_cb_type
def on_menu_command(source, data):
    item = json.loads(C.string_at(data)).get("item_id")
    if item == "open":
        ...
    elif item == "quit":
        ...
    return None

lib.jade_on(b"menu-command", on_menu_command)
```

## 图标与生命周期

- 托盘图标支持 ICO/PNG，文件或二进制数据都可以；Windows 建议使用多尺寸 ICO，Linux 使用 PNG。
- 整个进程只允许一个托盘；`tray_create` 重复调用返回同一个 id。
- 关闭主窗口不会自动删除托盘；是否随最后一个窗口退出进程，由宿主在 `window-all-closed` / `window-closing` 里决定。
- 托盘菜单是普通弹出菜单，点击外部会关闭；菜单项点击后菜单关闭并派发 `menu-command`。
- 退出前调用 `tray_destroy(tray_id)`，避免托盘图标残留。

## 平台

| 平台 | 说明 |
|---|---|
| Windows | 托盘位于任务栏通知区域；右键事件统一为 `right-click`；ICO 多尺寸效果最好。 |
| Linux | 使用桌面环境的 StatusNotifierItem 协议；托盘位置和交互由桌面环境决定，部分环境需要安装扩展才能显示。Wayland 下弹出菜单可能需要窗口锚点，必要时传入有效窗口 id。 |
