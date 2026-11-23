---
title: 本地协议服务
order: 0
group:
  title: 资源与本地服务
  order: 6
---

# 本地协议服务

## 设置本地协议服务路径

**用途**：将本地目录或 JAPK 资源包注册为 JadeView 内置访问的根目录，并生成一个协议 URL。页面里可以用这个地址加载 JS/CSS/图片，就像小型静态站点，而不必再自己起 Node 或 IIS。

```c
int32_t set_protocol_service_path(const char* root_path, char* url_buffer, size_t buffer_size, int32_t hot_reload);
```

**参数：**

- `root_path` `string` - 本地静态资源根。**两种形式**：
  - **目录**：指向包含 `index.html` 等前端产物的文件夹路径；
  - **`.japk` 文件**：指向磁盘上已存在的 JAPK 归档文件。JadeView 会映射该文件并在 `JADE://` 下按**包内相对路径**提供资源（不解压到临时目录）；请求未命中时同样回退到包内的 `index.html`（SPA）。扩展名匹配**不区分大小写**（如 `.JAPK`）。若归档中某些条目为「解包」存储（旁路 `.japk.unpacked` / 等价目录），实现会尝试从磁盘旁路读取对应字节。
- `url_buffer` `char*` - 输出参数，用于存储生成的协议 URL（NUL 结尾）
- `buffer_size` `size_t` - `url_buffer` 的字节容量（含结尾 NUL）
- `hot_reload` `i32`  - 是否启用热载模式。`1` = 启用，`0` = 禁用。仅文件系统模式有效，JAPK/ASAR 包模式下忽略

**返回值：**

- `1` - 成功
- `0` - 失败（路径无效、缓冲太小、尚未初始化等）

须在 **`app-ready` 成功之后**再调。


---

## 安全资源访问系统

宿主注册本地文件后得到资源 URL，将该 URL 原样交给页面加载。默认入口会自动选择合适路线；页面不需要知道底层模式，也不应拼接或改写返回的 URL。

受控模式返回同源相对路径 `/---jade---resource--?token=...`；Windows 原生模式返回完整 HTTPS URL。两种 URL 都可供 `video.src`、`img.src` 等使用；页面内不要使用 `jade://` 地址。

### 注册本地资源（`register_resource`）

将本地文件注册为安全资源，将资源 URL 写入 buffer。Windows 上的永久私有资源先尝试原生模式；条件不满足或注册失败时自动回退到受控模式。其它情况使用受控模式。默认 6 秒 TTL 不是永久资源，不会尝试原生模式。

```c
int32_t register_resource(const char* path, uint32_t window_id, uint32_t ttl_seconds, char* url_buffer, size_t buffer_size);
```

**参数：**

- `path` `string` - 本地文件绝对路径
- `window_id` `uint32_t` - 资源归属 **WebView ID**（头文件参数名沿用 `window_id`）；`0` = 显式全局共享
- `ttl_seconds` `uint32_t` - 过期秒数（`0` = 默认 6 秒，`UINT32_MAX` = 永不过期）
- `url_buffer` `char*` - 输出参数，用于存储相对路径或完整 HTTPS URL（NUL 结尾）
- `buffer_size` `size_t` - `url_buffer` 的字节容量（含结尾 NUL）

**返回值：**

- `1` - 成功
- `0` - 失败（路径无效、缓冲太小、尚未初始化等）

**渲染进程使用示例：**

```js
// resourceUrl 是宿主传入的 register_resource 返回值，原样使用。
document.querySelector("video").src = resourceUrl;
```

原生模式要求私有、Ready 的 WebView、永久 TTL、独占命名 Profile、允许的来源及支持硬链接的文件卷；不满足时回退。原生模式登记期间可能阻止其他程序原地写入文件，源路径被替换后仍指向登记时的文件对象。注销或 WebView 销毁后释放；BUSY 时先停止使用再重试。HEAD、条件请求和缓存由 WebView2 决定，与受控模式不同。需要 TTL、文件变化跟随或严格 HTTP 语义时，使用 `register_resource_ex` 的 `JADE_RESOURCE_CONTROLLED`。

