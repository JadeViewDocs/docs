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
| 加载方式 | 文件路径 / 内存 | 文件路径 / [内存载入](/docs/v3api/resources/japk-load-memory) | 文件路径 / [内存载入](/docs/v3api/resources/japk-load-memory) |
| 适用场景 | 开发调试、内部工具 | 基础保护的分发 | 生产环境、商业分发 |
| 费用 | 免费 | 按月付费 | 按月付费 |

> JadePack 下载与详情见 [JadePack](/docs/v3api/resources/jadepack)。

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

使用 `set_protocol_service_path` 让 WebView 通过本地协议加载 JAPK 包，详见 [本地协议服务](/docs/v3api/resources/local-server-api)。若宿主进程要直接读取包内文件，见本页「读取包内文件」。

## JAPK 挂载

签名与结构体取自 `include/JadeView.h` 的 `host_fs` 导出段。

### 挂载模型

真实包 `app.japk`，默认把它挂载为**同级只读虚拟目录 `app/`**。宿主直接用系统文件 API 读取：

```c
FILE *f = fopen("app/index.html", "rb");
```

不拦截 `app.japk/index.html`，不整体解压包内容到磁盘。注册包、WebView 协议与挂载持有**同一个不可变索引**，注销不会让现有读取引用立刻失效。

平台依赖：Windows **不自带**用户态文件系统接口，需单独安装第三方开源的 **WinFsp 2.x**（官网 MSI，或 `winget install WinFsp.WinFsp` / `choco install winfsp -y`；安装会注册签名的内核驱动）；Linux 需 **FUSE3**（可访问的 `/dev/fuse`、`fusermount3` 与挂载权限）。框架**不会替宿主安装驱动或启用系统组件**；挂载前应先查能力。目标平台为 Windows / Linux，macOS 未验证。

该依赖**只作用于挂载路径**：未调用 `mount_japk` 时不会加载 WinFsp / FUSE 驱动，`JadeView_init`、协议加载与包验签都不受影响。

### 注册与注销

#### 注册磁盘包（`register_japk`）

```c
uint64_t register_japk(const char* archive_path);
```

头文件注释：

> 验签并解密一次 JAPK，随后复用其共享只读索引。返回 `0` 表示失败。

对包做一次验签 / 解密并保留共享不可变索引。**返回值** `uint64_t` archive ID，`0` 表示失败。

#### 注册已载入的内存包（`register_loaded_japk`）

```c
uint64_t register_loaded_japk(void);
```

> 注册已验签的默认内存包，不重复解密。
> Memory packages require an explicit `mount_root` in `mount_japk`.

复用已通过 `JadeView_load_from_bytes` 验签的默认内存包，**不会二次解密**。内存包挂载时**必须显式传 `mount_root`**，不能传 `NULL`。

#### 注销包（`unregister_japk`）

```c
int32_t unregister_japk(uint64_t archive_id);
```

> 退役包。已有原生文件句柄与 WebView 资源引用仍然有效；已挂载的虚拟目录不再接受新的打开。卸载需单独调用。

注销只让挂载文件系统停止接受**新的**打开请求，已有的原生文件句柄与 WebView 资源引用继续有效；**卸载挂载点是另一个独立步骤**。

### 挂载与卸载

#### 挂载（`mount_japk`）

```c
uint64_t mount_japk(uint64_t archive_id, const char* mount_root);
```

> `mount_root` 传 `NULL` 时，使用去掉 `.japk` 后缀的包路径（`app.japk` → `app/`）。
> 不安装驱动、不启用系统组件、不解压文件、不拦截系统 API。

`mount_root` 传 `NULL` 时使用「去掉 `.japk` 扩展名的同路径」作为目录名；也可显式指定一个**空目录**。函数不安装驱动、不启用系统组件、不解压文件、不拦截 API。**返回值** `uint64_t` mount ID。

#### 卸载（`unmount_japk`）

```c
int32_t unmount_japk(uint64_t mount_id);
```

> 返回 `BUSY` 时提供程序与已有句柄仍有效，但拒绝新的打开。先释放文件、目录迭代器与内存映射，再重试。

