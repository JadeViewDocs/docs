---
order: 90
---

## Execution Steps

1. Register app ready event: `JadeView.App.RegisterEvent(#Event_AppReady, &Callback_Ready)`. This step **must be executed before `JadeView.App.Init`**.
2. Initialize kernel: Call `JadeView.App.Init` to load `jadeview_x86.dll`.
3. Run message loop: Call `JadeView.App.MessageLoop` to block the main thread and dispatch all asynchronous events.
4. Create WebView window: Invoke `JadeView.Window.Create` inside the `#Event_AppReady` callback subroutine to generate the page window.
5. Register other event callbacks: Use `JadeView.App.RegisterEvent` to subscribe to IPC, tray, hotkey and other business events.
6. Clean up resources: Listen for the `#Event_AllWindowsClosed` event and call `JadeView.App.Exit` inside its callback to release all kernel resources uniformly.

## Get SDK Source Code

- GitHub Repository: [Download SDK Source Code](https://link.wtturl.cn/?target=https%3A%2F%2Fgithub.com%2FJadeViewDocs%2FJadeView%2F&scene=im&aid=497858&lang=zh)
- Gitee Repository: [Download SDK Source Code](https://link.wtturl.cn/?target=https%3A%2F%2Fgitee.com%2Filinxuan%2FJadeView_library&scene=im&aid=497858&lang=zh)

## Full Two-Way Communication Demo (E Language Backend + Frontend HTML)

### 1. E Language Code

```
.版本 2
.程序集 程序集1

.子程序 _启动子程序, 整数型
' Step 1: Register lifecycle events in advance
JadeView.App.注册事件 (#事件_应用准备就绪, &回调就绪)
JadeView.App.注册事件 (#事件_所有窗口已关闭, &回调清理)
' Step 2: Initialize kernel
JadeView.App.初始化 (真, “app.log”, “”, “Demo Program”, “demo001”, 假)
' Step 3: Start message loop
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
窗口设置.标题 ＝ GBK文本到UTF8文本 (“Jade Quick Demo”)
窗口设置.边框样式 ＝ #标题栏_标题覆盖层
视窗设置.开启右键菜单 ＝ 真

' Step 4: Create Web window
主窗口ID ＝ JadeView.窗口.创建 (url, 0, 窗口设置, 视窗设置)

' Step 5: Subscribe IPC event for close command from frontend
.如果真 (主窗口ID ＞ 0)
    JadeView.通讯.订阅 (“send_msg”, &前端消息回调)
.如果真结束

.子程序 前端消息回调
.参数 窗口id, 整数型
.参数 数据, 文本型
.局部变量 接收文本, 文本型

接收文本 ＝ UTF8文本到GBK文本 (数据)
JadeView.通讯.广播 (窗口id, “backend_response”, “Received from backend: ” ＋ 接收文本)

.子程序 回调清理
.参数 窗口id, 整数型
.参数 数据, 文本型

JadeView.App.退出 ()
```

### 2. Frontend File `./web/index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Jade Quick Demo</title>
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
        /* Message display area */
        #msg_box {
            flex: 1;
            background: #fff;
            border-radius: 12px;
            padding: 20px;
            overflow-y: auto;
            font-size: 15px;
            line-height: 1.6;
        }
        /* Bottom input container */
        .input_wrap {
            display: flex;
            gap: 10px;
        }
        /* Text input box */
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
        /* Send button */
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
    <!-- Area to receive messages pushed by backend -->
    <div id="msg_box"></div>
    <!-- Input box + send button -->
    <div class="input_wrap">
        <input type="text" id="input_text" placeholder="Send IPC Message">
        <button id="send_btn" onclick="sendMsg()">Send</button>
    </div>

<script>
    const msgBox = document.getElementById("msg_box");
    const input = document.getElementById("input_text");

    // Listen for reply messages broadcasted by backend
    jade.on("backend_response", function(text) {
        const item = document.createElement("div");
        item.style.marginBottom = "8px";
        item.textContent = text;
        msgBox.appendChild(item);
        // Auto scroll to bottom
        msgBox.scrollTop = msgBox.scrollHeight;
    })

    // Send message to E-language backend on button click
    function sendMsg() {
        const content = input.value.trim();
        if (!content) return;
        // Invoke backend IPC channel
        jade.invoke("send_msg", content);
        // Clear input
        input.value = "";
    }

    // Send message when pressing Enter key
    input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") sendMsg();
    })
</script>
</body>
</html>
```

## Deployment & Demo Workflow

1. Place `jadeview_x86.dll` in the same directory as your compiled EXE file.
2. Create a folder named `web` in your program root directory, then put the above `index.html` inside it.
3. Import `JadeView.ec` module into your E-language project, compile and run.

### Interaction Process

1. Type text in the bottom input box and click the blue **Send** button.
2. The frontend calls `jade.invoke` to send text data to the E-language backend via IPC.
3. The backend receives the data, generates a reply, and broadcasts it to the page with `JadeView.IPC.Broadcast`.
4. All reply records will be rendered inside the white message area, with vertical scroll for multi-line history.
