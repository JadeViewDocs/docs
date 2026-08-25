---
order: 1
---

# Quick Start

## Requirements

- **Volcano Development Platform** (VolDP, PC edition)
- **Windows 10 / 11** + WebView2 Runtime (bundled with Win11; on Win10 install via Microsoft's Evergreen Bootstrapper)

The module is **statically linked** — `JadeView.wsv` references the C++ bridge and `JadeView.lib`, which compile straight into your project. **The output is a single exe with no DLL to ship.**

## Installation

1. Download the module installation package and install it into the VolDP module directory
2. **Reference the JadeView module** (`火山.JadeView`) in your VolDP project
3. Declare a JadeView base-class variable:

```wsv
变量 Jade <类型 = JadeView>
```

4. Click the **lightning icon** next to the variable to quickly declare event callback methods (`JadeView_应用就绪`, `JadeView_全部窗口已关闭`, etc. — names and parameter signatures are generated automatically)

For win32 / x64 targets the module picks the matching static library automatically; the build output is a single exe.

## Minimal Example

```wsv
<火山程序 类型 = "通常" 版本 = 1 />

包 火山.样例

类 启动类 <公开 基础类 = 程序类>
{
    变量 Jade <类型 = JadeView>

    方法 启动方法 <公开 类型 = 整数>
    {
        // 1. Interceptable / special events must be subscribed before 初始化
        //    (ordinary events are subscribed automatically)
        Jade.订阅事件 (订阅_视图事件.请求新窗口)

        // 2. Initialize the app
        // 初始化 (dev mode, log path, data dir, app name, app signature, single instance)
        // app signature: ≥6 chars, reverse-domain style recommended —
        // in JAPK mode it becomes the JADE:// URL host
        如果 (Jade.初始化 (真, "", "", "My First App", "com.example.myapp", 真) == 假)
        {
            返回 (0)
        }

        // 3. Run the message loop (blocks until exit)
        Jade.运行消息循环 ()
        返回 (1)
    }

    方法 JadeView_应用就绪 <接收事件 类型 = 整数 注释 = "First entry point after initialization; create the main window here.">
    参数 来源对象 <类型 = JadeView>
    参数 标记值 <类型 = 整数>
    参数 窗口ID <类型 = 整数>
    参数 数据 <类型 = 文本型>
    {
        如果 (来源对象 == Jade)
        {
            变量 窗口选项 <类型 = JadeWindowOptions>
            变量 视图选项 <类型 = JadeViewOptions>
            窗口选项.标题 = "My First JadeView App"
            窗口选项.宽度 = 1024
            窗口选项.高度 = 768
            窗口选项.左边 = -1              // both -1 = centered
            窗口选项.顶边 = -1
            窗口选项.可调整大小 = 真
            窗口选项.主题 = 窗口主题.跟随系统

            变量 主窗口ID <类型 = 整数>
            主窗口ID = Jade.创建窗口 ("https://example.com", 0, 窗口选项, 视图选项)
            调试输出 ("Window created:", 主窗口ID)
        }
        返回 (0)
    }

    方法 JadeView_全部窗口已关闭 <接收事件 类型 = 整数>
    参数 来源对象 <类型 = JadeView>
    参数 标记值 <类型 = 整数>
    参数 窗口ID <类型 = 整数>
    {
        如果 (来源对象 == Jade)
        {
            Jade.退出程序 ()   // exit after all windows are closed
        }
        返回 (0)
    }
}
```

## Application Lifecycle

1. **Subscribe to special events** — interceptable events (`请求新窗口`, `窗口即将关闭`, `即将导航`, `下载开始`) and `文件拖放` are not auto-subscribed; call `订阅事件(...)` before `初始化`
2. **Initialize** — call `Jade.初始化(...)`; on failure return immediately
3. **Create windows** — call `创建窗口(...)` inside the `JadeView_应用就绪` receive-event method
4. **Message loop** — call `Jade.运行消息循环()` to enter the blocking loop
5. **Exit** — call `Jade.退出程序()` inside `JadeView_全部窗口已关闭`

:::info{title="Receive events are the VolDP way to hook callbacks"}
All JadeView events are exposed as "defined events". After declaring `变量 Jade <类型 = JadeView>`, **click the lightning icon** next to the variable to generate receive-event methods like `JadeView_应用就绪` — names and signatures match automatically, nothing to hand-write. Remember to check `来源对象 == Jade` inside the callback.
:::

## Loading Local HTML

Use the protocol service to map a local directory to a servable URL — safer than `file://` and same-origin with the library (no CORS issues for IPC):

```wsv
方法 JadeView_应用就绪 <接收事件 类型 = 整数>
参数 来源对象 <类型 = JadeView>
参数 标记值 <类型 = 整数>
参数 窗口ID <类型 = 整数>
参数 数据 <类型 = 文本型>
{
    如果 (来源对象 == Jade)
    {
        // hot reload = 真: page refreshes as soon as site files change (great for development)
        变量 本地资源地址 <类型 = 文本型>
        本地资源地址 = Jade.置协议服务目录 (取运行目录 () + "web", 真)

        Jade.创建窗口 (本地资源地址, 0, , )
    }
    返回 (0)
}
```

Copy the frontend directory into the build output with the package attribute `@视窗.附属文件`:

```wsv
包 火山.样例 <@视窗.附属文件 = "web > web">
```

:::warning
The protocol-service site directory must **not** be the same as (or nested with) the `初始化` data directory — the library keeps writing data, which would trigger a "write → hot-reload refresh" loop.
:::

## IPC: Frontend ⇄ VolDP

The frontend sends requests with `jade.invoke(channel, payload)`; VolDP replies via a single **object-method callback**. VolDP pushes with `发送IPC消息`; the frontend receives with `jade.on(event, ...)`.

```wsv
// Set the callback once after initialization succeeds, then register channels
Jade.置IPC频道回调 (本对象, "ipcChannelMessageCallback")
Jade.注册IPC通道 ("greet")
Jade.注册IPC通道 ("set-theme")
```

```wsv
方法 IPC频道消息 <公开 类型 = 文本型 @强制输出 = 真 @输出名 = "ipcChannelMessageCallback">
参数 通道名 <类型 = 文本型>
参数 窗口ID <类型 = 整数>
参数 数据 <类型 = 文本型>
{
    如果 (通道名 == "greet")
    {
        // parse the payload with the built-in json_object
        变量 数据解构 <类型 = json_object>
        数据解构.创建自文本 (数据)
        返回 ("Hello, " + 数据解构.取文本 ("name", "guest"))
    }
    如果 (通道名 == "set-theme")
    {
        Jade.窗口.置主题 (窗口ID, 数据)
        返回 ("ok")
    }
    返回 ("")   // empty text = no reply
}
```

Frontend side:

```js
const reply = await jade.invoke('greet', { name: 'VolDP' });  // "Hello, VolDP"
jade.on('push-demo', payload => console.log('host push:', payload));
```

## Build & Distribution

- Compile directly in the VolDP IDE (win32 / x64); static linking yields a **single exe**
- Two ways to ship frontend assets:
  - `@视窗.附属文件 = "web > web"` copies the directory at build time; load it with `置协议服务目录`
  - Bundle into an encrypted **JAPK** and load from memory via `Jade.应用包.加载字节集` (zero frontend files on disk) — see [Advanced](./advanced.md)
- Can't see `调试输出` in a GUI build? Pass a `日志路径` to `初始化` to write logs to disk

## Feature Map

`JadeView` is the entry point; capabilities hang off member objects:

| Area | Entry | Key methods |
|------|------|----------|
| Lifecycle | `Jade.` | `初始化` / `运行消息循环` / `退出程序` / `取版本` |
| Window creation | `Jade.` | `创建窗口` / `创建无边框窗口` / `置协议服务目录` |
| WebView | `Jade.` | `导航到地址` / `执行脚本` / `置缩放比例` / `取URL` |
| Events & IPC | `Jade.` | `订阅事件` / `置IPC频道回调` / `注册IPC通道` / `发送IPC消息` |
| Dialogs / notifications | `Jade.` | `打开文件对话框` / `消息框` / `显示通知` (plus `_异步` variants) |
| Global hotkeys | `Jade.` | `注册全局热键` / `注销全局热键` |
| Window ops | `Jade.窗口.` | `置标题` / `置大小` / `置材质` / `置窗口层级` / `置任务栏进度` … |
| System tools | `Jade.系统.` | clipboard / paths / displays / printing / autostart / NTP / file icons … |
| YAML storage | `Jade.YAML.` | `写` / `读` / `列出键` / `删除` … |
| System tray | `Jade.托盘.` | `创建` / `置图标` / `添加菜单项` … |
| Context menu | `Jade.菜单.` | `创建` / `置显示` / `销毁` |
| JAPK packages | `Jade.应用包.` | `设置公钥` / `加载字节集` / `是否加载` |
| JSON | `json_object` / `json_array` / `json_value` | parse & build JSON |
| Constant classes | — | `窗口主题` / `窗口边框样式` / `订阅_视图事件` / `热键功能键` … |

Full signatures in the [API Reference](./api-reference.md); copy-paste snippets in [Examples](./examples.md).
