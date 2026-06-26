---
title: JADE:// Custom Protocol
order: 0
group:
  title: "Core Concepts"
  order: 2
---

# JADE:// Custom Protocol: Loading Local Web Resources

JadeView registers a custom protocol handler via `set_protocol_service_path`, mapping `https://{appname}.local/` to a local directory or JAPK file to enable secure and efficient loading of local resources.

:::warning{title="Important Notice"}
`https://{appname}.local/` is JadeView's internal custom protocol route, not a real HTTP server. It does not listen on any port and runs entirely within the application.
:::

## Prerequisites

- Download `jadeview.dll` and `jadeview.h` from [GitHub Releases](https://github.com/JadeViewDocs/JadeView/releases)
- Basic understanding of the C language

---

## Step 1: Initialize and Set Up the Protocol Service

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

// Window control IPC callbacks
const char* minimize_callback(uint32_t window_id, const char* event_data) {
    minimize_window(window_id);
    return jade_text_create("{\"ok\":true}");
}

const char* maximize_callback(uint32_t window_id, const char* event_data) {
    toggle_maximize_window(window_id);
    return jade_text_create("{\"ok\":true}");
}

const char* close_callback(uint32_t window_id, const char* event_data) {
    close_window(window_id);
    return jade_text_create("{\"ok\":true}");
}

const char* app_ready_callback(uint32_t window_id, const char* event_data) {
    if (window_id == 1 && event_data
        && strcmp(event_data, "success") == 0) {
        printf("JadeView is ready\n");

        // Register window control commands
        register_ipc_handler("minimize-window", minimize_callback);
        register_ipc_handler("toggle-maximize", maximize_callback);
        register_ipc_handler("close-window", close_callback);

        // Set up the local protocol service —— map the ./web directory to https://myapp.local/
        char url_buffer[256];
        int result = set_protocol_service_path(
            "./web",              // local resource directory
            url_buffer,           // output protocol URL buffer
            sizeof(url_buffer)    // buffer size
        );

        if (result == 1) {
            printf("Protocol URL: %s\n", url_buffer);
            // url_buffer content looks like: https://myapp.local/

            WebViewWindowOptions options = {
                .title = "Local Resource Example",
                .width = 800,
                .height = 600,
                .resizable = 1,
                .frame_style = "normal"
            };

            create_webview_window(url_buffer, 0, &options, NULL);
        } else {
            printf("Failed to set up protocol service\n");
        }
    } else {
        printf("Initialization failed: %s\n", event_data ? event_data : "unknown");
    }
    return NULL;
}

int main() {
    // app-ready must be registered before JadeView_init
    jade_on("app-ready", app_ready_callback);

    int result = JadeView_init(
        1,                      // enable_devmod
        NULL,                   // log_path
        NULL,                   // data_directory
        "My App",               // app_name (also used as the protocol subdomain)
        "com.example.myapp",    // app_signature
        0                       // single_instance
    );

    if (result == 0) {
        printf("Initialization failed\n");
        return 1;
    }

    printf("JadeView has started\n");
    return 0;
}
```

---

## Step 2: Create the Frontend Page

Create a `web` folder and an `index.html` in your project directory:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Local Resource Example</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }

        /* Custom title bar */
        .titlebar {
            height: 32px;
            background: #333;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-left: 12px;
            -webkit-app-region: drag;
            user-select: none;
        }
        .titlebar-controls {
            display: flex;
            height: 100%;
        }
        .titlebar-btn {
            -webkit-app-region: no-drag;
            width: 46px;
            height: 100%;
            border: none;
            background: transparent;
            color: #fff;
            cursor: pointer;
            font-size: 14px;
        }
        .titlebar-btn:hover { background: #555; }
        .titlebar-btn.close:hover { background: #e81123; }

        .content {
            flex: 1;
            padding: 20px;
            background: #f5f5f5;
        }
        .btn {
            padding: 8px 16px;
            background: #333;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .btn:hover { background: #555; }
    </style>
</head>
<body>
    <div class="titlebar">
        <span>Local Resource Example</span>
        <div class="titlebar-controls">
            <button class="titlebar-btn" id="minBtn">─</button>
            <button class="titlebar-btn" id="maxBtn">□</button>
            <button class="titlebar-btn close" id="closeBtn">✕</button>
        </div>
    </div>

    <div class="content">
        <h1>JadeView Local Resources</h1>
        <p>This page is loaded from the local file system via the custom protocol.</p>
        <button class="btn" id="testBtn">Send Test Message</button>
        <pre id="result"></pre>
    </div>

    <script>
        // Window control —— send commands to the host process via jade.invoke
        document.getElementById('minBtn').onclick = () => {
            jade.invoke('minimize-window');
        };
        document.getElementById('maxBtn').onclick = () => {
            jade.invoke('toggle-maximize');
        };
        document.getElementById('closeBtn').onclick = () => {
            jade.invoke('close-window');
        };

        // Test IPC communication
        document.getElementById('testBtn').onclick = async () => {
            try {
                const result = await jade.invoke('test-message',
                    { text: 'Hello from page!', time: Date.now() });
                document.getElementById('result').textContent =
                    JSON.stringify(result, null, 2);
            } catch (e) {
                document.getElementById('result').textContent =
                    'Error: ' + e.message;
            }
        };

        // Listen for pushes from the host process
        jade.on('host-notify', (data) => {
            console.log('Host process notification:', data);
        });
    </script>
</body>
</html>
```

---

## Custom Protocol in Detail

### How It Works

1. `set_protocol_service_path("./web", url_buffer, size)` registers the local directory with the protocol route
2. The returned URL has the format `https://{app_name}.local/`
3. When the WebView accesses `https://myapp.local/index.html`, JadeView reads directly from `./web/index.html`
4. The entire process involves no network communication and no port listening, and is completed entirely within the application

### Supported File Types

JadeView automatically sets the correct MIME type based on the file extension, with no manual configuration required. Supported types include:

- HTML, CSS, JavaScript
- Images (PNG, JPG, GIF, SVG, WebP, etc.)
- Fonts (WOFF, WOFF2, TTF, etc.)
- Data formats such as JSON and XML

### SPA Routing Support

The protocol service has a built-in SPA fallback: when the requested path does not match any file, it automatically returns `index.html`, providing seamless support for History-mode routing in frontend frameworks.

---

## Combining with JAPK

In addition to local directories, `set_protocol_service_path` also supports JAPK files:

```c
// Load a JAPK file
char url_buffer[256];
set_protocol_service_path("app.japk", url_buffer, sizeof(url_buffer));
// url_buffer → https://myapp.local/
create_webview_window(url_buffer, 0, &options, NULL);
```

Communication inside a JAPK also uses `jade.invoke` / `jade.on`, with no additional configuration required.

> More information: [JAPK Resource Bundle](/en-US/docs/api/japk) | [Loading from Memory](/en-US/docs/api/japk-load-memory)

---

## Notes

1. **Not an HTTP server**: `https://{appname}.local/` does not listen on any port and cannot be accessed by external browsers
2. **`jade.invoke` requires a CORS whitelist** (v2.1+): if the page is not loaded through the protocol service, you must set the allowed origins in `WebViewSettings.cors_whitelist`
3. **`app_name` determines the subdomain**: the `app_name` parameter of `JadeView_init` is used to generate the domain of the protocol URL
4. **Page path mapping**: `https://myapp.local/css/style.css` → `./web/css/style.css`

> Detailed API: [Core API - Local Protocol Service](/en-US/docs/api#本地协议服务) | [Frontend Communication API](/en-US/docs/api/javascript-api)
