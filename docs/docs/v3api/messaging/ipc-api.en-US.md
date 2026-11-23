---
title: IPC API
order: 2
group:
  title: Communication & Events
  order: 3
---

# IPC API

**What this page covers**: use **`register_ipc_handler`** to answer **`jade.invoke('command', payload)`** coming from the page, and **`send_ipc_message`** to push messages to the renderer process.

Both directions use the `IpcCallback` type; its definition and parameter meanings are in [Event Subscription · Callback type](/en-US/docs/v3api/messaging/event-subscription#ipccallback). To **subscribe to events dispatched by the library** (window lifecycle, navigation, script results, etc.) see [Event Subscription](/en-US/docs/v3api/messaging/event-subscription) — that is not covered here.

## Two-way Messages

### Send an IPC message (`send_ipc_message`)

**Purpose**: From the C side, **proactively push a message to the renderer process in a specified window** (type + body); the renderer process receives it with **`jade.on(message_type, ...)`**.

```c
int32_t send_ipc_message(uint32_t webview_id, const char* message_type, const char* message_content);
```

| Parameter | Description |
|------|------|
| `webview_id` | The target WebView ID. |
| `message_type` | The type name the renderer process subscribes with, matching the first parameter of `jade.on`. |
| `message_content` | Usually **JSON text**; you may also pass another UTF-8 string per your agreement with the renderer process. |

When the body is particularly large, chunking/referencing optimization paths may be used; it is still recommended to keep a **single** send within the **256 MiB** byte budget to avoid memory pressure on WebView2 and the main process.

---

### Register an invocation handler (`register_ipc_handler`)

**Purpose**: Bind a **`channel` name string** to a C callback; when the renderer process calls **`await jade.invoke(channel, payload, options)`**, that **`IpcCallback`** is invoked.

```c
int32_t register_ipc_handler(const char* channel, IpcCallback ipc_cb);
```

| Parameter | Description |
|------|------|
| `channel` | Exactly matches the **first parameter of the renderer process's `jade.invoke`** (case-sensitive). |
| `ipc_cb` | **`IpcCallback`**: the first argument is the **originating WebView ID**; `event_data` is generally the request payload (often JSON text). |

| Return value | Meaning |
|--------|------|
| `1` | Registration succeeded. |
| `0` | Registration failed. |

<h4 id="register-ipc-handler-return">Return value convention (`register_ipc_handler`)</h4>

Here the **`IpcCallback` return value represents the reply to the renderer process**, which is **different from the "interception" semantics of `jade_on`**:

- Returning **`NULL`**, **`(const char *)1`**, or another **special address** recognized by the implementation: the library returns the **default success JSON** to the renderer process and will **not** call **`jade_text_free`** on that pointer.
- Returning **another pointer**: it is treated as the **UTF-8 reply body**, and the library calls **`jade_text_free`** after reading it; allocate it with **`jade_text_create`** (see [Tools API](/en-US/docs/v3api/system/tools-api)).

The renderer process should use **`jade.invoke(command, payload, { timeout })`**. For details, see [Frontend Communication API](/en-US/docs/v3api/frontend/javascript-api).
