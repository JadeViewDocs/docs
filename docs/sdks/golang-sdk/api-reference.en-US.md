---
order: 2
---

# API Reference

The SDK is a pure Go implementation (direct syscall, no CGO). Everything lives in the single package `jadeview`.

## Core Functions

### `jadeview.Init()`

Initializes the JadeView application. You must register the ready callback via `jadeview.On(jadeview.EventAppReady, handler)` **before** calling this.

```go
jadeview.Init(
    enableDevmod bool,     // enable developer tools
    logPath string,        // log file path (may be empty)
    dataDir string,        // data root directory (may be empty)
    appName string,        // display name, required, non-blank
    appSignature string,   // unique app identifier, >= 6 Unicode chars after trim;
                           // reverse-domain style recommended (e.g. com.example.myapp) —
                           // in JAPK mode it becomes the JADE:// URL host
    singleInstance bool,   // single-instance mode
) bool
```

Returns `true` on success. Note: initialization only truly succeeded when the `app-ready` callback receives `windowID == 1` (0 = failure, with the error message in `data`).

### `jadeview.RunMessageLoop()`

Starts the message loop (blocks the current goroutine). Call after `Init()`.

### `jadeview.Exit()`

Cleans up all windows and ends the message loop. Usually called in the `window-all-closed` event callback.

### `jadeview.Version()`

Returns the JadeView version string.

### `jadeview.Preload()`

Extracts and loads the embedded DLL early, returning an error. If loading fails, the first API call panics — hosts that need graceful degradation should call this at startup to probe.

---

## Window Creation

### `CreateWindow()`

Creates a standard WebView window.

```go
jadeview.CreateWindow(
    url string,                    // initial URL (http(s):// or custom protocols like jade://)
    parentID uint32,               // parent window ID, 0 = top-level window
    opts *jadeview.WindowOptions,  // window options, nil = DefaultWindowOptions()
    settings *jadeview.WebViewSettings, // WebView settings, nil = library internal defaults
) uint32  // window_id (>0 success, 0 failure)
```

### `WindowOptions` Fields

Start from `jadeview.DefaultWindowOptions()` (1024×768, resizable, centered, focused), then change what you need:

| Field | Type | Description |
|------|------|------|
| `Title` | string | Window title |
| `Width` / `Height` | int | Size in pixels |
| `Resizable` | bool | Whether the window is resizable |
| `FrameStyle` | string | Frame style, see the `FrameStyle` enum |
| `Transparent` | bool | Transparent background (required for Mica etc.) |
| `BackgroundColor` | string | Background color `#RRGGBBAA` |
| `AlwaysOnTop` | bool | Always on top |
| `Theme` | string | Theme, see the `Theme` enum |
| `Maximized` / `Maximizable` / `Minimizable` | bool | Open maximized / allow maximize / allow minimize |
| `X` / `Y` | int | Window position; both -1 = centered |
| `MinWidth` / `MinHeight` / `MaxWidth` / `MaxHeight` | int | Size constraints |
| `Fullscreen` | bool | Open in fullscreen |
| `Focus` | bool | Focus on creation |
| `HideWindow` | bool | Create hidden |
| `UsePageIcon` | bool | Use the page's favicon |
| `ContentProtection` | bool | Screenshot protection |
| `AutoSaveState` | bool | Remember window position automatically |
| `SkipTaskbar` | bool | Hide from taskbar |
| `NoActivate` | bool | Don't activate on creation |

### `WebViewSettings` Fields

Start from `jadeview.DefaultWebViewSettings()` (autoplay/right-click/fullscreen/autofill allowed, focused on creation):

| Field | Type | Description |
|------|------|------|
| `Autoplay` | bool | Allow media autoplay |
| `BackgroundThrottling` | bool | true = disable background throttling |
| `AllowRightClick` | bool | Allow the page context menu |
| `UserAgent` | string | Custom UA, empty = default |
| `PreloadJS` | string | JS injected before page scripts run |
| `AllowFullscreen` | bool | Allow the page fullscreen API |
| `PostMessageWhitelist` | string | postMessage whitelist (a single domain) |
| `CORSWhitelist` | string | CORS origin whitelist (comma-separated) |
| `Autofill` / `GeneralAutofillEnabled` | bool | Credential autofill / general form autofill |
| `Incognito` | bool | Incognito mode |
| `DisableClipboard` | bool | Disable clipboard permission |
| `ProxyURL` | string | Proxy, e.g. `http://host:port` / `socks5://host:port` |
| `Focused` | bool | WebView takes focus after creation |

