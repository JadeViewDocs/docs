---
title: 事件类型
order: 1
group:
  title: 通信与事件
  order: 3
---

# 事件类型

本页是**事件清单**：列出库可能派发的事件，以及各自的 `event_data` 形态。**`event_data` 一般是 UTF-8 的 JSON 字符串**（少数为纯文本，如 `app-ready` 失败时的错误描述、`crash` 的错误代码）。

订阅方式不在本页：按事件名用 [`jade_on`](/docs/v3api/event-subscription#jade-on)，按事件类型用 [`on_app_event` / `on_window_event` / `on_webview_event`](/docs/v3api/event-subscription)，均见 [事件订阅](/docs/v3api/event-subscription)。

命名事件回调的第一个参数是**事件真实来源 ID**：App 来源恒为 `0`，Window 事件用 Window ID，WebView 事件用 WebView ID；`app-ready` 是否成功须解析正文的 `ok:true`，不能用来源 ID 判断。

**`IpcCallback` 的返回值**在「拦截类」事件与 **`register_ipc_handler`** 中含义不同，务必先看下文 **速查表**。[IPC 通信 API](/docs/v3api/ipc-api) 中有与 `jade.invoke` 配套的补充说明。

:::info{title="回调线程"}
- **通知类事件**（`window-*`、`notification-*`、`theme-changed` 等）异步派发，可做较重的处理。
- **拦截类事件**（`window-closing`、`webview-will-navigate`、`webview-new-window`、`webview-download-started`、`drag-drop` 的 `enter`/`drop`）在 GUI 线程同步调用，库立即读取返回值决定放行或阻止，回调必须尽快返回。
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

对 **`drag-drop`**（同步拦截仅用于 `enter` / `drop` 子类型）：

- 返回 **`NULL`**：放行（`enter`）/ 走默认逻辑（`drop`）。
- 返回 **非 `NULL`**：拒绝拖入（`enter`）/ 表示主进程已消费（`drop`）。详见 [`drag-drop` · 同步拦截](#同步拦截23)。

### 调用处理器场景：例外（`register_ipc_handler` / `jade.invoke`）

`(const char*)1` 与 `NULL` 是占位符，库会映射为默认成功 JSON，不要对其调用 `jade_text_free`。自定义应答正文须用 `jade_text_create` 分配、由库释放。详见 [IPC 通信 API](/docs/v3api/ipc-api)。

---

## `app-ready` 事件

:::warning

:::

JadeView 初始化完成后触发。所有窗口创建、API 调用都必须在收到此事件之后进行，在此之前调用会返回 `0`（失败）。

成功与失败的 `event_data` 格式不同（成功是 JSON、失败是纯文本）。`app-ready` 是 App 来源事件，来源 ID 恒为 `0`；**判定成功必须解析正文的 `ok:true`**，不能靠来源 ID：

| 场景 | 来源 ID | `event_data` |
|------|---------|-------------|
| 初始化成功 | `0` | JSON：`{"ok":true,"message":"success"}` |
| 初始化参数校验失败 | `0` | 纯文本 `"<code>: <message>"`，如 `"missing_app_name: app_name must be non-null and valid UTF-8"`；`code` 取值为 `missing_app_name` / `missing_app_signature` / `app_signature_too_short` |

主进程判断方式：**解析 `event_data` 的 `ok` 字段** —— `ok:true` 表示成功；参数校验失败时正文为纯文本错误描述，按失败处理，`JadeView_init` 也会直接返回 `0`。

---

## 窗口事件

### `window-created`

窗口创建完成。

- **`event_data`**：`{}`
- **来源 ID**：目标 Window ID

---

### `window-closed`

窗口已关闭。

- **`event_data`**：`{}`
- **来源 ID**：目标 Window ID

:::info
即使窗口因异常被直接销毁（未走正常关闭流程），也会**补发**本事件并清理窗口状态，宿主不会漏收关闭通知。
:::

---

### `window-all-closed`

所有窗口都关了。

- **`event_data`**：`{}`
- **来源 ID**：`0`（App 来源）

:::info
即便最后一个窗口是被异常直接销毁的，也会在清理后补发本事件。
:::

---

### `window-closing`

用户点关闭（或前端 `window.close()`、Alt+F4、标题栏关闭按钮），**尚未销毁**。可通过回调返回值 [拦截](#事件订阅回调需要阻止时jade_on)（返回非空指针即阻止关闭）。

- **`event_data`**：JSON，区分关闭来源（ `source` / `url` 字段）：
  - `{"source":"system"}` — 用户发起（Alt+F4、系统关闭按钮、标题栏关闭按钮）。
  - `{"source":"frontend","url":"<页面当前地址>"}` — 由前端 `window.close()` 发起；`url` 取 JadeView 直接读取的 WebView 当前地址，非页面自报值。
- **来源 ID**：目标 Window ID

> 标题栏关闭按钮、`window.close()` 与 Alt+F4 走同一关闭流程，均会派发 `window-closing`；宿主回调返回非空指针即可拦截。详见[关闭流程](/docs/v3api/window-lifecycle)。

---

### `window-resized`

窗口尺寸变化。

- **`event_data`**：`{"width": 整数, "height": 整数}`
- **来源 ID**：目标 Window ID

---

### `window-state-changed`

窗口最大化状态变化。

- **`event_data`**：`{"isMaximized": true/false}`
- **来源 ID**：目标 Window ID

---

### `window-fullscreen`

窗口全屏状态变化。

- **`event_data`**：`{"fullscreen": true/false}`
- **来源 ID**：目标 Window ID

---

### `window-moved`

窗口位置变化。

- **`event_data`**：`{"x": 整数, "y": 整数}`
- **来源 ID**：目标 Window ID

---

### `window-focused` / `window-blurred`

窗口得到或失去键盘焦点。

- **`event_data`**：`{}`
- **来源 ID**：目标 Window ID

---

### `window-destroyed`

窗口销毁。

- **`event_data`**：`{}`
- **来源 ID**：目标 Window ID

---

### `window-bounds`

主进程查询窗口位置与尺寸（`get_window_bounds`）后，结果以本事件回报。

- **`event_data`**：`{"x": 整数, "y": 整数, "width": 整数, "height": 整数}`
- **来源 ID**：目标 Window ID

---

### `region-drag`

`jade-region-drag` 拖动区的「拖动结束」通知。

- **`event_data`**：`{"action":"end"}` —— 目前仅 `end`，表示系统窗口移动循环结束（松开左键）
- **来源 ID**：目标 Window ID
- **平台**：Windows（Linux 待验证）

拖动进入的是系统移动循环，它会捕获鼠标并吞掉页面的 `mouseup`，页面侧无法感知松开，本事件用于把该时机同步给宿主。拖动区**原地点击**（按下未移动即松开）同样会派发；**双击拖动区不派发**（走最大化/还原）。事件不携带窗口位置尺寸，可用 `get_window_bounds` 查询。

---

## WebView 与页面事件

### `webview-will-navigate`

即将导航到新 URL。可通过回调返回值 [拦截](#事件订阅回调需要阻止时jade_on)。

- **`event_data`**：`{"url": "...", "window_id": 整数}`
- **来源 ID**：目标 WebView ID

---

### `webview-did-start-loading`

页面开始加载。

- **`event_data`**：`{"url": "...", "window_id": 整数}`
- **来源 ID**：目标 WebView ID

---

### `webview-did-finish-load`

页面加载完成。

- **`event_data`**：`{"url": "...", "window_id": 整数}`
- **来源 ID**：目标 WebView ID

---

### `webview-new-window`

页面请求新窗口。可通过回调返回值 [拦截](#事件订阅回调需要阻止时jade_on)。

- **`event_data`**：`{"url": "...", "frame_name": "_blank"}` 等
- **来源 ID**：目标 WebView ID

---

### `webview-page-title-updated`

页面标题变化。

- **`event_data`**：`{"title": "...", "window_id": 整数}`
- **来源 ID**：目标 WebView ID

---

### `webview-page-favicon-updated`

页面图标（favicon）变化。

- **`event_data`**：`{"favicon": "<url>"}`
- **来源 ID**：目标 WebView ID

---

### `webview-download-started`

开始下载。**默认拦截**，需在回调中返回 `NULL` 才允许下载，见 [回调返回值速查](#ipc-callback-returns)。

- **`event_data`**：`{"url": "...", "filename": "..."}`
- **来源 ID**：目标 WebView ID

---

### `webview-download-completed`

下载完成时触发（无论成功或失败）。

- **`event_data`**：JSON，含下载结果信息
- **来源 ID**：目标 WebView ID

---


### `drag-drop`

拖拽生命周期事件，覆盖完整的拖拽流程（进入、移动、放下、离开），类似 Tauri 的 `onDragDropEvent`。

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

#### 同步拦截

`drag-drop` 的回调对 `enter` 与 `drop` 支持**同步拦截**，通过 [`IpcCallback` 返回值](/docs/v3api/event-subscription#jade-on-callback-return) 控制：

| type | 返回值语义 |
|------|-----------|
| `enter` | 返回**非空指针** → **拒绝**本次拖拽（不进入）；返回 `NULL` → 放行。 |
| `drop` | 返回**非空指针** → 表示主进程**已处理/消费**该次放下；返回 `NULL` → 交由默认逻辑。 |
| `over` / `leave` | 保持**异步通知**，返回值被忽略。 |

- 推荐拦截/消费时返回 `(const char *)(uintptr_t)1`。
- 未注册回调时由浏览器默认处理。

---

### `postmessage-received`

页面通过 `postMessage` 发送消息。**仅当来源在 `postmessage_allowed_origins` 允许范围内**时才会触发（见 [WebView API](/docs/v3api/webview-api)）。

- **`event_data`**：`{"origin": "来源", "message": "字符串"}`
- **来源 ID**：目标 WebView ID

---

## 主题与其它

### `theme-changed`

系统或窗口主题变化。

- **`event_data`**：`{}`
- **来源 ID**：目标 Window ID

---

### `update-window-icon`

需要刷新窗口图标。

- **`event_data`**：`{"window_id": 整数}`
- **来源 ID**：目标 Window ID

---


<h2 id="notification-events">通知相关事件</h2>

### `notification-shown`

通知成功显示。

- **`event_data`**：`title`、`body`、`text3` 等
- **来源 ID**：`0`（App 来源）

---

### `notification-dismissed`

用户关闭通知或超时。

- **`event_data`**：如 `{"reason": "dismissed"}`
- **来源 ID**：`0`（App 来源）

---

### `notification-failed`

通知显示失败。

- **`event_data`**：`error` 等
- **来源 ID**：`0`（App 来源）

---

### `notification-action`

用户点按钮或点通知卡片。

- **`event_data`**：`action`（`clicked` / `action_0` / `action_1`）、`title`（按钮文案）、`arguments`（来自 `NotificationParams.action`）
- **来源 ID**：`0`（App 来源）

---

## 全局系统事件

### `second-instance`

你开了**单实例**后，用户又双击启动了一次 exe。第二次进程会很快退出，但**第一次打开的进程**会收到本事件，里面带着**第二次启动时的完整命令行**。这样你可以打开同一个窗口、或解析 `myapp://` 链接。

**何时触发**：`JadeView_init` 里 `single_instance` 非 0，且判定为「第二个实例」时，由**首实例**在读到管道数据后发出。

- **来源 ID**：`0`（App 来源）
- **`event_data`**：UTF-8 JSON，里有一个 **`argv`** 数组，即第二次进程的命令行参数列表

---

### `global-hotkey`

用户按下了你用 `register_global_hotkey` 注册的**全局快捷键**（即使焦点不在你的窗口上）。你在回调里根据 JSON 里的 id / 键码做相应逻辑。

- **来源 ID**：`0`（App 来源）
- **`event_data`**：JSON，一般含 **`id`**（注册时返回的热键 id）、**`modifiers`**、**`vk`**

平台差异：Windows、Linux/X11 均可用；**Linux/Wayland 下全局热键不可用**（协议限制），`register_global_hotkey` 返回 `0`。

---

### `menu-command`

用户选择了自定义菜单项。来源是所属窗口 ID，无窗口弹出时为 `0`。JSON 包含 `item_id`。

### `menu-error`

已受理的弹出菜单未能显示。JSON 包含 `message`。

---

### `tray-event`

用户在**托盘图标上**左键、右键、双击、鼠标移入移出等（**不是**点菜单里的某一行）。需要先 `jade_on("tray-event", ...)` 才会收到。为避免刷屏，**鼠标在图标上滑动**不会不停发事件。

- **来源 ID**：`0`（App 来源）
- **`event_data`**：JSON，含 `tray_id`、`event`（如 `left-click`、`enter`）、坐标、`timestamp` 等

---

### `japk-load-failed`

JAPK 资源包加载失败时触发（公钥未设置、签名校验失败、解包/读取出错等）。详见 [JAPK 资源包](/docs/v3api/japk)。

- **来源 ID**：`0`（App 来源）
- **`event_data`**：**纯文本**错误消息（非 JSON）

---

### `crash`

程序崩溃时触发（SEH 异常、Rust Panic 或 WebView2 进程崩溃），`event_data` 为错误代码字符串，不泄露源码信息。

```c
jade_on("crash", my_callback);
```

- **来源 ID**：`0`（App 来源）
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

自定义菜单的点击通过 [`menu-command`](/docs/v3api/menu-api) 回传。

---

## 事件类型常量

| 常量 | 值 | 常量 | 值 |
| --- | --- | --- | --- |
| `JADE_EVENT_ALL` | 0 | `JADE_EVENT_LOAD_FINISHED` | 6 |
| `JADE_EVENT_CREATED` | 1 | `JADE_EVENT_CRASHED` | 7 |
| `JADE_EVENT_CREATING` | 2 | `JADE_EVENT_OPERATION_COMPLETED` | 8 |
| `JADE_EVENT_CREATE_FAILED` | 3 | `JADE_EVENT_OPERATION_FAILED` | 9 |
| `JADE_EVENT_DESTROYED` | 4 | `JADE_EVENT_OTHER` | 100 |
| `JADE_EVENT_LOAD_STARTED` | 5 | `JADE_EVENT_REPLAY` | 1（`flags` 位） |

## 事件名常量

`include/JadeView.h` 定义的命名事件字符串常量，可与命名事件机制或事件头中的 `name` 对应：

| 宏 | 字符串 | 宏 | 字符串 |
| --- | --- | --- | --- |
| `JADEVIEW_EVENT_APP_READY` | `app-ready` | `JADEVIEW_EVENT_NOTIFICATION_ACTION` | `notification-action` |
| | | `JADEVIEW_EVENT_NOTIFICATION_DISMISSED` | `notification-dismissed` |
| `JADEVIEW_EVENT_CRASH` | `crash` | `JADEVIEW_EVENT_NOTIFICATION_FAILED` | `notification-failed` |
| `JADEVIEW_EVENT_DRAG_DROP` | `drag-drop` | `JADEVIEW_EVENT_NOTIFICATION_SHOWN` | `notification-shown` |
| `JADEVIEW_EVENT_GLOBAL_HOTKEY` | `global-hotkey` | `JADEVIEW_EVENT_POSTMESSAGE_RECEIVED` | `postmessage-received` |
| `JADEVIEW_EVENT_JAPK_LOAD_FAILED` | `japk-load-failed` | `JADEVIEW_EVENT_SECOND_INSTANCE` | `second-instance` |
| | | `JADEVIEW_EVENT_THEME_CHANGED` | `theme-changed` |
| `JADEVIEW_EVENT_TRAY_EVENT` | `tray-event` | `JADEVIEW_EVENT_WINDOW_ALL_CLOSED` | `window-all-closed` |
| `JADEVIEW_EVENT_MENU_COMMAND` | `menu-command` | `JADEVIEW_EVENT_WINDOW_BLURRED` | `window-blurred` |
| `JADEVIEW_EVENT_UPDATE_WINDOW_ICON` | `update-window-icon` | `JADEVIEW_EVENT_WINDOW_BOUNDS` | `window-bounds` |
| `JADEVIEW_EVENT_MENU_ERROR` | `menu-error` | | |
| `JADEVIEW_EVENT_WEBVIEW_DID_FINISH_LOAD` | `webview-did-finish-load` | `JADEVIEW_EVENT_WINDOW_CLOSED` | `window-closed` |
| `JADEVIEW_EVENT_WEBVIEW_DID_START_LOADING` | `webview-did-start-loading` | `JADEVIEW_EVENT_WINDOW_DESTROYED` | `window-destroyed` |
| `JADEVIEW_EVENT_WEBVIEW_DOWNLOAD_COMPLETED` | `webview-download-completed` | `JADEVIEW_EVENT_WINDOW_FOCUSED` | `window-focused` |
| `JADEVIEW_EVENT_WEBVIEW_PAGE_FAVICON_UPDATED` | `webview-page-favicon-updated` | `JADEVIEW_EVENT_WINDOW_FULLSCREEN` | `window-fullscreen` |
| `JADEVIEW_EVENT_WEBVIEW_PAGE_TITLE_UPDATED` | `webview-page-title-updated` | `JADEVIEW_EVENT_WINDOW_MOVED` | `window-moved` |
| | | `JADEVIEW_EVENT_WINDOW_RESIZED` | `window-resized` |
| | | `JADEVIEW_EVENT_WINDOW_STATE_CHANGED` | `window-state-changed` |

## 崩溃错误代码

`crash` 事件的 `event_data` 使用以下字符串常量：

| 分类 | 代码 |
| --- | --- |
| SEH 异常 | `SEH_ACCESS_VIOLATION`、`SEH_STACK_OVERFLOW`、`SEH_ILLEGAL_INSTRUCTION`、`SEH_INVALID_HANDLE`、`SEH_UNKNOWN` |
| 运行时异常 | `RUNTIME_PANIC` |
| WebView2 进程 | `WV2_BROWSER_EXITED`、`WV2_RENDER_EXITED`、`WV2_RENDER_UNRESPONSIVE`、`WV2_FRAME_RENDER_EXITED`、`WV2_UTILITY_EXITED`、`WV2_SANDBOX_HELPER_EXITED`、`WV2_GPU_EXITED`、`WV2_PPAPI_PLUGIN_EXITED`、`WV2_PPAPI_BROKER_EXITED`、`WV2_UNKNOWN_EXITED` |

对应宏为 `JADEVIEW_CRASH_SEH_*` / `JADEVIEW_CRASH_RUNTIME_PANIC` / `JADEVIEW_CRASH_WV2_*`。