#### 卸载与忙处理

`unmount_japk` 遇到忙（返回 `JADE_BUSY` / 未完成语义）时**不会**破坏现状：provider 与数据保持有效、已有句柄继续可读，只是停止新开文件。正确做法是依次释放：

1. 已打开的文件句柄；
2. 目录迭代器；
3. 内存映射；

然后重试卸载。`jadeview_exit_wait` 遇到活动挂载句柄或未返回的回调会返回忙 / 未完成，此时**必须保持库加载**；关闭 Window 不会自动卸载包。

#### 查询挂载根目录（`get_japk_mount_root`）

```c
char* get_japk_mount_root(uint64_t mount_id);
```

> 库分配的 UTF-8 字符串，用 `jade_text_free` 释放。

返回库分配的 UTF-8 字符串，调用方必须用 [`jade_text_free`](/docs/v3api) 释放。

### 能力与状态查询

#### 挂载能力（`get_japk_mount_capabilities`）

```c
int32_t get_japk_mount_capabilities(struct JapkMountCapabilities* out);
```

挂载前调用；失败时读取 [`jade_last_error_code`](/docs/v3api) 的线程错误。

```c
typedef struct JapkMountCapabilities {
  uint32_t backend;
  int32_t available;
  int32_t read_only;
  int32_t caches_plaintext_to_disk;
  int32_t original_archive_prefix;
} JapkMountCapabilities;
```

| 字段 | C 类型 | 含义 |
| --- | --- | --- |
| `backend` | `uint32_t` | 挂载后端标识 |
| `available` | `int32_t` | 当前平台挂载能力是否可用 |
| `read_only` | `int32_t` | 挂载是否只读 |
| `caches_plaintext_to_disk` | `int32_t` | 是否把明文缓存落盘 |
| `original_archive_prefix` | `int32_t` | 原包路径前缀相关标志 |

> 头文件未给这 5 个字段逐个附加注释，上表按字段名直译；具体枚举取值以 `include/JadeView.h` 与运行时返回为准。

#### 挂载状态（`get_japk_mount_state`）

```c
int32_t get_japk_mount_state(uint64_t mount_id, struct JapkMountState* out);
```

```c
typedef struct JapkMountState {
  int32_t healthy;
  size_t active_handles;
} JapkMountState;
```

`healthy` 表示挂载是否健康，`active_handles` 是当前仍活动的句柄数——卸载前用它确认是否还有未释放的引用。

### 推荐流程

```text
1. 等待 app-ready，确认 JadeView_init 返回成功
2. register_japk("app.japk")            → archive_id（0 表示失败）
   （内存包改用 register_loaded_japk()，挂载时必须显式给 mount_root）
3. get_japk_mount_capabilities(&cap)  → 检查 available / backend
4. mount_japk(archive_id, NULL)        → mount_id，默认挂到 app/
5. 宿主用 fopen / open / std::fs::File::open 访问 app/index.html
6. 关闭所有句柄、目录迭代器、映射
7. unmount_japk(mount_id)             → 忙则释放后重试
8. unregister_japk(archive_id)
```

完整示例见仓库 `examples/next/japk.c`。

### 安全边界

- 目录 / 文件名**在所有平台区分大小写**并支持 Unicode；索引校验头长度、条目范围与路径穿越。
- 包内文件**只读**，不提供写数据库或执行包内程序的能力；自包含包不接受依赖宿主外部文件的 `unpacked` 条目。
- Windows 挂载限制为当前账户只读，Linux 默认仅挂载账户可访问——**这不等于「仅宿主进程能读取」**。
- 实现不主动把挂载内容缓存到普通磁盘文件；操作系统缓存、交换区不属于该承诺。
- 包格式、平台证明、签名验证与宿主身份绑定使用 JAPK v2 签名包规则。

---

## 读取包内文件

JAPK 挂载完成后，包内文件以**同级只读虚拟目录**的形式出现。宿主用操作系统自带的文件 API 读取即可，不需要专门的读文件接口，也不会把包解压到磁盘：

