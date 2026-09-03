---
title: Compatibility Report
order: 2
group:
  title: "Overview"
  order: 0
---

# Compatibility Report

JadeView currently supports two major desktop platforms, **Windows** and **Linux**, and provides a consistent C API:

- **Windows**: rendered with Microsoft Edge WebView2;
- **Linux**: rendered with GTK3 + WebKitGTK.

The compatibility details for each platform are described below.

## Windows

JadeView has been thoroughly tested on Windows to ensure stable operation across a wide range of Windows environments.

### System Requirements

#### Minimum Configuration

| Component        | Requirement                                      |
| ---------------- | ------------------------------------------------ |
| Operating System | Windows 10 version 1809 or later (64-bit)        |
| Processor        | Intel Pentium 4 or AMD Athlon 64 processor (or higher) |
| Memory           | 2 GB RAM                                         |
| Storage          | 50 MB of available space                         |

#### Recommended Configuration

| Component        | Requirement                         |
| ---------------- | ----------------------------------- |
| Operating System | Windows 11 64-bit                   |
| Processor        | Intel Core i5 or AMD Ryzen 5 processor |
| Memory           | 8 GB RAM                            |
| Graphics         | Graphics card with DirectX 11 support |
| Storage          | 100 MB of available space           |

### Tested Operating Systems

| OS Version | Architecture | WebView2 Runtime | Test Result |
| ------------ | ---- | ---------------- | -------- |
| Windows 10 1809 | x64 | 91+ | ✅ Compatible |
| Windows 10 2004 | x64 | 92+ | ✅ Compatible |
| Windows 10 21H2 | x64 | 95+ | ✅ Compatible |
| Windows 10 22H2 | x64 | 96+ | ✅ Compatible |
| Windows 11 21H2 | x64 | 97+ | ✅ Compatible |
| Windows 11 22H2 | x64 | 98+ | ✅ Compatible |
| Windows 11 23H2 | x64 | 100+ | ✅ Compatible |
| Windows 11 24H2 | x64 | 120+ | ✅ Compatible |
| Windows 11 25H2 | x64 | 140+ | ✅ Compatible |

### Rendering Engine and Browser Compatibility

On Windows, JadeView uses Microsoft Edge WebView2 as its rendering engine, and therefore shares the same compatibility characteristics as the Edge browser.

| Feature | Support |
| --- | --- |
| HTML5 | ✅ Fully supported |
| CSS3 | ✅ Fully supported |
| JavaScript ES6+ | ✅ Fully supported |
| WebGL | ✅ Supported |
| WebRTC | ✅ Supported |
| WebSocket | ✅ Supported |
| Service Worker | ✅ Supported |
| PWA features | ✅ Partially supported |

## Linux

> JadeView already supports Linux: core capabilities such as **windows, WebView rendering, custom title bars, library-level resizing, and bidirectional IPC** all work as expected.

### Runtime Requirements

The Linux build `libJadeView.so` is based on **tao + wry** and renders with **GTK3 + WebKitGTK 4.1**. Its rendering core is WebKit (the same family as Safari), so feature support follows WebKit and differs slightly from Chromium. Running it requires:

| Item | Requirement |
| --- | --- |
| Rendering engine | WebKitGTK 4.1 (soup3 build, `libwebkit2gtk-4.1.so.0`); **not compatible** with the older 4.0 (soup2) |
| Window / widgets | GTK 3 (`libgtk-3-0`) |
| C runtime | glibc (not musl). The glibc floor of the prebuilt artifacts equals the build machine's glibc version |
| Architecture | Both **x86_64** and **arm64 (aarch64)** are built and released |
| Display backend | X11 (recommended) or Wayland (GTK3) |
| Chinese display | CJK fonts (such as `fonts-noto-cjk` / `fonts-wqy-zenhei`) must be installed, otherwise Chinese characters render as boxes |

### Tested / Compatible Distributions

The hard criterion for compatibility is whether the system can provide **WebKitGTK 4.1 (soup3)** — older distributions only ship 4.0 (soup2), which is not compatible.

