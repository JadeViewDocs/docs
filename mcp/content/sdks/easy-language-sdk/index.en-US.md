---
order: 0
---

# JadeView E Language SDK

## Project Introduction

JadeView E Language SDK is a WebView window library specially designed for E Language developers. It is developed based on Rust and provides easy-to-use APIs, allowing developers to rapidly build modern desktop applications.

## Core Features

- Cross-platform Kernel: The underlying kernel supports Windows and Linux, while the E Language binding only works on Windows.
- WebView Rendering: Supports HTML, CSS, JavaScript, Vue and React web pages.
- Window Management: Standard / borderless windows, Mica transparency, screenshot protection, light & dark theme switching.
- Event System: Callback via subroutine pointers, covering full lifecycle events of windows, IPC and global hotkeys.
- Built-in private `jade://` resource protocol, no extra HTTP server required for static asset loading.
- Automatic secure memory management, all APIs are thread-safe.
- Two-way IPC communication, with built-in system file dialog and message popup utilities.
- JAPK encrypted resource package (paid feature): In-memory loading with signature anti-tampering verification.
- System Utilities: System tray, global hotkeys, custom URL protocols, YAML configuration, NTP time synchronization, clipboard text read & write.

## Memory Management Mechanism

The underlying `jadeview_x86.dll` adopts Rust’s memory model to avoid memory leaks and crashes caused by wild pointers:

1. Safe UTF8 string handling with `CStr` and `CString`.
2. Strings generated in callbacks are automatically released by the kernel; no manual disposal required.
3. No direct `malloc` / `free` calls at the low level; all memory is managed uniformly by Rust runtime.
4. Strict lifecycle control for callback resources to ensure timely recycling.
5. Mutex locks protect all global states, enabling concurrent calls from multiple threads.

## Quick Start

1. Register app ready event: `JadeView.App.RegisterEvent(#Event_AppReady, &CallbackSubroutine)`. This step must run before kernel initialization.

2. Initialize kernel: Call `JadeView.App.Init` to load and initialize `jadeview_x86.dll`.

3. Run message loop: Invoke `JadeView.App.MessageLoop`.

4. Create WebView window: Call 

   ```
   JadeView.Window.Create
   ```

    inside the 

   ```
   #Event_AppReady
   ```

    callback.

   

   Important: Windows can only be created after the `#Event_AppReady` event fires.

5. Register other events: Use `JadeView.App.RegisterEvent` to bind other event callbacks.

6. Clean up resources: Listen to the `#Event_AllWindowsClosed` event and call `JadeView.App.Exit` to release all resources.

## Notes

1. All APIs are thread-safe and can be invoked from multiple threads.
2. `JadeView.Window.Create` returns a window ID immediately, but the actual window creation runs asynchronously on the event loop thread.
3. All Chinese text input parameters must be converted via `GBKToUTF8()`.
4. A global singleton is automatically included after importing `JadeView.ec`; no manual declaration is needed.
5. Always call `JadeView.App.Exit` to release resources after usage.

## Supported Platforms

- Windows 10 1903 and above, Windows 11 (the only compatible OS for the E Language SDK)
