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
int32_t set_protocol_service_path(const char* root_path, char* url_buffer, size_t buffer_size, int32_t hot_reload);
```

**Parameters:**

- `root_path` `string` - The root of the local static assets. **Two forms**:
  - **Directory**: A folder path containing front-end build output such as `index.html`;
  - **`.japk` file**: A path to a JAPK archive file that already exists on disk. JadeView maps the file and serves resources under `JADE://` by their **in-package relative path** (without extracting to a temporary directory); when a request does not match, it likewise falls back to `index.html` inside the package (SPA). Extension matching is **case-insensitive** (e.g. `.JAPK`). If some entries in the archive are stored "unpacked" (in a sibling `.japk.unpacked` / equivalent directory), the implementation will attempt to read the corresponding bytes from the disk sidecar.
- `url_buffer` `char*` - Output parameter that stores the generated protocol URL (NUL-terminated)
- `buffer_size` `size_t` - The byte capacity of `url_buffer` (including the trailing NUL)
- `hot_reload` `i32`  - Whether to enable hot-reload mode. `1` = enabled, `0` = disabled. Only effective in file-system mode; ignored in JAPK/ASAR package mode

**Return value:**

- `1` - Success
- `0` - Failure (invalid path, buffer too small, not yet initialized, etc.)

Must be called **after `app-ready` succeeds**.


---

## Secure Resource Access System

Register a local file and pass the returned URL to the page unchanged. The default API picks an eligible delivery mode:

- Controlled: same-origin relative token URL.
- Windows native: a complete HTTPS URL.

Both work as `video.src` or `img.src`. Do not use `jade://` URLs inside pages.

### Register a Local Resource (`register_resource`)

Register a local file and write its URL into the buffer. On Windows, permanent private resources try native mode first and fall back to controlled mode; all other resources use controlled mode. The default six-second TTL is not permanent and cannot use native mode.

```c
int32_t register_resource(const char* path, uint32_t window_id, uint32_t ttl_seconds, char* url_buffer, size_t buffer_size);
```

**Parameters:**

- `path` `string` - The absolute path of the local file
- `window_id` `uint32_t` - Owning **WebView ID** (the header keeps the parameter name `window_id`); `0` = explicit global sharing
- `ttl_seconds` `unsigned int` - Expiration time in seconds (`0` = default 6 seconds, `-1` = never expires)
- `url_buffer` `char*` - Output buffer for the relative path or full HTTPS URL (NUL-terminated)
- `buffer_size` `size_t` - The byte capacity of `url_buffer` (including the trailing NUL)

**Return value:**

- `1` - Success
- `0` - Failure (invalid path, buffer too small, not yet initialized, etc.)

**Renderer process usage example:**

```js
// resourceUrl is the unchanged value returned by the host.
document.querySelector("video").src = resourceUrl;
```

Native mode requires a private Ready WebView, permanent TTL, an exclusive named Profile, unrestricted origin policy and a hard-link-capable volume. It prevents in-place writes until the resource is unregistered or the WebView is destroyed. HEAD, conditional requests, caching and source-path replacement differ from controlled mode; use `register_resource_ex` with `JADE_RESOURCE_CONTROLLED` if those semantics matter.

### Unregister a Secure Resource (`unregister_resource`)

Unregister an already-registered secure resource.

```c
int32_t unregister_resource(const char* token_or_url);
```

**Parameters:**

- `token_or_url` `string` - A controlled token or the returned URL; native mode requires the full HTTPS URL

**Return value:**

- `1` - Success
- `0` - Not found

### Clear Window Resources (`clear_window_resources`)

Clear all registered resources for a specified window (called automatically when the window closes).

```c
int32_t clear_window_resources(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Owning **WebView ID** (the header keeps the parameter name `window_id`)

**Return value:**

- The number of resources cleared

### Controlled Mode Features

The following applies to controlled mode. WebView2 determines native mode MIME, cache and Range behavior.

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

## Explicit Resource Modes

`register_resource_ex` takes a `ResourceOptions` structure. `NULL` or `JADE_RESOURCE_CONTROLLED` selects controlled mode; `JADE_RESOURCE_NATIVE` requests the Windows native route and fails if its requirements are unmet. Automatic fallback applies only to `register_resource`.

```c
struct ResourceOptions options = { JADE_RESOURCE_CONTROLLED };
register_resource_ex(path, webview_id, ttl_seconds, &options, url, sizeof(url));
uint32_t mode;
int32_t rc = get_resource_delivery_mode(url, webview_id, &mode);
```

`get_resource_delivery_mode` returns `JADE_OK` and writes the actual mode (`JADE_RESOURCE_CONTROLLED` / `JADE_RESOURCE_NATIVE`) for a live URL and its owner; pass `0` for a global controlled resource. Native mode lookup waits for the UI thread, so do not call it from that thread. `get_resource_capabilities` reports engine-level availability, not whether a specific file can be registered.

Stop page consumers before unregistering a native resource. If unregister returns BUSY, detach the consumer and retry. Already-open or cached data cannot be recalled.

## Hot-Reload Mode

During development, the front-end page refreshes automatically after files are modified, with no manual refresh needed.

### How It Works

1. The library recursively watches the `root_path` directory.
2. File create, modify or delete events clear the static file cache.
3. The renderer receives `hot-reload` and runs `location.reload()`.

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


## Linux HTTPS source integration

The host still passes `jade://` entries; pages use relative URLs and URLs returned by resource registration. Named non-incognito profiles keep a fixed port and isolated environment; a profile lock or port conflict fails creation. Unnamed and incognito views are temporary. Name the profile when persistence is required. No system certificate installation or global TLS bypass is involved.

## Resource delivery diagnostics

```c
struct ResourceDeliveryInfo {
    uint32_t mode;
    uint32_t reason;
    int32_t native_error_code;
    char *message;
};
int32_t get_resource_delivery_info(const char *url, uint32_t webview_id,
    struct ResourceDeliveryInfo *out, size_t capacity);
void free_resource_delivery_info(struct ResourceDeliveryInfo *out);
```

Zero the output, pass `sizeof(*out)`, and check `JADE_OK`. Free a successful output before reuse; failure leaves it unchanged. The result is valid only while the registration is alive and its owner matches. Python exposes `resource.delivery_info` and releases the native string automatically.

Reason codes: `0` explicit controlled, `1` native selected, `2` finite TTL, `3` global resource, `4` native mapping unsupported on this platform, `5` native registration failed and controlled fallback succeeded. Reason `5` keeps the native error code and explanation. A successful fallback still clears the thread-local last error.

This change does not alter the default six-second TTL or automatic/explicit routing behavior.
