---
title: Event Types
order: 1
group:
  title: Communication & Events
  order: 3
---

# Event Types

This page is the **event catalogue**: it lists every event the library may dispatch and the shape of its `event_data`. `event_data` is generally a UTF-8 JSON string (a few events use plain text, such as the `app-ready` error description or the `crash` code).

How to subscribe is **not** covered here: use [`jade_on`](/en-US/docs/v3api/event-subscription#jade-on) for named events, or [`on_app_event` / `on_window_event` / `on_webview_event`](/en-US/docs/v3api/event-subscription) for typed subscriptions — see [Event Subscription](/en-US/docs/v3api/event-subscription).

The first `jade_on` callback parameter is the **real event source ID**: App sources are `0`, window events use the Window ID, and WebView events use the WebView ID. For `app-ready`, check `ok:true` in the body rather than the source ID.

**The return value of `IpcCallback`** has different meanings in "interception" events versus **`register_ipc_handler`**, so be sure to read the **quick reference** below first. The [IPC API](/en-US/docs/v3api/ipc-api) provides supplementary notes that complement `jade.invoke`.

:::info{title="Callback thread"}
- **Notification events** (`window-*`, `notification-*`, `theme-changed`, etc.) are dispatched asynchronously; heavier processing is fine.
- **Interception events** (`window-closing`, `webview-will-navigate`, `webview-new-window`, `webview-download-started`, `enter`/`drop` of `drag-drop`) run synchronously on the GUI thread. The library reads the return value immediately to allow or block, so return quickly.
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

For **`drag-drop`** (synchronous interception applies to the `enter` / `drop` subtypes):

- Return **`NULL`**: allow (`enter`) / fall through to default logic (`drop`).
- Return **non-`NULL`**: reject the drag-in (`enter`) / indicate the main process has consumed it (`drop`). See [`drag-drop` · Synchronous Interception](#synchronous-interception-23).

### Call handler scenario: the exception (`register_ipc_handler` / `jade.invoke`)

**`(const char*)1`** and `NULL` are placeholders that the library maps to a default success JSON; do not `jade_text_free` them. For a custom response body, allocate with `jade_text_create` and let the library release it. See [IPC Communication API](/en-US/docs/v3api/ipc-api).

---

## `app-ready` Event

:::warning

:::

Fired after JadeView finishes initialization. All window creation and API calls must happen after this event is received; calling them beforehand returns `0` (failure).

The `event_data` format differs between success and failure (success is JSON, failure is plain text). `app-ready` is an App-source event whose source ID is always `0`; **decide success by parsing `ok:true` in the body**, not by the source ID:

| Scenario | Source ID | `event_data` |
|------|-------------|-------------|
| Initialization succeeded | `0` | JSON: `{"ok":true,"message":"success"}` |
| Initialization parameter validation failed | `0` | Plain text `"<code>: <message>"`, e.g. `"missing_app_name: app_name must be non-null and valid UTF-8"`; `code` is one of `missing_app_name` / `missing_app_signature` / `app_signature_too_short` |

How the main process decides: **parse the `ok` field in `event_data`** — `ok:true` means success; on parameter validation failure the body is a plain-text error and is treated as failure, and `JadeView_init` also returns `0` directly.

---

## Window Events

### `window-created`

Window creation completed.

- **`event_data`**: `{}`
- **Source ID**: id of the newly created window

---

### `window-closed`

The window has been closed.

- **`event_data`**: `{}`
- **Source ID**: id of the closed window

:::info
even if a window is destroyed abnormally (without going through the normal close flow), this event is **still emitted** afterward and the window state is cleaned up, so the host will not miss the close notification.
:::

---

### `window-all-closed`

All windows are closed.

- **`event_data`**: `{}`
- **Source ID**: `0`

:::info
even if the last window was destroyed abnormally, this event is emitted after cleanup.
:::

---

### `window-closing`

The user clicked close (or the frontend called `window.close()`, or Alt+F4, or the title-bar close button), but the window is **not yet destroyed**. Can be [intercepted](#event-subscription-callbacks-when-you-need-to-block-jade_on) via the callback return value (return a non-null pointer to block closing).

- **`event_data`**: JSON distinguishing the close source:
  - `{"source":"system"}` — user-initiated (Alt+F4, system close button, title-bar close button).
  - `{"source":"frontend","url":"<page's current URL>"}` — initiated by the frontend `window.close()`; `url` is the WebView's current address read directly by JadeView, not a value reported by the page.
- **Source ID**: id of the window about to close

> The title-bar close button, `window.close()` and Alt+F4 share one close flow; the host's registered `window-closing` callback **will** be called and can block the close by returning a non-null pointer. See [Close Flow](/en-US/docs/v3api/window-lifecycle).

---

### `window-resized`

The window size changed.

- **`event_data`**: `{"width": integer, "height": integer}`
- **Source ID**: id of the target window

---

### `window-state-changed`

The window maximize state changed.

- **`event_data`**: `{"isMaximized": true/false}`
- **Source ID**: id of the target window

---

### `window-fullscreen`

The window fullscreen state changed.

- **`event_data`**: `{"fullscreen": true/false}`
- **Source ID**: id of the target window

---

### `window-moved`

The window position changed.

- **`event_data`**: `{"x": integer, "y": integer}`
- **Source ID**: id of the target window

---

### `window-focused` / `window-blurred`

The window gained or lost keyboard focus.

- **`event_data`**: `{}`
- **Source ID**: id of the target window

---

### `window-destroyed`

The window was destroyed.

- **`event_data`**: `{}`
- **Source ID**: id of the destroyed window

---

### `window-bounds`

After the main process queries a window's position and size (`get_window_bounds`), the result is reported back via this event.

- **`event_data`**: `{"x": integer, "y": integer, "width": integer, "height": integer}`
- **Source ID**: id of the target window

---

### `region-drag`

Drag-end notification for a `jade-region-drag` region.

- **`event_data`**: `{"action":"end"}` — currently only `end`, meaning the system window move loop has ended (left button released)
- **Source ID**: id of the dragged window
- **Platform**: Windows (Linux to be verified)

The drag enters the system move loop, which captures the mouse and swallows the page's `mouseup`, so the page cannot know when the button was released; this event reports that moment to the host. A **click in place** (press without moving, then release) also dispatches it; **double-clicking** the region does not (it maximizes/restores instead). The event carries no geometry — use `get_window_bounds`.

---

## WebView and Page Events

### `webview-will-navigate`

About to navigate to a new URL. Can be [intercepted](#event-subscription-callbacks-when-you-need-to-block-jade_on) via the callback return value.

- **`event_data`**: `{"url": "...", "window_id": integer}`
- **Source ID**: id of the target window

---

### `webview-did-start-loading`

The page started loading.

- **`event_data`**: `{"url": "...", "window_id": integer}`
- **Source ID**: id of the target window

---

### `webview-did-finish-load`

The page finished loading.

- **`event_data`**: `{"url": "...", "window_id": integer}`
- **Source ID**: id of the target window

---

### `webview-new-window`

The page requested a new window. Can be [intercepted](#event-subscription-callbacks-when-you-need-to-block-jade_on) via the callback return value.

- **`event_data`**: `{"url": "...", "frame_name": "_blank"}`, etc.
- **Source ID**: id of the source window

---

### `webview-page-title-updated`

The page title changed.

- **`event_data`**: `{"title": "...", "window_id": integer}`
- **Source ID**: id of the target window

---

### `webview-page-favicon-updated`

The page icon (favicon) changed.

- **`event_data`**: `{"favicon": "<url>"}`
- **Source ID**: id of the target window

---

### `webview-download-started`

A download started. **Blocked by default**; you must return `NULL` in the callback to allow the download, see [Callback Return Value Quick Reference](#ipc-callback-returns).

- **`event_data`**: `{"url": "...", "filename": "..."}`
- **Source ID**: id of the target window

---

### `webview-download-completed`

Fired when a download completes (whether it succeeds or fails).

- **`event_data`**: JSON containing the download result information
- **Source ID**: id of the target window

---


### `drag-drop`

A drag lifecycle event covering the complete drag flow (enter, move, drop, leave), similar to Tauri's `onDragDropEvent`.

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

#### Synchronous Interception

The `drag-drop` callback supports **synchronous interception** for `enter` and `drop`, controlled via the [`IpcCallback` return value](/en-US/docs/v3api/event-subscription#jade-on-callback-return):

| type | Return value semantics |
|------|-----------|
| `enter` | Return a **non-null pointer** → **reject** this drag (do not enter); return `NULL` → allow. |
| `drop` | Return a **non-null pointer** → indicate the main process has **handled/consumed** this drop; return `NULL` → defer to the default logic. |
| `over` / `leave` | Remain **asynchronous notifications**; the return value is ignored. |

- It is recommended to return `(const char *)(uintptr_t)1` when intercepting/consuming.
- With no callback registered, the browser default applies.

---

### `postmessage-received`

The page sends a message via `postMessage`. **Only fired when the origin passes the whitelist** (see [Core API · WebViewSettings](/en-US/docs/v3api/index#webview-settings)).

- **`event_data`**: `{"origin": "origin", "message": "string"}`
- **Source ID**: id of the target window

---

## Theme and Others

### `theme-changed`

The system or window theme changed.

- **`event_data`**: `{}`
- **Source ID**: id of the window whose theme changed

---

### `update-window-icon`

The window icon needs to be refreshed.

- **`event_data`**: `{"window_id": integer}`
- **Source ID**: id of the target window

---


<h2 id="notification-events">Notification-Related Events</h2>

### `notification-shown`

The notification was shown successfully.

- **`event_data`**: `title`, `body`, `text3`, etc.
- **Source ID**: `0`

---

### `notification-dismissed`

The user dismissed the notification or it timed out.

- **`event_data`**: e.g. `{"reason": "dismissed"}`
- **Source ID**: `0`

---

### `notification-failed`

The notification failed to display.

- **`event_data`**: `error`, etc.
- **Source ID**: `0`

---

### `notification-action`

The user clicked a button or clicked the notification card.

- **`event_data`**: `action` (`clicked` / `action_0` / `action_1`), `title` (button text), `arguments` (from `NotificationParams.action`)
- **Source ID**: `0`

---

## Global System Events

### `second-instance`

After you enable **single instance**, the user double-clicks to launch the exe again. The second process exits quickly, but the **first launched process** receives this event, carrying the **full command line of the second launch**. This lets you open the same window or parse a `myapp://` link.

**When it fires**: when `single_instance` in `JadeView_init` is non-zero and a "second instance" is detected, the **first instance** emits it after reading the pipe data.

- **Source ID**: always `0` (unrelated to any specific window)
- **`event_data`**: UTF-8 JSON containing an **`argv`** array, i.e. the command-line argument list of the second process

---

### `global-hotkey`

The user pressed a **global hotkey** you registered with `register_global_hotkey` (even when focus is not on your window). In the callback you run the corresponding logic based on the id / key code in the JSON.

- **Source ID**: `0`
- **`event_data`**: JSON, typically containing **`id`** (the hotkey id returned at registration), **`modifiers`**, and **`vk`**

Platform differences: available on both Windows and Linux/X11; **global hotkeys are unavailable on Linux/Wayland** (a protocol limitation), and `register_global_hotkey` returns `0`.

---

### `menu-command`

A custom menu item was selected. The source is the owner Window ID, or `0` for an ownerless popup. The JSON payload contains `item_id`.

### `menu-error`

An accepted menu popup could not be displayed. The JSON payload contains `message`.

---

### `tray-event`

The user left-clicks, right-clicks, double-clicks, or moves the mouse in/out **on the tray icon** (**not** clicking a row in the menu). You must first call `jade_on("tray-event", ...)` to receive it. To avoid flooding, **moving the mouse over the icon** does not fire events continuously.

- **Source ID**: `0`
- **`event_data`**: JSON containing `tray_id`, `event` (such as `left-click`, `enter`), coordinates, `timestamp`, etc.

---

### `japk-load-failed`

Fired when a JAPK resource pack fails to load (public key not set, signature verification failed, unpack/read error, etc.). See [JAPK Resource Pack](/en-US/docs/v3api/japk).

- **Source ID**: `0`
- **`event_data`**: a **plain-text** error message (not JSON)

---

### `crash`

Fired when the program crashes (SEH exception, Rust panic, or WebView2 process crash). `event_data` is an error code string that does not leak source-code information.

```c
jade_on("crash", my_callback);
```

- **Source ID**: `0`
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

Custom popups emit [`menu-command`](/en-US/docs/v3api/menu-api) on selection.

<h2 id="event-type-constants">Event Type Constants</h2>

Values for the `event_type` argument of `on_app_event` / `on_window_event` / `on_webview_event`, and for `JadeEvent.event_type`:

| Constant | Value | Constant | Value |
| --- | --- | --- | --- |
| `JADE_EVENT_ALL` | 0 | `JADE_EVENT_LOAD_FINISHED` | 6 |
| `JADE_EVENT_CREATED` | 1 | `JADE_EVENT_CRASHED` | 7 |
| `JADE_EVENT_CREATING` | 2 | `JADE_EVENT_OPERATION_COMPLETED` | 8 |
| `JADE_EVENT_CREATE_FAILED` | 3 | `JADE_EVENT_OPERATION_FAILED` | 9 |
| `JADE_EVENT_DESTROYED` | 4 | `JADE_EVENT_OTHER` | 100 |
| `JADE_EVENT_LOAD_STARTED` | 5 | `JADE_EVENT_REPLAY` | 1 (`flags` bit) |

## Event Name Constants

The named-event string constants defined in `include/JadeView.h`. They work with the named-event mechanism and correspond to `JadeEvent.name` in typed subscriptions:

| Macro | String | Macro | String |
| --- | --- | --- | --- |
| `JADEVIEW_EVENT_APP_READY` | `app-ready` | `JADEVIEW_EVENT_NOTIFICATION_ACTION` | `notification-action` |
| | | `JADEVIEW_EVENT_NOTIFICATION_DISMISSED` | `notification-dismissed` |
| `JADEVIEW_EVENT_CRASH` | `crash` | `JADEVIEW_EVENT_NOTIFICATION_FAILED` | `notification-failed` |
| `JADEVIEW_EVENT_DRAG_DROP` | `drag-drop` | `JADEVIEW_EVENT_NOTIFICATION_SHOWN` | `notification-shown` |
| `JADEVIEW_EVENT_GLOBAL_HOTKEY` | `global-hotkey` | `JADEVIEW_EVENT_POSTMESSAGE_RECEIVED` | `postmessage-received` |
| `JADEVIEW_EVENT_JAPK_LOAD_FAILED` | `japk-load-failed` | `JADEVIEW_EVENT_SECOND_INSTANCE` | `second-instance` |
| `JADEVIEW_EVENT_MENU_COMMAND` | `menu-command` | `JADEVIEW_EVENT_THEME_CHANGED` | `theme-changed` |
| `JADEVIEW_EVENT_TRAY_EVENT` | `tray-event` | `JADEVIEW_EVENT_UPDATE_WINDOW_ICON` | `update-window-icon` |
| `JADEVIEW_EVENT_WEBVIEW_DID_FINISH_LOAD` | `webview-did-finish-load` | `JADEVIEW_EVENT_WINDOW_ALL_CLOSED` | `window-all-closed` |
| `JADEVIEW_EVENT_WEBVIEW_DID_START_LOADING` | `webview-did-start-loading` | `JADEVIEW_EVENT_WINDOW_BLURRED` | `window-blurred` |
| `JADEVIEW_EVENT_WEBVIEW_DOWNLOAD_COMPLETED` | `webview-download-completed` | `JADEVIEW_EVENT_WINDOW_BOUNDS` | `window-bounds` |
| `JADEVIEW_EVENT_WEBVIEW_PAGE_FAVICON_UPDATED` | `webview-page-favicon-updated` | `JADEVIEW_EVENT_WINDOW_CLOSED` | `window-closed` |
| `JADEVIEW_EVENT_WEBVIEW_PAGE_TITLE_UPDATED` | `webview-page-title-updated` | `JADEVIEW_EVENT_WINDOW_DESTROYED` | `window-destroyed` |
| `JADEVIEW_EVENT_MENU_ERROR` | `menu-error` | | |
| | | `JADEVIEW_EVENT_WINDOW_FOCUSED` | `window-focused` |
| | | `JADEVIEW_EVENT_WINDOW_FULLSCREEN` | `window-fullscreen` |
| | | `JADEVIEW_EVENT_WINDOW_MOVED` | `window-moved` |
| | | `JADEVIEW_EVENT_WINDOW_RESIZED` | `window-resized` |
| | | `JADEVIEW_EVENT_WINDOW_STATE_CHANGED` | `window-state-changed` |
