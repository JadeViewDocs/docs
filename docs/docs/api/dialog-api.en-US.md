---
title: Dialog API
order: 0
group:
  title: Native UI
  order: 4
---

# Dialog API

The Dialog API provides the ability to pop up native Windows dialogs, including file selection, save as, message boxes, and more, without having to draw the UI yourself.

The 2.0 preview refactored this module:
- Synchronous interfaces block by default and return a JSON string directly
- Added `*_async` asynchronous interfaces

---

## Common Conventions

Before using the Dialog API, get familiar with some common parameters and conventions:

- `window_id` - Acts as the parent window, determining which window the dialog is modally attached to
- `filters` - File type filtering for file dialogs, a JSON array string such as `[{"name":"Image Files","extensions":["jpg","png"]}]`; `"*"` can be used in `extensions` to mean all files
- `properties` - Behavior options for opening the dialog, a comma-separated list of feature names, such as `openFile,openDirectory,multiSelections,showHiddenFiles`
- Synchronous return value - `char*` (UTF-8 JSON), which must be released by calling `jade_text_free()` after use
- Asynchronous callback - `void (JADEVIEW_CALL *callback)(const char* json_result)`; the pointer is managed by the library and becomes invalid after the callback returns

:::error{title="Important Reminder"}
The synchronous return values of `jade_dialog_show_open_dialog`, `jade_dialog_show_save_dialog`, and `jade_dialog_show_message_box` are all strings allocated on the heap by JadeView.

As long as you obtain a `char*` — whether it represents success, cancellation, or an error — you should call `jade_text_free(ptr)` once after you are done using it.

If you do not release it, long-running processes will continuously leak memory; if you release it more than once or release a pointer not allocated by JadeView, it may cause a crash.
:::

---

## Simple C++ Example (Synchronous API)

```cpp
#include "JadeView.h"
#include <cstdio>

void example_sync_dialog() {
  FileDialogParams params = {};
  params.window_id = 1;
  params.title = "Select file";
  params.default_path = "D:/";
  params.filters = R"([{"name":"Images","extensions":["jpg","png"]}])";
  params.properties = "openFile";

  char* json = jade_dialog_show_open_dialog(&params);
  if (json) {
    std::printf("open dialog result: %s\n", json);
    jade_text_free(json);  // Synchronous return strings must be released
  }
}
```

---

## Simple C++ Example (Asynchronous API)

```cpp
#include "JadeView.h"
#include <cstdio>

void JADEVIEW_CALL OnMessageBoxDone(const char* json_result) {
  std::printf("message box result: %s\n", json_result ? json_result : "{}");
}

void example_async_dialog() {
  MessageBoxParams params = {};
  params.window_id = 1;
  params.title = "Confirm";
  params.message = "Continue?";
  params.buttons = "OK|Cancel";
  params.default_id = 0;
  params.cancel_id = 1;
  params.type_ = "question";

  int32_t ok = jade_dialog_show_message_box_async(&params, OnMessageBoxDone);
  std::printf("launch async dialog: %d\n", ok);
}
```

---

## File Dialog Parameter Structure

The 2.0 preview merges the old `OpenDialogParams` and `SaveDialogParams` into a unified `FileDialogParams` struct, used to configure the various options of a file dialog.

```c
typedef struct FileDialogParams {
  uint32_t window_id;
  const char *title;
  const char *default_path;
  const char *button_label;
  const char *filters;
  const char *properties;
} FileDialogParams;
```

**Detailed parameter descriptions:**

- `window_id` `uint32_t` - Parent window ID; the dialog pops up as a modal dialog of that window. Pass `0` to indicate no specific parent window
- `title` `string` (optional) - Text for the dialog title bar; pass `NULL` or an empty string to use the default title
- `default_path` `string` (optional) - The path opened by default; the dialog will navigate to this directory when opened. Pass `NULL` or an empty string to use the system default location
- `button_label` `string` (optional) - Text for the confirm button; only takes effect on some systems. Pass `NULL` or an empty string to use the default text
- `filters` `string` - File type filtering rules, a JSON array string defining which types of files can be selected
- `properties` `string` (optional) - Dialog behavior options, a comma-separated string of feature names that control the dialog's functionality

### filters Parameter Example

