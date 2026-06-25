---
title: 工具 API
order: 1
group:
  title: 系统与工具
  order: 5
---

# 工具 API

这里的函数大多**不针对某个窗口**，而是：读版本、取系统路径、读语言和显示器信息、在数据目录里存配置、清理数据等。

与系统深度集成的接口（URL 协议、文件关联、全局热键、剪贴板、打印等）见 [系统集成 API](/docs/api/system-api)。

---

## 版本与系统信息

### 获取 JadeView 版本（`jadeview_version`）

拿到**当前这份 JadeView 动态库**的完整版本号（含构建号），用于关于页、日志头、排查问题时报版本。

```c
int32_t jadeview_version(char* buffer, size_t buffer_size);
```

| 参数 | 说明 |
|------|------|
| `buffer` | 输出缓冲区，写入 **UTF-8** 字符串，末尾带 `\0`。 |
| `buffer_size` | 缓冲区字节长度，必须够长，否则会失败。 |

| 返回值 | 含义 |
|--------|------|
| `1` | 成功写入版本字符串。 |
| `0` | 失败（空指针、缓冲区太小等）。 |

---

### 获取 WebView 版本（`get_webview_version`）

把本机 **WebView2 运行时**版本号写入 `buffer`（UTF-8 + `\0`）。**不是** JadeView DLL 自身版本（那是 `jadeview_version`）。

```c
int32_t get_webview_version(char* buffer, size_t buffer_size);
```

成功返回 `1`，失败 `0`（缓冲不够、指针无效等）。

---

### 获取系统语言（`getLocale`）

读取 **Windows 当前用户界面语言**（区域设置），得到一个标准语言标签字符串。常见用途：决定主进程或网页用中文还是英文界面、把语言参数传给渲染进程做 i18n。

```c
int32_t getLocale(char* buffer, size_t buffer_size);
```

写入示例：`zh-CN`、`en-US`。不是键盘布局，而是**系统显示语言/区域**那一套。

成功 `1`，失败 `0`（缓冲区不够、指针无效等）。

---

### 判断是否为 Windows 11（`is_windows_11`）

```c
int32_t is_windows_11(void);
```

当前系统为 **Windows 11** 返回 `1`，否则 `0`。用于判断是否可用 Mica/部分壳特性等。

---

## 路径与显示器

### 获取系统路径（`getPath`）

用**固定的英文关键字**查询一类目录的**绝对路径**，避免自己在 C 里拼环境变量、处理中文用户名路径。例如要放日志、读「我的文档」、找 exe 所在目录，都可以问这个接口。

```c
int32_t getPath(const char* name, char* buffer, size_t buffer_size);
```

| `name` | 大致对应（Windows 常见情况） |
|--------|------------------------------|
| `home` | 当前用户主目录（类似资源管理器里的「用户」文件夹上层里的个人目录）。 |
| `appData` | 按用户区分的应用数据目录（常接近 `%LOCALAPPDATA%`）。 |
| `sessionData` | 与 WebView 会话/缓存相关的目录（在 JadeView 配置的数据目录下的子路径）。 |
| `temp` | 系统临时目录。 |
| `exe` | **当前主进程 exe** 的完整路径（谁加载了 DLL 就是谁）。 |
| `desktop` / `documents` / `downloads` / `music` / `pictures` / `videos` | 桌面、文档、下载、音乐、图片、视频等用户文件夹。 |
| `logs` | 应用日志目录（在数据目录下，不存在时可能会创建）。 |
| `app` | **exe 所在目录**（安装目录），适合读同目录资源。 |

成功时把路径写入 `buffer`（UTF-8 + `\0`）。失败返回 `0`。

---

### 获取显示器信息（`get_displays_info`）

一次拿到**本机所有显示器**的布局和清晰度信息，方便你做：多显示器上决定窗口出现在哪块屏、算缩放后的逻辑坐标、判断哪块是主屏、适配高 DPI。

```c
int32_t get_displays_info(char* buffer, size_t buffer_size);
```

成功时 `buffer` 里是一段 **UTF-8 的 JSON 数组**，每个元素对应一块屏，常见字段含义：

