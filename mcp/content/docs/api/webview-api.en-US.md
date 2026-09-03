---
title: WebView API
order: 1
group:
  title: Windows & Views
  order: 1
---

# WebView API (Page Control)

All operations target a **`window_id`** (there is no separate webview handle). `WebViewSettings` is documented field by field in the [Window API](/en-US/docs/api/window-api), so here we focus on what you can still call **after creation**.

---

## Navigation & Scripts

### Navigate to URL (`navigate_to_url`)

Make the page in the specified window open another address (http, file, custom protocol, etc.).

```c
int32_t navigate_to_url(uint32_t window_id, const char* url, const char* headers_json);
```

**Parameters:**

- `window_id` `uint32_t` - target window id
- `url` `string` - the address to navigate to
- `headers_json` `string` (optional) - request headers as a JSON object, e.g. `{"Authorization":"Bearer xxx","X-Custom":"value"}`. Passing `NULL` or an empty string behaves the same as the original API *(changed in 2.2)*

---

### Reload Page (`reload_webview_window`)

Reload the current page, similar to the user pressing F5.

```c
int32_t reload_webview_window(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - target window id

---

### Execute JavaScript (`execute_javascript`)

Inject and execute a piece of JavaScript into the page.

If you need the execution result, retrieve it via the `javascript-result` event and the like (see [Event Types](/en-US/docs/api/event-types#javascript-result)).

```c
int32_t execute_javascript(uint32_t window_id, const char* script);
```

**Parameters:**

- `window_id` `uint32_t` - target window id
- `script` `string` - the JavaScript code to execute

**Return value:**

- `> 0` - the returned value is a **request id**, not the JS execution result; the actual JS result must be retrieved by this id via the `javascript-result` event
- `0` - `script` is `NULL` (nothing was submitted for execution)

---

### Set Page Zoom (`set_webview_zoom`)

Zoom the whole page, e.g. `1.0` is 100% and `1.5` is 150%.

```c
int32_t set_webview_zoom(uint32_t window_id, double level);
```

**Parameters:**

- `window_id` `uint32_t` - target window id
- `level` `double` - zoom ratio

---

### Clear Browsing Data (`clear_browsing_data`)

:::warning
Supported since v2.2.
:::

Clear all browsing data (Cookies / cache / LocalStorage, etc.) of the specified window.

```c
int32_t clear_browsing_data(uint32_t window_id);
```

- **Parameter**: `window_id` `uint32_t`
- **Return value**: only indicates that the request was submitted (asynchronous, fire-and-forget); always returns `1` and does not reflect whether the browsing data was actually cleared

---

## Security Control

### Set Content Protection (`set_content_protection`)

When enabled, some screenshot/screen-recording software has a harder time capturing the window content (the effect varies by system and capture method).

```c
int32_t set_content_protection(uint32_t window_id, int32_t content_protection);
```

**Parameters:**

- `window_id` `uint32_t` - target window id
- `content_protection` `int32_t` - non-`0` enables protection, `0` disables protection

---

## DevTools

:::warning
Supported since v2.2.
:::

> DevTools must be enabled when creating the window (the `enable_devmod` parameter of `JadeView_init`).

### Open DevTools (`open_devtools`)

:::warning
Supported since v2.2.
:::

```c
int32_t open_devtools(uint32_t window_id);
```

- **Parameter**: `window_id` `uint32_t`
- **Return value**: only indicates that the request was submitted (asynchronous, fire-and-forget); always returns `1` and does not reflect whether DevTools actually opened

---

### Close DevTools (`close_devtools`)

:::warning
Supported since v2.2.
:::

```c
int32_t close_devtools(uint32_t window_id);
```

- **Parameter**: `window_id` `uint32_t`
- **Return value**: only indicates that the request was submitted (asynchronous, fire-and-forget); always returns `1` and does not reflect whether DevTools actually closed
- **Platform note**: invoked on all platforms; on Windows / WebView2 it is a no-op (no error, still returns `1`)

---

### Query Whether DevTools Is Open (`is_devtools_open`)

:::warning
Supported since v2.2.
:::

```c
int is_devtools_open(uint32_t window_id);
```

- **Parameter**: `window_id` `uint32_t`
- **Return value**: `1` = open, `0` = not open

---

## Printing

### Print WebView Content (`jade_print`)

Open the standard system print dialog to print the current WebView content.

```c
int32_t jade_print(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - target window id

**Return value:**

- only indicates that the request was submitted (asynchronous, fire-and-forget); always returns `1` and does not reflect whether the print dialog actually appeared or printing succeeded

:::info{title=Platform Support}
Available on both Windows (WebView2) and Linux (WebKitGTK) — under the hood it uses wry's cross-platform `webview.print()`.
:::

---

## Runtime Information

### Get WebView Version (`get_webview_version`)

Read out the version number of the **Microsoft WebView2 runtime** installed on the local machine (not the JadeView version). It is written into `buffer` (UTF-8 + `\0`).

```c
int32_t get_webview_version(char* buffer, size_t buffer_size);
```

Consistent with the description in the [Tools API](/en-US/docs/api/tools-api).
