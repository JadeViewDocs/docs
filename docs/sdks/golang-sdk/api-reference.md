---
order: 2
---

# API 参考

SDK 为纯 Go 实现（syscall 直调，无 CGO）。所有 API 都在单个包 `jadeview` 下。

## 核心函数

### `jadeview.Init()`

初始化 JadeView 应用。必须先通过 `jadeview.On(jadeview.EventAppReady, handler)` 注册就绪回调，再调用此函数。

```go
jadeview.Init(
    enableDevmod bool,     // 是否启用开发者工具
    logPath string,        // 日志文件路径（可空字符串）
    dataDir string,        // 数据根目录（可空字符串）
    appName string,        // 应用显示名称，必填、非纯空白
    appSignature string,   // 应用唯一标识，trim 后 ≥6 个 Unicode 字符；
                           // 建议反域名格式（如 com.example.myapp）——
                           // JAPK 模式下它会成为 JADE:// URL 的主机名
    singleInstance bool,   // 是否单实例模式
) bool
```

返回 `true` 表示成功。注意：仍应在 `app-ready` 回调里判断 `windowID == 1` 才算初始化成功（0 = 失败，`data` 为错误描述）。

### `jadeview.RunMessageLoop()`

启动消息循环（阻塞当前 goroutine），在 `Init()` 之后调用。

### `jadeview.Exit()`

清理所有窗口并结束消息循环。通常在 `window-all-closed` 事件回调中调用。

### `jadeview.Version()`

返回 JadeView 版本字符串。

### `jadeview.Preload()`

提前释放并加载内置 DLL，返回 error。加载失败时首次 API 调用会 panic——需要优雅降级的宿主应在启动早期调用它探测。

---

## 窗口创建

### `CreateWindow()`

创建标准 WebView 窗口。

```go
jadeview.CreateWindow(
    url string,                    // 初始地址（http(s):// 或 jade:// 等自定义协议）
    parentID uint32,               // 父窗口 ID，0 = 顶级窗口
    opts *jadeview.WindowOptions,  // 窗口选项，nil = DefaultWindowOptions()
    settings *jadeview.WebViewSettings, // WebView 设置，nil = 库内部默认
) uint32  // window_id（>0 成功，0 失败）
```

### `WindowOptions` 字段

用 `jadeview.DefaultWindowOptions()` 取常用默认值（1024×768、可调大小、居中、聚焦），再改需要的字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `Title` | string | 窗口标题 |
| `Width` / `Height` | int | 尺寸（像素） |
| `Resizable` | bool | 是否可调整大小 |
| `FrameStyle` | string | 边框样式，见 `FrameStyle` 枚举 |
| `Transparent` | bool | 透明背景（使用 Mica 等材质时必须开启） |
| `BackgroundColor` | string | 背景色 `#RRGGBBAA` |
| `AlwaysOnTop` | bool | 窗口置顶 |
| `Theme` | string | 主题，见 `Theme` 枚举 |
| `Maximized` / `Maximizable` / `Minimizable` | bool | 最大化打开 / 允许最大化 / 允许最小化 |
| `X` / `Y` | int | 窗口位置，均为 -1 时居中 |
| `MinWidth` / `MinHeight` / `MaxWidth` / `MaxHeight` | int | 尺寸约束 |
| `Fullscreen` | bool | 全屏打开 |
| `Focus` | bool | 创建时获取焦点 |
| `HideWindow` | bool | 隐藏创建 |
| `UsePageIcon` | bool | 使用网页图标 |
| `ContentProtection` | bool | 防截屏 |
| `AutoSaveState` | bool | 自动记忆窗口位置 |
| `SkipTaskbar` | bool | 不在任务栏显示 |
| `NoActivate` | bool | 创建时不激活 |

### `WebViewSettings` 字段

