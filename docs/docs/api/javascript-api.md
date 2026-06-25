---
title: 前端通信 API
description: 页面与主进程通信（jade 对象）
order: 0
group:
  title: 前端 API
  order: 2
---

# 前端通信 API

## 概述

**用途**：网页里通过全局对象 **`jade`** 和外面 C/C++ 写的主进程互相发消息。订阅事件用 **`jade.on`**；让主进程算点东西、拿文件路径等用 **`jade.invoke`**。页面须运行在 JadeView 提供的 WebView 环境（含 **`set_protocol_service_path` 给出的内置地址** 或等价加载方式），否则没有 `jade` 对象。

---

## 通信方式

### 调用主进程方法（`jade.invoke`）

**用途**：像「**远程调用主进程函数**」：你把命令名和数据丢过去，主进程在 `register_ipc_handler` 里处理，再把结果异步还给你。适合读配置、选文件、跑耗时任务等。

2.0 推荐写法：

```javascript
await jade.invoke('命令名', 传给主进程的数据, { timeout: 5000 });
```

- 第二段可以是字符串、对象等，主进程收到的一般是 JSON 文本。
- **第三段可选**：`timeout` 控制最多等多久；不写则用默认超时。
- 内部是**两段异步**：大结果或慢任务时更稳；旧版 **`invokeAsync` 已删除**，请只用 **`invoke`**。

---

### 批量调用主进程方法（`jade.invokeBatch`）

**用途**：批量发送多个 invoke 命令，统一等待全部完成。

```typescript
invokeBatch(commands: Array<{
  command: string;
  payload?: any;
  options?: { timeout?: number };
}>): Promise<any[]>
```

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| commands | Array | 是 | 命令对象数组，每个元素同 `invoke` 的参数结构 |

**返回值**

Promise，resolve 为结果数组，顺序与传入的 commands 一一对应。

**示例**

```javascript
const [path, version] = await jade.invokeBatch([
  { command: 'get_init_path' },
  { command: 'get_version' },
]);
console.log(path, version);

// 带参数
const results = await jade.invokeBatch([
  { command: 'get_init_path' },
  { command: 'open_module', payload: { name: 'settings' } },
  { command: 'slow_cmd', options: { timeout: 10000 } },
]);
```

> 注意：invokeBatch 内部逐个调用 invoke，并非单次网络请求。任一命令失败则整个 batch 失败。

---

### 订阅主进程消息（`jade.on`）

**用途**：监听主进程 **`send_ipc_message`** 推过来的消息，或库内约定的通知（事件名与负载格式见 [事件类型](/docs/api/event-types)）。

```javascript
const off = jade.on('事件名', function (payload) {
  // payload 一般为对象（库已解析 JSON）
});
// 不再需要时取消订阅：
// off();
```

- **第一个参数**：字符串，与 C 侧 `send_ipc_message` 的 `message_type` 或文档中的事件名一致。
- **第二个参数**：回调，参数是解析后的数据（常见为对象）。
- **返回值**：**取消订阅函数**，调用后不再接收该监听。

---

## 使用建议

### 消息体积与性能

- 单次传递的数据**不要过大**；WebView2 上建议控制在约 **252MB** 以内，再大容易崩或卡死。
- 只订阅需要的事件，用完记得 **`off()`**，避免泄漏与重复处理。

### 示例

```javascript
const result = await jade.invoke('message', { data: 'test' }, { timeout: 5000 });
```

主进程侧为每个 `命令名` 调 `register_ipc_handler`，见 [IPC 通信 API](/docs/api/ipc-api)。

---

## 主进程回调示例

以下为常见命令的 `register_ipc_handler` 回调写法。

### message 命令

```c
const char* message_callback(uint32_t window_id, const char* event_data) {
    printf("收到 message 命令，窗口ID: %u, 数据: %s\n", window_id, event_data);

    char result[256];
    snprintf(result, sizeof(result),
        "{\"status\":\"success\",\"message\":\"已收到\",\"window_id\":%u}",
        window_id);
    return jade_text_create(result);
}
```

### setBackdrop 命令

```c
const char* set_backdrop_callback(uint32_t window_id, const char* event_data) {
    printf("收到 setBackdrop，窗口ID: %u, 类型: %s\n", window_id, event_data);
    return jade_text_create("{\"success\":true,\"result\":\"背景材料设置完成\"}");
}
```

### setTheme 命令（异步处理）

```c
const char* set_theme_callback(uint32_t window_id, const char* event_data) {
    printf("收到 setTheme，窗口ID: %u, 主题: %s\n", window_id, event_data);

    // 1. 立即返回确认
    char result[128];
    snprintf(result, sizeof(result),
        "{\"status\":\"success\",\"message\":\"已接收，异步处理中\"}");

    // 2. 异步处理 ... 完成后 send_ipc_message 通知渲染进程
    send_ipc_message(window_id, "setTheme",
        "{\"theme\":\"Dark\",\"status\":\"completed\"}");

    return jade_text_create(result);
}
```

---

## 完整示例

```javascript
// 初始化时设置背景材料
(async function () {
  try {
    await jade.invoke('setBackdrop', 'mica');
  } catch (error) {
    console.error('设置失败:', error);
  }
})();

// 监听窗口状态变化
jade.on('window-state-changed', function (data) {
  console.log('窗口状态变化:', data);
});

// 按钮点击事件处理
document.getElementById('sendBtn').addEventListener('click', async function () {
  const message = document.getElementById('msgInput').value;
  try {
    const result = await jade.invoke('message', message);
    console.log('发送成功:', result);
  } catch (error) {
    console.error('发送失败:', error);
  }
});
```

---

## 常见问题

### 1. 调用失败，提示 "JadeView API not available"

- **原因**：页面不是通过 JadeView 支持的协议加载的。前端 API 仅在通过 `set_protocol_service_path` 加载的页面或等价的 WebView 环境中可用。
- **解决**：确保使用 `set_protocol_service_path` 提供的协议 URL 创建窗口，或使用从内存加载的 JAPK 页面。

### 2. 调用失败，提示超时

- 检查主进程是否正确注册了对应的 IPC handler
- 检查命令名称是否拼写正确（区分大小写）
- 确认 `timeout` 参数对耗时操作设置了足够的时间

### 3. 事件不触发

- 检查主进程侧 `send_ipc_message` 的 `message_type` 是否与 `jade.on` 第一个参数一致
- 确认订阅在事件发送之前执行

### 4. 性能问题

- 减少不必要的 API 调用
- 及时调用取消订阅函数释放监听
- 单次传输数据控制在约 252MB 以内
