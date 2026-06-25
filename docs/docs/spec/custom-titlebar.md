---
title: 自定义标题栏
order: 2
group:
  title: "教程"
  order: 1
---

# 自定义标题栏

JadeView 2.0 提供两种自定义标题栏的方式：

1. **`title-overlay`**：使用内置标题栏按钮覆盖层（Windows 专属，每个按钮宽度 45 像素，高度默认 32 像素）
2. **`no-titlebar`**：完全自定义绘制标题栏和按钮

---

## 方法一：使用 title-overlay（推荐）

`title-overlay` 是 Windows 专属的边框样式，提供系统级标题栏按钮（最小化/最大化/关闭），每个按钮宽度 45 像素、高度默认 32 像素，无需自己实现。

### C 代码示例

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

int app_ready_callback(uint32_t window_id, const char* event_type, const char* event_data) {
  if (window_id == 1 && event_data && strcmp(event_data, "success") == 0) {
    // 创建窗口
    WebViewWindowOptions options = {
      .title = "自定义标题栏示例",
      .width = 800,
      .height = 600,
      .resizable = 1,
      .frame_style = "title-overlay",  // 使用内置标题栏按钮
      .theme = "System",
    };

    uint32_t new_window_id = create_webview_window(
      "https://your-app.local",
      0,
      &options,
      NULL
    );

    // 可选：自定义标题栏覆盖层样式
    set_titlebar_overlay_style(
      new_window_id,
      32,            // 按钮高度
      "#ffffff",    // 图标颜色
      "#f0f0f0"     // 悬浮背景色
    );
  }
  return 0;
}

int main() {
  jade_on("app-ready", app_ready_callback);
  JadeView_init(1, NULL, NULL, "我的应用", "com.example.myapp", 0);
  return 0;
}
```

### 前端 HTML/CSS 适配

使用 `title-overlay` 时，页面需要留出标题栏区域，避免按钮覆盖内容：

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* 标题栏区域 - 高度与 set_titlebar_overlay_style 一致 */
    body {
      margin: 0;
      padding: 0;
    }
    .titlebar {
      height: 32px;
      -webkit-app-region: drag; /* 允许拖拽移动窗口 */
      display: flex;
      align-items: center;
      padding: 0 16px;
      background: #2d2d2d;
      color: #fff;
    }

  </style>
</head>
<body>
  <div class="titlebar">
    <span>我的应用</span>
  </div>

  <div class="content">
    页面内容...
  </div>
</body>
</html>
```

---

## 方法二：使用 no-titlebar 完全自定义

`no-titlebar` 模式下，需要自己实现完整的标题栏和窗口控制按钮。

### C 代码示例

```c
#include <stdio.h>
#include <string.h>
#include "jadeview.h"

int app_ready_callback(uint32_t window_id, const char* event_type, const char* event_data) {
  if (window_id == 1 && event_data && strcmp(event_data, "success") == 0) {
    // 创建无边框窗口
    WebViewWindowOptions options = {
      .title = "完全自定义标题栏",
      .width = 800,
      .height = 600,
      .resizable = 1,
      .frame_style = "no-titlebar",  // 无边框无标题栏
      .theme = "System",
    };

    uint32_t new_window_id = create_borderless_webview_window(
      "https://your-app.local",
      NULL
    );

    // 获取 HWND 用于额外的 Win32 操作
    size_t hwnd = get_window_hwnd(new_window_id);
  }
  return 0;
}

int main() {
  jade_on("app-ready", app_ready_callback);
  JadeView_init(1, NULL, NULL, "我的应用", "com.example.myapp", 0);
  return 0;
}
```

### 前端完整自定义标题栏

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      overflow: hidden;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* 标题栏 */
    .titlebar {
      height: 32px;
      background: #2d2d2d;
      display: flex;
      align-items: center;
      justify-content: space-between;
      -webkit-app-region: drag;
      user-select: none;
    }

    .titlebar-title {
      padding: 0 16px;
      color: #fff;
      font-size: 14px;
    }

    /* 窗口控制按钮 */
    .titlebar-controls {
      display: flex;
      height: 100%;
    }

    .titlebar-btn {
      -webkit-app-region: no-drag;
      width: 46px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      cursor: pointer;
      transition: background 0.2s;
    }

    .titlebar-btn:hover {
      background: #404040;
    }

    .titlebar-btn.close:hover {
      background: #e81123;
    }

    /* 内容区域 */
    .content {
      flex: 1;
      overflow: auto;
      background: #fff;
    }
  </style>
