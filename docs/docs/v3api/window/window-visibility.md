---
title: 显隐与焦点
order: 4
group:
  title: 窗口
  order: 1
---

# 显隐与焦点

## 显隐与焦点

### 显示或隐藏窗口

```c
int32_t set_window_visible(uint32_t window_id, int32_t visible);
```

- `window_id` `uint32_t` - 目标 Window ID
- `visible` `int32_t` - 非 `0` 显示，`0` 隐藏

---

### 让窗口获得焦点

```c
int32_t set_window_focus(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID

---

### 设置窗口置顶

```c
int32_t set_window_always_on_top(uint32_t window_id, int32_t always_on_top);
```

- `window_id` `uint32_t` - 目标 Window ID
- `always_on_top` `int32_t` - 非 `0` 置顶，`0` 取消置顶

---

### 设置忽略鼠标事件（`set_window_ignore_cursor_events`）

设置窗口是否忽略鼠标事件（鼠标穿透），适用于悬浮窗 / overlay 场景。

```c
int32_t set_window_ignore_cursor_events(uint32_t window_id, int32_t ignore);
```

- **参数**：`window_id`；`ignore`（`1` 忽略鼠标事件 / 穿透，`0` 正常）
- **返回值**：`1` 成功，`0` 失败

---
