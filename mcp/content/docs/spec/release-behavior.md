---
order: 0
group:
  title: "发行行为"
  order: 3
---

# JadeView 发行说明

发行仓库: [JadeViewDocs/JadeView](https://github.com/JadeViewDocs/JadeView)

## 支持的平台和架构

- **平台**: Windows、Linux

- **架构**:

  - Windows: x86 (32位)、x64 (64位)、arm64 (ARM 64位)

  - Linux: x64 (x86_64)、arm64 (aarch64)

> 每个平台/架构的产物同时包含动态库与静态库（由 crate-type `cdylib` + `staticlib` 生成），无需单独区分链接方式。

## 文件说明

每个发行版本会附带各平台/架构的库文件与 C 头文件（`JadeView.h`），并按平台打包为压缩包。

### Windows 产物

- `JadeView_x86.dll` / `JadeView_x86.lib` - 32位 动态库 / 静态库
- `JadeView_x64.dll` / `JadeView_x64.lib` - 64位 动态库 / 静态库
- `JadeView_arm64.dll` / `JadeView_arm64.lib` - ARM64 动态库 / 静态库

### Linux 产物

- `libJadeView.so` - 共享库（动态链接）
- `libJadeView.a` - 静态库

### 头文件

- `JadeView.h` - C API 头文件（各平台通用，随各压缩包一并提供）

### 压缩包

Windows 打包为 `.zip`，Linux 打包为 `.tar.gz`，命名格式为 `JadeView_{win|linux}_{平台}_v{版本}.{编译号}.{zip|tar.gz}`：

- `JadeView_win_x86_v2.3.0-beta.5.26F01.zip` - Windows 32位
- `JadeView_win_x64_v2.3.0-beta.5.26F01.zip` - Windows 64位
- `JadeView_win_arm64_v2.3.0-beta.5.26F01.zip` - Windows ARM64
- `JadeView_linux_x64_v2.3.0-beta.5.26F01.tar.gz` - Linux x86_64
- `JadeView_linux_arm64_v2.3.0-beta.5.26F01.tar.gz` - Linux arm64

> 编译号（如 `26F01`）由 CI 自动生成，格式为 `YY + 月字母(A–L) + 当月序号`。

## 程序发行行为

JadeView 采用定期发布模式，确保用户能够获取到稳定、安全的版本更新。以下是详细的发行行为说明：

### 版本命名规则

JadeView 使用语义化版本号（Semantic Versioning），格式为 `vMAJOR.MINOR.PATCH`：

- **MAJOR**: 主版本号，当进行不兼容的 API 更改时递增
- **MINOR**: 次版本号，当添加向下兼容的新功能时递增
- **PATCH**: 修订号，当进行向下兼容的错误修复时递增

### 支持策略

- **当前版本**: 全力支持最新发布的版本，提供完整的 bug 修复和安全更新

### 下载渠道

- **GitHub Releases**: 所有正式版本均可从 GitHub Releases 页面下载
- **官方文档**: 提供最新版本的下载链接和使用说明
- **包管理器**: 未来将支持通过主流包管理器安装（如 NuGet）

### 兼容性保证

- **向后兼容**: 次要版本和补丁版本保证向后兼容，不会破坏现有代码
- **API 稳定性**: 主版本之间可能存在 API 变更，但会提供详细的迁移指南
- **平台支持**: 每个版本都会在所有支持的平台上进行测试，确保兼容性

### 安全更新

- **漏洞响应**: 对于发现的安全漏洞，将在 72 小时内发布安全公告
- **紧急修复**: 严重安全漏洞将优先处理，发布紧急补丁版本
- **透明度**: 所有安全更新都会在发布说明中详细说明

### 贡献与反馈

欢迎社区成员通过以下方式参与 JadeView 的开发和改进：

- **问题反馈**: [Issue Tracker](https://github.com/JadeViewDocs/JadeView/issues)
- **讨论**: [Discussions](https://github.com/JadeViewDocs/JadeView/discussions)

JadeView 团队致力于打造一个稳定、高效、易用的 WebView 窗口库，感谢所有用户和贡献者的支持！
