---
title: 创建窗口
order: 0
group:
  title: 窗口
  order: 1
---

# 创建窗口

窗口与网页视图是两类独立对象：一个 Window 可以拥有多个 WebView，销毁某个 WebView 不会关闭窗口或其它视图，销毁 Window 会先销毁其全部 WebView。

窗口操作（标题、尺寸、位置、显隐、层级、主题、关闭等）使用 **Window ID**；页面操作（导航、历史、缩放、页面 URL、DevTools、打印、IPC、资源注册等）使用 **WebView ID**。两类 ID 共用一个不复用的编号空间，错类型传入会被明确拒绝。

`create_webview_window` 和 `create_window` 都返回 **Window ID**。使用 `create_webview_window` 后即可用 `get_default_webview(window_id)` 取得默认 WebView ID。独立创建 / 挂载视图的入口见 [WebView API](/docs/v3api/page/webview-api)。非零创建 ID 只表示**请求已受理**，不代表原生实例已就绪；Ready 表示原生实例可操作，页面加载完成由独立事件报告。

页面级接口见 [WebView API](/docs/v3api/page/webview-api)；网页权限请求的统一拦截见 [网页权限 API](/docs/v3api/page/permission-api)。除特别说明外，本页函数成功多为 `1`、失败为 `0`。

---

配置以 `struct_size` / `abi_version` 开头，默认初始化函数签名为 `window_options_default(out, sizeof(*out))`，成功返回 `JADE_OK`；创建时传 `NULL` 使用默认值。详见 [V3 ABI](/docs/v3api/overview/abi)。

`create_webview_window` 和 `create_window` 的最后一个参数都是可选的 [扩展配置 `features`](#窗口功能jadewindowfeatures)，用于设置内容保护、位置保存和启动画面。

运行时操作见[标题栏](/docs/v3api/window/titlebar-api)、[窗口对象](/docs/v3api/window/window-objects)及其他窗口分类。

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
- `webview_settings` `const struct WebViewSettings*` (可选) - 网页行为配置，字段说明见 [WebView API](/docs/v3api/page/webview-api)；`NULL` 使用默认值
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
| `background_material` | `const char*` | 创建时背景材质（不区分大小写），`NULL` 为 `default`。可添加 `_keepActive` 在失焦时保留材质，例如 `mica_keepActive`。参见[可用材料与运行要求](/docs/v3api/window/theme-management)。 |

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
| `splash` | `const struct JadeSplashOptions*` | `NULL` | Windows 窗口的启动画面，支持 LOGO、背景色、加载动画颜色和最短显示时间。空窗口首次挂载 WebView 时才可能显示。见[启动画面](/docs/v3api/window/splash-api) |

### 创建空窗口（`create_window`）

创建不带任何 WebView 的原生窗口。要往窗口里挂视图，见 [WebView API](/docs/v3api/page/webview-api)。

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

示例中的配置：

| 参数 | 说明 |
| --- | --- |
| `options.title` | 窗口标题。 |
| `options.width`、`options.height` | 初始窗口宽度和高度。其他字段见[窗口配置](#窗口配置webviewwindowoptions)。 |
| `splash.struct_size`、`splash.abi_version` | 填写结构体大小和 `JADE_ABI_VERSION`，用于校验启动画面配置。 |
| `splash.logo_path` | 启动画面使用的 LOGO 文件路径。 |
| `splash.minimum_ms` | 启动画面的最短显示时间，单位为毫秒。更多参数见[启动画面](/docs/v3api/window/splash-api)。 |
| `features.struct_size`、`features.abi_version` | 填写结构体大小和 `JADE_ABI_VERSION`，用于校验窗口功能配置。 |
| `features.auto_save_state` | 设为 `1` 时保存并恢复窗口位置。 |
| `features.splash` | 指向启动画面配置。其他功能字段见[窗口功能](#窗口功能jadewindowfeatures)。 |

`create_webview_window` 依次接收页面地址 `url`、父窗口 ID、窗口配置、WebView 配置和窗口功能配置。示例中父窗口 ID 为 `0`，表示顶层窗口；WebView 配置为 `NULL`，表示使用默认设置。返回的 `window_id` 为 `0` 时表示创建请求失败，否则可传给 `get_default_webview` 获取默认视图 ID。

创建成功即可取得默认 WebView ID。依赖原生窗口的操作应等窗口进入 Ready，依赖页面内容的操作应等对应的加载事件。

### 创建无边框窗口

将已初始化的 `options.noframe` 设为 `1`，继续调用 `create_webview_window`。从 `create_borderless_webview_window` 迁移时可沿用原有的 WebView 设置和窗口扩展配置。

```c
WebViewWindowOptions options;
if (window_options_default(&options, sizeof options) != JADE_OK) return;
options.noframe = 1;
uint32_t window_id = create_webview_window(url, 0, &options, webview_settings, features);
```

需要在一个窗口里放多个视图时，用 [WebView API](/docs/v3api/page/webview-api) 的 `add_webview` / `add_webview_to_window` 挂载额外视图。

---
