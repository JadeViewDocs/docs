---
title: JadeView 3.0：窗口和网页分家
description: 3.0 不是"多了几个 API"，而是把窗口和网页拆成了两个对象。这篇聊聊这次改动的来龙去脉、性能账本，以及从 2.4.8 迁过去要动哪些地方。
tags: [JadeView, 3.0, NEXT, 架构, 性能]
---

# JadeView 3.0：窗口和网页分家

3.0 的代号是 NEXT。更新日志里写了一长串：对象模型重构、类型化事件、原生标题栏、只读虚拟文件系统……

看着挺全，但真到改代码的时候，大部分人的第一反应还是那句：**这跟我原来那套有什么关系？**

所以这篇不按更新日志的顺序讲。先把最根上的那件事说清楚，剩下的基本都是它带出来的。

---

## 一、一句话：把"窗口"和"网页"拆开了

v2 里，窗口和网页是同一个东西。

`create_webview_window()` 返回的那个 `window_id`，既是窗口的 ID，也是网页的 ID。你用这个 ID 去改窗口标题，也用它去执行脚本、发消息、导航——因为一个窗口里就只有一个网页，没必要分。

3.0 把它们拆成了两个对象：**Window**（原生窗口：尺寸、位置、装饰、标题栏）和 **WebView**（页面：导航、脚本、DevTools、缩放）。一个窗口可以挂多个页面，两种 ID 共用一套不复用的编号空间。

听起来像个内部重构，但它是这次所有其它变化的源头。

---

## 二、v2 那个"一个 ID 干两份活"的设计，到底难在哪

先看 v2 的写法：

```c
uint32_t window_id = create_webview_window("app/index.html", 0, &options, &settings);

set_window_title(window_id, "我的应用");              // 窗口操作
navigate_to_url(window_id, "https://a.com", NULL);   // 页面操作
execute_javascript(window_id, "document.title");     // 还是这个 ID
send_ipc_message(window_id, "message", "hello");     // 还是它
```

3.0 里同一段逻辑变成：

```c
uint32_t window_id  = create_webview_window(url, 0, &options, NULL, NULL);
uint32_t webview_id = get_default_webview(window_id);   // 页面是另一个对象

set_window_title(window_id, "我的应用");                 // 窗口操作 → Window ID
navigate_to_url(webview_id, "https://a.com", NULL);     // 页面操作 → WebView ID
uint64_t req = execute_webview_script(webview_id, "document.title");
```

多了一行，换来的是三件以前做不到的事：

**1. 一个窗口里可以放第二个页面。**

想在侧边栏塞个独立页面、或者做多标签预览，v2 只能再开一个窗口，然后用无边框 + 透明背景 + 手动同步位置硬拼。窗口一动就得跟着算坐标，DPI 一变还得重算一遍，稍不留神就错位。3.0 直接 `add_webview(window_id, url, settings, bounds)`，用 CSS 风格的表达式描述位置（`50%-20px` 这种都行），DPI 变化自动重排。

**2. 页面和窗口的生命周期解耦了。**

v2 里页面挂了，窗口基本也跟着废；关窗口，页面必然销毁。3.0 里销毁某个 WebView 不影响窗口本身，销毁窗口才会连带销毁它下面的所有 WebView。反过来说——空白窗口现在是合法的，你可以先建窗口，晚点再挂页面。

**3. 传错 ID 会报错，而不是"看起来能跑"。**

这个最要命。v2 里你把窗口 ID 传给了页面接口，代码不报错、行为也"好像对"，直到某天发现操作的是另一个对象。3.0 会明确返回 `JADE_WRONG_OBJECT_TYPE`，参数类型错了就是错了。

> 迁移的时候这里最容易翻车：**有几个函数名没变，但参数的语义变了。** 比如 `register_resource()` 的形参还叫 `window_id`，实际收的是 WebView ID（传 0 表示全局共享）；`navigate_to_url()` 第一个参数也变成了 WebView ID。编译器不会提醒你，只能自己对。

---

## 三、事件：从"一个数字加一个字符串"到结构化

v2 的回调长这样：

```c
typedef const char* (JADEVIEW_CALL *IpcCallback)(uint32_t, const char*);
uint32_t jade_on(const char* event_name, IpcCallback callback);
```

两个参数：一个 `uint32_t`，一个 JSON 字符串。

问题在于，回调里拿不到"这是谁发的"。事件名是注册时给的，回调里没有；来源类型（App / 窗口 / 页面）没有；序号没有；二进制数据没有——想传个图片，只能 base64 塞进 JSON，体积涨 33%，还得两头各解一次。

