---
title: Load from Memory
order: 3
group:
  title: Resources & Local Services
  order: 6
---

# Load from Memory

JadeView 2.0 supports loading JAPK packages directly from memory, without a local file system. This is suitable for scenarios where JAPK data is embedded in an executable or used directly after being downloaded from the network.

This page describes the memory-loading APIs. To load from a local file, see [Load from Local](/en-US/docs/api/japk).
To build an obfuscated JAPK package, use the [JadePack](/en-US/docs/api/jadepack) desktop client.

---

## Overview

`JadeView_load_from_bytes` loads a JAPK package from memory, internally selecting the load path automatically based on the magic number and public-key setting:

- Public key set → only **JAPK v2 signed packages** are accepted, decrypted and loaded after signature verification
- No public key set → **obfuscated package v2** is accepted, deobfuscated and loaded

> 💡 **Tip**: Both signed and obfuscated packages are built by [JadePack](/en-US/docs/api/jadepack). A signed package requires injecting the public key via `JadeView_set_public_key` before loading.

| Format | Magic number | Description | Build tool |
|------|------|------|----------|
| **JAPK v2 signed package** | `JAPKV002` | Ed25519 signature + AES-256-GCM encryption | [JadePack](/en-US/docs/api/jadepack) |
| **Obfuscated package v2** | `JPKBIN02` | SHA256 dynamic key derivation + 3-layer reversible transform | [JadePack](/en-US/docs/api/jadepack) |

**Key security constraint**: Once the public key is set, a failed signed-package load **will never fall back** to the obfuscated-package logic.

---

## Core API

### JadeView_set_public_key

Sets the Ed25519 public key. After it is called, `JadeView_load_from_bytes` will only accept signed packages.

```c
int JadeView_set_public_key(const char* public_key);
```

**Parameters:**

- `public_key` `string` - Base64-encoded Ed25519 public key (44 characters)

**Return value:**

- `0` - Success
- Negative number - Error code

---

### JadeView_load_from_bytes

Loads a JAPK package from memory.

```c
int JadeView_load_from_bytes(const uint8_t* japk_data, size_t data_size);
```

**Parameters:**

- `japk_data` `uint8_t*` - Pointer to the JAPK file data
- `data_size` `size_t` - Data size (in bytes)

**Return value:**

- `0` - Loaded successfully
- Negative number - Error code; see the error code table below

**Call order**:

1. `JadeView_init` — Initialize the runtime
2. `JadeView_set_public_key` — (Optional) Set the public key
3. `JadeView_load_from_bytes` — Load the JAPK data

---

### JadeView_is_loaded

Checks whether a JAPK package has been loaded successfully.

```c
int JadeView_is_loaded(void);
```

**Return value:**

- `1` - Loaded
- `0` - Not loaded

---

### JadeView_get_app_signature

Returns the `app_signature` set during `JadeView_init` (regardless of whether a package is loaded or its package type).

```c
char* JadeView_get_app_signature(void);
```

**Return value:**

- Non-NULL - The application identifier string; the caller must free it with `jade_text_free`

---

### JadeView_get_signature_info

Returns the signature information JSON. Has a value only after a signed package has been loaded successfully.

```c
char* JadeView_get_signature_info(void);
```

**Return value:**

- Non-NULL - The signature information JSON string; the caller must free it with `jade_text_free`

---

### JadeView_unload

Clears the loaded state and releases the in-memory JAPK data.

```c
int JadeView_unload(void);
```

---

## Error Codes

| Value | Constant | Description |
|----|------|------|
| `0` | `JADEVIEW_JAPK_OK` | Success |
| `-1` | `JADEVIEW_JAPK_ERROR_INVALID_PARAM` | Invalid parameter (null pointer / size 0) |
| `-2` | `JADEVIEW_JAPK_ERROR_NOT_INITIALIZED` | `JadeView_init` was not called |
| `-3` | `JADEVIEW_JAPK_ERROR_LOAD_FAILED` | Load failed |
| `-4` | `JADEVIEW_JAPK_ERROR_INVALID_FORMAT` | Invalid / unsupported format |
| `-5` | `JADEVIEW_JAPK_ERROR_INVALID_SIGNATURE` | Signature verification failed |
| `-6` | `JADEVIEW_JAPK_ERROR_APP_MISMATCH` | app_signature/app_name mismatch |
| `-7` | `JADEVIEW_JAPK_ERROR_DECRYPT_FAILED` | Decryption / deobfuscation failed |
| `-8` | `JADEVIEW_JAPK_ERROR_UNSIGNED_NOT_ALLOWED` | Signed package is missing a signature |
| `-9` | `JADEVIEW_JAPK_ERROR_MISSING_PUBLIC_KEY` | Public key not set |
| `-10` | `JADEVIEW_JAPK_ERROR_INVALID_PUBLIC_KEY` | Invalid public key format |
| `-11` | `JADEVIEW_JAPK_ERROR_POLICY_DENIED` | Denied by security policy |
| `-12` | `JADEVIEW_JAPK_ERROR_NOT_LOADED` | Not loaded |

---

## Events

The loading process is notified asynchronously via callbacks registered with `jade_on`:

### japk-load-success

Triggered when loading succeeds; the callback receives JSON data:

