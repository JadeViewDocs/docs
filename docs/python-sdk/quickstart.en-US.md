---
order: 1
---

# Quick Start

This guide will help you quickly understand how to use the JadeUI Python SDK to create desktop applications.

## Requirements

- Python 3.7+
- Windows 10/11 + WebView2 Runtime
- Linux x64 / arm64 + GTK / WebKitGTK desktop runtime
- Linux x86 and macOS do not have SDK native library support yet

## Install

Install the JadeUI Python SDK via pip:

```bash
pip install jadeui
```

## Basic Usage

### Create Your First App

```python
from jadeui import JadeUIApp, Window

# Create the application instance (singleton pattern)
app = JadeUIApp()

@app.on_ready
def on_ready():
    # Create the window
    window = Window(
        title="Hello JadeUI",
        width=800,
        height=600,
        url="https://example.com"
    )
    window.show()

# Run the application
app.run()
```

### Using a Local Server

Host local web content through `LocalServer`:

```python
from jadeui import JadeUIApp, Window, LocalServer

app = JadeUIApp()
server = LocalServer()

@app.on_ready
def on_ready():
    # Start the local server, hosting the web directory (default)
    url = server.start("myapp")
    # Or specify a directory: server.start("myapp", "./web")
    
    window = Window(
        title="My App",
        width=1024,
        height=768,
        url=f"{url}/index.html"
    )
    window.show()

app.initialize()
app.run()
```

### Simplified API

For simple applications, you can use a more concise approach:

```python
from jadeui import Window, Theme, Backdrop

# Create the window
window = Window(
    title="Local App Example",
    width=800,
    height=600,
    remove_titlebar=True,
    transparent=True,
    theme=Theme.SYSTEM,
)

# Set window properties
window.set_backdrop(Backdrop.MICA)

# Run - automatically detects the web directory and starts the server
window.run()
```

:::success{title="Tip"}
`window.run()` automatically detects the `web` directory under the current directory, starts the local server, and registers the window action handlers. It is suitable for quickly developing simple applications.
:::

### IPC Communication

Use `IPCManager` to enable bidirectional communication between the Python backend and the web frontend:

```python
from jadeui import JadeUIApp, Window, IPCManager

app = JadeUIApp()
ipc = IPCManager()

# Register IPC message handler
@ipc.on("greet")
def handle_greet(window_id, message):
    print(f"Received message: {message}")
    # jade.invoke receives this return value directly
    return f"Hello from Python! You said: {message}"

@app.on_ready
def on_ready():
    window = Window(title="IPC Demo", url="...")
    window.show()

app.initialize()
app.run()
```

Frontend JavaScript code:

```javascript
// Send a message to Python and wait for the return value
const result = await jade.invoke('greet', 'Hello from JavaScript!');
console.log('Response received:', result);

// Receive messages pushed from Python
jade.on('response', function(content) {
    console.log('Push received:', content);
});
```

:::warning{title="Linux IPC Size Limit"}
JadeView v2.3.0-beta.10 fixes the earlier Linux payload-loss and invoke-Promise issues, so the `jade.invoke(channel, payload)` pattern above works normally. Keep one payload below `1000KB`; use chunks, temporary files, or resource URLs for larger content. Run `examples/linux_demo` from the SDK repository to validate a target environment.
:::

### Using the Routing System

`Router` provides a backend-driven routing system that automatically generates an application frame with a sidebar:

```python
from jadeui import JadeUIApp, Router, Events
import json

app = JadeUIApp()
router = Router()

# Register page routes
router.page("/", "pages/home.html", title="Home", icon="🏠")
router.page("/dashboard", "pages/dashboard.html", title="Dashboard", icon="📊")
router.page("/users", "pages/users.html", title="User Management", icon="👥")
router.page("/user/:id", "pages/user.html", title="User Details", show_in_nav=False)
router.page("/settings", "pages/settings.html", title="Settings", icon="⚙️")
router.page("/about", "pages/about.html", title="About", icon="😄")

# IPC handler (accessed via router.ipc)
@router.ipc.on("get_users")
def get_users(window_id, data):
    users = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]
    router.ipc.send(window_id, "get_users:response", json.dumps(users))
    return 1

@app.on_ready
def on_ready():
    # Mount the router and create the window
    window = router.mount(
        title="My App",
        web_dir="web",
        width=1100,
        height=750,
        sidebar_width=200,
        theme="system"
    )
    
    # Listen for window events
    window.on(Events.WINDOW_RESIZED, lambda data: print(f"Window resized: {data}"))

app.initialize()
app.run()
```

