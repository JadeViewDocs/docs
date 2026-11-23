---
title: 核心 API
order: 0
group:
  title: 概览
  order: 0
---

# 核心 API

本页覆盖运行时生命周期、路径查询、配置初始化、异步请求结果与错误处理，以及库分配字符串的所有权。

窗口创建与配置见[创建窗口](/docs/v3api/window/window-api)，窗口操作见[窗口对象](/docs/v3api/window/window-objects)及其他窗口分类；视图对象的创建、挂载、页面操作和布局见 [WebView API](/docs/v3api/page/webview-api)。两类对象各有一张配置字段表，分别在这两页。

---

V3 配置与 DLL/SDK 版本检查见 [ABI 契约](/docs/v3api/overview/abi)。默认初始化函数必须传入输出容量，并检查返回的错误码。

## 生命周期与启动

### 初始化运行时（`JadeView_init`）

**用途**：启动库内部的 **GUI 线程和事件循环**，并登记你的应用叫什么、数据放哪、要不要单实例。调用成功后，你还需等 **`app-ready`** 事件，再创建窗口或走本地协议。

```c
int32_t JadeView_init(int32_t enable_devmod, const char* log_path, const char* data_directory, const char* app_name, const char* app_signature, int32_t single_instance);
```

| 参数 | 说明 |
|------|------|
| `enable_devmod` | 是否打开**开发向能力**（如 DevTools、调试快捷键）。正式发布一般传 `0`。 |
| `log_path` | 日志写到哪个文件；传 `NULL` 表示不写文件（是否打控制台由实现决定）。 |
| `data_directory` | 数据根路径；`NULL` 或空则用系统默认（如 `%LOCALAPPDATA%`）。真正给 WebView 用的目录还会拼上 `app_signature` 相关子目录。 |
| `app_name` | **应用显示名**，必填，给协议、通知等场景用。 |
| `app_signature` | **应用唯一标识**，必填，至少 6 个字符，用来生成数据目录名、单实例管道名等；写错会导致初始化失败。 |
| `single_instance` | 非 `0` 时：**整台机器只允许一个你的进程**；再开一次会把命令行发给第一次启动的进程，当前这次 `JadeView_init` 会返回 `0`。 |

| 返回值 | 含义 |
|--------|------|
| `1` | 已去启动 GUI，**但还没就绪**，必须等 `app-ready`。 |
| `0` | 没启动起来（参数错、或作为第二实例被踢掉等）。 |

#### `app-ready` 里你会收到什么

成功与失败的 `event_data` 格式不同（成功是 JSON、失败是纯文本）。`app-ready` 是 App 来源事件，来源 ID 恒为 `0`；**判定成功必须解析正文的 `ok:true`**，不能靠来源 ID：

| 情况 | 来源 ID | `event_data` 大致长什么样 |
|------|---------|---------------------------|
| 正常启动完成 | `0` | JSON：`{"ok":true,"message":"success"}` |
| `app_name` / `app_signature` 校验失败 | `0` | 纯文本 `"<code>: <message>"`（`code` 为 `missing_app_name` / `missing_app_signature` / `app_signature_too_short`） |

> 程序运行期间的崩溃**不走 `app-ready`**，而是通过独立的 [`crash`](/docs/v3api/messaging/event-types) 事件上报。

请在 **`JadeView_init` 之前** 就 `jade_on("app-ready", ...)`，否则会漏掉第一条通知。初始化参数校验失败时 `JadeView_init` 直接返回 `0`；创建和消息入队成功也不等于页面已就绪或已接收。

---

### 运行消息循环（`run_message_loop`）

**用途**：在「exe 自己跑消息循环」的集成方式里可能用到。**它会阻塞当前线程，直到应用关停（如调用 `jadeview_exit`）才返回**。常见 **DLL 嵌入**场景下，循环已在 `JadeView_init` 里起的线程中跑，此函数为**可选、一般不用调**。

```c
int32_t run_message_loop(void);
```

---

### 退出应用（`jadeview_exit`）

**用途**：关掉所有 JadeView 窗口、收尾资源、让事件循环结束。该函数默认等待 GUI 事件循环和 JadeView 自有后台线程完成退出，成功返回后才适合卸载 DLL。

```c
int32_t jadeview_exit(void);
```

| 返回值 | 含义 |
|--------|------|
| `1` | 关闭、清理和等待均已完成。 |
| `0` | 失败（例如尚未完成初始化）。 |

---

### 带超时退出（`jadeview_exit_wait`）

**用途**：发起完整退出并等待 GUI 事件循环结束，可由宿主指定最大等待时间。适合 DLL 集成场景在 `FreeLibrary` 前确认 JadeView 已停止执行代码。

```c
int32_t jadeview_exit_wait(uint32_t timeout_ms);
```

| 参数 | 说明 |
|------|------|
| `timeout_ms` | 等待超时时间，单位为毫秒。传 `0` 时按最小等待时间处理。 |

