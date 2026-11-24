---
title: Window State and Constraints
order: 6
group:
  title: Windows
  order: 1
---

# Window State and Constraints

## Window State

### Minimize the Window

Sends the window to the taskbar.

```c
int32_t minimize_window(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

***

### Toggle the Maximized State

Toggles between maximized and restored.

```c
int32_t toggle_maximize_window(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

***

### Query Whether Maximized

Queries whether the window is currently maximized.

```c
int32_t is_window_maximized(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

**Return value:**

- `1` - Currently maximized
- `0` - Currently not maximized

***

### Set Fullscreen

Enters or exits fullscreen (filling the monitor, not just maximizing). The request takes effect asynchronously; you can also listen for the `window-fullscreen` event.

```c
int32_t set_window_fullscreen(uint32_t window_id, int32_t fullscreen);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `fullscreen` `int32_t` - Non-`0` enters fullscreen, `0` exits fullscreen

***

### Query Whether the Window Is Minimized (`is_window_minimized`)

```c
int32_t is_window_minimized(uint32_t window_id);
```

- **Parameters**: `window_id` `uint32_t`
- **Return value**: `1` = minimized, `0` = not

***

### Query Whether the Window Is Visible (`is_window_visible`)

```c
int32_t is_window_visible(uint32_t window_id);
```

- **Parameters**: `window_id` `uint32_t`
- **Return value**: `1` = visible, `0` = not visible

***

### Query Whether the Window Is Focused (`is_window_focused`)

```c
int32_t is_window_focused(uint32_t window_id);
```

- **Parameters**: `window_id` `uint32_t`
- **Return value**: `1` = focused, `0` = not

***

### Query Whether the Window Is Fullscreen (`is_window_fullscreen`)

```c
int32_t is_window_fullscreen(uint32_t window_id);
```

- **Parameters**: `window_id` `uint32_t`
- **Return value**: `1` = fullscreen, `0` = not

***

## Window Constraints

### Set the Window Minimum Size (`set_window_min_size`)

On Windows, minimum and maximum sizes apply to the visible window in logical pixels. Pass `0` to clear a limit on that axis.

```c
int32_t set_window_min_size(uint32_t window_id, int32_t width, int32_t height);
```

- **Parameters**: `window_id`, `width` (minimum width), `height` (minimum height)
- **Return value**: `1` = success, `0` = failure

***

### Set the Window Maximum Size (`set_window_max_size`)

```c
int32_t set_window_max_size(uint32_t window_id, int32_t width, int32_t height);
```

- **Parameters**: `window_id`, `width` (maximum width), `height` (maximum height)
- **Return value**: `1` = success, `0` = failure

***

### Set Whether the Window Is Resizable (`set_window_resizable`)

On Windows, changing this setting preserves the visible position and size of a window in its normal state.

```c
int32_t set_window_resizable(uint32_t window_id, int32_t resizable);
```

- **Parameters**: `window_id`, `resizable` (`1` = resizable, `0` = not)
- **Return value**: `1` = success, `0` = failure

***

### Enable or Disable the Window

When a window is disabled, the user cannot click the controls on it (like the grayed-out window behind a modal dialog); pass non-`0` to restore it.

```c
int32_t set_window_enabled(uint32_t window_id, int32_t enabled);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `enabled` `int32_t` - Non-`0` enables, `0` disables

***