## Window Configuration Options

The `Window` class supports rich configuration options:

```python
from jadeui import Window, Theme, Backdrop, RGBA

window = Window(
    title="Configuration Example",
    width=1024,
    height=768,
    url="https://example.com",
    
    # Window properties
    resizable=True,           # Allow resizing
    remove_titlebar=False,    # Remove the native title bar
    transparent=False,        # Enable transparency
    always_on_top=False,      # Keep window on top
    
    # Theme
    theme=Theme.SYSTEM,       # Light, Dark, System
    
    # Position and size constraints
    x=-1, y=-1,               # Center display (-1 means centered)
    min_width=400,
    min_height=300,
    max_width=0,              # 0 means no limit
    max_height=0,
    
    # Initial state
    maximized=False,
    fullscreen=False,
    focus=True,
    hide_window=False,
    
    # Window controls
    maximizable=True,
    minimizable=True,
    
    # Background color
    background_color=RGBA(255, 255, 255, 255),
    
    # WebView settings
    autoplay=False,           # Allow media autoplay
    disable_right_click=False,
    user_agent=None,          # Custom User-Agent
    preload_js=None,          # Preload JavaScript
    allow_fullscreen=True,    # Allow page JS to call the fullscreen API (requires Jadeui 0.2.1)
    
    # Advanced options (v1.1+)
    borderless=False,         # Borderless mode (requires 0.2.1+)
    content_protection=False, # Content protection, prevents screen capture (requires 1.1+, conflicts with minimizable/maximizable)
    
    # PostMessage communication (requires 1.0.2+)
    postmessage_whitelist="https://example.com,https://trusted.com",  # Origins allowed to receive PostMessage

    # v2.3 window integration
    skip_taskbar=False,      # Keep out of taskbar / Alt-Tab
    no_activate=False,       # Do not steal focus when shown or clicked
)
```

:::warning{title="Parameter Conflict Notes"}
- `borderless=True` cannot be used together with `remove_titlebar` or `transparent`
- `content_protection=True` cannot be used together with `minimizable` or `maximizable`
:::

## Event Handling

### Application Events

```python
@app.on_ready
def on_ready():
    print("Application is ready")

@app.on_window_all_closed
def on_all_closed():
    print("All windows have been closed")
```

### Window Events

It is recommended to use the typed event decorators, which provide IDE type hints:

```python
from jadeui import Window

window = Window(title="Event Demo")

# Listen for window resize - parameters are automatically parsed
@window.on_resized
def on_resize(width: int, height: int):
    print(f"Window resized: {width} x {height}")

# Listen for window move
@window.on_moved
def on_move(x: int, y: int):
    print(f"Window position: ({x}, {y})")

# Listen for focus events
@window.on_focused
def on_focus():
    print("Window gained focus")

@window.on_blurred
def on_blur():
    print("Window lost focus")

# Listen for page load completion
@window.on_page_loaded
def on_page_load(url: str):
    print(f"Page loaded: {url}")

# Listen for the window about to close - returning True prevents closing
@window.on_closing
def on_closing():
    if has_unsaved_changes:
        return True  # Prevent closing
    return False

# Listen for file drop
@window.on_file_dropped
def on_file_drop(files: list, x: int, y: int):
    print(f"Dropped {len(files)} files at position ({x}, {y})")
    for path in files:
        print(f"  - {path}")

# Listen for file download events (requires JadeView 0.3.1+)
@window.on_download_started
def on_download(url: str, filename: str):
    print(f"Download started: {filename}")
    print(f"Download URL: {url}")
    # Returning True prevents the download
    if filename.endswith(".exe"):
        print("Blocking executable file download")
        return True
    return False

# Listen for fullscreen state changes (requires JadeView 1.2+)
@window.on_fullscreen_changed
def on_fullscreen(is_fullscreen: bool):
    print(f"Fullscreen state: {is_fullscreen}")

window.show()
```

You can also use the `Events` constants:

```python
from jadeui import Window, Events

window = Window(title="Event Demo")

# Parameters are automatically parsed; no need for json.loads
@window.on(Events.WINDOW_RESIZED)
def on_resize(width: int, height: int):
    print(f"Window resized: {width} x {height}")

@window.on(Events.WINDOW_MOVED)
def on_move(x: int, y: int):
    print(f"Window position: ({x}, {y})")

window.show()
```