| Distribution | Compatible | Notes |
| --- | --- | --- |
| **Ubuntu 24.04 LTS** | ✅ Tested | Official development / validation environment |
| Ubuntu 22.04 LTS | ✅ | Repository includes `libwebkit2gtk-4.1-0` |
| Debian 12 (Bookworm) | ✅ | webkit2gtk 2.40+, includes 4.1 |
| Fedora 38+ | ✅ | `webkit2gtk4.1` |
| Arch / Manjaro | ✅ | `webkit2gtk-4.1` |
| openSUSE Tumbleweed | ✅ | Rolling release |
| RHEL / Rocky / Alma 9 | ✅ | `webkit2gtk4.1` |
| Debian 11 (Bullseye) | ⚠️ | Only 4.0 by default; requires backports or a self-built 4.1 |
| Ubuntu 20.04 LTS | ❌ | Only webkit2gtk-4.0 (soup2), no 4.1 |
| RHEL / CentOS 8 and earlier | ❌ | webkit too old |
| Alpine and other musl-based systems | ❌ | Requires a musl build (not yet provided) + webkit2gtk |
| arm64 (aarch64) | ✅ | Built and shipped with each release |
| Other architectures (e.g. RISC-V) | ❌ (for now) | Only x86_64 and arm64 are released |

> Rule of thumb: **mainstream distributions released in 2022 or later generally work**; older LTS releases from around 2020 do not.

### Supported Features

- ✅ Window creation, WebView rendering (WebKitGTK), custom `jade://` protocol and asset service paths
- ✅ **Frameless window + HTML custom title bar**: drag to move, double-click to maximize/restore, minimize/maximize/close buttons
- ✅ **Library-level edge/corner resizing**: equivalent to the Windows resizing experience, with resize cursors
- ✅ **Bidirectional IPC**: page `window.jade.invoke()` ↔ Rust, and Rust can also proactively push back to JavaScript
- ✅ Window operations: title, size, position, show/hide, focus, maximize, minimize, fullscreen, always-on-top, etc.
- ✅ System language, clipboard, network time (pure Rust NTP)
- ✅ Pure Rust subsystems are platform-independent: encryption/decryption, JAPK signing/decryption, asar asset packages

### Display Backend (X11 / Wayland)

- **X11 (recommended)**: windows, input, and resizing all work normally; global hotkeys can also only be implemented on X11.
- **Wayland**: windows and rendering work, but global hotkeys are unavailable (protocol limitation) and the client cannot set an absolute window position (determined by the compositor). If you encounter input issues, you can set `GDK_BACKEND=x11` to go through Xwayland.

### Running Under WSL2 (WSLg)

WSL2 (including WSLg) can run GUIs directly for development / validation. The following environment variables need to be set (a real Linux desktop usually does not need them):

```bash
export GDK_BACKEND=x11                              # Wayland input issues, switch to X11
export WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1   # WSL has no user namespace, otherwise the renderer process won't start
export WEBKIT_DISABLE_DMABUF_RENDERER=1             # Disable DMABUF to avoid a black screen
# Chinese fonts: sudo apt install -y fonts-wqy-zenhei
```

## FAQ

### Q: Why doesn't it run on Windows 7?

A: On Windows, JadeView is based on WebView2 technology, which only supports Windows 10 1809 and later.

### Q: How do I check the WebView2 Runtime version?

A: You can check it with the following command:

```bash
reg query "HKLM\SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" /v pv
```

### Q: What if I can't download the WebView2 Runtime?

A: You can download and install it manually:

1. Visit the [WebView2 Runtime download page](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section)
2. Download the latest Evergreen Bootstrapper
3. Run the installer

### Q: Why won't my Linux distribution run it?

A: The most common cause is that the system lacks **WebKitGTK 4.1 (soup3)**. Older distributions (such as Ubuntu 20.04) only provide 4.0 (soup2), which is not compatible. Please upgrade to a mainstream distribution from 2022 or later, or install `libwebkit2gtk-4.1-0` yourself. If Chinese characters render as boxes, you need to install CJK fonts.

## Compatibility Testing Tools

We use the following tools and methods for compatibility testing:

- **Automated testing**: UI automation testing with Selenium and Playwright
- **Manual testing**: manual testing on multiple physical devices and virtual machines
- **Performance testing**: performance analysis with Lighthouse and Chrome DevTools
- **Stability testing**: 24/7 continuous operation testing

## Getting Support

If you run into compatibility issues, please:

1. Check whether your system meets the runtime requirements for the corresponding platform
2. On Windows, make sure the latest version of the WebView2 Runtime is installed; on Linux, make sure WebKitGTK 4.1 is installed
3. See the [FAQ](/en-US/faq)
4. Submit a [GitHub Issue](https://github.com/JadeViewDocs/JadeView/issues)