```json
{
  "app_signature": "com.example.app",
  "app_name": "MyApp",
  "asar_size": 1048576,
  "type": "signed"
}
```

| Field | Signed package | Obfuscated package |
|------|:------:|:------:|
| `app_signature` | ✓ | ✗ |
| `app_name` | ✓ | ✗ |
| `asar_size` | ✓ | ✓ |
| `type` | `"signed"` | `"scrambled"` |

### japk-load-failed

Triggered when loading fails; the callback receives a plain-text error message, such as `"Signature verification failed"`.

---

## Usage Examples

### C

```c
#include "JadeView.h"

void load_from_memory_example() {
    // 1. Initialize
    JadeView_init(1, NULL, NULL, "MyApp", "com.example.app", 0);

    // 2. Read the JAPK file into memory
    FILE* f = fopen("app.japk", "rb");
    fseek(f, 0, SEEK_END);
    size_t size = ftell(f);
    fseek(f, 0, SEEK_SET);
    uint8_t* data = malloc(size);
    fread(data, 1, size, f);
    fclose(f);

    // 3. Load from memory (obfuscated package, no public key required)
    int rc = JadeView_load_from_bytes(data, size);
    if (rc != 0) {
        printf("Load failed: %d\n", rc);
        free(data);
        return;
    }

    // 4. Get the protocol URL (pass an empty string for memory loading)
    char url_buffer[256];
    set_protocol_service_path("", url_buffer, sizeof(url_buffer), 0);  // 4th param hot_reload; pass 0 for memory loading
    // url_buffer content looks like: JADE://{app_signature}/ (app_signature is the 5th JadeView_init arg, lowercased)

    // 5. Create a window using that URL
    WebViewWindowOptions options = {
        .title = "JAPK Memory Load",
        .width = 800,
        .height = 600,
        .frame_style = "normal"
    };
    create_webview_window(url_buffer, 0, &options, NULL);

    free(data);
}
```

### Loading a Signed Package

```c
// After setting the public key, only signed packages are accepted
JadeView_set_public_key("QeeOu5LQdQooeyOID6h/ChFEo5RhbAFoKgslznp5Nbk=");

int rc = JadeView_load_from_bytes(data, size);
// Now only JAPKV002 signed packages are accepted
```

### Python (ctypes)

```python
import ctypes
from ctypes import c_char_p, c_int, c_uint8, c_size_t, POINTER

dll = ctypes.WinDLL("JadeView.dll")

dll.JadeView_init.argtypes = [c_int, c_char_p, c_char_p, c_char_p, c_char_p, c_int]
dll.JadeView_init.restype = c_int

dll.JadeView_load_from_bytes.argtypes = [POINTER(c_uint8), c_size_t]
dll.JadeView_load_from_bytes.restype = c_int

dll.JadeView_is_loaded.argtypes = []
dll.JadeView_is_loaded.restype = c_int

# 1. Initialize
dll.JadeView_init(1, None, b"./data", b"MyApp", b"com.example.app", 0)

# 2. Read the JAPK into memory
with open("app.japk", "rb") as f:
    japk_data = f.read()

# 3. Load from memory (obfuscated package)
data_ptr = (c_uint8 * len(japk_data)).from_buffer_copy(japk_data)
rc = dll.JadeView_load_from_bytes(data_ptr, len(japk_data))
if rc != 0:
    raise RuntimeError(f"JadeView_load_from_bytes failed: {rc}")

# 4. Get the protocol URL (pass an empty string for memory loading)
dll.set_protocol_service_path.argtypes = [c_char_p, c_char_p, c_size_t, c_int]
dll.set_protocol_service_path.restype = c_int

url_buffer = ctypes.create_string_buffer(256)
dll.set_protocol_service_path(b"", url_buffer, 256, 0)  # 4th param hot_reload; pass 0 for memory loading
print(f"Protocol URL: {url_buffer.value.decode()}")

# 5. Create a window using that URL
loaded = dll.JadeView_is_loaded()
print(f"JAPK loaded: {loaded}")
```

Loading a signed package requires additionally setting the public key:

```python
dll.JadeView_set_public_key.argtypes = [c_char_p]
dll.JadeView_set_public_key.restype = c_int

dll.JadeView_set_public_key(b"QeeOu5LQdQooeyOID6h/ChFEo5RhbAFoKgslznp5Nbk=")
rc = dll.JadeView_load_from_bytes(data_ptr, len(japk_data))
```

---

## Full Call Sequence

```
Caller                          JadeView DLL
  │                                 │
  ├─ JadeView_init ────────────────►│ Initialize
  │                                 │
  ├─ JadeView_set_public_key ──────►│ (Optional) Set verification public key
  │                                 │
  ├─ jade_on("japk-load-success")──►│ Register success callback
  ├─ jade_on("japk-load-failed") ──►│ Register failure callback
  │                                 │
  ├─ JadeView_load_from_bytes ─────►│ Magic detection → signed/obfuscated → ASAR
  │                                 │
  │  ◄── japk-load-success ────────┤ Asynchronous event
  │                                 │
  ├─ set_protocol_service_path("")─►│ Get protocol URL
  │  ◄── url_buffer ───────────────┤ JADE://{app_signature}/
  │                                 │
  ├─ create_webview_window(url) ───►│ Create window
  │                                 │
  ├─ run_message_loop ─────────────►│ Enter the event loop
```
