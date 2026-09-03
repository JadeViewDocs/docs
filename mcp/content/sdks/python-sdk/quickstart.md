---
order: 1
---

# 快速开始

本指南将帮助您快速了解如何使用 JadeUI Python SDK 创建桌面应用。

## 环境要求

- Python 3.7+
- Windows 10/11 + WebView2 Runtime
- Windows 支持 x86 / x64 / arm64；官方 JadeView 暂未提供 Linux / macOS 原生库

## 安装

通过 pip 安装 JadeUI Python SDK：

```bash
pip install jadeui
```

## 基本使用

### 创建第一个应用

```python
from jadeui import JadeUIApp, Window

# 创建应用实例 (单例模式)
app = JadeUIApp()

@app.on_ready
def on_ready():
    # 创建窗口
    window = Window(
        title="Hello JadeUI",
        width=800,
        height=600,
        url="https://example.com"
    )
    window.show()

# 运行应用
app.run()
```

### 使用本地服务器

通过 `LocalServer` 托管本地 Web 内容：

```python
from jadeui import JadeUIApp, Window, LocalServer

app = JadeUIApp()
server = LocalServer()

@app.on_ready
def on_ready():
    # 启动本地服务器，托管 web 目录（默认）
    url = server.start("myapp")
    # 或指定目录: server.start("myapp", "./web")
    
    window = Window(
        title="My App",
        width=1024,
        height=768,
        url=f"{url}/index.html"
    )
    window.show()

app.initialize()
app.run()
```

### 简化 API

对于简单应用，可以使用更简洁的方式：

```python
from jadeui import Window, Theme, Backdrop

# 创建窗口
window = Window(
    title="本地应用示例",
    width=800,
    height=600,
    remove_titlebar=True,
    transparent=True,
    theme=Theme.SYSTEM,
)

# 设置窗口属性
window.set_backdrop(Backdrop.MICA)

# 运行 - 自动检测 web 目录并启动服务器
window.run()
```

:::success{title="提示"}
`window.run()` 会自动检测当前目录下的 `web` 目录，启动本地服务器，并注册窗口操作处理器。适合快速开发简单应用。
:::

### IPC 通信

使用 `IPCManager` 实现 Python 后端与 Web 前端的双向通信：

```python
from jadeui import JadeUIApp, Window, IPCManager

app = JadeUIApp()
ipc = IPCManager()

# 注册 IPC 消息处理器
@ipc.on("greet")
def handle_greet(window_id, message):
    print(f"收到消息: {message}")
    # jade.invoke 会直接收到这个返回值
    return f"Hello from Python! You said: {message}"

@app.on_ready
def on_ready():
    window = Window(title="IPC Demo", url="...")
    window.show()

app.initialize()
app.run()
```

前端 JavaScript 代码：

```javascript
// 发送消息到 Python，并等待返回值
const result = await jade.invoke('greet', 'Hello from JavaScript!');
console.log('收到响应:', result);

// 接收 Python 主动推送
jade.on('response', function(content) {
    console.log('收到推送:', content);
});
```

:::warning{title="IPC 大小限制"}
单次 `jade.invoke` payload 建议控制在 `1000KB` 以内；精确 `1MiB` payload 加上 IPC 封装后会超过原生 bridge 上限并被拒绝，更大的内容请使用分片、临时文件或资源 URL。
:::

### 使用路由系统

`Router` 提供后端主导的路由系统，自动生成带侧边栏的应用框架：

```python
from jadeui import JadeUIApp, Router, Events
import json

app = JadeUIApp()
router = Router()

# 注册页面路由
router.page("/", "pages/home.html", title="首页", icon="🏠")
router.page("/dashboard", "pages/dashboard.html", title="仪表盘", icon="📊")
router.page("/users", "pages/users.html", title="用户管理", icon="👥")
router.page("/user/:id", "pages/user.html", title="用户详情", show_in_nav=False)
router.page("/settings", "pages/settings.html", title="设置", icon="⚙️")
router.page("/about", "pages/about.html", title="关于", icon="😄")

# IPC 处理器（通过 router.ipc 访问）
@router.ipc.on("get_users")
def get_users(window_id, data):
    users = [{"id": 1, "name": "张三"}, {"id": 2, "name": "李四"}]
    router.ipc.send(window_id, "get_users:response", json.dumps(users))
    return 1

@app.on_ready
def on_ready():
    # 挂载路由器，创建窗口
    window = router.mount(
        title="My App",
        web_dir="web",
        width=1100,
        height=750,
        sidebar_width=200,
        theme="system"
    )
    
    # 监听窗口事件
    window.on(Events.WINDOW_RESIZED, lambda data: print(f"窗口大小变化: {data}"))

app.initialize()
app.run()
```

