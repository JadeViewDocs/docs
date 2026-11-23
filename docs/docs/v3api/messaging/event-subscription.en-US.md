---
title: Event Subscription
order: 0
group:
  title: Communication & Events
  order: 3
---

# Event Subscription

The library dispatches events to the main process through two independent subscription mechanisms:

| Mechanism | Entry points | How the event is identified | What the callback receives |
|-----------|--------------|-----------------------------|----------------------------|
| Named events | `jade_on` / `jade_off` | Event name string (`app-ready`, `window-closing`, …) | Source ID + string payload |
| Typed subscription | `on_app_event` / `on_window_event` / `on_webview_event` | Event type constant (`JADE_EVENT_*`) | Pointer to a `JadeEvent` struct |

Either mechanism can receive the same event. Pick based on what you need: if you only want the JSON payload, named events are simpler; if you need the source kind, sequence number, request ID, error code, or binary payloads, use typed subscriptions.

For the list of events and the shape of `event_data`, see [Event Types](/en-US/docs/v3api/messaging/event-types).

<h2 id="ipccallback">Callback type (`IpcCallback`)</h2>

Named events and `register_ipc_handler` share the same C callback type (identical to `JadeView.h`):

```c
typedef const char* (JADEVIEW_CALL *IpcCallback)(uint32_t, const char*);
```

**Parameters**

| Parameter | Description |
|-----------|-------------|
| First argument | **Real event source ID**: App sources are always `0`, window events use the Window ID, WebView events use the WebView ID. For the `register_ipc_handler` invoke callback this is the **WebView ID that issued the request**. Per-event details are in [Event Types](/en-US/docs/v3api/messaging/event-types). |
| `event_data` | **Read-only** **UTF-8** string, **NUL-terminated**. Usually **JSON text**; a few events use plain text (such as the `app-ready` failure description or the `crash` error code). **Only valid for the duration of this callback** — do not keep the raw pointer after returning; copy it if you need it later. |

**Return value (`const char *`)**

The same function pointer type means different things in the two usages:

