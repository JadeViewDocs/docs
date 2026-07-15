---
order: 1
group:
  title: "API Reference"
  order: 1
---

# 数据类型

The JadeView E-Language SDK defines several data types used to configure various properties of WebView windows and WebView views. Below are all the public data types:

## JadeView窗口设置

**Definition**: `.数据类型 JadeView窗口设置, 公开, 对窗口的设置`

**Description**: Used to configure various properties of a WebView window, including window size, position, title, theme, and more.

**Member list**:

| 成员名 | 类型 | Description | Default |
|-------|------|------|--------|
| 标题 | 文本型 | Window title; by default automatically follows the page title | Automatically follows the page title |
| 宽度 | 整数型 | Window width | 800 |
| 高度 | 整数型 | Window height | 600 |
| 可调整大小边框 | 逻辑型 | Whether the window is resizable | True |
| 去除标题栏 | 逻辑型 | Whether to remove the title bar (0 = show title bar, 1 = remove title bar) | False |
| 透明背景 | 逻辑型 | Whether the window is transparent | False |
| 背景颜色 | JadeRgb结构 | Window background color; conflicts with the transparent background property | - |
| 置顶窗口 | 逻辑型 | Whether the window is always on top | False |
| 禁止窗口居中 | 逻辑型 | Whether to disable window centering (0 = centered, 1 = not centered) | False |
| 窗口主题 | 文本型 | Window theme; the #主题_ constants can be used | Auto |
| 最大化 | 逻辑型 | Whether the window is displayed maximized | False |
| 最大化按钮 | 逻辑型 | Whether to show the maximize button | True |
| 最小化按钮 | 逻辑型 | Whether to show the minimize button | True |
| X坐标 | 整数型 | X coordinate (-1 means centered) | -1 |
| Y坐标 | 整数型 | Y coordinate (-1 means centered) | -1 |
| 最小宽度 | 整数型 | Minimum width; 0 means no limit | 0 |
| 最小高度 | 整数型 | Minimum height; 0 means no limit | 0 |
| 最大宽度 | 整数型 | Maximum width; 0 means no limit | 0 |
| 最大高度 | 整数型 | Maximum height; 0 means no limit | 0 |
| 全屏 | 逻辑型 | Whether to display in full screen | False |
| 焦点 | 逻辑型 | Whether to obtain focus | True |
| 隐藏窗口 | 逻辑型 | Whether to hide the window (0 = show window, 1 = hide window) | False |
| 使用页面图标 | 逻辑型 | Whether to use the page icon as the window icon | - |

**Example code**:

```e
.局部变量 窗口设置, JadeView窗口设置

窗口设置.标题 ＝ "我的 JadeView 应用"
窗口设置.宽度 ＝ 1024
窗口设置.高度 ＝ 768
窗口设置.窗口主题 ＝ #主题_自动
窗口设置.最大化按钮 ＝ 真
窗口设置.最小化按钮 ＝ 真
窗口设置.置顶窗口 ＝ 假
窗口设置.可调整大小边框 ＝ 真
```

## JadeView视窗设置

**Definition**: `.数据类型 JadeView视窗设置, 公开, 对浏览器的设置`

**Description**: Used to configure various properties of a WebView view, including media autoplay, the context menu, and more.

**Member list**:

| 成员名 | 类型 | Description | Default |
|-------|------|------|--------|
| 自动播放媒体 | 逻辑型 | Whether to autoplay media | False |
| 关闭后台限速 | 逻辑型 | Whether to throttle timers and rendering while running in the background | False |
| 禁用右键菜单 | 逻辑型 | Whether to disable the context menu (cannot be fully disabled; still available within edit boxes) | False |
| User_Agent | 文本型 | Custom User-Agent | - |
| preload_js | 文本型 | JavaScript code executed before the page loads | - |

**Example code**:

```e
.局部变量 视窗设置, JadeView视窗设置

视窗设置.自动播放媒体 ＝ 假
视窗设置.禁用右键菜单 ＝ 假
视窗设置.User_Agent ＝ "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
视窗设置.preload_js ＝ "console.log('JadeView WebView 已加载');"
```

## JadeRgb结构

**Definition**: `.数据类型 JadeRgb结构, 公开`

**Description**: Used to represent an RGB color value, containing four components: red, green, blue, and alpha (transparency).

**Member list**:

| 成员名 | 类型 | Description | Value range |
|-------|------|------|----------|
| R | 整数型 | Red component | 0-255 |
| G | 整数型 | Green component | 0-255 |
| B | 整数型 | Blue component | 0-255 |
| A | 整数型 | Alpha (transparency) component | 0-255 |

**Example code**:

