---
order: 5
---

# FAQ

## Installation & Environment

### Which operating systems does the Golang SDK support?

**Windows 10 / 11** (amd64 / 386 / arm64). Linux support is planned to arrive with upcoming upstream JadeView releases (2.4 / 2.5); macOS is not supported yet.

### What Go version is required?

**Go 1.23** or later.

### Do I need a C compiler?

No. The SDK is **pure Go** (direct syscall) with the DLL embedded via `go:embed` — no MinGW / MSYS2, no `CC` / `CGO_ENABLED`, and no DLL to ship with your app.

### Do I need the WebView2 Runtime?

- **Windows 11**: built in, nothing to install
- **Windows 10**: install the [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

### Does the SDK have extra Go dependencies?

No — Go standard library only.

### `go get @latest` can't resolve a just-released version?

The official proxy index lags by a few minutes. Wait and retry, or pull explicitly with `GOPROXY=https://proxy.golang.org,direct`.

---

## Initialization & Lifecycle

### Why must events be registered before calling Init()?

`Init()` fires the `app-ready` event internally. A listener registered after `Init()` misses that event and never receives the ready notification.

### What does windowID mean in the app-ready callback?

It's the initialization result flag: **1 = success**, 0 = failure (with the error message in `data`). `Init()` returning true only means the call was accepted; the callback carries the real outcome.

### Common reasons Init returns false?

- `appSignature` shorter than 6 characters (Unicode count after trim);
- an instance with the same signature already running (single-instance mode);
- appName empty or all whitespace.

### Are there format requirements for appSignature?

At least 6 Unicode characters. **Reverse-domain style is recommended** (e.g. `com.example.myapp`) — in JAPK mode it becomes the `JADE://` URL host.

### Why does RunMessageLoop() block?

It's the desktop app's message loop — all window events and user interactions are dispatched through it. It blocks until all windows close / `Exit()` is called. Put cleanup logic in the `window-all-closed` callback.

---

## Events & IPC

### What is the On callback's return value for?

A non-empty string is sent back to the library as a response (e.g. an IPC reply); for most events just return `""`.

### What's the difference between RegisterIPCHandler and On?

- `On()`: listens to system events (window created, closed, theme changed, …)
- `RegisterIPCHandler()`: registers an IPC channel handler that answers frontend `jade.invoke()` calls; the return value is the reply

### Is there a limit on event registrations?

Yes. `On` and `RegisterIPCHandler` **share 64 slots** (`MaxEventHandlers`). `On` slots can be freed via `Off`, but **IPC handlers cannot be unregistered — they occupy a slot permanently**. With many channels, merge them into a bus channel.

### jade.invoke gets no reply / IPC seems blocked?

Most likely **cross-origin**: pages loaded from http(s) URLs are not same-origin with the library. Prefer the protocol service / JAPK (jade:// same-origin); if you can't change it, set `PostMessageWhitelist: "*"` in `WebViewSettings`. See [Advanced Usage - Cross-origin and IPC Risks](./advanced#cross-origin-and-ipc-risks).

---

## Windows & Appearance

### How do I create a titlebar-less / borderless window?

Set `WindowOptions.FrameStyle`:

- `FrameStyle.TitleOverlay` — keeps the frame, no title bar, built-in window controls at the top right (recommended)
- `FrameStyle.NoTitlebar` — keeps the frame; draw your own title bar
- `FrameStyle.Borderless` — completely frameless

### Mica / Acrylic backdrop has no effect?

- Windows 11 only — check with `IsWindows11()` first;
- the window must be created with `Transparent: true`, and the page background must be transparent too;
- off Win11, fall back to a solid color with `SetBackgroundColor`.

### How do I drag a borderless window?

Add the HTML boolean attribute `jade-region-drag` to an element to make it a drag region, and `jade-region-no-drag` to exclude interactive elements inside it (injected automatically at runtime — no script required).

---

## Platform Specifics

### Antivirus flags / blocks the app?

Some antivirus products heuristically flag the "extract-and-load a DLL" pattern; that's expected — guide users to whitelist. If DLL loading is blocked, the first API call panics — call `Preload()` early at startup to detect the error and fail gracefully.

### No logs after building the GUI version?

`-H windowsgui` removes the console, so `fmt.Printf` output is invisible. Use a console build for debugging, or pass a `logPath` to `Init` to log to a file.

---

## Storage & Resources

### When is YAML available?

The YAML persistence APIs depend on the `Init` data directory being ready — call them **after app-ready**.

### Any restrictions on the protocol service directory?

The site directory must **not** be the same as (or nested with) the `Init` data directory — the library continuously writes data there, triggering an endless "write → hot-reload refresh" loop.

### What does an empty string do in SetProtocolServicePath?

An empty string `""` selects the **in-memory JAPK mode**: it serves the package loaded by `LoadFromBytes` and returns a `JADE://<signature>` URL (the package must be loaded first). A directory path selects filesystem mode; a `.japk` file path mounts an on-disk package.

### How do I debug JAPK loading failures?

- `LoadFromBytes` returns a negative error code; details arrive via the `EventJapkLoadFailed` event;
- don't call `SetPublicKey` for obfuscated packages (JPKBIN02); signed packages require the public key first;
- the app_name / app_signature used at packaging time must match `Init`.

---

## Version Info

- **SDK version**: always use `@latest`; see [GitHub Releases](https://github.com/luoxueyousheng/JadeViewGo/releases) for changelogs
- **Go**: 1.23+
