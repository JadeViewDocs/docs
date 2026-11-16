---
title: Menus
order: 3
group:
  title: Native UI
  order: 4
---

# Menus

Windows and Linux share the same menu definition. Menus are used in two ways:

- **Popup menus** for context menus and tray menus, through `jade_menu_popup`.
- **Window menu bars** below the title bar, through `jade_set_application_menu` or `jade_window_set_menu`.

Items are described by `JadeMenuItemDesc`. The library copies the item array and strings during the call, so the caller may release them immediately.

## Capability check

Release packages enable `experimental-imgui-menu` by default. Custom builds may disable it; check first:

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

When no menu backend is compiled in, the capability query returns `0`; menu operations return `0` and set `jade_last_error_code()` to `JADE_PLATFORM_ERROR`.

## Menu items

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

| Field | Description |
|---|---|
| `id` | Non-empty ID, unique within the menu. Used by `parent_id` and returned in events. |
| `parent_id` | Parent item ID. Use `NULL` or an empty string for a root item. |
| `label` | Display text in UTF-8. A separator may use `NULL`. |
| `accelerator` | Shortcut hint such as `"Ctrl+O"`. Display only; it does not register a hotkey. |
| `kind` | `0` command, `1` submenu, `2` separator, `3` checkbox, `4` radio. |
| `flags` | Bit 0 disables the item; bit 1 marks a checkbox or radio item as checked. |

Rules:

- A submenu's `id` is the `parent_id` of its children. Parents must have `kind=1`.
- A menu supports at most 512 items and three submenu levels.
- Every item except a separator needs a non-empty `label`.

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

## Custom context menus

On Windows and Linux, the browser's default page context actions are drawn by JadeView; WebView settings still control whether the menu may open. For per-element control, see [Window Interaction](/en-US/docs/v3api/window-styling).

To customize it, listen for the DOM `contextmenu` event, call `preventDefault()`, and ask the host through IPC to call `jade_menu_popup`. Pass `NULL` to use the pointer, and handle selections through `menu-command`.
