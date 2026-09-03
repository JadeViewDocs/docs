---
title: WebView API
order: 1
group:
  title: 窗口与视图
  order: 1
---

# WebView API（页面控制）

所有操作都针对 **`window_id`**（没有单独的 webview 句柄）。`WebViewSettings` 在 [窗口 API](/docs/api/window-api#创建普通窗口) 里按字段说明过，这里侧重**创建之后**还能调什么。

---

## 导航与脚本

### 导航到 URL（`navigate_to_url`）

让指定窗口里的网页打开另一个地址（http、file、自定义协议等）。

```c
int32_t navigate_to_url(uint32_t window_id, const char* url, const char* headers_json);
```

**参数：**

- `window_id` `uint32_t` - 目标窗口 id
- `url` `string` - 要导航到的地址
- `headers_json` `string` (可选) - JSON 对象格式的请求头，如 `{"Authorization":"Bearer xxx","X-Custom":"value"}`。传入 `NULL` 或空字符串时行为与原 API 一致 *(2.2 修改)*

---

### 刷新页面（`reload_webview_window`）

重新加载当前页，和用户按 F5 类似。

```c
int32_t reload_webview_window(uint32_t window_id);
```

**参数：**

- `window_id` `uint32_t` - 目标窗口 id

---

### 执行 JavaScript（`execute_javascript`）

往页面里注入并执行一段 JavaScript。

若需要执行结果，通过事件 `javascript-result` 等取回（见 [事件类型](/docs/api/event-types#javascript-result)）。

```c
int32_t execute_javascript(uint32_t window_id, const char* script);
```

**参数：**

- `window_id` `uint32_t` - 目标窗口 id
- `script` `string` - 要执行的 JavaScript 代码

**返回值：**

- `> 0` - 返回的是**请求 id**，并非 JS 的执行结果；真正的 JS 结果需配合 `javascript-result` 事件按该 id 取回
- `0` - `script` 为 `NULL`（未提交执行）

---

### 设置网页缩放（`set_webview_zoom`）

整页缩放，例如 `1.0` 为 100%，`1.5` 为 150%。

```c
int32_t set_webview_zoom(uint32_t window_id, double level);
```

**参数：**

- `window_id` `uint32_t` - 目标窗口 id
- `level` `double` - 缩放比例

---

### 清除浏览数据（`clear_browsing_data`）

:::warning
v2.2 开始支持。
:::

清除指定窗口的所有浏览数据（Cookie / 缓存 / LocalStorage 等）。

```c
int32_t clear_browsing_data(uint32_t window_id);
```

- **参数**：`window_id` `uint32_t`
- **返回值**：仅表示请求已提交（异步 fire-and-forget），恒返回 `1`；不代表浏览数据是否真正清除成功

---

## 安全控制

### 设置内容保护（`set_content_protection`）

打开后，部分截屏/录屏软件较难采到窗口内容（效果因系统和采集方式而异）。

```c
int32_t set_content_protection(uint32_t window_id, int32_t content_protection);
```

**参数：**

- `window_id` `uint32_t` - 目标窗口 id
- `content_protection` `int32_t` - 非 `0` 启用保护，`0` 禁用保护

---

## DevTools

:::warning
v2.2 开始支持。
:::

> 需在创建窗口时启用 devtools（`JadeView_init` 的 `enable_devmod` 参数）。

### 打开 DevTools（`open_devtools`）

:::warning
v2.2 开始支持。
:::

```c
int32_t open_devtools(uint32_t window_id);
```

- **参数**：`window_id` `uint32_t`
- **返回值**：仅表示请求已提交（异步 fire-and-forget），恒返回 `1`；不代表 DevTools 是否真正打开

---

### 关闭 DevTools（`close_devtools`）

:::warning
v2.2 开始支持。
:::

```c
int32_t close_devtools(uint32_t window_id);
```

- **参数**：`window_id` `uint32_t`
- **返回值**：仅表示请求已提交（异步 fire-and-forget），恒返回 `1`；不代表 DevTools 是否真正关闭
- **平台说明**：所有平台都会调用，Windows / WebView2 上为 no-op（不报错、仍返回 `1`）

---

### 查询 DevTools 是否打开（`is_devtools_open`）

:::warning
v2.2 开始支持。
:::

```c
int is_devtools_open(uint32_t window_id);
```

- **参数**：`window_id` `uint32_t`
- **返回值**：`1` = 已打开，`0` = 未打开

---

## 打印

### 打印 WebView 内容（`jade_print`）

打开系统标准打印对话框，打印当前 WebView 内容。

```c
int32_t jade_print(uint32_t window_id);
```

**参数：**

- `window_id` `uint32_t` - 目标窗口 id

**返回值：**

- 仅表示请求已提交（异步 fire-and-forget），恒返回 `1`；不代表打印对话框真正弹出或打印成功

:::info{title=平台支持}
Windows（WebView2）与 Linux（WebKitGTK）均可用——底层走 wry 跨平台的 `webview.print()`。
:::

---

## 运行时信息

### 获取 WebView 版本（`get_webview_version`）

读出本机安装的 **Microsoft WebView2 运行时**版本号（不是 JadeView 版本）。写入 `buffer`（UTF-8 + `\0`）。

```c
int32_t get_webview_version(char* buffer, size_t buffer_size);
```

与 [工具 API](/docs/api/tools-api) 中的说明一致。