## 窗口配置选项

`Window` 类支持丰富的配置选项：

```python
from jadeui import Window, Theme, Backdrop, RGBA

window = Window(
    title="配置示例",
    width=1024,
    height=768,
    url="https://example.com",
    
    # 窗口属性
    resizable=True,           # 允许调整大小
    remove_titlebar=False,    # 移除原生标题栏
    transparent=False,        # 启用透明
    always_on_top=False,      # 窗口置顶
    
    # 主题
    theme=Theme.SYSTEM,       # Light, Dark, System
    
    # 位置和大小限制
    x=-1, y=-1,               # 居中显示 (-1 表示居中)
    min_width=400,
    min_height=300,
    max_width=0,              # 0 表示无限制
    max_height=0,
    
    # 初始状态
    maximized=False,
    fullscreen=False,
    focus=True,
    hide_window=False,
    
    # 窗口控制
    maximizable=True,
    minimizable=True,
    
    # 背景颜色
    background_color=RGBA(255, 255, 255, 255),
    
    # WebView 设置
    autoplay=False,           # 允许自动播放媒体
    disable_right_click=False,
    user_agent=None,          # 自定义 User-Agent
    preload_js=None,          # 预加载 JavaScript
    allow_fullscreen=True,    # 允许页面 JS 调用全屏 API (需 Jadeui 0.2.1)
    
    # 高级选项 (v1.1+)
    borderless=False,         # 无边框模式 (需 0.2.1+)
    content_protection=False, # 内容保护，防止截屏 (需 1.1+，与 minimizable/maximizable 冲突)
    
    # PostMessage 通信 (需 1.0.2+)
    postmessage_whitelist="https://example.com,https://trusted.com",  # 允许接收 PostMessage 的源

    # v2.3 窗口集成
    skip_taskbar=False,      # 不进任务栏 / Alt-Tab
    no_activate=False,       # 显示或点击时不抢焦点
)
```

:::warning{title="参数冲突说明"}
- `borderless=True` 不能与 `remove_titlebar` 或 `transparent` 同时使用
- `content_protection=True` 不能与 `minimizable` 或 `maximizable` 同时使用
:::

## 事件处理

### 应用事件

```python
@app.on_ready
def on_ready():
    print("应用已就绪")

@app.on_window_all_closed
def on_all_closed():
    print("所有窗口已关闭")
```

### 窗口事件

推荐使用类型化的事件装饰器，提供 IDE 类型提示：

```python
from jadeui import Window

window = Window(title="Event Demo")

# 监听窗口大小变化 - 参数已自动解析
@window.on_resized
def on_resize(width: int, height: int):
    print(f"窗口大小变化: {width} x {height}")

# 监听窗口移动
@window.on_moved
def on_move(x: int, y: int):
    print(f"窗口位置: ({x}, {y})")

# 监听焦点事件
@window.on_focused
def on_focus():
    print("窗口获得焦点")

@window.on_blurred
def on_blur():
    print("窗口失去焦点")

# 监听页面加载完成
@window.on_page_loaded
def on_page_load(url: str):
    print(f"页面加载完成: {url}")

# 监听窗口即将关闭 - 返回 True 可阻止关闭
@window.on_closing
def on_closing():
    if has_unsaved_changes:
        return True  # 阻止关闭
    return False

# 监听文件拖放
@window.on_file_dropped
def on_file_drop(files: list, x: int, y: int):
    print(f"拖放了 {len(files)} 个文件到位置 ({x}, {y})")
    for path in files:
        print(f"  - {path}")

# 监听文件下载事件（需要 JadeView 0.3.1+）
@window.on_download_started
def on_download(url: str, filename: str):
    print(f"开始下载: {filename}")
    print(f"下载地址: {url}")
    # 返回 True 可阻止下载
    if filename.endswith(".exe"):
        print("阻止下载可执行文件")
        return True
    return False

# 监听全屏状态变化（需要 JadeView 1.2+）
@window.on_fullscreen_changed
def on_fullscreen(is_fullscreen: bool):
    print(f"全屏状态: {is_fullscreen}")

window.show()
```

也可以使用 `Events` 常量：

