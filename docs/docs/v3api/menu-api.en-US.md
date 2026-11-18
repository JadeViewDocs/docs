---
title: Menu API
order: 0
group:
  title: Menus
  order: 3.5
---

# Menus

Windows and Linux share the same menu definition. Menus are used in two ways:

- **Popup menus** for context menus and tray menus, through `jade_menu_popup`.
- **Window menu bars** below the title bar, through `jade_set_application_menu` or `jade_window_set_menu`.

Items are described by `JadeMenuItemDesc`. The library copies the item array and strings during the call, so the caller may release them immediately.

A normal decorated window without a custom menu shows the built-in Edit / View / Window / Help menus. Close Window is under Window, and About is under Help. The About dialog shows the website `https://jade.run` and the release repository `https://github.com/JadeViewDocs/JadeView`.

## Capability check

Menu bars and popup menus are drawn by the built-in ImGui backend. That backend is a Cargo feature, `experimental-imgui-menu`: release packages enable it by default, while a custom build can leave it out, in which case its code is not linked into the DLL. Hosts can query the running library with `get_menu_capabilities()` and call menu APIs only when the matching bit is set:

```c
uint32_t caps = get_menu_capabilities();

if (caps & JADE_MENU_CAPABILITY_POPUP) {
    /* jade_menu_popup is available */
}
if (caps & JADE_MENU_CAPABILITY_BAR) {
    /* window menu bars are available */
}
```

| Macro | Value | Meaning |
|---|---:|---|
| `JADE_MENU_CAPABILITY_POPUP` | `1` | Independent popup menus |
| `JADE_MENU_CAPABILITY_BAR` | `2` | Window menu bars |
| `JADE_MENU_CAPABILITY_CONTEXT_MENU` | `32` | Page context-menu templates |

When no menu backend is compiled in, the capability query returns `0`; menu operations return `0` and set `jade_last_error_code()` to `JADE_PLATFORM_ERROR`.

## Menu items

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

| Field | Description |
|---|---|
| `id` | Non-empty ID, unique within the menu. Used by `parent_id` and returned in events. |
| `parent_id` | Parent item ID. Use `NULL` or an empty string for a root item. |
| `label` | Display text in UTF-8. A separator may use `NULL`. |
| `accelerator` | Shortcut hint such as `"Ctrl+O"`. Display only; it does not register a hotkey. |
| `kind` | `0` command, `1` submenu, `2` separator, `3` checkbox, `4` radio. |
| `flags` | Bit 0 disables the item; bit 1 marks a checkbox or radio item as checked. |
| `icon` | Optional `JadeMenuIconDesc`; all-zero means no icon. |

Rules:

- A submenu's `id` is the `parent_id` of its children. Parents must have `kind=1`.
- A menu supports at most 512 items and three submenu levels.
- Every item except a separator needs a non-empty `label`.

## Menu item icons

The `icon` field at the end of `JadeMenuItemDesc` describes the icon directly.

