---
title: Core API
order: 0
group:
  title: Overview
  order: 0
---

# Core API

Explains how to **start JadeView**, and what each field of the two structs used when creating a window **controls respectively**. Other functions are organized into separate sections on the left.

---

## Lifecycle and Startup

### Initialize the runtime (`JadeView_init`)

**Purpose**: Start the library's internal **GUI thread and event loop**, and register what your application is called, where its data goes, and whether it should be single-instance. After a successful call, you still need to wait for the **`app-ready`** event before creating windows or using the local protocol.

```c
int32_t JadeView_init(
  int32_t enable_devmod,
  const char* log_path,
  const char* data_directory,
  const char* app_name,
  const char* app_signature,
  int32_t single_instance
);
```

| Parameter | Description |
|------|------|
| `enable_devmod` | Whether to enable **development-oriented capabilities** (such as DevTools and debugging shortcuts). For an official release, you generally pass `0`. |
| `log_path` | Which file the log is written to; passing `NULL` means no file is written (whether it prints to the console is up to the implementation). |
| `data_directory` | The data root path; `NULL` or empty uses the system default (such as `%LOCALAPPDATA%`). The directory actually used by WebView will further append a subdirectory related to `app_signature`. |
| `app_name` | The **application display name**, required, used for scenarios such as protocols and notifications. |
| `app_signature` | The **unique application identifier**, required, at least 6 characters, used to generate the data directory name, the single-instance pipe name, and so on; getting it wrong will cause initialization to fail. |
| `single_instance` | When non-`0`: **only one of your processes is allowed on the entire machine**; launching it again will send the command line to the first launched process, and this current `JadeView_init` will return `0`. |

| Return value | Meaning |
|--------|------|
| `1` | The GUI has been started, **but is not yet ready**; you must wait for `app-ready`. |
| `0` | It did not start (parameter error, or it was rejected as a second instance, etc.). |

#### What you receive in `app-ready`

| Situation | `window_id` | Roughly what `event_data` looks like |
|------|-------------|---------------------------|
| Normal startup completed | `1` | Text `success` |
| `app_name` / `app_signature` validation failed | `0` | JSON: `{"ok":false,"code":"...","message":"..."}` |
| GUI thread crashed | `0` | A plain-text error description |

Call `jade_on("app-ready", ...)` **before `JadeView_init`**, otherwise you will miss the first notification.

---

### Run the message loop (`run_message_loop`)

**Purpose**: May be used in the legacy integration approach where "the exe runs the message loop itself". In the common **DLL embedding** scenario, the loop already runs in the thread started by `JadeView_init`, so you **generally do not need to call it**.

```c
int32_t run_message_loop(void);
```

---

### Clean up all windows (`cleanup_all_windows`) ⚠️ Planned for deprecation

