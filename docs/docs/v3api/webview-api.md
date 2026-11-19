---
title: WebView API
order: 1
group:
  title: 窗口与视图
  order: 1
---

# WebView API（页面控制）

窗口与网页视图是两类独立对象：**窗口操作使用 Window ID，页面操作使用 WebView ID**。两类 ID 共用不复用的编号空间，错类型调用会被拒绝。

本页覆盖 WebView 对象的完整生命周期：配置、创建、挂载、销毁、重建，以及视图创建之后的页面操作与布局。窗口的创建与配置见 [窗口 API](/docs/v3api/window-api)。

`create_webview_window` / `create_borderless_webview_window` 返回 **Window ID**，用 `get_default_webview(window_id)` 取得该窗口的默认 WebView ID，不需要等待创建事件；`create_webview` / `add_webview` 直接返回 **WebView ID**。销毁默认 WebView 会清空默认关联，不会自动选择另一个实例；销毁 Window 会先销毁其所有 WebView。

非零创建 ID 只表示**请求已受理**，不代表原生实例已就绪。Ready 表示原生实例可操作，页面加载完成由独立的加载事件报告。

---

配置以 `struct_size` / `abi_version` 开头。默认初始化函数使用两个参数（`out, sizeof(*out)`），成功返回 `JADE_OK`；创建时传 NULL 使用默认值。详见 [V3 ABI](/docs/v3api/abi)。

## 创建与挂载 WebView

### 视图配置（`WebViewSettings`）

```c
typedef struct WebViewSettings {
  uint32_t struct_size;
  uint32_t abi_version;
  int32_t autoplay;
  int32_t background_throttling;
  int32_t allow_right_click;
  const char *user_agent;
  const char *preload_js;
  int32_t allow_fullscreen;
  const char *postmessage_allowed_origins;
  const char *cors_allowed_origins;
  int32_t password_autofill;
  int32_t form_autofill;
  int32_t incognito;
  int32_t disable_clipboard;
  const char *proxy_url;
  int32_t focused;
  const char *profile_name;
  int32_t devtools;
  double zoom_factor;
  const char *background_color;
} WebViewSettings;
```

