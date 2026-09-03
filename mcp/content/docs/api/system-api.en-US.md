---
title: System Integration API
order: 0
group:
  title: System & Tools
  order: 5
---

# System Integration API

Global capabilities for interacting with the operating system, not bound to any specific window. Includes protocol registration, global hotkeys, clipboard, cursor position, printing, and more.

If you only care about basic tool capabilities (version, paths, language, monitors, config read/write), see the [Tools API](/en-US/docs/api/tools-api).

---

## Protocol & File Association

### Custom URL Scheme (`register_url_scheme` / `unregister_url_scheme`)

**Purpose**: Register a **custom URL scheme** with the system (e.g. `myapp://open/...`), so that when the user clicks such a link in a browser or another application, it launches your exe and passes the URL through. When uninstalling or disabling the feature, call `unregister` to remove the registration.

```c
int32_t register_url_scheme(const char* scheme);
int32_t unregister_url_scheme(const char* scheme);
```

`JadeView_init` must have succeeded so that the library knows your exe path. If single instance is enabled, the second launch may hand the command line to the first opened process via **`second-instance`**, making it convenient to handle the protocol URL only once.

---

### File Type Association (`register_file_association` / `unregister_file_association`)

**Purpose**: Let the user **double-click a certain extension** (such as `.mydata`) to open it with the current application. `friendly_name` is the human-readable name shown in the "Open with" menu.

```c
int32_t register_file_association(const char* extension, const char* friendly_name);
int32_t unregister_file_association(const char* extension);
```

The extension can be given with or without the leading dot; it is normalized internally. Likewise, initialization must already be complete so it associates with the correct exe.

---

## Global Input

### Global Hotkey (`register_global_hotkey` / `unregister_global_hotkey`)

**Purpose**: Register a **global shortcut** (which responds even when your window does not have focus), for example to summon the main window globally or to mute. When pressed, the library fires the **`global-hotkey`** event (the payload is JSON containing the hotkey id and key value), which you can handle in `jade_on`.

```c
uint32_t register_global_hotkey(uint32_t modifiers, uint32_t vk);
int32_t unregister_global_hotkey(uint32_t hotkey_id);
```

| Parameter | Description |
|------|------|
| `modifiers` | Modifier combination, using a bitwise OR of Windows' `MOD_CONTROL`, `MOD_SHIFT`, etc. |
| `vk` | Virtual key code of the main key, consistent with Win32. |

| Return value | Meaning |
|--------|------|
| `> 0` | Hotkey id; pass it to `unregister_global_hotkey` when unregistering. |
| `0` | Registration failed (e.g. the key combination is already in use, or the key code is unsupported). |

