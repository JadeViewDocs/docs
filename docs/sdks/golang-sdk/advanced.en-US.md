---
order: 3
---

# Advanced Usage

## Bidirectional IPC

### Go → Frontend

The host pushes with `SendIPCMessage`; the frontend receives with `jade.on`:

```go
// Go side
jadeview.SendIPCMessage(windowID, "update-data", `{"count":42}`)
```

```javascript
// Frontend JS
jade.on("update-data", (data) => {
    console.log(data.count); // 42
});
```

### Frontend → Go

The frontend calls `jade.invoke()`; Go receives via `RegisterIPCHandler`, and the returned string is the reply:

```go
// Go side
jadeview.RegisterIPCHandler("get-user", func(windowID uint32, payload string) string {
    return `{"name":"Alice","age":30}` // return a JSON string
})
```

```javascript
// Frontend JS
const user = await jade.invoke("get-user", "some-payload");
console.log(user.name); // "Alice"
```

:::warning
**Slot planning**: `On` and `RegisterIPCHandler` share 64 slots, and IPC handlers cannot be unregistered — they occupy a slot permanently. With many channels, merge them into a single "bus" channel and dispatch sub-commands inside the payload.
:::

## Three Ways to Ship Frontend Assets

Production apps usually don't load online URLs — they ship the frontend with the program. Three approaches (full code in [Examples](./examples)):

