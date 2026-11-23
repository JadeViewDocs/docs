---
title: Page Context Menu
order: 1
group:
  title: Menus
  order: 3.5
---

# Page Context Menu

JadeView owns the page right-click menu on Windows and Linux. By default it shows the browser's native menu; to customize it, set a template per WebView with `jade_webview_set_context_menu`. A template can keep native print/save-as/copy actions and add custom items.

## Default menu

With no template, JadeView shows the native menu for the current context; the host registers no event:

- **Windows**: JadeView listens for WebView2's `ContextMenuRequested`, reads the native items of the current context, and draws them with ImGui. When the user picks one, the native `CommandId` is returned to WebView2, which performs the native print/save-as/copy/undo action.
- **Linux**: the WebKitGTK context menu is read, drawn by the same ImGui backend, and its native `gio::Action` runs.

Whether the menu may open is controlled by the WebView `allow_right_click` setting. The exact items depend on the WebView runtime and the right-click target:

| Target | Common native items | Platform |
|---|---|---|
| Page background | Back, forward, reload, save as, print, inspect| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Selected text | Copy, print, inspect| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Editable area | Undo, redo, cut, copy, paste, paste and match style, select all, inspect| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Link | Open link in new window, save link as, copy link, inspect| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Image | Save image as, copy image, copy image address, magnify image, inspect| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| Video / audio | Save media as, copy link, inspect| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |

Print, save-as, copy, and undo are performed by the browser and do not emit `menu-command`.

## Custom template

```c
typedef struct JadeContextMenuItemDesc {
    uint32_t struct_size;
    const char* id;
    const char* parent_id;
    const char* label;
    const char* accelerator;
    const char* role;         /* unified action name */
    uint32_t kind;            /* 0 command, 1 submenu, 2 separator, 3 checkbox, 4 radio */
    uint32_t flags;           /* bit 0 disabled, bit 1 checked */
    JadeMenuIconDesc icon;
} JadeContextMenuItemDesc;

int32_t jade_webview_set_context_menu(
    uint32_t webview_id,
    const JadeContextMenuItemDesc* items,
    uint32_t item_count);

int32_t jade_webview_clear_context_menu(uint32_t webview_id);
```

The template is stored per WebView and copied during the call. With no template the default menu is used; a template replaces it completely. `jade_webview_clear_context_menu` or `item_count=0` restores the default menu.

### Items

`kind` is the same as the regular menu:

| kind | Type | Description |
|---:|---|---|
| 0 | Command | Performs an action; without `role` it reports an event |
| 1 | Submenu | Children point to its `id` through `parent_id` |
| 2 | Separator | Not clickable |
| 3 | Checkbox | Toggles checked state; `flags` bit 1 means checked |
| 4 | Radio | Mutually exclusive in its group; `flags` bit 1 means checked |

See [Item Types and Native Actions](/en-US/docs/v3api/menu/context-menu-items) for the complete kind, unified-role, and platform-compatibility reference.

Constraints:

- `struct_size` must equal `sizeof(JadeContextMenuItemDesc)`.
- `id` may be empty for `role` rows and separators; the runtime generates an internal id. Custom items and submenus need a unique `id`.
- A custom item's `id` is returned verbatim in `context-menu-click`.
- A submenu's `id` is the `parent_id` of its children. At most 512 rows and three submenu levels.
- Except for separators, `label` and `role` must provide at least one; a role row without `label` uses the native localized text when available, otherwise the built-in role label.

Set both `icon_path` and `icon_codepoint` to use a font glyph. For example, a Python template item can use `{"id": "open", "label": "Open", "icon_path": "app/fonts/icons.ttf", "icon_codepoint": 0xE001}`. Mount the JAPK first and use a codepoint present in that font. In C, set these fields on `JadeContextMenuItemDesc.icon`. [Icon configuration](/en-US/docs/v3api/menu/menu-api)

### Native actions (`role`)

`role` uses one unified action name across platforms. The runtime maps it to the current platform's native menu item; if the current context has no such action, the row is disabled. A duplicated action never needs two platform-specific names.

Common roles:

| role | Behavior | Platform |
|---|---|---|
| `undo` `redo` `cut` `copy` `paste` `pasteAndMatchStyle` `delete` `selectAll` | Native edit action of the current context| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| `back` `forward` `reload` `forceReload` | Native navigation item; falls back to the navigation API| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| `print` `saveAs` | WebView2 / WebKitGTK print and save-as| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| `viewSource` `inspectElement` | Native inspect item; falls back to DevTools| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| `toggleDevTools` | Opens DevTools| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| `resetZoom` `zoomIn` `zoomOut` | WebView zoom (0.25–5.0)| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |
| `togglefullscreen` `minimize` `close` `quit` | Window actions| ![Windows](/platform-windows.svg) ![Linux](/platform-linux.svg) |

See [Item Types and Native Actions](/en-US/docs/v3api/menu/context-menu-items) for the full list of link, image, and media roles with platform compatibility.

Unified role names ignore case and separators (`saveAs`, `save-as`, and `saveas` are equivalent). `back` / `forward` are disabled automatically from the WebView history; edit actions are available only when the current context supports them.

Menu labels and shortcuts use the system language by default; the template's `label`/`accelerator` override them. `flags` bit 0 forces disabled; bit 1 sets the checkbox/radio state.

### Custom item event

A command item without `role` is handled by the host. Selecting it closes the menu and emits `context-menu-click`:

```json
{"window_id":1,"webview_id":2,"item_id":"copy-link"}
```

`role` items are executed by the browser or runtime and do not emit `context-menu-click`.

### Example

```c
JadeContextMenuItemDesc items[] = {
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "undo", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "redo", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, NULL, 2, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "copy", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), NULL, NULL, NULL, NULL, "saveImageAs", 0, 0, { 0 } },
    { sizeof(JadeContextMenuItemDesc), "copy-link", NULL, "Copy link", NULL, NULL, 0, 0, { 0 } },
};

if (!jade_webview_set_context_menu(webview_id, items, 6)) {
    /* rejected; inspect jade_last_error_code()/jade_last_error_message() */
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
    {"id": "copy-link", "label": "Copy link"},
])
```

Restore the default menu:

```python
view.clear_context_menu()
```

## Fully custom menu

To control every item without native actions, the page can listen for the DOM `contextmenu` event, call `preventDefault()`, and ask the host through IPC to call `jade_menu_popup`:

```c
JadeMenuItemDesc items[] = {
    { "copy", NULL, "Copy", NULL, 0, 0, { 0 } },
    { "sep",  NULL, NULL,   NULL, 2, 0, { 0 } },
    { "about", NULL, "About", NULL, 0, 0, { 0 } },
};
jade_menu_popup(window_id, items, 3, NULL); /* NULL = pointer position */
```

Selections arrive through `menu-command` as `{"item_id":"..."}`. A fully custom menu does not include the default native items; use `jade_webview_set_context_menu` when native print/save-as/copy actions are needed.