| 返回值 | 含义 |
|--------|------|
| `1` | 退出清理已完成，GUI 线程和 JadeView 自有后台线程已完成收尾。 |
| `0` | 在指定时间内未完成退出，宿主不得立即卸载 DLL；应稍后再次调用等待。 |

:::warning{title=调用线程}
不要在 GUI 线程回调中等待自身。若从 GUI 线程调用，函数只会发起异步退出；请由宿主从其它线程再次调用 `jadeview_exit_wait`，并在返回 `1` 后再卸载 DLL。遇到活动挂载句柄或未返回的回调时会返回忙 / 未完成，此时必须保持库加载。关闭 Window 不会自动卸载包。
:::

---

## 路径查询

### 获取系统路径（`getPath`）

用**固定的英文关键字**查询一类目录的**绝对路径**，避免自己在 C 里拼环境变量、处理中文用户名路径。例如要放日志、读「我的文档」、找 exe 所在目录，都可以问这个接口。

```c
int32_t getPath(const char* name, char* buffer, size_t buffer_size);
```

| `name` | 大致对应（Windows 常见情况） |
|--------|------------------------------|
| `home` | 当前用户主目录（类似资源管理器里的「用户」文件夹上层里的个人目录）。 |
| `appData` | 按用户区分的应用数据目录（常接近 `%LOCALAPPDATA%`）。 |
| `sessionData` | 与 WebView 会话 / 缓存相关的目录（在 JadeView 配置的数据目录下的子路径）。 |
| `userData` | JadeView 的**数据目录**——`sessionData`（WebView 会话目录）与 `logs`（日志目录）的父目录。**目录不存在时自动创建**，宿主可直接往里写自己的数据文件。基址优先取 `JadeView_init` 传入的数据目录；未传时取系统应用数据目录（Windows 为 `%LOCALAPPDATA%`，Linux 为 `~/.config`），再拼上 `<应用签名>_data`。 |
| `temp` | 系统临时目录。 |
| `exe` | **当前主进程 exe** 的完整路径（谁加载了 DLL 就是谁）。 |
| `desktop` / `documents` / `downloads` / `music` / `pictures` / `videos` | 桌面、文档、下载、音乐、图片、视频等用户文件夹。 |
| `logs` | 应用日志目录（在数据目录下，不存在时可能会创建）。 |
| `app` | **exe 所在目录**（安装目录），适合读同目录资源。 |

**返回值：** 成功时返回**写入 `buffer` 的字节数**（不含结尾 `\0`）；若 `buffer` 太小，**返回负的所需字节数**（绝对值为容纳完整路径含 `\0` 所需大小），此时不写入内容；其余失败（如 `name` 不支持、指针无效）返回 `0`。

其它函数的分栏：本地协议服务见 [本地协议服务](/docs/v3api/resources/local-server-api)，菜单与右键菜单见 [菜单](/docs/v3api/menu/menu-api)，窗口菜单栏见 [窗口菜单栏](/docs/v3api/window/window-menu)，系统集成见 [系统集成 API](/docs/v3api/system/system-api)。

---

## 配置初始化

创建窗口 / 视图时若传入非空配置结构，必须先调用对应的默认值函数；仅把结构体清零不够，它们还会初始化尺寸等必要字段。宿主绑定的完整字段布局必须与 `include/JadeView.h` 一致。

<h3 id="webview-window-options">窗口配置默认值（`window_options_default`）</h3>

```c
int32_t window_options_default(struct WebViewWindowOptions* out, size_t capacity);
```

使用非空 `WebViewWindowOptions` 前调用，再按需赋值；传 `NULL` 给创建入口则使用默认值。字段说明见 [窗口 API](/docs/v3api/window/window-api)。

### 视图配置默认值（`webview_settings_default`）

```c
int32_t webview_settings_default(struct WebViewSettings* out, size_t capacity);
```

使用非空 `WebViewSettings` 前调用，再按需赋值；传 `NULL` 给创建入口则使用默认值。字段说明见 [WebView API](/docs/v3api/page/webview-api)。

---

## 异步请求

创建 / 挂载 / 销毁 / 脚本执行等操作统一使用 **64 位请求 ID**：调用返回 `uint64_t request_id`，真实结果随后查询。非零创建 ID 只表示请求已受理，不代表原生实例已就绪。

### 查询请求结果（`get_request_result`）

```c
int32_t get_request_result(uint64_t request_id, struct JadeRequestResult* out);
```

头文件给出的使用约定：

> 结果状态：`1` 已受理、`2` 等待中、`3` 成功、`4` 失败、`5` 已取消。
> 将 `out->message` 初始化为 `NULL`，用 `free_request_result` 释放后再 `release_request`。

即**调用前把 `out->message` 置为 `NULL`**，查询后先 `free_request_result` 释放字符串，再 `release_request` 释放结果记录。顺序不能颠倒。

```c
typedef struct JadeRequestResult {
  uint32_t state;
  int32_t error_code;
  uint32_t object_id;
  char *message;
} JadeRequestResult;
```

