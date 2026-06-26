---
title: Custom Title Bar
order: 2
group:
  title: "Tutorial"
  order: 1
---

# Custom Title Bar

JadeView 2.0 offers two ways to customize the title bar:

1. **`title-overlay`**: Use the built-in title bar button overlay (Windows-only; each button is 45 pixels wide and 32 pixels tall by default)
2. **`no-titlebar`**: Fully custom-draw the title bar and buttons

---

## Option 1: Using title-overlay (Recommended)

`title-overlay` is a Windows-only frame style that provides system-level title bar buttons (minimize/maximize/close), each 45 pixels wide and 32 pixels tall by default, with no implementation needed on your part.

### C Code Example

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

int app_ready_callback(uint32_t window_id, const char* event_type, const char* event_data) {
  if (window_id == 1 && event_data && strcmp(event_data, "success") == 0) {
    // Create the window
    WebViewWindowOptions options = {
      .title = "Custom Title Bar Example",
      .width = 800,
      .height = 600,
      .resizable = 1,
      .frame_style = "title-overlay",  // Use the built-in title bar buttons
      .theme = "System",
    };

    uint32_t new_window_id = create_webview_window(
      "https://your-app.local",
      0,
      &options,
      NULL
    );

    // Optional: customize the title bar overlay style
    set_titlebar_overlay_style(
      new_window_id,
      32,            // Button height
      "#ffffff",    // Icon color
      "#f0f0f0"     // Hover background color
    );
  }
  return 0;
}

int main() {
  jade_on("app-ready", app_ready_callback);
  JadeView_init(1, NULL, NULL, "My App", "com.example.myapp", 0);
  return 0;
}
```

### Front-End HTML/CSS Adaptation

When using `title-overlay`, the page needs to leave room for the title bar area so the buttons don't cover content:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Title bar area - height matches set_titlebar_overlay_style */
    body {
      margin: 0;
      padding: 0;
    }
    .titlebar {
      height: 32px;
      -webkit-app-region: drag; /* Allow dragging to move the window */
      display: flex;
      align-items: center;
      padding: 0 16px;
      background: #2d2d2d;
      color: #fff;
    }

  </style>
</head>
<body>
  <div class="titlebar">
    <span>My App</span>
  </div>

  <div class="content">
    Page content...
  </div>
</body>
</html>
```

---

## Option 2: Full Customization with no-titlebar

In `no-titlebar` mode, you need to implement the complete title bar and window control buttons yourself.

### C Code Example

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

int app_ready_callback(uint32_t window_id, const char* event_type, const char* event_data) {
  if (window_id == 1 && event_data && strcmp(event_data, "success") == 0) {
    // Create a frameless window
    WebViewWindowOptions options = {
      .title = "Fully Custom Title Bar",
      .width = 800,
      .height = 600,
      .resizable = 1,
      .frame_style = "no-titlebar",  // Frameless, no title bar
      .theme = "System",
    };

    uint32_t new_window_id = create_borderless_webview_window(
      "https://your-app.local",
      NULL
    );

    // Get the HWND for additional Win32 operations
    size_t hwnd = get_window_hwnd(new_window_id);
  }
  return 0;
}

