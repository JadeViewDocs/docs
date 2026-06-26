---
order: 0
group:
  title: "Release Behavior"
  order: 3
---

# JadeView Release Notes

Release repository: [JadeViewDocs/JadeView](https://github.com/JadeViewDocs/JadeView)

## Supported Platforms and Architectures

- **Platform**: Windows

- **Architecture**:  

  - x86 (32-bit)

  - x64 (64-bit)

  - arm64 (ARM 64-bit)

- **Linking**:  

  - dynamic (dynamic linking)

  - static (static linking)

## File Descriptions

### DLL Files

- `JadeView_x86_dynamic.dll` - 32-bit dynamically linked DLL

- `JadeView_x86_static.dll` - 32-bit statically linked DLL

- `JadeView_x64_dynamic.dll` - 64-bit dynamically linked DLL

- `JadeView_x64_static.dll` - 64-bit statically linked DLL

- `JadeView_arm64_dynamic.dll` - ARM64 dynamically linked DLL

- `JadeView_arm64_static.dll` - ARM64 statically linked DLL

### PDB Files

- `JadeView_x86_dynamic.pdb` - 32-bit dynamically linked debug symbols

- `JadeView_x86_static.pdb` - 32-bit statically linked debug symbols

- `JadeView_x64_dynamic.pdb` - 64-bit dynamically linked debug symbols

- `JadeView_x64_static.pdb` - 64-bit statically linked debug symbols

- `JadeView_arm64_dynamic.pdb` - ARM64 dynamically linked debug symbols

- `JadeView_arm64_static.pdb` - ARM64 statically linked debug symbols

### Export Files

- `JadeView.dll_x86_dynamic.exp` - 32-bit dynamically linked export file

- `JadeView.dll_x86_static.exp` - 32-bit statically linked export file

- `JadeView.dll_x64_dynamic.exp` - 64-bit dynamically linked export file

- `JadeView.dll_x64_static.exp` - 64-bit statically linked export file

- `JadeView.dll_arm64_dynamic.exp` - ARM64 dynamically linked export file

- `JadeView.dll_arm64_static.exp` - ARM64 statically linked export file

### Library Files

- `JadeView.dll_x86_dynamic.lib` - 32-bit dynamically linked library file

- `JadeView.dll_x86_static.lib` - 32-bit statically linked library file

- `JadeView.dll_x64_dynamic.lib` - 64-bit dynamically linked library file

- `JadeView.dll_x64_static.lib` - 64-bit statically linked library file

- `JadeView.dll_arm64_dynamic.lib` - ARM64 dynamically linked library file

- `JadeView.dll_arm64_static.lib` - ARM64 statically linked library file

### ZIP Packages

- `JadeView_win_x86_dynamic_v0.1.2.zip` - 32-bit dynamically linked build package

- `JadeView_win_x86_static_v0.1.2.zip` - 32-bit statically linked build package

- `JadeView_win_x64_dynamic_v0.1.2.zip` - 64-bit dynamically linked build package

- `JadeView_win_x64_static_v0.1.2.zip` - 64-bit statically linked build package

- `JadeView_win_arm64_dynamic_v0.1.2.zip` - ARM64 dynamically linked build package

- `JadeView_win_arm64_static_v0.1.2.zip` - ARM64 statically linked build package

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