```json
[
  {
    "name": "Image Files",
    "extensions": ["jpg", "jpeg", "png", "gif"]
  },
  {
    "name": "All Files",
    "extensions": ["*"]
  }
]
```

### properties Parameter Options

- `openFile` - Allow selecting files
- `openDirectory` - Allow selecting folders
- `multiSelections` - Allow selecting multiple files/folders
- `showHiddenFiles` - Show hidden files
- `createDirectory` - Allow creating new folders
- `treatPackageAsDirectory` - Treat packages as directories (macOS)

### properties Parameter Example

```
openFile,multiSelections,showHiddenFiles
```

---

## Open File Dialog (Synchronous)

Pops up an "Open File" dialog to select one or more files. This function is a synchronous, blocking interface that returns a JSON string directly.

```c
char* jade_dialog_show_open_dialog(const FileDialogParams* params);
```

**Parameters:**

- `params` `FileDialogParams*` - Pointer to a `FileDialogParams` struct that configures the dialog options

**Return value:**

Returns a UTF-8 encoded JSON string, which must be released by calling `jade_text_free()` after use.

**Returned JSON examples:**

**Successfully selecting a single file:**

```json
{
  "canceled": false,
  "file_paths": ["D:/Documents/image.jpg"]
}
```

**Successfully selecting multiple files (requires multiSelections enabled):**

```json
{
  "canceled": false,
  "file_paths": ["D:/a.jpg", "D:/b.png"]
}
```

**User cancels the selection:**

```json
{
  "canceled": true,
  "file_paths": []
}
```

---

## Save File Dialog (Synchronous)

Pops up a "Save As" dialog to choose the file save location. This function is a synchronous, blocking interface that returns a JSON string directly.

```c
char* jade_dialog_show_save_dialog(const FileDialogParams* params);
```

**Parameters:**

- `params` `FileDialogParams*` - Pointer to a `FileDialogParams` struct that configures the dialog options

**Return value:**

Returns a UTF-8 encoded JSON string, which must be released by calling `jade_text_free()` after use.

**Returned JSON examples:**

**Successfully choosing a save location:**

```json
{
  "canceled": false,
  "file_path": "D:/Documents/output.txt"
}
```

**User cancels the save:**

```json
{
  "canceled": true,
  "file_path": null
}
```

---

## Message Box (Synchronous)

Pops up a message box with an icon (info, warning, error, etc.) and customizable buttons. This function is a synchronous, blocking interface that returns a JSON string directly.

```c
typedef struct MessageBoxParams {
  uint32_t window_id;
  const char *title;
  const char *message;
  const char *detail;
  const char *buttons;
  int32_t default_id;
  int32_t cancel_id;
  const char *type_;
} MessageBoxParams;

char* jade_dialog_show_message_box(const MessageBoxParams* params);
```

**Message box parameter descriptions (`MessageBoxParams`):**

- `window_id` `uint32_t` - Parent window ID; pass `0` to indicate no specific parent window
- `title` `string` - Text for the dialog title bar
- `message` `string` - The main message text, displayed at the top of the dialog
- `detail` `string` (optional) - Supplementary description text, displayed below the main message; can span multiple lines
- `buttons` `string` - Button list, with multiple button names separated by `\|`, such as `"OK\|Cancel"`
- `default_id` `int32_t` - Index of the button focused by default, starting from 0
- `cancel_id` `int32_t` - Index of the button triggered when pressing Esc or clicking the close button, starting from 0
- `type_` `string` - Dialog type, which controls the icon style

### type_ Options

- `none` - No icon
- `info` - Information notice ℹ️
- `warning` - Warning notice ⚠️
- `error` - Error notice ❌
- `question` - Question notice ❓

**Return value:**

Returns a UTF-8 encoded JSON string, which must be released by calling `jade_text_free()` after use.

**Returned JSON example:**

```json
{
  "response": 0
}
```

The value of the `response` field is the index of the button the user clicked, starting from 0.

---

## Quick Error Box

Quickly pops up an error notice with only a title and content, generally used for serious errors that do not require the user to choose among multiple buttons.

```c
int32_t jade_dialog_show_error_box(
  uint32_t window_id, 
  const char* title, 
  const char* content
);
```

**Parameters:**

