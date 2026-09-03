---
title: JadePack
order: 2
group:
  title: 资源与本地服务
  order: 6
---

# JadePack 构建工具

JadePack 是 JadeView 官方发行的图形化桌面客户端，用于 JAPK 资源包的构建、混淆与签名保护。

<div className="jv-cta-row">
  <a href="https://store.jade.run/downloads/jadepack/latest" target="_blank" rel="noopener noreferrer" className="jv-cta-button">下载 JadePack</a>
  <a href="/jadepack" className="jv-cta-button secondary">产品主页</a>
</div>

---

## 下载与安装

- **下载地址**：[https://store.jade.run/downloads/jadepack/latest](https://store.jade.run/downloads/jadepack/latest)
- **安装包类型**：NSIS 安装包（`.exe`）
- **平台**：Windows 10 / 11

运行安装程序，按向导完成安装即可。

:::info{title="按月付费"}
JadePack 为按月付费产品。下载安装后根据界面引导完成订阅即可使用全部功能。
:::

---

## 支持的功能

### 混淆包（无需签名）

即使不签名，JadePack 也会对打包内容施加 3 层可逆变换（XOR + 字节置换 + 位旋转）保护，生成 **非明文** 的混淆包。适合基础保护场景，加载时无需公钥。

| 特性 | 说明 |
|------|------|
| 内容保护 | 3 层可逆变换，非明文存储 |
| 加载方式 | `JadeView_load_from_bytes`，无需公钥 |
| 适用场景 | 内部工具、原型分发 |

### 签名包

提供 Ed25519 签名 + AES-256-GCM 加密的完整安全方案，验证来源和完整性，防止篡改。

| 特性 | 说明 |
|------|------|
| 签名算法 | Ed25519 |
| 加密算法 | AES-256-GCM |
| 内容保护 | 签名 + 加密双重保护 |
| 加载方式 | `JadeView_load_from_bytes` + 公钥 |
| 适用场景 | 生产环境、商业分发 |

### 解包文件

支持将部分文件（如 `.node` 原生模块）设为「解包」存储，打包时不会被混淆/加密，方便原生模块直接从文件系统加载。

### 编译安装包

将应用目录打包为 NSIS 安装包，包含主程序、资源文件、WebView2 运行时等完整内容。

**配置项：**

| 配置项 | 说明 |
|--------|------|
| 应用目录 | 要打包的应用根目录路径 |
| 主程序 | 入口可执行文件（如 `rtexA.exe`） |
| 应用唯一标识符 | 与 JadeView 初始化时参数 5 一致（如 `titles.jade.run`） |
| 排除文件 | 打包时排除的文件/文件夹（支持通配符），如 `AutoTheme.bak`、`JadeView.ec` 等 |
| 应用名称 | 安装后显示的程序名称 |
| 应用版本号 | 安装包版本号（如 `1.0.5`） |
| 压缩级别 | 压缩强度，数值越高压缩率越大，耗时越长。可选 `zip` / `lzma` / `solid` |
| 创建桌面快捷方式 | 是否在用户桌面创建快捷方式 |
| 安装方式 | 用户安装时可选择的模式（如「安装时选择」） |
| 应用图标 | 安装包和快捷方式图标文件（`.ico` 格式） |
| 输出目录 | 生成的安装包输出路径 |
| 安装语言 | 安装向导界面语言，支持简体中文、英语等 |
| WebView2 运行时 | 目标系统未安装 WebView2 时的处理方式。「在线安装 — 安装时下载」表示自动从微软服务器下载并安装 |
| 最低版本 | 要求的最低操作系统版本（可选） |

**操作流程：**

1. 在构建中心切换到 **安装包** 标签页
2. 填写上述配置项
3. 点击 **打包并生成安装包** 按钮
4. 等待打包完成，在输出目录获取 `.exe` 安装包

---

## 与 JadeView API 的关系

JadePack 构建的 JAPK 包通过以下 API 加载：

- **从本地方件加载**：`set_protocol_service_path`，见 [JAPK 资源包格式](/docs/api/japk)
- **从内存加载**：`JadeView_load_from_bytes`，见 [从内存载入](/docs/api/japk-load-memory)

签名包加载前需调用 `JadeView_set_public_key` 设置验证公钥。
