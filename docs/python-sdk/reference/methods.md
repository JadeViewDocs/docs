---
order: 0
group:
  title: "API 参考"
  order: 3
---

# API 参考

JadeUI Python SDK 提供了一套完整的 API 用于创建桌面应用。本文档详细介绍各个类和方法。

## JadeUIApp

主应用类，管理应用生命周期。采用单例模式。

### 构造函数

```python
app = JadeUIApp()
```

### 方法

#### initialize()

初始化应用。

```python
app.initialize(
    enable_dev_tools=False,  # 是否启用开发者工具 (F12)
    log_file=None,           # 日志文件路径
    data_directory=None,     # WebView 数据目录
    app_name=None,           # 应用名称 (JadeView 2.x)
    app_signature=None,      # 应用签名，占位值至少 6 个字符 (JadeView 2.x)
    single_instance=False,   # 单实例模式 (JadeView 2.x)
)
```

| 参数 | 类型 | 描述 |
|------|------|------|
| enable_dev_tools | bool | 启用开发者工具 |
| log_file | str \| None | 日志文件路径 |
| data_directory | str \| None | WebView 数据存储目录 |
| app_name | str \| None | 应用名称；未传入时 SDK 自动生成 |
| app_signature | str \| None | 应用签名；JadeView 2.x 要求非空且 trim 后不少于 6 个字符，SDK 会自动补足缺省值 |
| single_instance | bool | 是否启用单实例模式 |

**返回值**: `JadeUIApp` (支持链式调用)

#### run()

启动应用消息循环。此方法会阻塞直到所有窗口关闭。

```python
app.run()
```

#### quit()

退出应用。

```python
app.quit()
```

#### is_ready()

检查应用是否已初始化。

```python
if app.is_ready():
    print("应用已就绪")
```

**返回值**: `bool`

#### get_webview_version()

获取 WebView 引擎版本。

```python
version = app.get_webview_version()
print(f"WebView 版本: {version}")  # 例如: "120.0.2210.144"
```

**返回值**: `str | None` - WebView 版本字符串，如果不可用则返回 `None`

### 装饰器

#### @on_ready

注册应用就绪事件处理器。

```python
@app.on_ready
def setup():
    window = Window("My App")
    window.show()
```

#### @on_window_all_closed

注册所有窗口关闭事件处理器。

```python
@app.on_window_all_closed
def cleanup():
    print("所有窗口已关闭")
```

### 事件

| 事件名 | 描述 |
|--------|------|
| ready | 应用初始化完成 |
| error | 发生错误 |
| window-all-closed | 所有窗口关闭 |
| before-quit | 应用即将退出 |

---

## Window

WebView 窗口类，用于创建和管理窗口。

### 构造函数

```python
window = Window(
    title="Window",          # 窗口标题
    width=800,               # 宽度
    height=600,              # 高度
    url=None,                # 初始 URL
    **options                # 其他选项
)
```

### 窗口选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| resizable | bool | True | 允许调整大小 |
| remove_titlebar | bool | False | 移除原生标题栏 |
| transparent | bool | False | 启用窗口透明 |
| background_color | RGBA | (255,255,255,255) | 背景颜色 |
| always_on_top | bool | False | 窗口置顶 |
| theme | str | "System" | 主题 (Light/Dark/System) |
| maximized | bool | False | 初始最大化 |
| maximizable | bool | True | 允许最大化 |
| minimizable | bool | True | 允许最小化 |
| x | int | -1 | X 坐标 (-1 居中) |
| y | int | -1 | Y 坐标 (-1 居中) |
| min_width | int | 0 | 最小宽度 |
| min_height | int | 0 | 最小高度 |
| max_width | int | 0 | 最大宽度 (0 无限制) |
| max_height | int | 0 | 最大高度 (0 无限制) |
| fullscreen | bool | False | 全屏模式 |
| focus | bool | True | 创建时获取焦点 |
| hide_window | bool | False | 创建时隐藏 |
| use_page_icon | bool | True | 使用页面图标 |
| frame_style | str \| None | None | JadeView 2.x 窗口框架样式：`normal` / `no-titlebar` / `borderless` / `title-overlay` |
| auto_save_state | bool | False | 自动保存窗口状态 |
| skip_taskbar | bool | False | v2.3：不显示在任务栏 / Alt-Tab |
| no_activate | bool | False | v2.3：显示或点击时不抢焦点 |
| autoplay | bool | False | 允许媒体自动播放 |
| disable_right_click | bool | False | 禁用右键菜单 |
| user_agent | str \| None | None | 自定义 User-Agent |
| preload_js | str \| None | None | 预加载 JavaScript |
| allow_fullscreen | bool | True | 允许页面 JS 调用全屏 API (需 Jadeui 0.2.1) |
| borderless | bool | False | 无边框模式，移除边框和系统阴影 (需 0.2.1+) |
| content_protection | bool | False | 内容保护，防止截屏/录屏 (需 1.1+) |
| postmessage_whitelist | str \| None | None | PostMessage 白名单，逗号分隔的源地址 (需 1.0.2+) |

:::warning{title="参数冲突说明"}
- **borderless**: `borderless=True` 不能与 `remove_titlebar` 或 `transparent` 同时使用，否则会抛出 `ValueError`。这是因为 `borderless` 会移除边框和系统阴影，与后两者功能冲突。
- **content_protection**: `content_protection=True` 不能与 `minimizable` 或 `maximizable` 同时使用。启用内容保护时，窗口将无法最小化和最大化。
:::

### 生命周期方法

#### show()

