---
title: 事件类型
order: 1
group:
  title: 通信与事件
  order: 3
---

# 事件类型

本页列出主进程通过 **`jade_on`** 订阅后，库可能派发的事件：**`event_data` 一般是 UTF-8 的 JSON 字符串**（少数为纯文本，如 `app-ready` 失败时的错误描述、`crash` 的错误代码）。`jade_on` 回调的第一个参数 **`window_id`** 标明是哪个窗口（与具体事件无关的全局事件多为 `0`，以各节为准）。

**`IpcCallback` 的返回值**在「拦截类」事件与 **`register_ipc_handler`** 中含义不同，务必先看下文 **速查表**。[IPC 通信 API](/docs/api/ipc-api) 中有与 `jade.invoke` 配套的补充说明。

:::info
**回调派发线程**：**通知类事件**（如各 `window-*`、`notification-*`、`theme-changed` 等）经库内 worker 线程池**异步**派发，回调不在 GUI 线程上执行，可放心做较重的处理；**拦截类事件**（`window-closing`、`webview-will-navigate`、`webview-new-window`、`webview-download-started`、`drag-drop` 的 `enter`/`drop`）在 GUI 线程**内联同步**调用，库会即时读取返回值决定放行/阻止，**务必尽快返回、不要阻塞**。
:::

---

<h2 id="ipc-callback-returns">回调返回值速查（`IpcCallback`）</h2>

类型是 **`const char*`**，但多数场景把它当**哨兵**用，不必指向真实字符串。

### 事件订阅回调：需要「阻止」时（`jade_on`）

对 **`window-closing`**、**`webview-will-navigate`**、**`webview-new-window`**：

- 返回 **`NULL`**：**不阻止**（允许关窗 / 导航 / 新开窗口）。
- 返回 **指针值 `1`**（推荐写法 **`return (const char*)(uintptr_t)1;`**）：**阻止**。实现上**任意非 `NULL` 都算阻止**，用 `1` 可避免误把栈上字符串当哨兵。

对 **`webview-download-started`**（默认**拦下载**）：

- 返回 **`NULL`**：**允许**本次下载。
- 返回 **指针值 `1` 或其它非 `NULL`**：**继续拦截**（不允许下载）。

对 **`drag-drop`**（2.3 新增同步拦截，仅 `enter` / `drop` 子类型）：

