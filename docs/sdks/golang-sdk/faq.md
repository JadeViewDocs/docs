---
order: 5
---

# 常见问题

## 安装与环境

### Golang SDK 支持哪些操作系统？

**Windows 10 / 11**（amd64 / 386 / arm64）。Linux 支持计划随 JadeView 上游后续版本（2.4 / 2.5）提供；macOS 暂不支持。

### Go 版本要求是什么？

需要 **Go 1.23** 或更高版本。

### 需要装 C 编译器吗？

不需要。SDK 是**纯 Go 实现**（syscall 直调），DLL 已 `go:embed` 内置——无需 MinGW / MSYS2，无需设置 `CC` / `CGO_ENABLED`，也无需随程序分发 DLL。

### 需要安装 WebView2 Runtime 吗？

- **Windows 11**：已内置，无需额外安装
- **Windows 10**：需要安装 [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

### SDK 有额外的 Go 依赖吗？

没有，仅使用 Go 标准库。

### `go get @latest` 解析不到刚发布的版本？

官方 proxy 索引有几分钟延迟。稍候重试，或加 `GOPROXY=https://proxy.golang.org,direct` 显式拉取。

---

## 初始化与生命周期

### 为什么必须先注册事件再调用 Init()？

`Init()` 内部会触发 `app-ready` 事件。如果在 `Init()` 之后才注册监听器，将错过此事件，无法收到就绪通知。

### app-ready 回调里的 windowID 是什么意思？

它是初始化结果标志：**1 = 成功**，0 = 失败（此时 `data` 为错误描述）。`Init()` 返回 true 只代表调用被接受，最终结果以回调为准。

### Init 返回 false 的常见原因？

- `appSignature` 不足 6 个字符（trim 后按 Unicode 计）；
- 已有相同签名的实例在运行（单实例模式）；
- appName 为空/纯空白。

### appSignature 有格式要求吗？

至少 6 个 Unicode 字符。**建议反域名格式**（如 `com.example.myapp`）——JAPK 模式下它会成为 `JADE://` URL 的主机名。

### 为什么 RunMessageLoop() 会阻塞？

它是桌面应用的消息循环，所有窗口事件、用户交互都经它分发，阻塞到所有窗口关闭/`Exit()` 为止。收尾逻辑放在 `window-all-closed` 回调里。

---

## 事件与 IPC

### On 回调返回值有什么用？

返回非空字符串会作为响应回传给库（如 IPC 应答）；多数事件返回 `""` 即可。

### RegisterIPCHandler 和 On 有什么区别？

- `On()`：监听系统事件（窗口创建、关闭、主题变化等）
- `RegisterIPCHandler()`：注册 IPC 通道处理器，响应前端 `jade.invoke()` 调用，返回值就是应答内容

### 事件注册有上限吗？

有。`On` 与 `RegisterIPCHandler` **共享 64 个槽位**（`MaxEventHandlers`）。`On` 可用 `Off` 释放槽位，**IPC handler 无注销 API、永久占用**——通道多时合并成总线通道。

### 前端 jade.invoke 收不到应答 / IPC 被拦截？

大概率是**跨域**：页面用 http(s) URL 加载时与库不同源。优先改用协议服务 / JAPK（jade:// 同源）；无法改时设置 `WebViewSettings` 的 `PostMessageWhitelist: "*"` 兜底。详见[高级用法 - 跨域与 IPC 风险](./advanced#跨域与-ipc-风险)。

---

## 窗口与外观

### 如何创建无标题栏 / 无边框窗口？

设 `WindowOptions.FrameStyle`：

- `FrameStyle.TitleOverlay` —— 保留边框、无标题栏、库内置右上角控制按钮（推荐）
- `FrameStyle.NoTitlebar` —— 保留边框，需自绘标题栏
- `FrameStyle.Borderless` —— 完全无边框

### Mica / Acrylic 材质不生效？

- 只在 **Windows 11** 有效，先用 `IsWindows11()` 判断；
- 建窗时必须 `Transparent: true`，且页面背景也要透明；
- 非 Win11 用 `SetBackgroundColor` 纯色兜底。

### 无边框窗口怎么实现拖动？

页面元素加 HTML 布尔属性 `jade-region-drag` 即成拖动区，内部交互元素用 `jade-region-no-drag` 排除（运行时自动注入，无需引入脚本）。

---

## 平台相关

### 杀软报毒 / 拦截？

个别杀软对「释放 DLL 并加载」有启发式告警，属正常，可引导用户加白。若 DLL 加载被拦截，首次 API 调用会 panic——启动早期调 `Preload()` 探测错误并优雅提示。

### 打包成 GUI 版后看不到日志？

`-H windowsgui` 无控制台，`fmt.Printf` 看不到输出。调试用控制台版构建，或给 `Init` 传 `logPath` 落盘日志。

---

## 存储与资源

### YAML 什么时候能用？

YAML 等持久化 API 依赖 `Init` 的数据目录就绪，请在 **app-ready 之后**调用。

### 协议服务目录有什么禁忌？

站点目录**不要**与 `Init` 的数据目录相同或嵌套——库持续写数据会触发「写 → 热载刷新」死循环。

### SetProtocolServicePath 传空字符串是什么行为？

空字符串 `""` 是**内存 JAPK 模式**：服务 `LoadFromBytes` 已加载的资源包，返回 `JADE://<签名>` 形式的 URL（须先加载成功）。传目录路径则是文件系统模式，传 `.japk` 文件路径则挂载磁盘包。

### JAPK 加载失败怎么排查？

- `LoadFromBytes` 返回负数错误码，详情经 `EventJapkLoadFailed` 事件回报；
- 混淆包（JPKBIN02）不要调 `SetPublicKey`；签名包必须先设公钥；
- 打包时的 app_name / app_signature 须与 `Init` 一致。

---

## 版本信息

- **SDK 版本**：始终建议使用 `@latest`，各版本变更见 [GitHub Releases](https://github.com/luoxueyousheng/JadeViewGo/releases)
- **Go**：1.23+
