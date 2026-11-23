---
title: Window Objects
order: 2
group:
  title: Windows
  order: 1
---

# Window Objects

### Get Window Handle

When working in C/C++, an HWND is required to pass a window to other Win32 APIs (such as SetWindowPos or child control attachment).

The function returns the HWND of a ready Windows window. It returns `0` if the window is not ready or the platform does not expose an HWND.

```c
size_t get_window_hwnd(uint32_t window_id);
```

**Parameters**:

- `window_id` `uint32_t` – Target window ID

***

### Get Window ID

Retrieve the Jadeview window ID from its window handle

```c
uint32_t get_window_id(size_t hwnd);
```

**Parameters**:

- `hwnd` `int32_t` – Target window handle

### Specify the Default WebView (`set_default_webview`)

```c
int32_t set_default_webview(uint32_t window_id, uint32_t webview_id);
```

Points the window's default association at the given view. `window_id` is a Window ID and `webview_id` is a WebView ID. After the association is cleared, check the `default_webview_id` field of `get_window_state`.

***

### List All WebViews of a Window (`get_window_webviews` / `free_webview_id_array`)

```c
int32_t get_window_webviews(uint32_t window_id, struct WebViewIdArray* out_array);
void free_webview_id_array(struct WebViewIdArray* array);
```

The result comes back in a `WebViewIdArray`; you must call `free_webview_id_array` to release the internal array when done.

```c
typedef struct WebViewIdArray {
  const uint32_t *ids;
  size_t count;
} WebViewIdArray;
```

***

### Query the Parent Window (`get_webview_parent_window_id`)

```c
uint32_t get_webview_parent_window_id(uint32_t webview_id);
```

Takes a WebView ID and returns the Window ID that owns it.

***

### Query Object State (`get_window_state` / `get_webview_state`)

```c
int32_t get_window_state(uint32_t window_id, struct JadeObjectState* out);
int32_t get_webview_state(uint32_t webview_id, struct JadeObjectState* out);
```

The two functions take a Window ID and a WebView ID respectively, and write into the same struct:

```c
typedef struct JadeObjectState {
  uint32_t kind;
  uint32_t state;
  uint32_t parent_window_id;
  uint32_t default_webview_id;
  int32_t error_code;
} JadeObjectState;
```

| Field | C type | Meaning |
| --- | --- | --- |
| `kind` | `uint32_t` | Object kind (Window / WebView) |
| `state` | `uint32_t` | Lifecycle state, see the table below |
| `parent_window_id` | `uint32_t` | Owning window of a WebView; not applicable to Window objects |
| `default_webview_id` | `uint32_t` | Current default view of the window; `0` when cleared |
| `error_code` | `int32_t` | Error code when the object entered a failed state |

Object lifecycle state constants (`include/JadeView.h`):

| Constant | Value | Meaning |
| --- | --- | --- |
| `JADE_STATE_RESERVED` | 1 | Slot reserved |
| `JADE_STATE_CONFIGURED` | 2 | Configured |
| `JADE_STATE_CREATING` | 3 | Creating |
| `JADE_STATE_READY` | 4 | Native instance usable |
| `JADE_STATE_CLOSING` | 5 | Closing |
| `JADE_STATE_DESTROYING` | 6 | Destroying |
| `JADE_STATE_DESTROYED` | 7 | Destroyed |
| `JADE_STATE_FAILED` | 8 | Failed |
| `JADE_STATE_CRASHED` | 9 | Crashed |

> Request results use a separate `1 accepted / 2 waiting / 3 succeeded / 4 failed / 5 cancelled` numbering — see [Core API](/en-US/docs/v3api). Do not mix the two.

***