- 返回 **`NULL`**：放行（`enter`）/ 走默认逻辑（`drop`）。
- 返回 **非 `NULL`**：拒绝拖入（`enter`）/ 表示主进程已消费（`drop`）。详见 [`drag-drop` · 同步拦截](#同步拦截23)。

### 调用处理器场景：例外（`register_ipc_handler` / `jade.invoke`）

这里 **`(const char*)1` 不是「阻止」**：与 **`NULL`** 等一起被当成**特殊占位**，库映射为**默认成功 JSON**，且**不会** `jade_text_free`。自定义应答正文须用 **`jade_text_create`** 分配并由库释放。详见 [IPC 通信 API](/docs/api/ipc-api)。

---

## `app-ready` 事件

:::warning
v2.2 修改。
:::

JadeView 初始化完成后触发。所有窗口创建、API 调用都必须在收到此事件之后进行，在此之前调用会返回 `0`（失败）。

成功与失败的 `event_data` **格式不同**（成功是 JSON、失败是纯文本），**判定成功应只看 `window_id == 1`**，不要靠解析 `event_data`：

| 场景 | `window_id` | `event_data` |
|------|-------------|-------------|
| 初始化成功 | `1` | JSON：`{"ok":true,"message":"success"}` |
| 初始化参数校验失败 | `0` | 纯文本 `"<code>: <message>"`，如 `"missing_app_name: app_name must be non-null and valid UTF-8"`；`code` 取值为 `missing_app_name` / `missing_app_signature` / `app_signature_too_short` |

主进程判断方式：**只看 `window_id`** —— `window_id === 1` 表示成功，`window_id === 0` 表示失败。

---

## 窗口事件

### `window-created`

窗口创建完成。

- **`event_data`**：`{}`
- **`window_id`**：新建窗口的 id

---

### `window-closed`

窗口已关闭。

- **`event_data`**：`{}`
- **`window_id`**：已关闭窗口的 id

---

### `window-all-closed`

所有窗口都关了。

- **`event_data`**：`{}`
- **`window_id`**：`0`

---

### `window-closing`

用户点关闭，**尚未销毁**。可通过回调返回值 [拦截](#事件订阅回调需要阻止时jade_on)。

- **`event_data`**：`{}`
- **`window_id`**：即将关闭窗口的 id

---

### `window-resized`

窗口尺寸变化。

- **`event_data`**：`{"width": 整数, "height": 整数}`
- **`window_id`**：目标窗口的 id

---

### `window-state-changed`

窗口最大化状态变化。

- **`event_data`**：`{"isMaximized": true/false}`
- **`window_id`**：目标窗口的 id

---

### `window-fullscreen`

窗口全屏状态变化。

- **`event_data`**：`{"fullscreen": true/false}`
- **`window_id`**：目标窗口的 id

---

### `window-moved`

窗口位置变化。

- **`event_data`**：`{"x": 整数, "y": 整数}`
- **`window_id`**：目标窗口的 id

---

### `window-focused` / `window-blurred`

窗口得到或失去键盘焦点。

- **`event_data`**：`{}`
- **`window_id`**：目标窗口的 id

---

### `window-destroyed`

窗口销毁。

- **`event_data`**：`{}`
- **`window_id`**：已销毁窗口的 id

---

### `window-bounds`

主进程查询窗口位置与尺寸（`get_window_bounds`）后，结果以本事件回报。

- **`event_data`**：`{"x": 整数, "y": 整数, "width": 整数, "height": 整数}`
- **`window_id`**：目标窗口的 id

---

## WebView 与页面事件

### `webview-will-navigate`

即将导航到新 URL。可通过回调返回值 [拦截](#事件订阅回调需要阻止时jade_on)。

- **`event_data`**：`{"url": "...", "window_id": 整数}`
- **`window_id`**：目标窗口的 id

---

### `webview-did-start-loading`

页面开始加载。

- **`event_data`**：`{"url": "...", "window_id": 整数}`
- **`window_id`**：目标窗口的 id

---

### `webview-did-finish-load`

页面加载完成。

- **`event_data`**：`{"url": "...", "window_id": 整数}`
- **`window_id`**：目标窗口的 id

---

### `webview-new-window`

页面请求新窗口。可通过回调返回值 [拦截](#事件订阅回调需要阻止时jade_on)。

- **`event_data`**：`{"url": "...", "frame_name": "_blank"}` 等
- **`window_id`**：来源窗口的 id

---

### `webview-page-title-updated`

页面标题变化。

- **`event_data`**：`{"title": "...", "window_id": 整数}`
- **`window_id`**：目标窗口的 id

---

### `webview-page-favicon-updated`

页面图标（favicon）变化。

- **`event_data`**：`{"favicon": "<url>"}`
- **`window_id`**：目标窗口的 id

---

### `webview-download-started`

开始下载。**默认拦截**，需在回调中返回 `NULL` 才允许下载，见 [回调返回值速查](#ipc-callback-returns)。

- **`event_data`**：`{"url": "...", "filename": "..."}`
- **`window_id`**：目标窗口的 id

---

### `webview-download-completed`

:::warning
v2.2 开始支持。
:::

下载完成时触发（无论成功或失败）。

- **`event_data`**：JSON，含下载结果信息
- **`window_id`**：目标窗口的 id

---

### `file-drop`

:::warning
v2.2 起废弃。
:::
> **⚠️ 2.2起，此事件已移除，请迁移到 [`drag-drop`](#drag-drop-22-新增替换-file-drop) 事件并检查 `type == "drag-drop"`。

文件拖入 WebView 时触发。注册后会接管拖拽，渲染进程可能收不到原生 drop 事件。

- **`event_data`**：`{"files": ["路径1", ...], "x": 整数, "y": 整数}`
- **`window_id`**：目标窗口的 id


---

### `drag-drop`

:::warning
v2.2 开始支持，替换 `file-drop`。
:::

拖拽生命周期事件，覆盖完整的拖拽流程（进入、移动、放下、离开），类似 Tauri 的 `onDragDropEvent`。

原 `file-drop` 事件仅在文件放下时触发，2.2 起替换为统一的 `drag-drop` 事件。

```c
jade_on("drag-drop", my_callback);
```

`event_data` 为 JSON，通过 `type` 字段区分事件类型：

| type | 说明 | 附加字段 |
|------|------|----------|
| `enter` | 拖拽进入窗口 | `paths`, `x`, `y` |
| `over` | 拖拽在窗口上方移动 | `x`, `y` |
| `drop` | 文件放下 | `paths`, `x`, `y` |
| `leave` | 拖拽离开窗口 | 无 |

**各类型 event_data 示例：**

```json
// enter — 拖拽进入窗口
{"type": "enter", "paths": ["C:\\Users\\test\\file.txt"], "x": 100, "y": 200}

// over — 拖拽在窗口上方移动
{"type": "over", "x": 150, "y": 210}

// drop — 文件放下
{"type": "drop", "paths": ["C:\\Users\\test\\file.txt"], "x": 150, "y": 210}

// leave — 拖拽离开窗口
{"type": "leave"}
```

#### 同步拦截（2.3）

:::warning
v2.3 开始支持。
:::

2.3 起，`drag-drop` 的回调对 `enter` 与 `drop` 支持**同步拦截**，通过 [`IpcCallback` 返回值](/docs/api/ipc-api#jade-on-callback-return) 控制：

| type | 返回值语义 |
|------|-----------|
| `enter` | 返回**非空指针** → **拒绝**本次拖拽（不进入）；返回 `NULL` → 放行。 |
| `drop` | 返回**非空指针** → 表示主进程**已处理/消费**该次放下；返回 `NULL` → 交由默认逻辑。 |
| `over` / `leave` | 保持**异步通知**，返回值被忽略。 |

- 推荐拦截/消费时返回 `(const char *)(uintptr_t)1`。
- **未注册回调时行为不变**，与旧版本兼容。

> **⚠️ 破坏性变更**：原 `file-drop` 事件已移除，请迁移到 `drag-drop` 事件并检查 `type == "drop"`。

---

### `javascript-result`

主进程调用 `execute_javascript` 在页面里执行结束后触发。

- **`event_data`**：JSON，通常含请求 **`id`** 与 **`result`**（脚本返回值或错误描述）
- **`window_id`**：目标窗口的 id
- **注意**：`execute_javascript` 的返回值只表示是否入队；**脚本结果只在本事件里取**

---

### `postmessage-received`

页面通过 `postMessage` 发送消息。**仅当来源通过白名单**时才会触发（见 [核心 API · WebViewSettings](/docs/api/index#webview-settings)）。

- **`event_data`**：`{"origin": "来源", "message": "字符串"}`
- **`window_id`**：目标窗口的 id

---

## 主题与其它

### `theme-changed`

系统或窗口主题变化。

- **`event_data`**：`{}`
- **`window_id`**：触发主题变化的窗口 id

---

### `update-window-icon`

需要刷新窗口图标。

- **`event_data`**：`{"window_id": 整数}`
- **`window_id`**：目标窗口的 id

---


## 通知相关事件

### `notification-shown`

通知成功显示。

- **`event_data`**：`title`、`body`、`text3` 等
- **`window_id`**：`0`

---

### `notification-dismissed`

用户关闭通知或超时。

- **`event_data`**：如 `{"reason": "dismissed"}`
- **`window_id`**：`0`

---

### `notification-failed`

通知显示失败。

- **`event_data`**：`error` 等
- **`window_id`**：`0`

---

### `notification-action`

用户点按钮或点通知卡片。

- **`event_data`**：`action`（`clicked` / `action_0` / `action_1`）、`title`（按钮文案）、`arguments`（来自 `NotificationParams.action`）
- **`window_id`**：`0`

---

## 全局系统事件

### `second-instance`

你开了**单实例**后，用户又双击启动了一次 exe。第二次进程会很快退出，但**第一次打开的进程**会收到本事件，里面带着**第二次启动时的完整命令行**。这样你可以打开同一个窗口、或解析 `myapp://` 链接。

**何时触发**：`JadeView_init` 里 `single_instance` 非 0，且判定为「第二个实例」时，由**首实例**在读到管道数据后发出。

- **`window_id`**：固定 `0`（和具体窗口无关）
- **`event_data`**：UTF-8 JSON，里有一个 **`argv`** 数组，即第二次进程的命令行参数列表

---

### `global-hotkey`

用户按下了你用 `register_global_hotkey` 注册的**全局快捷键**（即使焦点不在你的窗口上）。你在回调里根据 JSON 里的 id / 键码做相应逻辑。

- **`window_id`**：`0`
- **`event_data`**：JSON，一般含 **`id`**（注册时返回的热键 id）、**`modifiers`**、**`vk`**

平台差异：Windows、Linux/X11 均可用；**Linux/Wayland 下全局热键不可用**（协议限制），`register_global_hotkey` 返回 `0`。

---

### `tray-menu-command`

用户在托盘图标的**右键菜单里点了一个可点的项**（不是分隔线）。你用 JSON 里的 **`key`**（和 `TrayMenuItemDesc.key` 一致）区分是「退出」还是「设置」等。

- **`window_id`**：`0`
- **`event_data`**：含 `tray_id`、`key`、`item_id`、`dangerous`、`timestamp` 等，业务以 **`key`** 为准

---

### `tray-event`

用户在**托盘图标上**左键、右键、双击、鼠标移入移出等（**不是**点菜单里的某一行）。需要先 `jade_on("tray-event", ...)` 才会收到。为避免刷屏，**鼠标在图标上滑动**不会不停发事件。

- **`window_id`**：`0`
- **`event_data`**：JSON，含 `tray_id`、`event`（如 `left-click`、`enter`）、坐标、`timestamp` 等

---

### `japk-load-failed`

JAPK 资源包加载失败时触发（公钥未设置、签名校验失败、解包/读取出错等）。详见 [JAPK 资源包](/docs/api/japk)。

- **`window_id`**：`0`
- **`event_data`**：**纯文本**错误消息（非 JSON）

---

### `crash`

:::warning
v2.2 开始支持。
:::

程序崩溃时触发（SEH 异常、Rust Panic 或 WebView2 进程崩溃），`event_data` 为错误代码字符串，不泄露源码信息。

```c
jade_on("crash", my_callback);
```

- **`window_id`**：`0`
- **`event_data`**：错误代码字符串（非 JSON），头文件中提供 `JADEVIEW_CRASH_*` 宏定义

**SEH 异常（原生崩溃）：**

| 错误代码 | 异常代码 | 说明 |
|---------|---------|------|
| `SEH_ACCESS_VIOLATION` | 0xC0000005 | 内存访问违规 |
| `SEH_STACK_OVERFLOW` | 0xC00000FD | 栈溢出 |
| `SEH_ILLEGAL_INSTRUCTION` | 0xC000001D | 非法指令 |
| `SEH_INVALID_HANDLE` | 0xC0000008 | 无效句柄 |
| `SEH_UNKNOWN` | 其他 | 未知原生异常 |

**运行时异常：**

| 错误代码 | 说明 |
|---------|------|
| `RUNTIME_PANIC` | Rust 运行时 panic |

**WebView2 进程崩溃：**

| 错误代码 | 枚举值 | 说明 |
|---------|-------|------|
| `WV2_BROWSER_EXITED` | BROWSER_PROCESS_EXITED (0) | 浏览器进程已退出 |
| `WV2_RENDER_EXITED` | RENDER_PROCESS_EXITED (1) | 渲染进程已退出 |
| `WV2_RENDER_UNRESPONSIVE` | RENDER_PROCESS_UNRESPONSIVE (2) | 渲染进程无响应 |
| `WV2_FRAME_RENDER_EXITED` | FRAME_RENDER_PROCESS_EXITED (3) | 框架渲染进程已退出 |
| `WV2_UTILITY_EXITED` | UTILITY_PROCESS_EXITED (4) | 工具进程已退出 |
| `WV2_SANDBOX_HELPER_EXITED` | SANDBOX_HELPER_PROCESS_EXITED (5) | 沙箱辅助进程已退出 |
| `WV2_GPU_EXITED` | GPU_PROCESS_EXITED (6) | GPU进程已退出 |
| `WV2_PPAPI_PLUGIN_EXITED` | PPAPI_PLUGIN_PROCESS_EXITED (7) | PPAPI插件进程已退出 |
| `WV2_PPAPI_BROKER_EXITED` | PPAPI_BROKER_PROCESS_EXITED (8) | PPAPI代理进程已退出 |
| `WV2_UNKNOWN_EXITED` | UNKNOWN_PROCESS_EXITED (9) | 未知进程已退出 |

**崩溃捕获机制：**

初始化时自动安装崩溃捕获，无需手动调用：

- **SEH 异常捕获**：access violation、栈溢出、非法指令等原生崩溃
- **Panic Hook**：捕获 Rust panic，发送 `RUNTIME_PANIC` 错误代码
- **WebView2 进程崩溃监听**：通过 `ICoreWebView2.add_ProcessFailed` 监听渲染进程/浏览器进程崩溃
- **不泄露源码**：所有输出均为错误代码，不含源码路径、行号、函数名
- **自动通知主进程**：崩溃时通过 `crash` 事件通知主进程，`event_data` 为错误代码字符串
- **错误代码宏定义**：头文件中提供 `JADEVIEW_CRASH_*` 宏定义，主进程可直接使用

---

右键菜单相关事件（`context-menu`、`menu-item-clicked`）已移至 [右键菜单](/docs/api/context-menu-api) 独立文档。
