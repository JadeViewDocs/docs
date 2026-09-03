---
title: IPC API
order: 0
group:
  title: Communication & Events
  order: 3
---

# IPC API

**Purpose overview**: The main process uses **`jade_on`** to subscribe to events dispatched by the library (window lifecycle, navigation, script results, etc.); uses **`register_ipc_handler`** to respond to **`jade.invoke('command', data)`** calls from web pages; and uses **`send_ipc_message`** to proactively push messages to the renderer process.

:::info
**2.3 Communication link optimization (public interface unchanged)**: `invoke` and broadcast messages share a single send path, the renderer-process message entry is consolidated into a unified dispatcher, high-frequency small events are batched and merged for sending via microtasks, and full-message cloning is eliminated. The renderer-process `jade.invoke` / `jade.on` call style and the legacy message shape are **fully compatible**, so you get performance gains without changing any code (`invoke` about 5%~20%, broadcast about 20%~60%, high-frequency event message count reduced by about 50%~90%).
:::

---

## Basic Types

<h3 id="ipccallback">Callback type (`IpcCallback`)</h3>

Main-process-side events and **`jade.invoke`** share the same C callback type (consistent with **`JadeView.h`**):

```c
typedef const char *(*IpcCallback)(uint32_t window_id, const char *event_data);
```

#### Parameters

| Parameter | Description |
|------|------|
| `window_id` | **The window associated with the event or request**. For most window events this is the current window id; global events unrelated to any window (such as `app-ready`, `second-instance`, `global-hotkey`, and tray-related events) are mostly **`0`** — refer to the individual sections in [Event Types](/en-US/docs/api/event-types). |
| `event_data` | A **read-only** **UTF-8** string, **null-terminated (`\0`)**. The content is mostly **JSON text**; a few are plain text (such as the error description when `app-ready` fails, or the `crash` error code). It is **only guaranteed valid during this callback's execution**; do not keep the raw pointer after the callback returns. Copy it yourself if you need to retain it. |

#### Return value (`const char *`)

The same function pointer type has different meanings in the two usages:

