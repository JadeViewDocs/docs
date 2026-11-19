---
title: 窗口 API
order: 0
group:
  title: 窗口与视图
  order: 1
---

# 窗口 API

窗口与网页视图是两类独立对象：一个 Window 可以拥有多个 WebView，销毁某个 WebView 不会关闭窗口或其它视图，销毁 Window 会先销毁其全部 WebView。

窗口操作（标题、尺寸、位置、显隐、层级、主题、关闭等）使用 **Window ID**；页面操作（导航、历史、缩放、页面 URL、DevTools、打印、IPC、资源注册等）使用 **WebView ID**。两类 ID 共用一个不复用的编号空间，错类型传入会被明确拒绝。

`create_webview_window` 和 `create_window` 都返回 **Window ID**。使用 `create_webview_window` 后即可用 `get_default_webview(window_id)` 取得默认 WebView ID。独立创建 / 挂载视图的入口见 [WebView API](/docs/v3api/webview-api)。非零创建 ID 只表示**请求已受理**，不代表原生实例已就绪；Ready 表示原生实例可操作，页面加载完成由独立事件报告。

页面级接口见 [WebView API](/docs/v3api/webview-api)；网页权限请求的统一拦截见 [网页权限 API](/docs/v3api/permission-api)。除特别说明外，本页函数成功多为 `1`、失败为 `0`。

---

配置以 `struct_size` / `abi_version` 开头，默认初始化函数签名为 `window_options_default(out, sizeof(*out))`，成功返回 `JADE_OK`；创建时传 `NULL` 使用默认值。详见 [V3 ABI](/docs/v3api/abi)。