:::warning
`cleanup_all_windows` has entered the deprecation plan since 2.2; please use [`jadeview_exit()`](#jadeview_exit) instead.
:::

**Purpose**: Close all JadeView windows, tear down resources, and let the event loop end. Equivalent to the cleanup performed before the application exits.

```c
int32_t cleanup_all_windows(void);
```

| Return value | Meaning |
|--------|------|
| `1` | Shutdown and cleanup have been initiated. |
| `0` | Failed (for example, initialization has not yet completed). |

---

### Exit the application (`jadeview_exit`)

:::warning
Supported starting from v2.2.
:::

**Purpose**: Replaces `cleanup_all_windows`; closes all JadeView windows, tears down resources, and lets the event loop end.

```c
int32_t jadeview_exit(void);
```

| Return value | Meaning |
|--------|------|
| `1` | Shutdown and cleanup have been initiated. |
| `0` | Failed (for example, initialization has not yet completed). |

---

The local protocol service APIs (`set_protocol_service_path`, `register_resource`, `unregister_resource`, `clear_window_resources`) have been moved to the separate document [Local Protocol Service](/en-US/docs/api/local-server-api).

The context menu APIs (`jade_menu_item_create`, etc.) have been moved to the separate document [Context Menu](/en-US/docs/api/context-menu-api).

---

## Version Changes at a Glance

### Added and enhanced in 2.3

| Symbol / Capability | What it does | Doc |
|------|------------|------|
| `yaml_set_str` / `yaml_get_str` / `yaml_get_all` / `yaml_has` / `yaml_delete` / `yaml_clear` / `yaml_delete_file` / `yaml_keys` / `yaml_len` | The YAML storage interface has been greatly expanded; also adds array index syntax `[N]`, two-phase queries, negative error codes, atomic writes, and file locking. | [YAML Storage API](/en-US/docs/api/yaml-storage-api) |
| `jade_ntp_now` | Obtains a network UTC timestamp via NTP, without relying on the local clock; you can specify a server or use the built-in list with concurrent queries. | [System Integration API](/en-US/docs/api/system-api) |
| `jade-region-drag` / `jade-region-no-drag` | Custom window drag regions based on HTML attributes, not relying on CSS, and right-click does not pop up the system title bar menu. | [Window Interaction Control](/en-US/docs/api/window-styling) |
| `drag-drop` synchronous interception | `enter` / `drop` support synchronous interception/consumption (the callback returns a non-null pointer), while `over` / `leave` remain asynchronous. | [Event Types](/en-US/docs/api/event-types) |
| IPC communication path optimization | `invoke` and broadcast share the same send path, and high-frequency small events are merged before sending; the external interface stays compatible with the old message form. | [IPC Communication API](/en-US/docs/api/ipc-api) |

:::info
`jade_ntp_now` adds a `const char* ntp_server` parameter since 2.3 (ABI change); old calls keep the original behavior by passing `NULL`.
:::

### Added and renamed interfaces in 2.0 (relative to the old version)

| Symbol | What it does |
|------|------------|
| `create_borderless_webview_window` | Creates a WebView window **without a system title bar**. |
| `get_window_hwnd` | Only this kind of window can obtain the **HWND** for use with other Win32 APIs. |
| `set_protocol_service_path` | Mounts a local folder as the built-in protocol root, and the page loads static resources using the generated base address (replacing the old `create_local_server`). |
| `yaml_set` / `yaml_get` | Read and write YAML configuration in the data directory. |
| `getPath` / `getLocale` / `get_displays_info` | Common paths, the system UI language, and multi-display information. |
| `clear_data_directory` | Clears this application's data directory (requires a confirmation token). |
| `jadeview_version` | Reads JadeView's own version string. |
| `register_url_scheme`, etc. | Custom protocols and file associations. |
| `register_global_hotkey`, etc. | Global hotkeys (you receive the `global-hotkey` event). |
| Tray-related | See [System Tray](/en-US/docs/api/tray-api). |

---

## Core Structs

### Window options struct (`WebViewWindowOptions`)

**Purpose**: Describes **what the first screen looks like, whether it can be resized, and where it appears on screen**. The field order must match the **struct declaration in `JadeView.h`**; underfilling, overfilling, or type misalignment will cause **silent memory misreads**.

| Field | What it controls |
|------|----------|
| `title` | The text on the window's title bar. |
| `width` / `height` | The initial width and height (pixels). |
| `resizable` | Whether the user can drag the edges with the mouse to resize it. |
| `frame_style` | Whether to have a system frame + title bar, only a frame without a title bar, completely borderless, or borderless + a built-in title bar button overlay (`normal` / `no-titlebar` / `borderless` / `title-overlay`). `title-overlay` is Windows-only, providing a frame + no title bar + built-in title bar buttons in the top-right corner (each button is 45 pixels wide, and the height defaults to 32 pixels), with no need to implement the window control button functionality yourself. |
| `transparent` | Whether to have a transparent background (depends on WebView and system capabilities). |
| `background_color` | The window background color string (such as hexadecimal with a `#`). |
| `always_on_top` | Whether it always stays in front. |
| `theme` | Light / dark / follow the system (`Light`, `Dark`, `System`). |
| `maximized` | Whether to be maximized when opened. |
| `maximizable` / `minimizable` | Whether the maximize/minimize buttons on the title bar are allowed to take effect. |
| `x` / `y` | The coordinates of the window's top-left corner; **both being -1 means letting the system center it for you**. |
| `min_*` / `max_*` | The allowed minimum and maximum sizes; `0` usually means no limit. |
| `fullscreen` | Whether to be fullscreen when opened. |
| `focus` | Whether to grab keyboard focus after opening. |
| `hide_window` | When non-0, create it first but do not show it (suitable for loading first and then `show`). |
| `use_page_icon` | Whether to use the web page favicon as the initial window icon. |
| `content_protection` | Whether to enable anti-recording/anti-screenshot protection. |
| `auto_save_state` | When non-`0`: records the window's **last valid physical top-left coordinates** by **`window_id`** in `window_state.yaml` under the **data directory**; the next time you create it with the same `window_id`, if that position still falls within the work area of some screen, the **position is restored** (**the width, height, and whether it is maximized still follow this creation's parameters**). It is debounced and flushed to disk about **450ms** after the move stops; it is also saved once more on close. |