显示窗口。

```python
window.show(url=None)  # 可选传入 URL
```

**返回值**: `Window` (链式调用)

#### hide()

隐藏窗口。

```python
window.hide()
```

**返回值**: `Window`

#### close()

关闭窗口。

```python
window.close()
```

#### focus()

使窗口获取焦点。

```python
window.focus()
```

**返回值**: `Window`

### 状态控制方法

#### minimize()

最小化窗口。

```python
window.minimize()
```

**返回值**: `Window`

#### maximize()

切换最大化/还原状态。

```python
window.maximize()
```

**返回值**: `Window`

#### restore()

从最小化/最大化状态还原。

```python
window.restore()
```

**返回值**: `Window`

#### set_fullscreen()

设置全屏模式。

:::info{title="版本要求"}
此功能需要 Jadeui 0.2.1 或更高版本。
:::

```python
window.set_fullscreen(True)   # 进入全屏
window.set_fullscreen(False)  # 退出全屏
```

| 参数 | 类型 | 描述 |
|------|------|------|
| fullscreen | bool | 是否全屏 |

**返回值**: `Window`

#### toggle_fullscreen()

切换全屏模式。如果当前是全屏则退出，否则进入全屏。

:::info{title="版本要求"}
此功能需要 Jadeui 0.2.1 或更高版本。
:::

```python
window.toggle_fullscreen()
```

**返回值**: `Window`

### 属性方法

#### set_title()

设置窗口标题。

```python
window.set_title("New Title")
# 或使用属性
window.title = "New Title"
```

**返回值**: `Window`

#### set_size()

设置窗口大小。

```python
window.set_size(1280, 720)
```

| 参数 | 类型 | 描述 |
|------|------|------|
| width | int | 宽度 (像素) |
| height | int | 高度 (像素) |

**返回值**: `Window`

#### set_min_size()

设置最小窗口大小。

```python
window.set_min_size(400, 300)
```

**返回值**: `Window`

#### set_max_size()

设置最大窗口大小。

```python
window.set_max_size(1920, 1080)  # 0 表示无限制
```

**返回值**: `Window`

#### set_position()

设置窗口位置。

```python
window.set_position(100, 100)
```

| 参数 | 类型 | 描述 |
|------|------|------|
| x | int | X 坐标 |
| y | int | Y 坐标 |

**返回值**: `Window`

#### center()

将窗口居中显示。

```python
window.center()
```

**返回值**: `Window`

#### set_visible()

设置窗口可见性。

```python
window.set_visible(True)
window.set_visible(False)
```

**返回值**: `Window`

#### set_always_on_top()

设置窗口置顶。

```python
window.set_always_on_top(True)
```

**返回值**: `Window`

#### set_resizable()

设置是否可调整大小。

```python
window.set_resizable(False)
```

**返回值**: `Window`

#### set_skip_taskbar()

设置窗口是否不显示在任务栏 / Alt-Tab 中。需要 JadeView 2.3+。

```python
window.set_skip_taskbar(True)
window.set_skip_taskbar(False)
```

**返回值**: `Window`

#### set_no_activate()

设置窗口显示或点击时是否不抢焦点。需要 JadeView 2.3+。

```python
window.set_no_activate(True)
window.set_no_activate(False)
```

**返回值**: `Window`

#### set_level()

设置窗口层级。需要 JadeView 2.3+。

```python
window.set_level("topmost")  # topmost / normal / bottom / desktop
```

| 参数 | 类型 | 描述 |
|------|------|------|
| level | str | `topmost`、`normal`、`bottom` 或 `desktop` |

**返回值**: `Window`

### 主题方法

#### set_theme()

设置窗口主题。

```python
from jadeui import Theme

window.set_theme(Theme.LIGHT)  # 浅色
window.set_theme(Theme.DARK)   # 深色
window.set_theme(Theme.SYSTEM) # 跟随系统
```

**返回值**: `Window`

#### get_theme()

获取当前主题。

```python
theme = window.get_theme()
```

**返回值**: `str`

#### set_backdrop()

设置窗口背景材料 (Windows 11)。

```python
from jadeui import Backdrop

window.set_backdrop(Backdrop.MICA)     # Mica 效果
window.set_backdrop(Backdrop.MICA_ALT) # Mica Alt 效果
window.set_backdrop(Backdrop.ACRYLIC)  # Acrylic 效果
```

:::info
窗口必须设置 `transparent=True` 才能使用 backdrop 效果。
:::

**返回值**: `Window`

### WebView 方法

#### load_url() / navigate()

导航到 URL。

```python
window.load_url("https://example.com")
# 或
window.navigate("https://example.com")
```

**返回值**: `Window`

#### execute_js() / eval()

执行 JavaScript 代码。

```python
window.execute_js("console.log('Hello!')")
# 或
window.eval("document.title = 'New Title'")
```

**返回值**: `Window`

#### reload()

重新加载当前页面。

```python
window.reload()
```

**返回值**: `Window`

### 状态属性

| 属性 | 类型 | 描述 |
|------|------|------|
| id | int \| None | 窗口 ID |
| title | str | 窗口标题 |
| size | tuple[int, int] | 窗口大小 (width, height) |
| position | tuple[int, int] | 窗口位置 (x, y) |
| is_visible | bool | 是否可见 |
| is_maximized | bool | 是否最大化 (需 Jadeui 0.2.1) |
| is_minimized | bool | 是否最小化 |
| is_focused | bool | 是否获得焦点 |
| is_fullscreen | bool | 是否全屏 (需 Jadeui 0.2.1) |

