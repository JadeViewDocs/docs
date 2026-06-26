---
title: IPC Between Main and Renderer Processes
order: 1
group:
  title: "Core Concepts"
  order: 2
---

# Two-Way IPC Communication Between Main and Renderer Processes

JadeView 2.0 provides a two-way IPC communication mechanism between the main process and the renderer process, built on a custom protocol. The renderer process exchanges data efficiently with the main process (C/C++) code through `jade.invoke` / `jade.on`.

:::info{title="Terminology Reference (Consistent with Electron)"}
JadeView uses the same process-model terminology as Electron:

- **Main process**: the exe you write in C/C++ that loads the JadeView DLL. It is responsible for creating windows, registering IPC handlers, and pushing events, corresponding to the native interfaces `register_ipc_handler` / `send_ipc_message` / `jade_on`.
- **Renderer process**: the web page (HTML/CSS/JS) running inside the WebView, which communicates with the main process through the global `jade` object, corresponding to `jade.invoke` / `jade.on`.

Throughout this document, "main process / renderer process" refers to these two sides.
:::

## Communication Model

```
Renderer process (JavaScript)          Main process (C/C++)
     │                                   │
     ├─ jade.invoke('command', data) ───►│ register_ipc_handler callback
     │                                   │ → returns jade_text_create(...)
     │  ◄────── Promise resolve ────────┤
     │                                   │
     ├─ jade.on('event', callback) ─────►│ register listener
     │  ◄── send_ipc_message(event,data)─┤ active push
```

- **Request-response**: renderer process `jade.invoke` → main process `register_ipc_handler` callback → return value returns to the renderer process
- **Event push**: main process `send_ipc_message` → renderer process `jade.on` callback

---

## Renderer Process to Main Process (jade.invoke)

### Renderer Process Code

```javascript
// Call a main-process method and wait for the result
const result = await jade.invoke('get-config', { key: 'theme' });
console.log('Main process returned:', result);

// With a timeout
const data = await jade.invoke('heavy-task', payload, { timeout: 10000 });
```

### Main Process C Code

```c
#include "jadeview.h"

// IPC callback: handles the renderer process's jade.invoke('get-config', ...)
const char* get_config_callback(uint32_t window_id, const char* event_data) {
    printf("Received get-config, window: %u, data: %s\n", window_id, event_data);

    // Processing logic...
    // Return the result to the renderer process (must be allocated with jade_text_create)
    return jade_text_create("{\"theme\":\"dark\",\"lang\":\"zh\"}");
}

// Register in app-ready
const char* app_ready_callback(uint32_t window_id, const char* event_data) {
    if (window_id == 1 && event_data
        && strcmp(event_data, "success") == 0) {
        // Register the IPC handler
        register_ipc_handler("get-config", get_config_callback);

        // Create the window...
    }
    return NULL;
}
```

:::info
The return value of the `register_ipc_handler` callback must be allocated with `jade_text_create`; the library automatically calls `jade_text_free` to release it. Returning `NULL` means returning the default success JSON.
:::

---

## Main Process to Renderer Process (send_ipc_message + jade.on)

### Main Process C Code

```c
// Push an event to the renderer process
void notify_frontend(uint32_t window_id) {
    send_ipc_message(window_id, "data-update",
        "{\"status\":\"ok\",\"timestamp\":123456}");
}
```

### Renderer Process Code

```javascript
// Subscribe to events pushed by the main process
const off = jade.on('data-update', (payload) => {
    console.log('Pushed by main process:', payload);
    // payload is already a parsed object
});

// Unsubscribe when no longer needed
// off();
```

---

## Complete Example

### Renderer Process

```javascript
// 1. Request data from the main process during initialization
(async function() {
    try {
        const config = await jade.invoke('get-config', {});
        console.log('Config:', config);
    } catch (e) {
        console.error('Request failed:', e);
    }
})();

// 2. Subscribe to main-process notifications
jade.on('data-update', (data) => {
    document.getElementById('status').textContent = data.status;
});

// 3. Trigger a main-process operation with a button
document.getElementById('btn').onclick = async () => {
    const result = await jade.invoke('do-action',
        { action: 'save', value: 'hello' });
    console.log('Result:', result);
};
```

### Main Process (C)

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

// Handle get-config
const char* get_config_callback(uint32_t window_id, const char* event_data) {
    return jade_text_create("{\"theme\":\"dark\",\"version\":\"2.1\"}");
}

// Handle do-action
const char* do_action_callback(uint32_t window_id, const char* event_data) {
    printf("do-action received: %s\n", event_data);

    // After processing, push the result to the renderer process
    send_ipc_message(window_id, "data-update",
        "{\"status\":\"saved\"}");

    return jade_text_create("{\"ok\":true}");
}

const char* app_ready_callback(uint32_t window_id, const char* event_data) {
    if (window_id == 1 && event_data
        && strcmp(event_data, "success") == 0) {
        // Register the IPC handlers
        register_ipc_handler("get-config", get_config_callback);
        register_ipc_handler("do-action", do_action_callback);

        // Create the window
        WebViewWindowOptions options = {
            .title = "IPC Example",
            .width = 800,
            .height = 600,
            .frame_style = "normal"
        };

        create_webview_window("https://example.com", 0, &options, NULL);
    }
    return NULL;
}

int main() {
    jade_on("app-ready", app_ready_callback);

    int result = JadeView_init(
        1, NULL, NULL,
        "IPC Example",
        "com.example.ipc",
        0
    );
    if (result == 0) {
        printf("Initialization failed\n");
        return 1;
    }

    printf("JadeView started\n");
    return 0;
}
```

---

## Naming Recommendations

- Use **kebab-case** for command names / event names: `get-config`, `data-update`
- The first parameter of the renderer process `jade.invoke` and the first parameter of the main process `register_ipc_handler` must be **exactly identical** (case-sensitive)
- The first parameter of the renderer process `jade.on` and the second parameter of the main process `send_ipc_message` must be **exactly identical**

---

## Notes

1. The return value of the main process `register_ipc_handler` callback must be allocated with `jade_text_create`
2. The renderer process `jade.on` returns an unsubscribe function; call `off()` when no longer needed to prevent leaks
3. It is recommended to keep the data for a single transfer within roughly 252MB
4. The renderer process API is only available on pages loaded via the JadeView protocol (`set_protocol_service_path` or JAPK)

> Detailed API reference: [Frontend Communication API](/en-US/docs/api/javascript-api) | [IPC Communication API](/en-US/docs/api/ipc-api) | [Event Types](/en-US/docs/api/event-types)