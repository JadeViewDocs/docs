---
title: IPC 通信 API
order: 0
group:
  title: 通信与事件
  order: 3
---

# IPC 通信 API

**用途概括**：主进程用 **`jade_on`** 订阅库派发的事件（窗口生命周期、导航、脚本结果等）；用 **`register_ipc_handler`** 响应网页里的 **`jade.invoke('命令', 数据)`**；用 **`send_ipc_message`** 主动给渲染进程推消息。

:::info
**2.3 通信链路优化（对外接口不变）**：`invoke` 与广播消息共用发送路径、渲染进程消息入口收敛为统一 dispatcher、高频小事件经微任务批处理合并发送，并去掉了整条消息克隆。渲染进程 `jade.invoke` / `jade.on` 调用方式与旧消息形态**完全兼容**，无需改动代码即可获得性能提升（`invoke` 约 5%~20%、广播约 20%~60%、高频事件消息数减少约 50%~90%）。
:::

---

## 基础类型

<h3 id="ipccallback">回调类型（`IpcCallback`）</h3>

主进程侧事件与 **`jade.invoke`** 共用同一种 C 回调类型（与 **`JadeView.h`** 一致）：

```c
typedef const char *(*IpcCallback)(uint32_t window_id, const char *event_data);
```

#### 参数

| 参数 | 说明 |
|------|------|
| `window_id` | **事件或请求关联的窗口**。多数窗口事件里是当前窗口 id；与所有窗口无关的全局事件（如 `app-ready`、`second-instance`、`global-hotkey`、托盘相关）多为 **`0`**，以 [事件类型](/docs/api/event-types) 各节为准。 |
| `event_data` | **只读**的 **UTF-8** 字符串，**以 `\0` 结尾**。内容多为 **JSON 文本**；少数为纯文本（如 `app-ready` 失败时的错误描述、`crash` 的错误代码）。**仅在本次回调执行期间保证有效**，回调返回后不要保存裸指针；需要留存请自行拷贝。 |

#### 返回值（`const char *`）

同一函数指针类型在两种用法下含义不同：