| Approach | How | When |
|------|------|----------|
| **In-memory JAPK** | Bundle a `.japk` via `go:embed`, load it with `LoadFromBytes`, then call `SetProtocolServicePath("", false)` with an **empty path** to switch to memory mode | Encrypted/obfuscated distribution (recommended) |
| **Protocol service on a directory** | `SetProtocolServicePath("webdir", true)`; hotReload refreshes on file changes | Development |
| **In-process loopback HTTP** | `net/http` on 127.0.0.1 with a random port, serving `embed.FS` | Single-file distribution (when you don't want JAPK) |

All three produce a URL you can hand straight to `CreateWindow`.

### Cross-origin and IPC Risks

When the page is loaded from an **online or local http(s) URL** (loopback HTTP, any hosted page), it is not same-origin with the library, so IPC (`jade.invoke` / postMessage) may be blocked by cross-origin restrictions. `WebViewSettings.CORSWhitelist` / `PostMessageWhitelist` can whitelist origins, but the library **exposes no API to query the temporary domain it registers**, so you can't whitelist precisely.

Mitigations:

- **Prefer the jade:// same-origin approaches** (protocol service / JAPK);
- If you must use http(s), fall back to `PostMessageWhitelist: "*"`.

## JAPK Packages in Depth

JAPK is JadeView's frontend bundling format, in two flavors:

- **Obfuscated packages** (JPKBIN02): no public key needed — just `LoadFromBytes`;
- **Signed packages** (v2): call `SetPublicKey` with the Base64 Ed25519 public key (44 chars) first, and app_name / app_signature are strictly validated against `Init`.

Complete in-memory loading flow:

```go
//go:embed app.japk
var appJAPK []byte

jadeview.On(jadeview.EventJapkLoadFailed, func(windowID uint32, data string) string {
    fmt.Println("[JAPK] load failed:", data) // error details arrive via this event
    return ""
})

// inside the app-ready callback:
if rc := jadeview.LoadFromBytes(appJAPK); rc != 0 {
    fmt.Println("LoadFromBytes failed:", rc) // 0=success, negative=error code
    jadeview.Exit()
    return ""
}
// Empty path = serve the in-memory package loaded by LoadFromBytes
// (a directory path would switch to filesystem mode instead)
url, ok := jadeview.SetProtocolServicePath("", false)
if !ok {
    jadeview.Exit()
    return ""
}
// url looks like JADE://com.example.myapp — app_signature is the host; navigate directly
jadeview.CreateWindow(url, 0, &opts, &settings)
```

:::info
Use a reverse-domain `appSignature` in `Init` (e.g. `com.example.myapp`) — it becomes the `JADE://` URL host.
:::

## Platform Adaptation (injecting env via PreloadJS)

Use `PreloadJS` to inject environment info before page scripts run, so the frontend can adapt synchronously (e.g. enable backdrops only on Windows 11):

```go
win11 := jadeview.IsWindows11()

settings := jadeview.DefaultWebViewSettings()
settings.PreloadJS = fmt.Sprintf(
    "window.__JV_ENV={arch:%q,win11:%v};",
    runtime.GOARCH, win11)

opts := jadeview.DefaultWindowOptions()
opts.FrameStyle = jadeview.FrameStyle.TitleOverlay // built-in window controls, top-right
if win11 {
    opts.Transparent = true // backdrops need a transparent base
} else {
    opts.BackgroundColor = "#F3F3F3FF"
}

winID := jadeview.CreateWindow(url, 0, &opts, &settings)
if win11 {
    jadeview.SetBackdrop(winID, jadeview.Backdrop.Mica)
}
```

```javascript
// Frontend reads synchronously (injected before page scripts run)
const ENV = Object.assign({ win11: true }, window.__JV_ENV);
if (!ENV.win11) {
    // disable backdrop options, fall back to solid colors
}
```

## Global Hotkeys

```go
// Register (modifiers/vk are Win32-style values: MOD_CONTROL=0x2, MOD_ALT=0x1, etc.)
hotkeyID := jadeview.RegisterGlobalHotkey(0x2|0x1, 'K') // Ctrl+Alt+K

jadeview.On(jadeview.EventGlobalHotkey, func(windowID uint32, data string) string {
    fmt.Println("hotkey fired:", data) // data contains the hotkey_id
    jadeview.SetFocus(mainWinID)
    return ""
})

// Unregister
jadeview.UnregisterGlobalHotkey(hotkeyID)
```

## YAML Config Persistence

Stored in the `Init` data directory; call only **after** `app-ready`:

```go
jadeview.YAMLSet("settings.yaml", "ui.theme", "dark")
jadeview.YAMLSet("settings.yaml", "ui.langs", `["zh-CN","en"]`) // JSON is auto-parsed

theme, ok := jadeview.YAMLGet("settings.yaml", "ui.theme") // `"dark"` (a JSON string)
all, _ := jadeview.YAMLGetAll("settings.yaml")             // whole file as JSON
```

## Window Backdrops (Windows 11)

```go
opts := jadeview.DefaultWindowOptions()
opts.Transparent = true // transparency is required, and the page background must be transparent too

winID := jadeview.CreateWindow(url, 0, &opts, nil)

if jadeview.IsWindows11() {
    jadeview.SetBackdrop(winID, jadeview.Backdrop.Mica)    // Mica (recommended)
    // jadeview.SetBackdrop(winID, jadeview.Backdrop.MicaAlt) // Mica alt
    // jadeview.SetBackdrop(winID, jadeview.Backdrop.Acrylic) // Acrylic
} else {
    jadeview.SetBackgroundColor(winID, "#F3F3F3FF") // solid-color fallback off Win11
}
```

## Packaging & Distribution

### Single self-contained exe

The DLL is embedded via `go:embed` — **no packaging tool needed**:

```powershell
go build -ldflags "-H windowsgui" -o myapp.exe .
```

- On first run the DLL is extracted to a content-addressed directory under `%TEMP%\jadeview\` (sha256-verified; multiple versions coexist safely);
- A `JadeView.dll` next to the exe takes priority;
- Cross-compiling for 386 / arm64 only needs a different `GOARCH` — any machine can build;
- Some antivirus products flag the "extract-and-load a DLL" pattern heuristically; that's expected — guide users to whitelist. If DLL loading is blocked, the first API call panics — call `Preload()` early at startup to probe and fail gracefully:

```go
if err := jadeview.Preload(); err != nil {
    // show a system prompt / write a log, then exit — avoid the later panic
}
```

### Drag Regions in Borderless Windows

In borderless / no-titlebar windows, mark drag regions with the HTML boolean attribute `jade-region-drag` and exclude interactive elements inside them with `jade-region-no-drag` (injected automatically at runtime — no script required).
