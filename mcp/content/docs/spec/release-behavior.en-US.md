---
order: 0
group:
  title: "Release Behavior"
  order: 3
---

# JadeView Release Notes

Release repository: [JadeViewDocs/JadeView](https://github.com/JadeViewDocs/JadeView)

## Supported Platforms and Architectures

- **Platform**: Windows, Linux

- **Architecture**:

  - Windows: x86 (32-bit), x64 (64-bit), arm64 (ARM 64-bit)

  - Linux: x64 (x86_64), arm64 (aarch64)

> Each platform/architecture build ships both a dynamic and a static library (produced by the `cdylib` + `staticlib` crate types), so there is no separate "linking" distinction.

## File Descriptions

Each release ships the library files and the C header (`JadeView.h`) for every platform/architecture, packaged per platform.

### Windows Artifacts

- `JadeView_x86.dll` / `JadeView_x86.lib` - 32-bit dynamic library / static library
- `JadeView_x64.dll` / `JadeView_x64.lib` - 64-bit dynamic library / static library
- `JadeView_arm64.dll` / `JadeView_arm64.lib` - ARM64 dynamic library / static library

### Linux Artifacts

- `libJadeView.so` - shared library (dynamic linking)
- `libJadeView.a` - static library

### Header File

- `JadeView.h` - the C API header (common to all platforms, included in every package)

### Packages

Windows is packaged as `.zip` and Linux as `.tar.gz`, named `JadeView_{win|linux}_{platform}_v{version}.{buildNo}.{zip|tar.gz}`:

- `JadeView_win_x86_v2.3.0-beta.5.26F01.zip` - Windows 32-bit
- `JadeView_win_x64_v2.3.0-beta.5.26F01.zip` - Windows 64-bit
- `JadeView_win_arm64_v2.3.0-beta.5.26F01.zip` - Windows ARM64
- `JadeView_linux_x64_v2.3.0-beta.5.26F01.tar.gz` - Linux x86_64
- `JadeView_linux_arm64_v2.3.0-beta.5.26F01.tar.gz` - Linux arm64

> The build number (e.g. `26F01`) is generated automatically by CI, in the format `YY + month letter (A–L) + per-month sequence`.

## Application Release Behavior

JadeView follows a regular release model to ensure users can obtain stable, secure version updates. The following is a detailed description of the release behavior:

### Version Naming Convention

JadeView uses Semantic Versioning, in the format `vMAJOR.MINOR.PATCH`:

- **MAJOR**: Major version number, incremented when incompatible API changes are made
- **MINOR**: Minor version number, incremented when backward-compatible new features are added
- **PATCH**: Patch number, incremented when backward-compatible bug fixes are made

### Support Policy

- **Current Version**: Full support is provided for the latest released version, including complete bug fixes and security updates

### Download Channels

- **GitHub Releases**: All official versions can be downloaded from the GitHub Releases page
- **Official Documentation**: Provides download links and usage instructions for the latest version
- **Package Managers**: Installation via mainstream package managers (such as NuGet) will be supported in the future

### Compatibility Guarantee

- **Backward Compatibility**: Minor and patch versions are guaranteed to be backward compatible and will not break existing code
- **API Stability**: API changes may occur between major versions, but a detailed migration guide will be provided
- **Platform Support**: Every version is tested on all supported platforms to ensure compatibility

### Security Updates

- **Vulnerability Response**: For discovered security vulnerabilities, a security advisory will be published within 72 hours
- **Emergency Fixes**: Critical security vulnerabilities will be prioritized, with emergency patch versions released
- **Transparency**: All security updates will be detailed in the release notes

### Contributions and Feedback

Community members are welcome to participate in the development and improvement of JadeView through the following channels:

- **Issue Reporting**: [Issue Tracker](https://github.com/JadeViewDocs/JadeView/issues)
- **Discussion**: [Discussions](https://github.com/JadeViewDocs/JadeView/discussions)

The JadeView team is committed to building a stable, efficient, and easy-to-use WebView window library. Thanks to all users and contributors for their support!