用 `jadeview.DefaultWebViewSettings()` 取常用默认值（允许自动播放/右键/全屏/自动填充、创建即聚焦）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `Autoplay` | bool | 允许媒体自动播放 |
| `BackgroundThrottling` | bool | true = 禁用背景限速 |
| `AllowRightClick` | bool | 允许页面右键菜单 |
| `UserAgent` | string | 自定义 UA，空 = 默认 |
| `PreloadJS` | string | 页面脚本运行前注入的 JS |
| `AllowFullscreen` | bool | 允许页面全屏 API |
| `PostMessageWhitelist` | string | postMessage 白名单（单个域名） |
| `CORSWhitelist` | string | CORS 来源白名单（逗号分隔） |
| `Autofill` / `GeneralAutofillEnabled` | bool | 账密自动填充 / 通用表单填充 |
| `Incognito` | bool | 无痕模式 |
| `DisableClipboard` | bool | 禁用剪贴板权限 |
| `ProxyURL` | string | 代理，如 `http://host:port` / `socks5://host:port` |
| `Focused` | bool | 创建后 WebView 自动获取焦点 |

:::info
`CreateWindow` 的 `settings` 传 `nil` 表示交给库用内部默认值，与 `DefaultWebViewSettings()` 不保证逐项一致；需要在默认基础上只改个别项时从该函数出发即可。
:::

### `CreateBorderlessWindow()`

```go
jadeview.CreateBorderlessWindow(url string, settings *WebViewSettings) uint32
```

创建独立无边框 WebView 窗口。

---

## 窗口操作

### 基础操作

| 函数 | 说明 |
|------|------|
| `SetTitle(windowID, title)` | 设置窗口标题 |
| `SetSize(windowID, width, height)` | 设置窗口大小 |
| `SetPosition(windowID, x, y)` | 设置窗口位置 |
| `SetVisible(windowID, visible)` | 显示/隐藏窗口 |
| `SetFocus(windowID)` | 使窗口获取焦点 |
| `SetAlwaysOnTop(windowID, on)` | 设置窗口置顶 |
| `Close(windowID)` | 关闭窗口 |
| `Minimize(windowID)` | 最小化窗口 |
| `ToggleMaximize(windowID)` | 切换最大化/还原 |
| `SetFullscreen(windowID, fullscreen)` | 设置全屏 |
| `SetMinSize` / `SetMaxSize` | 尺寸约束 |
| `SetResizable(windowID, resizable)` | 允许/禁止调整大小 |
| `SetEnabled(windowID, enabled)` | 启用/禁用窗口交互 |
| `RequestRedraw(windowID)` | 请求重绘 |
| `WindowCount()` | 当前窗口数量 |

### 状态查询

| 函数 | 说明 |
|------|------|
| `IsMaximized` / `IsMinimized` / `IsVisible` / `IsFocused` / `IsFullscreen` | 布尔状态 |
| `GetWindowBounds(windowID)` | 窗口边界 JSON |
| `GetWebViewURL(windowID)` | 当前 WebView 地址 |
| `GetWindowHWND(windowID)` | 窗口原生句柄 |
| `GetWindowID(hwnd)` | 根据句柄反查窗口 ID（0 = 未找到） |

### 主题与外观

| 函数 | 说明 |
|------|------|
| `SetTheme(windowID, theme)` | 设置主题：`Theme.Light` / `Theme.Dark` / `Theme.System` |
| `GetTheme(windowID)` | 获取当前主题代码 |
| `SetBackdrop(windowID, backdropType)` | 窗口材质：`Backdrop.Mica` / `Backdrop.MicaAlt` / `Backdrop.Acrylic`（Windows 11） |
| `SetBackgroundColor(windowID, colorHex)` | 纯色底 `#RRGGBBAA` |
| `SetFrameStyle(windowID, frameStyle)` | 边框样式，见 `FrameStyle` 枚举 |
| `SetTitlebarOverlayStyle(windowID, height, iconColorHex, hoverBgHex)` | 标题栏覆盖层样式（height≤0 不改高度） |
| `SetLevel(windowID, level)` | 窗口层级，见 `WindowLevel` 枚举 |
| `SetSkipTaskbar` / `SetNoActivate` / `SetIgnoreCursorEvents` | 任务栏隐藏 / 不激活 / 鼠标穿透 |
| `SetContentProtection(windowID, on)` | 防截屏 |
| `SetWindowProgress(windowID, progress, state)` | 任务栏进度，state 见 `ProgressState` 枚举 |
| `FlashWindow(windowID, count)` | 任务栏闪烁 count 次 |