### 原生句柄

#### get_hwnd()

获取窗口的原生 HWND。JadeView 2.3 起，普通 `create_webview_window` 创建的窗口也可返回有效句柄。

```python
hwnd = window.get_hwnd()
```

**返回值**: `int`

### 静态方法

#### get_window_count()

获取活动窗口数量。

```python
count = Window.get_window_count()
```

#### get_window_by_id()

通过 ID 获取窗口。

```python
window = Window.get_window_by_id(1)
```

#### get_id_from_hwnd()

根据原生 HWND 反查 JadeView window id。需要 JadeView 2.3+。

```python
window_id = Window.get_id_from_hwnd(hwnd)
```

#### get_all_windows()

获取所有活动窗口。

```python
windows = Window.get_all_windows()
```

### 事件

Window 类提供两种事件监听方式：**类型化装饰器**（推荐）和 **Events 常量**。

事件参数已自动解析，不需要手动 `json.loads`。

#### 类型化事件装饰器（推荐）

提供 IDE 类型提示，参数已自动解析：

| 装饰器 | 回调签名 | 描述 |
|--------|----------|------|
| `@window.on_resized` | `(width: int, height: int)` | 窗口大小改变 |
| `@window.on_moved` | `(x: int, y: int)` | 窗口位置改变 |
| `@window.on_focused` | `()` | 窗口获得焦点 |
| `@window.on_blurred` | `()` | 窗口失去焦点 |
| `@window.on_closing` | `() -> bool` | 窗口即将关闭，返回 True 阻止 |
| `@window.on_state_changed` | `(is_maximized: bool)` | 窗口状态改变 |
| `@window.on_fullscreen_changed` | `(is_fullscreen: bool)` | 全屏状态改变 (需 1.2+) |
| `@window.on_file_dropped` | `(files: List[str], x: int, y: int)` | 文件拖放 |
| `@window.on("drag-drop")` | `(data: dict)` | v2.x 底层拖拽生命周期事件，含 enter/over/drop/leave 阶段 |
| `@window.on_navigate` | `(url: str) -> bool` | 即将导航，返回 True 阻止 |
| `@window.on_page_loaded` | `(url: str)` | 页面加载完成 |
| `@window.on_title_updated` | `(title: str)` | 页面标题更新 |
| `@window.on_new_window` | `(url: str, frame_name: str) -> bool` | 新窗口请求，返回 True 阻止 |
| `@window.on_download_started` | `(url: str, filename: str) -> bool` | 下载开始，返回 True 阻止 (需 0.3.1+) |

**示例**：

```python
from jadeui import Window

window = Window(title="事件示例")

@window.on_resized
def handle_resize(width: int, height: int):
    print(f"窗口大小: {width} x {height}")

@window.on_moved
def handle_move(x: int, y: int):
    print(f"窗口位置: ({x}, {y})")

@window.on_focused
def handle_focus():
    print("窗口获得焦点")

@window.on_closing
def handle_closing():
    if has_unsaved_changes:
        return True  # 阻止关闭
    return False

@window.on_page_loaded
def handle_loaded(url: str):
    print(f"页面加载完成: {url}")

window.show()
```

#### Events 常量方式

也可以使用 `Events` 常量，参数同样已自动解析：

| 事件常量 | 事件名 | 回调参数 | 描述 |
|----------|--------|----------|------|
| `Events.WINDOW_RESIZED` | window-resized | `(width, height)` | 大小改变 |
| `Events.WINDOW_MOVED` | window-moved | `(x, y)` | 位置改变 |
| `Events.WINDOW_FOCUSED` | window-focused | `()` | 获得焦点 |
| `Events.WINDOW_BLURRED` | window-blurred | `()` | 失去焦点 |
| `Events.WINDOW_CLOSING` | window-closing | `()` | 即将关闭（返回 1 可阻止） |
| `Events.WINDOW_STATE_CHANGED` | window-state-changed | `(is_maximized,)` | 状态改变 |
| `Events.WINDOW_FULLSCREEN` | window-fullscreen | `(is_fullscreen,)` | 全屏状态改变 (需 1.2+) |
| `Events.FILE_DROP` | file-drop | `(files, x, y)` | 文件拖放 |
| `Events.WEBVIEW_WILL_NAVIGATE` | webview-will-navigate | `(url,)` | 即将导航 |
| `Events.WEBVIEW_DID_FINISH_LOAD` | webview-did-finish-load | `(url,)` | 加载完成 |
| `Events.WEBVIEW_NEW_WINDOW` | webview-new-window | `(url, frame_name)` | 新窗口请求 |
| `Events.WEBVIEW_PAGE_TITLE_UPDATED` | webview-page-title-updated | `(title,)` | 标题更新 |
| `Events.FAVICON_UPDATED` | favicon-updated | `(favicon,)` | 图标更新 |
| `Events.WEBVIEW_DOWNLOAD_STARTED` | webview-download-started | `(url, filename)` | 下载开始 (需 0.3.1+) |

**示例**：

```python
from jadeui import Window, Events

window = Window(title="事件示例")

# 参数已自动解析，不需要 json.loads
@window.on(Events.WINDOW_RESIZED)
def on_resize(width: int, height: int):
    print(f"窗口大小: {width} x {height}")

@window.on(Events.WEBVIEW_DID_FINISH_LOAD)
def on_page_load(url: str):
    print(f"页面加载完成: {url}")

window.show()
```

#### 内部事件

