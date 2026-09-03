---
order: 0
group:
  title: "API Reference"
  order: 2
---

# API Reference

The JadeView Web SDK provides APIs for IPC communication with the JadeView WebView, mainly including the following methods:

## window.jade.invoke

**Function signature**: `<T = any>(command: string, payload?: any): Promise<T>`

**Parameters**:
| Parameter | Type | Description |
|-------|------|------|
| command | string | The backend command name |
| payload | any | The data passed to the backend (optional) |

**Return value**: `Promise<T>` - A Promise for the result returned by the backend

**Description**: Calls a backend API and obtains the returned result, with support for asynchronous operations.

**Example code**:

```javascript
// Call the backend API
async function sendMessage() {
  try {
    const messageData = {
      timestamp: Date.now(),
      data: 'Test message',
    };
    const result = await window.jade?.invoke('message', messageData);
    console.log('Backend return result:', result);
  } catch (error) {
    console.error('Call failed:', error);
  }
}
```

## window.jade.on

**Function signature**: `(eventName: string, callback: (payload: any) => void) => () => void`

**Parameters**:
| Parameter | Type | Description |
|-------|------|------|
| eventName | string | The event name |
| callback | (payload: any) => void | The callback function invoked when the event is triggered |

**Return value**: `() => void` - A function to cancel the subscription

**Description**: Subscribes to a backend event and invokes the provided callback function when the event is triggered. Returns a function used to cancel the subscription.

**Example code**:

```javascript
// Subscribe to an event
const unsubscribe = window.jade?.on('setTheme', (payload) => {
  console.log('Theme change event:', payload);
  // Handle the theme change logic
});

// Cancel the subscription
// unsubscribe();
```

## window.jade.dialog

The JadeView Web SDK provides native dialog APIs for displaying file selection, file saving, message boxes, and more.

### window.jade.dialog.showOpenDialog

**Function signature**: `(options: OpenDialogOptions) => Promise<OpenDialogResult>`

**Parameters**:
| Parameter | Type | Description |
|-------|------|------|
| options | OpenDialogOptions | The dialog options |

**Return value**: `Promise<OpenDialogResult>` - The dialog result

**Description**: Displays an open file dialog for selecting files.

**Example code**:

```javascript
// Open file dialog
async function openFile() {
  try {
    const result = await window.jade?.dialog.showOpenDialog({
      title: 'Select a file',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Text Files', extensions: ['txt', 'md'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result?.canceled) {
      console.log('Selected files:', result.filePaths);
    }
  } catch (error) {
    console.error('Open file dialog failed:', error);
  }
}
```

### window.jade.dialog.showSaveDialog

**Function signature**: `(options: SaveDialogOptions) => Promise<SaveDialogResult>`

**Parameters**:
| Parameter | Type | Description |
|-------|------|------|
| options | SaveDialogOptions | The dialog options |

**Return value**: `Promise<SaveDialogResult>` - The dialog result

**Description**: Displays a save file dialog for selecting a save location.

**Example code**:

```javascript
// Save file dialog
async function saveFile() {
  try {
    const result = await window.jade?.dialog.showSaveDialog({
      title: 'Save file',
      defaultPath: 'document.txt',
      filters: [
        { name: 'Text File', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result?.canceled) {
      console.log('Save path:', result.filePath);
    }
  } catch (error) {
    console.error('Save file dialog failed:', error);
  }
}
```

### window.jade.dialog.showMessageBox

**Function signature**: `(options: MessageBoxOptions) => Promise<MessageBoxResult>`

**Parameters**:
| Parameter | Type | Description |
|-------|------|------|
| options | MessageBoxOptions | The message box options |

**Return value**: `Promise<MessageBoxResult>` - The message box result

**Description**: Displays a message box for user confirmation or selection.

**Example code**:

```javascript
// Show a message box
async function showConfirm() {
  try {
    const result = await window.jade?.dialog.showMessageBox({
      title: 'Confirm operation',
      message: 'Are you sure you want to delete this file?',
      detail: 'This operation cannot be undone',
      buttons: ['Delete', 'Cancel'],
      defaultId: 1,
      cancelId: 1,
      type: 'warning'
    });

    if (result?.response === 0) {
      console.log('User confirmed deletion');
    } else {
      console.log('User canceled deletion');
    }
  } catch (error) {
    console.error('Show message box failed:', error);
  }
}
```

### window.jade.dialog.showErrorBox

**Function signature**: `(title: string, content: string) => Promise<void>`

**Parameters**:
| Parameter | Type | Description |
|-------|------|------|
| title | string | The error box title |
| content | string | The error box content |

**Return value**: `Promise<void>` - No return value

**Description**: Displays an error box for presenting error information.

**Example code**:

```javascript
// Show an error box
async function showError() {
  try {
    await window.jade?.dialog.showErrorBox('Error', 'Operation failed, please try again');
    console.log('Error box closed');
  } catch (error) {
    console.error('Show error box failed:', error);
  }
}
```

## Type Definitions

The JadeView Web SDK provides the following type definitions:

### JadeView

**Interface signature**: `interface JadeView`

**Description**: The main JadeView interface, representing the `window.jade` object.