- `window_id` `uint32_t` - Parent window ID; pass `0` to indicate no specific parent window
- `title` `string` - Error notice title
- `content` `string` - Error notice content

**Return value:**

- `1` - Successfully popped up the message box
- `0` - Failed

---

## Asynchronous Dialog API

If you do not want to block the main thread, you can use the asynchronous versions of the Dialog API.

```c
typedef void (JADEVIEW_CALL *DialogAsyncCallback)(const char* json_result);

int32_t jade_dialog_show_open_dialog_async(
    const FileDialogParams* params,
    DialogAsyncCallback callback);

int32_t jade_dialog_show_save_dialog_async(
    const FileDialogParams* params,
    DialogAsyncCallback callback);

int32_t JADEVIEW_CALL jade_dialog_show_message_box_async(
    const MessageBoxParams* params,
    DialogAsyncCallback callback);
```

**Parameters:**

- `params` - Pointer to the dialog parameter struct
- `callback` `DialogAsyncCallback` - Asynchronous callback, with the function signature `void (JADEVIEW_CALL *)(const char* json_result)`; the parameter is the UTF-8 JSON result

**Return value:**

- `1` - Successfully launched the dialog
- `0` - Failed

**Notes:**

- A return of `1/0` indicates whether the dialog was successfully launched
- After the user completes their action, the UTF-8 JSON result is returned via `callback`
- The callback parameter is managed by the library; if you need to keep it long-term, copy the string yourself
- After the callback returns, the `json_result` pointer is no longer valid

## Print Dialog

### Print a Local File (`jade_print_dialog`)

:::warning
Supported since v2.2.
:::

Prints the specified file using the system's associated program, popping up the system print dialog.

```c
int32_t jade_print_dialog(const char* file_path);
```

- **Parameter**: `file_path` `string` - The absolute path of the file to print
- **Return value**: `1` = success, `0` = failure

Difference from `jade_print(window_id)`:

| API | Purpose |
|-----|------|
| `jade_print(window_id)` | Print web page content (WebView built-in print dialog) |
| `jade_print_dialog(file_path)` | Print a local file |

:::info{title=Platform Support}
Available on both Windows and Linux:
- **Windows**: `ShellExecuteW("print", file_path)`; the system invokes the associated program by file extension to perform printing.
- **Linux**: CUPS `lp <file>` submits the job to the default printer; a return of `1` means the job was **submitted successfully** (consistent with Windows' "printing started" semantics, not "already printed"). The CUPS client (`cups-client`) must be installed.
:::

---

## About Dialog

### Show the About Dialog (`show_about_dialog`)

:::warning
Supported since v2.2.
:::

Pops up the system's standard "About" dialog.

```c
int show_about_dialog(uint32_t window_id);
```

- The application name is automatically read from the `app_name` set during `JadeView_init`
- The icon automatically uses the window's current icon

:::warning{title=Platform Differences}
Currently **only implemented on Windows**; **Linux is a no-op** (the GTK about dialog is not yet integrated). Other dialogs such as file selection, save, and message boxes are all supported on Linux (GTK3).
:::

---

## Breaking Changes (Must Modify)

When upgrading from an older version to 2.0, note the following changes:

- Removed `OpenDialogParams` / `SaveDialogParams`; use `FileDialogParams` instead
- `MessageBoxParams` no longer includes `blocking/callback`
- `jade_dialog_show_open_dialog` / `jade_dialog_show_save_dialog` / `jade_dialog_show_message_box` changed from returning `int32_t` to returning `char*`
- All synchronously returned strings must be released with `jade_text_free()`

---

## Migration Advice (Shortest Path)

1. First update the FFI declarations: adjust the structs together with `restype/argtypes`
2. Change the synchronous flow to read the returned JSON directly, no longer relying on `blocking` switching and callbacks
3. When non-blocking behavior is needed, switch to the `*_async` interfaces
4. Wrap a consistent release habit around the synchronous interfaces: **read the result → process the business logic → `jade_text_free`** (it is recommended to use `try/finally` or an equivalent mechanism to guarantee release)

---

## Calling from Web Pages

Pages use **`jade.dialog.*`**, which returns a Promise; see [Dialog Frontend API](/en-US/docs/api/dialog-frontend-api).