| 字段 | C 类型 | 说明 |
| --- | --- | --- |
| `autoplay` | `int32_t` | 是否允许媒体自动播放（`0` 否、`1` 是） |
| `background_throttling` | `int32_t` | `0` / `2` 使用引擎默认行为，`1` 通过 WebView2 启动参数禁用后台定时器节流；Linux 的 `1` 和 `2` 均返回未实现错误。同一浏览器环境中的 WebView 必须使用相同策略，冲突时创建失败，可用不同 Profile 隔离 |
| `allow_right_click` | `int32_t` | 是否允许页面右键菜单（`0` 禁用、`1` 允许） |
| `user_agent` | `const char*` | 自定义 User-Agent，`NULL` 使用默认 UA |
| `preload_js` | `const char*` | 注入的 JavaScript **代码字符串**（不是文件路径，也不提供 Electron preload 的隔离环境），`NULL` 表示不预载 |
| `allow_fullscreen` | `int32_t` | 是否允许页面全屏 API |
| `postmessage_allowed_origins` | `const char*` | 允许向主进程发送 `postMessage` 的来源，逗号或分号分隔，`*` 表示所有来源；约束页面消息，不是浏览器同源策略总开关 |
| `cors_allowed_origins` | `const char*` | 允许跨源访问自定义协议的来源，逗号或分号分隔，`*` 表示所有来源；约束自定义协议跨源访问，不是浏览器同源策略总开关。Windows 未配置或为空白时，自定义协议 IPC 路径默认放行任意 Origin（包括远程页面），需要限制时必须显式设置；Linux 本地 HTTPS 不读取该字段，按每 View 凭据与同源校验 |
| `password_autofill` | `int32_t` | 账号 / 密码自动填充（`0` 禁用、`1` 启用），系统引擎支持范围不同 |
| `form_autofill` | `int32_t` | 通用表单自动填充（`0` 禁用、`1` 启用），系统引擎支持范围不同 |
| `incognito` | `int32_t` | 无痕 / 隐私浏览模式（`0` 正常、`1` 无痕） |
| `disable_clipboard` | `int32_t` | 禁用剪贴板读写权限（`0` 允许、`1` 禁用） |
| `proxy_url` | `const char*` | 代理 URL，如 `"http://127.0.0.1:7890"` 或 `"socks5://127.0.0.1:1080"`；`NULL` 不使用代理 |
| `focused` | `int32_t` | WebView 初始是否自动获取焦点（`0` 否、`1` 是） |
| `profile_name` | `const char*` | 命名 Profile。Linux 命名环境独占 WebView 并保持固定 HTTPS 来源，包括 incognito 和仅加载远程页面的视图；第二个同名视图创建失败。未命名视图临时隔离。Windows 沿用现有名称校验。Linux 接入尚待编译及原生播放验证。 |
| `devtools` | `int32_t` | `0` 跟随初始化时的全局 `devmod`、`1` 单独开启、`2` 单独关闭；只影响此 WebView，`devmod` 的其它行为不变 |
| `zoom_factor` | `double` | 页面初始缩放倍数，`0` 使用引擎默认 `1.0`，正数为缩放倍数。Windows 在首次导航前应用；Linux 由 Wry 创建后应用，不保证首帧前生效 |
| `background_color` | `const char*` | WebView 背景色 `#RRGGBB` / `#RRGGBBAA`，`NULL` 继承窗口背景；页面不透明背景仍会遮挡它，窗口设置 `transparent=1` 时 Wry 会忽略背景色。Windows 仅支持完全透明或完全不透明，中间透明度会变为不透明 |

:::warning
使用非空配置前必须先调用 `webview_settings_default`（`NULL` 表示使用默认值）。宿主绑定的完整字段布局必须与 `include/JadeView.h` 一致。
:::

---

### 创建逻辑 WebView（`create_webview`）

创建 WebView 逻辑对象，原生引擎在挂载到窗口时才分配。

```c
uint32_t create_webview(const char* url, const struct WebViewSettings* settings);
```

- `url` `string` - 初始地址
- `settings` `const struct WebViewSettings*` - `NULL` 使用默认值
- **返回值**：`uint32_t`，非零为已受理的 WebView ID

---

### 一步创建并挂载（`add_webview`）

新建 WebView 并挂到指定窗口，是常用的组合入口。

```c
uint32_t add_webview(uint32_t window_id, const char* url, const struct WebViewSettings* settings, const struct WebViewBounds* bounds);
```

