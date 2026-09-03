---
order: 3
---

# 高级用法

## IPC 双向通信

### Go → 前端

宿主用 `SendIPCMessage` 推送，前端 `jade.on` 接收：

```go
// Go 端
jadeview.SendIPCMessage(windowID, "update-data", `{"count":42}`)
```

```javascript
// 前端 JS
jade.on("update-data", (data) => {
    console.log(data.count); // 42
});
```

### 前端 → Go

前端 `jade.invoke()`，Go 端 `RegisterIPCHandler` 接收，返回字符串即应答：

```go
// Go 端
jadeview.RegisterIPCHandler("get-user", func(windowID uint32, payload string) string {
    return `{"name":"张三","age":30}` // 返回 JSON 字符串
})
```

```javascript
// 前端 JS
const user = await jade.invoke("get-user", "some-payload");
console.log(user.name); // "张三"
```

:::warning
**槽位规划**：`On` 与 `RegisterIPCHandler` 共享 64 个槽位，且 IPC handler 注册后无法注销、永久占用。通道多时建议合并为一个「总线」通道，在 payload 里区分子命令。
:::

## 前端资源加载三方案

生产应用通常不加载在线 URL，而是随程序分发前端资源。三种方式（完整代码见[示例](./examples)）：

| 方案 | 方式 | 适用场景 |
|------|------|----------|
| **JAPK 内存加载** | `go:embed` 打包 `.japk`，`LoadFromBytes` 内存加载，再以**空路径**调 `SetProtocolServicePath("", false)` 切内存模式 | 加密/混淆分发（推荐） |
| **协议服务挂目录** | `SetProtocolServicePath("web目录", true)`，hotReload 改文件即时刷新 | 开发调试 |
| **进程内回环 HTTP** | `net/http` 监听 127.0.0.1 随机端口直出 `embed.FS` | 单文件分发（不想用 JAPK 时） |

三种方式返回/构造的 URL 都直接传给 `CreateWindow` 导航。

### 跨域与 IPC 风险

用**在线或本地 http(s) URL**（如回环 HTTP、任意线上页面）加载页面时，页面源与库不同源，IPC 通讯（`jade.invoke` / postMessage）可能被跨域限制拦截。`WebViewSettings.CORSWhitelist` / `PostMessageWhitelist` 可设白名单，但库**没有接口能查到它注册的临时域**，无法精确加白。

规避方式：

- **优先选 jade:// 同源方案**（协议服务 / JAPK）；
- 必须用 http(s) 时，`PostMessageWhitelist: "*"` 兜底。

## JAPK 资源包详解

JAPK 是 JadeView 的前端资源打包格式，分两种：

- **混淆包**（JPKBIN02）：无需公钥，直接 `LoadFromBytes` 加载；
- **签名包**（v2）：须先 `SetPublicKey` 设置 Base64 Ed25519 公钥（44 字符）再加载，且严格校验 app_name / app_signature 与 `Init` 一致。

内存加载完整流程：

```go
//go:embed app.japk
var appJAPK []byte

jadeview.On(jadeview.EventJapkLoadFailed, func(windowID uint32, data string) string {
    fmt.Println("[JAPK] 加载失败:", data) // 错误详情经此事件回报
    return ""
})

// app-ready 回调中：
if rc := jadeview.LoadFromBytes(appJAPK); rc != 0 {
    fmt.Println("LoadFromBytes 失败:", rc) // 0=成功，负数=错误码
    jadeview.Exit()
    return ""
}
// 空路径 = 服务 LoadFromBytes 加载的内存资源包（传目录路径反而会走文件系统模式）
url, ok := jadeview.SetProtocolServicePath("", false)
if !ok {
    jadeview.Exit()
    return ""
}
// url 形如 JADE://com.example.myapp —— app_signature 就是主机名，直接建窗
jadeview.CreateWindow(url, 0, &opts, &settings)
```

:::info
`Init` 的 `appSignature` 建议用反域名格式（如 `com.example.myapp`），它会成为 `JADE://` URL 的主机名。
:::

## 平台自适应（PreloadJS 注入环境）

