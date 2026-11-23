---
title: IPC 通信 API
order: 2
group:
  title: 通信与事件
  order: 3
---

# IPC 通信 API

**用途概括**：主进程用 **`register_ipc_handler`** 响应网页里的 **`jade.invoke('命令', 数据)`**；用 **`send_ipc_message`** 主动给渲染进程推消息。

两端的回调类型都是 `IpcCallback`，定义与参数含义见 [事件订阅 · 回调类型](/docs/v3api/messaging/event-subscription#ipccallback)。要**订阅库派发的事件**（窗口生命周期、导航、脚本结果等）请看 [事件订阅](/docs/v3api/messaging/event-subscription)，不在本页。

## 双向消息

### 发送 IPC 消息（`send_ipc_message`）

**用途**：从 C 侧**主动推一条消息给指定窗口里的渲染进程**（类型 + 正文），渲染进程用 **`jade.on(message_type, ...)`** 接收。

```c
int32_t send_ipc_message(uint32_t webview_id, const char* message_type, const char* message_content);
```

| 参数 | 说明 |
|------|------|
| `webview_id` | 目标 WebView ID。 |
| `message_type` | 渲染进程订阅用的类型名，与 `jade.on` 第一个参数一致。 |
| `message_content` | 一般为 **JSON 文本**；也可按你与渲染进程约定传其它 UTF-8 串。 |

正文特别大时可走分片/引用等优化路径；仍建议**单次**控制在**256 MiB** 字节预算以内，避免 WebView2 与主进程内存压力。

---

### 注册调用处理器（`register_ipc_handler`）

**用途**：把 **`channel` 名字符串**与 C 回调绑定；渲染进程 **`await jade.invoke(channel, payload, options)`** 时会调用该 **`IpcCallback`**。

```c
int32_t register_ipc_handler(const char* channel, IpcCallback ipc_cb);
```

| 参数 | 说明 |
|------|------|
| `channel` | 与渲染进程 **`jade.invoke` 第一个参数**完全一致（区分大小写）。 |
| `ipc_cb` | **`IpcCallback`**：第一个参数是**发起请求的 WebView ID**；`event_data` 一般为请求的 payload（常为 JSON 文本）。 |

| 返回值 | 含义 |
|--------|------|
| `1` | 注册成功。 |
| `0` | 注册失败。 |

<h4 id="register-ipc-handler-return">返回值约定（`register_ipc_handler`）</h4>

此处 **`IpcCallback` 的返回值表示给渲染进程的应答**，与 **`jade_on` 的「拦截」语义不同**：

- 返回 **`NULL`**、**`(const char *)1`** 或实现认定的其它**特殊地址**：库向渲染进程返回**默认成功 JSON**，**不会**对该指针调用 **`jade_text_free`**。
- 返回**其它指针**：视为 **UTF-8 应答正文**，读完后由库 **`jade_text_free`**；请用 **`jade_text_create`** 分配（见 [工具 API](/docs/v3api/system/tools-api)）。

渲染进程请使用 **`jade.invoke(command, payload, { timeout })`**。详见 [前端通信 API](/docs/v3api/frontend/javascript-api)。