---

## WebView 操作

| 函数 | 说明 |
|------|------|
| `Navigate(windowID, url, headersJSON)` | 导航到指定 URL（可带自定义请求头 JSON） |
| `Reload(windowID)` | 重新加载当前页面 |
| `ExecuteJavaScript(windowID, script)` | 执行 JS，返回唯一 id；结果经 `javascript-result` 事件异步返回 |
| `SetZoom(windowID, level)` | 缩放级别（1.0 = 100%） |
| `OpenDevtools` / `CloseDevtools` / `IsDevtoolsOpen` | DevTools 控制 |
| `ClearBrowsingData(windowID)` | 清除浏览数据 |

---

## 事件与 IPC 通信

### `On()`

订阅事件。**事件名用库提供的 `Event*` 常量**，避免裸写字符串拼错。

```go
jadeview.On(
    event string,                  // 事件名（见下方事件常量表）
    handler jadeview.EventHandler, // func(windowID uint32, data string) string
) (uint32, bool)  // (callback_id, 是否成功)；callback_id 用于 Off
```

handler 返回非空字符串会作为响应回传给库；多数事件返回 `""` 即可。

### `Off()`

```go
jadeview.Off(event string, cbID uint32) bool
```

### `RegisterIPCHandler()`

注册 IPC 通道处理器，接收前端 `jade.invoke()` 调用；handler 的返回字符串就是应答内容。

```go
jadeview.RegisterIPCHandler(channel string, handler jadeview.EventHandler) bool
```

:::warning
**槽位上限**：`On` 与 `RegisterIPCHandler` **共享** `MaxEventHandlers` = 64 个槽位；IPC handler 无注销 API（上游头文件亦无），注册后**永久占用**一个槽位，规划通道数量时留意。
:::

### `SendIPCMessage()`

向指定窗口的前端发送 IPC 消息（前端通过 `jade.on(type, ...)` 接收）。

```go
jadeview.SendIPCMessage(windowID uint32, messageType, messageContent string) bool
```

### 事件常量（`Event*`）

#### 应用生命周期

| 常量 | 值 | 说明 |
|------|---|------|
| `EventAppReady` | `app-ready` | 应用初始化完成（回调里判断 windowID==1 才算成功） |
| `EventSecondInstance` | `second-instance` | 第二个实例启动（单实例模式） |
| `EventCrash` | `crash` | 程序崩溃（data 为 `Crash*` 错误代码常量） |

#### 窗口生命周期与状态

| 常量 | 值 | 说明 |
|------|---|------|
| `EventWindowCreated` | `window-created` | 窗口创建完成 |
| `EventWindowClosed` | `window-closed` | 窗口关闭 |
| `EventWindowDestroyed` | `window-destroyed` | 窗口销毁 |
| `EventWindowAllClosed` | `window-all-closed` | 所有窗口已关闭 |
| `EventWindowResized` / `EventWindowMoved` / `EventWindowBounds` | | 大小 / 位置 / 边界变化 |
| `EventWindowFocused` / `EventWindowBlurred` | | 获得 / 失去焦点 |
| `EventWindowStateChanged` | `window-state-changed` | 最大化/还原等状态变化 |
| `EventWindowFullscreen` | `window-fullscreen` | 全屏状态变化 |

#### WebView / 导航

| 常量 | 值 | 说明 |
|------|---|------|
| `EventWebViewDidStartLoading` | `webview-did-start-loading` | 开始加载 |
| `EventWebViewDidFinishLoad` | `webview-did-finish-load` | 加载完成 |
| `EventWebViewTitleUpdated` | `webview-page-title-updated` | 页面标题更新 |
| `EventWebViewFaviconUpdated` | `webview-page-favicon-updated` | 页面图标更新 |
| `EventWebViewDownloadCompleted` | `webview-download-completed` | 下载完成 |
| `EventJavascriptResult` | `javascript-result` | `ExecuteJavaScript` 的执行结果 |
| `EventPostMessageReceived` | `postmessage-received` | 收到前端 postMessage |
| `EventDragDrop` | `drag-drop` | 拖拽事件（enter/over/drop/leave） |

