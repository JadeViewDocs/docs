---
order: 1
---

# Quick Start

This guide will help you quickly understand how to use the JadeView Web SDK to communicate with the JadeView WebView.

## Environment Requirements

- TypeScript 4.0+
- Modern browser (with ES6+ syntax support)
- JadeView WebView

## Installation

Install the JadeView Web SDK via npm:

```bash
npm install --save-dev jadeview-ipc-types
```

Or use yarn:

```bash
yarn add --dev jadeview-ipc-types
```

## Basic Usage

The JadeView Web SDK provides APIs for IPC communication with the JadeView WebView, mainly including the following features:

### Calling Backend APIs

Use the `window.jade?.invoke` method to call a backend API and obtain the result:

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

// Set the window backdrop
async function setBackdrop(backdropType) {
  try {
    await window.jade?.invoke('setBackdrop', backdropType);
    console.log('Backdrop set successfully:', backdropType);
  } catch (error) {
    console.error('Set backdrop failed:', error);
  }
}
```

### Subscribing to Events

Use the `window.jade?.on` method to subscribe to backend events:

```javascript
// Subscribe to the theme change event
const unsubscribeTheme = window.jade?.on('setTheme', (payload) => {
  console.log('Theme change event:', payload);
  // Handle theme change logic
});

// Subscribe to the window state change event
const unsubscribeWindowState = window.jade?.on('window-state-changed', (payload) => {
  console.log('Window state changed:', payload);
  // Handle window state change logic
});

// Unsubscribe
// unsubscribeTheme();
// unsubscribeWindowState();
```

### Using the Dialog API

The JadeView Web SDK provides a native dialog API for displaying file selection, file saving, message boxes, and more:

```javascript
// Open file dialog
async function openFile() {
  try {
    const result = await window.jade?.dialog.showOpenDialog({
      title: 'Select File',
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

// Save file dialog
async function saveFile() {
  try {
    const result = await window.jade?.dialog.showSaveDialog({
      title: 'Save File',
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

// Show message box
async function showConfirm() {
  try {
    const result = await window.jade?.dialog.showMessageBox({
      title: 'Confirm Action',
      message: 'Are you sure you want to delete this file?',
      detail: 'This action cannot be undone',
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

// Show error box
async function showError() {
  try {
    await window.jade?.dialog.showErrorBox('Error', 'Operation failed, please try again');
    console.log('Error box closed');
  } catch (error) {
    console.error('Show error box failed:', error);
  }
}
```

## Importing Types

You can also import specific types:

```typescript
import type { JadeView } from 'jadeview-ipc-types';

// Use the imported type
const handleInvoke = async () => {
  const jadeInstance = window.jade as JadeView;
  if (jadeInstance) {
    const result = await jadeInstance.invoke('testCommand', { key: 'value' });
    console.log('Invoke result:', result);
  }
};
```

### Importing Dialog-Related Types

```typescript
import type {
  JadeView,
  DialogAPI,
  OpenDialogOptions,
  SaveDialogOptions,
  MessageBoxOptions,
  FileFilter,
  DialogProperty,
  MessageBoxType
} from 'jadeview-ipc-types';

// Use the imported types
const handleInvoke = async () => {
  const jadeInstance = window.jade as JadeView;
  if (jadeInstance) {
    const result = await jadeInstance.invoke('testCommand', { key: 'value' });
    console.log('Invoke result:', result);
  }
};

// Define dialog options to get type safety
const openDialogOptions: OpenDialogOptions = {
  title: 'Select Image',
  properties: ['openFile', 'multiSelections'],
  filters: [
    { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
    { name: 'All Files', extensions: ['*'] }
  ]
};
```

## Notes

1. **Using optional chaining**: The `window.jade` object may be undefined in some environments, so it is recommended to access its methods using optional chaining `?.`
2. **Asynchronous initialization**: Ensure the JadeView IPC system is initialized before use
3. **Type safety**: Use TypeScript to get full type safety and IntelliSense support
4. **Callback management**: Properly manage subscribed callbacks to avoid memory leaks

## Complete Example

The following is a complete example demonstrating how to use the JadeView Web SDK for communication:

```typescript
import type { JadeView } from 'jadeview-ipc-types';

// App initialization
function initApp() {
  // Check whether the jade object is available
  if (!window.jade) {
    console.error('JadeView IPC system not available');
    return;
  }

  // Subscribe to the app ready event
  const unsubscribeAppReady = window.jade.on('app-ready', (payload) => {
    console.log('App ready:', payload);
    
    // Send the initialization complete message
    window.jade?.invoke('app-init', { status: 'ready' })
      .then(result => {
        console.log('Init result:', result);
      })
      .catch(error => {
        console.error('Init failed:', error);
      });
  });

  // Subscribe to the theme change message
  const unsubscribeTheme = window.jade.on('setTheme', (payload) => {
    console.log('Theme changed:', payload);
    // Handle theme change
    document.body.className = payload.theme;
  });

  // Subscribe to the window state change message
  const unsubscribeWindowState = window.jade.on('window-state-changed', (payload) => {
    console.log('Window state changed:', payload);
    // Handle window state change
  });

  // Cleanup function
  return () => {
    // Unsubscribe
    unsubscribeAppReady?.();
    unsubscribeTheme?.();
    unsubscribeWindowState?.();
  };
}

// Start the app
const cleanup = initApp();

// Clean up when the app unloads
window.addEventListener('beforeunload', () => {
  cleanup?.();
});
```

## Next Steps

- See the [API Reference](./reference/methods.mdx) for detailed API documentation
- Explore more advanced usage and best practices
- Join the community discussion to share your experience and suggestions

## Reference Implementation

You can check out the official DemoWeb implementation to learn how to use the JadeView Web SDK in a real project:

- **DemoWeb implementation**: [https://github.com/JadeViewDocs/JadeView/tree/main/DemoWeb](https://github.com/JadeViewDocs/JadeView/tree/main/DemoWeb)

Now that you have successfully installed and used the JadeView Web SDK, start building your JadeView WebView application!
