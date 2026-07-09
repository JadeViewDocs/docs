---
order: 90
---

# 快速开始

## 执行步骤

1. 注册应用就绪事件：`JadeView.App.注册事件(#事件_应用准备就绪, &回调就绪)`，**必须在  `JadeView.App.初始化` 之前执行**
2. 初始化内核：调用 `JadeView.App.初始化` 加载 jadeview_x86.dll
3. 运行消息循环：调用 `JadeView.App.消息循环` 阻塞主线程、分发所有异步事件
4. 创建 WebView 窗口：在 `#事件_应用准备就绪` 回调就绪 子程序 内部调用 `JadeView.窗口.创建` 生成页面窗口
5. 注册其它事件回调：使用 `JadeView.App.注册事件` 注册其他事件回调
6. 清理资源：监听 `#事件_全部窗口已关闭` 事件，回调内调用 `JadeView.App.退出` 统一释放全部内核资源

## 获取资源

- **JadeView官网**：[前往下载易语言模块](https://jade.run/download)

## 完整双向通讯示例（易语言后端 + 前端 HTML）

### 1、易语言代码

```
.版本 2

.程序集 程序集1

.子程序 _启动子程序, 整数型

' 1. 提前注册生命周期事件
JadeView.App.注册事件 (#事件_应用准备就绪, &回调就绪)
JadeView.App.注册事件 (#事件_所有窗口已关闭, &回调清理)

' 2. 初始化内核
JadeView.App.初始化 (真, “app.log”, “”, “演示程序”, “demo001”, 假)
' 3. 启动消息循环
JadeView.App.消息循环 ()
返回 (0)

.子程序 回调就绪
.参数 是否成功, 逻辑型
.参数 数据, 文本型
.局部变量 窗口设置, JadeView窗口设置
.局部变量 url, 文本型
.局部变量 视窗设置, JadeView视窗设置
.局部变量 主窗口ID, 整数型

url ＝ JadeView.协议服务.创建服务 (“./web”, 真)
窗口设置.宽度 ＝ 920
窗口设置.高度 ＝ 625
窗口设置.最大化按钮 ＝ 真
窗口设置.最小化按钮 ＝ 真
窗口设置.可调整大小边框 ＝ 真
窗口设置.隐藏窗口 ＝ 假
窗口设置.X坐标 ＝ -1
窗口设置.Y坐标 ＝ -1
窗口设置.透明背景 ＝ JadeView.系统.是否为Win11 ()
窗口设置.焦点 ＝ 真
窗口设置.置顶窗口 ＝ 真

窗口设置.标题 ＝ GBK文本到UTF8文本 (“Jade快速示例”)
窗口设置.边框样式 ＝ #标题栏_标题覆盖层
视窗设置.开启右键菜单 ＝ 真
' 4. 创建Web窗口
主窗口ID ＝ JadeView.窗口.创建 (url, 0, 窗口设置, 视窗设置)
' 5. 订阅前端关闭指令IPC事件
.如果真 (主窗口ID ＞ 0)  ' 判断窗口是否创建成功

    JadeView.通讯.订阅 (“send_msg”, &前端消息回调)


.如果真结束



.子程序 前端消息回调
.参数 窗口id, 整数型
.参数 数据, 文本型
.局部变量 接收文本, 文本型

接收文本 ＝ UTF8文本到GBK文本 (数据)

JadeView.通讯.广播 (窗口id, “backend_response”, “后端已收到：” ＋ 接收文本)

.子程序 回调清理
.参数 窗口id, 整数型
.参数 数据, 文本型

JadeView.App.退出 ()

```

### 2、前端文件 `./web/index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Jade快速示例</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            padding: 20px;
            background: #f5f5f5;
            height: 100vh;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        /* 消息展示框（截图上方白色圆角区域） */
        #msg_box {
            flex: 1;
            background: #fff;
            border-radius: 12px;
            padding: 20px;
            overflow-y: auto;
            font-size: 15px;
            line-height: 1.6;
        }
        /* 底部输入栏容器 */
        .input_wrap {
            display: flex;
            gap: 10px;
        }
        /* 输入框 */
        #input_text {
            flex: 1;
            padding: 12px 16px;
            font-size: 15px;
            border: 1px solid #ddd;
            border-radius: 6px;
            outline: none;
        }
        #input_text::placeholder {
            color: #999;
        }
        /* 蓝色发送按钮 */
        #send_btn {
            padding: 0 24px;
            background: #1677ff;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 15px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <!-- 消息展示区域：接收后端推送消息 -->
    <div id="msg_box"></div>

    <!-- 底部输入框+发送按钮，和截图完全一致 -->
    <div class="input_wrap">
        <input type="text" id="input_text" placeholder="发送IPC消息">
        <button id="send_btn" onclick="sendMsg()">发送</button>
    </div>

<script>
    const msgBox = document.getElementById("msg_box");
    const input = document.getElementById("input_text");

    // 监听后端推送的回复消息，追加到展示框
    jade.on("backend_response", function(text) {
        const item = document.createElement("div");
        item.style.marginBottom = "8px";
        item.textContent = text;
        msgBox.appendChild(item);
        // 自动滚动到底部
        msgBox.scrollTop = msgBox.scrollHeight;
    })

    // 点击发送按钮，向前端易语言发送IPC消息
    function sendMsg() {
        const content = input.value.trim();
        if (!content) return;
        // 前端调用后端指令
        jade.invoke("send_msg", content);
        // 清空输入框
        input.value = "";
    }

    // 回车快捷发送
    input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") sendMsg();
    })
</script>
</body>
</html>
```

## 部署与演示流程

1. 将 `jadeview_x86.dll` 放到项目程序同级目录；
2. 程序根目录新建 `web` 文件夹，放入上述 index.html；
3. 易语言导入`JadeView.ec`模块编译运行；

### 交互流程

1. 在底部输入框填写文字，点击蓝色【发送】按钮；
2. 前端通过`jade.invoke`把文本发送给易语言后端；
3. 易语言接收后拼接回复，通过`JadeView.通讯.广播`推送至页面；
4. 白色区域自动展示后端回复的全部消息，支持滚动查看多条记录。

