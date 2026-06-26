---
title: Tools API
order: 1
group:
  title: System & Tools
  order: 5
---

# Tools API

Most of the functions here are **not tied to a specific window**. Instead, they: read the version, get system paths, read language and display information, store configuration in the data directory, clear data, and so on.

For interfaces deeply integrated with the system (URL protocols, file associations, global hotkeys, clipboard, printing, etc.), see [System Integration API](/en-US/docs/api/system-api).

---

## Version & System Information

### Get JadeView version (`jadeview_version`)

Get the complete version number (including the build number) of **the current JadeView dynamic library**, for use in the About page, log headers, and reporting the version when troubleshooting.

```c
int32_t jadeview_version(char* buffer, size_t buffer_size);
```

| Parameter | Description |
|------|------|
| `buffer` | Output buffer; a **UTF-8** string is written, terminated with `\0`. |
| `buffer_size` | Buffer length in bytes; it must be long enough, otherwise the call fails. |

| Return value | Meaning |
|--------|------|
| `1` | The version string was written successfully. |
| `0` | Failure (null pointer, buffer too small, etc.). |

---

### Get WebView version (`get_webview_version`)

Writes the local **WebView2 runtime** version number into `buffer` (UTF-8 + `\0`). This is **not** the version of the JadeView DLL itself (that is `jadeview_version`).

```c
int32_t get_webview_version(char* buffer, size_t buffer_size);
```

Returns `1` on success and `0` on failure (insufficient buffer, invalid pointer, etc.).

---

### Get system language (`getLocale`)

Reads the **current Windows user interface language** (regional setting) and returns a standard language tag string. Common uses: deciding whether the main process or web page should use a Chinese or English interface, and passing the language parameter to the renderer process for i18n.

```c
int32_t getLocale(char* buffer, size_t buffer_size);
```

Example values written: `zh-CN`, `en-US`. This is not the keyboard layout, but the **system display language / region** set.

`1` on success, `0` on failure (insufficient buffer, invalid pointer, etc.).

---

### Check whether the system is Windows 11 (`is_windows_11`)

```c
int32_t is_windows_11(void);
```

Returns `1` if the current system is **Windows 11**, otherwise `0`. Used to determine whether features such as Mica or certain shell capabilities are available.

---

## Paths & Displays

### Get system path (`getPath`)

Use a **fixed English keyword** to query the **absolute path** of a category of directory, avoiding the need to assemble environment variables yourself in C or to handle paths with Chinese user names. For example, when you want to place logs, read "My Documents", or find the directory of the exe, you can ask this interface.

```c
int32_t getPath(const char* name, char* buffer, size_t buffer_size);
```

| `name` | Roughly corresponds to (common Windows cases) |
|--------|------------------------------|
| `home` | The current user's home directory (similar to the personal directory above the "Users" folder in File Explorer). |
| `appData` | The per-user application data directory (often close to `%LOCALAPPDATA%`). |
| `sessionData` | The directory related to the WebView session/cache (a sub-path under the data directory configured in JadeView). |
| `temp` | The system temporary directory. |
| `exe` | The full path of **the current main process exe** (whoever loaded the DLL). |
| `desktop` / `documents` / `downloads` / `music` / `pictures` / `videos` | User folders such as Desktop, Documents, Downloads, Music, Pictures, Videos, etc. |
| `logs` | The application log directory (under the data directory; it may be created if it does not exist). |
| `app` | **The directory containing the exe** (the installation directory), suitable for reading resources in the same directory. |

On success, the path is written to `buffer` (UTF-8 + `\0`). Returns `0` on failure.

---

### Get display information (`get_displays_info`)

Get the layout and resolution information of **all displays on the machine** at once, making it convenient to: decide on which screen a window appears in a multi-display setup, compute scaled logical coordinates, determine which is the primary screen, and adapt to high DPI.

```c
int32_t get_displays_info(char* buffer, size_t buffer_size);
```

On success, `buffer` contains a **UTF-8 JSON array**, where each element corresponds to one screen. Common field meanings:

