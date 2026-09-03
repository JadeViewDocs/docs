---
title: 对话框 API
order: 0
group:
  title: 原生 UI
  order: 4
---

# 对话框 API

对话框 API 提供了弹出 Windows 原生对话框的功能，包括文件选择、另存为、消息提示框等，无需自己绘制 UI。

2.0 预览版对该模块做了重构：
- 同步接口默认阻塞并直接返回 JSON 字符串
- 补充了 `*_async` 异步接口

---

## 公共约定

在使用对话框 API 之前，先了解一些通用的参数和约定：

- `window_id` - 作为父窗口，决定对话框模态挂在谁上面
- `filters` - 文件对话框的文件类型筛选，值为 JSON 数组字符串，如 `[{"name":"图片文件","extensions":["jpg","png"]}]`；`extensions` 里可用 `"*"` 表示所有文件
- `properties` - 打开对话框的行为选项，用逗号分隔的特性名，如 `openFile,openDirectory,multiSelections,showHiddenFiles`
- 同步返回值 - `char*`（UTF-8 JSON），使用后必须调用 `jade_text_free()` 释放
- 异步回调 - `void (JADEVIEW_CALL *callback)(const char* json_result)`，指针由库侧管理，回调返回后失效

:::error{title="重要提醒"}
`jade_dialog_show_open_dialog`、`jade_dialog_show_save_dialog`、`jade_dialog_show_message_box` 的同步返回值都是 JadeView 在堆上分配的字符串。

你只要拿到 `char*`，无论成功、取消还是错误返回，都应在使用完成后调用一次 `jade_text_free(ptr)`。

如果不释放，长期运行会持续泄漏内存；如果重复释放或释放非 JadeView 分配的指针，可能导致崩溃。
:::

---

## C++ 简单示例（同步 API）

```cpp
#include "JadeView.h"
#include <cstdio>

void example_sync_dialog() {
  FileDialogParams params = {};
  params.window_id = 1;
  params.title = "Select file";
  params.default_path = "D:/";
  params.filters = R"([{"name":"Images","extensions":["jpg","png"]}])";
  params.properties = "openFile";

  char* json = jade_dialog_show_open_dialog(&params);
  if (json) {
    std::printf("open dialog result: %s\n", json);
    jade_text_free(json);  // 同步返回字符串必须释放
  }
}
```

---

## C++ 简单示例（异步 API）

```cpp
#include "JadeView.h"
#include <cstdio>

void JADEVIEW_CALL OnMessageBoxDone(const char* json_result) {
  std::printf("message box result: %s\n", json_result ? json_result : "{}");
}

void example_async_dialog() {
  MessageBoxParams params = {};
  params.window_id = 1;
  params.title = "Confirm";
  params.message = "Continue?";
  params.buttons = "OK|Cancel";
  params.default_id = 0;
  params.cancel_id = 1;
  params.type_ = "question";

  int32_t ok = jade_dialog_show_message_box_async(&params, OnMessageBoxDone);
  std::printf("launch async dialog: %d\n", ok);
}
```

---

## 文件对话框参数结构

2.0 预览版将旧的 `OpenDialogParams` 和 `SaveDialogParams` 合并为统一的 `FileDialogParams` 结构体，用于配置文件对话框的各种选项。

```c
typedef struct FileDialogParams {
  uint32_t window_id;
  const char *title;
  const char *default_path;
  const char *button_label;
  const char *filters;
  const char *properties;
} FileDialogParams;
```

**参数详细说明：**

- `window_id` `uint32_t` - 父窗口 ID，对话框会作为该窗口的模态对话框弹出。传 `0` 表示没有特定父窗口
- `title` `string` (可选) - 对话框标题栏文字，传 `NULL` 或空字符串使用默认标题
- `default_path` `string` (可选) - 默认打开的路径，对话框打开时会定位到这个目录。传 `NULL` 或空字符串使用系统默认位置
- `button_label` `string` (可选) - 确认按钮的文字，只在部分系统上生效。传 `NULL` 或空字符串使用默认文字
- `filters` `string` - 文件类型筛选规则，JSON 数组字符串，定义可以选择哪些类型的文件
- `properties` `string` (可选) - 对话框行为选项，用逗号分隔的特性名字符串，控制对话框的功能

### filters 参数示例

```json
[
  {
    "name": "图片文件",
    "extensions": ["jpg", "jpeg", "png", "gif"]
  },
  {
    "name": "所有文件",
    "extensions": ["*"]
  }
]
```

### properties 参数可选值