| 事件名 | 回调参数 | 描述 |
|--------|----------|------|
| created | Window | 窗口创建完成 |
| closed | - | 窗口已关闭 |
| page-loaded | url, status | 页面加载完成 |

#### drag-drop / file-drop 事件详解

JadeView 2.x 底层事件名为 `drag-drop`，会在 `enter`、`over`、`drop`、`leave` 阶段触发。SDK 仍保留 `file-drop` / `on_file_dropped` 作为兼容封装，只在最终 drop 阶段触发。

**回调参数**：

| 参数 | 类型 | 描述 |
|------|------|------|
| files | List[str] | 拖放的文件路径列表 |
| x | int | 拖放位置的 X 坐标 |
| y | int | 拖放位置的 Y 坐标 |

**示例**：

```python
from jadeui import Window

window = Window(title="文件拖放示例")

@window.on_file_dropped
def on_file_drop(files: list, x: int, y: int):
    print(f"拖放了 {len(files)} 个文件到位置 ({x}, {y})")
    for file_path in files:
        print(f"  - {file_path}")

window.show()
```

```python
@window.on("drag-drop")
def on_drag_drop(data):
    print(data["type"], data.get("paths", []))
    # JadeView 2.3 起，enter/drop 阶段返回 True 或非空字符串可同步拦截/消费
    return False
```

:::warning{title="注意"}
使用 `file-drop` 事件会接管 WebView 的拖拽事件处理，**导致前端无法收到原生拖拽事件**。如果您需要在前端处理拖拽事件，请不要注册此事件。
:::

#### download-started 事件详解

`webview-download-started` 事件在 WebView 中开始下载文件时触发。

:::info{title="版本要求"}
此事件需要 JadeView DLL 0.3.1 或更高版本。
:::

**回调参数**：

| 参数 | 类型 | 描述 |
|------|------|------|
| url | str | 下载文件的 URL |
| filename | str | 建议的文件名 |

**返回值**：
- 返回 `True` 或 `1`：阻止下载
- 返回 `False`、`0` 或 `None`：允许下载（默认行为）

**示例**：

```python
from jadeui import Window

window = Window(title="下载事件示例")

@window.on_download_started
def on_download(url: str, filename: str):
    print(f"下载请求: {filename}")
    print(f"来源: {url}")
    
    # 阻止可执行文件下载
    if filename.endswith((".exe", ".msi", ".bat")):
        print("已阻止可执行文件下载")
        return True
    
    # 阻止来自不信任域名的下载
    if "untrusted-site.com" in url:
        return True
    
    return False  # 允许下载

window.show()
```

---

## IPCManager

IPC 通信管理器，处理 Python 后端与 Web 前端的通信。

### 构造函数

```python
ipc = IPCManager()
```

### 方法

#### register_handler()

注册消息处理器。

```python
def handler(window_id: int, message: str) -> int:
    print(f"收到: {message}")
    return 1

ipc.register_handler("channel-name", handler)
```

| 参数 | 类型 | 描述 |
|------|------|------|
| channel | str | 通道名称 |
| handler | Callable | 处理函数 |

#### send()

发送消息到窗口。

```python
ipc.send(window_id, "channel-name", "message content")
```

| 参数 | 类型 | 描述 |
|------|------|------|
| window_id | int | 目标窗口 ID |
| channel | str | 通道名称 |
| message | str | 消息内容 |

#### remove_handler()

移除消息处理器。

```python
ipc.remove_handler("channel-name")
```

#### list_handlers()

列出所有注册的通道。

```python
channels = ipc.list_handlers()
```

**返回值**: `list[str]`

### 装饰器

#### @on()

装饰器方式注册处理器。

```python
@ipc.on("greet")
def handle_greet(window_id, message):
    print(f"收到: {message}")
    ipc.send(window_id, "response", "Hello!")
    return 1
```

---

## LocalServer

本地 HTTP 服务器，用于托管 Web 内容。

### 构造函数

```python
server = LocalServer()
```

### 方法

#### start()

启动服务器。

```python
url = server.start(
    app_name="myapp",    # 兼容保留，JadeView 2.x 底层不再使用
    root_path="./web",   # 根目录
    hot_reload=False     # 是否启用热重载
)
print(f"服务器运行在: {url}")
```

| 参数 | 类型 | 描述 |
|------|------|------|
| root_path | str | 静态文件根目录 |
| app_name | str | 应用标识符 |
| hot_reload | bool | 是否启用热重载 |

**返回值**: `str` - 服务器 URL

#### stop()

停止服务器。

```python
server.stop()
```

#### get_url()

获取文件的完整 URL。

```python
url = server.get_url("index.html")
```

**返回值**: `str`

### 属性

| 属性 | 类型 | 描述 |
|------|------|------|
| is_running | bool | 服务器是否运行中 |
| url | str \| None | 服务器 URL |

---

## Router

后端主导的路由系统，支持内置模板和自定义模板。

### 构造函数

```python
router = Router(ipc=None)  # 可传入 IPCManager 实例
```

### 方法

#### page()

注册页面路由。

```python
router.page(
    path="/",                    # 路由路径
    template="pages/home.html",  # 模板文件
    title="首页",                # 页面标题
    icon="🏠",                   # 图标 (侧边栏显示)
    show_in_nav=True,            # 是否显示在导航栏
)
```

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| path | str | - | 路由路径，支持参数 (如 `/user/:id`) |
| template | str | - | 模板文件路径 |
| title | str | "Page" | 页面标题 |
| icon | str | "" | 页面图标 |
| show_in_nav | bool | True | 是否在导航中显示 |

**返回值**: `Router` (链式调用)

