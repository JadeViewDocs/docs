---
title: System Tray
order: 2
group:
  title: Native UI
  order: 4
---

# System Tray

Creates a tray icon with a tooltip. Icon clicks emit `tray-event`. To open a menu on right-click, see [Tray Menu](/en-US/docs/v3api/tray-menu).

The entire process **allows only one tray**; calling `tray_create` again simply returns the same `tray_id`.

:::info{title="Platform Differences"}
"Bottom-right corner of the taskbar" describes Windows. On **Linux**, the tray uses the desktop environment's StatusNotifierItem protocol: position and interaction are decided by that environment, and some require an extension before the icon appears.
:::

---

## Create Tray (`tray_create`)

**Purpose**: **Creates** the tray icon (if one already exists, returns the existing id).

```c
uint32_t tray_create(void);
```

A return value greater than 0 is the `tray_id`, which all subsequent tray APIs must include.

---

## Destroy Tray (`tray_destroy`)

**Purpose**: Removes the tray icon.

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

**Purpose**: Loads the tray icon from an **image file such as .ico**; a mounted JAPK `app/...` path works directly.

```c
int32_t tray_set_icon_from_file(uint32_t tray_id, const char* icon_path_utf8);
```

---

## Set Tray Icon from Binary Data (`set_tray_icon_from_data`)

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

## Relationship with the Main Window

Closing the main window does **not** automatically remove the tray; whether the process exits along with the last window is up to you to decide in `window-closing` / `window-all-closed`.
