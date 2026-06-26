---
title: Frontend Communication API
description: Communication between the page and the main process (the jade object)
order: 0
group:
  title: Frontend API
  order: 2
---

# Frontend Communication API

## Overview

**Purpose**: Inside a web page, the global object **`jade`** lets you exchange messages with the external C/C++ main process. Use **`jade.on`** to subscribe to events; use **`jade.invoke`** to have the main process compute something, return a file path, and so on. The page must run in the WebView environment provided by JadeView (including the **built-in address given by `set_protocol_service_path`** or an equivalent loading method); otherwise the `jade` object will not exist.

---

## Communication Methods

### Calling a Main Process Method (`jade.invoke`)

**Purpose**: Like a "**remote call to a main process function**": you pass a command name and data, the main process handles it in `register_ipc_handler`, then returns the result to you asynchronously. Suitable for reading configuration, selecting files, running time-consuming tasks, and so on.

Recommended 2.0 usage:

```javascript
await jade.invoke('commandName', { /* data sent to the main process */ }, { timeout: 5000 });
```

- The second argument can be a string, an object, etc.; the main process usually receives it as JSON text.
- **The third argument is optional**: `timeout` controls how long to wait at most; if omitted, the default timeout is used.
- Internally it is a **two-stage async** flow: more stable for large results or slow tasks; the old **`invokeAsync` has been removed**, so use only **`invoke`**.

---

### Calling Main Process Methods in Bulk (`jade.invokeBatch`)

**Purpose**: Send multiple invoke commands in bulk and wait for them all to complete together.

```typescript
invokeBatch(commands: Array<{
  command: string;
  payload?: any;
  options?: { timeout?: number };
}>): Promise<any[]>
```

**Parameters**

| Parameter | Type | Required | Description |
|------|------|------|------|
| commands | Array | Yes | Array of command objects; each element has the same parameter structure as `invoke` |

**Return value**

A Promise that resolves to an array of results, in one-to-one correspondence with the order of the commands passed in.

**Example**

```javascript
const [path, version] = await jade.invokeBatch([
  { command: 'get_init_path' },
  { command: 'get_version' },
]);
console.log(path, version);

// with parameters
const results = await jade.invokeBatch([
  { command: 'get_init_path' },
  { command: 'open_module', payload: { name: 'settings' } },
  { command: 'slow_cmd', options: { timeout: 10000 } },
]);
```

> Note: invokeBatch internally calls invoke one by one; it is not a single network request. If any command fails, the entire batch fails.

---

### Subscribing to Main Process Messages (`jade.on`)

**Purpose**: Listen for messages pushed from the main process via **`send_ipc_message`**, or for notifications defined within the library (see [Event Types](/en-US/docs/api/event-types) for event names and payload formats).

```javascript
const off = jade.on('eventName', function (payload) {
  // payload is usually an object (the library has already parsed the JSON)
});
// Unsubscribe when no longer needed:
// off();
```

- **First parameter**: a string, matching the `message_type` of `send_ipc_message` on the C side or the event name in the documentation.
- **Second parameter**: a callback whose argument is the parsed data (commonly an object).
- **Return value**: an **unsubscribe function**; once called, this listener no longer receives messages.

---

## Usage Recommendations

### Message Size and Performance

- Do **not** make the data passed in a single call too large; on WebView2 it is recommended to keep it within about **252MB**, as anything larger is prone to crashing or freezing.
- Subscribe only to the events you need, and remember to call **`off()`** when done to avoid leaks and duplicate processing.

### Example

```javascript
const result = await jade.invoke('message', { data: 'test' }, { timeout: 5000 });
```

On the main process side, call `register_ipc_handler` for each `commandName`; see [IPC Communication API](/en-US/docs/api/ipc-api).

---

## Main Process Callback Examples

The following are common `register_ipc_handler` callback implementations for typical commands.

### message Command

```c
const char* message_callback(uint32_t window_id, const char* event_data) {
    printf("Received message command, window ID: %u, data: %s\n", window_id, event_data);

    char result[256];
    snprintf(result, sizeof(result),
        "{\"status\":\"success\",\"message\":\"Received\",\"window_id\":%u}",
        window_id);
    return jade_text_create(result);
}
```

### setBackdrop Command

```c
const char* set_backdrop_callback(uint32_t window_id, const char* event_data) {
    printf("Received setBackdrop, window ID: %u, type: %s\n", window_id, event_data);
    return jade_text_create("{\"success\":true,\"result\":\"Backdrop applied\"}");
}
```

### setTheme Command (Asynchronous Handling)

```c
const char* set_theme_callback(uint32_t window_id, const char* event_data) {
    printf("Received setTheme, window ID: %u, theme: %s\n", window_id, event_data);

    // 1. Return confirmation immediately
    char result[128];
    snprintf(result, sizeof(result),
        "{\"status\":\"success\",\"message\":\"Received, processing asynchronously\"}");

    // 2. Asynchronous processing ... when done, notify the renderer process via send_ipc_message
    send_ipc_message(window_id, "setTheme",
        "{\"theme\":\"Dark\",\"status\":\"completed\"}");

    return jade_text_create(result);
}
```

---

## Complete Example

```javascript
// Set the backdrop during initialization
(async function () {
  try {
    await jade.invoke('setBackdrop', 'mica');
  } catch (error) {
    console.error('Failed to set:', error);
  }
})();

// Listen for window state changes
jade.on('window-state-changed', function (data) {
  console.log('Window state changed:', data);
});

// Handle button click event
document.getElementById('sendBtn').addEventListener('click', async function () {
  const message = document.getElementById('msgInput').value;
  try {
    const result = await jade.invoke('message', message);
    console.log('Sent successfully:', result);
  } catch (error) {
    console.error('Failed to send:', error);
  }
});
```

---

## Frequently Asked Questions

### 1. Call fails with "JadeView API not available"

- **Cause**: the page was not loaded through a protocol supported by JadeView. The frontend API is only available in pages loaded via `set_protocol_service_path` or an equivalent WebView environment.
- **Solution**: make sure to create the window using the protocol URL provided by `set_protocol_service_path`, or use a JAPK page loaded from memory.

### 2. Call fails with a timeout

- Check whether the main process has correctly registered the corresponding IPC handler
- Check whether the command name is spelled correctly (case-sensitive)
- Make sure the `timeout` parameter allows enough time for time-consuming operations

### 3. Events do not fire

- Check whether the `message_type` of `send_ipc_message` on the main process side matches the first parameter of `jade.on`
- Make sure the subscription is set up before the event is sent

### 4. Performance issues

- Reduce unnecessary API calls
- Call the unsubscribe function promptly to release listeners
- Keep the data transferred in a single call within about 252MB
