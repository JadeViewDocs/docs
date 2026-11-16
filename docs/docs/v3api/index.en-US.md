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

V3 configuration and DLL/SDK checks: [ABI contract](/en-US/docs/v3api/abi). Default initializers require the output capacity and return an error code.

## Lifecycle and Startup

### Initialize the runtime (`JadeView_init`)

**Purpose**: Start the library's internal **GUI thread and event loop**, and register what your application is called, where its data goes, and whether it should be single-instance. After a successful call, you still need to wait for the **`app-ready`** event before creating windows or using the local protocol.

```c
int32_t JadeView_init(int32_t enable_devmod, const char* log_path, const char* data_directory, const char* app_name, const char* app_signature, int32_t single_instance);
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

The `event_data` format differs between success and failure (success is JSON, failure is plain text). `app-ready` is an App-source event whose source ID is always `0`; **decide success by parsing `ok:true` in the body**, not by the source ID:

| Situation | Source ID | Roughly what `event_data` looks like |
|------|-------------|---------------------------|
| Normal startup completed | `0` | JSON: `{"ok":true,"message":"success"}` |
| `app_name` / `app_signature` validation failed | `0` | Plain text `"<code>: <message>"` (`code` is one of `missing_app_name` / `missing_app_signature` / `app_signature_too_short`) |

> A crash during runtime does **not** go through `app-ready`; it is reported via the separate [`crash`](/en-US/docs/v3api/event-types#crash) event.

Call `jade_on("app-ready", ...)` **before `JadeView_init`**, otherwise you will miss the first notification.

---

### Run the message loop (`run_message_loop`)

**Purpose**: May be used in the legacy integration approach where "the exe runs the message loop itself". **It blocks the current thread and does not return until the app shuts down (e.g. via `jadeview_exit`)**. In the common **DLL embedding** scenario, the loop already runs in the thread started by `JadeView_init`, so this function is **optional and generally not needed** (consistent with the Quick Start).

```c
int32_t run_message_loop(void);
```

---

### Exit the application (`jadeview_exit`)

**Purpose**: Closes all JadeView windows, tears down resources, and lets the event loop end. this function waits for the GUI event loop and JadeView-owned background threads to finish before it returns successfully, making it suitable as the final step before unloading the DLL.

```c
int32_t jadeview_exit(void);
```

| Return value | Meaning |
|--------|------|
| `1` | Shutdown, cleanup, and waiting have completed. |
| `0` | Failed (for example, initialization has not yet completed). |


---

### Exit with a timeout (`jadeview_exit_wait`)

**Purpose**: Starts a complete shutdown and waits for the GUI event loop to stop, with a host-specified timeout. Use it in DLL integrations to confirm that JadeView is no longer executing code before calling `FreeLibrary`.

```c
int32_t jadeview_exit_wait(uint32_t timeout_ms);
```

| Parameter | Description |
|------|------|
| `timeout_ms` | Maximum wait in milliseconds. Passing `0` uses the minimum wait duration. |

| Return value | Meaning |
|--------|------|
| `1` | Shutdown cleanup completed; the GUI thread and JadeView-owned background threads finished their cleanup. |
| `0` | Shutdown did not complete in time. Do not unload the DLL yet; call the function again later to continue waiting. |

:::warning{title="Calling thread"}
Do not wait for the GUI thread from one of its own callbacks. When called on the GUI thread, the function only initiates asynchronous shutdown. Call `jadeview_exit_wait` again from another host thread and unload the DLL only after it returns `1`.
:::

---

## Path Queries

### Get system path (`getPath`)

Queries the **absolute path** of a directory category by a **fixed English keyword**, without assembling environment variables or handling paths with non-ASCII user names. Use it to locate log directories, "My Documents", or the executable's directory.

```c
int32_t getPath(const char* name, char* buffer, size_t buffer_size);
```

| `name` | Roughly corresponds to (common Windows cases) |
|--------|------------------------------|
| `home` | The current user's home directory (similar to the personal directory above the "Users" folder in File Explorer). |
| `appData` | The per-user application data directory (often close to `%LOCALAPPDATA%`). |
| `sessionData` | The directory related to the WebView session/cache (a sub-path under the data directory configured in JadeView). |
| `userData` | JadeView's **data directory** — the parent of `sessionData` (WebView session directory) and `logs` (log directory). **Created automatically if it does not exist**, so the host can write its own data files there directly. The base path uses the data directory passed to `JadeView_init` first; if not provided, it falls back to the system application data directory (Windows: `%LOCALAPPDATA%`, Linux: `~/.config`) with `<app signature>_data` appended. |
| `temp` | The system temporary directory. |
| `exe` | The full path of **the current main process exe** (whoever loaded the DLL). |
| `desktop` / `documents` / `downloads` / `music` / `pictures` / `videos` | User folders such as Desktop, Documents, Downloads, Music, Pictures, Videos, etc. |
| `logs` | The application log directory (under the data directory; it may be created if it does not exist). |
| `app` | **The directory containing the exe** (the installation directory), suitable for reading resources in the same directory. |

**Return value:** On success, returns the **number of bytes written to `buffer`** (excluding the trailing `\0`); if `buffer` is too small, returns the **negative of the required size** (absolute value = bytes needed to hold the full path including `\0`), and writes nothing; other failures (unsupported `name`, invalid pointer, etc.) return `0`.

---

Other API groups: local protocol service in [Local Protocol Service](/en-US/docs/v3api/local-server-api), system integration in [System Integration API](/en-US/docs/v3api/system-api), menus and right-click integration in [Menus](/en-US/docs/v3api/menu-api).

---


## Core Structs

### Window options struct (`WebViewWindowOptions`)

**Purpose**: Describes **what the first screen looks like, whether it can be resized, and where it appears on screen**. The field order must match the **struct declaration in `JadeView.h`**; underfilling, overfilling, or type misalignment will cause **silent memory misreads**.

| Field | What it controls |
|------|----------|
| `title` | The text on the window's title bar. |
| `width` / `height` | The initial width and height (pixels). |
| `resizable` | Whether the user can drag the edges with the mouse to resize it. |
| `noframe` | Borderless: `1` uses the existing borderless implementation, `0` keeps the system frame; borderless takes precedence over the system title bar. |
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
| `skip_taskbar` | When non-`0`: the window **stays out of the taskbar / Alt-Tab**. Appended at the end of the struct to keep field-order compatibility. |
| `no_activate` | When non-`0`: **does not steal focus** — the window is not activated when clicked or shown. Appended at the end of the struct to keep compatibility. |
| `background_material` | Background material at creation: `default` / `mica` / `micaAlt` / `acrylic`; `NULL` means default. |

---

### Web page behavior struct (`WebViewSettings`)

**Purpose**: Controls **the behavior of the web page inside WebView** (autoplay, right-click, UA, etc.). Passing `NULL` means using all defaults.

| Field | What it controls |
|------|----------|
| `autoplay` | Whether media can autoplay. |
| `background_throttling` | Windows: `0` and `2` use the engine default; `1` disables background timer throttling using a WebView2 browser argument. Linux rejects `1` and `2`. Views sharing an environment must use the same policy. |
| `allow_right_click` | Whether to allow the web page context menu. `0` = disabled, `1` = allowed. |
| `user_agent` | A custom User-Agent. |
| `preload_js` | A piece of JS to inject before the page loads. |
| `allow_fullscreen` | Whether the fullscreen API in the web page is allowed. |
| `postmessage_allowed_origins` | The whitelist for **whether the page's `postMessage` is forwarded to the main process**; the value is **a comma- or semicolon-separated UTF-8 string** (usually close to the page's `origin`, such as `https://example.com`). When matching, the library passes if: `event.origin` is **equal to** that string, or one of the comma- or semicolon-separated allowed origins matches exactly, or an entry is `*`. If the pointer is **`NULL`/unset**: under the current implementation, **no source is allowed through** (i.e., `postmessage-received` is not received). **Built-in static pages loaded via `set_protocol_service_path`** will **skip the whitelist** in the implementation and can always receive. |
| `cors_allowed_origins` | The CORS cross-origin allowlist; multiple domains are **comma-separated**, used to permit the page's cross-origin requests to those origins. |
| `password_autofill` | Whether to enable account/password autofill. `0` = disabled, `1` = enabled.  |
| `form_autofill` | Whether to enable general form autofill (name/address/phone, etc.). `0` = disabled, `1` = enabled.  |
| `incognito` | Whether to run in incognito/private browsing mode. `0` = normal mode, `1` = incognito mode. Page rendering becomes slower when enabled.  |
| `disable_clipboard` | Whether to disable clipboard read/write permissions. `0` = allowed, `1` = disabled.  |
| `proxy_url` | The proxy URL, supporting HTTP and SOCKS5 proxies (such as `"http://127.0.0.1:7890"` or `"socks5://127.0.0.1:1080"`). `NULL` means no proxy is used.  |
| `focused` | Whether WebView automatically gains focus initially. `0` = does not gain focus, `1` = automatically focuses (default `1`).  |
| `profile_name` | Named Profile session isolation on Windows: different names isolate cookies, LocalStorage, IndexedDB, and cache from each other; the same name shares them. `NULL` or an empty string uses the default profile. Currently Windows-only; Linux accepts but ignores it.  |

---