| Used for | Meaning of return value |
|------|------------|
| Callback registered via **`jade_on(...)`** | See **[`jade_on` and the callback return value](#jade-on-callback-return)** below and [Event Types · Quick Reference](/en-US/docs/api/event-types#ipc-callback-returns) (for interception types: `NULL` allows, a non-null value such as **`(const char *)(uintptr_t)1`** blocks; with the `webview-download-started` special case, etc.). |
| **`register_ipc_handler`** | See **[Return value of `register_ipc_handler`](#register-ipc-handler-return)** below (`NULL` / `(const char *)1` and the like mean default success; any other pointer is the reply body and is freed by the library via `jade_text_free`). |

:::info
Do not **block for a long time** or do heavy work inside the callback, to avoid stalling the GUI / message thread; you can post the work to your own queue and process it asynchronously.
:::

---

## Event Subscription

<h3 id="jade-on">Subscribe to events (`jade_on`)</h3>

**Purpose**: Register a callback by **event name string**; the library calls your `IpcCallback` when the event occurs. **There are two dispatch-thread classes**: **interception events** (`window-closing`, `webview-will-navigate`, `webview-new-window`, `webview-download-started`, and the `enter`/`drop` of `drag-drop`) are called **inline synchronously on the GUI thread**, where the library reads the return value immediately to decide allow/block, so return as quickly as possible; **all other notification events** are dispatched **asynchronously** by a worker thread pool.

```c
uint32_t jade_on(const char *event_name, IpcCallback callback);
```

#### Parameters

| Parameter | Description |
|------|------|
| `event_name` | The event name, **UTF-8**, **null-terminated (`\0`)**, matching the conventions in the docs and pages (such as `app-ready`, `window-closing`, `javascript-result`). |
| `callback` | Of type **`IpcCallback`**; called by the library when the event arrives. See the previous section for the meaning of the parameters. |

#### Return value

| Return value | Meaning |
|--------|------|
| **`> 0`** | The **callback id** of this registration, used by **`jade_off(event_name, callback_id)`** to unregister precisely. |
| **`0`** | Registration failed (null pointer, out of memory, etc., subject to the actual implementation). |

#### Timing and conventions

- **`app-ready`**: Must be registered **before `JadeView_init`**, otherwise you will miss the first ready or failure notification (see [Core API](/en-US/docs/api/index)).
- **Other events**: Generally you can register them after **`app-ready` succeeds** and you start creating windows; for event names and `event_data` shapes, see [Event Types](/en-US/docs/api/event-types).
- **Multiple registrations**: You can register multiple callbacks for the same `event_name`, and each `jade_on` returns a different id; when triggered, the **execution order is implementation-defined** — do not rely on order for mutual-exclusion logic.

<h4 id="jade-on-callback-return">Callback return value convention (`jade_on`)</h4>

For an `IpcCallback` registered via **`jade_on`**, the return value only has semantics on **some events**; for **most notification-only events** the return value can be ignored by the library, and it is **conventional to uniformly write `return NULL;`**.

- **With "intercept / allow" semantics**: such as **`window-closing`**, **`webview-will-navigate`**, **`webview-new-window`** (**non-`NULL` = block**); and **`webview-download-started`** (**only `NULL` = allow the download**, blocked by default). When blocking, it is recommended to write **`return (const char *)(uintptr_t)1;`**.
- **Without interception semantics**: return **`NULL`**.

For the complete list and explanation, see [Event Types · IpcCallback return values](/en-US/docs/api/event-types#ipc-callback-returns).

**About `app-ready`**: **Decide success solely by `window_id == 1`** — on success `event_data` is the JSON `{"ok":true,"message":"success"}`; `window_id == 0` means failure, with `event_data` being a **plain-text** error description (a runtime crash goes through the separate `crash` event, not this one). For parsing, see [Event Types](/en-US/docs/api/event-types). The 2.0 new event names such as `second-instance`, `global-hotkey`, `tray-menu-command`, and `tray-event` are on the same page.

---

### Unsubscribe (`jade_off`)

**Purpose**: Cancel **that single** subscription by **`event_name` + the id returned by `jade_on`**; it will not accidentally remove other callbacks under the same event name.

```c
int32_t jade_off(const char *event_name, uint32_t callback_id);
```

| Parameter | Description |
|------|------|
| `event_name` | The same event name used at registration. |
| `callback_id` | Corresponds to the **return value of `jade_on`** (`> 0`). |

| Return value | Meaning |
|--------|------|
| `1` | Unregistered successfully. |
| `0` | Failed (not found, invalid parameter, etc.). |

---

## Two-way Messages

### Send an IPC message (`send_ipc_message`)

**Purpose**: From the C side, **proactively push a message to the renderer process in a specified window** (type + body); the renderer process receives it with **`jade.on(message_type, ...)`**.

```c
int32_t send_ipc_message(
  uint32_t window_id,
  const char *message_type,
  const char *message_content
);
```

| Parameter | Description |
|------|------|
| `window_id` | The target window id. |
| `message_type` | The type name the renderer process subscribes with, matching the first parameter of `jade.on`. |
| `message_content` | Usually **JSON text**; you may also pass another UTF-8 string per your agreement with the renderer process. |

When the body is particularly large, 2.0 may internally use optimization paths such as chunking/referencing; it is still recommended to keep a **single** send within about **252MB** to avoid memory pressure on WebView2 and the main process.

---

### Register an invocation handler (`register_ipc_handler`)

**Purpose**: Bind a **`channel` name string** to a C callback; when the renderer process calls **`await jade.invoke(channel, payload, options)`**, that **`IpcCallback`** is invoked.

```c
int32_t register_ipc_handler(const char *channel, IpcCallback ipc_cb);
```

| Parameter | Description |
|------|------|
| `channel` | Exactly matches the **first parameter of the renderer process's `jade.invoke`** (case-sensitive). |
| `ipc_cb` | **`IpcCallback`**: `window_id` is the window that initiated the request; `event_data` is generally the request payload (often JSON text). |

| Return value | Meaning |
|--------|------|
| `1` | Registration succeeded. |
| `0` | Registration failed. |

<h4 id="register-ipc-handler-return">Return value convention (`register_ipc_handler`)</h4>

Here the **`IpcCallback` return value represents the reply to the renderer process**, which is **different from the "interception" semantics of `jade_on`**:

- Returning **`NULL`**, **`(const char *)1`**, or another **special address** recognized by the implementation: the library returns the **default success JSON** to the renderer process and will **not** call **`jade_text_free`** on that pointer.
- Returning **another pointer**: it is treated as the **UTF-8 reply body**, and the library calls **`jade_text_free`** after reading it; allocate it with **`jade_text_create`** (see [Tools API](/en-US/docs/api/tools-api)).

In 2.0, the renderer process should use **`jade.invoke(command, payload, { timeout })`**; the legacy **`invokeAsync` has been removed**. For details, see [Frontend Communication API](/en-US/docs/api/javascript-api).
