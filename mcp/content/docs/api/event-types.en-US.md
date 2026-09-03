---
title: Event Types
order: 1
group:
  title: Communication & Events
  order: 3
---

# Event Types

This page lists the events the library may dispatch to the main process after subscribing via **`jade_on`**: **`event_data` is generally a UTF-8 JSON string** (a few are plain text, such as the error description when `app-ready` fails, or the `crash` error code). The first parameter of the `jade_on` callback, **`window_id`**, indicates which window it refers to (global events that are unrelated to a specific window are usually `0`, but defer to each section). 

**The return value of `IpcCallback`** has different meanings in "interception" events versus **`register_ipc_handler`**, so be sure to read the **quick reference** below first. The [IPC Communication API](/en-US/docs/api/ipc-api) provides supplementary notes that complement `jade.invoke`.

:::info
**Callback dispatch thread**: **notification events** (such as the various `window-*`, `notification-*`, `theme-changed`, etc.) are dispatched **asynchronously** by an internal worker thread pool — the callback does not run on the GUI thread, so heavier processing is fine; **interception events** (`window-closing`, `webview-will-navigate`, `webview-new-window`, `webview-download-started`, and the `enter`/`drop` of `drag-drop`) are called **inline synchronously on the GUI thread**, where the library reads the return value immediately to decide allow/block, so **return as quickly as possible and do not block**.
:::

---

<h2 id="ipc-callback-returns">Callback Return Value Quick Reference (`IpcCallback`)</h2>

The type is **`const char*`**, but in most scenarios it is used as a **sentinel** and need not point to a real string.

### Event subscription callbacks: when you need to "block" (`jade_on`)

For **`window-closing`**, **`webview-will-navigate`**, **`webview-new-window`**:

- Return **`NULL`**: **do not block** (allow closing / navigation / opening a new window).
- Return **pointer value `1`** (recommended form **`return (const char*)(uintptr_t)1;`**): **block**. In practice, **any non-`NULL` value counts as blocking**; using `1` avoids mistaking a stack string for a sentinel.

For **`webview-download-started`** (downloads are **blocked by default**):

- Return **`NULL`**: **allow** this download.
- Return **pointer value `1` or any other non-`NULL`**: **keep intercepting** (do not allow the download).

For **`drag-drop`** (synchronous interception added in 2.3, only for the `enter` / `drop` subtypes):