用 `PreloadJS` 在页面脚本运行前注入环境信息，前端同步读取做适配（如 Windows 11 才启用材质）：

```go
win11 := jadeview.IsWindows11()

settings := jadeview.DefaultWebViewSettings()
settings.PreloadJS = fmt.Sprintf(
    "window.__JV_ENV={arch:%q,win11:%v};",
    runtime.GOARCH, win11)

opts := jadeview.DefaultWindowOptions()
opts.FrameStyle = jadeview.FrameStyle.TitleOverlay // 库内置右上角控制按钮
if win11 {
    opts.Transparent = true // 材质需要透明底
} else {
    opts.BackgroundColor = "#F3F3F3FF"
}

winID := jadeview.CreateWindow(url, 0, &opts, &settings)
if win11 {
    jadeview.SetBackdrop(winID, jadeview.Backdrop.Mica)
}
```

```javascript
// 前端同步读取（页面脚本运行前已注入）
const ENV = Object.assign({ win11: true }, window.__JV_ENV);
if (!ENV.win11) {
    // 禁用材质选项，退回纯色
}
```

## 全局热键

```go
// 注册（modifiers/vk 为 Win32 风格数值：MOD_CONTROL=0x2, MOD_ALT=0x1 等）
hotkeyID := jadeview.RegisterGlobalHotkey(0x2|0x1, 'K') // Ctrl+Alt+K

jadeview.On(jadeview.EventGlobalHotkey, func(windowID uint32, data string) string {
    fmt.Println("热键触发:", data) // data 含 hotkey_id
    jadeview.SetFocus(mainWinID)
    return ""
})

// 注销
jadeview.UnregisterGlobalHotkey(hotkeyID)
```

## YAML 配置持久化

存于 `Init` 的数据目录，须在 `app-ready` 之后调用：

```go
jadeview.YAMLSet("settings.yaml", "ui.theme", "dark")
jadeview.YAMLSet("settings.yaml", "ui.langs", `["zh-CN","en"]`) // JSON 自动解析

theme, ok := jadeview.YAMLGet("settings.yaml", "ui.theme") // `"dark"`（JSON 字符串）
all, _ := jadeview.YAMLGetAll("settings.yaml")             // 整个文件转 JSON
```

## 窗口材质（Windows 11）

```go
opts := jadeview.DefaultWindowOptions()
opts.Transparent = true // 必须启用透明，且页面背景也要透明

winID := jadeview.CreateWindow(url, 0, &opts, nil)

if jadeview.IsWindows11() {
    jadeview.SetBackdrop(winID, jadeview.Backdrop.Mica)    // 云母（推荐）
    // jadeview.SetBackdrop(winID, jadeview.Backdrop.MicaAlt) // 云母变体
    // jadeview.SetBackdrop(winID, jadeview.Backdrop.Acrylic) // 亚克力毛玻璃
} else {
    jadeview.SetBackgroundColor(winID, "#F3F3F3FF") // 非 Win11 退回纯色
}
```

## 应用打包与分发

### 单 exe 自包含

DLL 已 `go:embed` 内置，**无需任何打包工具**：

```powershell
go build -ldflags "-H windowsgui" -o myapp.exe .
```

- 首次运行 DLL 自动释放到 `%TEMP%\jadeview\` 内容寻址目录（按 sha256 校验，多版本并存安全）；
- exe 同目录若放 `JadeView.dll` 则优先使用；
- 交叉编译 386 / arm64 只需换 `GOARCH`，任何机器都能构建；
- 个别杀软对「释放 DLL 并加载」有启发式告警，属正常，可引导用户加白。若 DLL 加载被拦截，首次 API 调用会 panic——在启动早期调 `Preload()` 探测并优雅提示：

```go
if err := jadeview.Preload(); err != nil {
    // 弹系统提示 / 写日志后退出，避免后续 panic
}
```

### 无边框窗口拖动区

无边框 / 无标题栏窗口用 HTML 布尔属性 `jade-region-drag` 标记拖动区、`jade-region-no-drag` 排除内部交互元素（运行时自动注入，无需引入脚本）。