**Methods**:
- `invoke: <T = any>(command: string, payload?: any) => Promise<T>` - Calls a backend API
- `on: (eventName: string, callback: (payload: any) => void) => () => void` - Subscribes to a backend event
- `dialog: DialogAPI` - The dialog API

### DialogAPI

**Interface signature**: `interface DialogAPI`

**Description**: The dialog API interface, providing native dialog functionality.

**Methods**:
- `showOpenDialog: (options: OpenDialogOptions) => Promise<OpenDialogResult>` - Displays an open file dialog
- `showSaveDialog: (options: SaveDialogOptions) => Promise<SaveDialogResult>` - Displays a save file dialog
- `showMessageBox: (options: MessageBoxOptions) => Promise<MessageBoxResult>` - Displays a message box
- `showErrorBox: (title: string, content: string) => Promise<void>` - Displays an error box

### OpenDialogOptions

**Interface signature**: `interface OpenDialogOptions`

**Description**: Open file dialog options.

**Properties**:
- `title?: string` - The dialog title
- `defaultPath?: string` - The default path
- `buttonLabel?: string` - The confirm button label
- `filters?: FileFilter[]` - The file filters
- `properties?: DialogProperty[]` - The dialog properties
- `message?: string` - The dialog message
- `securityScopedBookmarks?: boolean` - Security-scoped bookmarks (macOS)

### SaveDialogOptions

**Interface signature**: `interface SaveDialogOptions`

**Description**: Save file dialog options.

**Properties**:
- `title?: string` - The dialog title
- `defaultPath?: string` - The default path
- `buttonLabel?: string` - The confirm button label
- `filters?: FileFilter[]` - The file filters
- `nameFieldLabel?: string` - The file name field label
- `showsTagField?: boolean` - Show the tag field (macOS)

### MessageBoxOptions

**Interface signature**: `interface MessageBoxOptions`

**Description**: Message box options.

**Properties**:
- `title?: string` - The message box title
- `message: string` - The message box message
- `detail?: string` - The message box detail information
- `buttons?: string[]` - The button array
- `defaultId?: number` - The default button index
- `cancelId?: number` - The cancel button index
- `type?: MessageBoxType` - The message box type
- `noLink?: boolean` - Do not display links
- `normalizeAccessKeys?: boolean` - Normalize access keys

### FileFilter

**Interface signature**: `interface FileFilter`

**Description**: File filter.

**Properties**:
- `name: string` - The filter name
- `extensions: string[]` - The extension array

### DialogProperty

**Type signature**: `type DialogProperty = 'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' | 'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory' | 'dontAddToRecent'`

**Description**: The dialog property type.

### MessageBoxType

**Type signature**: `type MessageBoxType = 'none' | 'info' | 'error' | 'question' | 'warning'`

**Description**: The message box type.

### OpenDialogResult

**Interface signature**: `interface OpenDialogResult`

**Description**: Open file dialog result.

**Properties**:
- `canceled: boolean` - Whether it was canceled
- `filePaths: string[]` - The array of selected file paths
- `bookmarks?: string[]` - The bookmark array (macOS)

### SaveDialogResult

**Interface signature**: `interface SaveDialogResult`

**Description**: Save file dialog result.

**Properties**:
- `canceled: boolean` - Whether it was canceled
- `filePath?: string` - The save file path
- `bookmark?: string` - The bookmark (macOS)

### MessageBoxResult

**Interface signature**: `interface MessageBoxResult`

**Description**: Message box result.

**Properties**:
- `response: number` - The button index
- `checkboxChecked?: boolean` - Whether the checkbox is checked

## Best Practices

1. **Check availability**: Always check whether the `window.jade` object is available before using it
2. **Use optional chaining**: Use optional chaining `?.` to access methods of `window.jade` to avoid runtime errors
3. **Asynchronous handling**: Use `async/await` or Promises to handle the asynchronous return value of the `invoke` method
4. **Manage callbacks properly**: Cancel subscriptions that are no longer needed in a timely manner to avoid memory leaks
5. **Handle asynchronous initialization**: Account for the asynchronous initialization characteristics of the JadeView IPC system
6. **Error handling**: Add appropriate error handling to improve the robustness of your application
7. **Type safety**: Use TypeScript to get full type safety and IntelliSense support

## Notes

1. **Environment restriction**: The JadeView Web SDK is only available within the JadeView WebView environment
2. **Type safety**: Using TypeScript provides better type safety support
3. **Asynchronous communication**: IPC communication is asynchronous and is not guaranteed to complete immediately
4. **Performance considerations**: Avoid frequently sending large amounts of data, which affects application performance
5. **Security**: Be careful when handling data from the native application to avoid security risks

## FAQ

### Q: What should I do if window.jade is undefined?
A: Make sure your application is running within the JadeView WebView environment, and check whether the JadeView IPC system has been initialized.

### Q: How do I handle complex data structures?
A: The new API supports passing complex data structures directly, without needing to convert them with `JSON.stringify`.

### Q: How do I avoid memory leaks?
A: Cancel subscriptions that are no longer needed in a timely manner, using the unsubscribe function returned by the `on` method.

### Q: How do I debug IPC communication?
A: Use the console in the browser developer tools to print the messages sent and received.

### Q: Which browsers are supported?
A: The JadeView Web SDK supports all modern browsers, including Chrome, Firefox, Safari, Edge, and more.
