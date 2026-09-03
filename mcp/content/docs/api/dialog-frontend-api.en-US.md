---
title: Dialog Frontend API
order: 1
group:
  title: Frontend API
  order: 2
---

# Dialog Frontend API

**Purpose**: Pop up native system file dialogs, save dialogs, and message dialogs directly from **HTML/JS**, instead of drawing them yourself with divs. You call methods on **`jade.dialog`**, which return a **Promise**, and the result contains a path or which button the user clicked.

The method shape is close to the **Electron `dialog` module** (Promises, options objects); for the corresponding C-side structs, see [Dialog API](/en-US/docs/api/dialog-api).

---

## Common Methods at a Glance

| Method | What it does |
|------|--------|
| `jade.dialog.showOpenDialog(options)` | Let the user **select one or more files**. |
| `jade.dialog.showSaveDialog(options)` | Let the user choose a **save path and file name**. |
| `jade.dialog.showMessageBox(options)` | **Prompt / confirm** (multiple buttons, icon type, etc.). |
| `jade.dialog.showErrorBox(title, content)` | **Simple error dialog**, with only a confirm button. |

---

## showOpenDialog

Displays an open file dialog, used to select one or more files.

**Parameters** — `options` (Object):

- `title` — Dialog title
- `defaultPath` — Default path to open
- `buttonLabel` — Custom label for the confirm button
- `filters` — Array of file filters, in the format `[{ name: string, extensions: string[] }]`
- `properties` — Array of strings; see the available values below
- `blocking` — Whether to disable the parent window while the dialog is open, defaults to `true` (does not affect JS: the invoke always returns immediately and the result comes back asynchronously via the Promise)

**Return value** — `Promise<Object>`:

- `canceled` — Whether it was canceled
- `filePaths` — Array of selected file paths

**Example**:

```javascript
const result = await jade.dialog.showOpenDialog({
  title: 'Select Image',
  filters: [
    { name: 'Images', extensions: ['jpg', 'png'] },
    { name: 'All Files', extensions: ['*'] }
  ],
  properties: ['openFile', 'multiSelections']
});

if (!result.canceled) {
  console.log('Selected files:', result.filePaths);
}
```

---

## showSaveDialog

Displays a save file dialog.

**Parameters** — `options` (Object):

- `title` — Dialog title
- `defaultPath` — Default save path
- `buttonLabel` — Custom label for the confirm button
- `filters` — Array of file filters
- `blocking` — Whether to disable the parent window while the dialog is open, defaults to `true` (does not affect JS: the invoke always returns immediately and the result comes back asynchronously via the Promise)

**Return value** — `Promise<Object>`:

- `canceled` — Whether it was canceled
- `filePath` — Selected save file path

**Example**:

```javascript
const result = await jade.dialog.showSaveDialog({
  title: 'Save File',
  defaultPath: 'document.txt'
});

if (!result.canceled) {
  console.log('Save path:', result.filePath);
}
```

---

## showMessageBox

Displays a message box, used for information prompts, warnings, or user confirmation.

**Parameters** — `options` (Object):

- `title` — Message box title
- `message` — Message box content
- `detail` — Detailed information
- `buttons` — Array of button text, e.g. `['OK', 'Cancel']`. **Note**: the underlying layer currently supports only "OK" or "OK + Cancel" — if the array contains a cancel keyword (the Chinese 「取消」 or the English `cancel`) it shows "OK + Cancel", otherwise it shows "OK" only; custom text and any third-or-later button have no effect
- `defaultId` — Index of the button selected by default (0-based)
- `cancelId` — Index of the cancel button
- `type` — Icon type; see the available values below
- `blocking` — Whether to disable the parent window while the dialog is open, defaults to `true` (does not affect JS: the invoke always returns immediately and the result comes back asynchronously via the Promise)

**Return value** — `Promise<Object>`:

