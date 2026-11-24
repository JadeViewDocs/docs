---
title: Position and Size
order: 3
group:
  title: Windows
  order: 1
---

# Position and Size

## Position, Size, and Title

### Set the Window Title

Changes the text shown in the window's title bar (which can differ from the `<title>` in the HTML).

```c
int32_t set_window_title(uint32_t window_id, const char* title);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `title` `string` - The new window title

***

### Set the Window Size

Changes the window's width and height in logical pixels. On Windows these dimensions measure the visible window.

```c
int32_t set_window_size(uint32_t window_id, int32_t width, int32_t height);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `width` `int32_t` - The new width (logical pixels)
- `height` `int32_t` - The new height (logical pixels)

***

### Set the Window Position

Changes the window's position on the screen in pixels.

```c
int32_t set_window_position(uint32_t window_id, int32_t x, int32_t y);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `x` `int32_t` - The new X coordinate
- `y` `int32_t` - The new Y coordinate

***

### Get Window Position and Size (`get_window_bounds`)

On Windows, the position describes the outer origin and the dimensions measure the visible window, both in physical pixels.

```c
int32_t get_window_bounds(uint32_t window_id, char* buffer, int32_t buffer_size);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `buffer` `char*` - Output buffer
- `buffer_size` `int` - Buffer size

**Return value:** `1` = success, with the buffer written as JSON `{"x":0,"y":0,"width":800,"height":600}`; `0` = failure

***