| 语言 | 读取方式 |
| --- | --- |
| C / C++ | `fopen("app/index.html", "rb")` |
| Python | `open("app/index.html", "rb")` |
| Rust | `std::fs::File::open("app/index.html")` |

:::warning{title="挂载是可选路径，不是加载 JAPK 的必经步骤"}
本节讲的是**宿主进程**用系统文件 API 直接读包内文件；网页里加载 HTML / CSS / JS / 图片走 [本地协议服务](/docs/v3api/resources/local-server-api) 的 `set_protocol_service_path`，由框架内置的自定义协议直接解析包内资源，**不挂载文件系统，也不依赖 WinFsp / FUSE3**。

因此普通应用**不需要在客户机安装任何第三方组件**。只有调用 `register_japk` / `mount_japk` 这组接口时，目标机器才需要 WinFsp 2.x（Windows）或 FUSE3（Linux）——它是系统级驱动，安装需要管理员权限，装一次对该机器生效，框架不会代为安装。

分发时可用 `get_japk_mount_capabilities` 在运行时判断 `available`：`0` 表示当前机器不具备挂载能力，此时可降级为协议加载，或提示用户安装依赖。若不想让客户机承担这个依赖，把需要宿主直接读的文件放在包外即可。
:::

### 第 1 步：确认挂载能力

挂载依赖系统组件，而且 **Windows 不自带**：WinFsp 是第三方开源的用户态文件系统框架，Windows 没有原生 FUSE 接口，需要单独安装后才能在系统里注册文件系统驱动：

```powershell
winget install WinFsp.WinFsp
# 或 choco install winfsp -y，或从 winfsp.dev 下载 MSI 安装
```

Linux 侧需要 FUSE3（可访问的 `/dev/fuse`、`fusermount3` 与挂载权限）。框架不会替宿主安装驱动或启用系统组件，所以挂载前先查询：

```c
struct JapkMountCapabilities cap = {0};
if (get_japk_mount_capabilities(&cap) != JADE_OK || !cap.available) {
    /* 当前平台无法挂载：改用本地协议服务加载，或提示用户安装依赖 */
    return 1;
}
```

`cap.read_only`、`cap.caches_plaintext_to_disk` 等字段含义见本页「能力与状态查询」小节；查询失败时读取 [`jade_last_error_code`](/docs/v3api) 的当前线程错误。

### 第 2 步：注册并挂载

```c
uint64_t archive = register_japk("app.japk");
if (!archive) return 1;                       /* 验签 / 解密失败 */

uint64_t mount = mount_japk(archive, NULL);   /* app.japk -> app/ */
if (!mount) { unregister_japk(archive); return 2; }
```

`mount_root` 传 `NULL` 时使用「去掉 `.japk` 扩展名的同路径」作为目录名；也可显式传一个**空目录**。内存包用 `register_loaded_japk()` 注册，且挂载时**必须显式给 `mount_root`**，不能传 `NULL`。

不想依赖默认命名时，用 `get_japk_mount_root` 取实际路径：

```c
char *root = get_japk_mount_root(mount);      /* 库分配的 UTF-8 字符串 */
if (root) {
    printf("挂载点: %s\n", root);
    jade_text_free(root);                     /* 必须释放 */
}
```

### 第 3 步：用系统文件 API 读取

**C** — 读取整个文件到内存：

```c
FILE *f = fopen("app/index.html", "rb");
if (!f) return 3;
fseek(f, 0, SEEK_END);
long size = ftell(f);
rewind(f);
char *buf = malloc((size_t)size + 1);
fread(buf, 1, (size_t)size, f);
buf[size] = '\0';
fclose(f);                                   /* 用完立刻关，卸载前必须关闭 */
/* ... 使用 buf ... */
free(buf);
```

**Python** — 挂载完成后就是普通文件操作：

```python
from pathlib import Path

root = Path("app")
html = (root / "index.html").read_bytes()
for entry in sorted(root.rglob("*")):
    if entry.is_file():
        print(entry.as_posix(), entry.stat().st_size)
```

**Rust**：

