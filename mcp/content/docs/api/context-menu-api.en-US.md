---
title: Context Menu
order: 3
group:
  title: Native UI
  order: 4
---

# Context Menu

:::warning
Supported since v2.2.
:::

Leverage the WebView2 native context menu API to build an Electron-like custom context menu system.

## Events

### Context Menu Event (`context-menu`)

Automatically triggered on right-click (requires `allow_right_click=1`); `event_data` is JSON.

**`window_id`**: The ID of the window that triggered the event.

**`event_data`**: JSON containing detailed information about the right-click target:

```json
{
  "x": 100, "y": 200,
  "kind": "page",
  "is_editable": false, "is_main_frame": true,
  "page_url": "https://example.com", "frame_url": "",
  "has_link": true, "link_url": "https://example.com/page2", "link_text": "Click here",
  "has_source": false, "source_url": "",
  "has_selection": true, "selection_text": "Selected text",
  "default_menu_names": [
    {"name": "back", "label": "Back(&B)", "kind": "command"},
    {"name": "forward", "label": "Forward(&F)", "kind": "command"},
    {"name": "other", "label": "", "kind": "separator"}
  ]
}
```

| Field | Description |
|------|------|
| `x` / `y` | Screen coordinates |
| `kind` | Target type: `page` / `image` / `selected_text` / `audio` / `video` |
| `is_editable` | Whether it is an editable area |
| `is_main_frame` | Whether it is in the main frame |
| `page_url` / `frame_url` | Page / frame URL |
| `has_link` / `link_url` / `link_text` | Link information |
| `has_source` / `source_url` | Resource source information (image / audio / video) |
| `has_selection` / `selection_text` | Selected text information |
| `default_menu_names` *(new in 2.2)* | List of WebView2 default menu items, each containing `name`, `label`, and `kind` (see [Menu Item Types and Native Menu Items](/en-US/docs/api/context-menu-items)) |

:::info{title=Platform Field Differences}
The example above shows the full set of fields for **Windows (WebView2)**. The **Linux (WebKitGTK)** `context-menu` payload does **not** include the four fields `is_main_frame`, `frame_url`, `link_text`, and `selection_text`; the remaining fields are the same.
:::

### Menu Item Clicked Event (`menu-item-clicked`)

Triggered when a custom menu item is clicked; `event_data` is the `item_id` (string) passed in at creation time.

**`window_id`**: The ID of the window that triggered the event.

**`event_data`**: The `item_id` string passed in when the menu item was created.

---

## C API

### Create a Menu Item (`jade_menu_item_create`)

```c
uint32_t jade_menu_item_create(const char* label, int kind, uint32_t parent_menu_id, int item_id);
```

**Parameters:**

- `label` `string` - Menu item text (when `kind=5`, fill in the Name of the WebView2 default menu item, e.g. `"copy"`)
- `kind` `int` - Menu item type (see table below)
- `parent_menu_id` `uint32_t` - Parent menu ID (`0` = top-level menu, `>0` = add to the specified submenu)
- `item_id` `int` - User-defined ID, returned via the `menu-item-clicked` event on click (ignored when `kind=5`)

**Return value:**

- `> 0` - Menu item ID (`menu_id`)
- `0` - Failure

### kind Parameter Description

For menu item type descriptions and the list of WebView2 native Names for `kind=5` default menu items (categorized by right-click context), see [Menu Item Types and Native Menu Items](/en-US/docs/api/context-menu-items).

### Set Menu Item Enabled State (`jade_menu_item_set_enabled`)

```c
int jade_menu_item_set_enabled(uint32_t menu_id, int enabled);
```

**Parameters:**

- `menu_id` `uint32_t` - Menu item ID
- `enabled` `int` - `0` = disabled, `1` = enabled

**Return value:** `1` = success, `0` = failure

### Set Menu Item Checked State (`jade_menu_item_set_checked`)

```c
int jade_menu_item_set_checked(uint32_t menu_id, int checked);
```

**Parameters:**

- `menu_id` `uint32_t` - Menu item ID
- `checked` `int` - `0` = unchecked, `1` = checked

**Return value:** `1` = success, `0` = failure

### Set Context Menu Items (`jade_set_context_menu_items`)

Call this within the `context-menu` event callback to set the menu items to display.

```c
int jade_set_context_menu_items(uint32_t window_id, const uint32_t* menu_ids, int count);
```

**Parameters:**

- `window_id` `uint32_t` - Window ID
- `menu_ids` `uint32_t*` - Array of menu item IDs
- `count` `int` - Array length

**Return value:** `1` = success, `0` = failure

### Destroy a Menu Item (`jade_menu_item_destroy`)

```c
int jade_menu_item_destroy(uint32_t menu_id);
```

**Parameters:**

- `menu_id` `uint32_t` - Menu item ID

**Return value:** `1` = success, `0` = failure

---

## Usage Flow

1. Register a `context-menu` event listener: `jade_on("context-menu", callback)`
2. In the callback, determine the right-click target based on fields such as `kind`
3. Call `jade_menu_item_create` to create menu items
4. Call `jade_set_context_menu_items` to set the menu to display
5. WebView2 automatically pops up the native menu
6. After the user clicks, the `menu-item-clicked` event returns the `item_id`

:::info
If you do not register a `context-menu` event listener, right-clicking will display the WebView2 default menu.
:::
