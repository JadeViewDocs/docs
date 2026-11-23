---
title: System Tray
order: 2
group:
  title: Native UI
  order: 4
---

# System Tray

Creates a tray icon with a tooltip. Icon clicks emit `tray-event`. See [Tray Menu](/en-US/docs/v3api/menu/tray-menu) for the full tray-menu guide.

The entire process **allows only one tray**; calling `tray_create` again simply returns the same `tray_id`.

| Platform | Notes |
|---|---|
| Windows | The tray lives in the taskbar notification area; multi-size ICO is recommended. |
| Linux | Uses the desktop environment's StatusNotifierItem protocol; position and interaction are decided by the desktop, and some environments need an extension before the icon appears. |

## Quick start

```c
uint32_t tray = tray_create();
tray_set_icon_from_file(tray, "app/tray.ico");
tray_set_tooltip(tray, "JadeView");
```

`app/tray.ico` may be a mounted JAPK `app/...` path; before the mount is available, pass PNG/ICO bytes with `set_tray_icon_from_data`.

---

## Create Tray (`tray_create`)

```c
uint32_t tray_create(void);
```

**Parameters**: none.

**Return value**:

- `> 0`: the tray ID (`tray_id`), which all subsequent tray APIs must include.
- `0`: allocation failed.

**Notes**:

- One tray per process; when one already exists, the same id is returned.
- Creation runs asynchronously on the GUI thread; if system tray creation fails, it is logged and the registration is cleared.

---

## Destroy Tray (`tray_destroy`)

```c
int32_t tray_destroy(uint32_t tray_id);
```

**Parameters**:

| Parameter | Type | Description |
|---|---|---|
| `tray_id` | `uint32_t` | The current tray ID returned by `tray_create`. |

**Return value**: `1` = request queued; `0` = `tray_id` is `0`, not the current tray, or could not be queued.

**Notes**: Removes the tray icon; a later `tray_create` allocates a new id.

---

## Set Tray Visibility (`tray_set_visible`)

```c
int32_t tray_set_visible(uint32_t tray_id, int32_t visible);
```

**Parameters**:

| Parameter | Type | Description |
|---|---|---|
| `tray_id` | `uint32_t` | The tray ID returned by `tray_create`. |
| `visible` | `int32_t` | `0` hides the tray icon, non-`0` shows it. |

**Return value**: `1` = request queued; `0` = invalid parameter or could not be queued.

**Notes**: Changes visibility only; the tray is not destroyed. While hidden, there is no icon to click.

---

## Set Tray Tooltip (`tray_set_tooltip`)

```c
int32_t tray_set_tooltip(uint32_t tray_id, const char* tooltip_utf8);
```

**Parameters**:

| Parameter | Type | Description |
|---|---|---|
| `tray_id` | `uint32_t` | The tray ID returned by `tray_create`. |
| `tooltip_utf8` | `const char*` | UTF-8 tooltip text; must not be `NULL`; a short single line is recommended. |

**Return value**: `1` = request queued; `0` = invalid parameter or could not be queued.

**Notes**: Shown when the pointer hovers over the icon; the text is copied during the call.

---

## Set Tray Icon from File (`tray_set_icon_from_file`)

```c
int32_t tray_set_icon_from_file(uint32_t tray_id, const char* icon_path_utf8);
```

**Parameters**:

| Parameter | Type | Description |
|---|---|---|
| `tray_id` | `uint32_t` | The tray ID returned by `tray_create`. |
| `icon_path_utf8` | `const char*` | PNG/ICO file path, UTF-8; a mounted JAPK `app/...` path is supported. |

**Return value**: `1` = request queued; `0` = invalid parameter or could not be queued.

**Notes**:

- An absolute path works directly; relative paths are resolved against the process directory, working directory, and executable directory.
- Decoding and the tray update run asynchronously on the GUI thread; failures are logged and do not emit an event.
- Before the JAPK mount exists, `app/...` is unavailable; use `set_tray_icon_from_data` instead.

---

## Set Tray Icon from Binary Data (`set_tray_icon_from_data`)

```c
int32_t set_tray_icon_from_data(uint32_t tray_id, const uint8_t* icon_data, uint32_t data_len);
```

**Parameters**:

| Parameter | Type | Description |
|---|---|---|
| `tray_id` | `uint32_t` | The tray ID returned by `tray_create`. |
| `icon_data` | `const uint8_t*` | PNG/ICO bytes; must not be `NULL`. |
| `data_len` | `uint32_t` | Length of `icon_data` in bytes; must be greater than `0`. |

**Return value**: `1` = request queued; `0` = invalid parameter or could not be queued.

**Notes**:

- The bytes are copied during the call and may be released immediately afterwards.
- Useful before the JAPK mount is available, or when the icon comes from memory or the network.
- Decoding and the tray update run asynchronously; failures are logged.

---

## Events

Tray events are delivered as `tray-event`, with `tray_id`, `event`, screen `x` / `y`, and a timestamp. See [Tray Menu](/en-US/docs/v3api/menu/tray-menu) for the event names and common combinations.

---

## Relationship with the Main Window

Closing the main window does **not** automatically remove the tray; whether the process exits along with the last window is up to you to decide in `window-closing` / `window-all-closed`. Call `tray_destroy(tray_id)` before exiting so the icon does not linger.