| Field | Description |
|---|---|
| `icon_path` | UTF-8 path to a PNG/ICO file; a mounted JAPK `app/...` path works directly. Used when `icon_data` is NULL and `icon_codepoint` is `0`. |
| `icon_data` | PNG/ICO bytes. Copied during the call; release it after the call returns. |
| `icon_data_size` | Byte length of `icon_data`; must be greater than `0` when set, up to 8 MiB. |
| `icon_codepoint` | Segoe Fluent Icons Unicode codepoint; see the [icon list](https://learn.microsoft.com/zh-cn/windows/apps/design/iconography/segoe-fluent-icons-font). Nonzero takes precedence over image data. |

Priority is `icon_codepoint` > `icon_data` > `icon_path`. Leave all three empty for no icon. `icon_path` accepts mounted JAPK paths such as `app/icons/open.png`; use `icon_data` before the JAPK mount is available.

```c
JadeMenuItemDesc items[] = {
    { "file",  NULL,   "File", NULL,    1, 0, { 0 } },
    { "open",  "file", "Open", "Ctrl+O", 0, 0,
      { NULL, open_png, sizeof(open_png), 0 } },
    { "print", "file", "Print", "Ctrl+P", 0, 0,
      { NULL, NULL, 0, 0xE749 } },
    { "quit",  "file", "Quit", NULL,    0, 0,
      { "C:/icons/quit.ico", NULL, 0, 0 } },
};

JadeMenuPosition position = { 24, 48 };
jade_menu_popup(window_id, items, 4, &position);
```

A window menu bar takes the same `items` array:

```c
jade_set_application_menu(items, 4);
jade_window_set_menu(window_id, items, 4);
```

- Multi-size ICO files prefer the largest frame up to 64px (64 → 48 → 32 → 16); PNG/ICO are downscaled with a high-quality filter and mipmaps to avoid aliasing in the 16 DIP menu slot.
- Windows uses system Segoe Fluent Icons and falls back to Segoe MDL2 Assets on Windows 10. Linux has neither by default; set `JADEVIEW_MENU_ICON_FONT` to a compatible font.
- Invalid icons, data above 8 MiB, or undecodable images make the menu call return `0` with `JADE_INVALID_ARGUMENT`.

Capabilities:

```c
uint32_t caps = get_menu_capabilities();
if (caps & JADE_MENU_CAPABILITY_ICON_FILE) { /* PNG/ICO */ }
if (caps & JADE_MENU_CAPABILITY_ICON_GLYPH) { /* Segoe glyph */ }
if (caps & JADE_MENU_CAPABILITY_ICON_DATA) { /* in-memory PNG/ICO */ }
```

The Python SDK still sets `icon_path` / `icon_data` / `icon_codepoint` inside each template item:

```python
from pathlib import Path
from jadeview_next import Menu

menu = Menu.build_from_template(runtime, [
    {"id": "print", "label": "Print", "icon_codepoint": 0xE749},
    {"id": "open", "label": "Open", "icon_path": "C:/icons/open.png"},
    {"id": "save", "label": "Save", "icon_data": Path("save.ico").read_bytes()},
])
```

## Popup menus (`jade_menu_popup`)

```c
int32_t jade_menu_popup(uint32_t window_id, const JadeMenuItemDesc* items,
                        uint32_t item_count, const JadeMenuPosition* position);
```

- `window_id` is the owner window, or `0` for an ownerless popup.
- `position` is `JadeMenuPosition { int32_t x, y; }`. It may be `NULL` to use the current pointer. With a window, `x`/`y` are logical pixels in the client area. Without a window, Windows uses physical screen coordinates and Linux X11 uses desktop coordinates.
- Wayland needs a window anchor for popups; pass a valid `window_id`.
- Returns `1` when the request is queued and `0` when it is rejected. Inspect `jade_last_error_code()` / `jade_last_error_message()` on failure; release the latter with `jade_text_free`.

Selecting a custom item emits `menu-command` with `{"item_id":"..."}`. Register the callback once at startup:

```c
#include <string.h>
#include "JadeView.h"

static const char* JADEVIEW_CALL on_menu_command(uint32_t source_id, const char* data) {
    (void)source_id; /* owner Window ID; 0 for an ownerless popup */

    /* data looks like {"item_id":"quit"}; use a JSON parser in real code */
    if (strstr(data, "\"quit\"")) {
        /* quit */
    }
    return NULL;
}

void register_menu_events(void) {
    jade_on("menu-command", on_menu_command); /* call once at startup */
}

void show_edit_menu(uint32_t window_id) {
    JadeMenuItemDesc items[] = {
        { "open",     NULL,     "Open...",  "Ctrl+O", 0, 0 },
        { "recent",   NULL,     "Recent",   NULL,     1, 0 },
        { "recent-a", "recent", "a.txt",    NULL,     0, 0 },
        { "sep-1",    NULL,     NULL,       NULL,     2, 0 },
        { "wrap",     NULL,     "Wrap",     NULL,     3, 2 },
        { "quit",     NULL,     "Quit",     NULL,     0, 0 },
    };
    JadeMenuPosition position = { 24, 48 };

    if (!jade_menu_popup(window_id, items, 6, &position)) {
        /* rejected; see jade_last_error_code()/jade_last_error_message() */
    }
}
```

## Window menu bars

```c
int32_t jade_set_application_menu(const JadeMenuItemDesc* items, uint32_t item_count);
int32_t jade_window_set_menu(uint32_t window_id, const JadeMenuItemDesc* items,
                             uint32_t item_count);
```

Priority, highest first:

| Call | Scope |
|---|---|
| `jade_window_set_menu` | The specified window only. |
| `jade_set_application_menu` | Every normal window without its own menu. |
| No custom menu | The built-in default menu on normal windows. |

- Every root item of a menu bar must be a submenu (`kind=1`).
- `item_count=0` hides the bar. `jade_window_set_menu` hides it for one window; `jade_set_application_menu` hides the default for all normal windows.
- Built-in default items perform their native action directly and do not emit `menu-command`. Once a custom menu is installed, selections are delivered through `menu-command`.
- The bar hides automatically in fullscreen. Borderless windows do not receive the default or application bar automatically; set one with `jade_window_set_menu` if needed.

```c
void set_main_menu(void) {
    JadeMenuItemDesc bar[] = {
        { "file",      NULL,   "File",      NULL,     1, 0 },
        { "file-new",  "file", "New",       "Ctrl+N", 0, 0 },
        { "file-quit", "file", "Quit",      NULL,     0, 0 },
        { "view",      NULL,   "View",      NULL,     1, 0 },
        { "view-wrap", "view", "Word wrap", NULL,     3, 2 },
    };

    if (!jade_set_application_menu(bar, 5)) {
        /* failed */
    }
}
```

## Events

| Event | Fires when | Payload |
|---|---|---|
| `menu-command` | A custom menu item is selected | `{"item_id":"..."}` |
| `menu-error` | An accepted popup cannot be shown | `{"message":"..."}` |

The source ID is the owner Window ID, or `0` for an ownerless popup. `menu-error` reports asynchronous presentation failures; invalid arguments fail immediately with `0`. See [Event Types](/en-US/docs/v3api/event-types) for registration.

## Page context menu

The default menu mirrors the current native context; to customize it, use the `jade_webview_set_context_menu` template. `role`/`native_name` items execute native actions; custom items report `context-menu-click`. See [Page Context Menu](/en-US/docs/v3api/context-menu-api) for the full description, role table, examples, and v2 differences.

Capability bit `JADE_MENU_CAPABILITY_CONTEXT_MENU` (`32`) reports template support.