:::warning{title="file-drop Event Note"}
Using the `file-drop` event takes over the WebView's drag-and-drop event handling, **causing the frontend to be unable to receive native drag events**. If you need to handle drag events in the frontend with JavaScript (such as `ondrop`), do not register this event.

Native drag/drop subscription in JadeView v2.3.0-beta.10 can segfault on Linux, so the SDK blocks `drag-drop` / `file-drop` registration by default. The following example currently applies to Windows only.
:::

### File Download Events

Use the `on_download_started` decorator to listen for file download events in the WebView (requires JadeView 0.3.1+):

```python
from jadeui import Window

window = Window(title="Download Demo")

@window.on_download_started
def on_download(url: str, filename: str):
    """
    Triggered when a download starts

    Parameters:
        url: The URL of the downloaded file
        filename: The suggested file name

    Returns:
        True/1: Block the download
        False/0/None: Allow the download (default behavior)
    """
    print(f"Download request: {filename}")
    print(f"Source: {url}")
    
    # Example: block executable file downloads
    if filename.endswith((".exe", ".msi", ".bat")):
        print("Blocked executable file download")
        return True
    
    # Example: block downloads from untrusted domains
    if "untrusted-site.com" in url:
        return True
    
    return False  # Allow the download

window.show()
```

:::success{title="Version Requirement"}
The `on_download_started` event requires JadeView DLL 0.3.1 or higher. Please make sure your DLL version meets the requirement.
:::

## Window Operations

```python
window = Window(title="My App")
window.show()

# Window state control
window.minimize()           # Minimize
window.maximize()           # Maximize/restore
window.focus()              # Gain focus
window.hide()               # Hide
window.close()              # Close

# Fullscreen control (requires JadeView Jadeui 0.2.1)
window.set_fullscreen(True)   # Enter fullscreen
window.set_fullscreen(False)  # Exit fullscreen
window.toggle_fullscreen()    # Toggle fullscreen state
print(window.is_fullscreen)   # Query fullscreen state
print(window.is_maximized)    # Query maximized state

# Property settings
window.set_title("New Title")
window.set_size(1280, 720)
window.set_position(100, 100)
window.center()
window.set_always_on_top(True)
window.set_skip_taskbar(True)       # v2.3: hide from taskbar / Alt-Tab
window.set_no_activate(True)        # v2.3: do not steal focus
window.set_level("topmost")         # v2.3: topmost / normal / bottom / desktop
window.set_resizable(False)
print(window.get_hwnd())            # v2.3: regular windows can return HWND

# Theme and appearance
window.set_theme(Theme.DARK)
window.set_backdrop(Backdrop.MICA)  # Windows 11 effect

# WebView operations
window.load_url("https://example.com")
window.execute_js("console.log('Hello from Python!')")
```

## v2.3 Feature Quick Tour

### YAML Storage

`Storage` writes YAML files under JadeView's `data_directory`. Use it after `app.on_ready` so that the native layer and data directory are ready.

```python
from jadeui import Storage

Storage.set("settings", "user.name", "JadeUI")
Storage.set("settings", "window", {"width": 1024, "height": 768})

print(Storage.get("settings", "user.name"))
print(Storage.keys("settings", "window"))
print(Storage.length("settings", "window"))
```

### System Integration

```python
import sys
from jadeui import System

print(System.jadeview_version())
print(System.webview_version())
print(System.get_login_autostart())
print(System.ntp_now())  # UTC milliseconds; returns None on network failure

icon_url = System.get_file_icon(sys.executable, size=64, window_id=window.id or 0)
```

### Tray, Hotkeys, and Clipboard

```python
from jadeui import Clipboard, HotKey, Tray

Clipboard.write_text("Hello JadeUI")
print(Clipboard.read_text())

HotKey.register("Ctrl+Alt+J", lambda: window.flash(3))

tray = Tray()
tray.set_tooltip("JadeUI App")
tray.set_menu([
    {"key": "show", "label": "Show window", "on_click": lambda: window.show()},
    {"key": "quit", "label": "Quit", "dangerous": True, "on_click": app.quit},
])
tray.show()
```

### Drag and Drop

