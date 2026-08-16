---
title: JAPK 签名包教程
order: 4
badge: v2.4
group:
  title: "教程"
  order: 1
---

# JAPK 签名包教程

本教程介绍如何把 Web 构建产物制作成带 JadeTweak 平台证书链的 JAPK 签名包，并在宿主 EXE 中通过 JadeView 验证、解密和运行。

JAPK 签名包不是可以双击运行的程序。它是一个由 JadeView 宿主加载的加密 Web 资源容器，通常与宿主 EXE 和 JadeView DLL 一起发布。

:::warning{title="版本要求"}
本教程适用于：

- **JadeView 2.4.0-beta.3 或更高版本**
- **JadePack 2.3.0 或更高版本**
- **JadeTweak v3 应用证书**

文件容器仍使用 `JAPKV002`，但签名协议已经升级为 v3。旧的自签名包、运行时注入公钥和未签名 JAPK 不再受支持。
:::

## 最终发布结构

完成本教程后，应用目录可以保持为三个主要文件：

```text
ExampleApp/
├── ExampleApp.exe
├── JadeView_x64.dll
└── app.japk
```

其中：

- `ExampleApp.exe` 是调用 JadeView C API 的宿主程序。
- `JadeView_x64.dll` 负责验证平台证书链、包签名和内容完整性，并创建 WebView。
- `app.japk` 是 JadePack 生成的签名加密资源包。

也可以把 `app.japk` 嵌入 EXE 资源，再通过内存加载 API 传给 JadeView。

## JAPK 信任链

JadeView 不再信任由宿主程序任意提供的公钥。当前验证链固定为：

```text
JadeView 内置 JadeTweak 平台根公钥
        ↓ 验证
JadeTweak 签发的 v3 证书证明
        ↓ 绑定
App ID + 应用名称 + 主程序文件名 + 叶子公钥
        ↓ 验证
JadePack 生成的 JAPK v3 包签名
        ↓ 解密并校验
ASAR Web 资源及其 SHA-256 哈希
```

这套流程会拒绝：

- 使用任意私钥制作的自签名包；
- 修改过签名信息、密文或 Web 资源的包；
- App ID 或应用名称与宿主初始化参数不一致的包；
- 由错误的主程序 EXE 加载的包；
- 旧签名协议、未签名包以及结构存在歧义的 JAPK。

:::info{title="离线验证"}
JadeView 的运行时验证是离线密码学验证。证书到期或吊销后不能继续签新包，但已经正确签名的历史包仍可离线验证。
:::

## 准备工作

开始前需要准备：

1. 一个已经完成生产构建的 Web 项目；
2. 最终宿主 EXE 的文件名；
3. 一个 JadeTweak v3 应用证书；
4. [JadePack](https://store.jade.run/downloads/jadepack/latest)；
5. [JadeView 2.4.0-beta.3](https://github.com/tuyangJs/JadeView/releases/tag/v2.4.0-beta.3) 或更高版本中的 DLL、LIB 和 `JadeView.h`。

Web 构建目录必须包含入口页面：

```text
web-dist/
├── index.html
├── assets/
│   ├── index.js
│   └── index.css
└── images/
    └── logo.png
```

对于 Vite 项目，建议使用相对资源基址：

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
});
```

## 第 1 步：确定应用身份

申请证书前必须先确定三个身份字段。

| 字段 | 示例 | 运行时用途 |
|---|---|---|
| App ID | `com.example.product` | 传给 `JadeView_init` 的 `app_signature`，同时用作 `JADE://` 域名 |
| 应用名称 | `Example Product` | 传给 `JadeView_init` 的 `app_name` |
| 主程序文件名 | `ExampleApp.exe` | 与当前运行进程的文件名比较 |

:::warning{title="应用名称和 EXE 名彼此独立"}
`app_name` 不需要与 `main_exe` 相同。例如应用名称可以是 `Example Product`，主程序可以是 `ExampleApp.exe`。但它们必须分别与证书中的对应字段一致。
:::

