---
title: Visibility and Focus
order: 4
group:
  title: Windows
  order: 1
---

# Visibility and Focus

## Visibility and Focus

### Show or Hide the Window

Shows or hides the window (visibility changes other than minimizing).

```c
int32_t set_window_visible(uint32_t window_id, int32_t visible);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `visible` `int32_t` - Non-`0` shows, `0` hides

***

### Give the Window Focus

Gives the window keyboard focus.

```c
int32_t set_window_focus(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

***

### Set the Window Always on Top

Whether to keep the window on top so it isn't covered by other normal windows.

```c
int32_t set_window_always_on_top(uint32_t window_id, int32_t always_on_top);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `always_on_top` `int32_t` - Non-`0` pins it on top, `0` unpins it

***

### Set Ignore Cursor Events (`set_window_ignore_cursor_events`)

Sets whether the window ignores mouse events (mouse pass-through), suitable for floating window / overlay scenarios.

```c
int32_t set_window_ignore_cursor_events(uint32_t window_id, int32_t ignore);
```

- **Parameters**: `window_id`, `ignore` (`1` = ignore mouse events / pass-through, `0` = normal)
- **Return value**: `1` = success, `0` = failure

***