| 字段 | 含义 |
|------|------|
| `bounds` | 整块屏幕在**虚拟桌面坐标系**里的位置和尺寸（物理像素）。 |
| `work_area` | **工作区**（去掉任务栏等占用的区域），适合算「窗口别挡住任务栏」。 |
| `scale_factor` | 缩放比例（如 1.0、1.25、1.5），和系统「缩放与布局」一致。 |
| `dpi_x` / `dpi_y` | DPI，做精细适配时可用。 |
| `is_primary` | 是否主显示器。 |

失败返回 `0`（缓冲不够、解析失败等）。

---


### 清空数据目录（`clear_data_directory`）

**清空**当前 JadeView 使用的数据目录里的内容（缓存、本地配置等），相当于「重置本应用在本机的数据」。必须传对确认令牌，防止误触。

```c
int32_t clear_data_directory(const char* confirm_token);
```

`confirm_token` 必须**完全等于**字符串 `I_UNDERSTAND_CLEAR_DATA`（与源码常量一致）。

---

## 文本处理

### 智能文本转码（`smart_convert_encoding`）

:::warning
v2.2 开始支持。
:::

自动检测输入文本编码，转换为目标编码。

```c
int32_t smart_convert_encoding(
  const uint8_t* input_data,
  int32_t input_len,
  const char* target_encoding,
  char* output_buffer,
  int32_t buffer_size,
  char* detected_encoding,
  int32_t detected_encoding_size
);
```

**参数：**

- `input_data` `const uint8_t*` - 输入字节流
- `input_len` `int32_t` - 输入字节长度
- `target_encoding` `const char*` - 目标编码名称，大小写不敏感，支持 WhatWG 标准名称和别名：
  - UTF-8：`utf-8`、`utf8`、`unicode-1-1-utf-8`
  - GBK：`gbk`、`gb2312`、`gb18030`、`chinese`、`csgb2312`
  - Shift_JIS：`shift_jis`、`sjis`、`shift-jis`、`ms_kanji`
  - Big5：`big5`、`big5-hkscs`、`cn-big5`、`csbig5`
  - EUC-KR：`euc-kr`、`cseuckr`、`korean`
  - windows-1252：`windows-1252`、`ascii`、`latin1`、`iso-8859-1`
  - 完整列表见 [WhatWG Encoding Standard](https://encoding.spec.whatwg.org/)
- `output_buffer` `char*` - 输出缓冲区（NUL 结尾）
- `buffer_size` `int32_t` - 输出缓冲区大小（字节）
- `detected_encoding` `char*` - [输出] 检测到的来源编码名称（可为 NULL）
- `detected_encoding_size` `int32_t` - detected_encoding 缓冲区大小

**返回值：**

| 返回值 | 含义 |
|--------|------|
| `>0` | 成功，写入输出缓冲区的字节数（不含 NUL） |
| `0` | 失败（参数无效、编码检测失败、目标编码不支持等） |
| `<0` | 缓冲区不足，绝对值为所需缓冲区大小 |

**检测逻辑：**

1. BOM 优先（UTF-8 BOM / UTF-16 LE BOM / UTF-16 BE BOM）
2. 无 BOM 时使用 chardetng 智能检测
3. 源编码与目标编码相同时直接复制

---

### 文本内存管理（`jade_text_create` / `jade_text_free`）

```c
char* jade_text_create(const char* text);
void jade_text_free(char* ptr);
```

- **`jade_text_create`**：把一段 **UTF-8** 文本拷到堆上，返回指针，供 **`register_ipc_handler`** 等返回**动态长度**应答；库读完应答后会 **`jade_text_free`**，与手动 `malloc`+`free` 混用易出错，请成对使用本 API。
- **`jade_text_free`**：释放由 **`jade_text_create`** 分配的指针；**不要**对栈内存、`malloc` 其它路径的指针调用。

若 `invoke` 只需**默认成功**、无自定义 JSON，可返回 **`NULL`** 或 **`(const char*)(uintptr_t)1`** 等占位（**不是**「阻止」；见 [IPC 通信 API](/docs/api/ipc-api)）。
