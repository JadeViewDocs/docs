---
order: 3
group:
  title: "API Reference"
  order: 1
---

# Standalone Public Methods

In addition to the JadeView class methods, the E-Language SDK also provides several standalone public methods. These methods can be called directly without going through a JadeView class instance.

## JadeView消息循环

**Function signature**: `JadeView消息循环 > 无返回值`

**Parameters**: None

**Return value**: None

**Description**: Runs and maintains the lifecycle of the main process. It must be called after initialization and is used to handle window events and IPC messages.

**Example code**:

```e
.局部变量 开启DevTools, 逻辑型

' 根据是否为调试版决定是否开启开发者工具
开启DevTools ＝ 是否为调试版()

' 整个初始化都是异步的
JadeView.初始化(开启DevTools, GBK文本到UTF8文本(取运行目录()) ＋ "\log.txt", 取运行目录())

' 订阅IPC消息
订阅IPC消息()

' 在异步中，千万不要等待返回后执行任何创建窗口操作
JadeView消息循环()

返回 (0)  ' 可以根据您的需要返回任意数值
```

**Description**: The message loop is the core function of JadeView. It blocks the current thread and continuously handles window events and IPC messages. All window creation and event handling must take place while the message loop is running. The message loop should be called immediately after initialization completes, rather than after creating a window.

**Notes**:
1. The initialization process is asynchronous, so do not perform operations such as window creation immediately after initialization.
2. The developer tools can be enabled dynamically based on the environment, making debugging easier.
3. The message loop blocks the current thread, so it should be the last call in the program.

## JadeView创建本地服务

**Function signature**: `JadeView创建本地服务 > 文本型`

**Parameters**:
| 参数名 | 类型 | 可空 | Description |
|-------|------|------|------|
| 路径 | 文本型 | 否 | The root directory path of the local service |
| 自定义域名 | 文本型 | 是 | The custom domain name; defaults to localhost |

**Return value**: Text type. Returns the server URL on success, or an empty string on failure.

**Description**: Creates a local HTTP server used to serve local files.

**Example code**:

```e
.局部变量 服务器URL, 文本型
服务器URL ＝ JadeView创建本地服务("D:\web\myapp", "localhost")
.如果真 (服务器URL ≠ "")
    调试输出 ("本地服务器创建成功：" ＋ 服务器URL)
    ' 使用返回的URL创建窗口
    JadeView.创建窗口(服务器URL, 0, , )
.否则
    调试输出 ("服务器创建失败")
.如果真结束
```

## GBK文本到UTF8文本

**Function signature**: `GBK文本到UTF8文本 > 文本型`

**Parameters**:
| 参数名 | 类型 | 可空 | Description |
|-------|------|------|------|
| GBK文本 | 文本型 | 否 | The GBK-encoded text to convert |

**Return value**: Text type. The converted UTF-8 encoded text.

**Description**: Converts GBK-encoded text to UTF-8 encoded text, used for encoding conversion when interacting with JavaScript.

**Example code**:

```e
.局部变量 GBK文本, 文本型
.局部变量 UTF8文本, 文本型
GBK文本 ＝ "测试文本"
UTF8文本 ＝ GBK文本到UTF8文本(GBK文本)
调试输出 ("转换后：" ＋ UTF8文本)
```

## UTF8文本到GBK文本

**Function signature**: `UTF8文本到GBK文本 > 文本型`

**Parameters**:
| 参数名 | 类型 | 可空 | Description |
|-------|------|------|------|
| UTF8文本 | 文本型 | 否 | The UTF-8 encoded text to convert |

**Return value**: Text type. The converted GBK encoded text.

**Description**: Converts UTF-8 encoded text to GBK encoded text, used for processing text data received from JavaScript.

**Example code**:

```e
.局部变量 UTF8文本, 文本型
.局部变量 GBK文本, 文本型
UTF8文本 ＝ "测试文本"
GBK文本 ＝ UTF8文本到GBK文本(UTF8文本)
调试输出 ("转换后：" ＋ GBK文本)
```
