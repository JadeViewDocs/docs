---
title: Window API
order: 0
group:
  title: Windows & Views
  order: 1
---

# Window API

The Window API provides everything you need to create and manage windows, including creating windows, resizing, setting themes, and more.

For WebView-related operations such as page navigation, script execution, DevTools, and printing, see [WebView API](/en-US/docs/api/webview-api).

All of the following functions target a specific **`window_id`** (the integer returned when the window was created). Unless otherwise noted, success is usually `1` and failure is `0`.

---

## Creating Windows

### Create a Normal Window

Creates a browser window with a system title bar and border, running a WebView inside it. This is the most common way to create a main window.

```c
uint32_t create_webview_window(
  const char* url,
  uint32_t parent_window_id,
  const WebViewWindowOptions* options,
  const WebViewSettings* webview_settings
);
```

**Parameters:**

- `url` `string` - The URL or local protocol address to open first
- `parent_window_id` `uint32_t` - Parent window; `0` means a top-level window
- `options` `WebViewWindowOptions*` (optional) - Window appearance configuration; pass `NULL` to use defaults

  **WebViewWindowOptions options:**
  - `title` `string` - The text shown in the window's title bar
  - `width` `int32_t` - Initial width (pixels)
  - `height` `int32_t` - Initial height (pixels)
  - `resizable` `int32_t` - Whether the user can resize the window by dragging its edges with the mouse
  - `frame_style` `string` - Whether to use a system border + title bar, border only without title bar, fully frameless, or frameless + a built-in title bar button overlay (`normal` / `no-titlebar` / `borderless` / `title-overlay`). `title-overlay` is Windows-only; it provides a border + no title bar + built-in title bar buttons in the top-right corner, so you don't have to implement window control button functionality yourself
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
  - `use_page_icon` `int32_t` - Whether to use the web page's favicon as the initial window icon (supported on both Windows and Linux; extracting the icon from the exe is Windows only)
  - `content_protection` `int32_t` - Whether to enable screen-recording/screenshot protection (**Windows only**; Linux/X11 has no system-level equivalent — the setting does not error but provides no actual protection)
  - `auto_save_state` `int32_t` - Non-`0`: records the window's **last valid physical top-left coordinates** by **`window_id`** in `window_state.yaml` under the **data directory**; the next time a window is created with the same `window_id`, if that position still falls within the work area of some monitor, the **position is restored** (**width, height, and maximized state still follow the parameters of this creation call**). The state is debounced and written to disk roughly **450ms** after the window stops moving, and is saved once more on close