#### 托盘 / 通知 / 热键 / 其它

| 常量 | 值 | 说明 |
|------|---|------|
| `EventTrayEvent` / `EventTrayMenuCommand` | | 托盘图标交互 / 托盘菜单命令 |
| `EventNotificationShown` / `EventNotificationDismissed` / `EventNotificationFailed` / `EventNotificationAction` | | 通知生命周期与按钮点击 |
| `EventGlobalHotkey` | `global-hotkey` | 全局热键触发 |
| `EventThemeChanged` | `theme-changed` | 系统主题变化 |
| `EventMenuItemClicked` | `menu-item-clicked` | 右键菜单项点击 |
| `EventContextMenu` | `context-menu` | 右键菜单（配合 `SetContextMenuItems`） |
| `EventJapkLoadFailed` | `japk-load-failed` | JAPK 资源包加载失败 |
| `EventUpdateWindowIcon` | `update-window-icon` | 更新窗口图标 |

---

## 对话框与通知

### 同步 API

```go
// 打开 / 保存文件对话框，返回结果 JSON（取消时通常为空/null）
jadeview.ShowOpenDialog(p jadeview.FileDialogParams) string
jadeview.ShowSaveDialog(p jadeview.FileDialogParams) string

// FileDialogParams 字段
type FileDialogParams struct {
    WindowID    uint32
    Title       string
    DefaultPath string
    ButtonLabel string
    Filters     string // JSON，如 `[{"name":"图片","extensions":["jpg","png"]}]`
    Properties  string // JSON 数组，元素见 DialogProp 枚举
}

// 消息框，返回结果 JSON（含点击的按钮索引）
jadeview.ShowMessageBox(p jadeview.MessageBoxParams) string

type MessageBoxParams struct {
    WindowID  uint32
    Title     string
    Message   string
    Detail    string
    Buttons   string // JSON 数组，如 `["确定","取消"]`
    DefaultID int
    CancelID  int
    Type      string // 见 MsgBoxType 枚举
}

// 错误框（简单模式）
jadeview.ShowErrorBox(windowID uint32, title, content string) bool
```

### 异步 API

异步版本函数名加 `Async`，结果通过回调返回，不阻塞消息处理：

```go
jadeview.ShowOpenDialogAsync(p FileDialogParams, handler DialogResultHandler) bool
jadeview.ShowSaveDialogAsync(p FileDialogParams, handler DialogResultHandler) bool
jadeview.ShowMessageBoxAsync(p MessageBoxParams, handler DialogResultHandler) bool

// type DialogResultHandler func(result string)  // result 为结果 JSON
```

同时在途的异步对话框上限为 `MaxAsyncDialogs` = 16。

### 系统通知

```go
jadeview.ShowNotification(jadeview.NotificationParams{
    Summary: "通知标题",   // 必填
    Body:    "通知正文",
    Icon:    "",           // 图标文件绝对路径
    Timeout: -1,           // 毫秒，-1 = 系统默认
    Button1: "打开",       // 按钮（可选）
    Button2: "",
    Action:  "open",       // 经 notification-action 事件回传
})
```

---

## 系统托盘

```go
jadeview.TrayCreate() uint32                          // 创建托盘，返回 tray_id（0=失败）
jadeview.TrayDestroy(trayID) bool
jadeview.TraySetVisible(trayID, visible) bool
jadeview.TraySetTooltip(trayID, tooltip) bool
jadeview.TraySetIconFromFile(trayID, iconPath) bool   // 图标文件（.ico）
jadeview.TraySetIconFromData(trayID, data []byte) bool // 内存图标数据
jadeview.TraySetMenu(trayID, items []TrayMenuItem) bool // 扁平表；空切片=清除菜单
```

