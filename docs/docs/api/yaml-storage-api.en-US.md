---
title: YAML Storage API
order: 2
group:
  title: System & Tools
  order: 5
---

# YAML Storage API

:::warning
Significantly expanded in 2.3. `yaml_set` / `yaml_get` are available since 2.0; 2.3 adds `yaml_set_str`, `yaml_get_str`, `yaml_get_all`, `yaml_has`, `yaml_delete`, `yaml_clear`, `yaml_delete_file`, `yaml_keys`, `yaml_len` and other interfaces, and enhances the path syntax, return value semantics, and write safety.
:::

JadeView provides a set of C FFI interfaces for reading and writing YAML-formatted persistent data (theme, last opened path, various toggles, etc.) under `data_directory`. All file operations go through a safe path check (to prevent path traversal), and support file locks and atomic writes.

This set of interfaces does **not** need to go through the web page, making it suitable for the main process to persist a small amount of key-value structures itself. For other tool capabilities, see [Tools API](/en-US/docs/api/tools-api).

## Prerequisites

Before calling any YAML API, you must first initialize via [`JadeView_init`](/en-US/docs/api/index) and set `data_directory`. The YAML files will be stored under that directory.

---

## Interface Overview

| Interface | Description | Version |
|------|------|------|
| `yaml_set` | Set a path value (with automatic type parsing) | 2.0 |
| `yaml_get` | Get a path value (JSON format, two-phase query) | 2.0 |
| `yaml_set_str` | Force string storage | 2.3 |
| `yaml_get_str` | Get a path value (allocated with `CoTaskMemAlloc`, caller must free) | 2.3 |
| `yaml_get_all` | Read the entire file | 2.3 |
| `yaml_has` | Check whether a path exists | 2.3 |
| `yaml_delete` | Delete a specified path | 2.3 |
| `yaml_clear` | Clear the file to `{}` | 2.3 |
| `yaml_delete_file` | Delete the file | 2.3 |
| `yaml_keys` | List all keys under a path | 2.3 |
| `yaml_len` | Return array length / object key count | 2.3 |

---

## Path Syntax

Paths use the dot `.` to separate levels, and square brackets `[N]` to access array indices (the array index syntax is **new in 2.3**):

```
user.name          → mapping key
items[0]           → the 0th element of an array
users[0].name      → mapping nested in an array
matrix[0][1]       → multi-dimensional array
```

- When a path does not exist, `yaml_set` automatically creates intermediate nodes (mapping or array).
- When an array index is out of bounds, it is automatically padded with `null` up to the target position.

---

## Return Value Semantics

:::warning
2.3 adds negative error code semantics; read interfaces such as `yaml_get` add two-phase query return values.
:::

| Return value | Meaning |
|--------|------|
| `1` | Success |
| `≥ 2` | getter two-phase query: the number of bytes needed (including NUL) |
| `0` | Path does not exist / file does not exist / no-op |
| `-1` | IO error |
| `-2` | Type mismatch (e.g. an intermediate node is not a mapping/array) |
| `-3` | Target already exists |
| `-4` | Format parsing failed |

---

## Interface Details

### Set a Value (`yaml_set`)

```c
int yaml_set(const char* file_name, const char* key_path, const char* value);
```

Sets the value at the specified path. `value` is parsed with the following priority (since 2.3, `yaml_set` automatically parses numbers and booleans; the original `yaml_set_num` / `yaml_set_bool` have been merged into it):

1. **JSON parsing** — `"123"` → the number 123, `"true"` → the boolean true, `"[1,2]"` → an array
2. **YAML fragment parsing** — complex YAML structures
3. **Plain text storage** — stored as a string when all of the above fail

```c
// number
yaml_set("config", "server.port", "8080");    // stored as the number 8080

// boolean
yaml_set("config", "debug.enabled", "true");  // stored as the boolean true

// string
yaml_set("config", "app.title", "My App");    // stored as the string "My App"

// array index (2.3)
yaml_set("config", "tags[0]", "rust");        // tags: [rust]
yaml_set("config", "tags[1]", "webview");     // tags: [rust, webview]

// nested
yaml_set("config", "db.primary.host", "localhost");
```

:::info
When an intermediate node already exists and is not a mapping or is non-empty, it returns `-2` and **does not overwrite** existing data.
:::

---

### Get a Value (`yaml_get`)

```c
int yaml_get(const char* file_name, const char* key_path, char* buffer, size_t buffer_size);
```

Gets the value at the specified path and writes it as a JSON string into `buffer`.

**Two-phase query (2.3)**: when `buffer` is null or `buffer_size` is insufficient, it returns the number of bytes needed (including NUL) without writing data. The caller can use this to allocate enough space and then call again.

```c
// Phase one: query the number of bytes needed
int needed = yaml_get("config", "server.port", NULL, 0);
// needed >= 2

// Phase two: allocate buffer and read
char* buf = malloc(needed);
int rc = yaml_get("config", "server.port", buf, needed);
// rc == 1, buf == "8080"
free(buf);
```

---

### Force String Storage (`yaml_set_str`)

:::warning
Supported since v2.3.
:::

```c
int yaml_set_str(const char* file_name, const char* key_path, const char* value);
```

Similar to `yaml_set`, but **forces value to be stored as a string** without attempting JSON/YAML parsing.