```python
from jadeui import Window, Events

window = Window(title="Event Demo")

# 参数已自动解析，不需要 json.loads
@window.on(Events.WINDOW_RESIZED)
def on_resize(width: int, height: int):
    print(f"窗口大小变化: {width} x {height}")

@window.on(Events.WINDOW_MOVED)
def on_move(x: int, y: int):
    print(f"窗口位置: ({x}, {y})")

window.show()
```

:::warning{title="file-drop 事件注意"}
使用 `file-drop` 事件会接管 WebView 的拖拽事件处理，**导致前端无法收到原生拖拽事件**。如果您需要在前端使用 JavaScript 处理拖拽事件（如 `ondrop`），请不要注册此事件。
:::

### 文件下载事件

使用 `on_download_started` 装饰器监听 WebView 中的文件下载事件（需要 JadeView 0.3.1+）：

```python
from jadeui import Window

window = Window(title="Download Demo")

@window.on_download_started
def on_download(url: str, filename: str):
    """
    下载开始时触发
    
    参数:
        url: 下载文件的 URL
        filename: 建议的文件名
    
    返回:
        True/1: 阻止下载
        False/0/None: 允许下载（默认行为）
    """
    print(f"下载请求: {filename}")
    print(f"来源: {url}")
    
    # 示例：阻止可执行文件下载
    if filename.endswith((".exe", ".msi", ".bat")):
        print("已阻止可执行文件下载")
        return True
    
    # 示例：阻止来自不信任域名的下载
    if "untrusted-site.com" in url:
        return True
    
    return False  # 允许下载

window.show()
```

:::success{title="版本要求"}
`on_download_started` 事件需要 JadeView DLL 0.3.1 或更高版本。请确保您的 DLL 版本符合要求。
:::

## 窗口操作

```python
window = Window(title="My App")
window.show()

# 窗口状态控制
window.minimize()           # 最小化
window.maximize()           # 最大化/还原
window.focus()              # 获取焦点
window.hide()               # 隐藏
window.close()              # 关闭

# 全屏控制 (需要 JadeView Jadeui 0.2.1)
window.set_fullscreen(True)   # 进入全屏
window.set_fullscreen(False)  # 退出全屏
window.toggle_fullscreen()    # 切换全屏状态
print(window.is_fullscreen)   # 查询全屏状态
print(window.is_maximized)    # 查询最大化状态

# 属性设置
window.set_title("New Title")
window.set_size(1280, 720)
window.set_position(100, 100)
window.center()
window.set_always_on_top(True)
window.set_skip_taskbar(True)       # v2.3: 隐藏任务栏 / Alt-Tab
window.set_no_activate(True)        # v2.3: 不抢焦点
window.set_level("topmost")         # v2.3: topmost / normal / bottom / desktop
window.set_resizable(False)
print(window.get_hwnd())            # v2.3: 普通窗口也可返回 HWND

# 主题和外观
window.set_theme(Theme.DARK)
window.set_backdrop(Backdrop.MICA)  # Windows 11 效果

# WebView 操作
window.load_url("https://example.com")
window.execute_js("console.log('Hello from Python!')")
```

## v2.3 新能力速览

### YAML 存储

`Storage` 会把数据写入 JadeView `data_directory` 下的 YAML 文件。建议在 `app.on_ready` 之后使用，确保原生层和数据目录已经就绪。

```python
from jadeui import Storage

Storage.set("settings", "user.name", "JadeUI")
Storage.set("settings", "window", {"width": 1024, "height": 768})

print(Storage.get("settings", "user.name"))
print(Storage.keys("settings", "window"))
print(Storage.length("settings", "window"))
```

### 系统集成

```python
import sys
from jadeui import System

print(System.jadeview_version())
print(System.webview_version())
print(System.get_login_autostart())
print(System.ntp_now())  # UTC 毫秒时间戳，网络失败返回 None

icon_url = System.get_file_icon(sys.executable, size=64, window_id=window.id or 0)
```

### 托盘、热键和剪贴板

```python
from jadeui import Clipboard, HotKey, Tray

Clipboard.write_text("Hello JadeUI")
print(Clipboard.read_text())

HotKey.register("Ctrl+Alt+J", lambda: window.flash(3))

tray = Tray()
tray.set_tooltip("JadeUI App")
tray.set_menu([
    {"key": "show", "label": "显示窗口", "on_click": lambda: window.show()},
    {"key": "quit", "label": "退出", "dangerous": True, "on_click": app.quit},
])
tray.show()
```

