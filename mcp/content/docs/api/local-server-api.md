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
int32_t set_protocol_service_path(
  const char* root_path,
  char* url_buffer,
  size_t buffer_size,
  int hot_reload
);
```

**参数：**

- `root_path` `string` - 本地静态资源根。**两种形式**：
  - **目录**：指向包含 `index.html` 等前端产物的文件夹路径；
  - **`.japk` 文件**：指向磁盘上已存在的 JAPK 归档文件。JadeView 会映射该文件并在 `JADE://` 下按**包内相对路径**提供资源（不解压到临时目录）；请求未命中时同样回退到包内的 `index.html`（SPA）。扩展名匹配**不区分大小写**（如 `.JAPK`）。若归档中某些条目为「解包」存储（旁路 `.japk.unpacked` / 等价目录），实现会尝试从磁盘旁路读取对应字节。
- `url_buffer` `char*` - 输出参数，用于存储生成的协议 URL（NUL 结尾）
- `buffer_size` `size_t` - `url_buffer` 的字节容量（含结尾 NUL）
- `hot_reload` `i32` *(2.2 新增)* - 是否启用热载模式。`1` = 启用，`0` = 禁用。仅文件系统模式有效，JAPK/ASAR 包模式下忽略

**返回值：**

- `1` - 成功
- `0` - 失败（路径无效、缓冲太小、尚未初始化等）

须在 **`app-ready` 成功之后**再调。

**与旧版 `create_local_server` 的差异**：过去要在参数里单独传 **`appname`**，用来拼内置主机名（如 `http://jade.{appname}/...`）。**2.0** 改为**只用 `JadeView_init` 已登记的 `app_signature`（小写化）**作为协议域，与 `app_name` 无关；因此 C API **少一个参数**，避免与初始化信息不一致。

| 旧 API | 2.0 |
|--------|-----|
| `create_local_server(root_path, appname, url_buffer, buffer_size)` | `set_protocol_service_path(root_path, url_buffer, buffer_size, hot_reload)` |

---

## 安全资源访问系统 *(2.2 新增)*

通过 token 机制安全地暴露本地文件给渲染进程。主进程注册资源 → 生成 token 路径 → 渲染进程仅访问已授权资源 → 协议服务动态映射。渲染进程只能看到 token 路径，无法推断真实文件路径。

### URL 格式

```
/---jade---resource--?token=xxx
```

渲染进程使用同源相对路径，浏览器基于当前页面 origin 自动解析。

### 注册本地资源（`register_resource`）

将本地文件注册为安全资源，将资源路径写入 buffer。

```c
int register_resource(
  const char* path,
  unsigned int window_id,
  unsigned int ttl_seconds,
  char* url_buffer,
  size_t buffer_size
);
```

**参数：**

- `path` `string` - 本地文件绝对路径
- `window_id` `unsigned int` - 所属窗口ID（`0` = 全局，所有窗口可访问）
- `ttl_seconds` `unsigned int` - 过期时间秒数（`0` = 默认6秒，`-1` = 永不过期）
- `url_buffer` `char*` - 输出参数，用于存储生成的 `/---jade---resource--?token=xxx` 路径（NUL 结尾）
- `buffer_size` `size_t` - `url_buffer` 的字节容量（含结尾 NUL）

**返回值：**

- `1` - 成功
- `0` - 失败（路径无效、缓冲太小、尚未初始化等）

**渲染进程使用示例：**

```html
<video src="/---jade---resource--?token=a3f8d2e1..." />
<img src="/---jade---resource--?token=b7c9f4d2..." />
```

### 注销安全资源（`unregister_resource`）

注销已注册的安全资源。

```c
int unregister_resource(const char* token_or_url);
```

**参数：**

- `token_or_url` `string` - token 字符串或完整路径 `/---jade---resource--?token=xxx`

**返回值：**

- `1` - 成功
- `0` - 未找到

### 清理窗口资源（`clear_window_resources`）

清理指定窗口的所有已注册资源（窗口关闭时自动调用）。

```c
int clear_window_resources(unsigned int window_id);
```

**参数：**

- `window_id` `unsigned int` - 窗口ID

**返回值：**

- 清理的资源数量

### 特性

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

## 热载模式 *(2.2 新增)*

开发阶段文件修改后自动刷新前端页面，无需手动刷新。

### 工作原理

1. 启用热载后，后台线程使用 `notify` crate 递归监视 `root_path` 目录
2. 检测到文件创建/修改/删除事件后，自动清除静态文件缓存
3. 通过 `hot-reload` 事件通知渲染进程，渲染进程自动执行 `location.reload()` 刷新页面
4. 内置 150ms 防抖，避免批量文件修改时频繁刷新

### 新增事件：`hot-reload`

文件变更时触发，`event_data` 为 JSON：

```json
{"paths": ["C:\\project\\index.html", "C:\\project\\style.css"]}
```

渲染进程无需手动监听此事件，IPC 运行时已内置自动刷新逻辑。

### 限制

- 仅 `ProtocolRoot::Fs`（文件系统目录）模式生效
- JAPK / ASAR 资源包模式下 `hot_reload` 参数被忽略
- 同一进程仅支持一个热载监视器实例

> **⚠️ 破坏性变更**：`set_protocol_service_path` 新增第 4 个参数 `hot_reload`，现有调用需补传 `0`。
