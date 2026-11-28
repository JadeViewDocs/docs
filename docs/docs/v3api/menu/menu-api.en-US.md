---
title: Menu API
order: 0
group:
  title: Menus
  order: 3.5
---

# Menus

JadeView provides native-style popup menus (`jade_menu_popup`) for dropdown lists, custom context menus, and tray overlays. Window menu bars attached below the title bar have their own page: [Window Menu Bar](/en-US/docs/v3api/window/window-menu).

![JadeView popup menu example (light mode dropdown with selection check and 10pt continuous-curve acrylic surface)](/screenshot/menu-overview.jpg)

## Choose a menu type

| Type | API | Use |
| --- | --- | --- |
| Popup menu | `jade_menu_popup` | Dropdown selectors, tray menus, or fully custom menus triggered from JS `contextmenu`. |
| Window menu bar | [`jade_window_set_menu`](/en-US/docs/v3api/window/window-menu) | Top-level application menu bar attached below the default title bar (Windows / Linux). |
| Page context menu | [`jade_webview_set_context_menu`](/en-US/docs/v3api/menu/context-menu-api) | Template-based WebView right-click menu that preserves browser native actions (copy, inspect, save image). |

## Anatomy and visual design

Popup menus use real-time translucent Acrylic on Windows 11 and solid rounded panels on Windows 10 and Linux. All platforms share **10pt continuous curvature corners (Squircle)**, a crisp 1px anti-aliased border, and concentric 6pt hover highlights.

![Popup menu real-photo anatomy](/screenshot/menu-overview-annotated.en.png)

From the numbered callouts above:

1. **10pt continuous-curve border**: Outer shell uses a 10 DIP squircle outline with a 1px anti-aliased border.
2. **Check and icon column (`kind = 3 / 4`)**: Renders check/radio marks alongside optional PNG/ICO bitmaps or font glyphs. Right-aligned `accelerator` labels (such as `"Ctrl+O"`) are also supported.
3. **Acrylic translucent backdrop**: Samples underlying windows smoothly on Windows 11 while keeping menu labels legible.
4. **Work-area clamping and soft shadow**: Automatically clamps inside the work area or flips upward near screen edges, paired with a layered shadow and 6pt concentric hover highlight (see [Page Context Menu](/en-US/docs/v3api/menu/context-menu-api)).

## Show a popup menu (`jade_menu_popup`)

```c
int32_t jade_menu_popup(
    uint32_t window_id,
    const JadeMenuItemDesc* items,
    uint32_t item_count,
    const JadeMenuPosition* position
);
```

### Parameters

| Parameter | Description |
| --- | --- |
| `window_id` | Owner window ID; pass `0` for ownerless popups such as tray menus. Wayland requires a valid `window_id`. |
| `items` / `item_count` | Flat array of menu items and item count; nested submenus link via `parent_id`. |
| `position` | Popup coordinates; pass `NULL` to open at the current cursor position. |

:::tip{title="Coordinates and DPI scaling"}
When a valid `window_id` is passed, `position` uses **window client logical pixels (DIP)** and JadeView scales it by the window's current DPI before clamping to the monitor work area. When `window_id = 0`, `position` uses screen physical pixels.
:::

### Quick example

The example below builds a popup menu with radio selection, a separator, a submenu, and a font glyph icon, and shows it at the cursor:

```c
JadeMenuItemDesc items[] = {
    { "builtin", NULL, "Built-in Server", NULL, 4, 2, { 0 } },  /* kind=4 radio, flags=2 checked */
    { "aliyun",  NULL, "Aliyun",          NULL, 4, 0, { 0 } },
    { "sep1",    NULL, NULL,              NULL, 2, 0, { 0 } },  /* separator */
    { "more",    NULL, "More Settings",   NULL, 1, 0, { 0 } },  /* submenu container */
    { "print",   "more", "Print",         "Ctrl+P", 0, 0,
      { NULL, NULL, 0, 0xE749 } },                              /* font glyph icon */
};

if (!jade_menu_popup(window_id, items, 5, NULL)) {
    /* Query jade_last_error_code() / jade_last_error_message() on failure */
}
```

Python:

```python
menu = Menu.build_from_template(runtime, [
    {"id": "builtin", "label": "Built-in Server", "kind": "radio", "checked": True},
    {"id": "aliyun", "label": "Aliyun", "kind": "radio"},
    {"kind": "separator"},
    {
        "id": "more",
        "label": "More Settings",
        "submenu": [
            {"id": "print", "label": "Print", "accelerator": "Ctrl+P", "icon_codepoint": 0xE749},
            {"id": "open", "label": "Open Folder", "icon_path": "C:/icons/open.png"},
        ],
    },
])

menu.popup(window)  # Omit x / y to open at the current cursor position
```

## Item structure (`JadeMenuItemDesc`)

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
| --- | --- |
| `id` | Non-empty unique ID used for `parent_id` linking and click event payloads. |
| `parent_id` | Parent item ID, or `NULL` for top-level items. |
| `label` | UTF-8 display text; required for every kind except separators. |
| `accelerator` | Shortcut hint text (e.g. `"Ctrl+O"`); display only, does not register a hotkey. |
| `kind` | `0` normal, `1` submenu, `2` separator, `3` checkbox, `4` radio. |
| `flags` | bit0 (`1`) disabled, bit1 (`2`) checked. |
| `icon` | Optional icon descriptor; all-zero means no icon. |

Submenus use `id` as the `parent_id` of their children, up to 512 items total and 3 submenu levels.

## Icon rules

![Menu example with icons, disabled item, submenu indicator, and shortcut hint](/screenshot/menu-icons-annotated.en.png)

| Field | Description |
| --- | --- |
| `icon_path` | Path to PNG/ICO or TTF/OTF/TTC/OTC (supports mounted JAPK `app/...`). Font collections read the first font. |
| `icon_data` / `icon_data_size` | In-memory PNG/ICO bytes copied synchronously during the call, up to 8 MiB. |
| `icon_codepoint` | Unicode codepoint in the icon font (e.g. `0xE749`). Uses the default icon font when `icon_path` is omitted (Segoe MDL2 Assets on Windows; see [Segoe MDL2 icons](https://learn.microsoft.com/en-us/windows/apps/design/iconography/segoe-ui-symbol-font)). Set `icon_path` or `JADEVIEW_MENU_ICON_FONT` to use Segoe Fluent Icons. |

:::warning{title="Icon priority and validation"}
A non-zero `icon_codepoint` takes precedence over bitmap images (`icon_path` then selects the font file). When `icon_codepoint == 0`, `icon_data` takes precedence over `icon_path`. Missing glyphs fail with `0` and `JADE_INVALID_ARGUMENT`.
:::

## Events

Popup menus and window menu bars share the same events, with `window_id` as the source (`0` for ownerless popups). See [Event Types](/en-US/docs/v3api/messaging/event-types):

| Event | When | Payload |
| --- | --- | --- |
| `menu-command` | User clicks an enabled item | `{"item_id":"..."}` |
| `menu-error` | Popup fails to initialize or display | `{"message":"..."}` |

## Related

- [Page Context Menu](/en-US/docs/v3api/menu/context-menu-api): Combine browser built-in roles (copy, paste, inspect) with custom items.
- [Window Menu Bar](/en-US/docs/v3api/window/window-menu): Attach a menu bar to a standard title bar window.
- [Tray Menu](/en-US/docs/v3api/menu/tray-menu): Trigger popup menus from system tray right-click events.
