1. # JadeView Class

   ------

   ## Overview

   `JadeView` is the unique global singleton entry of the E-Language SDK. It is automatically generated after importing `JadeView.ec` and requires no manual definition. It encapsulates kernel initialization, window & view management, event system, two-way IPC communication, pop-up dialogs, notifications and low-level system capabilities in a unified manner. All functions are invoked via `JadeView.SubModule.Subroutine()`.

   ## Recommended Standard Execution Order

   1. Register the app ready event: `JadeView.App.RegisterEvent(#Event_AppReady, &CallbackSubroutine)`. This step must be executed before initialization.

   2. Initialize the kernel: Call `JadeView.App.Init` to load `jadeview_x86.dll`.

   3. Run the message loop: Call `JadeView.App.MessageLoop`.

   4. Create WebView window: Invoke 

      ```
      JadeView.Window.Create
      ```

       inside the 

      ```
      #Event_AppReady
      ```

       callback subroutine.

      

      Important: Windows can only be created after the `#Event_AppReady` event is triggered.

   5. Register other events: Bind additional event callbacks via `JadeView.App.RegisterEvent`.

   6. Clean up resources: Listen to the `#Event_AllWindowsClosed` event and call `JadeView.App.Exit` to release all kernel resources.

   ## I. Kernel Initialization & Message Loop (JadeView.App)

   ### 1. Init

   - Function: Load the `jadeview_x86.dll` runtime and automatically subscribe to most common built-in events.
   - List of auto-subscribed events: App ready, second instance launch, window creation/destruction, page loading status, page title & favicon update, frontend IPC messages, global hotkeys, system notifications.
   - Parameters: Log switch, log path, app ID, app name, single-instance flag. All Chinese text inputs must be converted to UTF-8.
   - Return Value: Boolean. `True` = Kernel loaded successfully; `False` = Missing DLL or incompatible version.

   ### 2. MessageLoop

   - Function: Continuously listen to and dispatch all asynchronous events (windows, IPC, hotkeys, dialogs, tray notifications).
   - Execution Position: Execute after successful kernel initialization at the end of the main thread. The loop exits when the program is ready to terminate.

   ## II. Window & View Capabilities (JadeView.Window + JadeView.Page)

   Full lifecycle control for Web windows, supporting standard, borderless and title-overlay window styles.

   ### Window Functions

   1. Create Window: Use the `JadeViewWindowSetting` struct to configure size, title, Mica/Acrylic material, border style, topmost state, min/max size limits, screenshot protection and taskbar progress bar.
   2. Runtime Control: Dynamically switch light/dark themes, adjust window layers (topmost / normal / desktop widget), show/hide, minimize/maximize, modify coordinates and dimensions.
   3. Material Configuration: Supports three Windows 11 transparent materials: `mica`, `micaAlt`, `acrylic`.

   ### Page View Functions

   1. Page navigation and forced refresh (cache skip supported).
   2. Execute frontend JS code and retrieve return results.
   3. Page zoom control, media autoplay toggle, incognito cache management.

   ## III. Event System (JadeView.App.RegisterEvent)

   ### 1. Auto-Subscribed Events

   Automatically bound during kernel initialization; only corresponding callback subroutines need to be written:

   - \#Event_AppReady
   - \#Event_SecondInstance
   - \#Event_WindowCreated / #Event_WindowClosed / #Event_WindowStateChanged
   - \#Event_WebViewStartLoad / #Event_WebViewFinishLoad
   - \#Event_WebViewFaviconUpdated / #Event_WebViewTitleUpdated
   - \#Event_PostMessageReceived (General IPC message)
   - \#Event_GlobalHotkeyTriggered
   - \#Event_NotificationShown / #Event_NotificationAction / #Event_NotificationDismissed

   ### 2. Manually Registered Events

   Not subscribed automatically; explicitly call `RegisterEvent` when required:

   - \#Event_WindowWillClose
   - \#Event_DragDrop (File drag into window)
   - \#Event_WebViewNewWindowRequest
   - \#Event_WebViewDownloadComplete

   ### 3. Interceptable Events

   Rule: Callback returns empty string = Allow default behavior; Callback returns non-empty UTF-8 string = Block native logic.

   1. \#Event_WindowWillClose: Block window closing operation
   2. \#Event_DragDrop: Block file drag & drop
   3. \#Event_WebViewNewWindowRequest: Block pop-up new tabs
   4. \#Event_WebViewDownloadComplete: Cancel file download

   ## IV. Two-Way IPC Communication (JadeView.IPC)

   Dedicated data exchange channel between E-Language backend and webpage JS. Dedicated channel subscription is recommended over generic event handling.

   1. Subscribe Channel: `JadeView.IPC.Subscribe(ChannelName, &Callback)`. A single callback receives all messages sent from the matching frontend channel.
   2. Broadcast Push: `JadeView.IPC.Broadcast(WindowID, ChannelName, MessageText)`. Backend actively sends data to the webpage.
   3. Frontend Rules: Pages can only send data via `jade.invoke(channel, data)` and receive data via `jade.on(channel, callback)`. There is no `jade.send` method.

   ## V. Dialog Utilities (JadeView.Dialog)

   Split into synchronous and asynchronous dialogs, with dedicated structs for parameter configuration.

   ### Synchronous Dialogs (Block thread and wait for user input)

   - Open File Dialog
   - Save File Dialog
   - Standard Info MessageBox
   - Error Alert MessageBox

   ### Asynchronous Dialogs (Non-blocking; receive results via event callbacks)

   - Async Open File
   - Async Save File
   - Async Message Popup

   ### Matching Structs

   `MessageBoxOption`, `FileDialogOption`. Configurable items: title, buttons, file filters, multi-selection, hidden file display.

   ## VI. System Notifications (JadeView.Notification)

   Windows desktop toast notifications, customizable title, body text, icons, dual action buttons and auto-close duration.

   - Subroutine: `JadeView.Notification.Show(NotifyOptionStruct)`
   - Related Events: Notification click, notification close, notification display failure (all support callback listening).

   ## VII. Tray Menu (JadeView.Tray)

   Background resident tray icon feature for the system taskbar corner.

   1. Create tray icon and set hover tooltip text.
   2. Add tray items: Normal command buttons, submenus, separators, logical groups.
   3. Clear all tray menus.
   4. Related Events: Tray left/right click, tray menu command trigger.

   ## VIII. Low-Level System Utilities (JadeView.System)

   ### 1. Protocol Management

   - Register / unregister custom URL protocols (launch app via `xxx://` links).
   - Create `jade://` local static resource service with hot-reload support.

   ### 2. Global Hotkeys

   Register / unregister global shortcuts, supporting combined modifiers: Ctrl / Shift / Alt / Win.

   ### 3. System Path Lookup

   Quickly access desktop, documents, cache, executable root and other directories via `#Path_XXX` constants.

   ### 4. OS Version Detection

   `JadeView.System.IsWin11()`: Judge whether Mica transparent materials are supported.

   ### 5. YAML Read & Write

   `JadeView.YamlConfig`: Lightweight local persistent storage for application settings.

   ## IX. Encrypted Resource Package Capabilities (JadeView.ProtocolService + JadeView.JAPK)

   1. Load signed JAPK encrypted resource packages; run assets in memory without writing to disk to prevent frontend source extraction.
   2. Convert numeric error codes to human-readable error descriptions for troubleshooting load failures.
   3. Unload loaded JAPK packages to free occupied memory.

   ## X. Auxiliary Submodules

   1. **JadeView.Text**: GBK ↔ UTF-8 encoding conversion (Mandatory for all Chinese input parameters).
   2. **JadeView.Clipboard**: Read and write system clipboard text.
   3. **JadeView.ContextMenu**: Custom Web right-click menus, supporting command items, checkboxes, radio buttons and native browser menu entries.
   4. **JadeView.Time**: NTP network time synchronization & global timezone conversion.