- `webview_settings` `WebViewSettings*` (optional) - Web page behavior configuration; pass `NULL` to use defaults

  **WebViewSettings options:**
  - `autoplay` `int32_t` - Whether media is allowed to autoplay
  - `background_throttling` `int32_t` - Whether to lower timer/animation frequency to save resources when the window is in the background
  - `disable_right_click` `int32_t` - Whether to disable the web page's right-click menu
  - `ua` `string` - Custom User-Agent
  - `preload_js` `string` - A snippet of JS to inject before the page loads
  - `allow_fullscreen` `int32_t` - Whether the fullscreen API is allowed within the web page
  - `postmessage_whitelist` `string` - A whitelist that determines **whether the page's `postMessage` calls are forwarded to the main process**, given as **a single UTF-8 string** (usually close to the page's `origin`, e.g. `https://example.com`). When matching, the library passes if `event.origin` **equals** the string, or if the **`origin` has the string as a suffix**. If the pointer is **`NULL`/unset**: under the current implementation, **no origin is allowed through** (i.e. you won't receive `postmessage-received`). **Built-in static pages loaded via `set_protocol_service_path`** **skip the whitelist** in the implementation and are always able to receive
  - `cors_whitelist` `string` - Supported in **v2.1+**. CORS origin whitelist, a comma- or semicolon-separated list of domains (e.g. `"http://198.18.0.1:8001, http://localhost:3000"`).
    - Strict exact matching; wildcards are not supported. Once set, only origins in the whitelist may make cross-origin requests to JadeView's internal APIs (invoke, on); if unset (`NULL`) or an empty string, no cross-origin requests are allowed and communication with the program is impossible.
  :::warning
          The following structures are supported starting from v2.2
  :::

  - `autofill` `int32_t` - Whether to enable account/password autofill. `0` = disabled, `1` = enabled.
  - `general_autofill_enabled` `int32_t` - Whether to enable general form autofill (name/address/phone, etc.). `0` = disabled, `1` = enabled.
  - `incognito` `int32_t` - Whether to run in incognito/private browsing mode. `0` = normal mode, `1` = incognito mode. Page rendering becomes slower when enabled.
  - `disable_clipboard` `int32_t` - Whether to disable clipboard read/write permissions. `0` = allowed, `1` = disabled.
  - `proxy_url` `string` - Proxy URL; supports HTTP and SOCKS5 proxies (e.g. `"http://127.0.0.1:7890"` or `"socks5://127.0.0.1:1080"`). `NULL` means no proxy is used.
  - `focused` `int32_t` - Whether the WebView automatically gains focus initially. `0` = does not gain focus, `1` = autofocus (default `1`).

**Return value:**

- `> 0` - The window id; the window may actually be drawn slightly later, which you can pair with events such as `window-created`
- `0` - Failure, for example calling it before `app-ready`

:::warning
2.0 removed the old `remove_titlebar`, `borderless`, `no_center` and other fields. You must use `frame_style` and `x/y=-1` for centering, otherwise the struct will mismatch and **silently misposition**.
:::

---

### Create a Frameless Window

Creates a WebView window with no system title bar, suitable for scenarios such as custom-drawn title bars or floating tool windows. The frame style is fixed to frameless.

```c
uint32_t create_borderless_webview_window(
  const char* url,
  const WebViewSettings* webview_settings
);
```

**Parameters:**

- `url` `string` - The URL or local protocol address to open first
- `webview_settings` `WebViewSettings*` (optional) - Web page behavior configuration; pass `NULL` to use defaults

**Return value:**

A non-`0` return is the `window_id`. Use this id for navigation, IPC, and executing JS, just like with a normal window.

---

### Get the Window Handle

When you need to hand the window over to other Win32 APIs in C/C++ (e.g. SetWindowPos, attaching child controls), you need the HWND.

**Note**: Only windows created with `create_borderless_webview_window` return a valid handle value; a normal `create_webview_window` always returns `0` (the library deliberately does not expose it).

```c
size_t get_window_hwnd(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

---

## Position, Size, and Title

### Set the Window Title

Changes the text shown in the window's title bar (which can differ from the `<title>` in the HTML).

```c
int32_t set_window_title(uint32_t window_id, const char* title);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `title` `string` - The new window title

---

### Set the Window Size

Changes the window's width and height in pixels.

```c
int32_t set_window_size(uint32_t window_id, int32_t width, int32_t height);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `width` `int32_t` - The new width (pixels)
- `height` `int32_t` - The new height (pixels)

---

### Set the Window Position

Changes the window's position on the screen in pixels.

```c
int32_t set_window_position(uint32_t window_id, int32_t x, int32_t y);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `x` `int32_t` - The new X coordinate
- `y` `int32_t` - The new Y coordinate

---

### Get Window Position and Size (`get_window_bounds`)

:::warning
Supported starting from v2.2.
:::

```c
int32_t get_window_bounds(uint32_t window_id, char* buffer, int buffer_size);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `buffer` `char*` - Output buffer
- `buffer_size` `int` - Buffer size

**Return value:** `1` = success, with the buffer written as JSON `{"x":0,"y":0,"width":800,"height":600}`; `0` = failure

---

## Visibility and Focus

### Show or Hide the Window

Shows or hides the window (visibility changes other than minimizing).

```c
int32_t set_window_visible(uint32_t window_id, int32_t visible);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `visible` `int32_t` - Non-`0` shows, `0` hides

---

### Give the Window Focus

Gives the window keyboard focus.

```c
int32_t set_window_focus(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

---

### Set the Window Always on Top

Whether to keep the window on top so it isn't covered by other normal windows.

```c
int32_t set_window_always_on_top(uint32_t window_id, int32_t always_on_top);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `always_on_top` `int32_t` - Non-`0` pins it on top, `0` unpins it

---

### Set Ignore Cursor Events (`set_window_ignore_cursor_events`)

:::warning
Supported starting from v2.2.
:::

Sets whether the window ignores mouse events (mouse pass-through), suitable for floating window / overlay scenarios.

```c
int32_t set_window_ignore_cursor_events(uint32_t window_id, int ignore);
```

- **Parameters**: `window_id`, `ignore` (`1` = ignore mouse events / pass-through, `0` = normal)
- **Return value**: `1` = success, `0` = failure

---

## Window State

### Minimize the Window

Sends the window to the taskbar.

```c
int32_t minimize_window(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

---

### Toggle the Maximized State

Toggles between maximized and restored.

```c
int32_t toggle_maximize_window(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

---

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

---

### Set Fullscreen

Enters or exits fullscreen (filling the monitor, not just maximizing). The request takes effect asynchronously; you can also listen for the `window-fullscreen` event.

```c
int32_t set_window_fullscreen(uint32_t window_id, int32_t fullscreen);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `fullscreen` `int32_t` - Non-`0` enters fullscreen, `0` exits fullscreen

---

### Query Whether the Window Is Minimized (`is_window_minimized`)

:::warning
Supported starting from v2.2.
:::

```c
int32_t is_window_minimized(uint32_t window_id);
```

- **Parameters**: `window_id` `uint32_t`
- **Return value**: `1` = minimized, `0` = not

---

### Query Whether the Window Is Visible (`is_window_visible`)

:::warning
Supported starting from v2.2.
:::

```c
int32_t is_window_visible(uint32_t window_id);
```

- **Parameters**: `window_id` `uint32_t`
- **Return value**: `1` = visible, `0` = not visible

---

### Query Whether the Window Is Focused (`is_window_focused`)

:::warning
Supported starting from v2.2.
:::

```c
int32_t is_window_focused(uint32_t window_id);
```

- **Parameters**: `window_id` `uint32_t`
- **Return value**: `1` = focused, `0` = not

---

### Query Whether the Window Is Fullscreen (`is_window_fullscreen`)

:::warning
Supported starting from v2.2.
:::

```c
int32_t is_window_fullscreen(uint32_t window_id);
```

- **Parameters**: `window_id` `uint32_t`
- **Return value**: `1` = fullscreen, `0` = not

---

## Window Constraints

### Set the Window Minimum Size (`set_window_min_size`)

:::warning
Supported starting from v2.2.
:::

```c
int32_t set_window_min_size(uint32_t window_id, int32_t width, int32_t height);
```

- **Parameters**: `window_id`, `width` (minimum width), `height` (minimum height)
- **Return value**: `1` = success, `0` = failure

---

### Set the Window Maximum Size (`set_window_max_size`)

:::warning
Supported starting from v2.2.
:::

```c
int32_t set_window_max_size(uint32_t window_id, int32_t width, int32_t height);
```

- **Parameters**: `window_id`, `width` (maximum width), `height` (maximum height)
- **Return value**: `1` = success, `0` = failure

---

### Set Whether the Window Is Resizable (`set_window_resizable`)

:::warning
Supported starting from v2.2.
:::

```c
int32_t set_window_resizable(uint32_t window_id, int32_t resizable);
```

- **Parameters**: `window_id`, `resizable` (`1` = resizable, `0` = not)
- **Return value**: `1` = success, `0` = failure

---

### Enable or Disable the Window

When a window is disabled, the user cannot click the controls on it (like the grayed-out window behind a modal dialog); pass non-`0` to restore it.

```c
int32_t set_window_enabled(uint32_t window_id, int32_t enabled);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `enabled` `int32_t` - Non-`0` enables, `0` disables

---

## Appearance and Style

### Change the Window Frame Style at Runtime

Dynamically changes the window's frame style without recreating the window.

```c
int32_t set_window_frame_style(uint32_t window_id, const char* frame_style);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `frame_style` `string` - Frame style string; available values: `normal` (border + title bar), `no-titlebar` (border + no title bar), `borderless` (no border + no title bar), `title-overlay` (border + no title bar + built-in title bar buttons)

---

### Customize the Title Bar Overlay Style (Windows only)

Customizes the appearance of the title bar button overlay for `title-overlay` style windows.

```c
int32_t set_titlebar_overlay_style(
    uint32_t window_id,
    int32_t height,
    const char* icon_color_hex,
    const char* hover_bg_hex
);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `height` `int32_t` - Button height (pixels); pass `0` or a negative number to use the default value 32. Button width is fixed at 45 pixels
- `icon_color_hex` `string` (optional) - Icon color, in the format `#RRGGBB` (e.g. `"#FFFFFF"`); pass `NULL` to use the default color
- `hover_bg_hex` `string` (optional) - Hover background color for non-close buttons, in the format `#RRGGBB` or `#RRGGBBAA` (alpha supported, e.g. `"#00000080"`); pass `NULL` to use the default dark gray

:::info
The close button's hover background color is fixed to red (`#E81123`) and its icon is fixed to white, unaffected by this API.
:::

---

### Set the Window Light/Dark Theme

Controls whether the window and WebView use the light theme, dark theme, or follow the system theme.

For more detailed information, see [Theme Management](/en-US/docs/api/theme-management).

```c
int32_t set_window_theme(uint32_t window_id, const char* theme);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `theme` `string` - Theme string; available values: `Light`, `Dark`, `System`

---

### Get the Current Window Theme

Queries the theme currently used by the window.

```c
int32_t get_window_theme(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

---

### Set the Window Backdrop Material

Sets system backdrop materials such as Mica and Acrylic on Windows 11.

For available strings, see [Theme Management](/en-US/docs/api/theme-management).

```c
int32_t set_window_backdrop(uint32_t window_id, const char* backdrop_type);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `backdrop_type` `string` - Backdrop material type

:::warning{title=Platform Differences}
**Windows 11 only**. Linux (WebKitGTK) has no system material equivalent — the call is a no-op, returns `0`, and has no visual effect. If you need a translucent / solid background, use `set_window_background_color` or the window's `transparent` + `background_color` options.
:::

---

### Set the Window Background Color

Sets the window's background color (hexadecimal string).

```c
int32_t set_window_background_color(uint32_t window_id, const char* background_color_hex);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id
- `background_color_hex` `string` - Background color hexadecimal string, e.g. `#FF0000`

---

### Request a Redraw

Notifies the system to repaint the client area (rarely needs to be called manually).

```c
int32_t request_redraw(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

---

## Taskbar Effects

### Set the Taskbar Progress Bar (`set_window_progress`)

:::warning
Supported starting from v2.2.
:::

Displays a progress bar on the taskbar button (e.g. download progress, install progress, etc.).

```c
int32_t set_window_progress(uint32_t window_id, int progress, int state);
```

- **Parameters**:
  - `window_id` `uint32_t`
  - `progress` `int` - Progress value (0–100)
  - `state` `int` - State: `0`=no progress, `1`=normal, `2`=paused (yellow), `3`=error (red), `4`=indeterminate
- **Return value**: `1` = success, `0` = failure

:::warning
Windows platform only.
:::

---

### Flash the Taskbar Icon (`flash_window`)

:::warning
Supported starting from v2.2.
:::

Flashes the taskbar icon to attract the user's attention (e.g. when a message arrives).

```c
int32_t flash_window(uint32_t window_id, uint32_t count);
```

- **Parameters**: `window_id` `uint32_t`; `count` `uint32_t` - Number of flashes, `0` = stop flashing
- **Return value**: `1` = success, `0` = failure

:::warning
Windows platform only.
:::

---

## Closing and Counting

### Close the Window

Initiates closing; if the page registered a `beforeunload` handler and the user chooses to stay, closing may be deferred or canceled, depending on the WebView and the page script.

```c
int32_t close_window(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

---

### Get the Window Count

Queries how many windows are still open in the current JadeView.

```c
uint32_t get_window_count(void);
```
