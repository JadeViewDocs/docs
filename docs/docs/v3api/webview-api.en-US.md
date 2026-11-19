---
title: WebView API
order: 1
group:
  title: Windows & Views
  order: 1
---

# WebView API (Page Control)

A window and a web view are two distinct objects: **window operations use a Window ID, page operations use a WebView ID**. Both kinds of ID share a single non-reusable number space; passing an ID of the wrong type is rejected.

`create_webview_window` returns a **Window ID**; call `get_default_webview(window_id)` for its default WebView ID (no need to wait for an event). `create_webview` / `add_webview` return a **WebView ID** directly.

Destroying the default WebView clears the default association — another instance is not selected automatically. Destroying a Window destroys all of its WebViews first.

Unless explicitly noted, every parameter on this page is a **WebView ID**. `WebViewSettings` fields are documented in the [Window API](/en-US/docs/v3api/window-api); this page focuses on what you can call **after a view is created**.

---

Configuration starts with `struct_size` / `abi_version`. Initialize with the two-argument default function (`out, sizeof(*out)`), which returns `JADE_OK` on success; NULL creation options use defaults. See [V3 ABI](/en-US/docs/v3api/abi).

## Creating and Attaching WebViews

Three entry points:

```c
uint32_t create_webview(const char* url, const struct WebViewSettings* settings);
uint32_t add_webview(uint32_t window_id, const char* url, const struct WebViewSettings* settings, const struct WebViewBounds* bounds);
uint64_t add_webview_to_window(uint32_t window_id, uint32_t webview_id, const struct WebViewBounds* bounds);
```

- `create_webview` — creates a logical WebView; the native engine is allocated only when it is attached to a window. Pass `NULL` for `settings` to use the defaults.
- `add_webview` — creates and attaches in one step; the target window may still be in the process of being created. Pass `NULL` for `settings` / `bounds` to use the defaults.
- `add_webview_to_window` — attaches a WebView obtained from `create_webview`. Returns a **request ID**; read the outcome through `get_request_result` (see [Core API](/en-US/docs/v3api/index)).

```c
uint32_t window_id = create_webview_window(url, 0, NULL, NULL, NULL);

/* Append an independent view with custom settings */
struct WebViewSettings settings;
webview_settings_default(&settings, sizeof settings);
settings.user_agent = "MyApp/1.0";
uint32_t second = add_webview(window_id, "https://example.com", &settings, NULL);

/* Page operations always use the WebView ID */
send_ipc_message(second, "message", "hello");
```

`WebViewSettings` fields are listed in the [Window API](/en-US/docs/v3api/window-api); initialize the struct with `webview_settings_default` from the [Core API](/en-US/docs/v3api/index).

***

## Navigation and History

### Navigate to a URL (`navigate_to_url`)

Loads another address (http, file, custom protocol, etc.) in the specified view.

```c
int32_t navigate_to_url(uint32_t webview_id, const char* url, const char* headers_json);
```

**Parameters:**

- `webview_id` `uint32_t` - Target WebView ID
- `url` `string` - Address to navigate to
- `headers_json` `string` (optional) - Request headers as a JSON object, e.g. `{"Authorization":"Bearer xxx","X-Custom":"value"}`. Passing `NULL` or an empty string adds no custom headers

---

### Go Back (`webview_go_back`)

```c
int32_t webview_go_back(uint32_t webview_id);
```

- **Parameter**: `webview_id` `uint32_t`, target WebView ID.
- **Return**: `1` means the command entered the message queue, `0` means invalid arguments or an unavailable queue.

---

### Go Forward (`webview_go_forward`)

```c
int32_t webview_go_forward(uint32_t webview_id);
```

- **Parameter**: `webview_id` `uint32_t`, target WebView ID.
- **Return**: `1` means the command entered the message queue, `0` means invalid arguments or an unavailable queue.

---

### Check Whether Back Is Possible (`webview_can_go_back`)

```c
int32_t webview_can_go_back(uint32_t webview_id);
```

- **Parameter**: `webview_id` `uint32_t`, target WebView ID.
- **Return**: `1` if back navigation is possible, `0` if not or the view does not exist.

---

### Check Whether Forward Is Possible (`webview_can_go_forward`)

```c
int32_t webview_can_go_forward(uint32_t webview_id);
```

- **Parameter**: `webview_id` `uint32_t`, target WebView ID.
- **Return**: `1` if forward navigation is possible, `0` if not or the view does not exist.

---

### Usage Notes