| Field | Meaning |
|------|------|
| `bounds` | The position and size of the entire screen in the **virtual desktop coordinate system** (physical pixels). |
| `work_area` | The **work area** (excluding the region occupied by the taskbar, etc.), suitable for computing "do not let the window cover the taskbar". |
| `scale_factor` | The scaling ratio (e.g., 1.0, 1.25, 1.5), consistent with the system's "Scale and layout". |
| `dpi_x` / `dpi_y` | DPI, usable for fine-grained adaptation. |
| `is_primary` | Whether it is the primary display. |

Returns `0` on failure (insufficient buffer, parse failure, etc.).

---


### Clear the data directory (`clear_data_directory`)

**Clears** the contents of the data directory currently used by JadeView (cache, local configuration, etc.), equivalent to "resetting this application's data on this machine". You must pass the correct confirmation token to prevent accidental triggering.

```c
int32_t clear_data_directory(const char* confirm_token);
```

`confirm_token` must be **exactly equal** to the string `I_UNDERSTAND_CLEAR_DATA` (consistent with the constant in the source code).

---

## Text Processing

### Smart text re-encoding (`smart_convert_encoding`)

:::warning
Supported since v2.2.
:::

Automatically detects the encoding of the input text and converts it to the target encoding.

```c
int32_t smart_convert_encoding(
  const uint8_t* input_data,
  int32_t input_len,
  const char* target_encoding,
  char* output_buffer,
  int32_t buffer_size,
  char* detected_encoding,
  int32_t detected_encoding_size
);
```

**Parameters:**

- `input_data` `const uint8_t*` - Input byte stream
- `input_len` `int32_t` - Input byte length
- `target_encoding` `const char*` - Target encoding name, case-insensitive, supporting WhatWG standard names and aliases:
  - UTF-8: `utf-8`, `utf8`, `unicode-1-1-utf-8`
  - GBK: `gbk`, `gb2312`, `gb18030`, `chinese`, `csgb2312`
  - Shift_JIS: `shift_jis`, `sjis`, `shift-jis`, `ms_kanji`
  - Big5: `big5`, `big5-hkscs`, `cn-big5`, `csbig5`
  - EUC-KR: `euc-kr`, `cseuckr`, `korean`
  - windows-1252: `windows-1252`, `ascii`, `latin1`, `iso-8859-1`
  - For the complete list, see [WhatWG Encoding Standard](https://encoding.spec.whatwg.org/)
- `output_buffer` `char*` - Output buffer (NUL-terminated)
- `buffer_size` `int32_t` - Output buffer size (bytes)
- `detected_encoding` `char*` - [output] The detected source encoding name (may be NULL)
- `detected_encoding_size` `int32_t` - detected_encoding buffer size

**Return value:**

| Return value | Meaning |
|--------|------|
| `>0` | Success; the number of bytes written to the output buffer (excluding NUL) |
| `0` | Failure (invalid parameter, encoding detection failure, target encoding unsupported, etc.) |
| `<0` | Insufficient buffer; the absolute value is the required buffer size |

**Detection logic:**

1. BOM takes priority (UTF-8 BOM / UTF-16 LE BOM / UTF-16 BE BOM)
2. When there is no BOM, chardetng smart detection is used
3. When the source encoding and target encoding are the same, it copies directly

---

### Text memory management (`jade_text_create` / `jade_text_free`)

```c
char* jade_text_create(const char* text);
void jade_text_free(char* ptr);
```

- **`jade_text_create`**: Copies a piece of **UTF-8** text onto the heap and returns a pointer, used by **`register_ipc_handler`** and the like to return a **dynamic-length** response; after the library finishes reading the response it will call **`jade_text_free`**. Mixing this with manual `malloc`+`free` is error-prone, so please use this API in pairs.
- **`jade_text_free`**: Frees a pointer allocated by **`jade_text_create`**; do **not** call it on stack memory or on pointers from other `malloc` paths.

If `invoke` only needs **default success** with no custom JSON, you can return a placeholder such as **`NULL`** or **`(const char*)(uintptr_t)1`** (this does **not** mean "block"; see [IPC Communication API](/en-US/docs/api/ipc-api)).