- `response` — The button the user clicked: `0` = OK, `1` = Cancel, `-1` = closed/error (due to the `buttons` limitation above, an index of `2` or greater never appears)

**Example**:

```javascript
const result = await jade.dialog.showMessageBox({
  title: 'Confirm',
  message: 'Are you sure you want to delete this file?',
  detail: 'This action cannot be undone',
  buttons: ['OK', 'Cancel'],
  defaultId: 1,
  cancelId: 1,
  type: 'warning'
});

if (result.response === 0) {
  console.log('User confirmed');
}
```

---

## showErrorBox

Displays an error dialog.

**Parameters**:

- `title` — Error dialog title
- `content` — Error message content

**Return value** — `Promise<void>`

```javascript
await jade.dialog.showErrorBox('Operation Failed', 'Unable to connect to the server');
```

---

## Options Reference

### type Icon Types

| Value | Description |
|----|------|
| `'none'` | No icon |
| `'info'` | Information |
| `'error'` | Error |
| `'warning'` | Warning |
| `'question'` | Question / confirmation |

### properties Dialog Features

| Property value | Description |
|--------|------|
| `'openFile'` | Allow selecting files (default) |
| `'openDirectory'` | Allow selecting folders |
| `'multiSelections'` | Allow multiple selection |
| `'showHiddenFiles'` | Show hidden files **(not implemented yet, ignored)** |
| `'promptToCreate'` | Prompt to create the file if it does not exist **(not implemented yet, ignored)** |

---

## Complete Example

```javascript
async function openFile() {
  const result = await jade.dialog.showOpenDialog({
    title: 'Select File',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    console.log('Selected files:', result.filePaths);
  }
}

async function saveFile() {
  const result = await jade.dialog.showSaveDialog({
    title: 'Save File',
    defaultPath: 'document.txt'
  });

  if (!result.canceled) {
    console.log('Save path:', result.filePath);
  }
}

async function showConfirm() {
  const result = await jade.dialog.showMessageBox({
    title: 'Confirm',
    message: 'Are you sure you want to delete?',
    buttons: ['OK', 'Cancel'],
    type: 'warning'
  });

  console.log('User selection:', result.response);
}

jade.dialog.showErrorBox('Error', 'Operation failed, please try again');
```

---

## Events

After a dialog operation completes, the corresponding event is fired, which you can listen for via `jade.on`:

| Event name | Trigger timing | Event data |
|--------|----------|----------|
| `dialog-open-file-completed` | Open file dialog closed | `{ canceled, filePaths }` |
| `dialog-save-file-completed` | Save file dialog closed | `{ canceled, filePath }` |
| `dialog-message-box-completed` | Message box closed | `{ response }` |
| `dialog-error-box-completed` | Error dialog closed | None |

```javascript
jade.on('dialog-open-file-completed', (result) => {
  if (!result.canceled) {
    console.log('User selected:', result.filePaths);
  }
});
```

---

## Notes

1. **Blocking option**: `blocking` only controls whether the parent window is disabled while the dialog is open; it does **not** block JS — the frontend invoke always returns immediately, and the result comes back asynchronously via the Promise (and the corresponding completed event).
2. **Filter format**: The `extensions` array does not include the dot, e.g. `png` rather than `.png`.
3. **Path format**: Windows paths use backslashes `\\` or forward slashes `/`.
4. **properties combinations**: `openFile` and `openDirectory` can be used together; `multiSelections` can be combined with any property.
5. **type selection**: Use `warning` for warnings, `question` for confirmation, `error` for errors, and `none` for no icon.

## Troubleshooting

### The dialog does not appear
Check whether you called the dialog API on a non-UI thread.

### Events do not fire
Make sure the `jade.on` listener is registered before the dialog is shown.

### Filters have no effect
Make sure the `extensions` array does not contain dots (e.g. `png` rather than `.png`).

### Returns undefined
These methods return a Promise — use `await` or `.then` to get the result, and check the console for errors.