更别扭的是 App 级事件：`app-ready` 这类事件不属于任何窗口，但回调必须填第一个参数，于是 v2 塞了个 `1`。翻 v2 的头文件，能看到这么一句提示：

```
// ⚠️ 宿主在 `jade_on("app-ready", ...)` 里必须判断 `window_id`，
//    不要无条件继续建窗
```

判断什么呢？判断它是不是 1。这就是典型的魔法值——文档不写，谁也猜不到。

3.0 加了一层结构化事件：

```c
typedef struct JadeEvent {
  uint32_t event_type;     // 哪类事件
  uint32_t source_kind;    // App / Window / WebView
  uint64_t source_id;      // 真实来源 ID，App 恒为 0
  uint32_t window_id;      // 关联窗口
  uint32_t webview_id;     // 关联页面
  uint64_t sequence;       // 序号，能判断有没有丢
  uint64_t request_id;     // 关联的请求
  uint32_t flags;          // 含 JADE_EVENT_REPLAY（是否状态回放）
  uint32_t state;
  int32_t  error_code;
  const char *name;
  const uint8_t *data;     // 二进制安全，不用 base64
  size_t data_size;
} JadeEvent;
```

用 `on_app_event` / `on_window_event` / `on_webview_event` 订阅，回调拿到的是这个结构体的指针。`jade_on` 原样保留（签名没动），存量代码不用改。

顺手补了个坑：v2 的 `jade_off` 只保证"以后不再派发"，**正在执行的那个回调还在跑**。你要是 `jade_off` 完立刻 `free` 掉 `user_data`，那就是一发 use-after-free。3.0 加了 `jade_off_wait`，返回注销请求 ID，等它完成再释放。

---

## 四、执行脚本：从"发出去就不管"到有回执

v2 的接口是这样的：

```c
int32_t execute_javascript(uint32_t window_id, const char* script);   // 0 / 1
```

返回 0 或 1，脚本的结果走 `javascript-result` 事件回来。中间用一个内部 32 位请求号匹配，而这个号跟窗口号混在同一个空间里——出问题时你很难分清哪个数字是什么。

3.0 换成：

```c
uint64_t request_id = execute_webview_script(webview_id, "document.title");
// 之后用 get_request_result 查状态：1 受理 / 2 等待 / 3 成功 / 4 失败 / 5 取消
// free_request_result 释放字符串，release_request 释放结果记录
```

所有异步操作（创建、导航、脚本、布局、销毁重建）都统一走这套 `uint64_t` 请求 ID。配套的硬上限也写明了，都是防泄漏用的：对象 4096 个、请求结果 8192 条、UI 命令队列 4096、原生通知 32768 条 / 16 MiB 正文。到顶就明确拒绝，不无限涨。

默认 30 秒超时，终态结果保留 300 秒。超时不会回滚已经发生的副作用（比如导航已经发出去了就是发出去了）。

---

## 五、性能：快在哪，为什么快

这节最长，因为 3.0 的性能提升不是"编译优化调了调"，是换了几条传输路径。

先给数据。同一台 Windows 10 机器，两个 DLL 交替跑，每个场景三轮取中位数；基线是 **2.4.8.26J01**（就是下载页那一版），对比版本是 3.0 Alpha.2 的普通 Release 构建。

### 5.1 小消息：不再绕一圈 HTTP

v2 的 `jade.invoke` 是走本地协议服务的：页面发请求，宿主解析，大消息还要落临时文件分片。一次 64 字节的往返，P50 是 **1.73 ms**。

这个数字在桌面上很刺眼。你在页面上点个按钮、宿主回个状态，一来一回就 1.7 毫秒——单次感知不到，密集交互时就变成"闷"。

3.0 把主路径换成原生 IPC：页面 `window.ipc.postMessage` 直接进原生层，`jade.invoke` 优先走原生通道，Windows 大消息用 SharedBuffer（共享内存映射）。只有子框架、或者拿不到原生 IPC 的环境才回退到 HTTP/GET 分片。

| 64 字节往返 | 2.4.8 | 3.0 | 变化 |
| --- | ---: | ---: | ---: |
| 空闲 RTT P50 | 1.73 ms | 0.17 ms | **-90%** |
| 空闲 RTT P95 | 2.25 ms | 0.40 ms | -82% |

这就是"点一下有反应"和"感觉不到延迟"的区别。

### 5.2 大消息上行，以前是真的慢

v2 最难看的是**页面 → 宿主**这个方向：

