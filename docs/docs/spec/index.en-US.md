---
title: Introduction
order: 0
group:
  title: "Overview"
  order: 0
---

# JadeView Introduction

## Project Overview

JadeView is built for Web interfaces: lightweight, secure, and simple to use. It makes applications smooth and beautiful, boosting development efficiency dramatically.

## Key Features

- **Cross-platform support**: Supports both Windows and Linux platforms
- **WebView integration**: Provides a modern Web browsing experience
- **Flexible window management**: Supports creating, closing, maximizing, minimizing, and other window operations
- **Event handling mechanism**: Provides a rich set of event types and callback mechanisms
- **Theme management**: Supports switching between Light, Dark, and System themes
- **Local server**: Built-in local server functionality with support for custom protocols
- **Safe memory management**: Strict memory management mechanism that prevents memory leaks

## Memory Management Mechanism

The JadeView DLL adopts a strict memory management mechanism to ensure that repeated calls from callers such as E language (易语言) do not cause memory overflow:

1. **Safe string conversion**: Uses Rust's `CStr::from_ptr` and `CString::new` methods for string conversion, ensuring memory safety
2. **Automatic memory release**: All memory allocated via `CString::new` is automatically released after the callback function executes, preventing memory leaks
3. **No direct malloc/free calls**: The API does not directly use `malloc` and `free` to allocate memory internally, reducing the risk of memory leaks
4. **Strict lifecycle control**: When a callback function executes, the lifecycle of the `CString` is strictly controlled to ensure memory is released after the callback completes
5. **Thread safety**: All global state access is protected by mutexes, ensuring thread safety

## Quick Start

1. **Register the app-ready event**: Register the application-ready event via `jade_on("app-ready", callback)` (must be done before initializing the DLL)
2. **Initialize the DLL**: Call the `JadeView_init` function to initialize the DLL
3. **Run the message loop**: Call `run_message_loop` to run the message loop
4. **Create a WebView window**: Call the `create_webview_window` function inside the `app-ready` event callback to create a window
5. **Register other event callbacks**: Register other event callbacks via `jade_on`
6. **Clean up resources**: Listen for the `window-all-closed` event and call `cleanup_all_windows` to clean up resources

## Notes

1. **Multithread safety**: All API functions are thread-safe and can be called from multiple threads
2. **Asynchronous window creation**: The `create_webview_window` function returns the requested window ID immediately, but the actual window creation is completed asynchronously in the event loop thread
3. **Event handling order**: Event handling may execute on different threads, so thread safety must be taken into account
4. **Callback return values**: The meaning of window event callback return values: 0 = allow the operation, 1 = block the operation
5. **Resource management**: Call `cleanup_all_windows` promptly to clean up resources after use


## Supported Platforms

- Windows 10/11


## Copyright

© 2025 JadeView. All rights reserved.