| 用于 | 返回值含义 |
|------|------------|
| **`jade_on(...)`** 注册的回调 | 见下文 **[`jade_on` 与回调返回值](#jade-on-callback-return)** 及 [事件类型 · 速查](/docs/api/event-types#ipc-callback-returns)（拦截类：`NULL` 放行，**`(const char *)(uintptr_t)1`** 等非空表示阻止；`webview-download-started` 特例等）。 |
| **`register_ipc_handler`** | 见下文 **[`register_ipc_handler` 的返回值](#register-ipc-handler-return)**（`NULL` / `(const char *)1` 等为默认成功；其它指针为应答正文并由库 `jade_text_free`）。 |

:::info
不要在回调里**长时间阻塞**或做重活，以免卡住 GUI / 消息线程；可投递到自己的队列里异步处理。
:::

---

## 事件订阅

<h3 id="jade-on">订阅事件（`jade_on`）</h3>

**用途**：按**事件名字符串**注册一个回调；事件发生时库调用你的 `IpcCallback`。**派发线程分两类**：**拦截类**事件（`window-closing`、`webview-will-navigate`、`webview-new-window`、`webview-download-started`、`drag-drop` 的 `enter`/`drop`）在 **GUI 线程内联同步**调用，库即时读取返回值决定放行/阻止，务必尽快返回；**其余通知类**事件经 worker 线程池**异步**派发。

```c
uint32_t jade_on(const char *event_name, IpcCallback callback);
```

#### 参数

| 参数 | 说明 |
|------|------|
| `event_name` | 事件名，**UTF-8**、**以 `\0` 结尾**，与文档及页面约定一致（如 `app-ready`、`window-closing`、`javascript-result`）。 |
| `callback` | 类型为 **`IpcCallback`**；收到事件时由库调用，参数含义见上节。 |

#### 返回值

| 返回值 | 含义 |
|--------|------|
| **`> 0`** | 本次注册的 **callback id**，供 **`jade_off(event_name, callback_id)`** 精确注销。 |
| **`0`** | 注册失败（空指针、内存不足等，以实际实现为准）。 |

#### 调用时机与约定

- **`app-ready`**：必须在 **`JadeView_init` 之前**注册，否则会漏掉第一条就绪或失败通知（见 [核心 API](/docs/api/index)）。
- **其它事件**：一般在 **`app-ready` 成功**、开始创建窗口之后再注册即可；事件名与 `event_data` 形态见 [事件类型](/docs/api/event-types)。
- **多次注册**：同一 `event_name` 可注册多个回调，每次 `jade_on` 返回不同 id；触发时**执行顺序以实现为准**，不要依赖顺序做互斥逻辑。

<h4 id="jade-on-callback-return">回调返回值约定（`jade_on`）</h4>

对 **`jade_on`** 注册的 `IpcCallback`，返回值只在**部分事件**上有语义；**多数仅通知类事件**的返回值可被库忽略，**习惯统一写 `return NULL;`** 即可。

- **有「拦截 / 放行」语义**的：如 **`window-closing`**、**`webview-will-navigate`**、**`webview-new-window`**（**非 `NULL` = 阻止**）；**`webview-download-started`**（**仅 `NULL` = 允许下载**，默认拦截）。推荐阻止时写 **`return (const char *)(uintptr_t)1;`**。
- **无拦截语义**：返回 **`NULL`**。

完整列表与说明见 [事件类型 · IpcCallback 返回值](/docs/api/event-types#ipc-callback-returns)。

**关于 `app-ready`**：**判定成功只看 `window_id == 1`**——成功时 `event_data` 为 JSON `{"ok":true,"message":"success"}`；`window_id == 0` 表示失败，`event_data` 为**纯文本**错误描述（运行期崩溃另走 `crash` 事件，不在此事件）。解析方式见 [事件类型](/docs/api/event-types)。2.0 新增事件名如 `second-instance`、`global-hotkey`、`tray-menu-command`、`tray-event` 等同页。

---

### 取消订阅（`jade_off`）

**用途**：按 **`event_name` + `jade_on` 返回的 id** 取消**那一次**订阅；不会误删同事件名下的其它回调。

```c
int32_t jade_off(const char *event_name, uint32_t callback_id);
```

| 参数 | 说明 |
|------|------|
| `event_name` | 与注册时相同的事件名。 |
| `callback_id` | 对应 **`jade_on` 的返回值**（`> 0`）。 |

| 返回值 | 含义 |
|--------|------|
| `1` | 成功注销。 |
| `0` | 失败（未找到、参数无效等）。 |

---

## 双向消息

### 发送 IPC 消息（`send_ipc_message`）

**用途**：从 C 侧**主动推一条消息给指定窗口里的渲染进程**（类型 + 正文），渲染进程用 **`jade.on(message_type, ...)`** 接收。

```c
int32_t send_ipc_message(
  uint32_t window_id,
  const char *message_type,
  const char *message_content
);
```

| 参数 | 说明 |
|------|------|
| `window_id` | 目标窗口 id。 |
| `message_type` | 渲染进程订阅用的类型名，与 `jade.on` 第一个参数一致。 |
| `message_content` | 一般为 **JSON 文本**；也可按你与渲染进程约定传其它 UTF-8 串。 |

正文特别大时，2.0 内部可走分片/引用等优化路径；仍建议**单次**控制在约 **252MB** 以内，避免 WebView2 与主进程内存压力。

---

### 注册调用处理器（`register_ipc_handler`）

**用途**：把 **`channel` 名字符串**与 C 回调绑定；渲染进程 **`await jade.invoke(channel, payload, options)`** 时会调用该 **`IpcCallback`**。

```c
int32_t register_ipc_handler(const char *channel, IpcCallback ipc_cb);
```

| 参数 | 说明 |
|------|------|
| `channel` | 与渲染进程 **`jade.invoke` 第一个参数**完全一致（区分大小写）。 |
| `ipc_cb` | **`IpcCallback`**：`window_id` 为发起请求的窗口；`event_data` 一般为请求的 payload（常为 JSON 文本）。 |

| 返回值 | 含义 |
|--------|------|
| `1` | 注册成功。 |
| `0` | 注册失败。 |

<h4 id="register-ipc-handler-return">返回值约定（`register_ipc_handler`）</h4>

此处 **`IpcCallback` 的返回值表示给渲染进程的应答**，与 **`jade_on` 的「拦截」语义不同**：

- 返回 **`NULL`**、**`(const char *)1`** 或实现认定的其它**特殊地址**：库向渲染进程返回**默认成功 JSON**，**不会**对该指针调用 **`jade_text_free`**。
- 返回**其它指针**：视为 **UTF-8 应答正文**，读完后由库 **`jade_text_free`**；请用 **`jade_text_create`** 分配（见 [工具 API](/docs/api/tools-api)）。

2.0 渲染进程请使用 **`jade.invoke(command, payload, { timeout })`**；旧版 **`invokeAsync` 已移除**。详见 [前端通信 API](/docs/api/javascript-api)。