#### mount()

挂载路由器并创建窗口。

```python
window = router.mount(
    title="My App",          # 窗口标题
    web_dir="web",           # Web 文件目录
    width=1024,              # 窗口宽度
    height=768,              # 窗口高度
    sidebar_width=220,       # 侧边栏宽度
    theme="system",          # 主题
    initial_path="/",        # 初始路由
    template=None,           # 自定义模板 (None 使用内置)
    head_links=[],           # 额外 CSS 链接
    scripts=[],              # 额外 JS 脚本
    **window_options         # 其他窗口选项
)
```

**返回值**: `Window`

#### go()

导航到指定路由。

```python
router.go("/settings")
router.go("/user/123")  # 带参数
```

**返回值**: `bool` - 是否成功

#### set_theme()

设置应用主题。

```python
router.set_theme("light")  # light, dark, system
```

#### set_backdrop()

设置窗口背景材料。

```python
router.set_backdrop("mica")  # mica, micaAlt, acrylic
```

### 属性

| 属性 | 类型 | 描述 |
|------|------|------|
| current_route | str | 当前路由路径 |
| window | Window \| None | 关联的窗口实例 |

---

## Dialog

对话框 API，提供文件选择、保存和消息框功能。

:::info{title="版本要求"}
Dialog API 需要 JadeView DLL 1.3.0 或更高版本。
:::

### 方法

#### show_open_dialog()

显示打开文件对话框。

```python
from jadeui import Dialog

# 阻塞模式（默认）
Dialog.show_open_dialog(
    window_id=1,
    title="选择图片",
    default_path="C:/",
    filters=[
        {"name": "图片", "extensions": ["png", "jpg", "gif"]},
        {"name": "所有文件", "extensions": ["*"]}
    ],
    properties=["openFile", "multiSelections"]
)

# 非阻塞模式 + 回调
def on_result(result):
    print(f"选中: {result}")

Dialog.show_open_dialog(
    window_id=1,
    title="选择文件",
    properties=["openFile"],
    blocking=False,
    callback=on_result
)
```

| 参数 | 类型 | 描述 |
|------|------|------|
| window_id | int | 父窗口 ID |
| title | str \| None | 对话框标题 |
| default_path | str \| None | 默认打开路径 |
| button_label | str \| None | 确认按钮的自定义标签 |
| filters | list \| None | 文件过滤器，如 `[{"name": "图片", "extensions": ["png", "jpg"]}]` |
| properties | list \| None | 对话框属性：`openFile`, `openDirectory`, `multiSelections`, `showHiddenFiles` |
| blocking | bool | 是否阻塞（默认 True） |
| callback | Callable | 回调函数（非阻塞模式使用） |

**返回值**: `int` - 1 成功，0 失败

#### show_save_dialog()

显示保存文件对话框。

```python
Dialog.show_save_dialog(
    window_id=1,
    title="保存文档",
    default_path="document.txt",
    filters=[{"name": "文本文件", "extensions": ["txt"]}]
)
```

| 参数 | 类型 | 描述 |
|------|------|------|
| window_id | int | 父窗口 ID |
| title | str \| None | 对话框标题 |
| default_path | str \| None | 默认保存路径/文件名 |
| button_label | str \| None | 确认按钮的自定义标签 |
| filters | list \| None | 文件过滤器 |
| blocking | bool | 是否阻塞（默认 True） |
| callback | Callable | 回调函数（非阻塞模式使用） |

**返回值**: `int` - 1 成功，0 失败

#### show_message_box()

显示消息框。

```python
Dialog.show_message_box(
    window_id=1,
    title="确认删除",
    message="确定要删除这个文件吗？",
    detail="此操作不可撤销",
    type_="warning",
    buttons=["删除", "取消"],
    default_id=1,
    cancel_id=1
)
```

| 参数 | 类型 | 描述 |
|------|------|------|
| window_id | int | 父窗口 ID |
| title | str \| None | 消息框标题 |
| message | str \| None | 消息内容 |
| detail | str \| None | 详细信息 |
| buttons | list \| None | 按钮文本列表，如 `["确定", "取消"]` |
| default_id | int | 默认选中的按钮索引 |
| cancel_id | int | 取消按钮的索引（按 ESC 时触发） |
| type_ | str | 消息类型：`none`, `info`, `error`, `warning`, `question` |
| blocking | bool | 是否阻塞（默认 True） |
| callback | Callable | 回调函数（非阻塞模式使用） |

**返回值**: `int` - 1 成功，0 失败

#### show_error_box()

显示错误框（简化版）。

```python
Dialog.show_error_box(1, "错误", "文件读取失败！")
```

### 便捷方法

#### confirm()

显示确认对话框。

```python
Dialog.confirm("确定要退出吗？")
Dialog.confirm("删除文件？", title="确认", ok_label="删除", cancel_label="取消")
```

#### alert()

显示提示对话框。

```python
Dialog.alert("操作成功！")
Dialog.alert("请注意！", type_="warning")
```

#### error()

显示错误对话框。

```python
Dialog.error("文件保存失败！")
```

### 常量

#### MessageBoxType

消息框类型常量。

```python
from jadeui import MessageBoxType

MessageBoxType.NONE      # "none"
MessageBoxType.INFO      # "info"
MessageBoxType.WARNING   # "warning"
MessageBoxType.ERROR     # "error"
MessageBoxType.QUESTION  # "question"
```

#### OpenDialogProperties

打开对话框属性常量。

