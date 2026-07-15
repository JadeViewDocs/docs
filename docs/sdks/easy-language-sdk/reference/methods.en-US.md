---
order: 2
group:
  title: "API Reference"
  order: 1
---

# JadeView Class Methods

The JadeView class is the core class of the E-Language SDK. It provides a series of methods for managing WebView windows and interacting with the WebView. Below are all the public methods:

## 初始化

**Function signature**: `初始化 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| DevTools | 逻辑型 | Yes | Whether to enable the developer tools |
| 日志路径 | 文本型 | Yes | The path for enabling JadeView log output |
| 数据目录 | 文本型 | Yes | The data storage directory |

**Return value**: 逻辑型, whether initialization succeeded

**Description**: Initializes the JadeView runtime environment. This must be called before using any other method.

**Example code**:

```e
.局部变量 初始化成功, 逻辑型
初始化成功 ＝ JadeView.初始化(假, "", "")
.如果真 (初始化成功 ＝ 假)
    调试输出 ("JadeView 初始化失败！")
    返回 ()
.如果真结束
```

## 创建窗口

**Function signature**: `创建窗口 > 整数型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| url | 文本型 | No | The URL the window should load |
| 父窗口id | 整数型 | Yes | The handle of the parent window |
| 窗口设置 | JadeView窗口设置 | Yes | The window configuration options |
| 视窗设置 | JadeView视窗设置 | Yes | The configuration options for the browser viewport |

**Return value**: 整数型, returns the window ID on success, or 0 on failure

**Description**: Creates a new WebView window.

**Example code**:

```e
.局部变量 窗口设置, JadeView窗口设置
.局部变量 视窗设置, JadeView视窗设置
.局部变量 窗口ID, 整数型

窗口设置.标题 ＝ "JadeView 示例应用"
窗口设置.宽度 ＝ 900
窗口设置.高度 ＝ 600
窗口设置.窗口主题 ＝ #主题_自动

窗口ID ＝ JadeView.创建窗口("https://www.example.com"0, 窗口设置, 视窗设置)
.如果真 (窗口ID ＞ 0)
    调试输出 ("WebView 窗口创建成功，窗口ID：" ＋ 到文本 (窗口ID))
.如果真结束
```

## 设置窗口标题

**Function signature**: `设置窗口标题 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| WinId | 整数型 | No | The window ID |
| 窗口标题 | 文本型 | Yes | The window title; if left empty, it follows the page title |

**Return value**: 逻辑型, whether the setting succeeded

**Description**: Sets the title of the specified window.

**Example code**:

```e
JadeView.设置窗口标题(窗口ID, "新的窗口标题")
```

## ipc_订阅

**Function signature**: `ipc_订阅 > 无返回值`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 通道 | 文本型 | No | The message channel name |
| 回调函数 | 子程序指针 | No | The message callback function |

**Return value**: None

**Description**: Subscribes to messages sent from the front end.

**Example code**:

```e
JadeView.ipc_订阅("message_channel", &消息回调函数)
```

## 注册程序事件

**Function signature**: `注册程序事件 > 整数型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 事件名称 | 文本型 | No | The event name |
| 回调函数 | 子程序指针 | No | The event callback function |

**Return value**: 整数型, the event ID, used to unregister the event

**Description**: Registers a callback function for an application event.

**Example code**:

```e
.局部变量 事件ID, 整数型
事件ID ＝ JadeView.注册程序事件("window_close", &窗口关闭回调)
```

## 注销程序事件

**Function signature**: `注销程序事件 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 事件名称 | 文本型 | No | The event name |
| 事件ID | 整数型 | No | The event ID to unregister |

**Return value**: 逻辑型, whether unregistering succeeded

**Description**: Unregisters a previously registered application event.

**Example code**:

```e
JadeView.注销程序事件("window_close", 事件ID)
```

## ipc_广播

**Function signature**: `ipc_广播 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口ID | 整数型 | No | The window ID |
| 通道 | 文本型 | No | The message channel name |
| 消息内容 | 文本型 | No | The message content |

**Return value**: 逻辑型, whether the broadcast succeeded

**Description**: Broadcasts a message to the front end.

**Example code**:

```e
JadeView.ipc_广播(窗口ID, "message_channel", "Hello from Easy Language!")
```

## 设置窗口主题

