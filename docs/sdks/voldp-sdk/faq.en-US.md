---
order: 5
---

# FAQ

## Installation & Environment

### Which operating systems and architectures are supported?

Windows 10 / 11, x86 (win32) and x64. The module picks the matching static library for the build target automatically.

### Do I need to ship a DLL with my program?

No. The module links statically into your project; the output is a single exe. The only runtime dependency is the WebView2 Runtime (bundled with Win11).

### How do I get started?

Install the module → reference `火山.JadeView` in your project → declare `变量 Jade <类型 = JadeView>` → click the lightning icon next to the variable to declare event callbacks.

## Initialization & Lifecycle

### 初始化 returns 假 / the app won't start — how do I debug?

Pass a file path as the `日志路径` argument of `初始化`; the failure reason lands in the log. Common causes: app signature too short (≥6 chars recommended), unwritable data directory, or another instance already running in single-instance mode (your process forwards its command line to the first instance and exits — that's expected).

### Why must windows be created inside the 应用就绪 event?

`创建窗口` requires the runtime to be ready. Calling it around `初始化` directly returns 0; `JadeView_应用就绪` is the first entry point after initialization completes, so create windows there.

### Which events need manual subscription?

Interceptable and special events: `窗口即将关闭`, `即将导航`, `请求新窗口`, `下载开始`, `菜单事件`, `自定义菜单事件`, `文件拖放`. Subscribe with `Jade.订阅事件 (订阅_视图事件.xxx)` before `初始化`; all ordinary events are auto-subscribed by `初始化`.

### What do interceptable events return?

Return `1` to intercept, `0` to pass. Return values of ordinary events are ignored. Note `下载开始` is inverted in spirit: the SDK blocks downloads by default, and your callback passes them through.

## Events & IPC

### What's the easiest way to write receive-event methods?

Declare `变量 Jade <类型 = JadeView>`, then click the **lightning icon** next to the variable and pick the events — methods are generated with matching names and signatures. First thing inside the callback: check `来源对象 == Jade`.

### Can I open synchronous dialogs or do heavy work inside callbacks?

Not recommended. Event and IPC callbacks can arrive on library worker threads; blocking causes frontend invoke timeouts and UI stalls. Use the `_异步` dialog variants; offload heavy work to a thread and push the result back with `发送IPC消息`.

### The frontend jade.invoke never resolves?

Check in order: ① `置IPC频道回调` was called before `注册IPC通道`; ② the callback method carries `@强制输出 = 真` and the right `@输出名`; ③ the callback returns **non-empty text** for that channel (empty text = no reply, so the frontend waits until timeout); ④ the page was loaded through the protocol service (external origins are gated by `源站白名单`).

### Can a class member variable share a name with an event parameter?

No. For example a member named `热键ID` collides with the `全局热键` event's `热键ID` parameter and fails to compile ("duplicate name"). Rename the member (e.g. `已注册热键ID`).

## Windows & Appearance

### Mica / Acrylic backdrop has no effect?

Three requirements: `窗口选项.透明窗口 = 真`; the page body background is transparent; the OS is Windows 11 (check `Jade.系统.是否为Win11()` and fall back to `置背景色` solid colors elsewhere).

### In-page dropdowns / overlays look transparent?

On transparent windows, translucent in-page overlays show straight through to the desktop — CSS `backdrop-filter` only blurs page pixels and cannot reach the DWM backdrop layer. Give overlays opaque backgrounds.

### How do I drag a window without a title bar?

Add the HTML boolean attribute `jade-region-drag` to an element (and `jade-region-no-drag` on clickable children to carve them out). Runtime support is injected automatically, no JS needed.

### 取句柄 returns 0?

For standard windows (`创建窗口`) the library deliberately hides the HWND and always returns 0; only windows from `创建无边框窗口` return a valid handle.

## Dialogs & Scripts

### Do async dialog results need manual freeing?

No. The callback receives a stable JSON string; the underlying pointers are managed by the module.

### Is the 执行脚本 return value the JS result?

No. It is an **incrementing request id** (>0 submitted, 0 failed). The JS result arrives asynchronously via the `脚本执行结果` event, keyed by that id.

## Storage & Resources

### When can YAML be used?

After `初始化`. Data files live in the initialization data directory; file names reject `\ / .. :` path-traversal characters.

### Any rules for the protocol-service directory?

Never make the site directory the same as (or nested with) the data directory — the library keeps writing data, which would trigger a "write → hot-reload refresh" loop.

### How do I debug JAPK load failures?

`加载字节集` returns negative error codes (-5 bad signature, -6 app name/signature mismatch with `初始化`, -9 missing public key, etc. — full table in the API reference); details are also reported via the `应用包加载失败` event. JAPKs built with the free edition must be loaded by path, not from memory.

## Platform

### No 调试输出 visible in a GUI build?

GUI programs have no console. Pass a `日志路径` to `初始化` to write logs to disk, or run under the VolDP IDE debugger during development.

### Any encoding requirements for text project files?

Current VolDP versions default `.wsv` / `.vprj` text project files to **UTF-8 without BOM**. The module already handles VolDP text (UTF-16) ⇄ underlying library (UTF-8) conversion internally; business code never needs to care.

## Versioning

The documentation tracks the latest released module version; see the repository Releases for change history.