- `openFile` - 允许选择文件
- `openDirectory` - 允许选择文件夹
- `multiSelections` - 允许选择多个文件/文件夹
- `showHiddenFiles` - 显示隐藏文件 **（当前未实现，忽略）**
- `createDirectory` - 允许创建新文件夹 **（当前未实现，忽略）**
- `treatPackageAsDirectory` - 将包当作目录处理（macOS）**（当前未实现，忽略）**

:::warning{title="实际生效范围"}
当前真正会被解析的属性：**Windows** 仅 `openFile` / `openDirectory` / `multiSelections`；**Linux** 仅 `openDirectory` / `multiSelections`。其余属性会被忽略。
:::

### properties 参数示例

```
openFile,multiSelections,showHiddenFiles
```

---

## 打开文件对话框（同步）

弹出"打开文件"对话框，选择一个或多个文件。该函数为同步阻塞接口，直接返回 JSON 字符串。

```c
char* jade_dialog_show_open_dialog(const FileDialogParams* params);
```

**参数：**

- `params` `FileDialogParams*` - 指向 `FileDialogParams` 结构体的指针，配置对话框选项

**返回值：**

返回 UTF-8 编码的 JSON 字符串，使用后必须调用 `jade_text_free()` 释放。

**返回 JSON 示例：**

**成功选择单个文件：**

```json
{
  "canceled": false,
  "filePaths": ["D:/Documents/image.jpg"]
}
```

**成功选择多个文件（需要开启 multiSelections）：**

```json
{
  "canceled": false,
  "filePaths": ["D:/a.jpg", "D:/b.png"]
}
```

**用户取消选择：**

```json
{
  "canceled": true,
  "filePaths": []
}
```

---

## 保存文件对话框（同步）

弹出"另存为"对话框，选择文件保存位置。该函数为同步阻塞接口，直接返回 JSON 字符串。

```c
char* jade_dialog_show_save_dialog(const FileDialogParams* params);
```

**参数：**

- `params` `FileDialogParams*` - 指向 `FileDialogParams` 结构体的指针，配置对话框选项

**返回值：**

返回 UTF-8 编码的 JSON 字符串，使用后必须调用 `jade_text_free()` 释放。

**返回 JSON 示例：**

**成功选择保存位置：**

```json
{
  "canceled": false,
  "filePath": "D:/Documents/output.txt"
}
```

**用户取消保存：**

```json
{
  "canceled": true,
  "filePath": null
}
```

---

## 消息提示框（同步）

弹出带图标的提示框（信息、警告、错误等），可以自定义按钮。该函数为同步阻塞接口，直接返回 JSON 字符串。

```c
typedef struct MessageBoxParams {
  uint32_t window_id;
  const char *title;
  const char *message;
  const char *detail;
  const char *buttons;
  int32_t default_id;
  int32_t cancel_id;
  const char *type_;
} MessageBoxParams;

char* jade_dialog_show_message_box(const MessageBoxParams* params);
```

**消息框参数说明（`MessageBoxParams`）：**

- `window_id` `uint32_t` - 父窗口 ID，传 `0` 表示没有特定父窗口
- `title` `string` - 对话框标题栏文字
- `message` `string` - 主提示文字，显示在对话框上方
- `detail` `string` (可选) - 补充说明文字，显示在主提示下方，可以是多行
- `buttons` `string` - 按钮列表，用 `\|` 分隔。**注意**：当前两平台实际只支持「确定」或「确定 + 取消」两种形态——按钮串中包含「取消」（Windows 识别中文「取消」，Linux 还识别英文 `cancel`）时显示「确定 + 取消」，否则只显示「确定」。自定义按钮文字（除用于识别取消外）以及第 3 个及以后的按钮均不生效
- `default_id` `int32_t` - 默认聚焦的按钮索引，从 0 开始
- `cancel_id` `int32_t` - 按 Esc 键或点击关闭按钮时触发的按钮索引，从 0 开始
- `type_` `string` - 对话框类型，控制图标风格

### type_ 可选值

- `none` - 无图标
- `info` - 信息提示 ℹ️
- `warning` - 警告提示 ⚠️
- `error` - 错误提示 ❌
- `question` - 询问提示 ❓

**返回值：**

返回 UTF-8 编码的 JSON 字符串，使用后必须调用 `jade_text_free()` 释放。

**返回 JSON 示例：**

```json
{
  "response": 0
}
```

`response` 字段为用户点击的按钮：`0` = 确定，`1` = 取消，`-1` = 关闭/异常。受上面 `buttons` 限制，不会出现 `2` 及更大的索引。

