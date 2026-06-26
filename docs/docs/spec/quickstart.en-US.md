---
title: Quick Start
order: 0
group:
  title: "Tutorial"
  order: 1
---

# Quick Start

This guide helps you get started with JadeView 2.0 and create your first WebView window.

## Prerequisites
### Download the JadeView library
Before you begin, make sure you have:

- Windows 10/11
- The JadeView DLL and header file (`jadeview.dll` and `jadeview.h`), available from GitHub Releases: [https://github.com/JadeViewDocs/JadeView/releases](https://github.com/JadeViewDocs/JadeView/releases)
- A basic understanding of C

### Install WebView2

To use JadeView on Windows you need the Microsoft Edge WebView2 Runtime:

- Download: [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download)
- Detailed guide: [WebView2 Installation Guide](/en-US/docs/spec/webview2-installation)

JadeView is a Rust-based WebView window library designed for performance, security and ease of use.


## Step 1: Initialize the runtime

First, initialize JadeView. This starts the GUI thread and the event loop.

```c
#include "jadeview.h"

int main() {
    // Initialize JadeView
    // Parameters:
    // 1. enable_devmod: developer mode (1 = on, 0 = off)
    // 2. log_path: log file path, NULL means no file
    // 3. data_directory: data root directory, NULL uses the default
    // 4. app_name: app display name
    // 5. app_signature: unique app identifier (at least 6 characters)
    // 6. single_instance: single instance (1 = single, 0 = multiple)
    int result = JadeView_init(
        1,           // enable_devmod
        NULL,        // log_path
        NULL,        // data_directory
        "My App",    // app_name
        "com.example.myapp",  // app_signature
        0            // single_instance
    );
    
    if (result == 0) {
        printf("Initialization failed\n");
        return 1;
    }
    
    printf("Initialized, waiting for the app-ready event...\n");
    
    // Windows can only be created after the app-ready event
    
    return 0;
}
```

**Important: register the `app-ready` event before calling `JadeView_init`, otherwise you may miss it.**

## Step 2: Register the app-ready event

After initialization, register an `app-ready` handler. **Important: windows can only be created after the `app-ready` event fires.**

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

// app-ready event callback
const char* app_ready_callback(uint32_t window_id, const char* event_data) {
    // Check for success
    if (window_id == 1 && event_data && strcmp(event_data, "success") == 0) {
        printf("JadeView is ready, you can now create a window\n");
        
        // Window options
        WebViewWindowOptions options = {
            .title = "My First Window",
            .width = 800,
            .height = 600,
            .resizable = 1,
            .frame_style = "normal",  // normal, no-titlebar, borderless, title-overlay
            .transparent = 0,
            .theme = "System",  // Light, Dark, System
            .maximized = 0,
            .maximizable = 1,
            .minimizable = 1,
            .x = -1,  // -1, -1 means centered
            .y = -1,
            .min_width = 0,
            .min_height = 0,
            .max_width = 0,
            .max_height = 0,
            .fullscreen = 0,
            .focus = 1,
            .hide_window = 0,
            .use_page_icon = 0,
            .content_protection = 0,
            .auto_save_state = 0
        };
        
        // WebView settings
        WebViewSettings settings = {
            .autoplay = 0,
            .background_throttling = 0,
            .disable_right_click = 0,
            .ua = NULL,
            .preload_js = NULL,
            .allow_fullscreen = 0,
            .postmessage_whitelist = NULL
        };
        
        // Create the window
        uint32_t new_window_id = create_webview_window(
            "https://www.example.com",
            0,
            &options,
            &settings
        );
        
        if (new_window_id == 0) {
            printf("Failed to create window\n");
        } else {
            printf("Window created, window ID: %u\n", new_window_id);
        }
    } else {
        printf("JadeView initialization failed: %s\n", event_data ? event_data : "unknown error");
    }
    
    return NULL;
}

int main() {
    // Register the app-ready event first
    jade_on("app-ready", app_ready_callback);
    
    // Initialize
    int result = JadeView_init(
        1,
        NULL,
        NULL,
        "My App",
        "com.example.myapp",
        0
    );
    
    if (result == 0) {
        printf("Initialization failed\n");
        return 1;
    }
    
    printf("Initialized, waiting for the app-ready event...\n");
    
    // Run the message loop (optional; usually not needed when embedding the DLL)
    // run_message_loop();
    
    return 0;
}
```

## Step 3: Use a JAPK asset package

JadeView 2.0 supports the JAPK asset-package format. Here is an example using JAPK:

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

// app-ready event callback
const char* app_ready_callback(uint32_t window_id, const char* event_data) {
    if (window_id == 1 && event_data && strcmp(event_data, "success") == 0) {
        printf("JadeView is ready\n");
        
        // Set the local protocol service path - using a JAPK file
        char url_buffer[256];
        const char* japk_path = "C:\\path\\to\\your\\app.japk";
        
        int32_t protocol_result = set_protocol_service_path(
            japk_path,
            url_buffer,
            sizeof(url_buffer)
        );
        
        if (protocol_result == 1) {
            printf("Protocol URL: %s\n", url_buffer);
            
            // Window options
            WebViewWindowOptions options = {
                .title = "JAPK Example",
                .width = 800,
                .height = 600,
                .resizable = 1,
                .frame_style = "normal"
            };
            
            // Navigate to index.html inside the JAPK
            uint32_t new_window_id = create_webview_window(
                url_buffer,  // use the protocol URL
                0,
                &options,
                NULL
            );
            
            if (new_window_id == 0) {
                printf("Failed to create window\n");
            } else {
                printf("Window created\n");
            }
        }
    }
    return NULL;
}

int main() {
    jade_on("app-ready", app_ready_callback);
    
    int result = JadeView_init(
        1,
        NULL,
        NULL,
        "My App",
        "com.example.myapp",
        0
    );
    
    if (result == 0) {
        printf("Initialization failed\n");
        return 1;
    }
    
    printf("Initialized\n");
    
    return 0;
}
```

## Step 4: Register other events

You can use `jade_on` to register all kinds of events:

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

// window-close event callback
const char* window_close_callback(uint32_t window_id, const char* event_data) {
    printf("Window %u is about to close\n", window_id);
    return NULL;  // return NULL to allow closing; return an error string to prevent it
}

// page-loaded event callback
const char* page_loaded_callback(uint32_t window_id, const char* event_data) {
    printf("Page loaded: %s\n", event_data);
    return NULL;
}

// app-ready event callback
const char* app_ready_callback(uint32_t window_id, const char* event_data) {
    if (window_id == 1 && event_data && strcmp(event_data, "success") == 0) {
        printf("JadeView is ready\n");
        
        // Create the window
        WebViewWindowOptions options = {
            .title = "Event Example",
            .width = 800,
            .height = 600
        };
        
        uint32_t new_window_id = create_webview_window(
            "https://www.example.com",
            0,
            &options,
            NULL
        );
        
        if (new_window_id != 0) {
            // Register window-specific events
            jade_on("window-close", window_close_callback);
            jade_on("page-loaded", page_loaded_callback);
        }
    }
    return NULL;
}

int main() {
    jade_on("app-ready", app_ready_callback);
    
    int result = JadeView_init(
        1,
        NULL,
        NULL,
        "My App",
        "com.example.myapp",
        0
    );
    
    if (result == 0) {
        printf("Initialization failed\n");
        return 1;
    }
    
    printf("Initialized\n");
    
    return 0;
}
```

## Step 5: Clean up resources

When all windows are closed, listen for the `window-all-closed` event and call `cleanup_all_windows` to release resources.

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

// window-all-closed event callback
const char* window_all_closed_callback(uint32_t window_id, const char* event_data) {
    printf("All windows closed, cleaning up resources\n");
    cleanup_all_windows();
    return NULL;
}

const char* app_ready_callback(uint32_t window_id, const char* event_data) {
    if (window_id == 1 && event_data && strcmp(event_data, "success") == 0) {
        printf("JadeView is ready\n");
        
        WebViewWindowOptions options = {
            .title = "Cleanup Example",
            .width = 800,
            .height = 600
        };
        
        create_webview_window(
            "https://www.example.com",
            0,
            &options,
            NULL
        );
    }
    return NULL;
}

int main() {
    jade_on("app-ready", app_ready_callback);
    jade_on("window-all-closed", window_all_closed_callback);
    
    int result = JadeView_init(
        1,
        NULL,
        NULL,
        "My App",
        "com.example.myapp",
        0
    );
    
    if (result == 0) {
        printf("Initialization failed\n");
        return 1;
    }
    
    printf("Initialized\n");
    
    return 0;
}
```

## Complete example

Here is a complete example showing the correct window-creation flow:

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

// window-all-closed event callback
const char* window_all_closed_callback(uint32_t window_id, const char* event_data) {
    printf("All windows closed, cleaning up resources\n");
    cleanup_all_windows();
    return NULL;
}

// app-ready event callback
const char* app_ready_callback(uint32_t window_id, const char* event_data) {
    if (window_id == 1 && event_data && strcmp(event_data, "success") == 0) {
        printf("JadeView is ready, you can now create a window\n");
        
        // Window options
        WebViewWindowOptions options = {
            .title = "My First Window",
            .width = 800,
            .height = 600,
            .resizable = 1,
            .frame_style = "normal",
            .theme = "System",
            .x = -1,
            .y = -1,
            .focus = 1
        };
        
        // Create the window
        uint32_t new_window_id = create_webview_window(
            "https://www.example.com",
            0,
            &options,
            NULL
        );
        
        if (new_window_id == 0) {
            printf("Failed to create window\n");
            return NULL;
        }
        
        printf("Window created, window ID: %u\n", new_window_id);
    } else {
        printf("JadeView initialization failed: %s\n", event_data ? event_data : "unknown error");
    }
    
    return NULL;
}

int main() {
    // Register events
    jade_on("app-ready", app_ready_callback);
    jade_on("window-all-closed", window_all_closed_callback);
    
    // Initialize
    int result = JadeView_init(
        1,                    // enable_devmod
        NULL,                 // log_path
        NULL,                 // data_directory
        "My App",             // app_name
        "com.example.myapp",  // app_signature
        0                     // single_instance
    );
    
    if (result == 0) {
        printf("Initialization failed\n");
        return 1;
    }
    
    printf("Initialized, waiting for the app-ready event...\n");
    
    // Run the message loop (optional when embedding the DLL)
    // run_message_loop();
    
    return 0;
}
```

## More examples

### Borderless window

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

const char* app_ready_callback(uint32_t window_id, const char* event_data) {
    if (window_id == 1 && event_data && strcmp(event_data, "success") == 0) {
        printf("Creating a borderless window\n");
        
        // Use create_borderless_webview_window to create a borderless window
        uint32_t new_window_id = create_borderless_webview_window(
            "https://www.example.com",
            NULL
        );
        
        if (new_window_id != 0) {
            printf("Borderless window created, ID: %u\n", new_window_id);
            
            // Get the HWND for Win32 APIs
            size_t hwnd = get_window_hwnd(new_window_id);
            printf("Window handle: %p\n", (void*)hwnd);
        }
    }
    return NULL;
}

int main() {
    jade_on("app-ready", app_ready_callback);
    
    JadeView_init(1, NULL, NULL, "Borderless Window Example", "com.example.borderless", 0);
    
    return 0;
}
```

### Theme settings

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

const char* app_ready_callback(uint32_t window_id, const char* event_data) {
    if (window_id == 1 && event_data && strcmp(event_data, "success") == 0) {
        printf("Creating a themed window\n");
        
        WebViewWindowOptions options = {
            .title = "Theme Example",
            .width = 800,
            .height = 600,
            .theme = "Dark",  // use dark theme
            .background_color = "#1e1e1e"
        };
        
        uint32_t new_window_id = create_webview_window(
            "https://www.example.com",
            0,
            &options,
            NULL
        );
        
        if (new_window_id != 0) {
            // Switch theme at runtime
            set_window_theme(new_window_id, "Light");
            // Set the window background
            set_window_background_color(new_window_id, "#ffffff");
        }
    }
    return NULL;
}

int main() {
    jade_on("app-ready", app_ready_callback);
    JadeView_init(1, NULL, NULL, "Theme Example", "com.example.theme", 0);
    return 0;
}
```

## Next steps

You've created your first WebView window! Next you can:

- Explore more [Window Management APIs](/en-US/docs/api/window-api)
- Learn about the [Event System](/en-US/docs/api/event-types)
- See how to [set themes](/en-US/docs/api/theme-management)
- Check out [JAPK asset packages](/en-US/docs/api/japk)
- Read the [full API reference](/en-US/docs/api)
