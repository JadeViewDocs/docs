---
title: 事件订阅
order: 0
group:
  title: 通信与事件
  order: 3
---

# 事件订阅

库往主进程派发事件有两种订阅方式，机制并列、互不替代：

| 方式 | 入口 | 事件用什么标识 | 回调拿到什么 |
|------|------|----------------|--------------|
| 命名事件 | `jade_on` / `jade_off` | 事件名字符串（`app-ready`、`window-closing`…） | 来源 ID + 字符串正文 |
| 类型化订阅 | `on_app_event` / `on_window_event` / `on_webview_event` | 事件类型常量（`JADE_EVENT_*`） | `JadeEvent` 结构体指针 |

同一个事件两套都能收到，选哪套取决于你要什么：只要正文 JSON，用命名事件更省事；要区分来源种类、读序号 / 请求 ID / 错误码，或处理二进制正文，用类型化订阅。

事件有哪些、`event_data` 长什么样，见 [事件类型](/docs/v3api/event-types)。

<h2 id="ipccallback">回调类型（`IpcCallback`）</h2>

命名事件与 `register_ipc_handler` 共用同一种 C 回调类型（与 `JadeView.h` 一致）：

```c
typedef const char* (JADEVIEW_CALL *IpcCallback)(uint32_t, const char*);
```

**参数**

| 参数 | 说明 |
|------|------|
| 第一个参数 | **事件真实来源 ID**：App 来源恒为 `0`，Window 事件用 Window ID，WebView 事件用 WebView ID；`register_ipc_handler` 的 invoke 回调这里是**发起请求的 WebView ID**。以 [事件类型](/docs/v3api/event-types) 各节为准。 |
| `event_data` | **只读**的 **UTF-8** 字符串，**以 `\0` 结尾**。内容多为 **JSON 文本**；少数为纯文本（如 `app-ready` 失败时的错误描述、`crash` 的错误代码）。**仅在本次回调执行期间保证有效**，回调返回后不要保存裸指针；需要留存请自行拷贝。 |

**返回值（`const char *`）**

同一函数指针类型在两种用法下含义不同：

