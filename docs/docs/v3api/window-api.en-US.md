---
title: Window API
order: 0
group:
  title: Windows & Views
  order: 1
---

# Window API

The Window API provides everything you need to create and manage windows, including creating windows, resizing, setting themes, and more.

For WebView-related operations such as page navigation, script execution, DevTools, and printing, see [WebView API](/en-US/docs/v3api/webview-api).

For unified interception of web permission requests (camera, microphone, display capture, file access, etc.), see [Web Permission API](/en-US/docs/v3api/permission-api).

All of the following functions target a specific **`window_id`** (the integer returned when the window was created). Unless otherwise noted, success is usually `1` and failure is `0`.

***

Configuration starts with `struct_size` / `abi_version`. Initialize with `window_options_default(out, sizeof(*out))`, which returns `JADE_OK` on success; pass `NULL` to creation to use defaults. See [V3 ABI](/en-US/docs/v3api/abi).

Both `create_webview_window` and `create_window` take optional [window features](#window-features-jadewindowfeatures) as their last argument. Use it to configure content protection, saved window positions, and the startup splash.

## Creating Windows

`default` uses the system frame and caption; `BarOverlay` adds a title-bar button overlay that reserves only the button rectangles, not page height — custom headers must leave space. Both styles show left navigation buttons; Back appears only when there is history. Configure button colors and height with `set_titlebar_style`.

Non-default `background_material` values require Windows 11: set them before the window is shown and the WebView is created, and use a transparent page background to see the material. Linux and Windows 10 reject them; a failed system setting puts the window into a failed state.

### Create a Window with Its Default WebView

Creates a native Window with a default WebView. The system frame and title bar are enabled by default. Set `options.noframe` to create a frameless window.

```c
uint32_t create_webview_window(const char* url, uint32_t parent_window_id, const struct WebViewWindowOptions* options, const struct WebViewSettings* webview_settings, const struct JadeWindowFeatures* features);
```

**Parameters:**

- `url` `string` - The URL or local protocol address to open first
- `parent_window_id` `uint32_t` - Parent window; `0` means a top-level window
- `options` `const struct WebViewWindowOptions*` (optional) – Window appearance and behavior. Pass `NULL` to use defaults.

  **WebViewWindowOptions options:**
  - `struct_size` and `abi_version` `uint32_t` - Both are filled by `window_options_default`.
  - `title` `string` - The text shown in the window's title bar
  - `width` `int32_t` - Initial width (pixels)
  - `height` `int32_t` - Initial height (pixels)
  - `resizable` `int32_t` - Whether the user can resize the window by dragging its edges with the mouse
  - `title_bar_style` `const char*` - `default` for the system title bar, `hidden` to hide it, or `BarOverlay` for overlaid caption buttons. `NULL` selects the default.
  - `noframe` `int32_t` - Borderless: `1` uses the existing borderless implementation, `0` keeps the system frame; borderless takes precedence over the system title bar
  - `transparent` `int32_t` - Whether to use a transparent background (depends on the WebView and system capabilities)
  - `background_color` `string` - Window background color string (e.g. hexadecimal with a `#`)
  - `always_on_top` `int32_t` - Whether to keep the window always on top
  - `theme` `string` - Light / Dark / follow system (`Light`, `Dark`, `System`)
  - `maximized` `int32_t` - Whether to start maximized
  - `maximizable` `int32_t` - Whether the maximize button in the title bar is enabled
  - `minimizable` `int32_t` - Whether the minimize button in the title bar is enabled
  - `x` `int32_t` - X coordinate of the window's top-left corner; **setting both to -1 lets the system center it for you**
  - `y` `int32_t` - Y coordinate of the window's top-left corner; **setting both to -1 lets the system center it for you**
  - `min_width` `int32_t` - Minimum allowed width; `0` usually means no limit
  - `min_height` `int32_t` - Minimum allowed height; `0` usually means no limit
  - `max_width` `int32_t` - Maximum allowed width; `0` usually means no limit
  - `max_height` `int32_t` - Maximum allowed height; `0` usually means no limit
  - `fullscreen` `int32_t` - Whether to start in fullscreen
  - `focus` `int32_t` - Whether to grab keyboard focus after opening
  - `hide_window` `int32_t` - When non-zero, create the window but don't show it (good for loading first, then calling `show`)
  - `use_page_icon` `int32_t` - Default `0`. When enabled, a detected page favicon updates the window icon.
  - `skip_taskbar` `int32_t` - Whether to keep the window out of the taskbar / Alt-Tab (`0` = no, `1` = yes). appended at the end of the struct to keep field order compatible (use `set_window_skip_taskbar` at runtime, see "Window Flags & Level" below)
  - `no_activate` `int32_t` - Whether to avoid stealing focus: neither clicking nor showing the window activates it (`0` = no, `1` = yes). appended at the end of the struct to keep field order compatible (use `set_window_no_activate` at runtime, see "Window Flags & Level" below)
  - `titlebar_back` `int32_t` - Windows Back button enabled: `0/1`, default `1`; shared by default caption and BarOverlay
  - `titlebar_refresh` `int32_t` - Windows Refresh button enabled: `0/1`, default `1`; shared by default caption and BarOverlay
  - `titlebar_icon` `int32_t` - Default-caption window icon visible: `0/1`, default `1`; does not affect the taskbar icon
  - `background_material` `string` - Background material at creation: `default` / `mica` / `micaAlt` / `acrylic`; `NULL` means default
- `webview_settings` `WebViewSettings*` (optional) - Web page behavior configuration; pass `NULL` to use defaults

  **WebViewSettings options:**
  - `autoplay` `int32_t` - Whether media is allowed to autoplay
  - `background_throttling` `int32_t` - Windows: `0` and `2` use the engine default; `1` disables background timer throttling via a WebView2 browser argument. Linux rejects `1` and `2`
  - `allow_right_click` `int32_t` - Whether to allow the web page's right-click menu. `0` = disabled, `1` = allowed; unset (or passing `NULL` for the whole `webview_settings`) defaults to allowed
  - `user_agent` `string` - Custom User-Agent
  - `preload_js` `string` - A snippet of JS to inject before the page loads
  - `allow_fullscreen` `int32_t` - Whether the fullscreen API is allowed within the web page
  - `postmessage_allowed_origins` `string` - A whitelist that determines **whether the page's** **`postMessage`** **calls are forwarded to the main process**, given as **a comma- or semicolon-separated UTF-8 string** (usually close to the page's `origin`, e.g. `https://example.com`). When matching, the library passes if `event.origin` **equals** the string, or if one of the comma- or semicolon-separated allowed origins matches exactly, or an entry is `*`. If the pointer is **`NULL`/unset**: under the current implementation, **no origin is allowed through** (i.e. you won't receive `postmessage-received`). **Built-in static pages loaded via** **`set_protocol_service_path`** **skip the whitelist** in the implementation and are always able to receive
  - `cors_allowed_origins` `string` - CORS origin whitelist, a comma- or semicolon-separated list of domains (e.g. `"http://198.18.0.1:8001, http://localhost:3000"`).
    - Exact origin matching is used; `*` allows all origins. On Windows, when unset (`NULL`) or empty, the custom-protocol IPC path allows any Origin, including remote pages; set the whitelist explicitly to restrict it. Linux local HTTPS ignores this field and enforces the per-view origin and random credentials instead.
      :::warning
      The following structures are supported
      :::
  - `password_autofill` `int32_t` - Whether to enable account/password autofill. `0` = disabled, `1` = enabled.
  - `form_autofill` `int32_t` - Whether to enable general form autofill (name/address/phone, etc.). `0` = disabled, `1` = enabled.
  - `incognito` `int32_t` - Whether to run in incognito/private browsing mode. `0` = normal mode, `1` = incognito mode. Page rendering becomes slower when enabled.
  - `disable_clipboard` `int32_t` - Whether to disable clipboard read/write permissions. `0` = allowed, `1` = disabled.
  - `proxy_url` `string` - Proxy URL; supports HTTP and SOCKS5 proxies (e.g. `"http://127.0.0.1:7890"` or `"socks5://127.0.0.1:1080"`). `NULL` means no proxy is used.
  - `focused` `int32_t` - Whether the WebView automatically gains focus initially. `0` = does not gain focus, `1` = autofocus (default `1`).
  - `profile_name` `string` - appended at the end of the struct. `NULL` or an empty string uses the default profile; a non-empty string names an environment that isolates cookies, LocalStorage, IndexedDB, and cache. On Linux a named profile is exclusive per view (including incognito and remote-initial-page views): a second live WebView with the same name fails to create. The name must be at most 64 characters, contain only letters, digits, `.`, `_`, `-`, or spaces, and must not start or end with `.` or a space; invalid names fall back to the default profile.
  - `devtools` `int32_t` - DevTools: `0` follows global `devmod`, `1` enable for this view, `2` disable for this view
- `features` `const struct JadeWindowFeatures*` (optional) – [Window features](#window-features-jadewindowfeatures). Pass `NULL` to leave all optional features disabled.

**Return value:**

- `> 0` - The window id; the window may actually be drawn slightly later, which you can pair with events such as `window-created`
- `0` - Failure, for example calling it before `app-ready`

***

### Window features (`JadeWindowFeatures`)

Pass this structure as the final `features` argument. `content_protection` and `auto_save_state` have moved here from `WebViewWindowOptions`.

```c
typedef struct JadeWindowFeatures {
    uint32_t struct_size;
    uint32_t abi_version;
    int32_t content_protection;
    int32_t auto_save_state;
    const struct JadeSplashOptions* splash;
} JadeWindowFeatures;
```

Zero-initialize the structure, then set its size, ABI version, and the features you want to enable. The creation function reads this configuration, including the splash and logo, before returning.

| Field | C type | Default | Description |
| --- | --- | --- | --- |
| `struct_size` | `uint32_t` | Required | Set to `sizeof(JadeWindowFeatures)`. |
| `abi_version` | `uint32_t` | Required | Set to `JADE_ABI_VERSION`. |
| `content_protection` | `int32_t` | `0` | Nonzero enables Windows content protection. Call `set_content_protection` to change it after creation. |
| `auto_save_state` | `int32_t` | `0` | Nonzero saves the position in `window_state.yaml` in the app data directory and restores it on creation with the same Window ID. Size and maximized state come from the current options. |
| `splash` | `const struct JadeSplashOptions*` | `NULL` | Windows startup splash with a logo, background color, loading animation color, and minimum duration. An empty window may show it when its first WebView is attached. See [Startup Splash](/en-US/docs/v3api/splash-api). |

### Create an Empty Window (`create_window`)

Creates a native window with no WebView attached. To add page views to it, see [WebView API](/en-US/docs/v3api/webview-api).

```c
uint32_t create_window(uint32_t parent_window_id, const struct WebViewWindowOptions* options, const struct JadeWindowFeatures* features);
```

- `parent_window_id` `uint32_t` — parent Window ID; pass `0` when there is no parent
- `options` `const struct WebViewWindowOptions*` (optional) – The same window options used by `create_webview_window`. Pass `NULL` to use defaults.
- `features` `const struct JadeWindowFeatures*` (optional) – [Window features](#window-features-jadewindowfeatures). Pass `NULL` to leave all optional features disabled.
- **Return value**: `uint32_t`; non-zero is the accepted Window ID

---

### Create a Window with Optional Features

Call this after receiving `app-ready`.

```c
WebViewWindowOptions options;
if (window_options_default(&options, sizeof options) != JADE_OK) return;
options.title = "JadeView";
options.width = 960;
options.height = 640;

JadeSplashOptions splash = {0};
splash.struct_size = sizeof splash;
splash.abi_version = JADE_ABI_VERSION;
splash.logo_path = "assets/logo.png";
splash.minimum_ms = 700;

JadeWindowFeatures features = {0};
features.struct_size = sizeof features;
features.abi_version = JADE_ABI_VERSION;
features.auto_save_state = 1;
features.splash = &splash;

uint32_t window_id = create_webview_window(url, 0, &options, NULL, &features);
if (window_id == 0) return;
uint32_t view_id = get_default_webview(window_id);
```

You can get the default WebView ID as soon as creation is accepted. Wait for the window to reach Ready before operating on its native handle, and for the load event before accessing page content.

### Create a Frameless Window

Set the initialized `options.noframe` field to `1` and call `create_webview_window`. When migrating from `create_borderless_webview_window`, keep passing the same WebView settings and window features.

```c
WebViewWindowOptions options;
if (window_options_default(&options, sizeof options) != JADE_OK) return;
options.noframe = 1;
uint32_t window_id = create_webview_window(url, 0, &options, webview_settings, features);
```

To put several views in one window, attach extra WebViews with `add_webview` / `add_webview_to_window` from the [WebView API](/en-US/docs/v3api/webview-api).

***

### Get Window Handle

When working in C/C++, an HWND is required to pass a window to other Win32 APIs (such as SetWindowPos or child control attachment).

The function returns the HWND of a ready Windows window. It returns `0` if the window is not ready or the platform does not expose an HWND.

```c
size_t get_window_hwnd(uint32_t window_id);
```

**Parameters**:

- `window_id` `uint32_t` – Target window ID

***

### Get Window ID

Retrieve the Jadeview window ID from its window handle

```c
uint32_t get_window_id(size_t hwnd);
```

**Parameters**:

- `hwnd` `int32_t` – Target window handle

### Specify the Default WebView (`set_default_webview`)

```c
int32_t set_default_webview(uint32_t window_id, uint32_t webview_id);
```

Points the window's default association at the given view. `window_id` is a Window ID and `webview_id` is a WebView ID. After the association is cleared, check the `default_webview_id` field of `get_window_state`.

***

### List All WebViews of a Window (`get_window_webviews` / `free_webview_id_array`)

```c
int32_t get_window_webviews(uint32_t window_id, struct WebViewIdArray* out_array);
void free_webview_id_array(struct WebViewIdArray* array);
```

The result comes back in a `WebViewIdArray`; you must call `free_webview_id_array` to release the internal array when done.

```c
typedef struct WebViewIdArray {
  const uint32_t *ids;
  size_t count;
} WebViewIdArray;
```

***

### Query the Parent Window (`get_webview_parent_window_id`)

```c
uint32_t get_webview_parent_window_id(uint32_t webview_id);
```

Takes a WebView ID and returns the Window ID that owns it.

***

### Query Object State (`get_window_state` / `get_webview_state`)

```c
int32_t get_window_state(uint32_t window_id, struct JadeObjectState* out);
int32_t get_webview_state(uint32_t webview_id, struct JadeObjectState* out);
```

The two functions take a Window ID and a WebView ID respectively, and write into the same struct:

```c
typedef struct JadeObjectState {
  uint32_t kind;
  uint32_t state;
  uint32_t parent_window_id;
  uint32_t default_webview_id;
  int32_t error_code;
} JadeObjectState;
```

| Field | C type | Meaning |
| --- | --- | --- |
| `kind` | `uint32_t` | Object kind (Window / WebView) |
| `state` | `uint32_t` | Lifecycle state, see the table below |
| `parent_window_id` | `uint32_t` | Owning window of a WebView; not applicable to Window objects |
| `default_webview_id` | `uint32_t` | Current default view of the window; `0` when cleared |
| `error_code` | `int32_t` | Error code when the object entered a failed state |

Object lifecycle state constants (`include/JadeView.h`):

| Constant | Value | Meaning |
| --- | --- | --- |
| `JADE_STATE_RESERVED` | 1 | Slot reserved |
| `JADE_STATE_CONFIGURED` | 2 | Configured |
| `JADE_STATE_CREATING` | 3 | Creating |
| `JADE_STATE_READY` | 4 | Native instance usable |
| `JADE_STATE_CLOSING` | 5 | Closing |
| `JADE_STATE_DESTROYING` | 6 | Destroying |
| `JADE_STATE_DESTROYED` | 7 | Destroyed |
| `JADE_STATE_FAILED` | 8 | Failed |
| `JADE_STATE_CRASHED` | 9 | Crashed |

> Request results use a separate `1 accepted / 2 waiting / 3 succeeded / 4 failed / 5 cancelled` numbering — see [Core API](/en-US/docs/v3api/index). Do not mix the two.

***

## Position, Size, and Title

### Set the Window Title

Changes the text shown in the window's title bar (which can differ from the `<title>` in the HTML).

```c
int32_t set_window_title(uint32_t window_id, const char* title);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `title` `string` - The new window title

***

### Set the Window Size

Changes the window's width and height in pixels.

```c
int32_t set_window_size(uint32_t window_id, int32_t width, int32_t height);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `width` `int32_t` - The new width (pixels)
- `height` `int32_t` - The new height (pixels)

***

### Set the Window Position

Changes the window's position on the screen in pixels.

```c
int32_t set_window_position(uint32_t window_id, int32_t x, int32_t y);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `x` `int32_t` - The new X coordinate
- `y` `int32_t` - The new Y coordinate

***

### Get Window Position and Size (`get_window_bounds`)

```c
int32_t get_window_bounds(uint32_t window_id, char* buffer, int32_t buffer_size);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `buffer` `char*` - Output buffer
- `buffer_size` `int` - Buffer size

**Return value:** `1` = success, with the buffer written as JSON `{"x":0,"y":0,"width":800,"height":600}`; `0` = failure

***

## Visibility and Focus

### Show or Hide the Window

Shows or hides the window (visibility changes other than minimizing).

```c
int32_t set_window_visible(uint32_t window_id, int32_t visible);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `visible` `int32_t` - Non-`0` shows, `0` hides

***

### Give the Window Focus

Gives the window keyboard focus.

```c
int32_t set_window_focus(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

***

### Set the Window Always on Top

Whether to keep the window on top so it isn't covered by other normal windows.

```c
int32_t set_window_always_on_top(uint32_t window_id, int32_t always_on_top);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `always_on_top` `int32_t` - Non-`0` pins it on top, `0` unpins it

***

### Set Ignore Cursor Events (`set_window_ignore_cursor_events`)

Sets whether the window ignores mouse events (mouse pass-through), suitable for floating window / overlay scenarios.

```c
int32_t set_window_ignore_cursor_events(uint32_t window_id, int32_t ignore);
```

- **Parameters**: `window_id`, `ignore` (`1` = ignore mouse events / pass-through, `0` = normal)
- **Return value**: `1` = success, `0` = failure

***

## Titlebar Components (`set_titlebar_components`)

Windows only. Each call sets all five flags; every flag must be `0` or `1`.

```c
int32_t set_titlebar_components(uint32_t window_id, int32_t back,
    int32_t refresh, int32_t icon, int32_t minimize, int32_t maximize);

set_titlebar_components(window_id, 1, 1, 1, 1, 1);
```

- `back=1` shows Back only when the WebView has history; `back=0` always hides it.
- `refresh` shows Refresh in the default caption and `BarOverlay`. Refresh reloads the current page and is disabled while loading.
- `icon` controls the window icon in the default caption, not the actual window or taskbar icon. `BarOverlay` does not draw an icon but keeps the flag for switching back.
- `minimize` / `maximize` match the creation options `minimizable` / `maximizable`; they do not affect Close.
- Creation options `titlebar_back` / `titlebar_refresh` / `titlebar_icon` default to `1`. Runtime calls update them, and the settings survive title-bar style changes.
- Left-hand buttons appear in `title_bar_style=default` and `BarOverlay`. `BarOverlay` reserves only the button rectangles, so custom page headers must leave space for them.
- Title text is unaffected. Button colors are configured with `set_titlebar_style`.

Call after the window is ready. Returns `1` when queued, `0` on rejection; use `jade_last_error_code/message` for the cause. Non-Windows platforms and flags outside `0/1` are errors.

```python
window.set_titlebar_components(back=True, refresh=True, icon=True, minimize=True, maximize=True)
```

## Window Flags & Level

For scenarios such as side docks, floating panels, desktop widgets, and launchers: keep the window out of the taskbar / Alt-Tab, avoid stealing focus while it stays resident, or push the window down to the desktop wallpaper layer.

### Skip the Taskbar / Alt-Tab (`set_window_skip_taskbar`)

Hides the window from the taskbar and the Alt-Tab switcher; commonly used for floating tool windows and widgets. You can also set it at creation time via `WebViewWindowOptions.skip_taskbar`.

```c
int32_t set_window_skip_taskbar(uint32_t window_id, int32_t skip);
```

- **Parameters**: `window_id`; `skip` (`1` = skip the taskbar / Alt-Tab, `0` = restore)
- **Return value**: `1` = success, `0` = failure

:::info{title="Platform Implementation"}
Windows: adds `WS_EX_TOOLWINDOW` and removes `WS_EX_APPWINDOW`; Linux: GTK `skip-taskbar-hint`.
:::

***

### Do Not Steal Focus (`set_window_no_activate`)

Keeps the window from gaining activation focus when clicked or shown, suitable for resident floating panels (clicking it won't interrupt your typing elsewhere). You can also set it at creation time via `WebViewWindowOptions.no_activate`.

```c
int32_t set_window_no_activate(uint32_t window_id, int32_t no_activate);
```

- **Parameters**: `window_id`; `no_activate` (`1` = do not steal focus, `0` = restore)
- **Return value**: `1` = success, `0` = failure

:::info{title="Platform Implementation"}
Windows: `WS_EX_NOACTIVATE` (`SetWindowLongPtr`); Linux: GTK `accept-focus=false`.
:::

***

### Set the Window Level (`set_window_level`)

Sets which layer the window sits on in one call — more flexible than plain "always on top": you can push the window below all others, or even pin it to the desktop wallpaper layer as a widget.

```c
// level: "topmost" | "normal" | "bottom" | "desktop"
int32_t set_window_level(uint32_t window_id, const char* level);
```

- **Parameters**: `window_id`; `level` `string` - the level string; see the table below
- **Return value**: `1` = success, `0` = failure

| level     | Behavior                                                                                       | Implementation                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `topmost` | On top, above normal windows                                                                   | `set_always_on_top(true)` (cross-platform)                                                               |
| `normal`  | Normal layer; cancels topmost / bottom                                                         | Clears always-on-top / always-on-bottom                                                                  |
| `bottom`  | Below other windows                                                                            | `set_always_on_bottom(true)` (cross-platform)                                                            |
| `desktop` | Pinned to the desktop wallpaper layer (only visible after minimizing all windows; widget-like) | First `bottom`; on Windows parents to `Progman` / `WorkerW`, on Linux sets GTK `WindowTypeHint::Desktop` |

:::warning{title="Platform Differences"}
`topmost` / `normal` / `bottom` are stable cross-platform; `desktop` (wallpaper layer) is best-effort, depends on window manager behavior, and is recommended to be verified on a real machine. If parenting fails, it at least degrades to `bottom` (still below all windows).
:::

***

## Window State

### Minimize the Window

Sends the window to the taskbar.

```c
int32_t minimize_window(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

***

### Toggle the Maximized State

Toggles between maximized and restored.

```c
int32_t toggle_maximize_window(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

***

### Query Whether Maximized

Queries whether the window is currently maximized.

```c
int32_t is_window_maximized(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

**Return value:**

- `1` - Currently maximized
- `0` - Currently not maximized

***

### Set Fullscreen

Enters or exits fullscreen (filling the monitor, not just maximizing). The request takes effect asynchronously; you can also listen for the `window-fullscreen` event.

```c
int32_t set_window_fullscreen(uint32_t window_id, int32_t fullscreen);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `fullscreen` `int32_t` - Non-`0` enters fullscreen, `0` exits fullscreen

***

### Query Whether the Window Is Minimized (`is_window_minimized`)

```c
int32_t is_window_minimized(uint32_t window_id);
```

- **Parameters**: `window_id` `uint32_t`
- **Return value**: `1` = minimized, `0` = not

***

### Query Whether the Window Is Visible (`is_window_visible`)

```c
int32_t is_window_visible(uint32_t window_id);
```

- **Parameters**: `window_id` `uint32_t`
- **Return value**: `1` = visible, `0` = not visible

***

### Query Whether the Window Is Focused (`is_window_focused`)

```c
int32_t is_window_focused(uint32_t window_id);
```

- **Parameters**: `window_id` `uint32_t`
- **Return value**: `1` = focused, `0` = not

***

### Query Whether the Window Is Fullscreen (`is_window_fullscreen`)

```c
int32_t is_window_fullscreen(uint32_t window_id);
```

- **Parameters**: `window_id` `uint32_t`
- **Return value**: `1` = fullscreen, `0` = not

***

## Window Constraints

### Set the Window Minimum Size (`set_window_min_size`)

```c
int32_t set_window_min_size(uint32_t window_id, int32_t width, int32_t height);
```

- **Parameters**: `window_id`, `width` (minimum width), `height` (minimum height)
- **Return value**: `1` = success, `0` = failure

***

### Set the Window Maximum Size (`set_window_max_size`)

```c
int32_t set_window_max_size(uint32_t window_id, int32_t width, int32_t height);
```

- **Parameters**: `window_id`, `width` (maximum width), `height` (maximum height)
- **Return value**: `1` = success, `0` = failure

***

### Set Whether the Window Is Resizable (`set_window_resizable`)

```c
int32_t set_window_resizable(uint32_t window_id, int32_t resizable);
```

- **Parameters**: `window_id`, `resizable` (`1` = resizable, `0` = not)
- **Return value**: `1` = success, `0` = failure

***

### Enable or Disable the Window

When a window is disabled, the user cannot click the controls on it (like the grayed-out window behind a modal dialog); pass non-`0` to restore it.

```c
int32_t set_window_enabled(uint32_t window_id, int32_t enabled);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `enabled` `int32_t` - Non-`0` enables, `0` disables

***

## Appearance and Style

### Change the Window Frame at Runtime (`set_window_frame`)

Dynamically changes the window's frame style without recreating the window.

```c
int32_t set_window_frame(uint32_t window_id, int32_t noframe, const char* title_bar_style);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
  - `title_bar_style` `const char*` - `default` for the system title bar, `hidden` to hide it, or `BarOverlay` for overlaid caption buttons. `NULL` selects the default.
  - `noframe` `int32_t` - Borderless: `1` uses the existing borderless implementation, `0` keeps the system frame; borderless takes precedence over the system title bar

***

### Set the Title Bar Style (`set_titlebar_style`)

Windows only. Sets the height and button colors for both the default caption and `BarOverlay`.

```c
int32_t set_titlebar_style(uint32_t window_id, int32_t height,
    const char* background_color, const char* foreground_color,
    const char* button_background_color,
    const char* button_hover_background_color, const char* button_hover_foreground_color);
```

| Parameter | Meaning |
| --- | --- |
| `window_id` | Target Window ID, not a WebView ID |
| `height` | `-1` keeps the current value; `0` restores the mode default; custom heights are 20–100 DIP; values outside this range are rejected |
| `background_color` | Caption background, default caption only |
| `foreground_color` | Shared color for title text and normal button icons. Follows the theme by default. The title and unhovered buttons are dimmed when the window is inactive |
| `button_background_color` | Normal background of all buttons; transparent by default |
| `button_hover_background_color` | Hover background of buttons other than Close |
| `button_hover_foreground_color` | Hover icon color of buttons other than Close |

Colors accept `#RRGGBB`, `#RRGGBBAA`, `rgb(r,g,b)` and `rgba(r,g,b,a)` (`a` in `0`–`1`). Each call updates all colors. Pass `NULL` or an empty string to restore the window theme default. An invalid color rejects the whole update. Close keeps its red hover background and white glyph.

`BarOverlay` does not draw the caption background or title, but retains their settings for switching back to the default caption. Styles survive frame changes and are removed when the Window is destroyed.

Overlay controls belong to the Window (even empty ones) and survive navigation, zoom and default WebView destruction. They reserve no page height — keep content clear of both button groups. Controls hide in fullscreen and return on exit. The host EXE must declare Windows 8 or newer in its manifest.

Returns `1` when accepted or `0` when rejected; use `jade_last_error_code/message` for details. Non-Windows platforms return a platform error.

```python
window.set_titlebar_style(
    height=40,
    background_color="#202124",
    foreground_color="#F5F5F5",
    button_background_color="#00000000",
    button_hover_background_color="#3367D6",
    button_hover_foreground_color="#FFFFFF",
)
```

In Python, pass `None` or `""`, or omit a color argument to restore its default.

***

### Set the Window Light/Dark Theme

Controls whether the window and WebView use the light theme, dark theme, or follow the system theme.

For more detailed information, see [Theme Management](/en-US/docs/v3api/theme-management).

```c
int32_t set_window_theme(uint32_t window_id, const char* theme);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `theme` `string` - Theme string; available values: `Light`, `Dark`, `System`

***

### Get the Current Window Theme

Queries the theme currently used by the window.

```c
int32_t get_window_theme(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

**Return value:**

- `1` - Dark
- `0` - Light

The `System` theme is resolved to `1` / `0` based on the current system light/dark setting; returns `0` if the window does not exist or the theme is unknown.

***

### Set the Window Backdrop Material

Sets system backdrop materials such as Mica and Acrylic on Windows 11.

For available strings, see [Theme Management](/en-US/docs/v3api/theme-management).

```c
int32_t set_window_backdrop(uint32_t window_id, const char* backdrop_type);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `backdrop_type` `string` - Backdrop material type

:::warning{title="Platform Differences"}
**Windows 11 only**. Linux (WebKitGTK) has no system material equivalent — the call is a no-op, returns `0`, and has no visual effect. If you need a translucent / solid background, use `set_window_background_color` or the window's `transparent` + `background_color` options.
:::

***

### Set the Window Background Color

Sets the window's background color (hexadecimal string).

```c
int32_t set_window_background_color(uint32_t window_id, const char* background_color_hex);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `background_color_hex` `string` - Background color hexadecimal string, e.g. `#FF0000`

***

### Request a Redraw

Notifies the system to repaint the client area (rarely needs to be called manually).

```c
int32_t request_redraw(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

***

## Taskbar Effects

### Set the Taskbar Progress Bar (`set_window_progress`)

Displays a progress bar on the taskbar button (e.g. download progress, install progress, etc.).

```c
int32_t set_window_progress(uint32_t window_id, int32_t progress, int32_t state);
```

- **Parameters**:
  - `window_id` `uint32_t`
  - `progress` `int` - Progress value (0–100)
  - `state` `int` - State: `0`=no progress, `1`=normal, `2`=paused (yellow), `3`=error (red), `4`=indeterminate
- **Return value**: `1` = success, `0` = failure

:::warning
Windows platform only.
:::

***

### Flash the Taskbar Icon (`flash_window`)

Flashes the taskbar icon to attract the user's attention (e.g. when a message arrives).

```c
int32_t flash_window(uint32_t window_id, uint32_t count);
```

- **Parameters**: `window_id` `uint32_t`; `count` `uint32_t` - Number of flashes, `0` = stop flashing
- **Return value**: `1` = success, `0` = failure

:::warning
Windows platform only.
:::

***

## Closing and Counting

### Close the Window

Initiates closing; if the page registered a `beforeunload` handler and the user chooses to stay, closing may be deferred or canceled, depending on the WebView and the page script.

```c
int32_t close_window(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

#### Close Flow

All close methods — `window.close()`, the title-bar close button and Alt+F4 — share one flow:

1. Dispatch `window-closing` first (the host can intercept it; return a non-null pointer from the callback to block closing — see [Event Types](/en-US/docs/v3api/event-types));
2. Close the window and dispatch `window-closed`;
3. When the last window closes, dispatch `window-all-closed`.

:::info{title=Notes}
- The title-bar close button can be intercepted by the `window-closing` callback, like `window.close()` and Alt+F4.
- `close_window()` uses "programmatic close" semantics and **bypasses `window-closing`**, closing the window directly.
:::

**Close source and page URL:** the `event_data` of the `window-closing` callback now distinguishes the source — `{"source":"system"}` means user-initiated (Alt+F4, system close button, title-bar close button); `{"source":"frontend","url":"<page's current URL>"}` means initiated by the frontend `window.close()`. The page URL is read directly from the WebView's current address by JadeView, not taken from a value the page reports.

**Fallback:** if a window is destroyed for any reason without going through the normal close flow, `window-closed` (and `window-all-closed` when all windows are closed) is still emitted afterward and the window state is cleaned up, so the host will not miss the close notification.

***

### Get the Window Count

Queries how many windows are still open in the current JadeView.

```c
uint32_t get_window_count(void);
```

Maximized or fixed-size windows retain the title-bar buttons.