菜单项为扁平表，用 `ParentKey` 指向父项的 `Key` 实现嵌套：

```go
items := []jadeview.TrayMenuItem{
    {Type: jadeview.TrayItem.Normal, Key: "show", Label: "显示窗口"},
    {Type: jadeview.TrayItem.Submenu, Key: "theme", Label: "主题"},
    {Type: jadeview.TrayItem.Normal, Key: "dark", Label: "暗色", ParentKey: "theme"},
    {Type: jadeview.TrayItem.Divider, Key: "sep1"},
    {Type: jadeview.TrayItem.Normal, Key: "quit", Label: "退出", Dangerous: true},
}
```

`Key` 需全表唯一且非空（分隔线也要唯一 key）；点击经 `EventTrayMenuCommand` 事件回报。

---

## 右键 / 上下文菜单

```go
jadeview.MenuItemCreate(label string, kind int, parentMenuID uint32, itemID int) uint32
// kind 见 MenuKind 枚举；itemID 点击时经 menu-item-clicked 事件回传
jadeview.MenuItemSetEnabled(menuID, enabled) bool
jadeview.MenuItemSetChecked(menuID, checked) bool
jadeview.MenuItemDestroy(menuID) bool
jadeview.SetContextMenuItems(windowID uint32, menuIDs []uint32) bool
// 在 context-menu 事件回调中调用，设置本次右键要显示的顶级菜单项
```

---

## YAML 配置存储

存于 `Init` 设置的数据目录下。int32 状态码：1=成功，0=路径/文件不存在，-1=IO 错误，-2=类型不匹配，-4=解析失败。

| 函数 | 说明 |
|------|------|
| `YAMLSet(fileName, keyPath, value)` | 写入（自动解析 JSON/YAML/纯文本） |
| `YAMLSetStr(fileName, keyPath, value)` | 强制按字符串存储 |
| `YAMLGet(fileName, keyPath)` | 读取，返回 (JSON 字符串, 是否成功) |
| `YAMLGetAll(fileName)` | 读取整个文件 |
| `YAMLKeys(fileName, keyPath)` | 列出路径下所有 key（JSON 数组） |
| `YAMLHas(fileName, keyPath)` | 路径是否存在 |
| `YAMLDelete(fileName, keyPath)` | 删除指定路径 |
| `YAMLLen(fileName, keyPath)` | 数组长度 / 对象 key 数 |
| `YAMLClear(fileName)` | 清空文件 |
| `YAMLDeleteFile(fileName)` | 删除文件 |

---

## JAPK 资源包

前端资源加密/签名打包，加载后通过 `jade://` 协议访问。**返回值约定与其它模块不同：0=成功，负数=错误码。**

| 函数 | 说明 |
|------|------|
| `SetPublicKey(publicKey)` | 设置 Base64 Ed25519 公钥（44 字符），须在 `LoadFromBytes` 之前；仅签名包需要 |
| `LoadFromBytes(data []byte)` | 从内存加载 JAPK（未设公钥时仅支持混淆包）；错误详情也经 `japk-load-failed` 事件回报 |
| `IsLoaded()` | JAPK 是否已加载 |
| `GetAppSignature()` | 当前 app_signature |
| `GetSignatureInfo()` | 签名信息 JSON |
| `Unload()` | 清除加载状态 |

JAPK 的 app_name / app_signature 必须与 `Init` 一致。加载后的访问方式见下方 `SetProtocolServicePath`。

---

## 系统工具

### 协议服务（本地资源服务器）

```go
jadeview.SetProtocolServicePath(rootPath string, hotReload bool) (string, bool)
```

返回可直接建窗导航的 URL。`rootPath` 三种取值：

| rootPath | 模式 | 说明 |
|----------|------|------|
| 磁盘目录路径 | 文件系统模式 | 服务该目录；`hotReload` 仅此模式有效（改文件即时刷新页面） |
| `.japk` 文件路径 | 磁盘 JAPK | 挂载磁盘上的 JAPK 资源包 |
| 空字符串 `""` | 内存 JAPK | 服务 `LoadFromBytes` 已加载的资源包，返回 URL 形如 `JADE://<app_signature>` |