还需要注意：

- `app_signature` 在 JadeView API 中表示 **App ID**，不是 Base64 包签名。
- App ID 和应用名称按原值精确比较。
- Windows 下主程序文件名比较不区分大小写，但必须是单个文件名，不能填写路径。
- 调试阶段也会检查当前进程名。证书绑定 `ExampleApp.exe` 时，使用 `ExampleApp_debug.exe` 加载会失败。
- 应用已经签发证书后，身份字段会锁定。发布前应确认命名无误。

## 第 2 步：申请 v3 证书

1. 登录 [JadeTweak 应用证书](https://store.jade.run/certificates)。
2. 进入“申请证书”。
3. 填写 App ID、应用名称和主程序文件名。
4. 提交申请并等待证书变为可签名状态。

证书用于远程签名。JadeView 最终收到的是包含应用身份、叶子公钥和平台根签名的证书证明，不需要在宿主程序中保存证书私钥。

## 第 3 步：构建 Web 资源

先执行前端项目自己的生产构建命令。例如：

```bash
npm run build
```

或：

```bash
bun run build
```

在继续之前检查：

- 输出目录根部存在 `index.html`；
- HTML 引用的 JS、CSS 和图片都位于输出目录内；
- 页面不依赖开发服务器；
- 直接部署到自定义协议时，资源路径能够从 `JADE://{app-id}` 正确解析；
- 不要把源码目录误当成构建产物目录。

## 第 4 步：使用 JadePack 打包并签名

启动 JadePack 并登录 JadeTweak 账号，然后进入 **构建中心 > 资源打包**。

依次填写：

1. **源目录（Web 构建产物）**：选择上一步的 `web-dist` 或 `dist` 目录；
2. **输出路径（.japk）**：例如 `D:\release\ExampleApp\app.japk`；
3. **远程签名证书**：选择与当前应用身份对应的 v3 证书；
4. 根据需要配置排除规则和可复现构建选项；
5. 点击 **打包并签名**。

:::warning{title="不要点击“混淆打包”发布生产包"}
JadeView 2.4.0-beta.3 的严格加载路径只接受带 JadeTweak 平台证明的签名包。用于生产运行的包必须选择“打包并签名”。
:::

签名完成后，JadePack 会生成一个 `.japk` 文件。这个文件已经包含：

- 严格的 JAPK v2 容器头；
- v3 签名清单；
- JadeTweak 平台根签发的证书证明；
- Ed25519 包签名；
- AES-256-GCM 加密的 ASAR 内容；
- 解密后内容的 SHA-256 哈希。

不要修改生成后的文件。即使只修改一个字节，JadeView 也会拒绝加载。

## 第 5 步：在宿主程序中加载

推荐先调用 `JadeView_load_from_bytes`，获得明确的错误码，再用空路径挂载已经验证和解密的内存资源。

完整的 C 示例：

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include "JadeView.h"

static uint8_t* read_all_bytes(const char* path, size_t* size_out) {
    FILE* file = fopen(path, "rb");
    uint8_t* data = NULL;
    long length = 0;

    if (!file) {
        return NULL;
    }
    if (fseek(file, 0, SEEK_END) != 0 || (length = ftell(file)) <= 0) {
        fclose(file);
        return NULL;
    }
    rewind(file);

    data = (uint8_t*)malloc((size_t)length);
    if (!data || fread(data, 1, (size_t)length, file) != (size_t)length) {
        free(data);
        fclose(file);
        return NULL;
    }

    fclose(file);
    *size_out = (size_t)length;
    return data;
}

static const char* JADEVIEW_CALL on_japk_load_failed(
    uint32_t window_id,
    const char* event_data
) {
    (void)window_id;
    fprintf(stderr, "JAPK load failed: %s\n", event_data ? event_data : "unknown");
    return NULL;
}

static const char* JADEVIEW_CALL on_all_windows_closed(
    uint32_t window_id,
    const char* event_data
) {
    (void)window_id;
    (void)event_data;
    jadeview_exit();
    return NULL;
}

static const char* JADEVIEW_CALL on_app_ready(
    uint32_t window_id,
    const char* event_data
) {
    size_t japk_size = 0;
    uint8_t* japk_data = NULL;
    char protocol_url[512] = {0};
    int32_t result = 0;

    if (window_id != 1) {
        fprintf(stderr, "JadeView init failed: %s\n", event_data ? event_data : "unknown");
        return NULL;
    }

    japk_data = read_all_bytes("app.japk", &japk_size);
    if (!japk_data) {
        fprintf(stderr, "Cannot read app.japk\n");
        return NULL;
    }

    result = JadeView_load_from_bytes(japk_data, japk_size);
    free(japk_data); /* JadeView_load_from_bytes 会复制输入数据 */

    if (result != 0) {
        fprintf(stderr, "JadeView_load_from_bytes failed: %d\n", result);
        return NULL;
    }

    /* 空路径表示挂载刚刚验证并解密的内存 ASAR。 */
    result = set_protocol_service_path(
        "",
        protocol_url,
        sizeof(protocol_url),
        0
    );
    if (result != 1) {
        fprintf(stderr, "Cannot mount JAPK resources\n");
        return NULL;
    }

    WebViewWindowOptions options = {0};
    options.title = "Example Product";
    options.width = 1024;
    options.height = 720;
    options.resizable = 1;
    options.frame_style = "normal";
    options.background_color = "#FFFFFFFF";
    options.theme = "System";
    options.maximizable = 1;
    options.minimizable = 1;
    options.x = -1;
    options.y = -1;
    options.focus = 1;
    options.auto_save_state = 1;

    if (create_webview_window(protocol_url, 0, &options, NULL) == 0) {
        fprintf(stderr, "Cannot create WebView window\n");
    }

    return NULL;
}

int main(void) {
    /* 事件必须在 JadeView_init 之前注册。 */
    jade_on("app-ready", on_app_ready);
    jade_on("japk-load-failed", on_japk_load_failed);
    jade_on("window-all-closed", on_all_windows_closed);

    if (JadeView_init(
            0,                      /* enable_devmod */
            NULL,                   /* log_path */
            "./data",              /* data_directory */
            "Example Product",     /* 必须等于证书 app_name */
            "com.example.product", /* 必须等于证书 App ID */
            1                       /* single_instance */
        ) != 1) {
        return 1;
    }

    return run_message_loop();
}
```

将这个宿主编译为证书中登记的 `ExampleApp.exe`。运行时，JadeView 会自动读取当前进程文件名并完成第三项身份校验。

:::info{title="如何找到 app.japk"}
示例使用当前工作目录中的 `app.japk`，便于展示核心流程。生产程序应根据 EXE 所在目录构造绝对路径，不能假定用户从应用目录启动程序。
:::

## 从文件路径直接加载

如果 JAPK 是独立文件，也可以跳过 `JadeView_load_from_bytes`，直接把文件路径交给协议服务：

```c
char protocol_url[512] = {0};

int32_t mounted = set_protocol_service_path(
    "D:\\release\\ExampleApp\\app.japk",
    protocol_url,
    sizeof(protocol_url),
    0
);
```

文件路径模式同样执行平台根链、身份、签名、解密和内容哈希验证，但 API 只返回 `1` 或 `0`。需要精确错误码时优先使用内存加载流程。

两种方式二选一：

- 调用 `JadeView_load_from_bytes` 后，`set_protocol_service_path` 必须传空字符串；
- 直接传 `.japk` 文件路径时，不要先调用 `JadeView_load_from_bytes`，否则会重复验证和解密。

## 不再设置运行时公钥

旧版示例可能包含：

```c
JadeView_set_public_key(public_key);
```

当前版本不要再调用它。JadeView 已经内置唯一受信任的 JadeTweak 平台根公钥：

- 传入完全相同的平台根只会执行兼容性 no-op；
- 传入任意其他公钥会返回 `-11`（策略拒绝）；
- 自签名包不会因为宿主提供了公钥而获得信任。

应用发布物中不需要附带 JAPK 公钥文件。

## 获取签名信息

包加载成功后，可以读取已经验证的签名元数据：

```c
char* signature_info = JadeView_get_signature_info();
if (signature_info) {
    printf("%s\n", signature_info);
    jade_text_free(signature_info);
}
```

返回的 JSON 包含 App ID、应用名称、主程序文件名、证书 ID、证书版本、签名时间和请求 ID等信息。它适合写入诊断日志，不应被当作替代验签的依据；真正的验证已经由 `JadeView_load_from_bytes` 完成。

## 错误码与排查

| 返回值 | 含义 | 优先检查 |
|---:|---|---|
| `0` | 加载成功 | 可以继续挂载资源 |
| `-1` | 参数无效 | 数据指针是否为空、文件大小是否为 0 |
| `-2` | 尚未初始化 | 是否先成功调用了 `JadeView_init` |
| `-4` | JAPK 格式无效 | 是否使用 JadePack 2.3.0+ 的“打包并签名” |
| `-5` | 包签名无效 | 文件是否被修改、签名数据是否完整 |
| `-6` | 应用身份不匹配 | App ID 和应用名称是否分别匹配 |
| `-7` | 解密失败 | 包密文、签名或派生数据是否损坏 |
| `-11` | 安全策略拒绝 | 是否仍在注入自定义运行时公钥 |
| `-13` | 主程序不匹配 | 当前 EXE 文件名是否等于证书 `main_exe` |
| `-14` | 内容完整性失败 | 解密后的 ASAR 是否遭到修改 |
| `-15` | 平台证书无效 | 是否为有效的 JadeTweak v3 证书证明 |

同时订阅 `japk-load-failed`，可以获得包含具体原因的文本事件。生产环境还应设置 `log_path`，保留 JadeView 诊断日志。

### 窗口打开后白屏

验签成功但页面白屏通常属于 Web 资源问题，而不是证书问题。检查：

- `index.html` 是否位于构建目录根部；
- JS 和 CSS 路径是否正确；
- 前端是否仍指向本机开发服务器；
- 构建工具的资源基址是否适用于 `JADE://`；
- 是否把错误的父目录交给了 JadePack。

### 开发版本可以加载，发行版本失败

优先比较实际进程文件名。常见情况是调试产物叫 `ExampleApp.exe`，发行脚本又把它重命名成其他名称，导致与证书 `main_exe` 不一致。

如果需要更换主程序文件名，应重新申请对应身份的证书并重新签包，不能修改 JAPK 内的签名清单。

## 发布检查清单

发布前逐项确认：

- [ ] 使用 JadePack 的“打包并签名”，不是混淆打包；
- [ ] JadeView 版本不低于 `2.4.0-beta.3`；
- [ ] JadePack 版本不低于 `2.3.0`；
- [ ] `JadeView_init` 的 App ID 和应用名称与证书一致；
- [ ] 最终 EXE 文件名与证书 `main_exe` 一致；
- [ ] `app.japk` 未在签名完成后被处理或改写；
- [ ] 宿主不再调用 `JadeView_set_public_key`；
- [ ] x86、x64 或 ARM64 的 JadeView DLL 与宿主架构一致；
- [ ] 在干净机器上测试安装目录中的最终 EXE 和 JAPK；
- [ ] 对宿主 EXE、DLL 和安装包实施适合自己的发布完整性保护。

:::warning{title="宿主完整性边界"}
JAPK 平台签名保护的是 Web 资源包及其应用身份。攻击者如果能够替换宿主 EXE 或 JadeView DLL，已经超出 JAPK 包自身的信任边界。正式发行时仍应通过可信安装渠道分发，并根据产品需求为 EXE、DLL 或安装包配置 Windows 代码签名。
:::