```rust
use std::{fs, path::Path};

let root = Path::new("app");
let html = fs::read(root.join("index.html"))?;
for entry in fs::read_dir(root)? {
    let entry = entry?;
    println!("{} {} bytes", entry.path().display(), entry.metadata()?.len());
}
```

:::info{title=路径与只读}
目录 / 文件名在**所有平台都区分大小写**并支持 Unicode，路径按系统文件 API 的规则拼接。索引会校验头长度、条目范围与路径穿越；包内文件**只读**，写入、创建、删除都会失败，也不提供写数据库或执行包内程序的能力。`app.japk/index.html` 不会被拦截，读文件请用挂载目录 `app/index.html`。
:::

### 第 4 步：释放引用并卸载

卸载前必须关闭所有文件句柄、目录迭代器和内存映射。可先用 `get_japk_mount_state` 确认没有残留引用：

```c
struct JapkMountState st = {0};
if (get_japk_mount_state(mount, &st) == JADE_OK && st.active_handles != 0) {
    /* 还有引用没释放，先关闭再卸载 */
}

if (unmount_japk(mount) != JADE_OK) {
    /* JADE_BUSY：释放剩余句柄 / 迭代器 / 映射后重试 */
}
unregister_japk(archive);
```

`unmount_japk` 遇到忙不会破坏现状：provider 与数据保持有效、已有句柄继续可读，只是停止接受**新的**打开请求。`unregister_japk` 同样不会让已打开的句柄和 WebView 资源引用立即失效。`jadeview_exit_wait` 遇到活动挂载句柄或未返回的回调会返回忙 / 未完成，此时**必须保持库加载**；关闭 Window 不会自动卸载包。

### 完整示例

以下示例基于仓库 `examples/next/japk.c`，在 `app-ready` 之后调用，使用与宿主身份匹配的已签名 JAPK 包：

```c
#include "JadeView.h"
#include <stdio.h>

int read_package(void) {
    struct JapkMountCapabilities cap = {0};
    if (get_japk_mount_capabilities(&cap) != JADE_OK || !cap.available) return 1;

    uint64_t archive = register_japk("app.japk");
    if (!archive) return 2;

    uint64_t mount = mount_japk(archive, NULL);       /* app.japk -> app/ */
    if (!mount) { unregister_japk(archive); return 3; }

    char *root = get_japk_mount_root(mount);
    if (root) { printf("挂载点: %s\n", root); jade_text_free(root); }

    int status = 0;
    FILE *file = fopen("app/index.html", "rb");
    if (!file) status = 4;
    else {
        if (fseek(file, 0, SEEK_END) != 0) status = 4;
        else printf("index.html: %ld bytes\n", ftell(file));
        if (fclose(file) != 0) status = 4;
    }

    /* 关闭所有文件、目录迭代器与映射后再卸载 */
    if (unmount_japk(mount) != JADE_OK) return 5;
    unregister_japk(archive);
    return status;
}
```

### 常见错误

| 现象 | 原因 / 处理 |
| --- | --- |
| `get_japk_mount_capabilities` 返回 `available = 0` | WinFsp 不是 Windows 自带组件，需单独安装；Linux 侧检查 FUSE3、`/dev/fuse` 与挂载权限 |
| `register_japk` 返回 `0` | 验签 / 解密失败，或包与宿主身份不匹配 |
| `mount_japk` 返回 `0` | 目标目录非空或不可写；显式传一个空目录 |
| `fopen("app/index.html")` 失败 | 确认已挂载成功、路径大小写与包内一致、当前工作目录正确 |
| 用 `app.japk/index.html` 读不到 | 该路径不会被拦截，应读挂载目录 `app/index.html` |
| `unmount_japk` 返回 `JADE_BUSY` | 还有句柄 / 迭代器 / 映射没关，全部释放后重试 |
| 写入包内文件失败 | 挂载是只读的，设计如此 |

:::warning
挂载把包内文件暴露给**当前账户**（Windows 当前账户只读，Linux 默认仅挂载账户可访问），这**不等于**「仅宿主进程能读取」。实现不主动把明文缓存到普通磁盘文件；操作系统缓存、交换区不属于该承诺。
:::

---

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

```text
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

```text
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

---