```python
from jadeui import OpenDialogProperties

OpenDialogProperties.OPEN_FILE         # "openFile"
OpenDialogProperties.OPEN_DIRECTORY    # "openDirectory"
OpenDialogProperties.MULTI_SELECTIONS  # "multiSelections"
OpenDialogProperties.SHOW_HIDDEN_FILES # "showHiddenFiles"
```

---

## Notification

桌面通知 API，支持 Windows 系统通知。

:::info{title="版本要求"}
Notification API 需要 JadeView DLL 1.3.0 或更高版本。仅支持 Windows 10+。
:::

### 方法

#### config()

配置通知应用信息（可选，有默认值）。

```python
from jadeui import Notification

Notification.config(
    app_name="我的应用",
    icon="C:/path/to/icon.ico"  # 绝对路径
)
```

| 参数 | 类型 | 描述 |
|------|------|------|
| app_name | str \| None | 应用显示名称（默认 "JadeUI App"） |
| icon | str \| None | 应用图标路径（绝对路径） |

#### show()

显示简单通知（无按钮）。

```python
Notification.show("提示", "操作已完成")
Notification.show("下载中", "正在下载文件...", timeout=5000)
```

| 参数 | 类型 | 描述 |
|------|------|------|
| title | str | 通知标题（必填） |
| body | str \| None | 通知内容 |
| icon | str \| None | 图标路径（覆盖 config 设置） |
| timeout | int | 超时时间（毫秒，≤ 0 使用默认） |

**返回值**: `bool` - 显示成功返回 True

#### with_buttons()

显示带按钮的通知（最多两个按钮）。

```python
Notification.with_buttons(
    "下载完成",
    "video.mp4 已下载",
    "打开",       # 第一个按钮
    "忽略",       # 第二个按钮（可选）
    action="download_123"  # 动作标识符
)
```

| 参数 | 类型 | 描述 |
|------|------|------|
| title | str | 通知标题 |
| body | str | 通知内容 |
| button1 | str | 第一个按钮文本 |
| button2 | str \| None | 第二个按钮文本（可选） |
| icon | str \| None | 图标路径 |
| timeout | int | 超时时间 |
| action | str \| None | 动作标识符，用于在回调中识别通知 |

**返回值**: `bool` - 显示成功返回 True

#### on()

注册通知事件监听器。

```python
from jadeui import Notification, Events

@Notification.on(Events.NOTIFICATION_ACTION)
def on_action(data):
    # data = {
    #     "action": "action_0",      # 按钮索引
    #     "title": "打开",           # 按钮文本
    #     "arguments": "download_123" # 你传入的 action 参数
    # }
    print(f"按钮点击: {data}")

@Notification.on(Events.NOTIFICATION_DISMISSED)
def on_dismissed(data):
    print("通知被关闭")
```

支持的事件：

| 事件 | 描述 |
|------|------|
| `Events.NOTIFICATION_ACTION` | 用户点击通知按钮 |
| `Events.NOTIFICATION_SHOWN` | 通知成功显示 |
| `Events.NOTIFICATION_DISMISSED` | 通知被关闭 |
| `Events.NOTIFICATION_FAILED` | 通知显示失败 |

### 便捷方法

```python
Notification.info("标题", "内容")
Notification.success("标题", "内容")
Notification.warning("标题", "内容")
Notification.error("标题", "内容")
```

### 完整示例

```python
from jadeui import Notification, Events

# 1. 配置应用信息
Notification.config(app_name="我的应用", icon="C:/app/icon.ico")

# 2. 监听按钮点击事件
@Notification.on(Events.NOTIFICATION_ACTION)
def on_action(data):
    action_id = data.get("arguments")  # 获取 action 参数
    button = data.get("action")        # 按钮索引

    if action_id == "download_123":
        if button == "action_0":
            print("用户点击了「打开」")
        elif button == "action_1":
            print("用户点击了「忽略」")

# 3. 发送通知
Notification.with_buttons(
    "下载完成",
    "video.mp4 已下载",
    "打开",
    "忽略",
    action="download_123"
)
```

---

## Clipboard

系统剪贴板文本读写 API。需要 JadeView 2.x。

```python
from jadeui import Clipboard

Clipboard.write_text("Hello JadeUI")
text = Clipboard.read_text()
```

| 方法 | 描述 |
|------|------|
| `Clipboard.write_text(text)` | 写入文本，成功返回 `True` |
| `Clipboard.read_text(buffer_size=65536)` | 读取文本，失败或为空返回 `None` |

---

## System

系统信息与 v2.3 系统集成 API。

```python
from jadeui import System

print(System.is_windows_11())
print(System.locale())
print(System.displays())
print(System.get_path("desktop"))
print(System.jadeview_version())
print(System.webview_version())
```

| 方法 | 描述 |
|------|------|
| `System.is_windows_11()` | 当前系统是否为 Windows 11 |
| `System.locale()` | 系统语言，如 `zh-CN` |
| `System.displays()` | 显示器信息列表 |
| `System.cursor_position()` | 当前鼠标光标位置 |
| `System.get_path(name)` | 获取系统路径，如 `desktop`、`documents`、`appdata`、`temp` |
| `System.webview_version()` | WebView2 Runtime 版本 |
| `System.jadeview_version()` | JadeView DLL 版本 |
| `System.set_login_autostart(enable=True, args=None)` | v2.3：设置开机自启 |
| `System.get_login_autostart()` | v2.3：查询开机自启状态 |
| `System.get_file_icon(path, size=48, window_id=0, ttl_seconds=0)` | v2.3：提取文件/目录图标，返回 `jade://` URL |
| `System.ntp_now(server=None)` | v2.3：获取 NTP UTC 毫秒时间戳，网络失败返回 `None` |