:::info
Passing `nil` for `settings` in `CreateWindow` lets the library use its internal defaults, which are not guaranteed to match `DefaultWebViewSettings()` item by item; when you only want to tweak a couple of fields on top of defaults, start from that function.
:::

### `CreateBorderlessWindow()`

```go
jadeview.CreateBorderlessWindow(url string, settings *WebViewSettings) uint32
```

Creates a standalone borderless WebView window.

---

## Window Operations

### Basics

| Function | Description |
|------|------|
| `SetTitle(windowID, title)` | Set the window title |
| `SetSize(windowID, width, height)` | Set the window size |
| `SetPosition(windowID, x, y)` | Set the window position |
| `SetVisible(windowID, visible)` | Show/hide the window |
| `SetFocus(windowID)` | Give the window focus |
| `SetAlwaysOnTop(windowID, on)` | Toggle always-on-top |
| `Close(windowID)` | Close the window |
| `Minimize(windowID)` | Minimize |
| `ToggleMaximize(windowID)` | Toggle maximize/restore |
| `SetFullscreen(windowID, fullscreen)` | Set fullscreen |
| `SetMinSize` / `SetMaxSize` | Size constraints |
| `SetResizable(windowID, resizable)` | Allow/deny resizing |
| `SetEnabled(windowID, enabled)` | Enable/disable window interaction |
| `RequestRedraw(windowID)` | Request a redraw |
| `WindowCount()` | Current window count |

### State Queries

| Function | Description |
|------|------|
| `IsMaximized` / `IsMinimized` / `IsVisible` / `IsFocused` / `IsFullscreen` | Boolean states |
| `GetWindowBounds(windowID)` | Window bounds JSON |
| `GetWebViewURL(windowID)` | Current WebView URL |
| `GetWindowHWND(windowID)` | Native window handle |
| `GetWindowID(hwnd)` | Look up a window ID by handle (0 = not found) |

### Theme & Appearance

| Function | Description |
|------|------|
| `SetTheme(windowID, theme)` | Set the theme: `Theme.Light` / `Theme.Dark` / `Theme.System` |
| `GetTheme(windowID)` | Get the current theme code |
| `SetBackdrop(windowID, backdropType)` | Window backdrop: `Backdrop.Mica` / `Backdrop.MicaAlt` / `Backdrop.Acrylic` (Windows 11) |
| `SetBackgroundColor(windowID, colorHex)` | Solid background `#RRGGBBAA` |
| `SetFrameStyle(windowID, frameStyle)` | Frame style, see the `FrameStyle` enum |
| `SetTitlebarOverlayStyle(windowID, height, iconColorHex, hoverBgHex)` | Title-bar overlay styling (height ≤ 0 keeps the height) |
| `SetLevel(windowID, level)` | Window level, see the `WindowLevel` enum |
| `SetSkipTaskbar` / `SetNoActivate` / `SetIgnoreCursorEvents` | Hide from taskbar / no activation / click-through |
| `SetContentProtection(windowID, on)` | Screenshot protection |
| `SetWindowProgress(windowID, progress, state)` | Taskbar progress; state per the `ProgressState` enum |
| `FlashWindow(windowID, count)` | Flash the taskbar button `count` times |

---

## WebView Operations

| Function | Description |
|------|------|
| `Navigate(windowID, url, headersJSON)` | Navigate to a URL (optionally with custom request headers as JSON) |
| `Reload(windowID)` | Reload the current page |
| `ExecuteJavaScript(windowID, script)` | Execute JS; returns a unique id, result arrives asynchronously via the `javascript-result` event |
| `SetZoom(windowID, level)` | Zoom level (1.0 = 100%) |
| `OpenDevtools` / `CloseDevtools` / `IsDevtoolsOpen` | DevTools control |
| `ClearBrowsingData(windowID)` | Clear browsing data |

---

## Events & IPC

### `On()`

Subscribes to an event. **Use the provided `Event*` constants** for event names to avoid typos in bare strings.

```go
jadeview.On(
    event string,                  // event name (see the constant tables below)
    handler jadeview.EventHandler, // func(windowID uint32, data string) string
) (uint32, bool)  // (callback_id, success); callback_id is used with Off
```

A non-empty handler return value is sent back to the library as a response; for most events just return `""`.

### `Off()`

```go
jadeview.Off(event string, cbID uint32) bool
```

### `RegisterIPCHandler()`

Registers an IPC channel handler that receives frontend `jade.invoke()` calls; the handler's return string is the reply.