</head>
<body>
  <!-- 自定义标题栏 -->
  <div class="titlebar">
    <div class="titlebar-title">我的应用</div>
    <div class="titlebar-controls">
      <div class="titlebar-btn" id="minBtn">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="0" y="5" width="12" height="2" fill="currentColor"/>
        </svg>
      </div>
      <div class="titlebar-btn" id="maxBtn">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="1" y="1" width="10" height="10" stroke="currentColor" stroke-width="1.5" fill="none"/>
        </svg>
      </div>
      <div class="titlebar-btn close" id="closeBtn">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.5"/>
          <line x1="2" y1="10" x2="10" y2="2" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </div>
    </div>
  </div>

  <div class="content">
    页面内容...
  </div>

  <script>
    // 窗口控制 - 通过 jade.invoke 发送命令到主进程
    document.getElementById('minBtn').onclick = () => {
      jade.invoke('minimize-window');
    };

    document.getElementById('maxBtn').onclick = () => {
      jade.invoke('toggle-maximize');
    };

    document.getElementById('closeBtn').onclick = () => {
      jade.invoke('close-window');
    };
  </script>
</body>
</html>
```

### 主进程侧：注册窗口控制命令

渲染进程通过 `jade.invoke` 发送命令后，主进程需要用 `register_ipc_handler` 注册对应的回调函数：

```c
// 窗口控制回调
const char* minimize_callback(uint32_t window_id, const char* event_data) {
    minimize_window(window_id);
    return jade_text_create("{\"ok\":true}");
}

const char* toggle_maximize_callback(uint32_t window_id, const char* event_data) {
    toggle_maximize_window(window_id);
    return jade_text_create("{\"ok\":true}");
}

const char* close_callback(uint32_t window_id, const char* event_data) {
    close_window(window_id);
    return jade_text_create("{\"ok\":true}");
}

// 在 app-ready 回调中注册
int app_ready_callback(uint32_t window_id, const char* event_type,
                       const char* event_data) {
    if (window_id == 1 && event_data
        && strcmp(event_data, "success") == 0) {
        // 注册窗口控制命令
        register_ipc_handler("minimize-window", minimize_callback);
        register_ipc_handler("toggle-maximize", toggle_maximize_callback);
        register_ipc_handler("close-window", close_callback);

        // ... 创建窗口 ...
    }
    return 0;
}
```

---

## 两种方法对比

| 特性 | `title-overlay` | `no-titlebar` |
|------|-----------------|---------------|
| **适用平台** | 仅 Windows | 全平台 |
| **标题栏按钮** | 内置（系统样式） | 需自己实现 |
| **开发难度** | 简单 | 中等 |
| **样式自定义** | 可部分自定义 | 完全自定义 |
| **拖拽区域** | 需要 `-webkit-app-region` | 需要 `-webkit-app-region` |
| **获取 HWND** | 不支持 | 支持（需用 `create_borderless_webview_window`） |
| **原生 Windows 特性** | ✅ 完整保留 Snap Layout 等 | ⚠️ 需自行实现 |

### 选择建议

- 如果只是想简单隐藏标题栏文字，或使用系统样式按钮 → 用 `title-overlay`
- 如果需要完整保留 Windows 原生特性（Snap Layout、窗口贴靠等）→ 用 `title-overlay`
- 如果需要完全自定义标题栏外观，或需要 Win32 API 操作 → 用 `no-titlebar`

---

## `-webkit-app-region` 说明

两种方式都可以使用 `-webkit-app-region` 实现拖拽：

| 属性 | 说明 |
|------|------|
| `drag` | 该区域可拖拽移动窗口 |
| `no-drag` | 该区域不可拖拽（用于按钮等交互元素） |

## 注意事项

1. **交互元素**：标题栏内的按钮、链接、输入框必须设置 `no-drag`，否则无法点击
2. **双击行为**：双击可拖拽区域会触发最大化/还原（系统行为）
3. **`title-overlay`**：Windows 专属，无需自己实现标题栏按钮
4. **`no-titlebar` + `create_borderless_webview_window`**：可获取 HWND 用于 Win32 API
