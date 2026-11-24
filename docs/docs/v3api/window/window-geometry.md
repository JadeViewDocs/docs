---
title: 位置与尺寸
order: 3
group:
  title: 窗口
  order: 1
---

# 位置与尺寸

## 位置、尺寸与标题

### 设置窗口标题

改变窗口标题栏上显示的文字（和 HTML 里的 `<title>` 可以不同）。

```c
int32_t set_window_title(uint32_t window_id, const char* title);
```

- `window_id` `uint32_t` - 目标 Window ID
- `title` `string` - 新的窗口标题

---

### 设置窗口大小

按逻辑像素改变窗口宽度和高度。Windows 按可见窗体计算。

```c
int32_t set_window_size(uint32_t window_id, int32_t width, int32_t height);
```

- `window_id` `uint32_t` - 目标 Window ID
- `width` / `height` `int32_t` - 新的宽高（逻辑像素）

---

### 设置窗口位置

按像素改变窗口在屏幕上的位置。

```c
int32_t set_window_position(uint32_t window_id, int32_t x, int32_t y);
```

- `window_id` `uint32_t` - 目标 Window ID
- `x` / `y` `int32_t` - 新的坐标

---

### 获取窗口位置和尺寸（`get_window_bounds`）

Windows 返回窗体外框的位置和可见窗体的宽高，单位为物理像素。

```c
int32_t get_window_bounds(uint32_t window_id, char* buffer, int32_t buffer_size);
```

- `window_id` `uint32_t` - 目标 Window ID
- `buffer` `char*` - 输出缓冲区
- `buffer_size` `int32_t` - 缓冲区大小
- **返回值**：`1` 成功，`buffer` 写入 JSON `{"x":0,"y":0,"width":800,"height":600}`；`0` 失败

---