The low-level JadeView 2.x event is `drag-drop`, with `enter`, `over`, `drop`, and `leave` phases. `file-drop` remains as a compatibility wrapper for the final drop only.

:::warning{title="Linux beta.10"}
Do not register the events below on Linux for now. The SDK raises `NotImplementedError` to prevent a native JadeView GUI/WebKit-thread segfault. Windows remains supported.
:::

```python
@window.on("drag-drop")
def on_drag_drop(data):
    print(data["type"], data.get("paths", []))

@window.on_file_dropped
def on_file_drop(files, x, y):
    print(files, x, y)
```

## Complete Example

The following is a complete application example:

```python
from jadeui import JadeUIApp, Window, IPCManager, LocalServer, Theme, Backdrop
import json

app = JadeUIApp()
ipc = IPCManager()
server = LocalServer()

# IPC handler
@ipc.on("get-data")
def handle_get_data(window_id, message):
    data = json.loads(message)
    print(f"Data requested: {data}")
    
    response = {
        "status": "success",
        "items": ["Python", "JadeUI", "WebView"]
    }
    return json.dumps(response)

# Window action handler
@ipc.on("windowAction")
def handle_window_action(window_id, action):
    window = Window.get_window_by_id(window_id)
    if window:
        if action == "close":
            window.close()
        elif action == "minimize":
            window.minimize()
        elif action == "maximize":
            window.maximize()
    return 1

@app.on_ready
def on_ready():
    # Start the local server (hosts the web directory by default)
    url = server.start("demo")
    
    # Create the window
    window = Window(
        title="JadeUI Demo",
        width=1024,
        height=768,
        url=f"{url}/index.html",
        remove_titlebar=True,
        transparent=True,
        theme=Theme.SYSTEM,
    )
    
    # Use typed decorators to listen for events (parameters are automatically parsed)
    @window.on_resized
    def on_resize(width: int, height: int):
        print(f"Window resized: {width} x {height}")
    
    @window.on_file_dropped
    def on_file_drop(files: list, x: int, y: int):
        print(f"Dropped {len(files)} files")
        for path in files:
            print(f"  - {path}")
    
    window.show()
    window.set_backdrop(Backdrop.MICA)

if __name__ == "__main__":
    app.initialize()
    app.run()
```

## Dialog API

Use the `Dialog` class to display system dialogs (requires JadeView 1.3.0+):

```python
from jadeui import Dialog

# Show a message box
Dialog.show_message_box(
    window_id=1,
    title="Confirm",
    message="Are you sure you want to delete?",
    type_="warning",
    buttons=["Delete", "Cancel"]
)

# Open file dialog
Dialog.show_open_dialog(
    window_id=1,
    title="Select Image",
    filters=[{"name": "Images", "extensions": ["png", "jpg", "gif"]}],
    properties=["openFile", "multiSelections"]
)

# Save file dialog
Dialog.show_save_dialog(
    window_id=1,
    title="Save Document",
    default_path="document.txt",
    filters=[{"name": "Text Files", "extensions": ["txt"]}]
)

# Convenience methods
Dialog.confirm("Are you sure you want to quit?")
Dialog.alert("Operation succeeded!")
Dialog.error("Failed to save file!")
```

## System Notifications

Use the `Notification` class to display system notifications (requires JadeView 1.3.0+, Windows 10+ only):

```python
from jadeui import Notification, Events

# Configure application information (optional)
Notification.config(app_name="My App", icon="C:/app/icon.ico")

# Listen for button click events
@Notification.on(Events.NOTIFICATION_ACTION)
def on_action(data):
    action_id = data.get("arguments")  # The action parameter you passed in
    button = data.get("action")        # Button index
    print(f"Button clicked: {button}, action: {action_id}")

# Show a simple notification
Notification.show("Tip", "Operation completed")

# Show a notification with buttons
Notification.with_buttons(
    "Download Complete",
    "video.mp4 has been downloaded",
    "Open",
    "Ignore",
    action="download_123"  # Used to identify it in the callback
)

# Convenience methods
Notification.info("Title", "Content")
Notification.success("Title", "Content")
Notification.warning("Title", "Content")
Notification.error("Title", "Content")
```

## Next Steps

- See the [API Reference](./reference/methods) for detailed API documentation
- Learn about [Application Packaging](./packaging) to package your app into a standalone .exe file
- Explore the `Router` class to build complex multi-page applications
- Learn to use the Mica/Acrylic effects of Windows 11