### 注销安全资源（`unregister_resource`）

注销已注册的安全资源。

```c
int32_t unregister_resource(const char* token_or_url);
```

**参数：**

- `token_or_url` `string` - 受控模式 token 或返回的相对/完整 URL；原生模式传入完整 HTTPS URL

**返回值：**

- `1` - 成功
- `0` - 未找到

### 清理窗口资源（`clear_window_resources`）

清理指定 WebView 的所有已注册资源。

```c
int32_t clear_window_resources(uint32_t window_id);
```

**参数：**

- `window_id` `uint32_t` - 资源归属 **WebView ID**（头文件参数名沿用 `window_id`）

**返回值：**

- 清理的资源数量

### 受控模式特性

以下列表适用于受控模式；原生模式的 MIME、缓存及 Range 由 WebView2 决定。

| 特性 | 说明 |
|------|------|
| Token 安全 | 16字节随机数（SHA1 混合熵源），不可枚举 |
| 防路径穿越 | 注册时 `canonicalize()` + 检查文件存在 |
| 禁止目录注册 | `is_file()` 检查 |
| 自动过期 | `ttl_seconds` 参数，`0` = 默认6秒，`-1` = 永不过期 |
| 窗口级清理 | 窗口关闭时自动释放该窗口注册的所有资源 |
| Range 请求 | 支持 `Range: bytes=start-end`，返回 206 Partial Content，视频拖动不卡 |
| MIME 自动识别 | `mime_guess` 自动识别，不依赖渲染进程指定 |
| 注册表上限 | 最多 4096 条，超出自动清理最旧/过期的条目 |
| 缓存头 | `Cache-Control: no-cache`，与资源可撤销性一致 |

---

## 资源注册模式与能力

`register_resource` 自动选择路线；`register_resource_ex` 也允许固定受控或原生模式。签名、结构体与常量取自 `include/JadeView.h`。

> Windows 的永久私有资源会尝试原生模式，不满足条件时自动回退。显式选择原生模式失败时不会自动回退；Linux 不支持显式原生模式。

### 归属 ID

`register_resource` / `get_file_icon` / `clear_window_resources` 的 `window_id` 参数是 **WebView ID**（注册时可传 `0` 表示显式全局共享）。私有资源与大数据 token 不能由另一个视图读取或取消。

| 接口 | 参数名 | 实际含义 |
| --- | --- | --- |
| `register_resource` / `clear_window_resources` | `window_id` | WebView ID，`0` = 全局 |
| `get_file_icon` | `window_id` | WebView ID，`0` = 全局 |
| `register_resource_ex` / `get_resource_capabilities` / `get_resource_delivery_mode` | `webview_id` | 直接命名为 WebView ID |

### 常量

```c
#define JADE_RESOURCE_CONTROLLED    0
#define JADE_RESOURCE_NATIVE        1
#define JADE_RESOURCE_CAP_CONTROLLED 1
#define JADE_RESOURCE_CAP_NATIVE    2
```

前两个是 `ResourceOptions.mode` 与 `get_resource_delivery_mode` 输出的模式值；后两个是 `ResourceCapabilities.supported_modes` 的**位标志**（不是模式值）。

### 注册资源（显式模式）

#### `register_resource_ex`

```c
int32_t register_resource_ex(const char* path, uint32_t webview_id, uint32_t ttl_seconds, const struct ResourceOptions* options, char* url_buffer, size_t buffer_size);
```

| 参数 | 说明 |
| --- | --- |
| `path` | 本地文件绝对路径 |
| `webview_id` | 归属 WebView ID |
| `ttl_seconds` | 过期秒数；受控模式 `0` 为默认 6 秒，原生模式要求 `UINT32_MAX` |
| `options` | `NULL` 等同受控模式；见下方 `ResourceOptions` |
| `url_buffer` / `buffer_size` | 输出 URL 缓冲区 |