- Back / forward operate on the native WebView history stack, including entries created by `window.history.pushState`.
- `webview_can_go_back` / `webview_can_go_forward` are synchronous queries, suitable for updating toolbar button state.
- A freshly created page has no history, so `webview_can_go_back()` usually returns `0`; query after `webview-did-finish-load`.
- Do not call synchronous queries inside an event callback, to avoid deadlocking the event loop thread.

```c
uint32_t window_id = create_webview_window("https://example.com/page-a", 0, NULL, NULL, NULL);
uint32_t view_id   = get_default_webview(window_id);

/* Call after webview-did-finish-load */
if (webview_can_go_back(view_id)) {
    webview_go_back(view_id);
}

if (webview_can_go_forward(view_id)) {
    webview_go_forward(view_id);
}
```

---

### Reload the Page (`reload_webview_window`)

Reloads the current page, similar to pressing F5.

```c
int32_t reload_webview_window(uint32_t webview_id);
```

**Parameters:**

- `webview_id` `uint32_t` - Target WebView ID

An asynchronous variant, `reload_webview`, returns a `uint64_t` request ID; see [Async Requests](/en-US/docs/v3api/index).

---

### Set Page Zoom (`set_webview_zoom`)

Zooms the whole page; `1.0` is 100%, `1.5` is 150%.

```c
int32_t set_webview_zoom(uint32_t webview_id, double level);
```

**Parameters:**

- `webview_id` `uint32_t` - Target WebView ID
- `level` `double` - Zoom factor

---

### Clear Browsing Data (`clear_browsing_data`)

Clears all browsing data (cookies / cache / LocalStorage, etc.) for the specified view.

```c
int32_t clear_browsing_data(uint32_t webview_id);
```

- **Parameter**: `webview_id` `uint32_t`, target WebView ID
- **Return**: Only indicates the request was submitted (asynchronous fire-and-forget); always returns `1` and does not say whether the data was actually cleared

---

### Query the Page URL (`get_webview_url`)

```c
int32_t get_webview_url(uint32_t webview_id, char* buffer, int32_t buffer_size);
```

The URL is written to `buffer` as a UTF-8 string. On failure, read the current thread's error with [`jade_last_error_code`](/en-US/docs/v3api/index).

---

## Executing Scripts

### `execute_webview_script`

Injects and runs JavaScript in the page, returning a `uint64_t` request ID.

```c
uint64_t execute_webview_script(uint32_t webview_id, const char* script);
```

**Parameters:**

- `webview_id` `uint32_t` - Target WebView ID
- `script` `string` - JavaScript code to execute

**Result**: Query the [64-bit request result](/en-US/docs/v3api/index) (`get_request_result` / `free_request_result` / `release_request`). A nonzero request ID only means the request was accepted, not that the script succeeded; a script waits for the document of the preceding navigation, and results from before a page change or recreation are never written to the new instance. Title-bar internal scripts use a no-return action.

```c
struct JadeRequestResult r = {0};
uint64_t rid = execute_webview_script(view_id, "1 + 1");
if (get_request_result(rid, &r) == JADE_OK) {
    /* r.state / r.error_code / r.message */
    free_request_result(&r);
}
release_request(rid);
```

---

## Window-Level Settings

### Set Content Protection (`set_content_protection`)

Makes it harder for some screenshot / screen-recording tools to capture the window contents (effect varies by OS and capture method).

```c
int32_t set_content_protection(uint32_t window_id, int32_t content_protection);
```

**Parameters:**

- `window_id` `uint32_t` - **Window ID** (not a WebView ID)
- `content_protection` `int32_t` - Non-`0` enables protection, `0` disables it

---

## DevTools

> Enable devtools for the view (`WebViewSettings.devtools`, or `enable_devmod` in `JadeView_init`).

### Open DevTools (`open_devtools`)

```c
int32_t open_devtools(uint32_t webview_id);
```

- **Parameter**: `webview_id` `uint32_t`, target WebView ID
- **Return**: Only indicates the request was submitted (asynchronous fire-and-forget); always returns `1` and does not say whether DevTools actually opened

---

### Close DevTools (`close_devtools`)

```c
int32_t close_devtools(uint32_t webview_id);
```

- **Parameter**: `webview_id` `uint32_t`, target WebView ID
- **Return**: Only indicates the request was submitted (asynchronous fire-and-forget); always returns `1` and does not say whether DevTools actually closed
- **Platform note**: Called on all platforms; a no-op on Windows / WebView2 (no error, still returns `1`)

---

### Check Whether DevTools Is Open (`is_devtools_open`)

```c
int32_t is_devtools_open(uint32_t webview_id);
```

