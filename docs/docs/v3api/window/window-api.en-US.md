---
title: Create Windows
order: 0
group:
  title: Windows
  order: 1
---

# Create Windows

Create a window with or without a default WebView and configure its initial options.

For WebView-related operations such as page navigation, script execution, DevTools, and printing, see [WebView API](/en-US/docs/v3api/page/webview-api).

For unified interception of web permission requests (camera, microphone, display capture, file access, etc.), see [Web Permission API](/en-US/docs/v3api/page/permission-api).

All of the following functions target a specific **`window_id`** (the integer returned when the window was created). Unless otherwise noted, success is usually `1` and failure is `0`.

***

Configuration starts with `struct_size` / `abi_version`. Initialize with `window_options_default(out, sizeof(*out))`, which returns `JADE_OK` on success; pass `NULL` to creation to use defaults. See [V3 ABI](/en-US/docs/v3api/overview/abi).

Both `create_webview_window` and `create_window` take optional [window features](#window-features-jadewindowfeatures) as their last argument. Use it to configure content protection, saved window positions, and the startup splash.

See [Title Bar](/en-US/docs/v3api/window/titlebar-api), [Window Objects](/en-US/docs/v3api/window/window-objects) and the other window categories for runtime operations.

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
  - `width` / `height` `int32_t` - Initial width and height in logical pixels. On Windows these measure the visible window and define the restored size of a window created maximized.
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
  - `background_material` `string` - Background material at creation (case-insensitive). `NULL` means `default`. Add `_keepActive` to retain the material on focus loss, for example `mica_keepActive`. See [available materials and requirements](/docs/v3api/window/theme-management).
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
| `splash` | `const struct JadeSplashOptions*` | `NULL` | Windows startup splash with a logo, background color, loading animation color, and minimum duration. An empty window may show it when its first WebView is attached. See [Startup Splash](/en-US/docs/v3api/window/splash-api). |

### Create an Empty Window (`create_window`)

Creates a native window with no WebView attached. To add page views to it, see [WebView API](/en-US/docs/v3api/page/webview-api).

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

The example configures the following fields:

| Field | Description |
| --- | --- |
| `options.title` | Window title. |
| `options.width`, `options.height` | Initial window width and height. See the window options above for the remaining fields. |
| `splash.struct_size`, `splash.abi_version` | Structure size and `JADE_ABI_VERSION`, used to validate the splash configuration. |
| `splash.logo_path` | Path to the startup splash logo. |
| `splash.minimum_ms` | Minimum splash display time in milliseconds. See [Startup Splash](/en-US/docs/v3api/window/splash-api) for the remaining fields. |
| `features.struct_size`, `features.abi_version` | Structure size and `JADE_ABI_VERSION`, used to validate the window features configuration. |
| `features.auto_save_state` | Set to `1` to save and restore the window position. |
| `features.splash` | Pointer to the splash configuration. See [Window features](#window-features-jadewindowfeatures) for the remaining fields. |

`create_webview_window` takes the page URL, parent Window ID, window options, WebView settings, and window features in that order. This example passes `0` for a top-level window and `NULL` for default WebView settings. A `window_id` of `0` means the request failed. Otherwise, pass it to `get_default_webview` to obtain the default WebView ID.

You can get the default WebView ID as soon as creation is accepted. Wait for the window to reach Ready before operating on its native handle, and for the load event before accessing page content.

### Create a Frameless Window

Initialize `WebViewWindowOptions`, set `options.noframe` to `1`, and call `create_webview_window`. Pass WebView settings and window features as needed.

```c
WebViewWindowOptions options;
if (window_options_default(&options, sizeof options) != JADE_OK) return;
options.noframe = 1;
uint32_t window_id = create_webview_window(url, 0, &options, webview_settings, features);
```

To put several views in one window, attach extra WebViews with `add_webview` / `add_webview_to_window` from the [WebView API](/en-US/docs/v3api/page/webview-api).

***
