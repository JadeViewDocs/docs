---
title: 窗口外观
order: 7
group:
  title: 窗口
  order: 1
---

# 窗口外观

## 外观与样式

### 设置窗口明暗主题

控制窗口和 WebView 使用浅色、深色还是跟随系统主题。更细的说明见 [主题管理](/docs/v3api/theme-management)。

```c
int32_t set_window_theme(uint32_t window_id, const char* theme);
```

- `window_id` `uint32_t` - 目标 Window ID
- `theme` `string` - 主题字符串：`Light` / `Dark` / `System`

---

### 获取当前窗口主题

```c
int32_t get_window_theme(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID
- **返回值**：`1` 深色（Dark），`0` 浅色（Light）。`System` 主题按当前系统明暗解析；窗口不存在或主题未知时返回 `0`

---

### 设置窗口背景材质

Windows 11 下设置云母、亚克力等系统背景材质，可用字符串见 [主题管理](/docs/v3api/theme-management)。

```c
int32_t set_window_backdrop(uint32_t window_id, const char* backdrop_type);
```

- `window_id` `uint32_t` - 目标 Window ID
- `backdrop_type` `string` - 背景材质类型

:::warning{title=平台差异}
**仅 Windows 11**。Linux（WebKitGTK）无系统材质等价物，调用为 no-op 并返回 `0`、无视觉效果。如需半透明 / 纯色背景，请用 `set_window_background_color` 或窗口的 `transparent` + `background_color` 选项。
:::

---

### 设置窗口背景色

```c
int32_t set_window_background_color(uint32_t window_id, const char* background_color_hex);
```

- `window_id` `uint32_t` - 目标 Window ID
- `background_color_hex` `string` - 背景色十六进制字符串，如 `#FF0000`

---

### 请求重绘

通知系统重画客户区（一般很少需要手动调用）。

```c
int32_t request_redraw(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID

---