```go
jadeview.RegisterIPCHandler(channel string, handler jadeview.EventHandler) bool
```

:::warning
**Slot limit**: `On` and `RegisterIPCHandler` **share** `MaxEventHandlers` = 64 slots; there is no unregister API for IPC handlers (none in the upstream header either), so each registration **permanently occupies** a slot — plan your channel count accordingly.
:::

### `SendIPCMessage()`

Sends an IPC message to a window's frontend (received via `jade.on(type, ...)`).

```go
jadeview.SendIPCMessage(windowID uint32, messageType, messageContent string) bool
```

### Event Constants (`Event*`)

#### Application Lifecycle

| Constant | Value | Description |
|------|---|------|
| `EventAppReady` | `app-ready` | App initialization finished (success only when windowID==1 in the callback) |
| `EventSecondInstance` | `second-instance` | A second instance started (single-instance mode) |
| `EventCrash` | `crash` | Program crash (data is a `Crash*` error-code constant) |

#### Window Lifecycle & State

| Constant | Value | Description |
|------|---|------|
| `EventWindowCreated` | `window-created` | Window created |
| `EventWindowClosed` | `window-closed` | Window closed |
| `EventWindowDestroyed` | `window-destroyed` | Window destroyed |
| `EventWindowAllClosed` | `window-all-closed` | All windows closed |
| `EventWindowResized` / `EventWindowMoved` / `EventWindowBounds` | | Size / position / bounds changes |
| `EventWindowFocused` / `EventWindowBlurred` | | Focus gained / lost |
| `EventWindowStateChanged` | `window-state-changed` | Maximize/restore state changes |
| `EventWindowFullscreen` | `window-fullscreen` | Fullscreen state changes |

#### WebView / Navigation

| Constant | Value | Description |
|------|---|------|
| `EventWebViewDidStartLoading` | `webview-did-start-loading` | Loading started |
| `EventWebViewDidFinishLoad` | `webview-did-finish-load` | Loading finished |
| `EventWebViewTitleUpdated` | `webview-page-title-updated` | Page title updated |
| `EventWebViewFaviconUpdated` | `webview-page-favicon-updated` | Page favicon updated |
| `EventWebViewDownloadCompleted` | `webview-download-completed` | Download completed |
| `EventJavascriptResult` | `javascript-result` | Result of `ExecuteJavaScript` |
| `EventPostMessageReceived` | `postmessage-received` | postMessage received from the frontend |
| `EventDragDrop` | `drag-drop` | Drag events (enter/over/drop/leave) |

#### Tray / Notifications / Hotkeys / Misc

| Constant | Value | Description |
|------|---|------|
| `EventTrayEvent` / `EventTrayMenuCommand` | | Tray icon interaction / tray menu command |
| `EventNotificationShown` / `EventNotificationDismissed` / `EventNotificationFailed` / `EventNotificationAction` | | Notification lifecycle & button clicks |
| `EventGlobalHotkey` | `global-hotkey` | Global hotkey triggered |
| `EventThemeChanged` | `theme-changed` | System theme changed |
| `EventMenuItemClicked` | `menu-item-clicked` | Context-menu item clicked |
| `EventContextMenu` | `context-menu` | Context menu (used with `SetContextMenuItems`) |
| `EventJapkLoadFailed` | `japk-load-failed` | JAPK package failed to load |
| `EventUpdateWindowIcon` | `update-window-icon` | Window icon updated |

---

## Dialogs & Notifications

### Synchronous API

```go
// Open / save file dialogs; return result JSON (usually empty/null on cancel)
jadeview.ShowOpenDialog(p jadeview.FileDialogParams) string
jadeview.ShowSaveDialog(p jadeview.FileDialogParams) string

// FileDialogParams fields
type FileDialogParams struct {
    WindowID    uint32
    Title       string
    DefaultPath string
    ButtonLabel string
    Filters     string // JSON, e.g. `[{"name":"Images","extensions":["jpg","png"]}]`
    Properties  string // JSON array; elements per the DialogProp enum
}

// Message box; returns result JSON (with the clicked button index)
jadeview.ShowMessageBox(p jadeview.MessageBoxParams) string

type MessageBoxParams struct {
    WindowID  uint32
    Title     string
    Message   string
    Detail    string
    Buttons   string // JSON array, e.g. `["OK","Cancel"]`
    DefaultID int
    CancelID  int
    Type      string // per the MsgBoxType enum
}

// Error box (simple mode)
jadeview.ShowErrorBox(windowID uint32, title, content string) bool
```

### Asynchronous API