---

## Storage

YAML 持久化存储 API。需要 JadeView 2.3+，建议在 `app.on_ready` 后使用。

```python
from jadeui import Storage

Storage.set("settings", "window.width", 1024)
Storage.set_str("settings", "literal", "true")

print(Storage.get("settings", "window.width"))
print(Storage.get_all("settings", {}))
print(Storage.keys("settings", "window"))
print(Storage.length("settings", "window"))
```

| 方法 | 描述 |
|------|------|
| `Storage.set(file_name, key_path, value)` | 写入值；非字符串会序列化为 JSON |
| `Storage.set_str(file_name, key_path, value)` | 按字面字符串写入 |
| `Storage.get(file_name, key_path, default=None)` | 读取路径值 |
| `Storage.get_all(file_name, default=None)` | 读取整个 YAML 文件 |
| `Storage.has(file_name, key_path)` | 路径是否存在 |
| `Storage.delete(file_name, key_path)` | 删除路径 |
| `Storage.clear(file_name)` | 清空文件为 `{}` |
| `Storage.delete_file(file_name)` | 删除 YAML 文件 |
| `Storage.keys(file_name, key_path="")` | 列出路径下 key |
| `Storage.length(file_name, key_path="")` | 返回对象 key 数或数组长度 |

---

## Tray

系统托盘 API。需要 JadeView 2.x，通常在 `app.on_ready` 后创建。

```python
from jadeui import Tray

tray = Tray()
tray.set_tooltip("JadeUI App")
tray.set_icon("C:/app/icon.ico")
tray.set_menu([
    {"key": "show", "label": "显示窗口", "on_click": lambda: window.show()},
    {"type": "separator", "key": "sep"},
    {"key": "quit", "label": "退出", "dangerous": True, "on_click": app.quit},
])
tray.show()
```

| 方法 | 描述 |
|------|------|
| `set_tooltip(text)` | 设置悬浮提示 |
| `set_icon(icon_path)` | 从文件设置托盘图标 |
| `set_icon_from_bytes(data)` | 从内存字节设置托盘图标 |
| `set_menu(items)` | 设置右键菜单 |
| `on_click(callback)` | 监听托盘点击事件 |
| `show()` / `hide()` | 显示或隐藏托盘 |
| `destroy()` | 销毁托盘 |

---

## HotKey

全局热键 API。需要 JadeView 2.x。

```python
from jadeui import HotKey

@HotKey.register("Ctrl+Alt+J")
def on_hotkey():
    window.flash(3)

hotkey_id = HotKey.register("Alt+F1", lambda: print("F1"))
HotKey.unregister(hotkey_id)
```

| 方法 | 描述 |
|------|------|
| `HotKey.register(combo, callback=None)` | 注册全局热键；可作为装饰器使用 |
| `HotKey.unregister(hotkey_id)` | 注销指定热键 |
| `HotKey.unregister_all()` | 注销全部热键 |

---

## EventEmitter

事件发射器基类，提供事件订阅和发布功能。

### 方法

#### on()

注册事件监听器。

```python
# 方法形式
emitter.on("event", callback)

# 装饰器形式
@emitter.on("event")
def callback(data):
    pass
```

#### off()

移除事件监听器。

```python
emitter.off("event", callback)  # 移除特定监听器
emitter.off("event")            # 移除该事件所有监听器
```

#### emit()

触发事件。

```python
emitter.emit("event", arg1, arg2, key=value)
```

**返回值**: `bool` - 是否有监听器被调用

#### once()

注册一次性监听器。

```python
@emitter.once("event")
def callback():
    pass  # 只会被调用一次
```

#### remove_all_listeners()

移除所有监听器。

```python
emitter.remove_all_listeners("event")  # 特定事件
emitter.remove_all_listeners()         # 所有事件
```

#### listener_count()

获取监听器数量。

```python
count = emitter.listener_count("event")
```

#### event_names()

获取所有有监听器的事件名。

```python
names = emitter.event_names()
```

---

## 常量

### Theme

窗口主题常量。

```python
from jadeui import Theme

Theme.LIGHT   # "Light"
Theme.DARK    # "Dark"
Theme.SYSTEM  # "System"
```

### Backdrop

Windows 11 背景材料常量。

```python
from jadeui import Backdrop

Backdrop.MICA      # "mica"
Backdrop.MICA_ALT  # "micaAlt"
Backdrop.ACRYLIC   # "acrylic"
```

### Events

标准事件名称常量。推荐使用这些常量而不是手写字符串，更加类型安全。