**返回值**：`1` 成功，`0` 失败（读 [`jade_last_error_code` / `jade_last_error_message`](/docs/v3api)）。

```c
typedef struct ResourceOptions {
  uint32_t mode;   /* 0=controlled (default), 1=native file */
} ResourceOptions;
```

头文件对两种模式的完整约定：

- **受控模式**：始终使用 JadeView 的资源处理器，提供条件请求、TTL 与全局资源能力。需要这些语义时应显式选择它。
- **原生模式**（显式 opt-in，仅 Windows）：要求私有的、**Ready** 状态的 WebView、`ttl_seconds = UINT32_MAX`、独占命名 Profile、不受限的 CORS；用**硬链接**固定被注册的文件对象而不复制文件。准备好的根目录覆盖支持硬链接的本地 temp / data-directory 卷，其它卷显式失败。新注册**无需刷新页面**。
- 原生模式输出为完整 **HTTPS** URL；它的虚拟主机域名与页面的 `https://jade.<域段>` 来源不同。
- 注册期间**拒绝就地写入**（in-place writers）；替换源路径不会重新绑定已注册的资源。
- 原生模式的 MIME / Range / 缓存 / 条件请求由**引擎**负责：HEAD 可能返回完整正文，条件头可能被忽略。
- 释放用 `unregister_resource`；返回 BUSY 时先脱离页面消费者再重试。已缓存或已打开的浏览器数据无法追回。

### 查询能力

#### `get_resource_capabilities`

```c
int32_t get_resource_capabilities(uint32_t webview_id, struct ResourceCapabilities* out);
```

> 查询 Ready 状态 WebView 的资源投递模式能力，返回 `JADE_OK` 或错误码。
> `supported_modes` bits: `JADE_RESOURCE_CAP_CONTROLLED` / `JADE_RESOURCE_CAP_NATIVE`.
> 原生模式要求资源私有、永久有效，且使用独占的命名 Profile。
> 这里的可用性指引擎与策略层面；文件所在文件系统还需支持硬链接。

```c
typedef struct ResourceCapabilities {
  uint32_t supported_modes;
  uint32_t native_requires_private_view;
  uint32_t native_requires_permanent;
  uint32_t native_requires_dedicated_profile;
  uint32_t native_registered;
  uint32_t native_pending_cleanup;
} ResourceCapabilities;
```

| 字段 | 含义 |
| --- | --- |
| `supported_modes` | 位标志：bit 1 = controlled、bit 2 = native 对该 Ready WebView 当前可用 |
| `native_requires_private_view` | 原生模式要求资源私有 |
| `native_requires_permanent` | 原生模式要求永久有效（TTL = `UINT32_MAX`） |
| `native_requires_dedicated_profile` | 原生模式要求独占命名 Profile |
| `native_registered` | 归属于该 WebView 的原生注册数 |
| `native_pending_cleanup` | 全局已退役、等待浏览器句柄释放的文件系统后备数 |

注意 `supported_modes` 反映的是**引擎与策略层面的可用性**，具体文件所在文件系统是否支持硬链接仍需单独满足；单个文件仍可能被拒绝。

#### `get_resource_delivery_mode`

```c
int32_t get_resource_delivery_mode(const char* url, uint32_t webview_id, uint32_t* out_mode);
```

> 对仍有效的资源 URL 及其归属 WebView，返回 `JADE_OK` 并写入实际投递模式。

传入**仍有效的资源 URL** 与其归属 `webview_id`（全局受控资源可传 0），`out_mode` 写入实际投递模式（`JADE_RESOURCE_CONTROLLED` / `JADE_RESOURCE_NATIVE`）。查询原生模式需要等待 UI 线程，不能从 UI 线程调用。

Python 示例：

```python
resource = view.resource(path, ttl_seconds=0xffffffff)  # 自动选择；可能回退
print(resource.mode)  # "controlled" 或 "native"
# 页面不再使用资源后：
resource.close()
```