- Return **`NULL`**: allow (`enter`) / fall through to default logic (`drop`).
- Return **non-`NULL`**: reject the drag-in (`enter`) / indicate the main process has consumed it (`drop`). See [`drag-drop` · Synchronous Interception](#synchronous-interception-23).

### Call handler scenario: the exception (`register_ipc_handler` / `jade.invoke`)

Here **`(const char*)1` does not mean "block"**: along with **`NULL`** and the like, it is treated as a **special placeholder**, which the library maps to a **default success JSON**, and it will **not** be `jade_text_free`d. A custom response body must be allocated with **`jade_text_create`** and released by the library. See [IPC Communication API](/en-US/docs/api/ipc-api).

---

## `app-ready` Event

:::warning
Changed in v2.2.
:::

Fired after JadeView finishes initialization. All window creation and API calls must happen after this event is received; calling them beforehand returns `0` (failure).

The `event_data` format **differs** between success and failure (success is JSON, failure is plain text), so **decide success solely by `window_id == 1`** — do not rely on parsing `event_data`:

| Scenario | `window_id` | `event_data` |
|------|-------------|-------------|
| Initialization succeeded | `1` | JSON: `{"ok":true,"message":"success"}` |
| Initialization parameter validation failed | `0` | Plain text `"<code>: <message>"`, e.g. `"missing_app_name: app_name must be non-null and valid UTF-8"`; `code` is one of `missing_app_name` / `missing_app_signature` / `app_signature_too_short` |

How the main process decides: **look only at `window_id`** — `window_id === 1` means success, `window_id === 0` means failure.

---

## Window Events

### `window-created`

Window creation completed.

- **`event_data`**: `{}`
- **`window_id`**: id of the newly created window

---

### `window-closed`

The window has been closed.

- **`event_data`**: `{}`
- **`window_id`**: id of the closed window

---

### `window-all-closed`

All windows are closed.

- **`event_data`**: `{}`
- **`window_id`**: `0`

---

### `window-closing`

The user clicked close, but the window is **not yet destroyed**. Can be [intercepted](#event-subscription-callbacks-when-you-need-to-block-jade_on) via the callback return value.

- **`event_data`**: `{}`
- **`window_id`**: id of the window about to close

---

### `window-resized`

The window size changed.

- **`event_data`**: `{"width": integer, "height": integer}`
- **`window_id`**: id of the target window

---

### `window-state-changed`

The window maximize state changed.

- **`event_data`**: `{"isMaximized": true/false}`
- **`window_id`**: id of the target window

---

### `window-fullscreen`

The window fullscreen state changed.

- **`event_data`**: `{"fullscreen": true/false}`
- **`window_id`**: id of the target window

---

### `window-moved`

The window position changed.

- **`event_data`**: `{"x": integer, "y": integer}`
- **`window_id`**: id of the target window

---

### `window-focused` / `window-blurred`

The window gained or lost keyboard focus.

- **`event_data`**: `{}`
- **`window_id`**: id of the target window

---

### `window-destroyed`

The window was destroyed.

- **`event_data`**: `{}`
- **`window_id`**: id of the destroyed window

---

### `window-bounds`

After the main process queries a window's position and size (`get_window_bounds`), the result is reported back via this event.

- **`event_data`**: `{"x": integer, "y": integer, "width": integer, "height": integer}`
- **`window_id`**: id of the target window

---

## WebView and Page Events

### `webview-will-navigate`

About to navigate to a new URL. Can be [intercepted](#event-subscription-callbacks-when-you-need-to-block-jade_on) via the callback return value.

- **`event_data`**: `{"url": "...", "window_id": integer}`
- **`window_id`**: id of the target window

---

### `webview-did-start-loading`

The page started loading.

- **`event_data`**: `{"url": "...", "window_id": integer}`
- **`window_id`**: id of the target window

---

### `webview-did-finish-load`

The page finished loading.

- **`event_data`**: `{"url": "...", "window_id": integer}`
- **`window_id`**: id of the target window

---

### `webview-new-window`

The page requested a new window. Can be [intercepted](#event-subscription-callbacks-when-you-need-to-block-jade_on) via the callback return value.

- **`event_data`**: `{"url": "...", "frame_name": "_blank"}`, etc.
- **`window_id`**: id of the source window

---

### `webview-page-title-updated`

The page title changed.

- **`event_data`**: `{"title": "...", "window_id": integer}`
- **`window_id`**: id of the target window

---

### `webview-page-favicon-updated`

The page icon (favicon) changed.

- **`event_data`**: `{"favicon": "<url>"}`
- **`window_id`**: id of the target window

---

### `webview-download-started`

A download started. **Blocked by default**; you must return `NULL` in the callback to allow the download, see [Callback Return Value Quick Reference](#ipc-callback-returns).

- **`event_data`**: `{"url": "...", "filename": "..."}`
- **`window_id`**: id of the target window

---

### `webview-download-completed`

:::warning
Supported since v2.2.
:::

Fired when a download completes (whether it succeeds or fails).

- **`event_data`**: JSON containing the download result information
- **`window_id`**: id of the target window

---

### `file-drop`

:::warning
Deprecated since v2.2.
:::
> **⚠️ As of 2.2, this event has been removed; please migrate to the [`drag-drop`](#drag-drop) event and check `type == "drag-drop"`.

Fired when a file is dragged into the WebView. Once registered, it takes over drag-and-drop, and the renderer process may not receive the native drop event.

- **`event_data`**: `{"files": ["path1", ...], "x": integer, "y": integer}`
- **`window_id`**: id of the target window


---

### `drag-drop`

:::warning
Supported since v2.2, replaces `file-drop`.
:::

A drag lifecycle event covering the complete drag flow (enter, move, drop, leave), similar to Tauri's `onDragDropEvent`.

The original `file-drop` event was only fired when files were dropped; as of 2.2 it is replaced by the unified `drag-drop` event.

```c
jade_on("drag-drop", my_callback);
```

`event_data` is JSON, with the event type distinguished by the `type` field:

| type | Description | Additional fields |
|------|------|----------|
| `enter` | Drag enters the window | `paths`, `x`, `y` |
| `over` | Drag moves over the window | `x`, `y` |
| `drop` | Files dropped | `paths`, `x`, `y` |
| `leave` | Drag leaves the window | None |

**Example event_data for each type:**

```json
// enter — drag enters the window
{"type": "enter", "paths": ["C:\\Users\\test\\file.txt"], "x": 100, "y": 200}

// over — drag moves over the window
{"type": "over", "x": 150, "y": 210}

// drop — files dropped
{"type": "drop", "paths": ["C:\\Users\\test\\file.txt"], "x": 150, "y": 210}

// leave — drag leaves the window
{"type": "leave"}
```

#### Synchronous Interception (2.3)

:::warning
Supported since v2.3.
:::

As of 2.3, the `drag-drop` callback supports **synchronous interception** for `enter` and `drop`, controlled via the [`IpcCallback` return value](/en-US/docs/api/ipc-api#jade-on-callback-return):

| type | Return value semantics |
|------|-----------|
| `enter` | Return a **non-null pointer** → **reject** this drag (do not enter); return `NULL` → allow. |
| `drop` | Return a **non-null pointer** → indicate the main process has **handled/consumed** this drop; return `NULL` → defer to the default logic. |
| `over` / `leave` | Remain **asynchronous notifications**; the return value is ignored. |

- It is recommended to return `(const char *)(uintptr_t)1` when intercepting/consuming.
- **Behavior is unchanged when no callback is registered**, keeping compatibility with older versions.

> **⚠️ Breaking change**: The original `file-drop` event has been removed; please migrate to the `drag-drop` event and check `type == "drop"`.

---

### `javascript-result`

Fired after the main process calls `execute_javascript` and the execution in the page finishes.

- **`event_data`**: JSON, usually containing the request **`id`** and **`result`** (the script's return value or error description)
- **`window_id`**: id of the target window
- **Note**: the return value of `execute_javascript` only indicates whether it was enqueued; **the script result is only obtained in this event**

---

### `postmessage-received`

The page sends a message via `postMessage`. **Only fired when the origin passes the whitelist** (see [Core API · WebViewSettings](/en-US/docs/api/index#webview-settings)).

- **`event_data`**: `{"origin": "origin", "message": "string"}`
- **`window_id`**: id of the target window

---

## Theme and Others

### `theme-changed`

The system or window theme changed.

- **`event_data`**: `{}`
- **`window_id`**: id of the window whose theme changed

---

### `update-window-icon`

The window icon needs to be refreshed.

- **`event_data`**: `{"window_id": integer}`
- **`window_id`**: id of the target window

---


## Notification-Related Events

### `notification-shown`

The notification was shown successfully.

- **`event_data`**: `title`, `body`, `text3`, etc.
- **`window_id`**: `0`

---

### `notification-dismissed`

The user dismissed the notification or it timed out.

- **`event_data`**: e.g. `{"reason": "dismissed"}`
- **`window_id`**: `0`

---

### `notification-failed`

The notification failed to display.

- **`event_data`**: `error`, etc.
- **`window_id`**: `0`

---

### `notification-action`

The user clicked a button or clicked the notification card.

- **`event_data`**: `action` (`clicked` / `action_0` / `action_1`), `title` (button text), `arguments` (from `NotificationParams.action`)
- **`window_id`**: `0`

---

## Global System Events

### `second-instance`

After you enable **single instance**, the user double-clicks to launch the exe again. The second process exits quickly, but the **first launched process** receives this event, carrying the **full command line of the second launch**. This lets you open the same window or parse a `myapp://` link.

**When it fires**: when `single_instance` in `JadeView_init` is non-zero and a "second instance" is detected, the **first instance** emits it after reading the pipe data.

- **`window_id`**: always `0` (unrelated to any specific window)
- **`event_data`**: UTF-8 JSON containing an **`argv`** array, i.e. the command-line argument list of the second process

---

### `global-hotkey`

The user pressed a **global hotkey** you registered with `register_global_hotkey` (even when focus is not on your window). In the callback you run the corresponding logic based on the id / key code in the JSON.

- **`window_id`**: `0`
- **`event_data`**: JSON, typically containing **`id`** (the hotkey id returned at registration), **`modifiers`**, and **`vk`**

Platform differences: available on both Windows and Linux/X11; **global hotkeys are unavailable on Linux/Wayland** (a protocol limitation), and `register_global_hotkey` returns `0`.

---

### `tray-menu-command`

The user **clicked a clickable item in the tray icon's right-click menu** (not a separator). Use the **`key`** in the JSON (matching `TrayMenuItemDesc.key`) to tell whether it is "Exit", "Settings", etc.

- **`window_id`**: `0`
- **`event_data`**: contains `tray_id`, `key`, `item_id`, `dangerous`, `timestamp`, etc.; use **`key`** as the source of truth for business logic

---

### `tray-event`

The user left-clicks, right-clicks, double-clicks, or moves the mouse in/out **on the tray icon** (**not** clicking a row in the menu). You must first call `jade_on("tray-event", ...)` to receive it. To avoid flooding, **moving the mouse over the icon** does not fire events continuously.

- **`window_id`**: `0`
- **`event_data`**: JSON containing `tray_id`, `event` (such as `left-click`, `enter`), coordinates, `timestamp`, etc.

---

### `japk-load-failed`

Fired when a JAPK resource pack fails to load (public key not set, signature verification failed, unpack/read error, etc.). See [JAPK Resource Pack](/en-US/docs/api/japk).

- **`window_id`**: `0`
- **`event_data`**: a **plain-text** error message (not JSON)

---

### `crash`

:::warning
Supported since v2.2.
:::

Fired when the program crashes (SEH exception, Rust panic, or WebView2 process crash). `event_data` is an error code string that does not leak source-code information.

```c
jade_on("crash", my_callback);
```

- **`window_id`**: `0`
- **`event_data`**: an error code string (not JSON); the header file provides `JADEVIEW_CRASH_*` macro definitions

**SEH exceptions (native crashes):**

| Error code | Exception code | Description |
|---------|---------|------|
| `SEH_ACCESS_VIOLATION` | 0xC0000005 | Memory access violation |
| `SEH_STACK_OVERFLOW` | 0xC00000FD | Stack overflow |
| `SEH_ILLEGAL_INSTRUCTION` | 0xC000001D | Illegal instruction |
| `SEH_INVALID_HANDLE` | 0xC0000008 | Invalid handle |
| `SEH_UNKNOWN` | Others | Unknown native exception |

**Runtime exceptions:**

| Error code | Description |
|---------|------|
| `RUNTIME_PANIC` | Rust runtime panic |

**WebView2 process crashes:**

| Error code | Enum value | Description |
|---------|-------|------|
| `WV2_BROWSER_EXITED` | BROWSER_PROCESS_EXITED (0) | Browser process exited |
| `WV2_RENDER_EXITED` | RENDER_PROCESS_EXITED (1) | Render process exited |
| `WV2_RENDER_UNRESPONSIVE` | RENDER_PROCESS_UNRESPONSIVE (2) | Render process unresponsive |
| `WV2_FRAME_RENDER_EXITED` | FRAME_RENDER_PROCESS_EXITED (3) | Frame render process exited |
| `WV2_UTILITY_EXITED` | UTILITY_PROCESS_EXITED (4) | Utility process exited |
| `WV2_SANDBOX_HELPER_EXITED` | SANDBOX_HELPER_PROCESS_EXITED (5) | Sandbox helper process exited |
| `WV2_GPU_EXITED` | GPU_PROCESS_EXITED (6) | GPU process exited |
| `WV2_PPAPI_PLUGIN_EXITED` | PPAPI_PLUGIN_PROCESS_EXITED (7) | PPAPI plugin process exited |
| `WV2_PPAPI_BROKER_EXITED` | PPAPI_BROKER_PROCESS_EXITED (8) | PPAPI broker process exited |
| `WV2_UNKNOWN_EXITED` | UNKNOWN_PROCESS_EXITED (9) | Unknown process exited |

**Crash capture mechanism:**

Crash capture is installed automatically during initialization, with no manual call required:

- **SEH exception capture**: native crashes such as access violations, stack overflows, and illegal instructions
- **Panic Hook**: captures Rust panics and sends the `RUNTIME_PANIC` error code
- **WebView2 process crash monitoring**: monitors render/browser process crashes via `ICoreWebView2.add_ProcessFailed`
- **No source leakage**: all output is error codes, with no source paths, line numbers, or function names
- **Automatic main-process notification**: on a crash, the main process is notified via the `crash` event, with `event_data` being the error code string
- **Error code macro definitions**: the header file provides `JADEVIEW_CRASH_*` macro definitions that the main process can use directly

---

Right-click menu events (`context-menu`, `menu-item-clicked`) have been moved to the standalone [Right-Click Menu](/en-US/docs/api/context-menu-api) document.