```python
from jadeui import Events

# 应用生命周期事件
Events.APP_READY          # "app-ready"
Events.WINDOW_ALL_CLOSED  # "window-all-closed"
Events.BEFORE_QUIT        # "before-quit"

# 窗口事件
Events.WINDOW_CREATED         # "window-created"
Events.APP_WINDOW_CREATED     # "app-window-created"
Events.WINDOW_CLOSED          # "window-closed"
Events.WINDOW_CLOSING         # "window-closing"
Events.WINDOW_RESIZED         # "window-resized"
Events.WINDOW_STATE_CHANGED   # "window-state-changed"
Events.WINDOW_FULLSCREEN      # "window-fullscreen" (需 1.2+)
Events.WINDOW_MOVED           # "window-moved"
Events.WINDOW_FOCUSED         # "window-focused"
Events.WINDOW_BLURRED         # "window-blurred"
Events.WINDOW_DESTROYED       # "window-destroyed"
Events.RESIZED                # "resized" (旧兼容格式)

# WebView 事件
Events.WEBVIEW_WILL_NAVIGATE      # "webview-will-navigate"
Events.WEBVIEW_DID_START_LOADING  # "webview-did-start-loading"
Events.WEBVIEW_DID_FINISH_LOAD    # "webview-did-finish-load"
Events.WEBVIEW_NEW_WINDOW         # "webview-new-window"
Events.WEBVIEW_PAGE_TITLE_UPDATED # "webview-page-title-updated"
Events.WEBVIEW_PAGE_ICON_UPDATED  # "webview-page-icon-updated"
Events.FAVICON_UPDATED            # "favicon-updated"
Events.JAVASCRIPT_RESULT          # "javascript-result"
Events.WEBVIEW_DOWNLOAD_STARTED   # "webview-download-started" (需 0.3.1+)
Events.POSTMESSAGE_RECEIVED       # "postmessage-received" (需 1.0.2+)

# 文件事件
Events.FILE_DROP          # "file-drop"

# 主题事件
Events.THEME_CHANGED      # "theme-changed"

# 通知事件 (需 1.3.0+)
Events.NOTIFICATION_ACTION    # "notification-action" (用户点击按钮)
Events.NOTIFICATION_SHOWN     # "notification-shown" (通知成功显示)
Events.NOTIFICATION_DISMISSED # "notification-dismissed" (通知被关闭)
Events.NOTIFICATION_FAILED    # "notification-failed" (通知显示失败)

# 其他事件
Events.UPDATE_WINDOW_ICON # "update-window-icon"
Events.IPC_MESSAGE        # "ipc-message"
```

#### 使用类型化装饰器监听事件

```python
from jadeui import Window

window = Window(title="事件示例")

# 参数已自动解析，提供 IDE 类型提示
@window.on_resized
def on_resize(width: int, height: int):
    print(f"窗口大小改变: {width} x {height}")

@window.on_moved
def on_move(x: int, y: int):
    print(f"窗口位置: ({x}, {y})")

@window.on_focused
def on_focus():
    print("窗口获得焦点")

@window.on_blurred
def on_blur():
    print("窗口失去焦点")

@window.on_page_loaded
def on_page_load(url: str):
    print(f"页面加载完成: {url}")

# 阻止窗口关闭
@window.on_closing
def on_closing():
    return True  # 返回 True 阻止关闭

# 拦截新窗口请求
@window.on_new_window
def on_new_window(url: str, frame_name: str):
    print(f"拦截新窗口: {url}")
    window.navigate(url)  # 在当前窗口打开
    return True  # 阻止打开新窗口

# 监听文件下载事件 (需 0.3.1+)
@window.on_download_started
def on_download(url: str, filename: str):
    print(f"下载请求: {filename} from {url}")
    if filename.endswith(".exe"):
        return True  # 阻止 exe 文件下载
    return False

# 监听全屏状态改变 (需 1.2+)
@window.on_fullscreen_changed
def on_fullscreen(is_fullscreen: bool):
    print(f"全屏状态: {is_fullscreen}")

window.show()
```

---

## 类型定义

### RGBA

颜色结构体。

```python
from jadeui import RGBA

color = RGBA(r=255, g=128, b=64, a=255)
```

### WebViewWindowOptions

窗口配置选项结构体。

### WebViewSettings

WebView 行为设置结构体。

---

## 异常

### JadeUIError

所有 JadeUI 异常的基类。

### DLLLoadError

DLL 加载失败。

### WindowCreationError

窗口创建失败。

### IPCError

IPC 通信错误。

### ServerError

本地服务器错误。

### InitializationError

SDK 初始化错误。

```python
from jadeui import JadeUIError, WindowCreationError

try:
    window = Window(title="Test")
    window.show()
except WindowCreationError as e:
    print(f"窗口创建失败: {e}")
except JadeUIError as e:
    print(f"JadeUI 错误: {e}")
```

---

## 工具函数

### create_app()

快捷创建应用实例。

```python
from jadeui import create_app, Window

app = create_app(
    enable_dev_tools=True,
    log_file="app.log"
)

@app.on_ready
def setup():
    Window(title="My App").show()

app.run()
```

### utils.get_resource_path()

获取资源文件的绝对路径，兼容打包环境。

```python
from jadeui import utils

path = utils.get_resource_path("assets/icon.png")
```

### utils.show_error()

显示错误消息。

```python
from jadeui import utils

utils.show_error("错误", "发生了一个错误")
```

### utils.ensure_directory()

确保目录存在。

```python
from jadeui import utils

utils.ensure_directory("./data/cache")
```

---

## DLL 下载工具

### download_dll()

下载 JadeView DLL。

```python
from jadeui import download_dll

download_dll(force=False)  # force=True 强制重新下载
```

### ensure_dll()

确保 DLL 存在，不存在则下载。

```python
from jadeui import ensure_dll

ensure_dll()
```

### find_dll()

查找 DLL 文件路径。

```python
from jadeui import find_dll

path = find_dll()
```

### get_architecture()

获取当前系统架构。

```python
from jadeui import get_architecture

arch = get_architecture()  # "x64" 或 "x86"
```

:::info{title="v2.3 DLL 规则"}
`get_architecture()` 按当前 Python 解释器架构返回 `x86`、`x64` 或 `arm64`。下载器只会在 SDK 已适配的 release tag 内自动选择最新 build，不会自动跨 `2.2 -> 2.3` 这样的兼容边界。
:::