int main() {
  jade_on("app-ready", app_ready_callback);
  JadeView_init(1, NULL, NULL, "My App", "com.example.myapp", 0);
  return 0;
}
```

### Front-End Fully Custom Title Bar

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Title bar */
    .titlebar {
      height: 32px;
      background: #2d2d2d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      -webkit-app-region: drag;
      user-select: none;
    }

    .titlebar-title {
      padding: 0 16px;
      color: #fff;
      font-size: 14px;
    }

    /* Window control buttons */
    .titlebar-controls {
      display: flex;
      height: 100%;
    }

    .titlebar-btn {
      -webkit-app-region: no-drag;
      width: 46px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      cursor: pointer;
      transition: background 0.2s;
    }

    .titlebar-btn:hover {
      background: #404040;
    }

    .titlebar-btn.close:hover {
      background: #e81123;
    }

    /* Content area */
    .content {
      flex: 1;
      overflow: auto;
      background: #fff;
    }
  </style>
</head>
<body>
  <!-- Custom title bar -->
  <div class="titlebar">
    <div class="titlebar-title">My App</div>
    <div class="titlebar-controls">
      <div class="titlebar-btn" id="minBtn">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="0" y="5" width="12" height="2" fill="currentColor"/>
        </svg>
      </div>
      <div class="titlebar-btn" id="maxBtn">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="1" y="1" width="10" height="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
        </svg>
      </div>
      <div class="titlebar-btn close" id="closeBtn">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.5"/>
          <line x1="2" y1="10" x2="10" y2="2" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </div>
    </div>
  </div>

  <div class="content">
    Page content...
  </div>

  <script>
    // Window controls - send commands to the main process via jade.invoke
    document.getElementById('minBtn').onclick = () => {
      jade.invoke('minimize-window');
    };

    document.getElementById('maxBtn').onclick = () => {
      jade.invoke('toggle-maximize');
    };

    document.getElementById('closeBtn').onclick = () => {
      jade.invoke('close-window');
    };
  </script>
</body>
</html>
```

### Main Process Side: Registering Window Control Commands

After the renderer process sends a command via `jade.invoke`, the main process needs to register the corresponding callback function with `register_ipc_handler`:

```c
// Window control callbacks
const char* minimize_callback(uint32_t window_id, const char* event_data) {
    minimize_window(window_id);
    return jade_text_create("{\"ok\":true}");
}

const char* toggle_maximize_callback(uint32_t window_id, const char* event_data) {
    toggle_maximize_window(window_id);
    return jade_text_create("{\"ok\":true}");
}

const char* close_callback(uint32_t window_id, const char* event_data) {
    close_window(window_id);
    return jade_text_create("{\"ok\":true}");
}

// Register in the app-ready callback
int app_ready_callback(uint32_t window_id, const char* event_type,
                       const char* event_data) {
    if (window_id == 1 && event_data
        && strcmp(event_data, "success") == 0) {
        // Register window control commands
        register_ipc_handler("minimize-window", minimize_callback);
        register_ipc_handler("toggle-maximize", toggle_maximize_callback);
        register_ipc_handler("close-window", close_callback);

        // ... create the window ...
    }
    return 0;
}
```

---

## Comparison of the Two Approaches

| Feature | `title-overlay` | `no-titlebar` |
|------|-----------------|---------------|
| **Supported platforms** | Windows only | All platforms |
| **Title bar buttons** | Built-in (system style) | Implement yourself |
| **Development difficulty** | Easy | Medium |
| **Style customization** | Partially customizable | Fully customizable |
| **Drag region** | Requires `-webkit-app-region` | Requires `-webkit-app-region` |
| **Getting the HWND** | Not supported | Supported (requires `create_borderless_webview_window`) |
| **Native Windows features** | ✅ Fully preserves Snap Layout, etc. | ⚠️ Implement yourself |

### Recommendations

- If you just want to simply hide the title bar text or use system-style buttons → use `title-overlay`
- If you need to fully preserve native Windows features (Snap Layout, window snapping, etc.) → use `title-overlay`
- If you need to fully customize the title bar appearance, or need Win32 API operations → use `no-titlebar`

---

## About `-webkit-app-region`

Both approaches can use `-webkit-app-region` to implement dragging:

| Property | Description |
|------|------|
| `drag` | This region can be dragged to move the window |
| `no-drag` | This region cannot be dragged (used for buttons and other interactive elements) |

## Notes

1. **Interactive elements**: Buttons, links, and input fields within the title bar must be set to `no-drag`, otherwise they cannot be clicked
2. **Double-click behavior**: Double-clicking a draggable region triggers maximize/restore (system behavior)
3. **`title-overlay`**: Windows-only; no need to implement the title bar buttons yourself
4. **`no-titlebar` + `create_borderless_webview_window`**: Lets you obtain the HWND for use with the Win32 API
