---
title: Local Protocol Service
order: 0
group:
  title: Resources & Local Services
  order: 6
---

# Local Protocol Service

## Set the Local Protocol Service Path

**Purpose**: Register a local directory or JAPK resource bundle as a root directory that JadeView can access natively, and generate a protocol URL. Pages can use this address to load JS/CSS/images, just like a small static site, without having to spin up your own Node or IIS.

```c
int32_t set_protocol_service_path(
  const char* root_path,
  char* url_buffer,
  size_t buffer_size,
  int hot_reload
);
```

**Parameters:**

- `root_path` `string` - The root of the local static assets. **Two forms**:
  - **Directory**: A folder path containing front-end build output such as `index.html`;
  - **`.japk` file**: A path to a JAPK archive file that already exists on disk. JadeView maps the file and serves resources under `JADE://` by their **in-package relative path** (without extracting to a temporary directory); when a request does not match, it likewise falls back to `index.html` inside the package (SPA). Extension matching is **case-insensitive** (e.g. `.JAPK`). If some entries in the archive are stored "unpacked" (in a sibling `.japk.unpacked` / equivalent directory), the implementation will attempt to read the corresponding bytes from the disk sidecar.
- `url_buffer` `char*` - Output parameter that stores the generated protocol URL (NUL-terminated)
- `buffer_size` `size_t` - The byte capacity of `url_buffer` (including the trailing NUL)
- `hot_reload` `i32` *(new in 2.2)* - Whether to enable hot-reload mode. `1` = enabled, `0` = disabled. Only effective in file-system mode; ignored in JAPK/ASAR package mode

**Return value:**

- `1` - Success
- `0` - Failure (invalid path, buffer too small, not yet initialized, etc.)

Must be called **after `app-ready` succeeds**.

**Difference from the legacy `create_local_server`**: Previously you had to pass **`appname`** as a separate parameter, used to build the internal host name (e.g. `http://jade.{appname}/...`). **2.0** instead uses **only the `app_signature` (lowercased) already registered by `JadeView_init`** as the protocol domain, independent of `app_name`; so the C API has **one fewer parameter**, avoiding inconsistency with the initialization information.

| Legacy API | 2.0 |
|--------|-----|
| `create_local_server(root_path, appname, url_buffer, buffer_size)` | `set_protocol_service_path(root_path, url_buffer, buffer_size, hot_reload)` |

---

## Secure Resource Access System *(new in 2.2)*

Securely expose local files to the renderer process via a token mechanism. The main process registers a resource → generates a token path → the renderer process accesses only authorized resources → the protocol service maps them dynamically. The renderer process only ever sees the token path and cannot infer the real file path.

### URL Format

```
/---jade---resource--?token=xxx
```

The renderer process uses a same-origin relative path, which the browser resolves automatically based on the current page origin.

### Register a Local Resource (`register_resource`)

Register a local file as a secure resource and write the resource path into the buffer.

```c
int register_resource(
  const char* path,
  unsigned int window_id,
  unsigned int ttl_seconds,
  char* url_buffer,
  size_t buffer_size
);
```

**Parameters:**

- `path` `string` - The absolute path of the local file
- `window_id` `unsigned int` - The owning window ID (`0` = global, accessible by all windows)
- `ttl_seconds` `unsigned int` - Expiration time in seconds (`0` = default 6 seconds, `-1` = never expires)
- `url_buffer` `char*` - Output parameter that stores the generated `/---jade---resource--?token=xxx` path (NUL-terminated)
- `buffer_size` `size_t` - The byte capacity of `url_buffer` (including the trailing NUL)

**Return value:**

- `1` - Success
- `0` - Failure (invalid path, buffer too small, not yet initialized, etc.)

**Renderer process usage example:**

```html
<video src="/---jade---resource--?token=a3f8d2e1..." />
<img src="/---jade---resource--?token=b7c9f4d2..." />
```

### Unregister a Secure Resource (`unregister_resource`)

Unregister an already-registered secure resource.

```c
int unregister_resource(const char* token_or_url);
```

**Parameters:**

- `token_or_url` `string` - The token string or the full path `/---jade---resource--?token=xxx`

**Return value:**

- `1` - Success
- `0` - Not found

### Clear Window Resources (`clear_window_resources`)

Clear all registered resources for a specified window (called automatically when the window closes).

```c
int clear_window_resources(unsigned int window_id);
```

**Parameters:**

- `window_id` `unsigned int` - The window ID

**Return value:**

- The number of resources cleared

### Features

| Feature | Description |
|------|------|
| Token security | 16-byte random number (SHA1-mixed entropy source), non-enumerable |
| Path-traversal protection | `canonicalize()` at registration + check that the file exists |
| No directory registration | `is_file()` check |
| Automatic expiration | `ttl_seconds` parameter, `0` = default 6 seconds, `-1` = never expires |
| Window-level cleanup | Automatically releases all resources registered by a window when it closes |
| Range requests | Supports `Range: bytes=start-end`, returns 206 Partial Content, so video seeking stays smooth |
| Automatic MIME detection | Detected automatically by `mime_guess`, without relying on the renderer process to specify it |
| Registry limit | Up to 4096 entries; the oldest/expired entries are cleared automatically when exceeded |
| Cache header | `Cache-Control: no-cache`, consistent with the revocability of resources |

---

## Hot-Reload Mode *(new in 2.2)*

During development, the front-end page refreshes automatically after files are modified, with no manual refresh needed.

### How It Works

1. After hot-reload is enabled, a background thread uses the `notify` crate to recursively watch the `root_path` directory
2. Upon detecting a file create/modify/delete event, it automatically clears the static file cache
3. It notifies the renderer process via the `hot-reload` event, and the renderer process automatically runs `location.reload()` to refresh the page
4. A built-in 150ms debounce avoids frequent refreshes when many files are modified at once

### New Event: `hot-reload`

Triggered when files change; `event_data` is JSON:

```json
{"paths": ["C:\\project\\index.html", "C:\\project\\style.css"]}
```

The renderer process does not need to listen for this event manually; the auto-refresh logic is already built into the IPC runtime.

### Limitations

- Only effective in `ProtocolRoot::Fs` (file-system directory) mode
- The `hot_reload` parameter is ignored in JAPK / ASAR package mode
- Only one hot-reload watcher instance is supported per process

> **⚠️ Breaking change**: `set_protocol_service_path` adds a 4th parameter `hot_reload`; existing calls must pass `0`.