### 拖拽事件

JadeView 2.x 的底层事件名是 `drag-drop`，包含 `enter`、`over`、`drop`、`leave` 阶段；`file-drop` 仍保留为只关心最终 drop 的兼容封装。

```python
@window.on("drag-drop")
def on_drag_drop(data):
    print(data["type"], data.get("paths", []))

@window.on_file_dropped
def on_file_drop(files, x, y):
    print(files, x, y)
```

## 完整示例

以下是一个完整的应用示例：

```python
from jadeui import JadeUIApp, Window, IPCManager, LocalServer, Theme, Backdrop
import json

app = JadeUIApp()
ipc = IPCManager()
server = LocalServer()

# IPC 处理器
@ipc.on("get-data")
def handle_get_data(window_id, message):
    data = json.loads(message)
    print(f"请求数据: {data}")
    
    response = {
        "status": "success",
        "items": ["Python", "JadeUI", "WebView"]
    }
    return json.dumps(response, ensure_ascii=False)

# 窗口操作处理器
@ipc.on("windowAction")
def handle_window_action(window_id, action):
    window = Window.get_window_by_id(window_id)
    if window:
        if action == "close":
            window.close()
        elif action == "minimize":
            window.minimize()
        elif action == "maximize":
            window.maximize()
    return 1

@app.on_ready
def on_ready():
    # 启动本地服务器（默认托管 web 目录）
    url = server.start("demo")
    
    # 创建窗口
    window = Window(
        title="JadeUI Demo",
        width=1024,
        height=768,
        url=f"{url}/index.html",
        remove_titlebar=True,
        transparent=True,
        theme=Theme.SYSTEM,
    )
    
    # 使用类型化装饰器监听事件（参数已自动解析）
    @window.on_resized
    def on_resize(width: int, height: int):
        print(f"窗口大小变化: {width} x {height}")
    
    @window.on_file_dropped
    def on_file_drop(files: list, x: int, y: int):
        print(f"拖放了 {len(files)} 个文件")
        for path in files:
            print(f"  - {path}")
    
    window.show()
    window.set_backdrop(Backdrop.MICA)

if __name__ == "__main__":
    app.initialize()
    app.run()
```

## 对话框 API

使用 `Dialog` 类显示系统对话框（需要 JadeView 1.3.0+）：

```python
from jadeui import Dialog

# 显示消息框
Dialog.show_message_box(
    window_id=1,
    title="确认",
    message="确定要删除吗？",
    type_="warning",
    buttons=["删除", "取消"]
)

# 打开文件对话框
Dialog.show_open_dialog(
    window_id=1,
    title="选择图片",
    filters=[{"name": "图片", "extensions": ["png", "jpg", "gif"]}],
    properties=["openFile", "multiSelections"]
)

# 保存文件对话框
Dialog.show_save_dialog(
    window_id=1,
    title="保存文档",
    default_path="document.txt",
    filters=[{"name": "文本文件", "extensions": ["txt"]}]
)

# 便捷方法
Dialog.confirm("确定要退出吗？")
Dialog.alert("操作成功！")
Dialog.error("文件保存失败！")
```

## 系统通知

使用 `Notification` 类显示系统通知（需要 JadeView 1.3.0+，仅 Windows 10+）：

```python
from jadeui import Notification, Events

# 配置应用信息（可选）
Notification.config(app_name="我的应用", icon="C:/app/icon.ico")

# 监听按钮点击事件
@Notification.on(Events.NOTIFICATION_ACTION)
def on_action(data):
    action_id = data.get("arguments")  # 你传入的 action 参数
    button = data.get("action")        # 按钮索引
    print(f"按钮点击: {button}, 动作: {action_id}")

# 显示简单通知
Notification.show("提示", "操作已完成")

# 显示带按钮的通知
Notification.with_buttons(
    "下载完成",
    "video.mp4 已下载",
    "打开",
    "忽略",
    action="download_123"  # 用于在回调中识别
)

# 便捷方法
Notification.info("标题", "内容")
Notification.success("标题", "内容")
Notification.warning("标题", "内容")
Notification.error("标题", "内容")
```

## 下一步

- 查看 [API 参考](./reference/methods) 了解详细的 API 文档
- 学习 [应用打包](./packaging) 将应用打包成独立的 .exe 文件
- 探索 `Router` 类构建复杂的多页面应用
- 学习使用 Windows 11 的 Mica/Acrylic 效果