| Used for | Meaning of the return value |
|----------|-----------------------------|
| Callback registered via **`jade_on(...)`** | See **[`jade_on` and the callback return value](#jade-on-callback-return)** below and the [Event Types quick reference](/en-US/docs/v3api/messaging/event-types#ipc-callback-returns) (interception events: `NULL` allows, a non-NULL value such as **`(const char *)(uintptr_t)1`** blocks; `webview-download-started` is the exception). |
| **`register_ipc_handler`** | The reply sent to the renderer; see [IPC API · return value convention](/en-US/docs/v3api/messaging/ipc-api#register-ipc-handler-return). |

:::info
Do not **block for long** or do heavy work inside a callback — it stalls the GUI / message thread. Hand it to your own queue instead.
:::

---

## Named Event Subscription

<h3 id="jade-on">Subscribe to an event (`jade_on`)</h3>

Registers a callback by **event name string**; the library invokes `IpcCallback` when the event fires. Interception events are called synchronously on the GUI thread and must return quickly; all other events are dispatched asynchronously.

```c
uint32_t jade_on(const char* event_name, IpcCallback callback);
```

**Parameters**

| Parameter | Description |
|-----------|-------------|
| `event_name` | Event name, **UTF-8**, **NUL-terminated**, matching the names used in this documentation (such as `app-ready`, `window-closing`, `webview-did-finish-load`). |
| `callback` | Type **`IpcCallback`**; invoked by the library when the event fires. Parameter meanings are in the previous section. |

**Return value**

| Value | Meaning |
|-------|---------|
| **`> 0`** | The **callback id** for this registration, used with **`jade_off(event_name, callback_id)`** to unsubscribe precisely. |
| **`0`** | Registration failed (null pointer, out of memory, etc. — see the implementation). |

**When to register**

- **`app-ready`**: must be registered **before `JadeView_init`**, otherwise the very first ready or failure notification is missed (see [Core API](/en-US/docs/v3api)).
- **Other events**: register after **`app-ready` succeeds** and before creating windows. Event names and `event_data` shapes are in [Event Types](/en-US/docs/v3api/messaging/event-types).
- **Multiple registrations**: the same `event_name` may have several callbacks, each `jade_on` returns a different id; **execution order is implementation-defined**, so do not build mutual-exclusion logic on it.

<h4 id="jade-on-callback-return">Callback return value convention (`jade_on`)</h4>

For an `IpcCallback` registered with **`jade_on`**, the return value only carries meaning for **some events**; most notification-only events ignore it, so **`return NULL;`** is the usual choice.

- **With allow / block semantics**: **`window-closing`**, **`webview-will-navigate`**, **`webview-new-window`** (**non-NULL = block**); **`webview-download-started`** (**only `NULL` allows the download** — blocked by default). To block, prefer **`return (const char *)(uintptr_t)1;`**.
- **Without allow / block semantics**: return **`NULL`**.

The full list is in [Event Types · IpcCallback return value](/en-US/docs/v3api/messaging/event-types#ipc-callback-returns).

**About `app-ready`**: this is an App-source event (source ID always `0`), and a successful body is the JSON `{"ok":true,"message":"success"}`. Parse `ok:true` to decide whether startup succeeded — when the init parameters are invalid, `JadeView_init` itself returns `0`. Runtime crashes are reported separately through the `crash` event. See [Event Types](/en-US/docs/v3api/messaging/event-types).

---

### Unsubscribe (`jade_off`)

**Purpose**: cancels **that one** registration by **`event_name` + the id returned by `jade_on`**; other callbacks on the same event name are untouched.

```c
int32_t jade_off(const char* event_name, uint32_t callback_id);
```

| Parameter | Description |
|-----------|-------------|
| `event_name` | The same event name used at registration. |
| `callback_id` | The value returned by **`jade_on`** (`> 0`). |

| Value | Meaning |
|-------|---------|
| `1` | Unsubscribed. |
| `0` | Failed (not found, invalid argument, etc.). |

`jade_off` only guarantees the callback is removed from future dispatch; **it does not wait for a callback that has already started**. To release the callback context immediately after unregistering, use `jade_off_wait` and wait for its request to complete:

```c
uint64_t jade_off_wait(const char* event_name, uint32_t callback_id);
```

`jade_off_wait` blocks callbacks that have not started yet and returns a request ID. Once the request completes, the callback has stopped; do not free `user_data` or other context before that.

- Read and release the result like any other request (`get_request_result` / `free_request_result` / `release_request`); an invalid ID completes with `JADE_INVALID_ID`.
- The request follows the 30-second deadline; a timeout does **not** mean the callback has stopped.
- Do not wait for your own unregistration request inside a callback; returning `0` means the request could not be created.

---

## Typed Subscription

Subscribes by **event type** (a number); the callback receives a structured `JadeEvent` header instead of a bare string. Use it when you need the source kind, the `sequence` / `request_id` / error code, or binary payloads.

### Callback type (`JadeEventCallback`)

```c
typedef void (JADEVIEW_CALL *JadeEventCallback)(const struct JadeEvent*, void*);
```

The first argument is the event pointer, the second is the `user_data` passed at registration. **The event body is only valid for the duration of the callback**; to keep it beyond that you must deep-copy it or call `event_clone`.

### Subscribe to app-level events (`on_app_event`)

```c
uint64_t on_app_event(uint32_t event_type, JadeEventCallback callback, void* user_data);
```

### Subscribe to window events (`on_window_event`)

```c
uint64_t on_window_event(uint32_t window_id, uint32_t event_type, JadeEventCallback callback, void* user_data);
```

`window_id` is a Window ID.

### Subscribe to WebView events (`on_webview_event`)

```c
uint64_t on_webview_event(uint32_t webview_id, uint32_t event_type, JadeEventCallback callback, void* user_data);
```

`webview_id` is a WebView ID.

For `event_type` values see [Event Types · Event Type Constants](/en-US/docs/v3api/messaging/event-types#event-type-constants). All three return a `uint64_t` **subscription ID** for use with `unsubscribe_event`.

### Unsubscribe (`unsubscribe_event`)

```c
uint64_t unsubscribe_event(uint64_t subscription_id);
```

**Returns an unregistration request ID**; unregistering is asynchronous. Three hard rules:

1. Callbacks that have not started are **blocked immediately** after the call;
2. You may free `user_data` or the language-side callback object **only after that request completes**;
3. **Never wait for your own unregistration inside a callback** (native notifications run on one serial thread — this deadlocks).

### Clone and free an event (`event_clone` / `event_free`)

```c
struct JadeEvent* event_clone(const struct JadeEvent* event);
void event_free(struct JadeEvent* event);
```

`event_clone` deep-copies an event so it outlives the callback; release it with `event_free`. Header comment:

> Deep-copies an event that is only valid during the callback. Free the returned value with `event_free`.

### Event header (`JadeEvent`)

```c
typedef struct JadeEvent {
  uint32_t event_type;
  uint32_t source_kind;
  uint64_t source_id;
  uint32_t window_id;
  uint32_t webview_id;
  uint64_t sequence;
  uint64_t request_id;
  uint32_t flags;
  uint32_t state;
  int32_t error_code;
  const char *name;
  const uint8_t *data;
  size_t data_size;
} JadeEvent;
```

| Field | C type | Meaning |
|-------|--------|---------|
| `event_type` | `uint32_t` | Event type (`JADE_EVENT_*`) |
| `source_kind` | `uint32_t` | Source kind (App / Window / WebView) |
| `source_id` | `uint64_t` | Real source ID (the App / Window / WebView ID respectively) |
| `window_id` | `uint32_t` | Associated Window ID |
| `webview_id` | `uint32_t` | Associated WebView ID |
| `sequence` | `uint64_t` | Event sequence number |
| `request_id` | `uint64_t` | Associated request ID |
| `flags` | `uint32_t` | Flags, such as `JADE_EVENT_REPLAY` |
| `state` | `uint32_t` | Object state (`JADE_STATE_*`, see [Window API](/en-US/docs/v3api/window/window-objects)) |
| `error_code` | `int32_t` | Error code for failed events |
| `name` | `const char*` | Event name |
| `data` | `const uint8_t*` | Payload pointer, valid only during the callback |
| `data_size` | `size_t` | Payload length in bytes |

Common lifecycle events support **current-state replay**; replayed events are marked by `JADE_EVENT_REPLAY` in `flags`.

> `app-ready` is App-sourced (`source_id` is always `0`) and its success body is `{"ok":true,"message":"success"}`. **Do not use the source ID to decide whether startup succeeded** — when the init parameters are invalid, `JadeView_init` returns 0 directly.

---

## Dispatch and Threading

Both subscription mechanisms share one serial dispatch thread:

- Delivery is **globally FIFO**, so events from one source stay ordered; **do not rely on cross-source parallelism**.
- Callbacks must **return promptly** — a blocking callback delays all later events. Hand long work to a host thread.
- Interception events (`window-closing`, `webview-will-navigate`, `webview-new-window`, `webview-download-started`, `enter` / `drop` of `drag-drop`) run **synchronously** on the GUI thread, and the library reads the return value immediately to allow or block.