For event field descriptions, see [Event Types](/en-US/docs/api/event-types#global-hotkey).

:::warning{title=Platform Differences}
- **Windows**: `RegisterHotKey`, fully available.
- **Linux / X11**: Implemented by grabbing keys on the root window via x11rb; available. `modifiers` / `vk` still follow Windows' `MOD_*` / virtual key codes (mapped internally to X11 by the library).
- **Linux / Wayland**: The protocol does not allow ordinary clients to grab keys globally, so it is a **graceful no-op** and `register_global_hotkey` returns `0`. You can set `GDK_BACKEND=x11` to go through Xwayland to enable it.
:::

---

## Cursor Position

### Get Cursor Position (`get_cursor_position`)

:::warning
Supported since v2.2.
:::

Get the current cursor screen coordinates (global, not bound to a window).

```c
int32_t get_cursor_position(char* buffer, int buffer_size);
```

- **Parameters**: `buffer` `char*` - output buffer; `buffer_size` `int` - buffer size
- **Return value**: `1` = success, the buffer is written with the JSON `{"x":0,"y":0}`; `0` = failure

:::info{title=Platform Support}
Available on both Windows (`GetCursorPos`) and Linux/X11 (x11rb `QueryPointer`). On pure Wayland (without Xwayland) it may return `0`.
:::

---

## Clipboard

:::warning
Supported since v2.2.
:::

Depends on the newly added `arboard` crate.

### Read Clipboard Text (`clipboard_read_text`)

:::warning
Supported since v2.2.
:::

```c
int32_t clipboard_read_text(char* buffer, int buffer_size);
```

- **Parameters**: `buffer` `char*` - output buffer; `buffer_size` `int` - buffer size
- **Return value**: `1` = success, `0` = failure

---

### Write Clipboard Text (`clipboard_write_text`)

:::warning
Supported since v2.2.
:::

```c
int32_t clipboard_write_text(const char* text);
```

- **Parameters**: `text` `string` - the text to write
- **Return value**: `1` = success, `0` = failure

---

## Printing

:::warning
Supported since v2.2.
:::

### Get Printer List (`jade_get_printer_list`)

:::warning
Supported since v2.2.
:::

Get the system printer list, returned as a JSON array string.

```c
int32_t jade_get_printer_list(char* buffer, int buffer_size);
```

- **Parameters**: `buffer` `char*` - output buffer; `buffer_size` `int` - buffer size (bytes)
- **Return value**: `>0` = number of printers, the buffer contains a JSON array; `0` = failure or no printers
- **When the buffer is too small**: it **truncates the written output and still returns the printer count** (no error); the JSON may be cut off, so reserve enough space or retry based on the returned count

Output example:

```json
["Microsoft Print to PDF","HP LaserJet Pro MFP M428fdw","Fax"]
```

:::info{title=Platform Support}
Available on both Windows (`EnumPrintersW`) and Linux (CUPS `lpstat -e`). Linux requires the CUPS client installed (`cups-client`, which provides `lp`/`lpstat`); returns `0` when not installed.
:::

---

### Print a File (`jade_print_dialog`)

Print a file on disk directly using the **system-associated program** (without going through the WebView); suitable for printing existing files such as PDFs and images.

```c
int32_t jade_print_dialog(const char* file_path);
```

- **Parameter**: `file_path` `string` - the absolute path of the file to print; `NULL` or an empty string returns `0` immediately
- **Return value**: `1` = successfully submitted to the system for printing; `0` = failure (empty path / system call failed)

:::info{title=Platform Support}
Windows uses the `"print"` verb of `ShellExecute`, printed by the default program associated with the file; Linux uses the CUPS `lp` command.
:::

---

## Login Autostart

:::warning
Supported since v2.3.0-beta.6.
:::

Set / query whether the app starts automatically on system login, cross-platform (Windows / Linux). The autostart **identifier name** is taken from the `app_name` passed to `JadeView_init` (falling back to the executable file name if absent); the autostart **command** is the current executable path (`current_exe`) plus the `args` you pass in.

### Enable / Disable Login Autostart (`set_login_autostart`)

```c
// enable: 1=enable, 0=disable; args: launch arguments appended after the exe path (NULL / empty = none)
int32_t set_login_autostart(int32_t enable, const char* args);
```

- **Parameters**:
  - `enable` `int32_t` - `1` = enable autostart, `0` = disable
  - `args` `string` - Launch arguments appended after the executable path on autostart (e.g. `"--minimized"`); pass `NULL` or an empty string for no arguments
- **Return value**: `1` = success, `0` = failure (no permission / IO error). When disabling, if the autostart entry does not exist in the first place, it is also treated as success

### Query Whether Login Autostart Is Set (`get_login_autostart`)

```c
int32_t get_login_autostart(void);
```

- **Return value**: `1` = autostart is set, `0` = not set

:::info{title=Platform Implementation}
| Platform | Mechanism |
|------|------|
| Windows | Writes the registry key `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`, value name = app_name, value = `"<exe>" <args>` |
| Linux | XDG autostart: writes a `.desktop` file at `<config>/autostart/<app_name>.desktop` (`dirs` resolves `XDG_CONFIG_HOME`, falling back to `~/.config`) |
:::

---

## File Icon

### Extract a File / Program Icon (`get_file_icon`)

:::warning
Supported since v2.3.0-beta.6.
:::

Gets the **system-associated icon** for any path (`.exe` / `.lnk` / a regular file / a folder), scales it to a PNG of the requested size, registers it as a `jade://` secure resource, and writes the accessible URL into your buffer — the frontend can use that URL directly as `<img src>`. Commonly used for file managers, launchers, recent-file lists, and other UIs that need to show system icons.

```c
// size: target edge length (16/32/48/64/128/256, <=0 uses 48)
// window_id: window the resource belongs to (0 = global)
// ttl_seconds: resource expiry in seconds (0 = default, 0xFFFFFFFF = never expires)
// url_buffer / buffer_size: output URL buffer (same format as register_resource)
int32_t get_file_icon(const char* path, int32_t size, uint32_t window_id,
                      uint32_t ttl_seconds, char* url_buffer, size_t buffer_size);
```

| Parameter | Description |
|------|------|
| `path` | Target path: `.exe` / `.lnk` / a regular file / a folder; its system-associated icon is taken |
| `size` | Target edge length in pixels (16 / 32 / 48 / 64 / 128 / 256 recommended); `<=0` uses the default 48 |
| `window_id` | Window the resource belongs to, `0` = global |
| `ttl_seconds` | Resource expiry in seconds, `0` = default, `0xFFFFFFFF` = never expires |
| `url_buffer` / `buffer_size` | The output URL buffer and its size (bytes) |

- **Return value**: `1` = success, `url_buffer` is written with a URL like `/---jade---resource--?token=...`; `0` = failure
- Internal flow: extract icon → Lanczos3 scaling → write PNG to `%TEMP%/JadeView_icon_cache/` (deduplicated by path + size) → register as a `jade://` resource → write out the URL

:::info{title=Platform Implementation}
| Platform | Implementation |
|------|------|
| Windows | `SHGetFileInfo` to get the HICON → GDI+ to PNG → `image` scaling and encoding |
| Linux | `gio` queries the file-associated icon → GTK `IconTheme` gets a `Pixbuf` (falls back to `text-x-generic` on a miss) → encodes PNG |
:::

:::warning{title=Linux Threading Constraint}
GTK `IconTheme` / `Pixbuf` have main-thread affinity; internally the work is dispatched to the GTK main loop via `glib::idle_add_once` while the calling thread blocks for the result. Therefore **on Linux you must call `get_file_icon` from a worker thread, and the message loop (`run_message_loop`) must be running with a default display (X11 / Wayland)**; do not call it synchronously on the GTK main thread, or it will deadlock. Windows has no such constraint.
:::

---

## Network Time (NTP)

### Get Network Timestamp (`jade_ntp_now`)

:::warning
Supported since v2.3.
:::

Get the current UTC timestamp from a network time server via the NTP protocol (UDP/123). It **does not depend on the local system clock** and can be used for anti-cheat, license validation, log time alignment, and similar scenarios.

It does not require `JadeView_init` and can be called independently. The local machine needs outbound UDP network access.

```c
int64_t jade_ntp_now(const char* ntp_server);
```

Get the current network timestamp (**UTC milliseconds**; for Beijing time add 8 hours).

| Parameter | Description |
|------|------|
| `ntp_server` | NTP server address (such as `"ntp.aliyun.com"`). When passing `NULL`, an empty string, or pure whitespace, the built-in server list is tried one by one. |

| Return value | Meaning |
|--------|------|
| `>= 0` | Success, Unix timestamp (UTC milliseconds) |
| `-1` | Failure (the specified server is unreachable / all built-in entries failed / network unavailable) |

#### Behavior

- **Passing a non-empty address**: Only that server is queried, with a 3-second timeout per query; on failure it returns `-1` directly and **does not fall back** to the built-in list.
- **Passing `NULL` / empty string / whitespace**: Queries the built-in list concurrently in order, using the first to arrive, and returns the first successful result; returns `-1` if all fail.

#### Built-in Server List

In priority order (anycast / low latency first, overseas nodes as fallback):

| Server | Description |
|--------|------|
| `ntp.aliyun.com` | Alibaba Cloud anycast, nationwide low latency |
| `time.cloudflare.com` | Cloudflare global anycast |
| `ntp.tencent.com` | Tencent Cloud anycast |
| `time.windows.com` | Microsoft global nodes |
| `ntp.ntsc.ac.cn` | National Time Service Center |
| `0.pool.ntp.org` | Global public pool |
| `cn.ntp.org.cn` | China NTP public pool |
| `time.google.com` | High-speed overseas, ultimate redundancy within China |

#### Python Example

```python
import ctypes, datetime
from ctypes import c_char_p, c_int64

dll = ctypes.WinDLL("JadeView.dll")
dll.jade_ntp_now.argtypes = [c_char_p]
dll.jade_ntp_now.restype = c_int64

# 1) Use the built-in list (pass NULL)
ms = dll.jade_ntp_now(None)
if ms >= 0:
    print("UTC:", datetime.datetime.utcfromtimestamp(ms / 1000.0))

# 2) Specify a custom server
ms = dll.jade_ntp_now(b"ntp.aliyun.com")

# 3) An empty string is equivalent to the built-in list
ms = dll.jade_ntp_now(b"")

# Returns -1 on failure
if ms < 0:
    print("NTP fetch failed")
```

:::info
The return value is in UTC milliseconds. To convert to Beijing time (UTC+8): `local_ms = ms + 8 * 3600 * 1000`.
:::
