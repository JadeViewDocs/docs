---
title: Menu API
order: 0
group:
  title: Menus
  order: 3.5
---

# Menus

This page covers the `JadeMenuItemDesc` structure, icon rules, and the popup menus used for context and tray overlays (`jade_menu_popup`). Window menu bars below the title bar have their own page: [Window Menu Bar](/en-US/docs/v3api/window/window-menu).

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
| `id` | Non-empty unique ID, used by `parent_id` and events. |
| `parent_id` | Parent ID; `NULL` for a root item. |
| `label` | UTF-8 text; `NULL` for a separator. |
| `accelerator` | Display-only hint such as `"Ctrl+O"`. |
| `kind` | `0` command, `1` submenu, `2` separator, `3` checkbox, `4` radio. |
| `flags` | Bit 0 disabled, bit 1 checked. |
| `icon` | Optional icon; all-zero means none. |

A submenu's `id` is its children's `parent_id`. At most 512 items and three submenu levels. Every item except a separator needs a `label`.

## Icons

| Field | Description |
|---|---|
| `icon_path` | PNG/ICO or TTF/OTF/TTC/OTC path. Mounted JAPK `app/...` paths work. Font collections use their first face. |
| `icon_data` / `icon_data_size` | PNG/ICO bytes, copied during the call, up to 8 MiB. |
| `icon_codepoint` | Unicode codepoint in the specified font, such as `0xE749`. Without a font path, the default icon font on Windows is Segoe MDL2 Assets — see the [MDL2 icon list](https://learn.microsoft.com/en-us/windows/apps/design/iconography/segoe-ui-symbol-font). For Segoe Fluent Icons, pass a Fluent font file via `icon_path` or set the `JADEVIEW_MENU_ICON_FONT` environment variable. |

A nonzero `icon_codepoint` takes precedence over images. A font path selects the glyph source. With a zero codepoint, image bytes take precedence over an image path. If the specified font lacks the glyph, the menu call returns `0` with `JADE_INVALID_ARGUMENT`.

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

jade_menu_popup(window_id, items, 4, NULL); /* NULL = pointer position */
```

Python:

```python
menu = Menu.build_from_template(runtime, [
    {"id": "print", "label": "Print", "icon_codepoint": 0xE749},
    {"id": "open", "label": "Open", "icon_path": "C:/icons/open.png"},
])
```

## Popup menus

```c
int32_t jade_menu_popup(uint32_t window_id, const JadeMenuItemDesc* items,
                        uint32_t item_count, const JadeMenuPosition* position);
```

- `window_id=0` creates an ownerless popup.
- `position=NULL` uses the current pointer; with a window, coordinates are client logical pixels.
- Wayland requires a valid `window_id`.
- Returns `1` when queued. On failure, use `jade_last_error_code()` / `jade_last_error_message()`.

Selecting a custom item emits `menu-command` with `{"item_id":"..."}`. See [Event Types](/en-US/docs/v3api/messaging/event-types).

## Events

Popup menus and the window menu bar share the same events:

| Event | Fires when | Payload |
|---|---|---|
| `menu-command` | A custom menu item is selected | `{"item_id":"..."}` |
| `menu-error` | A popup cannot be shown | `{"message":"..."}` |

The source ID is the owner Window ID, or `0` for an ownerless popup. For window menu bar setup, see [Window Menu Bar](/en-US/docs/v3api/window/window-menu).

## Page context menu

Page right-click menus use a separate template; see [Page Context Menu](/en-US/docs/v3api/menu/context-menu-api).
