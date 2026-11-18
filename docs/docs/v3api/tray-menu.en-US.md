---
title: Tray Menu
order: 3
group:
  title: Menus
  order: 3.5
---

# Tray Menu

The tray icon is created with the system tray API; a **tray menu is not a separate object** — show it from a `tray-event` with `Menu.popup()` / `jade_menu_popup`. See [System Tray](/en-US/docs/v3api/tray-api) for the icon APIs.

## Quick start

### Create the tray

```c
uint32_t tray = tray_create();
tray_set_icon_from_file(tray, "app/tray.ico");
tray_set_tooltip(tray, "JadeView");
```

`tray_create` returns the process-wide tray id; calling it again returns the same id. `app/tray.ico` may be a mounted JAPK path; before the JAPK mount is available, pass PNG/ICO bytes with `tray_set_icon_from_data` / `set_tray_icon_from_data`.

### Listen for tray events

```c
static const char* JADEVIEW_CALL on_tray_event(uint32_t source, const char* data) {
    /* data is like {"tray_id":1,"event":"right-click","x":1200,"y":760,...} */
    if (strstr(data, "\"right-click\"")) {
        JadeMenuItemDesc items[] = {
            { "open", NULL, "Open window", NULL, 0, 0, { 0 } },
            { "sep",  NULL, NULL,          NULL, 2, 0, { 0 } },
            { "about", NULL, "About",      NULL, 0, 0, { 0 } },
            { "quit", NULL, "Quit",        NULL, 0, 0, { 0 } },
        };
        jade_menu_popup(0, items, 4, NULL); /* 0 = no owner, NULL = pointer */
    }
    return NULL;
}

jade_on("tray-event", on_tray_event);
```

- `window_id=0` opens an ownerless popup; tray menus normally use this, positioned at the pointer.
- You may also pass the event's `x`/`y` as a `JadeMenuPosition` with `window_id=0` to use desktop coordinates.
- Items support submenus, separators, checkboxes/radios, and icons; see [Menu API](/en-US/docs/v3api/menu-api).

### Handle menu selections

```c
static const char* JADEVIEW_CALL on_menu_command(uint32_t source, const char* data) {
    /* data is like {"item_id":"open"} */
    if (strstr(data, "\"open\"")) {
        /* show the main window */
    } else if (strstr(data, "\"quit\"")) {
        /* quit the app */
    }
    return NULL;
}

jade_on("menu-command", on_menu_command);
```

## Tray events

`tray-event` data is JSON:

```json
{
  "tray_id": 1,
  "event": "right-click",
  "x": 1200,
  "y": 760,
  "timestamp": 1760000000000
}
```

| Field | Description |
|---|---|
| `tray_id` | Tray id |
| `event` | Event name; see below |
| `x` / `y` | Screen coordinates |
| `timestamp` | Local millisecond timestamp |

| event | Trigger |
|---|---|
| `left-click` | Left click |
| `right-click` | Right click (Windows may send `WM_CONTEXTMENU`; JadeView normalizes it to `right-click`) |
| `middle-click` | Middle click |
| `double-click-left` | Left double-click |
| `double-click-right` | Right double-click |
| `double-click-middle` | Middle double-click |
| `enter` | Pointer enters the icon |
| `leave` | Pointer leaves the icon |

Common combinations:

- Left click: show and focus the main window.
- Right click: open the tray menu.
- Left double-click: default action, e.g. open the main window.
- Middle click: secondary action, e.g. refresh.

## Python example

The Python SDK does not wrap the tray functions yet; call the exported C API directly and use the SDK `Menu`:

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
            {"id": "open", "label": "Open window"},
            {"type": "separator"},
            {"id": "about", "label": "About"},
            {"id": "quit", "label": "Quit"},
        ]).popup()  # window=None -> ownerless, follows the pointer
    return None

lib.jade_on(b"tray-event", on_tray_event)
```

Selections arrive through `menu-command` as `item_id`:

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

## Icon and lifecycle

- Tray icons support ICO/PNG files and in-memory bytes; multi-size ICO is best on Windows, PNG on Linux.
- One tray per process; calling `tray_create` again returns the same id.
- Closing the main window does not remove the tray; decide in `window-all-closed` / `window-closing` whether the process should exit.
- A tray menu is a normal popup: clicking outside closes it; selecting an item closes it and emits `menu-command`.
- Call `tray_destroy(tray_id)` before exit so the icon does not linger.

## Platforms

| Platform | Notes |
|---|---|
| Windows | The tray lives in the taskbar notification area; right clicks are normalized to `right-click`; multi-size ICO looks best. |
| Linux | Uses the desktop's StatusNotifierItem protocol; position and interaction are decided by the desktop, and some environments need an extension. On Wayland, a popup may need a window anchor; pass a valid window id when necessary. |