Async variants add the `Async` suffix; results arrive via callback without blocking message processing:

```go
jadeview.ShowOpenDialogAsync(p FileDialogParams, handler DialogResultHandler) bool
jadeview.ShowSaveDialogAsync(p FileDialogParams, handler DialogResultHandler) bool
jadeview.ShowMessageBoxAsync(p MessageBoxParams, handler DialogResultHandler) bool

// type DialogResultHandler func(result string)  // result is the result JSON
```

At most `MaxAsyncDialogs` = 16 async dialogs can be in flight at once.

### System Notifications

```go
jadeview.ShowNotification(jadeview.NotificationParams{
    Summary: "Notification title",   // required
    Body:    "Notification body",
    Icon:    "",           // absolute path to an icon file
    Timeout: -1,           // milliseconds, -1 = system default
    Button1: "Open",       // buttons (optional)
    Button2: "",
    Action:  "open",       // sent back via the notification-action event
})
```

---

## System Tray

```go
jadeview.TrayCreate() uint32                          // create a tray icon, returns tray_id (0=failure)
jadeview.TrayDestroy(trayID) bool
jadeview.TraySetVisible(trayID, visible) bool
jadeview.TraySetTooltip(trayID, tooltip) bool
jadeview.TraySetIconFromFile(trayID, iconPath) bool   // icon file (.ico)
jadeview.TraySetIconFromData(trayID, data []byte) bool // in-memory icon data
jadeview.TraySetMenu(trayID, items []TrayMenuItem) bool // flat table; empty slice = clear menu
```

Menu items form a flat table; nest by pointing `ParentKey` at a parent item's `Key`:

```go
items := []jadeview.TrayMenuItem{
    {Type: jadeview.TrayItem.Normal, Key: "show", Label: "Show Window"},
    {Type: jadeview.TrayItem.Submenu, Key: "theme", Label: "Theme"},
    {Type: jadeview.TrayItem.Normal, Key: "dark", Label: "Dark", ParentKey: "theme"},
    {Type: jadeview.TrayItem.Divider, Key: "sep1"},
    {Type: jadeview.TrayItem.Normal, Key: "quit", Label: "Quit", Dangerous: true},
}
```

`Key` must be unique across the table and non-empty (dividers need unique keys too); clicks are reported via the `EventTrayMenuCommand` event.

---

## Context Menus

```go
jadeview.MenuItemCreate(label string, kind int, parentMenuID uint32, itemID int) uint32
// kind per the MenuKind enum; itemID comes back via the menu-item-clicked event
jadeview.MenuItemSetEnabled(menuID, enabled) bool
jadeview.MenuItemSetChecked(menuID, checked) bool
jadeview.MenuItemDestroy(menuID) bool
jadeview.SetContextMenuItems(windowID uint32, menuIDs []uint32) bool
// call inside the context-menu event callback to set the top-level items for this right-click
```

---

## YAML Config Store

Stored under the data directory set by `Init`. int32 status codes: 1=success, 0=path/file missing, -1=IO error, -2=type mismatch, -4=parse failure.

| Function | Description |
|------|------|
| `YAMLSet(fileName, keyPath, value)` | Write (auto-parses JSON/YAML/plain text) |
| `YAMLSetStr(fileName, keyPath, value)` | Force storing as a string |
| `YAMLGet(fileName, keyPath)` | Read; returns (JSON string, success) |
| `YAMLGetAll(fileName)` | Read the whole file |
| `YAMLKeys(fileName, keyPath)` | List all keys under a path (JSON array) |
| `YAMLHas(fileName, keyPath)` | Whether a path exists |
| `YAMLDelete(fileName, keyPath)` | Delete a path |
| `YAMLLen(fileName, keyPath)` | Array length / object key count |
| `YAMLClear(fileName)` | Clear the file |
| `YAMLDeleteFile(fileName)` | Delete the file |

---

## JAPK Resource Packages

Encrypted/signed frontend bundles, served via the `jade://` protocol after loading. **Return-value convention differs from other modules: 0=success, negative=error code.**

| Function | Description |
|------|------|
| `SetPublicKey(publicKey)` | Set the Base64 Ed25519 public key (44 chars); must precede `LoadFromBytes`; only needed for signed packages |
| `LoadFromBytes(data []byte)` | Load a JAPK from memory (only obfuscated packages without a public key set); error details also arrive via the `japk-load-failed` event |
| `IsLoaded()` | Whether a JAPK is loaded |
| `GetAppSignature()` | Current app_signature |
| `GetSignatureInfo()` | Signature info JSON |
| `Unload()` | Clear the loaded state |

