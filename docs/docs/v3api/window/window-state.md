---
title: 窗口状态与约束
order: 6
group:
  title: 窗口
  order: 1
---

# 窗口状态与约束

## 窗口状态

### 最小化窗口

```c
int32_t minimize_window(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID

---

### 切换最大化状态

```c
int32_t toggle_maximize_window(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID

---

### 查询是否最大化

```c
int32_t is_window_maximized(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID
- **返回值**：`1` 是最大化状态，`0` 不是

---

### 设置全屏

进入或退出全屏（铺满显示器，不是单纯最大化）。请求会异步生效，也可监听 `window-fullscreen` 事件。

```c
int32_t set_window_fullscreen(uint32_t window_id, int32_t fullscreen);
```

- `window_id` `uint32_t` - 目标 Window ID
- `fullscreen` `int32_t` - 非 `0` 进入全屏，`0` 退出全屏

---

### 查询窗口是否最小化（`is_window_minimized`）

```c
int32_t is_window_minimized(uint32_t window_id);
```

- **参数**：`window_id` `uint32_t`
- **返回值**：`1` 已最小化，`0` 否

---

### 查询窗口是否可见（`is_window_visible`）

```c
int32_t is_window_visible(uint32_t window_id);
```

- **参数**：`window_id` `uint32_t`
- **返回值**：`1` 可见，`0` 不可见

---

### 查询窗口是否聚焦（`is_window_focused`）

```c
int32_t is_window_focused(uint32_t window_id);
```

- **参数**：`window_id` `uint32_t`
- **返回值**：`1` 已聚焦，`0` 否

---

### 查询窗口是否全屏（`is_window_fullscreen`）

```c
int32_t is_window_fullscreen(uint32_t window_id);
```

- **参数**：`window_id` `uint32_t`
- **返回值**：`1` 全屏，`0` 否

---

## 窗口约束

Windows 的最小、最大尺寸按可见窗体的逻辑像素计算。传 `0` 可取消对应方向的限制。

### 设置窗口最小尺寸（`set_window_min_size`）

```c
int32_t set_window_min_size(uint32_t window_id, int32_t width, int32_t height);
```

- **参数**：`window_id`、`width`（最小宽度）、`height`（最小高度）
- **返回值**：`1` 成功，`0` 失败

---

### 设置窗口最大尺寸（`set_window_max_size`）

```c
int32_t set_window_max_size(uint32_t window_id, int32_t width, int32_t height);
```

- **参数**：`window_id`、`width`（最大宽度）、`height`（最大高度）
- **返回值**：`1` 成功，`0` 失败

---

### 设置窗口是否可调整大小（`set_window_resizable`）

Windows 上，普通窗口切换此设置时会保留屏幕上的可见位置和宽高。

```c
int32_t set_window_resizable(uint32_t window_id, int32_t resizable);
```

- **参数**：`window_id`、`resizable`（`1` 可调整，`0` 不可）
- **返回值**：`1` 成功，`0` 失败

---

### 启用或禁用窗口

禁用窗口时用户点不了上面控件（像模态对话框背后的灰窗）。

```c
int32_t set_window_enabled(uint32_t window_id, int32_t enabled);
```

- `window_id` `uint32_t` - 目标 Window ID
- `enabled` `int32_t` - 非 `0` 启用，`0` 禁用

---
