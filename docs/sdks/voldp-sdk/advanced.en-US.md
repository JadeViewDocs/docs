---
order: 3
---

# Advanced Usage

## Bidirectional IPC

### VolDP → frontend

`发送IPC消息` pushes a payload to a window; the frontend receives it with `jade.on`:

```wsv
Jade.发送IPC消息 (主窗口ID, "state-changed", "{\"count\":42}")
```

```js
jade.on('state-changed', payload => {
  const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
  console.log(data.count);
});
```

For structured data, build the payload with the built-in `json_object` instead of hand-escaping strings:

```wsv
变量 消息 <类型 = json_object>
消息.置文本 ("level", "success")
消息.置文本 ("message", "Task finished")
Jade.发送IPC消息 (主窗口ID, "toast", 消息.到文本 ())
```

### Frontend → VolDP

The frontend's `jade.invoke(channel, payload)` returns a Promise; the VolDP callback resolves it by returning non-empty text (empty text = no reply):

```js
const res = await jade.invoke('query-user', { id: 1001 }, { timeout: 8000 });
```

```wsv
如果 (通道名 == "query-user")
{
    变量 请求 <类型 = json_object>
    请求.创建自文本 (数据)
    变量 应答 <类型 = json_object>
    应答.置整数 ("id", 请求.取整数 ("id", 0))
    应答.置文本 ("name", "Alice")
    返回 (应答.到文本 ())
}
```

:::warning{title="Callback threads and long work"}
IPC callbacks and some event callbacks may arrive on library worker threads. **Do not block them with long-running work** (the frontend invoke will time out), and never open synchronous dialogs there — use the `_异步` dialog variants. Offload heavy work to a thread and push the result back with `发送IPC消息`.
:::

## Three Ways to Load Frontend Assets

| Approach | Call | Best for |
|------|------|------|
| Local directory | `置协议服务目录 (取运行目录 () + "web", 热载)` | Development / non-sensitive assets |
| JAPK on disk | `置协议服务目录 ("app.japk", 假)` | Bundled assets shipped as a file |
| JAPK in memory | `应用包.加载字节集 (...)` then `置协议服务目录 ("")` | Encrypted assets, zero frontend files on disk |

All three return an address you pass straight to `创建窗口` — same-origin with the library, no CORS issues for IPC.

### CORS and IPC risk

Pages loaded from external `http(s)://` origins are gated by `源站白名单` (`JadeViewOptions`) — without a whitelist entry, external origins cannot talk to the host. Pages served through the protocol service are exempt.

## JAPK In Depth

JAPK is JadeView's encrypted / signed frontend bundle format. Loading from memory:

```wsv
// 1. (signed packages) set the Ed25519 public key — once set, only signed packages load
Jade.应用包.设置公钥 ("base64PublicKey44Chars")

// 2. Load from a byte set (or use 加载视窗文件资源 to read an embedded resource —
//    frontend assets fully hidden inside the exe)
变量 结果 <类型 = 整数>
结果 = Jade.应用包.加载字节集 (读入文件 ("app.japk"))
如果 (结果 != 0)
{
    调试输出 ("JAPK load failed, code:", 结果)   // negative error codes, see the API reference
}

// 3. Empty root = serve the in-memory package; returns JADE://<app signature>
变量 地址 <类型 = 文本型>
地址 = Jade.置协议服务目录 ("")
```

Notes:

- The JAPK's app name / signature must match what `初始化` received (mismatch returns `-6`)
- Load failures are also reported through the `应用包加载失败` event
- JAPKs built with the free edition should load by **path** (`置协议服务目录 ("app.japk")`), not from memory
- Embedding the `.japk` as a VolDP file resource and using `加载视窗文件资源` hides the frontend entirely inside the exe

## Single Instance & Protocol Launch

With single-instance enabled in `初始化`, a second launch (including `myapp://` protocol activation) forwards its full command line to the first instance and exits; the first instance receives the `第二实例` event:

```wsv
// register a custom protocol (writes the registry)
Jade.系统.注册协议 ("myapp")
```

```wsv
方法 JadeView_第二实例 <接收事件 类型 = 整数>
参数 来源对象 <类型 = JadeView>
参数 标记值 <类型 = 整数>
参数 窗口ID <类型 = 整数>
参数 数据 <类型 = 文本型>
参数 命令行参数 <类型 = 文本数组类>
{
    如果 (来源对象 == Jade)
    {
        // bring the main window back; 命令行参数 already excludes argv[0]
        Jade.窗口.置可视 (主窗口ID, 真)
        Jade.窗口.置焦点 (主窗口ID)
    }
    返回 (0)
}
```

## Window Backdrops (Windows 11)

Mica / Acrylic are rendered by DWM at the window layer. Requirements:

1. `窗口选项.透明窗口 = 真`
2. The page `body` background must be transparent (CSS `background: transparent`), otherwise the page color covers the backdrop
3. Windows 11 only — check `Jade.系统.是否为Win11()` and fall back to `置背景色` solid colors elsewhere

```wsv
如果真 (Jade.系统.是否为Win11 ())
{
    Jade.窗口.置材质 (窗口ID, 窗口材质.云母)
}
```

:::info
In-page overlays (dropdowns, toasts) using translucent backgrounds + `backdrop-filter` will show straight through to the desktop on transparent windows — `backdrop-filter` can only blur page pixels, never the DWM backdrop layer. Give overlays opaque backgrounds.
:::

## Title Bar Options Compared

| Frame style | Title bar | Control buttons | Dragging |
|------|------|------|------|
| `普通窗口` | System | System | System |
| `标题覆盖` | None, page extends to the top | **Built-in** (top-right; colors via `置标题栏覆盖层样式`) | `jade-region-drag` markup |
| `无标题栏` / `无边框` | None | Frontend-drawn (call `最小化` / `最大化切换` / `关闭` over IPC) | `jade-region-drag` markup |

Mark page drag regions with HTML boolean attributes (injected by the runtime, no JS needed):

```html
<header jade-region-drag>
  Title bar content…
  <button jade-region-no-drag>Clickable button (carve-out)</button>
</header>
```

Difference from the legacy CSS `-webkit-app-region: drag`: right-click does not open the system title-bar menu.

## Threading Notes

- JadeView's API functions are thread-safe and may be called from VolDP worker threads
- Event / IPC callbacks may arrive on library threads: guard your own shared data
- Never block inside callbacks (see the IPC section above)

## Packaging & Distribution

- Static linking, **single exe**; ship frontend assets via `@视窗.附属文件` or embed them as a JAPK
- Only runtime dependency is the WebView2 Runtime (bundled with Win11; see the official WebView2 install guide for Win10 detection)
- The data directory defaults under `%LOCALAPPDATA%` per app signature; logs live in `{data dir}\logs` (`路径常量.应用日志目录`)
