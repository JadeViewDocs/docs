---
title: JAPK
order: 1
group:
  title: 资源与本地服务
  order: 6
---

# JAPK 资源包格式

JAPK 是 JadeView 专属的应用打包格式，它可以把您的 HTML、CSS、JavaScript、图片等所有前端资源打包成一个单独的 .japk 文件，就像一个压缩包一样。使用 JAPK 的好处：

- **分发简单**：只需发送一个文件，不用传一堆零散文件
- **加载快速**：JadeView 可以直接从包内读取资源，无需解压到临时目录
- **保护源码**：配合 JadePack 可以对内容进行混淆和签名保护

---
### Electron ASAR 与 JadePack 对比

| 特性 | Electron ASAR | JadePack 混淆包 | JadePack 签名包 |
|------|:---:|:---:|:---:|
| 打包工具 | `@electron/asar` CLI | JadePack 桌面客户端 | JadePack 桌面客户端 |
| 文件格式 | ASAR（明文） | JAPK v2 混淆 | JAPK v2 签名 |
| 内容保护 | ❌ 无 | 3 层可逆变换 | AES-256-GCM 加密 |
| 签名验证 | ❌ 不支持 | ❌ 不支持 | ✅ Ed25519 |
| 防篡改 | ❌ 无 | ❌ 弱 | ✅ 强 |
| 源码可读 | ✅ 可直接查看 | ❌ 需解混淆 | ❌ 需解密+验签 |
| 加载方式 | 文件路径 / 内存 | 文件路径 / [内存载入](/docs/api/japk-load-memory) | 文件路径 / [内存载入](/docs/api/japk-load-memory) |
| 适用场景 | 开发调试、内部工具 | 基础保护的分发 | 生产环境、商业分发 |
| 费用 | 免费 | 按月付费 | 按月付费 |

> JadePack 下载与详情见 [JadePack](/docs/api/jadepack)。

---

## JadePack 构建工具

JadePack 是 JadeView 官方发行的图形化构建工具，专门用于 JAPK 资源包的构建和保护：

- **一键构建**：图形界面操作，轻松将前端项目打包为 JAPK
- **内容混淆**：即使不签名，也会使用 3 层可逆变换（XOR + 字节置换 + 位旋转）保护文件内容，不是明文包
- **签名保护**：支持对 JAPK 进行签名，验证来源和完整性，防止篡改
- **解包支持**：支持将部分文件设置为「解包」存储，方便原生模块加载

:::success
生产环境推荐使用 JadePack 构建签名 JAPK 包，提供完整的安全保护。
:::

---

**JadeView 完全兼容 Electron ASAR 格式**，这意味着：
- 使用 Electron ASAR 创建的包可以直接被 JadeView 加载和运行
- 无需额外的转换或处理步骤
- 与 Electron 生态完全互通

:::info
**注意：**
- **Electron ASAR 创建的是明文包**：文件内容未经过任何加密或混淆处理
- **JadePack 创建的非签名包也是混淆包**：即使不签名，JadePack 也会使用 3 层可逆变换（XOR + 字节置换 + 位旋转）保护文件内容，不是明文包

如需构建签名加密的 JAPK 包，请使用 JadePack 的图形界面构建中心。
:::

## 加载 JAPK 包