`create_webview_window` 和 `create_window` 的最后一个参数都是可选的 [扩展配置 `features`](#窗口功能jadewindowfeatures)，用于设置内容保护、位置保存和启动画面。

## 创建窗口

### 创建窗口和默认 WebView（`create_webview_window`）

创建原生窗口及其默认 WebView。默认显示系统标题栏和边框，是否无边框由 `options.noframe` 决定。

```c
uint32_t create_webview_window(const char* url, uint32_t parent_window_id, const struct WebViewWindowOptions* options, const struct WebViewSettings* webview_settings, const struct JadeWindowFeatures* features);
```

**参数：**

- `url` `string` - 第一次打开的网址或本地协议地址
- `parent_window_id` `uint32_t` - 父窗口，`0` 表示顶层窗口
- `options` `const struct WebViewWindowOptions*` (可选) - 窗口外观配置，见[窗口配置](#窗口配置webviewwindowoptions)；`NULL` 使用默认值
- `webview_settings` `const struct WebViewSettings*` (可选) - 网页行为配置，字段说明见 [WebView API](/docs/v3api/webview-api)；`NULL` 使用默认值
- `features` `const struct JadeWindowFeatures*`（可选）– [窗口扩展配置](#窗口功能jadewindowfeatures)，传 `NULL` 时关闭这些扩展功能

**返回值：** 非零为已受理的 **Window ID**；`0` 表示失败（例如在 `app-ready` 之前调用）。窗口真正画出可能稍晚，可结合 `window-created` 事件。

---

### 窗口配置（`WebViewWindowOptions`）

```c
typedef struct WebViewWindowOptions {
  uint32_t struct_size;
  uint32_t abi_version;
  const char *title;
  int32_t width;
  int32_t height;
  int32_t resizable;
  int32_t noframe;
  const char *title_bar_style;
  int32_t transparent;
  const char *background_color;
  int32_t always_on_top;
  const char *theme;
  int32_t maximized;
  int32_t maximizable;
  int32_t minimizable;
  int32_t x;
  int32_t y;
  int32_t min_width;
  int32_t min_height;
  int32_t max_width;
  int32_t max_height;
  int32_t fullscreen;
  int32_t focus;
  int32_t hide_window;
  int32_t use_page_icon;
  int32_t skip_taskbar;
  int32_t no_activate;
  const char *background_material;
  int32_t titlebar_back;
  int32_t titlebar_refresh;
  int32_t titlebar_icon;
} WebViewWindowOptions;
```

| 字段 | C 类型 | 说明 |
| --- | --- | --- |
| `struct_size` | `uint32_t` | 结构体字节数，由 `window_options_default` 填入 |
| `abi_version` | `uint32_t` | ABI 版本，由 `window_options_default` 填入 |
| `title` | `const char*` | 窗口标题栏文字 |
| `width` / `height` | `int32_t` | 初始宽高，单位为逻辑像素，必须为正值 |
| `resizable` | `int32_t` | 是否允许用户拖动边缘调整大小 |
| `noframe` | `int32_t` | `1` 使用无边框实现，`0` 保留系统边框，默认 `0`；无边框优先于系统标题栏 |
| `title_bar_style` | `const char*` | `default` 系统标题栏、`hidden` 隐藏标题栏、`BarOverlay` 隐藏标题栏并启用按钮覆盖层；`NULL` 等同 `default` |
| `titlebar_back` | `int32_t` | 返回按钮开关，`0/1`，默认 `1`；仅在当前页面可回退时显示，Windows 两种标题栏共用 |
| `titlebar_refresh` | `int32_t` | 刷新按钮开关，`0/1`，默认 `1`；Windows 两种标题栏共用 |
| `titlebar_icon` | `int32_t` | 默认标题栏窗口图标显示开关：`0/1`，默认 `1`；不影响任务栏图标 |
| `transparent` | `int32_t` | 透明背景（受 WebView 与系统能力影响） |
| `background_color` | `const char*` | 背景色 `#RRGGBB` 或 `#RRGGBBAA`，例如 `"#ffffff00"` |
| `always_on_top` | `int32_t` | 是否总在最前 |
| `theme` | `const char*` | 窗口主题（`Light` / `Dark` / `System`） |
| `maximized` | `int32_t` | 打开时是否最大化 |
| `maximizable` / `minimizable` | `int32_t` | 标题栏上最大化 / 最小化按钮是否生效 |
| `x` / `y` | `int32_t` | 窗口左上角坐标，`-1` 表示居中 |
| `min_width` / `min_height` | `int32_t` | 最小宽高，`0` 表示不限制 |
| `max_width` / `max_height` | `int32_t` | 最大宽高，`0` 表示不限制 |
| `fullscreen` | `int32_t` | 打开时是否全屏 |
| `focus` | `int32_t` | 打开后是否抢键盘焦点 |
| `hide_window` | `int32_t` | 默认 `0`（创建后显示）；非 `0` 时先创建但不显示，适合先加载再显示 |
| `use_page_icon` | `int32_t` | 默认 `0`。非零时，检测到网页 favicon 后用它更新窗口图标 |
| `skip_taskbar` | `int32_t` | 不进任务栏 / Alt-Tab（`0` 否、`1` 是），运行时可用 `set_window_skip_taskbar` |
| `no_activate` | `int32_t` | 点击 / 显示时不激活窗口（`0` 否、`1` 是），运行时可用 `set_window_no_activate` |
| `background_material` | `const char*` | 创建时背景材质：`default` / `mica` / `micaAlt` / `acrylic`（不区分大小写），`NULL` 为 `default` |

`noframe` 与 `title_bar_style` 的组合语义（外观取决于平台与窗口管理器）：

| `noframe` | `title_bar_style` | 效果 |
| --- | --- | --- |
| `0` | `default` | 系统边框和标题栏 |
| `0` | `hidden` | 隐藏标题栏，使用可调整边框路径 |
| `1` | `default` 或 `hidden` | 无边框路径 |
| `0` 或 `1` | `BarOverlay` | 按 `noframe` 选择边框路径，同时启用标题栏按钮覆盖层 |

`default` 使用系统边框和标题栏；`BarOverlay` 启用标题栏按钮覆盖层，只占按钮实际区域，不预留页面顶部高度，自定义标题内容需自行避让。左侧导航按钮在两种样式下均可显示，返回仅在有可回退历史时出现。按钮配色与高度见 `set_titlebar_style`。

`background_material` 的非默认值仅 Windows 11 可用：需在窗口显示和 WebView 创建前设置，且页面本身使用透明背景才能看到材质；Linux 与 Windows 11 以前会拒绝创建，系统设置失败时窗口进入失败状态。

:::warning
使用非空配置前必须先调用 `window_options_default`，它会初始化尺寸等必要字段；仅把结构体清零不够。宿主绑定的完整字段布局必须与 `include/JadeView.h` 一致。
:::

---

### 窗口功能（`JadeWindowFeatures`）

通过建窗函数最后的 `features` 参数传入本结构。`content_protection` 和 `auto_save_state` 已从 `WebViewWindowOptions` 移到这里。

```c
typedef struct JadeWindowFeatures {
    uint32_t struct_size;
    uint32_t abi_version;
    int32_t content_protection;
    int32_t auto_save_state;
    const struct JadeSplashOptions* splash;
} JadeWindowFeatures;
```

先将结构体清零，再设置 `struct_size`、`abi_version` 和要启用的字段。建窗函数在返回前读取这些配置，包括启动画面和 LOGO。

| 字段 | C 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `struct_size` | `uint32_t` | 必填 | 填 `sizeof(JadeWindowFeatures)` |
| `abi_version` | `uint32_t` | 必填 | 填 `JADE_ABI_VERSION` |
| `content_protection` | `int32_t` | `0` | 非零时启用 Windows 内容保护。建窗后可用 `set_content_protection` 切换 |
| `auto_save_state` | `int32_t` | `0` | 非零时在应用数据目录的 `window_state.yaml` 中按窗口 ID 保存位置，并在同 ID 再次创建时恢复。宽高和最大化状态采用本次参数 |
| `splash` | `const struct JadeSplashOptions*` | `NULL` | Windows 窗口的启动画面，支持 LOGO、背景色、加载动画颜色和最短显示时间。空窗口首次挂载 WebView 时才可能显示。见[启动画面](/docs/v3api/splash-api) |

### 创建空窗口（`create_window`）

创建不带任何 WebView 的原生窗口。要往窗口里挂视图，见 [WebView API](/docs/v3api/webview-api)。

```c
uint32_t create_window(uint32_t parent_window_id, const struct WebViewWindowOptions* options, const struct JadeWindowFeatures* features);
```

- `parent_window_id` `uint32_t` - 父窗口 ID，无父窗口传 `0`
- `options` `const struct WebViewWindowOptions*`（可选）– [窗口外观与行为](#窗口配置webviewwindowoptions)，传 `NULL` 时使用默认值
- `features` `const struct JadeWindowFeatures*`（可选）– [窗口扩展配置](#窗口功能jadewindowfeatures)，传 `NULL` 时关闭这些扩展功能
- **返回值**：`uint32_t`，非零为已受理的 Window ID

---

### 创建带扩展功能的窗口

在收到 `app-ready` 后调用。

```c
WebViewWindowOptions options;
if (window_options_default(&options, sizeof options) != JADE_OK) return;
options.title = "JadeView";
options.width = 960;
options.height = 640;

JadeSplashOptions splash = {0};
splash.struct_size = sizeof splash;
splash.abi_version = JADE_ABI_VERSION;
splash.logo_path = "assets/logo.png";
splash.minimum_ms = 700;

JadeWindowFeatures features = {0};
features.struct_size = sizeof features;
features.abi_version = JADE_ABI_VERSION;
features.auto_save_state = 1;
features.splash = &splash;

uint32_t window_id = create_webview_window(url, 0, &options, NULL, &features);
if (window_id == 0) return;
uint32_t view_id = get_default_webview(window_id);
```

创建成功即可取得默认 WebView ID。依赖原生窗口的操作应等窗口进入 Ready，依赖页面内容的操作应等对应的加载事件。

### 创建无边框窗口

将已初始化的 `options.noframe` 设为 `1`，继续调用 `create_webview_window`。从 `create_borderless_webview_window` 迁移时可沿用原有的 WebView 设置和窗口扩展配置。

```c
WebViewWindowOptions options;
if (window_options_default(&options, sizeof options) != JADE_OK) return;
options.noframe = 1;
uint32_t window_id = create_webview_window(url, 0, &options, webview_settings, features);
```

需要在一个窗口里放多个视图时，用 [WebView API](/docs/v3api/webview-api) 的 `add_webview` / `add_webview_to_window` 挂载额外视图。

---

## 对象查询与状态

### 获取窗口句柄（`get_window_hwnd`）

在 C/C++ 里要把窗口交给别的 Win32 API（例如 `SetWindowPos`、子控件挂靠）时，需要 HWND。

```c
size_t get_window_hwnd(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID
- **返回值**：`size_t` 原生窗口句柄

---

### 由窗口句柄取窗口 ID（`get_window_id`）

```c
uint32_t get_window_id(size_t hwnd);
```

- `hwnd` `size_t` - 原生窗口句柄（HWND）
- **返回值**：`uint32_t` 该窗口的 Window ID

---

### 获取默认 WebView（`get_default_webview`）

```c
uint32_t get_default_webview(uint32_t window_id);
```

窗口创建后立即取得默认 WebView ID，无需等待事件。`window_id` 是 Window ID；默认关联被清空后可结合 `get_window_state` 的 `default_webview_id` 字段判断。

---

### 指定默认 WebView（`set_default_webview`）

```c
int32_t set_default_webview(uint32_t window_id, uint32_t webview_id);
```

把窗口的默认关联指向指定视图。`window_id` 是 Window ID，`webview_id` 是 WebView ID。

---

### 列出窗口的所有视图（`get_window_webviews` / `free_webview_id_array`）

```c
int32_t get_window_webviews(uint32_t window_id, struct WebViewIdArray* out_array);
void free_webview_id_array(struct WebViewIdArray* array);
```

结果通过 `WebViewIdArray` 返回，用完必须调用 `free_webview_id_array` 释放内部数组。

```c
typedef struct WebViewIdArray {
  const uint32_t *ids;
  size_t count;
} WebViewIdArray;
```

---

### 查询父窗口（`get_webview_parent_window_id`）

```c
uint32_t get_webview_parent_window_id(uint32_t webview_id);
```

传入 WebView ID，返回其所属 Window ID。

---

### 查询对象状态（`get_window_state` / `get_webview_state`）

```c
int32_t get_window_state(uint32_t window_id, struct JadeObjectState* out);
int32_t get_webview_state(uint32_t webview_id, struct JadeObjectState* out);
```

两个函数分别接受 Window ID 与 WebView ID，状态写入同一个结构体：

```c
typedef struct JadeObjectState {
  uint32_t kind;
  uint32_t state;
  uint32_t parent_window_id;
  uint32_t default_webview_id;
  int32_t error_code;
} JadeObjectState;
```

| 字段 | C 类型 | 含义 |
| --- | --- | --- |
| `kind` | `uint32_t` | 对象种类（Window / WebView） |
| `state` | `uint32_t` | 生命周期状态，取值见下表 |
| `parent_window_id` | `uint32_t` | WebView 所属窗口；Window 对象上不适用 |
| `default_webview_id` | `uint32_t` | 窗口当前默认视图；已清空为 `0` |
| `error_code` | `int32_t` | 对象进入失败状态时的错误码 |

对象生命周期状态常量（`include/JadeView.h`）：

| 常量 | 值 | 含义 |
| --- | --- | --- |
| `JADE_STATE_RESERVED` | 1 | 已占位 |
| `JADE_STATE_CONFIGURED` | 2 | 已配置 |
| `JADE_STATE_CREATING` | 3 | 创建中 |
| `JADE_STATE_READY` | 4 | 原生实例可操作 |
| `JADE_STATE_CLOSING` | 5 | 关闭中 |
| `JADE_STATE_DESTROYING` | 6 | 销毁中 |
| `JADE_STATE_DESTROYED` | 7 | 已销毁 |
| `JADE_STATE_FAILED` | 8 | 失败 |
| `JADE_STATE_CRASHED` | 9 | 崩溃 |

> 请求结果另有一套更细的 `1 accepted / 2 waiting / 3 succeeded / 4 failed / 5 cancelled` 编号，见[核心 API](/docs/v3api/index)。两者不要混用。

---

### 获取窗口数量（`get_window_count`）

查询当前还有几个窗口没关。

```c
uint32_t get_window_count(void);
```

---

## 位置、尺寸与标题

### 设置窗口标题

改变窗口标题栏上显示的文字（和 HTML 里的 `<title>` 可以不同）。

```c
int32_t set_window_title(uint32_t window_id, const char* title);
```

- `window_id` `uint32_t` - 目标 Window ID
- `title` `string` - 新的窗口标题

---

### 设置窗口大小

按像素改变窗口宽度和高度。

```c
int32_t set_window_size(uint32_t window_id, int32_t width, int32_t height);
```

- `window_id` `uint32_t` - 目标 Window ID
- `width` / `height` `int32_t` - 新的宽高（像素）

---

### 设置窗口位置

按像素改变窗口在屏幕上的位置。

```c
int32_t set_window_position(uint32_t window_id, int32_t x, int32_t y);
```

- `window_id` `uint32_t` - 目标 Window ID
- `x` / `y` `int32_t` - 新的坐标

---

### 获取窗口位置和尺寸（`get_window_bounds`）

```c
int32_t get_window_bounds(uint32_t window_id, char* buffer, int32_t buffer_size);
```

- `window_id` `uint32_t` - 目标 Window ID
- `buffer` `char*` - 输出缓冲区
- `buffer_size` `int32_t` - 缓冲区大小
- **返回值**：`1` 成功，`buffer` 写入 JSON `{"x":0,"y":0,"width":800,"height":600}`；`0` 失败

---

## 显隐与焦点

### 显示或隐藏窗口

```c
int32_t set_window_visible(uint32_t window_id, int32_t visible);
```

- `window_id` `uint32_t` - 目标 Window ID
- `visible` `int32_t` - 非 `0` 显示，`0` 隐藏

---

### 让窗口获得焦点

```c
int32_t set_window_focus(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID

---

### 设置窗口置顶

```c
int32_t set_window_always_on_top(uint32_t window_id, int32_t always_on_top);
```

- `window_id` `uint32_t` - 目标 Window ID
- `always_on_top` `int32_t` - 非 `0` 置顶，`0` 取消置顶

---

### 设置忽略鼠标事件（`set_window_ignore_cursor_events`）

设置窗口是否忽略鼠标事件（鼠标穿透），适用于悬浮窗 / overlay 场景。

```c
int32_t set_window_ignore_cursor_events(uint32_t window_id, int32_t ignore);
```

- **参数**：`window_id`；`ignore`（`1` 忽略鼠标事件 / 穿透，`0` 正常）
- **返回值**：`1` 成功，`0` 失败

---

## 窗口标志与层级

适用于侧边 Dock、悬浮面板、桌面挂件、启动器等场景：让窗口不出现在任务栏 / Alt-Tab、常驻时不抢焦点，或把窗口压到桌面壁纸层。

### 不进任务栏 / Alt-Tab（`set_window_skip_taskbar`）

```c
int32_t set_window_skip_taskbar(uint32_t window_id, int32_t skip);
```

- **参数**：`window_id`；`skip`（`1` 不进任务栏 / Alt-Tab，`0` 恢复）
- **返回值**：`1` 成功，`0` 失败

:::info{title=平台实现}
Windows：加 `WS_EX_TOOLWINDOW` 并去 `WS_EX_APPWINDOW`；Linux：GTK `skip-taskbar-hint`。
:::

---

### 不抢焦点（`set_window_no_activate`）

让窗口在点击 / 显示时都不获得激活焦点，适合常驻的悬浮面板。

```c
int32_t set_window_no_activate(uint32_t window_id, int32_t no_activate);
```

- **参数**：`window_id`；`no_activate`（`1` 不抢焦点，`0` 恢复）
- **返回值**：`1` 成功，`0` 失败

:::info{title=平台实现}
Windows：`WS_EX_NOACTIVATE`（`SetWindowLongPtr`）；Linux：GTK `accept-focus=false`。
:::

---

### 设置窗口层级（`set_window_level`）

一次性设定窗口处于哪个层级，比单纯的「置顶」更灵活。

```c
// level: "topmost" | "normal" | "bottom" | "desktop"
int32_t set_window_level(uint32_t window_id, const char* level);
```

- **参数**：`window_id`；`level` `string` - 层级字符串，取值见下表
- **返回值**：`1` 成功，`0` 失败

| level | 行为 | 实现 |
|-------|------|------|
| `topmost` | 置顶，盖在普通窗口之上 | `set_always_on_top(true)`（跨平台） |
| `normal` | 普通层，取消置顶 / 置底 | 取消 always-on-top / always-on-bottom |
| `bottom` | 压在其它窗口下方 | `set_always_on_bottom(true)`（跨平台） |
| `desktop` | 贴桌面壁纸层（最小化所有窗口才见，类挂件） | 先 `bottom`；Windows 寄生 `Progman` / `WorkerW`，Linux 设 GTK `WindowTypeHint::Desktop` |

:::warning{title=平台差异}
`topmost` / `normal` / `bottom` 跨平台稳定；`desktop`（壁纸层）为 best-effort，与窗口管理器行为相关，建议真机验证。寄生失败时至少退化为 `bottom`。
:::

---

### 设置内容保护（`set_content_protection`）

打开后，部分截屏和录屏软件较难采到窗口内容，效果因系统和采集方式而异。创建时可设置 `JadeWindowFeatures.content_protection`。

```c
int32_t set_content_protection(uint32_t window_id, int32_t content_protection);
```

- `window_id` `uint32_t` - **Window ID**（不是 WebView ID）
- `content_protection` `int32_t` - 非 `0` 启用保护，`0` 禁用保护

---

## 窗口状态

### 最小化窗口

```c
int32_t minimize_window(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID

---

### 切换最大化状态

```c
int32_t toggle_maximize_window(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID

---

### 查询是否最大化

```c
int32_t is_window_maximized(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID
- **返回值**：`1` 是最大化状态，`0` 不是

---

### 设置全屏

进入或退出全屏（铺满显示器，不是单纯最大化）。请求会异步生效，也可监听 `window-fullscreen` 事件。

```c
int32_t set_window_fullscreen(uint32_t window_id, int32_t fullscreen);
```

- `window_id` `uint32_t` - 目标 Window ID
- `fullscreen` `int32_t` - 非 `0` 进入全屏，`0` 退出全屏

---

### 查询窗口是否最小化（`is_window_minimized`）

```c
int32_t is_window_minimized(uint32_t window_id);
```

- **参数**：`window_id` `uint32_t`
- **返回值**：`1` 已最小化，`0` 否

---

### 查询窗口是否可见（`is_window_visible`）

```c
int32_t is_window_visible(uint32_t window_id);
```

- **参数**：`window_id` `uint32_t`
- **返回值**：`1` 可见，`0` 不可见

---

### 查询窗口是否聚焦（`is_window_focused`）

```c
int32_t is_window_focused(uint32_t window_id);
```

- **参数**：`window_id` `uint32_t`
- **返回值**：`1` 已聚焦，`0` 否

---

### 查询窗口是否全屏（`is_window_fullscreen`）

```c
int32_t is_window_fullscreen(uint32_t window_id);
```

- **参数**：`window_id` `uint32_t`
- **返回值**：`1` 全屏，`0` 否

---

## 窗口约束

### 设置窗口最小尺寸（`set_window_min_size`）

```c
int32_t set_window_min_size(uint32_t window_id, int32_t width, int32_t height);
```

- **参数**：`window_id`、`width`（最小宽度）、`height`（最小高度）
- **返回值**：`1` 成功，`0` 失败

---

### 设置窗口最大尺寸（`set_window_max_size`）

```c
int32_t set_window_max_size(uint32_t window_id, int32_t width, int32_t height);
```

- **参数**：`window_id`、`width`（最大宽度）、`height`（最大高度）
- **返回值**：`1` 成功，`0` 失败

---

### 设置窗口是否可调整大小（`set_window_resizable`）

```c
int32_t set_window_resizable(uint32_t window_id, int32_t resizable);
```

- **参数**：`window_id`、`resizable`（`1` 可调整，`0` 不可）
- **返回值**：`1` 成功，`0` 失败

---

### 启用或禁用窗口

禁用窗口时用户点不了上面控件（像模态对话框背后的灰窗）。

```c
int32_t set_window_enabled(uint32_t window_id, int32_t enabled);
```

- `window_id` `uint32_t` - 目标 Window ID
- `enabled` `int32_t` - 非 `0` 启用，`0` 禁用

---

## 外观与样式

### 运行时修改窗口边框样式（`set_window_frame`）

动态切换窗口的边框路径与标题栏样式，无需重新创建窗口。本接口是运行期切换边框与标题栏样式的唯一入口。

```c
int32_t set_window_frame(uint32_t window_id, int32_t noframe, const char* title_bar_style);
```

**参数：**

- `window_id` `uint32_t` - **Window ID**（不是 WebView ID）
- `noframe` `int32_t` - `1` 使用无边框实现，`0` 保留系统边框；无边框优先于系统标题栏
- `title_bar_style` `const char*` - `default` 系统标题栏、`hidden` 隐藏标题栏、`BarOverlay` 隐藏标题栏并启用按钮覆盖层；`NULL` 等同 `default`

**返回值**：`1` 表示已入队受理，`0` 表示拒绝。无效样式不会入队，错误通过 [`jade_last_error_code` / `jade_last_error_message`](/docs/v3api/index) 读取。

| `noframe` | `title_bar_style` | 效果 |
| --- | --- | --- |
| `0` | `default` | 系统边框和标题栏 |
| `0` | `hidden` | 隐藏标题栏，使用可调整边框路径 |
| `1` | `default` 或 `hidden` | 无边框路径 |
| `0` 或 `1` | `BarOverlay` | 按 `noframe` 选择边框路径，同时启用标题栏按钮覆盖层 |

```c
set_window_frame(window_id, 1, "hidden");
```

创建时的对应配置字段见本页「窗口配置」小节。`noframe=0, title_bar_style=hidden` 使用去标题栏路径，`noframe=1` 使用无边框路径；覆盖层在 Windows 使用原生实现，Linux 使用默认 WebView 注入实现。

---

### 设置标题栏组件（`set_titlebar_components`）

```c
int32_t set_titlebar_components(uint32_t window_id, int32_t back,
    int32_t refresh, int32_t icon, int32_t minimize, int32_t maximize);

// 允许返回、显示刷新和窗口图标；允许最小化、最大化。
set_titlebar_components(window_id, 1, 1, 1, 1, 1);
```

Windows 专用。五个开关均为 `0/1`，每次调用设置全部五项：

| 参数 | 含义 |
| --- | --- |
| `back` | 是否允许返回按钮；有可回退历史时自动显示，否则隐藏 |
| `refresh` | 是否显示默认标题栏或 `BarOverlay` 的刷新按钮 |
| `icon` | 是否显示默认标题栏的窗口图标，不影响任务栏图标；`BarOverlay` 不绘制图标，只保存设置供切回默认标题栏使用 |
| `minimize` | 是否允许最小化，与创建期 `minimizable` 一致 |
| `maximize` | 是否允许最大化，与创建期 `maximizable` 一致 |

- `back=0` 始终隐藏返回按钮，`back=1` 仅在有可回退历史时显示；刷新按钮在页面加载期间禁用，点击重新加载当前页。
- 标题文字不受此接口控制；最小化、最大化开关不改变关闭按钮。
- 左侧按钮在 `title_bar_style=default` 和 `BarOverlay` 下显示。`BarOverlay` 只占按钮实际区域，不预留页面顶部高度，自定义标题内容需自行避让。
- 创建期的 `titlebar_back` / `titlebar_refresh` / `titlebar_icon` 默认均为 `1`，运行期调用会更新这组设置；切换标题栏样式后设置保留。
- 配色由 `set_titlebar_style` 控制。

**返回值**：`1` 已受理，`0` 拒绝；可用 `jade_last_error_code/message` 查原因。非 Windows 返回平台错误，非 `0/1` 参数返回参数错误。应在窗口创建就绪后调用。

```python
window.set_titlebar_components(back=True, refresh=True, icon=True, minimize=True, maximize=True)
```

### 设置标题栏样式（`set_titlebar_style`）

Windows 专用，统一设置默认标题栏和 `BarOverlay` 的高度与按钮配色。

```c
int32_t set_titlebar_style(uint32_t window_id, int32_t height,
    const char* background_color, const char* foreground_color,
    const char* button_background_color,
    const char* button_hover_background_color, const char* button_hover_foreground_color);
```

| 参数 | 含义 |
| --- | --- |
| `window_id` | 目标 Window ID，不是 WebView ID |
| `height` | `-1` 保持；`0` 恢复默认；自定义高度为 20–100 逻辑像素，超出范围会被拒绝 |
| `background_color` | 标题栏背景色，仅默认标题栏使用 |
| `foreground_color` | 标题文字与按钮常态图标共用的前景色，默认跟随主题。窗口失焦时，标题文字与未悬浮按钮使用淡化前景色 |
| `button_background_color` | 所有按钮的常态背景色，默认透明 |
| `button_hover_background_color` | 除关闭按钮外的悬浮背景色 |
| `button_hover_foreground_color` | 除关闭按钮外的悬浮图标色 |

颜色支持 `#RRGGBB`、`#RRGGBBAA`、`rgb(r,g,b)` 和 `rgba(r,g,b,a)`，其中 `a` 为 `0–1`。每次调用更新全部颜色。传 `NULL` 或空串 `""` 会清除该项自定义颜色，恢复当前窗口主题下的默认样式。默认标题栏和 `BarOverlay` 都适用。非法颜色使整次调用被拒绝。关闭按钮始终保留红色悬浮背景和白色图标。

`BarOverlay` 不绘制标题栏背景或标题文字，但保留设置供切回默认标题栏使用。样式在切换窗口帧后保留，窗口销毁时清理。

覆盖层属于 Window，空窗口也可使用；页面导航、缩放或默认 WebView 销毁不影响按钮。全屏时按钮隐藏，退出后恢复。宿主 EXE 需声明 Windows 8 或更新版本的兼容清单。

返回 `1` 表示已受理，`0` 表示拒绝，可通过 `jade_last_error_code/message` 查询原因。非 Windows 返回平台错误。

```python
window.set_titlebar_style(
    height=40,
    background_color="#202124",
    foreground_color="#F5F5F5",
    button_background_color="#00000000",
    button_hover_background_color="#3367D6",
    button_hover_foreground_color="#FFFFFF",
)
```

Python 传 `None`、空串 `""` 或省略颜色参数，都会恢复该项默认样式。

---

### 设置窗口明暗主题

控制窗口和 WebView 使用浅色、深色还是跟随系统主题。更细的说明见 [主题管理](/docs/v3api/theme-management)。

```c
int32_t set_window_theme(uint32_t window_id, const char* theme);
```

- `window_id` `uint32_t` - 目标 Window ID
- `theme` `string` - 主题字符串：`Light` / `Dark` / `System`

---

### 获取当前窗口主题

```c
int32_t get_window_theme(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID
- **返回值**：`1` 深色（Dark），`0` 浅色（Light）。`System` 主题按当前系统明暗解析；窗口不存在或主题未知时返回 `0`

---

### 设置窗口背景材质

Windows 11 下设置云母、亚克力等系统背景材质，可用字符串见 [主题管理](/docs/v3api/theme-management)。

```c
int32_t set_window_backdrop(uint32_t window_id, const char* backdrop_type);
```

- `window_id` `uint32_t` - 目标 Window ID
- `backdrop_type` `string` - 背景材质类型

:::warning{title=平台差异}
**仅 Windows 11**。Linux（WebKitGTK）无系统材质等价物，调用为 no-op 并返回 `0`、无视觉效果。如需半透明 / 纯色背景，请用 `set_window_background_color` 或窗口的 `transparent` + `background_color` 选项。
:::

---

### 设置窗口背景色

```c
int32_t set_window_background_color(uint32_t window_id, const char* background_color_hex);
```

- `window_id` `uint32_t` - 目标 Window ID
- `background_color_hex` `string` - 背景色十六进制字符串，如 `#FF0000`

---

### 请求重绘

通知系统重画客户区（一般很少需要手动调用）。

```c
int32_t request_redraw(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID

---

## 任务栏特效

### 设置任务栏进度条（`set_window_progress`）

在任务栏按钮上显示进度条（如下载进度、安装进度等）。

```c
int32_t set_window_progress(uint32_t window_id, int32_t progress, int32_t state);
```

- **参数**：
  - `window_id` `uint32_t`
  - `progress` `int32_t` - 进度值（0–100）
  - `state` `int32_t` - 状态：`0` 无进度、`1` 正常、`2` 暂停（黄色）、`3` 错误（红色）、`4` 不确定
- **返回值**：`1` 成功，`0` 失败

:::warning
仅 Windows 平台。
:::

---

### 任务栏图标闪烁（`flash_window`）

```c
int32_t flash_window(uint32_t window_id, uint32_t count);
```

- **参数**：`window_id` `uint32_t`；`count` `uint32_t` - 闪烁次数，`0` 停止闪烁
- **返回值**：`1` 成功，`0` 失败

:::warning
仅 Windows 平台。
:::

---

## 关闭窗口

### 关闭窗口（`close_window`）

发起关闭；若页面注册了 `beforeunload` 且用户选择留下，关闭可能被推迟或取消，具体以 WebView 与页面脚本为准。

```c
int32_t close_window(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID

#### 关闭流程

前端调用 `window.close()`、点击标题栏关闭按钮或按 Alt+F4 时，所有关闭方式走同一条流程：

1. 先派发 `window-closing`（宿主可拦截，回调返回非空指针即阻止关闭，见 [事件类型](/docs/v3api/event-types)）；
2. 关闭窗口并派发 `window-closed`；
3. 最后一个窗口关闭时派发 `window-all-closed`。

:::info{title=说明}
- **标题栏关闭按钮可拦截**：与 `window.close()`、Alt+F4 一致，可被 `window-closing` 回调拦住。
- **`close_window()`**：走「程序化关闭」语义，绕过 `window-closing` 直接关闭窗口。
:::

**关闭来源与页面地址：** `window-closing` 回调的 `event_data` 区分来源——`{"source":"system"}` 表示用户发起（Alt+F4、系统关闭按钮、标题栏关闭按钮）；`{"source":"frontend","url":"<页面当前地址>"}` 表示由前端 `window.close()` 发起。页面地址由 JadeView 直接读取 WebView 当前地址得到，不采用页面自报值。

**兜底：** 窗口若未经正常关闭流程就被销毁，仍会补发 `window-closed`（以及所有窗口都关闭时的 `window-all-closed`）并清理窗口状态，宿主不会漏收关闭通知。

最大化或固定尺寸窗口仍保留标题栏按钮。