```e
.局部变量 窗口设置, JadeView窗口设置
.局部变量 背景颜色, JadeRgb结构

' 设置背景颜色为半透明的蓝色
背景颜色.R ＝ 0
背景颜色.G ＝ 0
背景颜色.B ＝ 255
背景颜色.A ＝ 128

窗口设置.背景颜色 ＝ 背景颜色
窗口设置.透明背景 ＝ 假 ' 注意：背景颜色与透明背景属性冲突
```

## Usage Example

The following is a complete example demonstrating how to use these data types to create a WebView window:

```e
.版本 2

.程序集 窗口程序集_启动窗口

.子程序 __启动窗口_创建完毕
    
    .局部变量 窗口设置, JadeView窗口设置
    .局部变量 视窗设置, JadeView视窗设置
    .局部变量 背景颜色, JadeRgb结构
    .局部变量 窗口ID, 整数型
    .局部变量 初始化成功, 逻辑型
    .局部变量 服务器目录, 文本型
    .局部变量 载入URL, 文本型
    
    ' 初始化背景颜色（浅灰色）
    背景颜色.R ＝ 240
    背景颜色.G ＝ 240
    背景颜色.B ＝ 240
    背景颜色.A ＝ 255
    
    ' 初始化 JadeView
    初始化成功 ＝ JadeView.初始化(假, "", "")
    
    .如果真 (初始化成功 ＝ 假)
        调试输出 ("JadeView 初始化失败！")
        返回 ()
    .如果真结束
    
    ' 初始化窗口设置
    窗口设置.标题 ＝ "JadeView 示例应用"
    窗口设置.宽度 ＝ 900
    窗口设置.高度 ＝ 600
    窗口设置.窗口主题 ＝ #主题_自动
    窗口设置.背景颜色 ＝ 背景颜色
    窗口设置.最大化按钮 ＝ 真
    窗口设置.最小化按钮 ＝ 真
    窗口设置.可调整大小边框 ＝ 真
    窗口设置.去除标题栏 ＝ 真
    窗口设置.透明背景 ＝ 真
    窗口设置.置顶窗口 ＝ 真
    
    ' 初始化视窗设置
    视窗设置.自动播放媒体 ＝ 假
    视窗设置.禁用右键菜单 ＝ 假
    视窗设置.preload_js ＝ "console.log('JadeView WebView 已初始化');"
    
    ' 创建本地服务（可选）
    服务器目录 ＝ 取运行目录 () ＋ "\web"
    载入URL ＝ JadeView.创建本地服务 (到文本 (服务器目录), "jadeview")
    
    调试输出 ("本地服务URL：" ＋ 载入URL)
    
    ' 创建 WebView 窗口
    窗口ID ＝ JadeView.创建窗口(载入URL, 取窗口句柄(), 窗口设置, 视窗设置)
    
    .如果真 (窗口ID ＞ 0)
        调试输出 ("WebView 窗口创建成功，窗口ID：" ＋ 到文本 (窗口ID))
        ' 设置窗口可见
        JadeView.窗口置顶 (窗口ID, 假)
    .如果真结束

.子程序 __启动窗口_将被销毁
    
    ' 清理所有窗口
    JadeView.清理所有窗口()
```

## Notes

1. **Background color and transparent background**:
   - The `背景颜色` and `透明背景` properties conflict and cannot be used at the same time
   - If `透明背景` is set to true, the `背景颜色` setting is ignored
   - If `背景颜色` is set, the `透明背景` property should be set to false

2. **Window theme**:
   - It is recommended to use the theme constants provided by the SDK (`#主题_亮色`, `#主题_暗色`, `#主题_自动`)
   - Using string values directly ("Light", "Dark", "System") also works, but is not recommended

3. **Window size limits**:
   - `最小宽度`, `最小高度`, `最大宽度`, and `最大高度` are used to limit the adjustable range of the window
   - Setting them to 0 means no limit

4. **Coordinate settings**:
   - When `X坐标` and `Y坐标` are -1, the window is displayed centered
   - Other values represent the screen coordinates of the window's top-left corner

5. **Hidden window**:
   - When the `隐藏窗口` property is set to true, the window is not displayed
   - The window can be shown or hidden dynamically via the `set_window_visible` function

6. **User-Agent**:
   - A custom `User_Agent` can emulate different browser environments
   - It is recommended to customize the `User_Agent` only when necessary

7. **preload_js**:
   - `preload_js` can inject JavaScript code that needs to run before the page loads
   - It can be used to modify page behavior or inject custom features

## Summary

The JadeView E-Language SDK provides three main data types for configuring various properties of WebView windows and WebView views. These data types offer flexible configuration options, allowing developers to create various types of WebView applications according to their own needs.

When using these data types, it is recommended to:
- Understand the meaning and default value of each member
- Follow best practices, such as using theme constants and avoiding conflicting properties
- Choose the appropriate configuration options based on actual needs
- Refer to the example code to learn how to use these data types correctly

By configuring these data types appropriately, you can create feature-rich, visually polished WebView applications.