使用 `set_protocol_service_path` API 加载 JAPK 包，详见 [核心 API - 本地协议服务](/docs/api#本地协议服务)。

## 使用示例

```c
#include "JadeView.h"

// 使用 JAPK 文件
void load_japk_example() {
  char url_buffer[256];
  const char* japk_path = "C:\\path\\to\\your\\app.japk";
  
  int32_t result = set_protocol_service_path(
    japk_path,
    url_buffer,
    sizeof(url_buffer),
    0  // hot_reload: 0=禁用热载
  );
  
  if (result == 1) {
    printf("协议 URL: %s\n", url_buffer);
    // 使用 url_buffer 导航
  }
}
```

---

## 命令行打包教程（Electron ASAR）

如果你还没有 Node.js 开发经验，没关系——本节从零开始，一步一步教你用命令行把网页文件打包成 JAPK 文件。

### 什么是 ASAR？

ASAR（Atom Shell Archive）是一种文件打包格式，它能把一个文件夹里的所有文件（HTML、CSS、JS、图片等）合并成一个单独的文件。这个文件就像 `.zip` 压缩包，区别在于 JadeView 可以直接从里面读取网页，不需要解压。

`@electron/asar` 是一个命令行工具，用来创建和解包 ASAR 文件。它是免费的。

### 第 0 步：安装 Node.js

Node.js 提供了一个叫 `npm` 的命令行工具，我们会用它来安装 `@electron/asar`。

1. 打开浏览器，访问 https://nodejs.org
2. 下载 **LTS（长期支持版）**，推荐 Windows 用户选 `.msi` 安装包
3. 双击安装，一路点"下一步"即可（保持默认选项）
4. 安装完成后，按 `Win + R` 输入 `cmd` 回车，打开命令提示符
5. 输入以下命令验证安装成功：

```bash
node --version
```

如果看到类似 `v20.x.x` 的版本号，说明安装成功。

### 第 1 步：安装打包工具

在命令提示符中输入以下命令（只需执行一次，全局安装后永久可用）：

```bash
npm install -g @electron/asar
```

- `npm install`：让 npm 安装一个工具
- `-g`：全局安装，安装后在任意目录都能用
- `@electron/asar`：要安装的工具名称

验证是否安装成功：

```bash
asar --version
```

看到版本号即表示 OK。

### 第 2 步：准备你的网页项目

把你的网页文件放进一个文件夹。假设你的项目叫 `my-app`，例如如下：

```
my-app/
├── index.html          ← 入口页面（必须有）
├── src/
│   ├── renderer.js     ← JS 脚本
│   └── styles.css      ← 样式文件
└── assets/
    └── icon.png        ← 图片资源
```

:::success
**`index.html` 是必需的**，JadeView 加载 JAPK 时会默认打开它，就像浏览器打开网站时找首页一样。
:::

### 第 3 步：打包

在命令提示符中，先进入 `my-app` 所在的目录，然后执行：

```bash
asar pack my-app app.japk
```

这句命令的含义：
- `asar pack`：告诉工具"我要打包"
- `my-app`：要打包的文件夹名
- `app.japk`：打包后生成的文件名（可以叫任意名字，后缀 `.japk` 是约定）

执行后会在当前目录生成 `app.japk` 文件，这就是你需要的 JAPK 包。

### 验证打包结果

想看包里有哪些文件，用以下命令列出包内容：

```bash
asar list app.japk
```

会输出类似：

```
/index.html
/src/renderer.js
/src/styles.css
/assets/icon.png
```

### 进阶用法

#### 排除某些文件（如 `.node` 原生模块）

某些文件（如 `.node` 原生模块）不能打包，需要留在包外面单独加载：

```bash
asar pack my-app app.japk --unpack "*.node"
```

- `--unpack "*.node"`：所有后缀为 `.node` 的文件不打包，单独放在 `app.japk.unpacked` 文件夹里

#### 生成到指定目录

```bash
asar pack my-app ./dist/app.japk
```

- 把 `app.japk` 生成到当前目录下的 `dist` 文件夹里

#### 解包（提取包内文件）

如果想还原 JAPK 里的文件：

```bash
asar extract app.japk ./extracted
```

- 把 `app.japk` 的内容解压到 `extracted` 文件夹

### 重要说明

**Electron ASAR 创建的是明文包，JadePack 创建的非签名包也是混淆包。**

**Electron ASAR 构建的 JAPK：**
- 文件内容完全明文，未经过任何加密或混淆
- 任何人都可以直接查看包内容
- 无法验证文件来源和完整性
- 不适合生产环境或需要安全保护的场景

**JadePack 构建的非签名 JAPK：**
- 使用 3 层可逆变换（XOR + 字节置换 + 位旋转）保护文件内容（非明文）
- 提供基础的内容保护
- 但不包含签名信息，无法验证来源
- 适合需要基础保护但不需要签名的场景

**推荐做法：** 使用 JadePack 的图形界面构建中心创建签名 JAPK 包，可以提供完整的安全保护、身份验证和完整性校验。


### 相关资源

- [https://github.com/electron/asar](https://github.com/electron/asar)
- [https://www.electronjs.org/docs/latest/tutorial/asar-archives](https://www.electronjs.org/docs/latest/tutorial/asar-archives)