:::warning
2.0 has removed the old fields `remove_titlebar`, `borderless`, `no_center`, etc.; you must use `frame_style` and `x/y=-1` for centering, otherwise the struct will not line up and will **silently misalign**.
:::

---

### Web page behavior struct (`WebViewSettings`)

**Purpose**: Controls **the behavior of the web page inside WebView** (autoplay, right-click, UA, etc.). Passing `NULL` means using all defaults.

| Field | What it controls |
|------|----------|
| `autoplay` | Whether media can autoplay. |
| `background_throttling` | Whether to lower the timer/animation frequency to save resources when the window is in the background. |
| `disable_right_click` | Whether to disable the web page context menu. |
| `ua` | A custom User-Agent. |
| `preload_js` | A piece of JS to inject before the page loads. |
| `allow_fullscreen` | Whether the fullscreen API in the web page is allowed. |
| `postmessage_whitelist` | The whitelist for **whether the page's `postMessage` is forwarded to the main process**; the value is **a single UTF-8 string** (usually close to the page's `origin`, such as `https://example.com`). When matching, the library passes if: `event.origin` is **equal to** that string, or the **`origin` has that string as a suffix**. If the pointer is **`NULL`/unset**: under the current implementation, **no source is allowed through** (i.e., `postmessage-received` is not received). **Built-in static pages loaded via `set_protocol_service_path`** will **skip the whitelist** in the implementation and can always receive. |
| `autofill` | Whether to enable account/password autofill. `0` = disabled, `1` = enabled. *(Added in 2.2)* |
| `general_autofill_enabled` | Whether to enable general form autofill (name/address/phone, etc.). `0` = disabled, `1` = enabled. *(Added in 2.2)* |
| `incognito` | Whether to run in incognito/private browsing mode. `0` = normal mode, `1` = incognito mode. Page rendering becomes slower when enabled. *(Added in 2.2)* |
| `disable_clipboard` | Whether to disable clipboard read/write permissions. `0` = allowed, `1` = disabled. *(Added in 2.2)* |
| `proxy_url` | The proxy URL, supporting HTTP and SOCKS5 proxies (such as `"http://127.0.0.1:7890"` or `"socks5://127.0.0.1:1080"`). `NULL` means no proxy is used. *(Added in 2.2)* |
| `focused` | Whether WebView automatically gains focus initially. `0` = does not gain focus, `1` = automatically focuses (default `1`). *(Added in 2.2)* |

---

The system integration APIs (`get_cursor_position`, `clipboard_read_text`, `clipboard_write_text`, `jade_print_dialog`, `jade_get_printer_list`) have been moved to the separate document [System Integration API](/en-US/docs/api/system-api).
