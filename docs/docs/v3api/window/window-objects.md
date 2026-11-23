---
title: 窗口对象
order: 2
group:
  title: 窗口
  order: 1
---

# 窗口对象

## 对象查询与状态

### 获取窗口句柄（`get_window_hwnd`）

在 C/C++ 里要把窗口交给别的 Win32 API（例如 `SetWindowPos`、子控件挂靠）时，需要 HWND。

```c
size_t get_window_hwnd(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID
- **返回值**：`size_t` 原生窗口句柄

---

### 由窗口句柄取窗口 ID（`get_window_id`）

```c
uint32_t get_window_id(size_t hwnd);
```

- `hwnd` `size_t` - 原生窗口句柄（HWND）
- **返回值**：`uint32_t` 该窗口的 Window ID

---

### 获取默认 WebView（`get_default_webview`）

```c
uint32_t get_default_webview(uint32_t window_id);
```

窗口创建后立即取得默认 WebView ID，无需等待事件。`window_id` 是 Window ID；默认关联被清空后可结合 `get_window_state` 的 `default_webview_id` 字段判断。

---

### 指定默认 WebView（`set_default_webview`）

```c
int32_t set_default_webview(uint32_t window_id, uint32_t webview_id);
```

把窗口的默认关联指向指定视图。`window_id` 是 Window ID，`webview_id` 是 WebView ID。

---

### 列出窗口的所有视图（`get_window_webviews` / `free_webview_id_array`）

```c
int32_t get_window_webviews(uint32_t window_id, struct WebViewIdArray* out_array);
void free_webview_id_array(struct WebViewIdArray* array);
```

结果通过 `WebViewIdArray` 返回，用完必须调用 `free_webview_id_array` 释放内部数组。

```c
typedef struct WebViewIdArray {
  const uint32_t *ids;
  size_t count;
} WebViewIdArray;
```

---

### 查询父窗口（`get_webview_parent_window_id`）

```c
uint32_t get_webview_parent_window_id(uint32_t webview_id);
```

传入 WebView ID，返回其所属 Window ID。

---

### 查询对象状态（`get_window_state` / `get_webview_state`）

```c
int32_t get_window_state(uint32_t window_id, struct JadeObjectState* out);
int32_t get_webview_state(uint32_t webview_id, struct JadeObjectState* out);
```

两个函数分别接受 Window ID 与 WebView ID，状态写入同一个结构体：

```c
typedef struct JadeObjectState {
  uint32_t kind;
  uint32_t state;
  uint32_t parent_window_id;
  uint32_t default_webview_id;
  int32_t error_code;
} JadeObjectState;
```

| 字段 | C 类型 | 含义 |
| --- | --- | --- |
| `kind` | `uint32_t` | 对象种类（Window / WebView） |
| `state` | `uint32_t` | 生命周期状态，取值见下表 |
| `parent_window_id` | `uint32_t` | WebView 所属窗口；Window 对象上不适用 |
| `default_webview_id` | `uint32_t` | 窗口当前默认视图；已清空为 `0` |
| `error_code` | `int32_t` | 对象进入失败状态时的错误码 |

对象生命周期状态常量（`include/JadeView.h`）：

| 常量 | 值 | 含义 |
| --- | --- | --- |
| `JADE_STATE_RESERVED` | 1 | 已占位 |
| `JADE_STATE_CONFIGURED` | 2 | 已配置 |
| `JADE_STATE_CREATING` | 3 | 创建中 |
| `JADE_STATE_READY` | 4 | 原生实例可操作 |
| `JADE_STATE_CLOSING` | 5 | 关闭中 |
| `JADE_STATE_DESTROYING` | 6 | 销毁中 |
| `JADE_STATE_DESTROYED` | 7 | 已销毁 |
| `JADE_STATE_FAILED` | 8 | 失败 |
| `JADE_STATE_CRASHED` | 9 | 崩溃 |

> 请求结果另有一套更细的 `1 accepted / 2 waiting / 3 succeeded / 4 failed / 5 cancelled` 编号，见[核心 API](/docs/v3api)。两者不要混用。

---

### 获取窗口数量（`get_window_count`）

查询当前还有几个窗口没关。

```c
uint32_t get_window_count(void);
```

---