| 字段 | C 类型 | 含义 |
| --- | --- | --- |
| `state` | `uint32_t` | 请求状态，见下表 |
| `error_code` | `int32_t` | 失败时的错误码 |
| `object_id` | `uint32_t` | 关联对象 ID |
| `message` | `char*` | 库分配的说明字符串；由 `free_request_result` 释放 |

#### 请求结果状态

| 值 | 含义 |
| --- | --- |
| 1 | 已受理（accepted） |
| 2 | 等待中（waiting） |
| 3 | 成功（succeeded） |
| 4 | 失败（failed） |
| 5 | 已取消（cancelled） |

> 这套编号属于**请求结果**；对象生命周期状态是另一套 `JADE_STATE_*` 常量（见 [窗口 API](/docs/v3api/window/window-objects)），不要混用。

---

### 释放结果（`free_request_result` / `release_request`）

```c
void free_request_result(struct JadeRequestResult* result);
int32_t release_request(uint64_t request_id);
```

`free_request_result` 只释放结构体内的 `message` 等库分配内存；`release_request` 才把结果记录从注册表移除。终态结果默认保留 **300 秒**，期间可重复查询；到期或主动释放后该 request_id 不再有效。

```c
uint64_t rid = execute_webview_script(view_id, "1 + 1");

struct JadeRequestResult r;
r.message = NULL;                 /* 必须显式初始化 */
if (get_request_result(rid, &r) == JADE_OK) {
    /* r.state == 3 时处理结果；r.message 仅在释放前有效 */
}
free_request_result(&r);
release_request(rid);
```

---

### 限额与超时

达到上限时会**明确拒绝**，不会无限增长：

| 项目 | 上限 |
| --- | --- |
| 注册表对象 | 4096 个 |
| 请求结果 | 8192 条 |
| 对象与结果保留期 | 300 秒 |
| 操作默认截止时间 | 30 秒 |
| UI 命令队列 | 4096 条 |
| 原生通知 | 32768 条 / 16 MiB 正文 |
| invoke | 8 个复用线程，最多排队 32 项 |
| 协议 IO | 4 个线程，最多排队 128 项 |

超时**不回滚**已经发生的导航等副作用；脚本请求跟随前置导航等待对应文档，换页或重建后的旧结果不能写入新实例。

---

## 错误处理

### 读取调用线程的错误（`jade_last_error_code` / `jade_last_error_message`）

```c
int32_t jade_last_error_code(void);
char* jade_last_error_message(void);
```

这两个函数返回的是**当前调用线程上一次调用的同步错误**，不是异步结果。头文件注释：

> 复制线程局部的错误消息，用 `jade_text_free` 释放返回的字符串。

`jade_last_error_message` 返回库分配的副本，必须调用 `jade_text_free` 释放；异步操作的错误从 `JadeRequestResult.error_code` / `message` 读取。典型用法是在接口返回 `0` / `NULL` 时立刻读取：

```c
if (!send_ipc_message(view_id, "message", "hello")) {
    int32_t code = jade_last_error_code();
    char *msg = jade_last_error_message();
    /* ... 记录日志 ... */
    jade_text_free(msg);
}
```

---

### 错误码常量

`include/JadeView.h` 定义的错误码（`jade_last_error_code` 与 `JadeRequestResult.error_code` 的取值来源）：

| 常量 | 值 | 常量 | 值 |
| --- | --- | --- | --- |
| `JADE_OK` | 0 | `JADE_INSTANCE_REPLACED` | -9 |
| `JADE_INVALID_ARGUMENT` | -1 | `JADE_PARENT_DESTROYED` | -10 |
| `JADE_INVALID_ID` | -2 | `JADE_ID_EXHAUSTED` | -11 |
| `JADE_WRONG_OBJECT_TYPE` | -3 | `JADE_WOULD_DEADLOCK` | -12 |
| `JADE_INVALID_STATE` | -4 | `JADE_DOCUMENT_REPLACED` | -13 |
| `JADE_QUEUE_FULL` | -5 | `JADE_CANCELLED` | -14 |
| `JADE_NOT_RUNNING` | -6 | `JADE_TIMED_OUT` | -15 |
| `JADE_PLATFORM_ERROR` | -7 | | |
| `JADE_BUSY` | -8 | | |

其中 `JADE_WRONG_OBJECT_TYPE` 对应「把 Window ID 当成 WebView ID」这类错类型调用（见 [窗口 API](/docs/v3api/window/window-objects)）；`JADE_BUSY` 常见于 [JAPK 卸载](/docs/v3api/resources/japk) 与原生资源释放。

---

## 字符串所有权

```c
void jade_text_free(char* ptr);
char* jade_text_create(const char* text);
```

`jade_text_free` 用于释放库分配的字符串：`jade_last_error_message`、`get_japk_mount_root` 以及头文件注释中标明「调用方需使用 `jade_text_free` 释放」的返回值，都用它释放。`jade_text_create` 由库分配一份字符串副本。

> 注意区分：`yaml_get_str` 的返回值在头文件注释中要求用 `CoTaskMemFree` 释放，`free_request_result` 负责请求结果的 `message`，`free_webview_id_array` 负责视图 ID 数组——不能互相替代。
