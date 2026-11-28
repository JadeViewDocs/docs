---
title: Page Context Menu
order: 1
group:
  title: Menus
  order: 3.5
---

# Page Context Menu

The page context menu handles right-click actions inside a WebView. By default JadeView shows the browser's native menu for the clicked target; to customize items, bind a per-WebView template with `jade_webview_set_context_menu`.

![Annotated page context menu and cascading submenu](/screenshot/menu-context-annotated.en.png)

From the numbered callouts above:

1. **10pt continuous-curve border**: Shares the same rendering engine as `jade_menu_popup`, with live acrylic blur and an immediate 1px anti-aliased border.
2. **Built-in `role` actions and separators**: Items with a `role` execute directly in the browser or runtime (e.g. copy image link, inspect element) without firing custom click events.
3. **6pt concentric hover highlight**: 4 DIP inset matching the outer squircle curvature; items with submenus expand automatically on hover.
4. **Cascading submenus**: Nested under a submenu item via `parent_id` (up to 3 levels, 512 items total).
5. **Shortcut hint column**: Right-aligned `accelerator` text (such as `Ctrl, Ctrl`), display only.

## Default menu

Without a custom template, JadeView shows context-appropriate items automatically. Right-click availability is controlled by `allow_right_click` in window options:

| Target | Typical default items |
| --- | --- |
| Page background | Back, Forward, Reload, Save as, Print, Inspect |
| Selected text | Copy, Print, Inspect |
| Editable input | Undo, Redo, Cut, Copy, Paste, Paste as plain text, Select all, Inspect |
| Link | Open link in new window, Save link as, Copy link, Inspect |
| Image | Save image as, Copy image, Copy image link, Magnify image, Inspect |
| Audio / Video | Save media as, Copy link, Inspect |

:::tip{title="High-DPI positioning"}
On Windows high-DPI displays, WebView2's `Location` coordinates are scaled by the owner window's DPI automatically so right-clicks inside inputs, scrolled containers, or images align accurately with the cursor.
:::

## Custom template

```c
typedef struct JadeContextMenuItemDesc {
    uint32_t struct_size;
    const char* id;
    const char* parent_id;
    const char* label;
    const char* accelerator;
    const char* role;         /* unified action name */
    uint32_t kind;            /* 0 normal, 1 submenu, 2 separator, 3 checkbox, 4 radio */
    uint32_t flags;           /* bit0 disabled, bit1 checked */
    JadeMenuIconDesc icon;
} JadeContextMenuItemDesc;

int32_t jade_webview_set_context_menu(
    uint32_t webview_id,
    const JadeContextMenuItemDesc* items,
    uint32_t item_count
);

int32_t jade_webview_clear_context_menu(uint32_t webview_id);
```

Templates are stored per `webview_id`; passing `item_count = 0` or calling `jade_webview_clear_context_menu` restores the default menu.

### Item types and constraints

| `kind` | Type | Description |
| ---: | --- | --- |
| `0` | Normal | Runs `role`, or emits a custom click event when `role` is omitted. |
| `1` | Submenu | Container item; children reference its `id` via `parent_id`. |
| `2` | Separator | Non-interactive divider line. |
| `3` | Checkbox | `flags` bit1 (`2`) marks it checked. |
| `4` | Radio | Mutually exclusive within the group; `flags` bit1 (`2`) marks it checked. |

- `struct_size` must equal `sizeof(JadeContextMenuItemDesc)`.
- `id` may be omitted for `role` items and separators, but is required and unique for custom items and submenus.
- Every item except separators needs at least `label` or `role`; omitting `label` uses the localized native label for `role`.
- Icon descriptors follow the same rules as [Menu API icon rules](/en-US/docs/v3api/menu/menu-api#icon-rules). See [Context Menu Items and Roles](/en-US/docs/v3api/menu/context-menu-items) for the full list.

## Common built-in roles

`role` matching ignores case and separators (`saveAs`, `save-as`, and `saveas` are equivalent):

| Category | Common `role` values |
| --- | --- |
| Edit | `undo`, `redo`, `cut`, `copy`, `paste`, `pasteAndMatchStyle`, `delete`, `selectAll` |
| Navigation | `back`, `forward`, `reload`, `forceReload` |
| Page & DevTools | `print`, `saveAs`, `viewSource`, `inspectElement`, `toggleDevTools` |
| Zoom | `zoomIn`, `zoomOut`, `resetZoom` |
| Window | `togglefullscreen`, `minimize`, `close`, `quit` |

## Example

The example below mixes built-in actions (`undo`, `redo`, `copy`, `saveImageAs`) with a custom `"copy-link"` item:

```c
JadeContextMenuItemDesc items[] = {
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "undo", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "redo", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, NULL,   2, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "copy", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "saveImageAs", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), "copy-link", NULL, "Copy Link", NULL, NULL, 0, 0, { 0 } },
};

if (!jade_webview_set_context_menu(webview_id, items, 6)) {
    /* Query jade_last_error_code() / jade_last_error_message() on failure */
}
```

Python:

```python
view.set_context_menu([
    {"role": "undo"},
    {"role": "redo"},
    {"kind": "separator"},
    {"role": "cut"},
    {"role": "copy"},
    {"role": "paste"},
    {"kind": "separator"},
    {"role": "saveImageAs"},
    {"role": "copyImage"},
    {"kind": "separator"},
    {"role": "reload"},
    {"role": "toggleDevTools"},
    {"kind": "separator"},
    {"id": "copy-link", "label": "Copy Link"},
])

# Restore default menu
view.clear_context_menu()
```

## Events

Custom items without a `role` emit `context-menu-click` when selected:

```json
{"window_id":1,"webview_id":2,"item_id":"copy-link"}
```

Items with a `role` are handled directly by the browser or runtime and do not emit this event.

## Fully custom menus

If you do not need browser built-in actions, listen for DOM `contextmenu`, call `e.preventDefault()`, and invoke [`jade_menu_popup`](/en-US/docs/v3api/menu/menu-api#show-a-popup-menu-jade_menu_popup) over IPC:

```c
JadeMenuItemDesc items[] = {
    { "copy",  NULL, "Copy",  NULL, 0, 0, { 0 } },
    { "sep",   NULL, NULL,    NULL, 2, 0, { 0 } },
    { "about", NULL, "About", NULL, 0, 0, { 0 } },
};
jade_menu_popup(window_id, items, 3, NULL); /* NULL = current cursor position */
```