- `window_id` `uint32_t` - 目标 Window ID；**允许父窗口尚在创建中**
- `url` `string` - 初始地址
- `settings` / `bounds` - 传 `NULL` 使用默认值，布局结构见[布局](#布局)
- **返回值**：`uint32_t`，非零为 WebView ID

各创建入口复用同一个原生构建核心。Windows 子 WebView 创建时先计算并应用初始 CSS 布局，原生处理器及边界就绪后才开始初始导航；默认创建、增加和重建复用这一流程。

---

### 挂载已有 WebView（`add_webview_to_window`）

把 `create_webview` 得到的逻辑对象挂到窗口上。

```c
uint64_t add_webview_to_window(uint32_t window_id, uint32_t webview_id, const struct WebViewBounds* bounds);
```

- `window_id` `uint32_t` - 目标 Window ID
- `webview_id` `uint32_t` - 待挂载的 WebView ID
- `bounds` `const struct WebViewBounds*` - 布局，`NULL` 使用默认值
- **返回值**：`uint64_t` 请求 ID，结果见[核心 API](/docs/v3api/index)

---

### 典型调用顺序

```c
/* 创建窗口：返回 Window ID */
uint32_t window_id = create_webview_window(url, 0, NULL, NULL, NULL);
uint32_t view_id   = get_default_webview(window_id);

/* 追加一个独立视图，使用自定义设置与布局 */
struct WebViewSettings settings;
webview_settings_default(&settings, sizeof settings);
settings.user_agent = "MyApp/1.0";
uint32_t second = add_webview(window_id, "https://example.com", &settings, NULL);

/* 页面操作一律用 WebView ID */
send_ipc_message(view_id, "message", "hello");

/* 销毁第二个视图不影响窗口和默认视图 */
destroy_webview(second);
```

---

## 视图生命周期

以下操作除查询类接口外，返回值都是 `uint64_t` 请求 ID，结果见[核心 API](/docs/v3api/index)。

### 销毁视图（`destroy_webview`）

```c
uint64_t destroy_webview(uint32_t webview_id);
```

销毁指定 WebView。若它是窗口的默认视图，默认关联会被清空而不自动改选其它实例。

---

### 重建视图（`recreate_webview`）

```c
uint64_t recreate_webview(uint32_t webview_id, const char* url, const struct WebViewSettings* settings);
```

用新的 URL / 设置重建视图。换页或重建前的旧请求结果不能写入新实例。

---

### 显示 / 隐藏（`set_webview_visible`）

```c
uint64_t set_webview_visible(uint32_t webview_id, int32_t visible);
```

`visible` 传 `0` / `1`。

---

### 聚焦（`focus_webview`）

```c
uint64_t focus_webview(uint32_t webview_id);
```

---

## 导航与历史

### 导航到 URL（`navigate_to_url`）

让指定视图打开另一个地址（http、file、自定义协议等）。

```c
int32_t navigate_to_url(uint32_t webview_id, const char* url, const char* headers_json);
```

- `webview_id` `uint32_t` - 目标 WebView ID
- `url` `string` - 要导航到的地址
- `headers_json` `string` (可选) - JSON 对象格式的请求头，如 `{"Authorization":"Bearer xxx","X-Custom":"value"}`。传入 `NULL` 或空字符串时不附加自定义请求头

---

### 后退（`webview_go_back`）

```c
int32_t webview_go_back(uint32_t webview_id);
```

- **参数**：`webview_id` `uint32_t`，目标 WebView ID。
- **返回值**：`1` 表示指令已进入消息队列，`0` 表示参数无效或消息队列不可用。

---

### 前进（`webview_go_forward`）

```c
int32_t webview_go_forward(uint32_t webview_id);
```

- **参数**：`webview_id` `uint32_t`，目标 WebView ID。
- **返回值**：`1` 表示指令已进入消息队列，`0` 表示参数无效或消息队列不可用。

---

### 查询是否可后退（`webview_can_go_back`）

```c
int32_t webview_can_go_back(uint32_t webview_id);
```

- **参数**：`webview_id` `uint32_t`，目标 WebView ID。
- **返回值**：`1` 表示可以后退，`0` 表示不可以或视图不存在。

---

### 查询是否可前进（`webview_can_go_forward`）

```c
int32_t webview_can_go_forward(uint32_t webview_id);
```

- **参数**：`webview_id` `uint32_t`，目标 WebView ID。
- **返回值**：`1` 表示可以前进，`0` 表示不可以或视图不存在。

---

### 使用说明

- 前进 / 后退操作的是 WebView 原生历史栈，对 `window.history.pushState` 产生的历史条目同样生效。
- `webview_can_go_back` / `webview_can_go_forward` 是同步查询，适合用于更新工具栏按钮状态。
- 页面刚创建且没有历史记录时，`webview_can_go_back()` 通常返回 `0`；建议在 `webview-did-finish-load` 之后再查询。
- 同步查询接口不要在事件回调内部调用，避免事件循环线程死锁。

```c
uint32_t window_id = create_webview_window("https://example.com/page-a", 0, NULL, NULL, NULL);
uint32_t view_id   = get_default_webview(window_id);

/* 等待 webview-did-finish-load 后再调用 */
if (webview_can_go_back(view_id)) {
    webview_go_back(view_id);
}

if (webview_can_go_forward(view_id)) {
    webview_go_forward(view_id);
}
```

---

### 刷新页面（`reload_webview_window`）

重新加载当前页，和用户按 F5 类似。

```c
int32_t reload_webview_window(uint32_t webview_id);
```

- `webview_id` `uint32_t` - 目标 WebView ID

---

### 异步导航与刷新（`navigate_webview` / `reload_webview`）

```c
uint64_t navigate_webview(uint32_t webview_id, const char* url);
uint64_t reload_webview(uint32_t webview_id);
```

返回 `uint64_t` 请求 ID，结果见[核心 API](/docs/v3api/index)。

---

### 设置网页缩放（`set_webview_zoom`）

整页缩放，例如 `1.0` 为 100%，`1.5` 为 150%。

```c
int32_t set_webview_zoom(uint32_t webview_id, double level);
```

- `webview_id` `uint32_t` - 目标 WebView ID
- `level` `double` - 缩放比例

---

### 清除浏览数据（`clear_browsing_data`）

清除指定视图的所有浏览数据（Cookie / 缓存 / LocalStorage 等）。

```c
int32_t clear_browsing_data(uint32_t webview_id);
```

- **参数**：`webview_id` `uint32_t`，目标 WebView ID
- **返回值**：仅表示请求已提交（异步 fire-and-forget），恒返回 `1`；不代表浏览数据是否真正清除成功

---

### 查询页面 URL（`get_webview_url`）

```c
int32_t get_webview_url(uint32_t webview_id, char* buffer, int32_t buffer_size);
```

URL 以 UTF-8 字符串写入 `buffer`。调用失败时可用 [`jade_last_error_code`](/docs/v3api/index) 读取当前线程错误。

---

## 执行脚本

### `execute_webview_script`

往页面里注入并执行一段 JavaScript，返回 `uint64_t` 请求 ID。

```c
uint64_t execute_webview_script(uint32_t webview_id, const char* script);
```

- `webview_id` `uint32_t` - 目标 WebView ID
- `script` `string` - 要执行的 JavaScript 代码

**结果**：通过 [64 位请求结果](/docs/v3api/index) 查询（`get_request_result` / `free_request_result` / `release_request`）。非零请求 ID 只表示请求已受理，不代表脚本执行成功；脚本跟随前置导航等待对应文档，换页或重建后的旧结果不会写入新实例。标题栏内部脚本使用无返回值动作。

```c
struct JadeRequestResult r = {0};
uint64_t rid = execute_webview_script(view_id, "1 + 1");
if (get_request_result(rid, &r) == JADE_OK) {
    /* r.state / r.error_code / r.message */
    free_request_result(&r);
}
release_request(rid);
```

---

## DevTools

> 需在创建视图时启用 devtools（`WebViewSettings.devtools`，或 `JadeView_init` 的 `enable_devmod`）。

### 打开 DevTools（`open_devtools`）

```c
int32_t open_devtools(uint32_t webview_id);
```

- **参数**：`webview_id` `uint32_t`，目标 WebView ID
- **返回值**：仅表示请求已提交（异步 fire-and-forget），恒返回 `1`；不代表 DevTools 是否真正打开

---

### 关闭 DevTools（`close_devtools`）

```c
int32_t close_devtools(uint32_t webview_id);
```

- **参数**：`webview_id` `uint32_t`，目标 WebView ID
- **返回值**：仅表示请求已提交（异步 fire-and-forget），恒返回 `1`；不代表 DevTools 是否真正关闭
- **平台说明**：所有平台都会调用，Windows / WebView2 上为 no-op（不报错、仍返回 `1`）

---

### 查询 DevTools 是否打开（`is_devtools_open`）

```c
int32_t is_devtools_open(uint32_t webview_id);
```

- **参数**：`webview_id` `uint32_t`，目标 WebView ID
- **返回值**：`1` = 已打开，`0` = 未打开

---

## 打印

### 打印 WebView 内容（`jade_print`）

打开系统标准打印对话框，打印当前 WebView 内容。

```c
int32_t jade_print(uint32_t window_id);
```

- `window_id` `uint32_t` - 传入目标 **WebView ID**（头文件参数名沿用 `window_id`）
- **返回值**：仅表示请求已提交（异步 fire-and-forget），恒返回 `1`；不代表打印对话框真正弹出或打印成功

:::info{title=平台支持}
Windows（WebView2）与 Linux（WebKitGTK）均可用——底层走 wry 跨平台的 `webview.print()`。
:::

---

## 运行时信息

### 获取 WebView 版本（`get_webview_version`）

读出本机安装的 **Microsoft WebView2 运行时**版本号（不是 JadeView 版本）。写入 `buffer`（UTF-8 + `\0`）。

```c
int32_t get_webview_version(char* buffer, size_t buffer_size);
```

与 [工具 API](/docs/v3api/tools-api) 中的说明一致。

---

## 布局

### 布局结构（`WebViewBounds`）

```c
typedef struct WebViewBounds {
  const char *x;
  const char *y;
  const char *width;
  const char *height;
} WebViewBounds;
```

四个字段都是 **UTF-8 字符串**，不是数值。默认值为 `0, 0, 100%, 100%`。表达式支持：

| 写法 | 说明 |
| --- | --- |
| `100%` | 百分比 |
| `20px` | 逻辑像素 |
| `50%-20px` | 混合运算 |
| `calc` 风格表达式、括号、标量乘除 | 按表达式求值 |

约束与行为：

- `px` 为逻辑像素；窗口尺寸与 DPI 变化时会重新计算，初始布局与 resize 共用同一套计算逻辑，相同布局不重复调用原生设置。
- 宽高为负的动态结果**钳制为零**。
- 非法表达式**整组拒绝并保留旧布局**，不会出现部分字段生效。
- Windows 子 WebView 在创建时即计算并应用初始 CSS 布局，原生处理器及边界就绪后才开始初始导航；默认创建、增加和重建复用此流程。

---

### 设置布局（`set_webview_bounds`）

```c
uint64_t set_webview_bounds(uint32_t webview_id, const struct WebViewBounds* bounds);
```

返回 `uint64_t` 请求 ID，结果见[核心 API](/docs/v3api/index)。

```c
struct WebViewBounds b = {"10px", "0", "50%-20px", "100%"};
uint64_t rid = set_webview_bounds(view_id, &b);
```

---

### 查询布局（`get_webview_bounds` / `free_webview_bounds_result`）

```c
int32_t get_webview_bounds(uint32_t webview_id, struct WebViewBoundsResult* out);
void free_webview_bounds_result(struct WebViewBoundsResult* out);
```

返回**已应用布局的快照**，不等待 UI 线程；调用前把 `out` 中所有字符串指针置 `NULL`，复用结构体前必须先调用 `free_webview_bounds_result` 释放。

```c
typedef struct WebViewBoundsResult {
  struct WebViewBounds bounds;      /* 原始表达式（四个字符串） */
  struct LogicalRect logical;      /* 应用后的逻辑矩形 */
  struct PhysicalRect physical;    /* 应用后的物理矩形 */
} WebViewBoundsResult;

typedef struct LogicalRect {
  double x;  double y;  double width;  double height;
} LogicalRect;

typedef struct PhysicalRect {
  int32_t x;  int32_t y;  uint32_t width;  uint32_t height;
} PhysicalRect;
```

| 结构体 | 字段 | C 类型 |
| --- | --- | --- |
| `LogicalRect` | `x` / `y` / `width` / `height` | `double` |
| `PhysicalRect` | `x` / `y` | `int32_t` |
| `PhysicalRect` | `width` / `height` | `uint32_t` |