`view.resource(path)` 的默认 TTL 仍为 6 秒，因此默认不会尝试原生模式；`native=False` 显式使用受控模式，`native=True` 显式请求原生模式并在不可用时报错。

### 与协议预算的关系

自动或显式选择的原生模式使用**引擎文件加载器**，不等于为旧 Wry 响应实现流式正文或背压。普通生产路径继续使用 Wry：

- 小于 2 MiB 的实际消息正文、注册文件及开放范围剩余正文完整交付，不按文件类型额外拆片；
- IPC 待发送正文、入站回调 payload 与内存 Bulk 原文共享 **256 MiB 预算**，资源读取预留 64 KiB 控制余量，超预算的完整 GET 或显式范围在分配正文前返回 503；
- Wry 资源响应对开放式 Range 使用动态范围窗口（上限 8 MiB）；提供一致的弱 ETag、修改日期与条件请求（304 / 412 / If-Range 回退）。

详见本页上文与 `include/JadeView.h`。
## 热载模式

开发阶段文件修改后自动刷新前端页面，无需手动刷新。

### 工作原理

1. 库递归监视 `root_path` 目录。
2. 文件创建、修改或删除后清除静态文件缓存。
3. 通过 `hot-reload` 事件通知渲染进程，页面自动执行 `location.reload()`。

### 热载事件（`hot-reload`）

文件变更时触发，`event_data` 为 JSON：

```json
{"paths": ["C:\\project\\index.html", "C:\\project\\style.css"]}
```

渲染进程无需手动监听此事件，IPC 运行时已内置自动刷新逻辑。

### 限制

- 仅 `ProtocolRoot::Fs`（文件系统目录）模式生效
- JAPK / ASAR 资源包模式下 `hot_reload` 参数被忽略
- 同一进程仅支持一个热载监视器实例


---



## Linux HTTPS 接入

宿主仍传 `jade://` 入口，页面使用相对链接和资源注册返回的 URL。命名且非无痕的 Profile 保持固定端口与独立环境；Profile 锁或端口冲突会导致创建失败。未命名或无痕视图为临时隔离，需要持久化存储时须显式命名 Profile。不涉及系统证书安装或全局 TLS 绕过。

实例证书只授权给对应 WebKit 上下文，不安装系统证书、不全局忽略 TLS 错误。传输复用现有资源 Range、条件请求和有界工作池，仍非文件流式正文。**当前仅完成源码接入，编译及原生媒体播放尚未验收。**

## 资源选路诊断

```c
struct ResourceDeliveryInfo {
    uint32_t mode;
    uint32_t reason;
    int32_t native_error_code;
    char *message;
};
int32_t get_resource_delivery_info(const char *url, uint32_t webview_id,
    struct ResourceDeliveryInfo *out, size_t capacity);
void free_resource_delivery_info(struct ResourceDeliveryInfo *out);
```

输出先清零，容量传 `sizeof(*out)`，成功返回 `JADE_OK`。成功后必须释放说明，重复查询前先释放旧结果；失败不修改输出。仅能查询尚未过期/注销且归属匹配的注册记录。Python 使用 `resource.delivery_info`，自动释放原生字符串。

| reason | 含义 |
| --- | --- |
| 0 | 显式选择受控路线 |
| 1 | 原生文件路线已选中 |
| 2 | 非永久 TTL；0 仍表示默认 6 秒 |
| 3 | 全局资源，无法使用私有原生路线 |
| 4 | 当前平台不提供原生文件映射 |
| 5 | 原生尝试失败，已成功回退受控路线 |

第 5 类保留原生错误码及具体说明，可区分 Profile、文件占用或卷/硬链接限制；不要依赖解析说明字符串编写业务逻辑。成功回退仍清空当前线程 last_error，诊断存储在资源记录中。原仅查询模式的接口保留。本次没有改变默认 TTL、自动选路或显式模式行为。