---

## 快速错误提示框

快速弹出一个错误提示，只有标题和内容，一般用于严重错误、不需要用户选择多个按钮的场景。

```c
int32_t jade_dialog_show_error_box(
  uint32_t window_id, 
  const char* title, 
  const char* content
);
```

**参数：**

- `window_id` `uint32_t` - 父窗口 ID，传 `0` 表示没有特定父窗口
- `title` `string` - 错误提示标题
- `content` `string` - 错误提示内容

**返回值：**

- `1` - 成功弹出提示框
- `0` - 失败

---

## 异步对话框 API

如果不希望阻塞主线程，可以使用异步版本的对话框 API。

```c
typedef void (JADEVIEW_CALL *DialogAsyncCallback)(const char* json_result);

int32_t jade_dialog_show_open_dialog_async(
    const FileDialogParams* params,
    DialogAsyncCallback callback);

int32_t jade_dialog_show_save_dialog_async(
    const FileDialogParams* params,
    DialogAsyncCallback callback);

int32_t JADEVIEW_CALL jade_dialog_show_message_box_async(
    const MessageBoxParams* params,
    DialogAsyncCallback callback);
```

**参数：**

- `params` - 对话框参数结构体指针
- `callback` `DialogAsyncCallback` - 异步回调，函数签名为 `void (JADEVIEW_CALL *)(const char* json_result)`，参数是 UTF-8 JSON 结果

**返回值：**

- `1` - 成功发起对话框
- `0` - 失败

**注意事项：**

- 返回 `1/0` 表示是否成功发起对话框
- 用户操作完成后，通过 `callback` 返回 UTF-8 JSON 结果
- 回调参数由库侧管理；若需长期持有，请自行拷贝字符串
- 回调返回后，`json_result` 指针不再有效

## 打印对话框

### 打印本地文件（`jade_print_dialog`）

:::warning
v2.2 开始支持。
:::

使用系统关联程序打印指定文件，弹出系统打印对话框。

```c
int32_t jade_print_dialog(const char* file_path);
```

- **参数**：`file_path` `string` - 要打印的文件绝对路径
- **返回值**：`1` = 成功，`0` = 失败

与 `jade_print(window_id)` 的区别：

| API | 用途 |
|-----|------|
| `jade_print(window_id)` | 打印网页内容（WebView 内置打印对话框） |
| `jade_print_dialog(file_path)` | 打印本地文件 |

:::info{title=平台支持}
Windows 与 Linux 均可用：
- **Windows**：`ShellExecuteW("print", file_path)`，由系统按扩展名调关联程序执行打印。
- **Linux**：CUPS `lp <file>` 提交到默认打印机；返回 `1` 表示作业**提交成功**（与 Windows 的"已启动打印"语义一致，非"已出纸"）。需安装 CUPS 客户端（`cups-client`）。
:::

---

## 关于对话框

### 显示关于对话框（`show_about_dialog`）

:::warning
v2.2 开始支持。
:::

弹出系统标准的「关于」对话框。

```c
int show_about_dialog(uint32_t window_id);
```

- 应用名称自动从 `JadeView_init` 时设置的 `app_name` 读取
- 图标自动使用窗口当前图标

:::warning{title=平台差异}
目前**仅 Windows** 实现；**Linux 为 no-op**（暂未接入 GTK 关于对话框）。文件选择、保存、消息框等其他对话框 Linux 均已支持（GTK3）。
:::

---

## 破坏性变更（必须修改）

从旧版本升级到 2.0 时，需要注意以下变更：

- 删除 `OpenDialogParams` / `SaveDialogParams`，改用 `FileDialogParams`
- `MessageBoxParams` 不再包含 `blocking/callback`
- `jade_dialog_show_open_dialog` / `jade_dialog_show_save_dialog` / `jade_dialog_show_message_box` 从返回 `int32_t` 变为返回 `char*`
- 所有同步返回的字符串都必须 `jade_text_free()` 释放

---

## 迁移建议（最短路径）

1. 先更新 FFI 声明：结构体与 `restype/argtypes` 一并调整
2. 同步流程改为直接读取返回 JSON，不再依赖 `blocking` 切换与回调
3. 需要非阻塞行为时，改用 `*_async` 接口
4. 为同步接口封装统一释放习惯：**读取结果 → 业务处理 → `jade_text_free`**（建议用 `try/finally` 或等价机制保证释放）

---

## 网页里调用

页面用 **`jade.dialog.*`**，返回 Promise，见 [对话框前端 API](/docs/api/dialog-frontend-api)。
