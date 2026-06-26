---
title: System Tray
order: 2
group:
  title: Native UI
  order: 4
---

# System Tray

**Purpose**: Place a **tray icon** in the bottom-right corner of the taskbar, with support for hover tooltips and a right-click menu. When the user clicks a menu item or clicks the icon, the main process receives a **`tray-menu-command`** or **`tray-event`** via `jade_on` (see [Event Types](/en-US/docs/api/event-types)).

The entire process **allows only one tray**; calling `tray_create` again simply returns the same `tray_id`.

---

## Tray Menu Item Structure (`TrayMenuItemDesc`)

**Purpose**: Describes **a single menu row** (a normal item, submenu, separator, etc.). Many rows are assembled into a tree and passed to `tray_set_menu_items` to set up the entire right-click menu at once.

```c
typedef struct TrayMenuItemDesc {
  int32_t item_type;
  const char *key;
  const char *label;
  const char *parent_key;
  int32_t disabled;
  int32_t dangerous;
} TrayMenuItemDesc;
```

| Field | Meaning |
|------|------|
| `item_type` | `0` normal item, `1` submenu, `2` separator, `3` group. |
| `key` | **Business primary key**, unique across the whole table; the code uses it to tell which item was clicked (separators also need a unique key). |
| `label` | The text the user sees. |
| `parent_key` | Which submenu it hangs under: empty means top level; set it to the `key` of some row, and that row must be a submenu/group. |
| `disabled` | Non-zero means grayed out and not clickable. |
| `dangerous` | When non-zero, the event JSON carries a danger flag (e.g., red-highlighted styling decided by the system/library). |

At most **512** rows, with nesting no deeper than **32** levels.

---

## Create Tray (`tray_create`)

**Purpose**: **Creates** the tray icon (if one already exists, returns the existing id).

```c
uint32_t tray_create(void);
```

A return value greater than 0 is the `tray_id`, which all subsequent tray APIs must include.

---

## Destroy Tray (`tray_destroy`)

**Purpose**: **Removes** the tray icon and clears the menu state.

```c
int32_t tray_destroy(uint32_t tray_id);
```

`tray_id` must match the current tray, otherwise it returns `0`.

---

## Set Tray Visibility (`tray_set_visible`)

**Purpose**: **Shows or hides** the small icon in the tray (it is not destroyed, just made invisible).

```c
int32_t tray_set_visible(uint32_t tray_id, int32_t visible);
```

Non-`0` shows it, `0` hides it.

---

## Set Tray Tooltip (`tray_set_tooltip`)

**Purpose**: A **one-line tooltip** shown when the mouse hovers over the tray icon.

```c
int32_t tray_set_tooltip(uint32_t tray_id, const char* tooltip_utf8);
```

The pointer must not be `NULL`.

---

## Set Tray Icon from File (`tray_set_icon_from_file`)

**Purpose**: Loads the tray icon from an **image file such as .ico**.

```c
int32_t tray_set_icon_from_file(uint32_t tray_id, const char* icon_path_utf8);
```

---

## Set Tray Icon from Binary Data (`set_tray_icon_from_data`)

:::warning
Supported since v2.2.
:::

Supports passing binary data (such as the byte content of an ICO/PNG file) as the tray icon, without writing to a temporary file.

```c
int32_t set_tray_icon_from_data(uint32_t tray_id, const uint8_t* icon_data, uint32_t data_len);
```

- **Parameters**:
  - `tray_id` `uint32_t` - Tray icon ID
  - `icon_data` `const uint8_t*` - Pointer to the icon binary data
  - `data_len` `uint32_t` - Data length (bytes)
- **Return value**: `1` = success, `0` = failure

---

## Set Tray Menu (`tray_set_menu_items`)

**Purpose**: **Replaces the entire** right-click menu contents. Passing 0 rows clears the menu.

```c
int32_t tray_set_menu_items(
  uint32_t tray_id,
  const TrayMenuItemDesc* items,
  uint32_t item_count
);
```

The library copies all strings; if validation fails it returns `0`.

---

## Relationship with the Main Window

Closing the main window does **not** automatically remove the tray; whether the process exits along with the last window is up to you to decide in `window-closing` / `window-all-closed`.