| `jade.invoke` 上行 | 2.4.8 | 3.0 | 变化 |
| --- | ---: | ---: | ---: |
| 1 MiB 吞吐 | 19.4 MiB/s | 171.7 MiB/s | +786% |
| 8 MiB 吞吐 | 19.6 MiB/s | 159.4 MiB/s | +712% |
| 8 MiB RTT P50 | 1588 ms | 126 ms | -92% |

同样 8 MiB 数据，v2 要 1.6 秒，3.0 是 0.13 秒。原因不神秘：v2 上行得分片、拼装、写临时文件；3.0 直接把共享内存映射交给页面，长度在 SDK 里一次校验完。少了两趟内存拷贝和一次磁盘往返。

### 5.3 资源交付：要哪段给哪段

v2 的协议服务给文件是**整段响应**。你在页面里 `<video>` 一个 500 MB 的 MP4，它就开始往外倒 500 MB。报告里有个很说明问题的数字：对 128 MiB 文件做 Range 读取，v2 实际发出的请求数是 **1.00**——所谓的 Range 被吞了，变成一次整段传输。

3.0 把 HTTP 语义补全了：HEAD、条件请求、304、Range、跨域预检。分片策略也改成动态的——2 MiB 以内不分片，超过才按体积和读取状态切片。

效果：

| 场景 | 2.4.8 | 3.0 | 变化 |
| --- | ---: | ---: | ---: |
| 128 MiB Range 重组，宿主内存峰值 | 1302 MiB | 100 MiB | **-92%** |
| 单视频 loadeddata | 1500 ms | 175 ms | -88% |
| 单视频元数据就绪 | 1438 ms | 82 ms | -94% |
| 三视频并发 loadeddata | 3113 ms | 238 ms | -92% |
| 三视频并发，进程树内存峰值 | 3317 MiB | 1888 MiB | -43% |

为什么视频差这么多？那段测试用的 1440p MP4，`moov` 在文件**末尾**。

播放器要开始播，得先拿到索引；索引在文件尾，就得先跳到末尾读一下。v2 没有可用的 Range，只能从前往后把整个文件读一遍才够到索引——1500 毫秒里绝大部分时间花在这上面，不是解码慢。3.0 直接跳读末尾那一段，175 毫秒。

**很多"视频加载慢"，本质是"为了拿索引把整个文件读了一遍"。** 这句话值得记一下，换别的框架也一样适用。

### 5.4 也说点不好听的

不是所有指标都涨了：

| 场景 | 2.4.8 | 3.0 | 变化 |
| --- | ---: | ---: | ---: |
| 静态文件 4 并发吞吐 | 216 MiB/s | 183 MiB/s | -15% |
| JPEG 接收 | 44.3 ms | 53.1 ms | +20% |

我们没打算把这两条抹掉。这是"动态分片 + 小请求优先"换来的代价：为了不让大文件把控制消息挤死，短请求被提到了前面，代价是纯吞吐场景让出一点带宽。目前还在定位。

如果只挑涨的写，那叫宣传稿，不叫技术博客。

> 数据口径补充：那批性能数据测的时候，页面还是 HTTP 映射；之后按计划切了 HTTPS，功能回归是单独跑的。所以别把这组数字当成"HTTPS 版实测成绩"。三轮也不足以宣称统计显著，看趋势就好。

---

## 六、标题栏和拖拽：不再往你页面里塞脚本

v2 的窗口装饰只有一个字符串 `frame_style`，三档：`normal` / `no-titlebar` / `borderless`。

想要个好看的标题栏？自己用 HTML 画一条，再挂 `-webkit-app-region: drag` 让它能拖。这条路能走通，但有两笔账要付。

**第一笔：拖完不知道什么时候松手。** 拖动一开始，系统移动循环就接管了鼠标，页面的 `mouseup` 被吞掉。所以 v2.4.7 专门补了个 `region-drag` 事件，就为了告诉你"松开了"。

**第二笔：会和布局动画打架。** 同一个窗口拉边框，用 `-webkit-app-region: drag` 时单次尺寸更新最长 **453 ms**（先停滞，然后突然追上鼠标），换成属性式拖拽后是 **9.6 ms**。

3.0 把这件事收回原生层：

- 配置拆成两个字段：`noframe`（要不要无边框）和 `title_bar_style`（`default` / `hidden` / `BarOverlay`）。一个字符串同时表达两件事的问题，到此为止。
- `set_titlebar_style()` 统一设高度和配色（背景、前景、按钮常态、按钮悬浮），传空值恢复系统默认，跟随主题。
- `set_titlebar_components()` 控制返回、刷新、图标、最小化、最大化。返回按钮有浏览历史才出现，刷新按钮在加载时转圈——这些都是原生画的，**不占页面高度**，页面缩放、WebView 尺寸计算都不受影响。
- 拖拽区还是写属性 `<div jade-region-drag>`，但判定挪到了原生层（raw input），不再往你的页面里注入 `mousedown` 监听。页面照样收得到悬浮、右键、`mousemove`；按下不移动就松开，`click` 正常触发；双击最大化；拖到屏幕边缘能贴边。

