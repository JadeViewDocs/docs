---
order: 2
---

# API Reference

The SDK's entry point is the `JadeView` class (declare `变量 Jade <类型 = JadeView>`). Window operations, system tools, storage, tray, menus, and app packages live on the member objects `Jade.窗口` / `Jade.系统` / `Jade.YAML` / `Jade.托盘` / `Jade.菜单` / `Jade.应用包`.

> Signatures on this page match the latest module declarations. Parameters with defaults may be left empty at the call site (e.g. `创建窗口 (地址, 0, , )`).

## Core Methods

### `初始化`

Initializes the JadeView application and auto-subscribes the default non-interceptable events. Interceptable events must be subscribed beforehand via [`订阅事件`](#订阅事件--注销订阅事件).

```wsv
逻辑型 初始化 (
    调试模式,     // 逻辑型, default 假 — enable DevTools, debug shortcuts, etc.
    日志路径,     // 文本型, default "" — log file path; empty = no log file
    数据目录,     // 文本型, default "" — data root; empty = auto-selected
    应用名,       // 文本型 — display name (about dialog, notifications, …)
    应用标识,     // 文本型 — unique id, ≥6 chars reverse-domain recommended;
                  // used for the data dir and single-instance pipe; the JADE:// host in JAPK mode
    单实例        // 逻辑型, default 真 — relaunches forward their command line to
                  // the first instance (fires the 第二实例 event)
)
```

Returns `真` on success. The result is also reported through the `应用就绪` event (on failure `数据` carries the error description).

### `运行消息循环`

```wsv
整数 运行消息循环 ()
```

Enters the blocking message loop. Call after `初始化`, as the last step of the startup method.

### `退出程序`

```wsv
逻辑型 退出程序 ()
```

Cleans up and ends the message loop. Usually called inside the `全部窗口已关闭` event callback.

### `取版本` / `取WebView版本`

```wsv
文本型 取版本 ()         // JadeView version string (includes build number), static
文本型 取WebView版本 ()   // WebView2 runtime version
```

---

## Window Creation

### `创建窗口`

Creates a standard WebView window (system title bar / frame, style configurable).

```wsv
整数 创建窗口 (
    地址,        // 文本型 — initial URL (http(s):// or a protocol-service local address)
    父窗口ID,    // 整数, default 0 — 0 = top-level window
    窗口选项,    // JadeWindowOptions, default empty object
    视图设置     // JadeViewOptions, default empty object
)
// returns window_id (>0 success, 0 failure — e.g. called before 应用就绪)
```

### `JadeWindowOptions` fields

| Field | Type | Description |
|------|------|------|
| `标题` | 文本型 | Title bar text |
| `宽度` / `高度` | 整数 | Initial size (px) |
| `左边` / `顶边` | 整数 | Top-left position; both -1 = centered |
| `可调整大小` | 逻辑型 | Resizable by dragging edges |
| `边框风格` | 文本型 | Frame style, see the `窗口边框样式` constant class |
| `透明窗口` | 逻辑型 | Transparent background (enable when using Mica etc.) |
| `背景颜色` | 文本型 | Background `#RRGGBB(AA)` |
| `置顶` | 逻辑型 | Always on top |
| `主题` | 文本型 | Theme, see the `窗口主题` constant class |
| `最大化启动` / `允许最大化` / `允许最小化` | 逻辑型 | Open maximized / title-bar button toggles |
| `最小宽度` / `最小高度` / `最大宽度` / `最大高度` | 整数 | Size constraints, 0 = unlimited |
| `全屏启动` | 逻辑型 | Open fullscreen |
| `默认聚焦` | 逻辑型 | Take keyboard focus on open |
| `初始隐藏` | 逻辑型 | Create hidden (load first, show later) |
| `使用页面图标` | 逻辑型 | Use the page favicon as the window icon |
| `内容保护` | 逻辑型 | Block screenshots / screen recording |
| `自动保存状态` | 逻辑型 | Remember window position per window_id and restore it |
| `任务栏隐藏` | 逻辑型 | Skip taskbar / Alt-Tab |
| `不抢焦点` | 逻辑型 | Never activate on click / show |

### `JadeViewOptions` fields

| Field | Type | Description |
|------|------|------|
| `自动播放` | 逻辑型 | Allow media autoplay |
| `后台节流` | 逻辑型 | Throttle timers / animation in background |
| `禁止右键` | 逻辑型 | Disable the page context menu |
| `用户代理` | 文本型 | Custom UA, empty = default |
| `预加载脚本` | 文本型 | JS injected before page scripts run |
| `允许全屏` | 逻辑型 | Allow the page fullscreen API |
| `PostMessage白名单` | 文本型 | postMessage forwarding whitelist (string close to the page origin); pages loaded via the protocol service always pass |
| `源站白名单` | 文本型 | CORS origin whitelist, comma/semicolon separated, exact match |
| `账号自动填充` / `资料自动填充` | 逻辑型 | Credential autofill / general form autofill |
| `无痕模式` | 逻辑型 | Incognito |
| `禁用剪切板` | 逻辑型 | Disable clipboard permissions |
| `代理地址` | 文本型 | `http://host:port` or `socks5://host:port` |
| `启动获取焦点` | 逻辑型 | WebView takes focus initially |

### `创建无边框窗口`

```wsv
整数 创建无边框窗口 (地址, 视图设置)
```

Creates a standalone borderless WebView window — for custom title bars and floating tool windows. Only this kind of window returns a valid HWND from `Jade.窗口.取句柄`.

### `置协议服务目录`

```wsv
文本型 置协议服务目录 (
    根目录,     // 文本型, default "" — frontend dir / .japk path; empty = serve the JAPK already loaded in memory
    热载模式    // 逻辑型, default 假 — file-system mode only: refresh on file change (150ms debounce)
)
// returns a local address you can pass straight to 创建窗口
```

### `注册安全资源` / `注销安全资源`

```wsv
文本型 注册安全资源 (窗口ID, 本地目录, 过期时长)
// 窗口ID: 0 = global; 过期时长: seconds, 0 = never expires.
// returns a jade:// URL on success, empty text on failure
逻辑型 注销安全资源 (令牌或路径)
```

---

## Window Operations (`Jade.窗口.`)

### Basics

| Method | Description |
|------|------|
| `置标题 (窗口ID, 标题)` | Set title-bar text |
| `置大小 (窗口ID, 宽度, 高度)` | Resize (px) |
| `置位置 (窗口ID, X坐标, Y坐标)` | Move (px) |
| `置可视 (窗口ID, 可见)` | Show / hide |
| `置焦点 (窗口ID)` | Take keyboard focus |
| `置顶 (窗口ID, 置顶)` | Always-on-top toggle |
| `关闭 (窗口ID)` | Close window |
| `最小化 (窗口ID)` | Minimize to taskbar |
| `最大化切换 (窗口ID)` | Toggle maximize ⇄ restore |
| `置全屏 (窗口ID, 全屏)` | Fullscreen toggle |
| `置最小尺寸` / `置最大尺寸 (窗口ID, 宽, 高)` | Size constraints |
| `置可调整大小 (窗口ID, 是否可调整)` | Allow / forbid resizing |
| `置启用 (窗口ID, 启用)` | Disabled windows ignore user input |
| `刷新 (窗口ID)` | Reload the current page |
| `取数量 ()` | Number of active windows |
| `清理所有窗口 ()` | Close and clean up every window (static) |
| `清注册资源 (窗口ID)` | Clear the window's registered resources, returns the count |

### State queries

| Method | Returns | Description |
|------|------|------|
| `是否最大化` / `是否最小化` / `是否可见` / `是否聚焦` / `是否全屏 (窗口ID)` | 逻辑型 | Boolean state |
| `取位置尺寸 (窗口ID)` | 文本型 | Bounds JSON (x / y / width / height) |
| `取主题 (窗口ID)` | 整数 | Theme state code (1 = dark) |
| `取句柄 (窗口ID)` | 变整数 | Native HWND; standard windows always return 0, only borderless windows are valid |

### Theme & appearance

| Method | Description |
|------|------|
| `置主题 (窗口ID, 主题)` | `窗口主题.浅色` / `.深色` / `.跟随系统` |
| `置材质 (窗口ID, 窗口材质)` | Win11 DWM backdrop: `窗口材质.云母` / `.云母亚色` / `.亚克力` / `.无` |
| `置背景色 (窗口ID, 颜色值)` | Solid background `#RRGGBB(AA)`, no Mica required |
| `置边框样式 (窗口ID, 边框样式)` | See the `窗口边框样式` constant class |
| `置标题栏覆盖层样式 (窗口ID, 高度, 图标颜色, 悬停背景色)` | Control-button colors in title-overlay mode (height ≤0 keeps the height) |
| `置窗口层级 (窗口ID, 层级)` | `窗口层级.置顶` / `.普通` / `.置底` / `.贴桌面` (desktop = parasite on the wallpaper layer) |
| `置内容保护 (窗口ID, 启用)` | Anti-capture (screenshots record black) |
| `置鼠标穿透 (窗口ID, 是否穿透)` | Overlay scenarios; the window ignores the mouse while on — remember to restore |
| `置不进任务栏 (窗口ID, 不进任务栏)` | Toggle taskbar / Alt-Tab visibility at runtime |
| `置不抢焦点 (窗口ID, 不抢焦点)` | Never activate on click / show |
| `置任务栏进度 (窗口ID, 位置, 进度条状态)` | ITaskbarList3; state from the `进度条状态类型` constant class |
| `置任务栏闪烁 (窗口ID, 闪烁次数)` | FlashWindowEx |

---

## WebView Operations

| Method | Description |
|------|------|
| `Jade.导航到地址 (窗口ID, 地址, 协议头)` | Navigate; `协议头` is a JSON headers object (default `""`) |
| `Jade.窗口.刷新 (窗口ID)` | Reload the current page |
| `Jade.执行脚本 (窗口ID, 脚本文本)` | Run JS, **returns an incrementing request id** (>0 ok / 0 failed); the result arrives via the `脚本执行结果` event keyed by that id |
| `Jade.置缩放比例 (窗口ID, 比例)` | Page zoom, 1.0 = 100% |
| `Jade.取URL (窗口ID, 缓冲区大小)` | Current WebView URL (buffer defaults to 4096) |
| `Jade.系统.打开开发者工具` / `关闭开发者工具` / `开发者工具是否已打开 (窗口ID)` | DevTools control (closing is unsupported on Windows) |
| `Jade.系统.清除浏览数据 (窗口ID)` | Clear cookies / cache / LocalStorage |

:::warning{title="执行脚本 return value"}
`执行脚本` returns an **integer request id**, not the JS result. Test success with `> 0`; the actual JS result only arrives in the `脚本执行结果` event, whose JSON `id` matches the return value.
:::

---

## Events & IPC

### `订阅事件` / `注销订阅事件`

```wsv
整数   订阅事件 (事件名称)     // returns a callback id; re-subscribing returns the existing id
逻辑型 注销订阅事件 (事件名称)  // affects only this object's subscription
```

Use the `订阅_窗口事件` / `订阅_视图事件` / `订阅_通知事件` / `订阅_系统事件` constant classes instead of raw strings:

```wsv
Jade.订阅事件 (订阅_视图事件.请求新窗口)
Jade.订阅事件 (订阅_视图事件.文件拖放)
```

### `置IPC频道回调` / `注册IPC通道`

```wsv
逻辑型 置IPC频道回调 (对象实例, 方法)
// 对象实例: pass 本对象; 方法: the callback's export name (literal or constant)
逻辑型 注册IPC通道 (通道名)    // re-registering the same channel returns 真
逻辑型 注销IPC通道 (通道名)
逻辑型 清除IPC频道回调 ()
```

The callback signature is fixed (`@强制输出` + `@输出名` is how VolDP exports object methods):

```wsv
方法 IPC频道消息 <公开 类型 = 文本型 @强制输出 = 真 @输出名 = "ipcChannelMessageCallback">
参数 通道名 <类型 = 文本型>
参数 窗口ID <类型 = 整数>
参数 数据 <类型 = 文本型>
{
    返回 ("")   // empty text = no reply; non-empty = resolves the frontend jade.invoke Promise
}
```

### `发送IPC消息`

```wsv
整数 发送IPC消息 (窗口ID, 事件名称, 消息内容)
// frontend receives via jade.on('事件名称', payload => ...)
```

### Event tables

Events are exposed as "defined events"; the receive method is named `JadeView_<event>`, and its first two parameters are always `来源对象` (JadeView) and `标记值` (整数). Events marked ✔ in the "Intercept" column return `1` to intercept / `0` to pass; all other return values are ignored. "auto" in the "Subscribe" column means `初始化` subscribes it automatically.

#### Application lifecycle

| Event | Event params | Intercept | Subscribe | Description |
|------|----------|:---:|------|------|
| `应用就绪` | 窗口ID, 数据 | | auto | First entry point after init; create the main window here |
| `第二实例` | 窗口ID, 数据, 命令行参数 | | auto | Relaunch in single-instance mode; argv excludes the exe path |
| `程序崩溃回调` | 窗口ID, 崩溃代码 | | auto | Crash codes in the `崩溃代码类型` constant class |

#### Window

| Event | Event params | Intercept | Subscribe |
|------|----------|:---:|------|
| `窗口已创建` / `窗口已关闭` / `全部窗口已关闭` / `窗口已销毁` | 窗口ID | | auto |
| `窗口即将关闭` | 窗口ID | ✔ | **manual** |
| `窗口尺寸改变` | 窗口ID, 宽度, 高度 | | auto |
| `窗口位置改变` | 窗口ID, X坐标, Y坐标 | | auto |
| `窗口边界改变` | 窗口ID, X坐标, Y坐标, 宽度, 高度, 数据 | | auto |
| `窗口获得焦点` / `窗口失去焦点` | 窗口ID | | auto |
| `窗口状态改变` | 窗口ID, 已最大化 | | auto |
| `窗口全屏状态改变` | 窗口ID, 全屏 | | auto |
| `主题改变` | 窗口ID | | auto |
| `更新窗口图标` | 窗口ID, 数据 | | auto |

#### WebView / navigation

| Event | Event params | Intercept | Subscribe |
|------|----------|:---:|------|
| `即将导航` | 窗口ID, 地址 | ✔ | **manual** |
| `请求新窗口` | 窗口ID, 地址 | ✔ | **manual** |
| `开始加载` / `加载完成` | 窗口ID, 地址 | | auto |
| `页面标题更新` | 窗口ID, 标题 | | auto |
| `页面图标更新` | 窗口ID, 数据 | | auto |
| `下载开始` | 窗口ID, 数据 | ✔ (return 1 blocks the download) | **manual** |
| `下载完成` | 窗口ID, 下载地址, 成功, 数据 | | auto |
| `脚本执行结果` | 窗口ID, 数据 | | auto |
| `页面消息` | 窗口ID, 来源, 消息 | | auto |
| `文件拖放` | 窗口ID, 数据 | ✔ (enter/drop phases) | **manual** |
| `异步调用响应` | 窗口ID, 数据 | | auto |

#### Tray / menu / misc

| Event | Event params | Subscribe |
|------|----------|------|
| `托盘交互事件` | 事件类型, 托盘ID | auto (types in the `托盘事件类型` constant class) |
| `托盘菜单命令事件` | 托盘ID, 键名, 项目ID, 项目类型, 已选中, 风险项目 | auto |
| `菜单事件回调` | 窗口ID, X坐标, Y坐标, 菜单场景, 默认菜单项列表, 数据 | **manual** (`订阅_视图事件.菜单事件`) |
| `自定义菜单事件` | 窗口ID, 数据 (item_id string) | **manual** (`订阅_视图事件.自定义菜单事件`) |
| `全局热键` | 窗口ID, 热键ID, 修饰键, 虚拟键码 | auto |
| `通知已显示` / `通知已关闭` / `通知失败` / `通知动作` | 窗口ID, 数据 | auto |
| `应用包加载成功` / `应用包加载失败` | 窗口ID, 数据 | auto |

---

## Dialogs & Notifications

### Synchronous API

Blocks and returns a UTF-8 JSON string directly (pointer lifetimes handled internally, nothing to free).

```wsv
文本型 打开文件对话框 (窗口ID, 标题, 默认路径, 按钮文本, 过滤器, 属性文本)
文本型 保存文件对话框 (窗口ID, 标题, 默认路径, 按钮文本, 过滤器)
文本型 消息框 (窗口ID, 标题, 正文, 详情, 按钮列表, 默认按钮索引, 取消按钮索引, 类型名)
整数   显示错误框 (窗口ID, 标题, 内容)
逻辑型 打开关于对话框 (窗口ID)   // app name from 初始化, icon from the window
```

- `过滤器`: JSON array string, e.g. `[{"name":"Images","extensions":["jpg","png"]}]`
- `属性文本`: comma-separated, see the `对话框属性` constant class, e.g. `openFile,multiSelections`
- `类型名`: see the `提示框类型` constant class (`none` / `info` / `warning` / `error` / `question`)
- Open dialog returns `{"canceled":false,"filePaths":[...]}`; message box returns `{"response":0}` (0 = OK, 1 = Cancel)

### Asynchronous API

Non-blocking; the result comes back as a JSON string through an **object-method callback**:

```wsv
逻辑型 显示打开文件对话框_异步 (窗口ID, 标题, 默认路径, 按钮文本, 过滤器, 属性文本, 对象实例, 方法)
逻辑型 显示保存文件对话框_异步 (窗口ID, 标题, 默认路径, 按钮文本, 过滤器, 对象实例, 方法)
逻辑型 显示消息框_异步 (窗口ID, 标题, 正文, 详情, 按钮列表, 默认按钮索引, 取消按钮索引, 类型名, 对象实例, 方法)
```

The callback takes a single `数据文本` parameter and must carry `@强制输出` / `@输出名`:

```wsv
方法 对话框结果 <公开 类型 = 整数 @强制输出 = 真 @输出名 = "dialogBoxCallback">
参数 数据文本 <类型 = 文本型>
{
    调试输出 (数据文本)
    返回 (0)
}
```

### `显示通知`

```wsv
逻辑型 显示通知 (参数对象)   // JadeNotificationOptions
```

| `JadeNotificationOptions` field | Type | Description |
|------|------|------|
| `标题` / `正文` | 文本型 | Title and body |
| `图标` | 文本型 | Icon file path |
| `超时` | 整数 | Milliseconds, 0 = system default |
| `按钮1` / `按钮2` / `文本3` | 文本型 | Buttons (clicks arrive via the `通知动作` event) |
| `动作` | 文本型 | Extra action payload |

---

## Global Hotkeys

```wsv
整数   注册全局热键 (修饰键, 键码)   // returns hotkey id (>0) or 0 on failure
逻辑型 注销全局热键 (热键ID)
```

- `修饰键`: combine `热键功能键` constants, e.g. `位或 (热键功能键.Control, 热键功能键.Alt)`
- `键码`: Win32 virtual-key code (e.g. `74` = J)
- Fires the `全局热键` event even when the app has no focus

---

## System Tray (`Jade.托盘.`)

The tray object owns its tray_id; all methods use it implicitly. Tray events (`托盘交互事件` / `托盘菜单命令事件`) are auto-subscribed by JadeView.

```wsv
逻辑型 创建 ()                       // returns 真 if already created
逻辑型 销毁 ()
逻辑型 置可见 (可见)
逻辑型 置提示 (提示内容)              // hover tooltip
逻辑型 置图标 (图标路径)              // .ico file
逻辑型 置图标2 (图标数据)             // byte set (ICO/PNG content), no temp file needed
```

### Tray menu

The menu is a **flat table**; nest by pointing `父键名称` at a parent's `键名称`. Every change applies immediately:

```wsv
整数   添加菜单项 (菜单类型, 键名称, 显示名称, 父键名称, 禁止, 风险项目)
// 菜单类型: 托盘菜单项类型.普通项 / .子菜单 / .分隔线 / .分组
// 键名称: business key, unique across the table (dividers too);
//         clicks dispatch by key via the 托盘菜单命令事件 event
逻辑型 置菜单禁止 (键名称, 是否禁止)
逻辑型 置菜单危险 (键名称, 是否危险)   // dangerous items (e.g. "Exit" rendered red)
逻辑型 置菜单标题 (键名称, 显示标题)
逻辑型 删除菜单 (键名称)
逻辑型 清空菜单 ()
```

---

## Context Menu (`Jade.菜单.`)

Taking over the WebView context menu: subscribe to `菜单事件` → create items and call `置显示` inside `菜单事件回调` → WebView2 shows the native menu → clicking a custom item fires `自定义菜单事件` (data = item_id). Without a `菜单事件` subscription the WebView2 default menu shows.

```wsv
整数   创建 (显示名称, 菜单类型, 父菜单ID, 菜单ID)
// 菜单类型: 菜单类型.命令 / .复选框 / .单选 / .分隔线 / .子菜单 / .默认菜单项
// default items (kind=5): pass an 原生菜单项 constant (e.g. 原生菜单项.复制) as 显示名称 —
//   WebView2 performs the native action, no 自定义菜单事件 fires
// 菜单ID: custom id returned via 自定义菜单事件 (ignored for default items)
// returns menu_id (0 = failure)
逻辑型 置启用 (菜单ID, 是否启用)
逻辑型 置选中 (菜单ID, 是否选中)      // checkbox / radio items
逻辑型 置显示 (窗口ID, 菜单ID数组)    // call inside 菜单事件回调; takes an 整数数组类
逻辑型 销毁 (菜单ID)                 // destroys the item and its children
```

---

## YAML Config Storage (`Jade.YAML.`)

Data files live in the `初始化` data directory (relative names, extension optional; `\ / .. :` path-traversal characters are rejected). Key paths use dots for nesting and `[N]` for array indices, e.g. `user.name`, `items[0]`.

| Method | Returns | Description |
|------|------|------|
| `写 (文件名, 键路径, 值)` | 逻辑型 | Parses as JSON → YAML fragment → plain text (`"42"` stores a number); missing paths are created |
| `写字符串 (文件名, 键路径, 值)` | 逻辑型 | Force plain-string storage |
| `读 (文件名, 键路径, 缓冲区大小)` | 文本型 | Read a value; the buffer auto-grows when too small (64MB cap); empty text on failure |
| `读字符串 (文件名, 键路径)` | 文本型 | Read as JSON text |
| `读全部 (文件名, 缓冲区大小)` | 文本型 | Whole file as JSON text |
| `是否存在 (文件名, 键路径)` | 逻辑型 | Key-path existence |
| `删除 (文件名, 键路径)` | 逻辑型 | Delete a mapping key or array element |
| `列出键 (文件名, 键路径, 缓冲区大小)` | 文本型 | JSON array of keys under the path; empty path = root |
| `取长度 (文件名, 键路径)` | 整数 | Mapping key count / array length; -2 = neither, -1 = IO error |
| `清空 (文件名)` | 逻辑型 | Reset the file to `{}` |
| `删除文件 (文件名)` | 逻辑型 | Delete the data file plus lock / temp files |

---

## JAPK App Packages (`Jade.应用包.`)

Encrypted / signed frontend bundles. **Return convention differs from other modules: 0 = success, negative = error code.**

| Method | Returns | Description |
|------|------|------|
| `设置公钥 (公钥字符串)` | 整数 | Base64 Ed25519 public key (44 chars); once set, only signed packages load — call before loading |
| `加载字节集 (应用包数据)` | 整数 | Load a JAPK from memory; error codes documented on the method (-5 bad signature, -6 identity mismatch, …) |
| `加载视窗文件资源 (应用包数据)` | 整数 | Load from an embedded VolDP file resource (-99 = resource-to-bytes failed) |
| `是否加载 ()` | 逻辑型 | Whether a JAPK is loaded |
| `获取签名 ()` | 文本型 | The loaded package's app_signature |
| `获取签名信息 ()` | 文本型 | Signature info JSON (signed packages only) |
| `卸载 ()` | 整数 | Clear the loaded state and free memory |

After loading, call `置协议服务目录 ("")` (empty root) to get a `JADE://<app signature>` address. The JAPK's app name / signature must match `初始化`.

---

## System Tools (`Jade.系统.`)

| Method | Returns | Description |
|------|------|------|
| `取剪贴板文本 (缓冲区长度)` / `置剪贴板文本 (文本内容)` | 文本型 / 逻辑型 | Clipboard read / write |
| `取定义路径 (名称, 缓冲区大小)` | 文本型 | Predefined paths, names in `路径常量` (home / appData / temp / desktop / downloads / logs …) |
| `取区域设置 ()` | 文本型 | System locale (BCP 47, e.g. zh-CN) |
| `取显示器信息 ()` | 文本型 | JSON array of displays (bounds / work_area / scale_factor / is_primary) |
| `取鼠标坐标 ()` | 位置类 | Cursor screen position (横向位置 / 纵向位置) |
| `是否为Win11 ()` | 逻辑型 | Windows 11 check (gates Mica availability) |
| `取文件图标 (路径, 尺寸, 窗口ID, 过期秒数)` | 文本型 | Extract any file / folder icon as PNG, registered as a jade:// resource URL |
| `注册协议 (协议名)` / `注销协议 (协议名)` | 逻辑型 | Custom URL scheme (e.g. `myapp://`) |
| `注册文件关联 (扩展名, 友好名称)` / `注销文件关联 (扩展名)` | 逻辑型 | File-extension associations |
| `置开机自启 (启用, 启动参数)` / `是否开机自启 ()` | 逻辑型 | Registry Run entry |
| `打印页面 (窗口ID)` | 整数 | WebView built-in print dialog |
| `打印文件 (文件路径)` | 逻辑型 | Print a local file via the associated program |
| `获取打印机列表 ()` | 文本数组类 | System printer names |
| `智能转码 (数据, 目标编码, 缓冲区大小)` | 字节集类 | Detect and convert encodings (UTF-8 / GBK / Big5 / Shift_JIS / EUC-KR / windows-1252) |
| `取网络时间戳 (NTP服务器)` | 长整数 | NTP UTC milliseconds, independent of the local clock; empty = built-in server list; -1 on failure |
| `清空数据目录 (确认令牌)` | 逻辑型 | Wipe the data directory (requires the confirmation token) |
| `取文本并释放 (数据指针)` | 文本型 | Copy a UTF-8 pointer from the underlying library into VolDP text and free it (low-level interop) |

---

## JSON Handling

The module bundles an nlohmann/json wrapper for parsing IPC payloads and building replies and event data.

| Class | Purpose |
|------|------|
| `json_object` | JSON objects: `创建自文本` / `取文本` / `取整数` / `取小数` / `取逻辑` / `取对象` / `取数组` (key name or `/a/b` JSON Pointer); `置文本` / `置整数` … writes; `成员是否存在` / `删除成员` / `到文本` |
| `json_array` | JSON arrays: index reads/writes, `追加文本` / `追加整数` …, `枚举循环` + `取枚举值 / 取枚举对象 / 取枚举数组` |
| `json_value` | Arbitrary JSON values: `到文本` / `到整数` / `到小数` / `到逻辑` / `取类型` (codes in the `json_type` constant class) |
| `json_basic` | Base of the above: `创建自文本` / `到文本` / `到可读文本` / `取最后错误` / `取指针值` (JSON Pointer) |

```wsv
变量 数据解构 <类型 = json_object>
如果真 (数据解构.创建自文本 (数据))
{
    变量 名字 <类型 = 文本型>
    名字 = 数据解构.取文本 ("user.name", "")        // "/user/name" JSON Pointer also works

    变量 应答 <类型 = json_object>
    应答.置逻辑 ("success", 真)
    应答.置文本 ("echo", 名字)
    返回 (应答.到文本 ())
}
```

---

## Constant Classes

Every fixed-value parameter has a constant class — no raw strings / numbers:

| Constant class | Values | Used for |
|------|------|------|
| `窗口主题` | `.浅色` / `.深色` / `.跟随系统` | Window theme |
| `窗口边框样式` | `.普通窗口` / `.无标题栏` / `.无边框` / `.标题覆盖` | Frame style (标题覆盖 = Windows-only, built-in control buttons) |
| `窗口材质` | `.云母` / `.云母亚色` / `.亚克力` / `.无` | Win11 DWM backdrop |
| `窗口层级` | `.置顶` / `.普通` / `.置底` / `.贴桌面` | Window level |
| `提示框类型` | `.无图标` / `.信息` / `.警告` / `.错误` / `.询问` | Message-box icon |
| `进度条状态类型` | `.无进度` / `.正常` / `.暂停` / `.错误` / `.不确定` | Taskbar progress state |
| `托盘菜单项类型` | `.普通项` / `.子菜单` / `.分隔线` / `.分组` | Tray menus |
| `托盘事件类型` | `.鼠标进入` / `.鼠标离开` / `.左键点击` / `.右键点击` / `.双击左键` | `托盘交互事件` event types |
| `托盘菜单项类型文本` | `.普通项` / `.子菜单` / `.分隔线` / `.分组` | `托盘菜单命令事件` item types |
| `菜单类型` | `.命令` / `.复选框` / `.单选` / `.分隔线` / `.子菜单` / `.默认菜单项` | Context-menu item kinds |
| `原生菜单项` | `.后退` / `.前进` / `.刷新` / `.复制` / `.粘贴` / `.全选` / `.检查元素` … | WebView2 native item names (with `菜单类型.默认菜单项`) |
| `右键菜单场景` | `.页面` / `.选中文本` / `.图片` / `.视频` / `.音频` | `菜单事件回调` scenes |
| `热键功能键` | `.Alt` / `.Control` / `.Shift` / `.Win` | Hotkey modifiers (combine with `位或`) |
| `路径常量` | `.用户主目录` / `.应用数据目录` / `.临时目录` / `.系统桌面` / `.下载目录` / `.应用日志目录` … | `取定义路径` |
| `对话框属性` | `.允许选择文件` / `.允许选择文件夹` / `.允许多选` / `.显示隐藏文件` … | File-dialog properties |
| `文件拖放事件类型` | `.进入` / `.移动` / `.放下` / `.离开` | `文件拖放` event data types |
| `崩溃代码类型` | `.访问冲突` / `.栈溢出` / `.运行时崩溃` / `.渲染进程退出` … | `程序崩溃回调` crash codes |
| `json_type` | `.空` / `.对象` / `.数组` / `.文本` / `.整数值` / `.小数值` / `.逻辑` … | JSON value type codes |
| `订阅_窗口事件` / `订阅_视图事件` / `订阅_通知事件` / `订阅_系统事件` | event-name text constants | `订阅事件` / `注销订阅事件` |