**Function signature**: `设置窗口主题 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口ID | 整数型 | No | The window ID |
| 主题 | 文本型 | No | The theme name, using a #主题_ constant |

**Return value**: 逻辑型, whether the setting succeeded

**Description**: Sets the theme of the specified window.

**Example code**:

```e
JadeView.设置窗口主题(窗口ID, #主题_暗色)
```

## 重绘窗口

**Function signature**: `重绘窗口 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口id | 整数型 | No | The window ID |

**Return value**: 逻辑型, whether the redraw succeeded

**Description**: Requests a redraw of the specified window.

**Example code**:

```e
JadeView.重绘窗口(窗口ID)
```

## 获取窗口主题

**Function signature**: `获取窗口主题 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口id | 整数型 | No | The window ID |

**Return value**: 逻辑型, True = dark theme, False = light theme

**Description**: Gets the current theme of the specified window.

**Example code**:

```e
.局部变量 是暗黑主题, 逻辑型
是暗黑主题 ＝ JadeView.获取窗口主题(窗口ID)
```

## 设置背景材料

**Function signature**: `设置背景材料 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口id | 整数型 | No | The window ID |
| 背景材料 | 文本型 | No | The background material type: mica, micaAlt, acrylic |

**Return value**: 逻辑型, whether the setting succeeded

**Description**: Sets the background material of the window. The window background must be cleared before setting it.

**Example code**:

```e
JadeView.设置背景材料(窗口ID, "mica")
```

## 禁用窗口

**Function signature**: `禁用窗口 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口id | 整数型 | No | The window ID |
| 禁用 | 逻辑型 | Yes | Whether to disable the window |

**Return value**: 逻辑型, whether the operation succeeded

**Description**: Enables or disables the specified window.

**Example code**:

```e
JadeView.禁用窗口(窗口ID, 真) ' 禁用窗口
JadeView.禁用窗口(窗口ID, 假) ' 启用窗口
```

## 创建RGBA颜色

**Function signature**: `创建RGBA颜色 > JadeRgb结构`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| R | 整数型 | No | The red component, 0-255 |
| G | 整数型 | No | The green component, 0-255 |
| B | 整数型 | No | The blue component, 0-255 |
| A | 双精度小数型 | Yes | The alpha component, 0-255, default 255 |

**Return value**: JadeRgb结构, the created color object

**Description**: Creates an RGBA color object.

**Example code**:

```e
.局部变量 背景颜色, JadeRgb结构
背景颜色 ＝ JadeView.创建RGBA颜色(255, 0, 0, 128) ' 半透明红色
```

## 设置最大化状态

**Function signature**: `设置最大化状态 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口ID | 整数型 | No | The window ID |

**Return value**: 逻辑型, whether the operation succeeded

**Description**: Toggles the maximized state of the specified window.

**Example code**:

```e
JadeView.设置最大化状态(窗口ID)
```

## 销毁窗口

**Function signature**: `销毁窗口 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口ID | 整数型 | No | The window ID |

**Return value**: 逻辑型, whether the operation succeeded

**Description**: Destroys the specified window and releases its resources.

**Example code**:

```e
JadeView.销毁窗口(窗口ID)
```

## 最小化窗口

**Function signature**: `最小化窗口 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口ID | 整数型 | No | The window ID |

**Return value**: 逻辑型, whether the operation succeeded

**Description**: Minimizes the specified window.

**Example code**:

```e
JadeView.最小化窗口(窗口ID)
```

## 显示或隐藏窗口

**Function signature**: `显示或隐藏窗口 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口ID | 整数型 | No | The window ID |
| 是否显示 | 逻辑型 | No | Whether to show the window |

**Return value**: 逻辑型, whether the operation succeeded

**Description**: Shows or hides the specified window.

**Example code**:

```e
JadeView.显示或隐藏窗口(窗口ID, 真) ' 显示窗口
JadeView.显示或隐藏窗口(窗口ID, 假) ' 隐藏窗口
```

## 设置全屏

**Function signature**: `设置全屏 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口ID | 整数型 | No | The window ID |
| 是否全屏 | 逻辑型 | No | Whether to display in full screen |

**Return value**: 逻辑型, whether the operation succeeded

**Description**: Sets the specified window to full screen or windowed mode.

**Example code**:

```e
JadeView.设置全屏(窗口ID, 真) ' 全屏显示
JadeView.设置全屏(窗口ID, 假) ' 窗口化显示
```

## 焦点窗口

**Function signature**: `焦点窗口 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口ID | 整数型 | No | The window ID |

**Return value**: 逻辑型, whether the operation succeeded

**Description**: Sets the focus to the specified window.

**Example code**:

```e
JadeView.焦点窗口(窗口ID)
```

## 窗口置顶

**Function signature**: `窗口置顶 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口ID | 整数型 | No | The window ID |
| 是否置顶 | 逻辑型 | No | Whether to always stay on top |

**Return value**: 逻辑型, whether the operation succeeded

**Description**: Sets whether the specified window is always kept on top.

**Example code**:

```e
JadeView.窗口置顶(窗口ID, 真) ' 始终置顶
JadeView.窗口置顶(窗口ID, 假) ' 取消置顶
```

## 获取窗口数量

**Function signature**: `获取窗口数量 > 整数型`

**Parameters**: None

**Return value**: 整数型, the current number of windows

**Description**: Gets the number of windows created by JadeView.

**Example code**:

```e
.局部变量 窗口数量, 整数型
窗口数量 ＝ JadeView.获取窗口数量()
调试输出 ("当前窗口数量：" ＋ 到文本 (窗口数量))
```

## 退出

**Function signature**: `退出 > 逻辑型`

**Parameters**: None

**Return value**: 逻辑型, whether the operation succeeded

**Description**: Forcibly cleans up all windows. It is recommended to call this before the program exits.

**Example code**:

```e
JadeView.退出()
```

## 设置窗口大小

**Function signature**: `设置窗口大小 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口id | 整数型 | No | The window ID |
| 宽度 | 整数型 | No | The window width |
| 高度 | 整数型 | No | The window height |

**Return value**: 逻辑型, whether the operation succeeded

**Description**: Sets the size of the specified window.

**Example code**:

```e
JadeView.设置窗口大小(窗口ID, 1024, 768)
```

## 设置窗口位置

**Function signature**: `设置窗口位置 > 逻辑型`

**Parameters**:
| Parameter name | Type | Nullable | Description |
|-------|------|------|------|
| 窗口id | 整数型 | No | The window ID |
| x | 整数型 | No | The X coordinate |
| y | 整数型 | No | The Y coordinate |

**Return value**: 逻辑型, whether the operation succeeded

**Description**: Sets the position of the specified window.

**Example code**:

```e
JadeView.设置窗口位置(窗口ID, 100, 100)
```

## 获取WebView版本

**Function signature**: `获取WebView版本 > 文本型`

**Parameters**: None

**Return value**: 文本型, the WebView version number

**Description**: Gets the version of the WebView currently in use.

**Example code**:

```e
.局部变量 版本, 文本型
版本 ＝ JadeView.获取WebView版本()
调试输出 ("WebView版本：" ＋ 版本)
```