边界也说清楚：Windows 走原生输入层，Linux 还是前端监听那套；iframe 和 Shadow DOM 里的拖动区目前不在覆盖范围内。

### Windows 启动画面

窗口打开时可以先显示应用 LOGO 和加载动画，WebView 在后台加载页面。页面就绪且达到设定的最短显示时间后，启动画面淡出。标题栏在启动期间仍可操作。

每个窗口可以单独设置 LOGO、背景色、加载动画颜色和最短显示时间。建窗时把 `JadeSplashOptions` 传给 `JadeWindowFeatures.splash`，LOGO 可传 PNG 或 ICO 的路径，也可直接传图片字节。

![Windows 启动画面示例](/screenshot/splash-preview.png)

[启动画面 API 与示例](/docs/v3api/splash-api)

---

## 七、菜单：从"先建对象再挂上去"到"给个数组"

v2 建一个右键菜单项，得一层一层建对象：先建父项拿 `menu_id`，再拿这个 id 当 `parent_menu_id` 建子项，最后把顶级项的 id 数组挂到窗口上。

```c
// label, kind(0=命令 1=分隔线 2=复选 3=单选 4=子菜单), parent_menu_id, item_id
uint32_t copy = jade_menu_item_create("复制", 0, 0, 1001);
uint32_t paste = jade_menu_item_create("粘贴", 0, 0, 1002);
jade_set_context_menu_items(window_id, (uint32_t[]){copy, paste}, 2);
// 点击通过 menu-item-clicked 事件回来，凭 item_id 认人
```

托盘更直接：`tray_set_menu_items(tray_id, items, count)` 传个静态数组，完事。

3.0 换成声明式的：一个 `JadeMenuItemDesc` 数组描述整棵树，`kind` 区分命令 / 子菜单 / 分隔线 / 复选 / 单选，子项靠 `parent_id` 挂在父项下面，最多三级。然后三个入口按场景用：

```c
jade_set_application_menu(items, count);            // 应用级菜单栏
jade_window_set_menu(window_id, items, count);      // 单个窗口的菜单栏
jade_menu_popup(window_id, items, count, &pos);     // 右键菜单 / 托盘菜单
```

好处是不用再维护一张"我建了哪些 id、它们什么关系"的表——菜单长什么样，数组里就写着，改一次传一次，不用销毁重建对象。

点击统一从 `menu-command` 事件出来，一个口子收完。托盘也是同一套：在 `tray-event` 回调里调 `jade_menu_popup`，不再有专门的托盘菜单结构。

代价是那批老接口全删了——`jade_menu_item_create`、`jade_menu_item_set_enabled`、`jade_menu_item_set_checked`、`jade_menu_item_destroy`、`jade_set_context_menu_items`、`tray_set_menu_items`，以及 `context-menu`、`menu-item-clicked`、`tray-menu-command` 三个事件。

---

## 八、JAPK：不解压，也能读包里的文件

v2 加载 JAPK 只有一条路：

```c
JadeView_load_from_bytes(japk_data, data_size);   // 整包读进内存
```

包能用，但你想在宿主里读包里某个文件？自己解包。

3.0 加了个只读虚拟文件系统：

```c
uint64_t archive_id = register_japk("app.japk");        // 验签、解密、建索引；0 = 失败
uint64_t mount_id   = mount_japk(archive_id, NULL);     // NULL → 挂到同级的 app/ 目录

FILE *f = fopen("app/index.html", "rb");                // 就当普通目录用

unmount_japk(mount_id);
unregister_japk(archive_id);
```

包本身不解压、不落盘，`app/` 是个虚拟目录：Windows 走 WinFsp，Linux 走 FUSE3。文件名区分大小写、支持 Unicode，索引会校验条目范围和路径穿越。

**这里必须说清楚代价：** WinFsp 是第三方驱动，Windows 不自带，装的时候要管理员权限（`winget install WinFsp.WinFsp`）。

所以它是**可选路径**，不是加载 JAPK 的必经步骤：

- 网页里加载 HTML / CSS / JS / 图片，走的是协议服务，框架直接解析包内资源——**不需要挂载，也不依赖 WinFsp**。普通应用在客户机上什么都不用装。
- 只有你要在宿主进程里 `fopen("app/...")`，才需要挂载能力。