- **Parameter**: `webview_id` `uint32_t`, target WebView ID
- **Return**: `1` = open, `0` = closed

---

## Printing

### Print WebView Content (`jade_print`)

Opens the system print dialog for the current WebView content.

```c
int32_t jade_print(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Pass the target **WebView ID** (the header keeps the parameter name `window_id`)

**Return:**

- Only indicates the request was submitted (asynchronous fire-and-forget); always returns `1` and does not say whether the dialog actually opened or printing succeeded

:::info{title="Platform support"}
Available on both Windows (WebView2) and Linux (WebKitGTK) — backed by wry's cross-platform `webview.print()`.
:::

---

## Runtime Information

### Get the WebView Version (`get_webview_version`)

Reads the installed **Microsoft WebView2 Runtime** version (not the JadeView version) into `buffer` (UTF-8 + `\0`).

```c
int32_t get_webview_version(char* buffer, size_t buffer_size);
```

Consistent with the description in [Tools API](/en-US/docs/v3api/tools-api).

---

## Asynchronous WebView Operations and Layout

All of the following use a **WebView ID**. Except for query APIs, they return a `uint64_t` request ID; see [Core API](/en-US/docs/v3api/index) for results.

### Set Bounds (`set_webview_bounds`)

```c
uint64_t set_webview_bounds(uint32_t webview_id, const struct WebViewBounds* bounds);
```

### Navigate (`navigate_webview`)

```c
uint64_t navigate_webview(uint32_t webview_id, const char* url);
```

### Reload (`reload_webview`)

```c
uint64_t reload_webview(uint32_t webview_id);
```

### Show / Hide (`set_webview_visible`)

```c
uint64_t set_webview_visible(uint32_t webview_id, int32_t visible);
```

Pass `0` / `1` for `visible`.

### Focus (`focus_webview`)

```c
uint64_t focus_webview(uint32_t webview_id);
```

### Destroy / Recreate (`destroy_webview` / `recreate_webview`)

```c
uint64_t destroy_webview(uint32_t webview_id);
uint64_t recreate_webview(uint32_t webview_id, const char* url, const struct WebViewSettings* settings);
```

---

## Layout Structure

```c
typedef struct WebViewBounds {
  const char *x;
  const char *y;
  const char *width;
  const char *height;
} WebViewBounds;
```

All four fields are **UTF-8 strings**, not numbers. The default is `0, 0, 100%, 100%`. Supported expressions:

| Syntax | Meaning |
| --- | --- |
| `100%` | Percentage |
| `20px` | Logical pixels |
| `50%-20px` | Mixed arithmetic |
| `calc`-style expressions, parentheses, scalar multiply/divide | Evaluated as an expression |

Constraints and behavior:

- `px` means logical pixels; bounds are recalculated on window resize and DPI changes. Initial layout and resize share the same calculation, and an unchanged layout does not call the native setter again.
- Negative dynamic width / height results are **clamped to zero**.
- An invalid expression **rejects the whole group and keeps the previous layout**; no partial field takes effect.
- On Windows, a child WebView computes and applies its initial CSS layout at creation time, and starts the initial navigation only after the native handler and bounds are ready; default creation, adding and recreation all reuse this flow.

```c
struct WebViewBounds b = {"10px", "0", "50%-20px", "100%"};
uint64_t rid = set_webview_bounds(view_id, &b);
```

---

## Query Bounds (`get_webview_bounds` / `free_webview_bounds_result`)

```c
int32_t get_webview_bounds(uint32_t webview_id, struct WebViewBoundsResult* out);
void free_webview_bounds_result(struct WebViewBoundsResult* out);
```

Returns a **snapshot of the applied bounds** without waiting for the UI thread. Initialize all string pointers in `out` to `NULL`, and call `free_webview_bounds_result` before reusing the struct.

```c
typedef struct WebViewBoundsResult {
  struct WebViewBounds bounds;      /* Original expressions (four strings) */
  struct LogicalRect logical;      /* Applied logical rectangle */
  struct PhysicalRect physical;    /* Applied physical rectangle */
} WebViewBoundsResult;

typedef struct LogicalRect {
  double x;  double y;  double width;  double height;
} LogicalRect;

typedef struct PhysicalRect {
  int32_t x;  int32_t y;  uint32_t width;  uint32_t height;
} PhysicalRect;
```

| Struct | Fields | C type |
| --- | --- | --- |
| `LogicalRect` | `x` / `y` / `width` / `height` | `double` |
| `PhysicalRect` | `x` / `y` | `int32_t` |
| `PhysicalRect` | `width` / `height` | `uint32_t` |