The JAPK's app_name / app_signature must match `Init`. See `SetProtocolServicePath` below for accessing loaded content.

---

## System Tools

### Protocol Service (local resource server)

```go
jadeview.SetProtocolServicePath(rootPath string, hotReload bool) (string, bool)
```

Returns a URL that can be used directly for window navigation. `rootPath` has three modes:

| rootPath | Mode | Description |
|----------|------|------|
| A directory path | Filesystem mode | Serves that directory; `hotReload` only works here (file changes refresh the page instantly) |
| A `.japk` file path | On-disk JAPK | Mounts a JAPK package from disk |
| Empty string `""` | In-memory JAPK | Serves the package loaded via `LoadFromBytes`; returns a URL like `JADE://<app_signature>` |

### Secure Resources

| Function | Description |
|------|------|
| `RegisterResource(path, windowID, ttlSeconds)` | Register a local file as a secure resource; returns a jade:// URL (windowID=0 global, ttl=0 never expires) |
| `UnregisterResource(tokenOrURL)` | Unregister a resource |
| `ClearWindowResources(windowID)` | Clear all of a window's resources; returns the count |
| `GetFileIcon(path, size, windowID, ttlSeconds)` | Extract a file icon as a PNG resource; returns its URL |

### Other Tools

| Function | Description |
|------|------|
| `ClipboardReadText()` / `ClipboardWriteText(text)` | Clipboard read/write |
| `GetPath(name)` | System paths: home / appData / temp / desktop / documents / downloads etc. |
| `GetLocale()` | System locale (BCP 47, e.g. zh-CN) |
| `GetDisplaysInfo()` | Display info as a JSON array |
| `GetCursorPosition()` | Cursor position JSON |
| `GetWebViewVersion()` | WebView engine version |
| `IsWindows11()` | Whether running on Windows 11 |
| `RegisterGlobalHotkey(modifiers, vk)` | Register a global hotkey; returns hotkey_id; fires the `global-hotkey` event |
| `UnregisterGlobalHotkey(hotkeyID)` | Unregister a hotkey |
| `SetLoginAutostart(enable, args)` / `GetLoginAutostart()` | Login autostart |
| `RegisterURLScheme` / `UnregisterURLScheme` | Custom protocol registration |
| `RegisterFileAssociation` / `UnregisterFileAssociation` | File associations |
| `Print(windowID)` / `PrintFile(filePath)` / `GetPrinterList()` | Printing |
| `SmartConvertEncoding(input, targetEncoding)` | Detect and convert encodings; targetEncoding per the `Encoding` enum |
| `NTPNow(server)` | NTP network timestamp (UTC ms; empty server = built-in server list; -1 on failure) |
| `ClearDataDirectory(confirmToken)` | Wipe the data directory (token must be `I_UNDERSTAND_CLEAR_DATA`) |

---

## Enum Namespaces

Every fixed-choice parameter has a two-level namespaced enum, so you never write bare strings/numbers:

| Enum | Values | Purpose |
|------|------|------|
| `Theme` | `.Light` / `.Dark` / `.System` | Window theme |
| `FrameStyle` | `.Normal` / `.NoTitlebar` / `.Borderless` / `.TitleOverlay` | Frame style |
| `WindowLevel` | `.Topmost` / `.Normal` / `.Bottom` / `.Desktop` | Window level |
| `Backdrop` | `.Mica` / `.MicaAlt` / `.Acrylic` | Window backdrop (Win11) |
| `MsgBoxType` | `.None` / `.Info` / `.Warning` / `.Error` / `.Question` | Message-box type |
| `ProgressState` | `.None` / `.Normal` / `.Paused` / `.Error` / `.Indeterminate` | Taskbar progress state |
| `TrayItem` | `.Normal` / `.Submenu` / `.Divider` / `.Group` | Tray menu item type |
| `MenuKind` | `.Normal` / `.Separator` / `.Checkbox` / `.Radio` / `.Submenu` | Context-menu item type |
| `DialogProp` | `.OpenFile` / `.OpenDirectory` / `.MultiSelections` / `.ShowHiddenFiles` / `.PromptToCreate` | File-dialog properties |
| `Encoding` | `.UTF8` / `.GBK` / `.GB18030` / `.Big5` / `.ShiftJIS` / `.EUCKR` / `.Latin1` | Encoding-conversion targets |

Examples: `jadeview.Theme.Dark`, `jadeview.FrameStyle.TitleOverlay`, `jadeview.Backdrop.Mica`.