挂之前用 `get_japk_mount_capabilities()` 问一句，`available == 0` 就降级走协议加载，或者提示用户装依赖。别硬上。

---

## 九、升级要改哪里（不兼容清单）

大版本，该删的都删了。把替换关系列清楚，比逐条读更新日志快：

| v2 的写法 | 3.0 的写法 |
| --- | --- |
| `create_borderless_webview_window(...)` | 初始化窗口选项，设置 `noframe = 1`，再调 `create_webview_window(...)` |
| `execute_javascript(window_id, script)` | `execute_webview_script(webview_id, script)` + 请求 ID |
| `frame_style = "no-titlebar"` | `noframe` + `title_bar_style` 两个字段 |
| `set_window_frame_style(...)` | `set_window_frame(window_id, noframe, title_bar_style)` |
| `set_titlebar_overlay_style(...)` | `set_titlebar_style(...)` |
| `jade_menu_item_*` / `jade_set_context_menu_items` | `JadeMenuItemDesc` 数组 + `jade_menu_popup` |
| `tray_set_menu_items` + `tray-menu-command` | `tray-event` 里 `jade_menu_popup` + `menu-command` |
| `utf8_to_gbk` / `gbk_to_utf8` | `smart_convert_encoding`（要显式传输入字节长度） |
| `/---event--/*` 事件桥 | 页面 `window.ipc.postMessage` + 宿主 `jade_on` / 类型化事件 |
| POST invoke（JSON body） | `jade.invoke`，优先走原生 IPC |
| 页面 `-webkit-app-region: drag` | `jade-region-drag` 属性（推荐） |

### ABI 和窗口配置

**当前 ABI 标识为 `0x00030002`**，用于校验宿主绑定和运行库的二进制接口是否匹配。C/C++ 宿主用运行库配套的 `JadeView.h` 重新编译。使用动态绑定时，先同步函数签名和结构体布局，再用 `jade_get_abi_info` 核对 ABI 与进程位数。

`WebViewWindowOptions` 以 `struct_size` 和 `abi_version` 开头。先调用 `window_options_default` 填好默认值，再修改所需字段。

```c
WebViewWindowOptions options;
if (window_options_default(&options, sizeof options) != JADE_OK) return;
options.noframe = 1;
options.title_bar_style = "BarOverlay";
```

`create_webview_window` 和 `create_window` 的最后一个参数是可选的 `features`。内容保护和位置保存从窗口选项移到 `JadeWindowFeatures`，启动画面也在这里设置。传 `NULL` 时，这三项功能默认关闭。

[ABI 契约](/docs/v3api/abi) · [窗口扩展配置](/docs/v3api/window-api#窗口功能jadewindowfeatures)

最后一件容易忽略的：**Windows 本地页面从 HTTP 换成了 HTTPS。**

宿主入口还是 `jade://`，但页面实际来源是 `https://jade.<域段>`。这不是起了个本地 HTTPS 服务器——没有监听端口，也不用装证书，只是引擎层的来源标识。代价是站点存储按来源隔离，老的 HTTP 数据不会自动迁移，所以页面里**别写死 http 来源**，用相对路径。

---

## 十、现在能上吗

**版本状态**：3.0 目前是测试版。文档在 [/docs/v3api](/docs/v3api)，示例在仓库 `examples/next`（C 和 Python 都有）。2.4.8 是 v2 的最后一个版本，还在维护。

**没做完的**，这里不藏：

- macOS 后端没实现，也没验证。
- Linux 的部分能力还在补（原生媒体播放、HTTP 页面适配）。
- WinFsp / WebView2 的实机组合矩阵没跑完，跨 DPI、装饰、焦点这些组合还需要人工验收。

**建议**：

- 新项目直接上 3.0，照着新文档写。API 分组比 v2 清楚——窗口归窗口，页面归页面，不会再出现"这个函数到底该传哪个 ID"的疑问。
- 存量项目等正式版。但可以先按第九节把迁移点摸一遍，尤其是**结构体前缀**和**ID 语义**：前者不改编译直接过不去，后者能编译、但运行时会被明确拒绝——比"看起来能跑、实际操作了错对象"好排查得多。

---

## 最后，为什么叫 NEXT

`2.4.8` 之后本来可以是 `2.5`。但这次改动动的是对象模型——v2 是"一个窗口一个页面"，3.0 是"窗口和页面各自是东西"。这种改动没有兼容写法，只能开大版本。

叫 NEXT，是因为它不是 2.x 的下一步小版本，而是下一段。

[→ 打开 3.0 文档](/docs/v3api)