### 安全资源

| 函数 | 说明 |
|------|------|
| `RegisterResource(path, windowID, ttlSeconds)` | 注册本地文件为安全资源，返回 jade:// URL（windowID=0 全局，ttl=0 永不过期） |
| `UnregisterResource(tokenOrURL)` | 注销资源 |
| `ClearWindowResources(windowID)` | 清理窗口的全部资源，返回数量 |
| `GetFileIcon(path, size, windowID, ttlSeconds)` | 提取文件图标为 PNG 资源，返回 URL |

### 其它工具

| 函数 | 说明 |
|------|------|
| `ClipboardReadText()` / `ClipboardWriteText(text)` | 剪贴板读写 |
| `GetPath(name)` | 系统路径：home / appData / temp / desktop / documents / downloads 等 |
| `GetLocale()` | 系统语言（BCP 47，如 zh-CN） |
| `GetDisplaysInfo()` | 显示器信息 JSON 数组 |
| `GetCursorPosition()` | 光标位置 JSON |
| `GetWebViewVersion()` | WebView 内核版本 |
| `IsWindows11()` | 是否 Windows 11 |
| `RegisterGlobalHotkey(modifiers, vk)` | 注册全局热键，返回 hotkey_id；触发经 `global-hotkey` 事件 |
| `UnregisterGlobalHotkey(hotkeyID)` | 注销热键 |
| `SetLoginAutostart(enable, args)` / `GetLoginAutostart()` | 开机自启 |
| `RegisterURLScheme` / `UnregisterURLScheme` | 自定义协议注册 |
| `RegisterFileAssociation` / `UnregisterFileAssociation` | 文件关联 |
| `Print(windowID)` / `PrintFile(filePath)` / `GetPrinterList()` | 打印 |
| `SmartConvertEncoding(input, targetEncoding)` | 智能检测编码并转换，targetEncoding 见 `Encoding` 枚举 |
| `NTPNow(server)` | NTP 网络时间戳（UTC 毫秒；server 空 = 内置服务器列表；失败 -1） |
| `ClearDataDirectory(confirmToken)` | 清空数据目录（token 必须为 `I_UNDERSTAND_CLEAR_DATA`） |

---

## 枚举命名空间

固定取值的参数都有二级命名空间枚举，不必裸写字符串/数字：

| 枚举 | 取值 | 用途 |
|------|------|------|
| `Theme` | `.Light` / `.Dark` / `.System` | 窗口主题 |
| `FrameStyle` | `.Normal` / `.NoTitlebar` / `.Borderless` / `.TitleOverlay` | 边框样式 |
| `WindowLevel` | `.Topmost` / `.Normal` / `.Bottom` / `.Desktop` | 窗口层级 |
| `Backdrop` | `.Mica` / `.MicaAlt` / `.Acrylic` | 窗口材质（Win11） |
| `MsgBoxType` | `.None` / `.Info` / `.Warning` / `.Error` / `.Question` | 消息框类型 |
| `ProgressState` | `.None` / `.Normal` / `.Paused` / `.Error` / `.Indeterminate` | 任务栏进度状态 |
| `TrayItem` | `.Normal` / `.Submenu` / `.Divider` / `.Group` | 托盘菜单项类型 |
| `MenuKind` | `.Normal` / `.Separator` / `.Checkbox` / `.Radio` / `.Submenu` | 右键菜单项类型 |
| `DialogProp` | `.OpenFile` / `.OpenDirectory` / `.MultiSelections` / `.ShowHiddenFiles` / `.PromptToCreate` | 文件对话框属性 |
| `Encoding` | `.UTF8` / `.GBK` / `.GB18030` / `.Big5` / `.ShiftJIS` / `.EUCKR` / `.Latin1` | 编码转换目标 |

示例：`jadeview.Theme.Dark`、`jadeview.FrameStyle.TitleOverlay`、`jadeview.Backdrop.Mica`。