| 用于 | 返回值含义 |
|------|------------|
| **`jade_on(...)`** 注册的回调 | 见下文 **[`jade_on` 与回调返回值](#jade-on-callback-return)** 及 [事件类型 · 速查](/docs/v3api/event-types#ipc-callback-returns)（拦截类：`NULL` 放行，**`(const char *)(uintptr_t)1`** 等非空表示阻止；`webview-download-started` 特例等）。 |
| **`register_ipc_handler`** | 表示给渲染进程的应答，约定见 [IPC 通信 API · 返回值约定](/docs/v3api/ipc-api#register-ipc-handler-return)。 |

:::info
不要在回调里**长时间阻塞**或做重活，以免卡住 GUI / 消息线程；可投递到自己的队列里异步处理。
:::

---

## 命名事件订阅

<h3 id="jade-on">订阅事件（`jade_on`）</h3>

按**事件名字符串**注册回调，事件发生时库调用 `IpcCallback`。拦截类事件在 GUI 线程同步调用，回调须尽快返回；其余事件异步派发。

```c
uint32_t jade_on(const char* event_name, IpcCallback callback);
```

**参数**

| 参数 | 说明 |
|------|------|
| `event_name` | 事件名，**UTF-8**、**以 `\0` 结尾**，与文档及页面约定一致（如 `app-ready`、`window-closing`、`webview-did-finish-load`）。 |
| `callback` | 类型为 **`IpcCallback`**；收到事件时由库调用，参数含义见上节。 |

**返回值**

| 返回值 | 含义 |
|--------|------|
| **`> 0`** | 本次注册的 **callback id**，供 **`jade_off(event_name, callback_id)`** 精确注销。 |
| **`0`** | 注册失败（空指针、内存不足等，以实际实现为准）。 |

**调用时机与约定**

- **`app-ready`**：必须在 **`JadeView_init` 之前**注册，否则会漏掉第一条就绪或失败通知（见 [核心 API](/docs/v3api/index)）。
- **其它事件**：一般在 **`app-ready` 成功**、开始创建窗口之后再注册即可；事件名与 `event_data` 形态见 [事件类型](/docs/v3api/event-types)。
- **多次注册**：同一 `event_name` 可注册多个回调，每次 `jade_on` 返回不同 id；触发时**执行顺序以实现为准**，不要依赖顺序做互斥逻辑。

<h4 id="jade-on-callback-return">回调返回值约定（`jade_on`）</h4>

对 **`jade_on`** 注册的 `IpcCallback`，返回值只在**部分事件**上有语义；**多数仅通知类事件**的返回值可被库忽略，**习惯统一写 `return NULL;`** 即可。

- **有「拦截 / 放行」语义**的：如 **`window-closing`**、**`webview-will-navigate`**、**`webview-new-window`**（**非 `NULL` = 阻止**）；**`webview-download-started`**（**仅 `NULL` = 允许下载**，默认拦截）。推荐阻止时写 **`return (const char *)(uintptr_t)1;`**。
- **无拦截语义**：返回 **`NULL`**。

完整列表与说明见 [事件类型 · IpcCallback 返回值](/docs/v3api/event-types#ipc-callback-returns)。

**关于 `app-ready`**：这是 App 来源事件（来源 ID 恒为 `0`），成功正文为 JSON `{"ok":true,"message":"success"}`，应解析正文的 `ok:true` 判断启动是否成功；初始化参数无效时 `JadeView_init` 直接返回 `0`。运行期崩溃另走 `crash` 事件。解析方式见 [事件类型](/docs/v3api/event-types)。

---

### 取消订阅（`jade_off`）

**用途**：按 **`event_name` + `jade_on` 返回的 id** 取消**那一次**订阅；不会误删同事件名下的其它回调。

```c
int32_t jade_off(const char* event_name, uint32_t callback_id);
```

| 参数 | 说明 |
|------|------|
| `event_name` | 与注册时相同的事件名。 |
| `callback_id` | 对应 **`jade_on` 的返回值**（`> 0`）。 |

| 返回值 | 含义 |
|--------|------|
| `1` | 成功注销。 |
| `0` | 失败（未找到、参数无效等）。 |

`jade_off` 返回时只保证该回调已从后续派发中移除，**不等待已经开始执行的回调**。若要在注销后立即释放回调上下文，使用 `jade_off_wait` 并等待其请求完成：

```c
uint64_t jade_off_wait(const char* event_name, uint32_t callback_id);
```

`jade_off_wait` 阻止尚未开始的回调，返回注销请求 ID。请求完成表示回调已停止；完成前不得释放 `user_data` 或其它上下文。

- 结果按普通请求读取与释放（`get_request_result` / `free_request_result` / `release_request`）；无效 ID 以 `JADE_INVALID_ID` 完成。
- 请求遵循 30 秒期限，超时不代表回调已停止。
- 不要在回调内等待自己的注销请求；返回 `0` 表示无法创建请求。

---

## 类型化订阅

按**事件类型**（数字）订阅，回调拿到的是结构化事件头 `JadeEvent`，而不是裸字符串。需要区分来源、读取 `sequence` / `request_id` / 错误码，或要处理二进制正文时用它。

### 回调类型（`JadeEventCallback`）

```c
typedef void (JADEVIEW_CALL *JadeEventCallback)(const struct JadeEvent*, void*);
```

第一个参数是事件指针，第二个是注册时透传的 `user_data`。**事件正文只在回调执行期间有效**，需要跨出回调保留时必须自行深拷贝或用 `event_clone`。

### 订阅 App 级事件（`on_app_event`）

```c
uint64_t on_app_event(uint32_t event_type, JadeEventCallback callback, void* user_data);
```

### 订阅窗口事件（`on_window_event`）

```c
uint64_t on_window_event(uint32_t window_id, uint32_t event_type, JadeEventCallback callback, void* user_data);
```

`window_id` 为 Window ID。

### 订阅视图事件（`on_webview_event`）

```c
uint64_t on_webview_event(uint32_t webview_id, uint32_t event_type, JadeEventCallback callback, void* user_data);
```

`webview_id` 为 WebView ID。

`event_type` 取值见 [事件类型 · 事件类型常量](/docs/v3api/event-types#事件类型常量)。三个函数都返回 `uint64_t` **订阅 ID**，供 `unsubscribe_event` 使用。

### 注销订阅（`unsubscribe_event`）

```c
uint64_t unsubscribe_event(uint64_t subscription_id);
```

**返回注销请求 ID**，注销本身是异步操作。注销有三条硬性约束：

1. 调用后会**立即阻止尚未开始的回调**；
2. 必须**等该注销请求完成**之后，才能释放 `user_data` 或语言侧的回调对象；
3. **不得在回调内部等待自己的注销**（普通原生通知在一个串行线程执行，会死锁）。

### 复制与释放事件（`event_clone` / `event_free`）

```c
struct JadeEvent* event_clone(const struct JadeEvent* event);
void event_free(struct JadeEvent* event);
```

`event_clone` 深拷贝一份脱离回调生命周期的事件，用完由 `event_free` 释放。头文件注释：

> 深拷贝仅在回调期间有效的事件。用 `event_free` 释放返回值。

### 事件头（`JadeEvent`）

```c
typedef struct JadeEvent {
  uint32_t event_type;
  uint32_t source_kind;
  uint64_t source_id;
  uint32_t window_id;
  uint32_t webview_id;
  uint64_t sequence;
  uint64_t request_id;
  uint32_t flags;
  uint32_t state;
  int32_t error_code;
  const char *name;
  const uint8_t *data;
  size_t data_size;
} JadeEvent;
```

| 字段 | C 类型 | 含义 |
| --- | --- | --- |
| `event_type` | `uint32_t` | 事件类型（`JADE_EVENT_*`） |
| `source_kind` | `uint32_t` | 来源种类（App / Window / WebView） |
| `source_id` | `uint64_t` | 事件真实来源 ID（App / Window / WebView 各自的 ID） |
| `window_id` | `uint32_t` | 关联的 Window ID |
| `webview_id` | `uint32_t` | 关联的 WebView ID |
| `sequence` | `uint64_t` | 事件序号 |
| `request_id` | `uint64_t` | 关联的请求 ID |
| `flags` | `uint32_t` | 标志位，如 `JADE_EVENT_REPLAY` |
| `state` | `uint32_t` | 对象状态（`JADE_STATE_*`，见 [窗口 API](/docs/v3api/window-api)） |
| `error_code` | `int32_t` | 失败事件的错误码 |
| `name` | `const char*` | 事件名 |
| `data` | `const uint8_t*` | 正文指针，仅在回调期间有效 |
| `data_size` | `size_t` | 正文长度（字节） |

常用生命周期事件支持**当前状态回放**，回放事件由 `flags` 中的 `JADE_EVENT_REPLAY` 标识。

> `app-ready` 是 App 来源（`source_id` 恒为 `0`），成功正文为 `{"ok":true,"message":"success"}`；**不能用来源 ID 判断启动成功**，初始化参数无效时 `JadeView_init` 直接返回 0。

---

## 派发与线程约定

两种订阅共用同一串行派发线程：

- 当前保证**全局 FIFO** 派发，因此同一来源内有序；**不要依赖跨来源并行**回调。
- 回调应**快速返回**，阻塞会推迟后续所有事件；长任务转交宿主线程。
- 拦截类事件（`window-closing`、`webview-will-navigate`、`webview-new-window`、`webview-download-started`、`drag-drop` 的 `enter` / `drop`）在 GUI 线程**同步**调用，库立即读取返回值决定放行或阻止。