```c
yaml_set_str("config", "user.id", "12345");
// stored as the string "12345" rather than the number 12345
```

---

### Get a Value (Pointer Version, `yaml_get_str`)

:::warning
Supported since v2.3.
:::

```c
char* yaml_get_str(const char* file_name, const char* key_path);
```

Gets the value at the specified path and returns a pointer to a JSON string. Internally it allocates memory using `CoTaskMemAlloc`, and **the caller must free it with `CoTaskMemFree`**.

```c
char* ptr = yaml_get_str("config", "app.title");
if (ptr) {
    printf("title: %s\n", ptr);
    CoTaskMemFree(ptr);  // must be freed
}
```

Returns `NULL` when the path does not exist.

---

### Read the Entire File (`yaml_get_all`)

:::warning
Supported since v2.3.
:::

```c
int yaml_get_all(const char* file_name, char* buffer, size_t buffer_size);
```

Reads the entire YAML file and writes it as a JSON string into `buffer`. Supports two-phase query (returns the number of bytes needed when the buffer is insufficient).

---

### Check Whether a Path Exists (`yaml_has`)

:::warning
Supported since v2.3.
:::

```c
int yaml_has(const char* file_name, const char* key_path);
```

Checks whether a path exists. Returns `1` if it exists, `0` if it does not.

---

### Delete a Path (`yaml_delete`)

:::warning
Supported since v2.3.
:::

```c
int yaml_delete(const char* file_name, const char* key_path);
```

Deletes the key or array element at the specified path.

> Note: in the current implementation, after deleting an array element, the subsequent elements **shift forward** (`Vec::remove` semantics); later versions may change this to leaving a gap, so do not rely on this behavior.

---

### Clear the File (`yaml_clear`)

:::warning
Supported since v2.3.
:::

```c
int yaml_clear(const char* file_name);
```

Clears the file content to `{}`.

---

### Delete the File (`yaml_delete_file`)

:::warning
Supported since v2.3.
:::

```c
int yaml_delete_file(const char* file_name);
```

Deletes the data file, and also cleans up the associated lock file and temporary file.

---

### List Keys (`yaml_keys`)

:::warning
Supported since v2.3.
:::

```c
int yaml_keys(const char* file_name, const char* key_path, char* buffer, size_t buffer_size);
```

Lists all keys under the specified path and writes them as a JSON array into `buffer`.

- Mapping type: returns an array of key strings, e.g. `["name", "age", "active"]`
- Array type: returns an array of indices, e.g. `[0, 1, 2]`
- When `key_path` is an empty string, the root node is queried

Supports two-phase query.

---

### Return Length (`yaml_len`)

:::warning
Supported since v2.3.
:::

```c
int yaml_len(const char* file_name, const char* key_path);
```

Returns the number of keys in a mapping or the length of an array. When `key_path` is an empty string, the root node is queried.

- Returns `≥ 0`: the length
- Returns `-2`: the target is not a mapping/array

---

## File Safety

:::warning
2.3 strengthens write safety: atomic writes, file locks, and no disk write on serialization failure.
:::

- **Path traversal protection**: `file_name` is not allowed to contain `\`, `/`, `..`, or `:`.
- **Atomic writes**: write to a temporary file first, then rename, with retries on Windows, to avoid corrupting the file if the write is interrupted.
- **File locks**: use `CreateFileW` + `LockFileEx`, with an exclusive lock for write operations and a shared lock for read operations.
- **Serialization safety**: when serialization fails, it returns `-1` and **does not write to disk**, avoiding clearing an existing file.

> The internal implementation has migrated from `serde_yaml` to `serde_yml` since 2.3.

---

## Python Calling Example

```python
import ctypes
import json
from ctypes import c_char_p, c_int, c_void_p, c_size_t

dll = ctypes.WinDLL("JadeView.dll")

# bindings
dll.yaml_set.argtypes = [c_char_p, c_char_p, c_char_p]
dll.yaml_set.restype = c_int
dll.yaml_get.argtypes = [c_char_p, c_char_p, c_char_p, c_size_t]
dll.yaml_get.restype = c_int
dll.yaml_get_str.argtypes = [c_char_p, c_char_p]
dll.yaml_get_str.restype = c_void_p  # must use c_void_p, not c_char_p
dll.yaml_has.argtypes = [c_char_p, c_char_p]
dll.yaml_has.restype = c_int

# write
dll.yaml_set(b"config", b"app.name", b"MyApp")
dll.yaml_set(b"config", b"app.version", b"1.0")

# read
buf = ctypes.create_string_buffer(1024)
rc = dll.yaml_get(b"config", b"app.name", buf, ctypes.sizeof(buf))
if rc == 1:
    name = json.loads(buf.value.decode("utf-8"))
    print(f"app.name = {name}")

# yaml_get_str (note the free)
ptr = dll.yaml_get_str(b"config", b"app.name")
if ptr:
    val = json.loads(ctypes.string_at(ptr).decode("utf-8"))
    ctypes.windll.ole32.CoTaskMemFree(ctypes.c_void_p(ptr))
    print(f"app.name = {val}")

# check existence
if dll.yaml_has(b"config", b"app.name") == 1:
    print("app.name exists")
```
