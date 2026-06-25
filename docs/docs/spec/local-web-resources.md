---
title: JADE:// 自定义协议
order: 0
group:
  title: "核心设计"
  order: 2
---

# JADE:// 自定义协议：加载本地 Web 资源

JadeView 通过 `set_protocol_service_path` 注册自定义协议处理器，将 `https://{appname}.local/` 映射到本地目录或 JAPK 文件，实现安全、高效的本地资源加载。

:::warning{title="重要提示"}
`https://{appname}.local/` 是 JadeView 内部的自定义协议路由，不是真实的 HTTP 服务器。它不会监听端口，完全在应用内部运行。
:::

## 前提条件

- 从 [GitHub Releases](https://github.com/JadeViewDocs/JadeView/releases) 下载 `jadeview.dll` 和 `jadeview.h`
- 了解 C 语言基础

---

## 步骤 1：初始化并设置协议服务

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

// 窗口控制 IPC 回调
const char* minimize_callback(uint32_t window_id, const char* event_data) {
    minimize_window(window_id);
    return jade_text_create("{\"ok\":true}");
}

const char* maximize_callback(uint32_t window_id, const char* event_data) {
    toggle_maximize_window(window_id);
    return jade_text_create("{\"ok\":true}");
}

const char* close_callback(uint32_t window_id, const char* event_data) {
    close_window(window_id);
    return jade_text_create("{\"ok\":true}");
}

const char* app_ready_callback(uint32_t window_id, const char* event_data) {
    if (window_id == 1 && event_data
        && strcmp(event_data, "success") == 0) {
        printf("JadeView 准备就绪\n");

        // 注册窗口控制命令
        register_ipc_handler("minimize-window", minimize_callback);
        register_ipc_handler("toggle-maximize", maximize_callback);
        register_ipc_handler("close-window", close_callback);

        // 设置本地协议服务 —— 将 ./web 目录映射到 https://myapp.local/
        char url_buffer[256];
        int result = set_protocol_service_path(
            "./web",              // 本地资源目录
            url_buffer,           // 输出协议 URL 缓冲区
            sizeof(url_buffer)    // 缓冲区大小
        );

        if (result == 1) {
            printf("协议 URL: %s\n", url_buffer);
            // url_buffer 内容类似: https://myapp.local/

            WebViewWindowOptions options = {
                .title = "本地资源示例",
                .width = 800,
                .height = 600,
                .resizable = 1,
                .frame_style = "normal"
            };

            create_webview_window(url_buffer, 0, &options, NULL);
        } else {
            printf("协议服务设置失败\n");
        }
    } else {
        printf("初始化失败: %s\n", event_data ? event_data : "未知");
    }
    return NULL;
}

int main() {
    // 必须在 JadeView_init 之前注册 app-ready
    jade_on("app-ready", app_ready_callback);

    int result = JadeView_init(
        1,                      // enable_devmod
        NULL,                   // log_path
        NULL,                   // data_directory
        "我的应用",              // app_name (同时用作协议子域名)
        "com.example.myapp",    // app_signature
        0                       // single_instance
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

## 步骤 2：创建前端页面

在项目目录下创建 `web` 文件夹和 `index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>本地资源示例</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }

        /* 自定义标题栏 */
        .titlebar {
            height: 32px;
            background: #333;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-left: 12px;
            -webkit-app-region: drag;
            user-select: none;
        }
        .titlebar-controls {
            display: flex;
            height: 100%;
        }
        .titlebar-btn {
            -webkit-app-region: no-drag;
            width: 46px;
            height: 100%;
            border: none;
            background: transparent;
            color: #fff;
            cursor: pointer;
            font-size: 14px;
        }
        .titlebar-btn:hover { background: #555; }
        .titlebar-btn.close:hover { background: #e81123; }

        .content {
            flex: 1;
            padding: 20px;
            background: #f5f5f5;
        }
        .btn {
            padding: 8px 16px;
            background: #333;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .btn:hover { background: #555; }
    </style>
</head>
<body>
    <div class="titlebar">
        <span>本地资源示例</span>
        <div class="titlebar-controls">
            <button class="titlebar-btn" id="minBtn">─</button>
            <button class="titlebar-btn" id="maxBtn">□</button>
            <button class="titlebar-btn close" id="closeBtn">✕</button>
        </div>
    </div>

    <div class="content">
        <h1>JadeView 本地资源</h1>
        <p>这个页面通过自定义协议从本地文件系统加载。</p>
        <button class="btn" id="testBtn">发送测试消息</button>
        <pre id="result"></pre>
    </div>

    <script>
        // 窗口控制 —— 通过 jade.invoke 发送命令到主进程
        document.getElementById('minBtn').onclick = () => {
            jade.invoke('minimize-window');
        };
        document.getElementById('maxBtn').onclick = () => {
            jade.invoke('toggle-maximize');
        };
        document.getElementById('closeBtn').onclick = () => {
            jade.invoke('close-window');
        };

        // 测试 IPC 通信
        document.getElementById('testBtn').onclick = async () => {
            try {
                const result = await jade.invoke('test-message',
                    { text: 'Hello from page!', time: Date.now() });
                document.getElementById('result').textContent =
                    JSON.stringify(result, null, 2);
            } catch (e) {
                document.getElementById('result').textContent =
                    '错误: ' + e.message;
            }
        };

        // 监听主进程推送
        jade.on('host-notify', (data) => {
            console.log('主进程通知:', data);
        });
    </script>
</body>
</html>
```

---

## 自定义协议详解

### 工作原理

1. `set_protocol_service_path("./web", url_buffer, size)` 将本地目录注册到协议路由
2. 返回的 URL 格式为 `https://{app_name}.local/`
3. 当 WebView 访问 `https://myapp.local/index.html` 时，JadeView 直接从 `./web/index.html` 读取
4. 整个过程无网络通信、无端口监听，完全在应用内部完成

### 支持的文件类型

JadeView 自动根据扩展名设置正确的 MIME 类型，无需手动配置。支持：

- HTML、CSS、JavaScript
- 图片（PNG、JPG、GIF、SVG、WebP 等）
- 字体（WOFF、WOFF2、TTF 等）
- JSON、XML 等数据格式

### SPA 路由支持

协议服务内置了 SPA fallback：当请求的路径不匹配任何文件时，自动返回 `index.html`，完美支持前端框架的 History 模式路由。

---

## 与 JAPK 结合

除了本地目录，`set_protocol_service_path` 同样支持 JAPK 文件：

```c
// 加载 JAPK 文件
char url_buffer[256];
set_protocol_service_path("app.japk", url_buffer, sizeof(url_buffer));
// url_buffer → https://myapp.local/
create_webview_window(url_buffer, 0, &options, NULL);
```

JAPK 内同样使用 `jade.invoke` / `jade.on` 通信，无需额外配置。

> 更多信息：[JAPK 资源包](/docs/api/japk) | [从内存载入](/docs/api/japk-load-memory)

---

## 注意事项

1. **不是 HTTP 服务器**：`https://{appname}.local/` 不监听端口，外部浏览器无法访问
2. **`jade.invoke` 需要 CORS 白名单**（v2.1+）：如果页面不是通过协议服务加载的，需在 `WebViewSettings.cors_whitelist` 中设置允许的来源
3. **`app_name` 决定子域名**：`JadeView_init` 的 `app_name` 参数会用于生成协议 URL 的域名
4. **页面路径映射**：`https://myapp.local/css/style.css` → `./web/css/style.css`

> 详细 API：[核心 API - 本地协议服务](/docs/api#本地协议服务) | [前端通信 API](/docs/api/javascript-api)