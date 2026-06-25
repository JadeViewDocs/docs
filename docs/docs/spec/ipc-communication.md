---
title: 主进程与渲染进程 IPC 通信
order: 1
group:
  title: "核心设计"
  order: 2
---

# 主进程与渲染进程双向 IPC 通信

JadeView 2.0 提供了基于自定义协议的主进程与渲染进程双向 IPC 通信机制，渲染进程通过 `jade.invoke` / `jade.on` 与主进程（C/C++）代码高效交换数据。

:::info{title="术语对照（与 Electron 一致）"}
JadeView 采用与 Electron 相同的进程模型术语：

- **主进程（main process）**：你用 C/C++ 编写、加载 JadeView DLL 的 exe。负责创建窗口、注册 IPC 处理器、推送事件，对应 `register_ipc_handler` / `send_ipc_message` / `jade_on` 等原生接口。
- **渲染进程（renderer process）**：运行在 WebView 中的网页（HTML/CSS/JS），通过全局 `jade` 对象与主进程通信，对应 `jade.invoke` / `jade.on`。

下文统一以「主进程 / 渲染进程」指代这两侧。
:::

## 通信模型

```
渲染进程 (JavaScript)                  主进程 (C/C++)
     │                                   │
     ├─ jade.invoke('命令', 数据) ──────►│ register_ipc_handler 回调
     │                                   │ → 返回 jade_text_create(...)
     │  ◄────── Promise resolve ────────┤
     │                                   │
     ├─ jade.on('事件', callback) ──────►│ 注册监听
     │  ◄── send_ipc_message(事件,数据)─┤ 主动推送
```

- **请求-响应**：渲染进程 `jade.invoke` → 主进程 `register_ipc_handler` 回调 → 返回值回到渲染进程
- **事件推送**：主进程 `send_ipc_message` → 渲染进程 `jade.on` 回调

---

## 渲染进程到主进程（jade.invoke）

### 渲染进程代码

```javascript
// 调用主进程方法，等待返回结果
const result = await jade.invoke('get-config', { key: 'theme' });
console.log('主进程返回:', result);

// 带超时
const data = await jade.invoke('heavy-task', payload, { timeout: 10000 });
```

### 主进程 C 代码

```c
#include "jadeview.h"

// IPC 回调：处理渲染进程 jade.invoke('get-config', ...)
const char* get_config_callback(uint32_t window_id, const char* event_data) {
    printf("收到 get-config，窗口: %u, 数据: %s\n", window_id, event_data);

    // 处理逻辑...
    // 返回结果给渲染进程（必须用 jade_text_create 分配）
    return jade_text_create("{\"theme\":\"dark\",\"lang\":\"zh\"}");
}

// 在 app-ready 中注册
const char* app_ready_callback(uint32_t window_id, const char* event_data) {
    if (window_id == 1 && event_data
        && strcmp(event_data, "success") == 0) {
        // 注册 IPC 处理器
        register_ipc_handler("get-config", get_config_callback);

        // 创建窗口...
    }
    return NULL;
}
```

:::info
`register_ipc_handler` 的回调返回值必须用 `jade_text_create` 分配，库会自动调用 `jade_text_free` 释放。返回 `NULL` 表示返回默认成功 JSON。
:::

---

## 主进程到渲染进程（send_ipc_message + jade.on）

### 主进程 C 代码

```c
// 向渲染进程推送事件
void notify_frontend(uint32_t window_id) {
    send_ipc_message(window_id, "data-update",
        "{\"status\":\"ok\",\"timestamp\":123456}");
}
```

### 渲染进程代码

```javascript
// 订阅主进程推送的事件
const off = jade.on('data-update', (payload) => {
    console.log('主进程推送:', payload);
    // payload 已是解析后的对象
});

// 不需要时取消订阅
// off();
```

---

## 完整示例

### 渲染进程

```javascript
// 1. 初始化时向主进程请求数据
(async function() {
    try {
        const config = await jade.invoke('get-config', {});
        console.log('配置:', config);
    } catch (e) {
        console.error('请求失败:', e);
    }
})();

// 2. 订阅主进程通知
jade.on('data-update', (data) => {
    document.getElementById('status').textContent = data.status;
});

// 3. 按钮触发主进程操作
document.getElementById('btn').onclick = async () => {
    const result = await jade.invoke('do-action',
        { action: 'save', value: 'hello' });
    console.log('结果:', result);
};
```

### 主进程 (C)

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

// 处理 get-config
const char* get_config_callback(uint32_t window_id, const char* event_data) {
    return jade_text_create("{\"theme\":\"dark\",\"version\":\"2.1\"}");
}

// 处理 do-action
const char* do_action_callback(uint32_t window_id, const char* event_data) {
    printf("do-action 收到: %s\n", event_data);

    // 处理完后向渲染进程推送结果
    send_ipc_message(window_id, "data-update",
        "{\"status\":\"saved\"}");

    return jade_text_create("{\"ok\":true}");
}

const char* app_ready_callback(uint32_t window_id, const char* event_data) {
    if (window_id == 1 && event_data
        && strcmp(event_data, "success") == 0) {
        // 注册 IPC 处理器
        register_ipc_handler("get-config", get_config_callback);
        register_ipc_handler("do-action", do_action_callback);

        // 创建窗口
        WebViewWindowOptions options = {
            .title = "IPC 示例",
            .width = 800,
            .height = 600,
            .frame_style = "normal"
        };

        create_webview_window("https://example.com", 0, &options, NULL);
    }
    return NULL;
}

int main() {
    jade_on("app-ready", app_ready_callback);

    int result = JadeView_init(
        1, NULL, NULL,
        "IPC 示例",
        "com.example.ipc",
        0
    );
    if (result == 0) {
        printf("初始化失败\n");
        return 1;
    }

    printf("JadeView 已启动\n");
    return 0;
}
```

---

## 命名建议

- 命令名/事件名使用 **kebab-case**：`get-config`、`data-update`
- 渲染进程 `jade.invoke` 第一参数与主进程 `register_ipc_handler` 第一参数**完全一致**（区分大小写）
- 渲染进程 `jade.on` 第一参数与主进程 `send_ipc_message` 第二参数**完全一致**

---

## 注意事项

1. 主进程 `register_ipc_handler` 回调返回值必须用 `jade_text_create` 分配
2. 渲染进程 `jade.on` 返回取消函数，不需要时调用 `off()` 防止泄漏
3. 单次传输数据建议控制在约 252MB 以内
4. 渲染进程 API 仅在通过 JadeView 协议加载的页面中可用（`set_protocol_service_path` 或 JAPK）

> 详细 API 参考：[前端通信 API](/docs/api/javascript-api) | [IPC 通信 API](/docs/api/ipc-api) | [事件类型](/docs/api/event-types)