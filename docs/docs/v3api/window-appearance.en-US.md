---
title: Window Appearance
order: 7
group:
  title: Windows
  order: 1
---

# Window Appearance

## Appearance and Style

### Set the Window Light/Dark Theme

Controls whether the window and WebView use the light theme, dark theme, or follow the system theme.

For more detailed information, see [Theme Management](/en-US/docs/v3api/theme-management).

```c
int32_t set_window_theme(uint32_t window_id, const char* theme);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `theme` `string` - Theme string; available values: `Light`, `Dark`, `System`

***

### Get the Current Window Theme

Queries the theme currently used by the window.

```c
int32_t get_window_theme(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

**Return value:**

- `1` - Dark
- `0` - Light

The `System` theme is resolved to `1` / `0` based on the current system light/dark setting; returns `0` if the window does not exist or the theme is unknown.

***

### Set the Window Backdrop Material

Sets system backdrop materials such as Mica and Acrylic on Windows 11.

For available strings, see [Theme Management](/en-US/docs/v3api/theme-management).

```c
int32_t set_window_backdrop(uint32_t window_id, const char* backdrop_type);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `backdrop_type` `string` - Backdrop material type

:::warning{title="Platform Differences"}
**Windows 11 only**. Linux (WebKitGTK) has no system material equivalent — the call is a no-op, returns `0`, and has no visual effect. If you need a translucent / solid background, use `set_window_background_color` or the window's `transparent` + `background_color` options.
:::

***

### Set the Window Background Color

Sets the window's background color (hexadecimal string).

```c
int32_t set_window_background_color(uint32_t window_id, const char* background_color_hex);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `background_color_hex` `string` - Background color hexadecimal string, e.g. `#FF0000`

***

### Request a Redraw

Notifies the system to repaint the client area (rarely needs to be called manually).

```c
int32_t request_redraw(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

***
