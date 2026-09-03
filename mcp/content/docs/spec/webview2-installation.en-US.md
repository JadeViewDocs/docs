---
order: 1
group:
  title: "Tutorial"
  order: 1
---

# WebView2 Installation Guide

## What is the WebView2 Runtime?

The Microsoft Edge WebView2 Runtime is a web browsing control developed by Microsoft that allows applications to embed web content within native apps. JadeView uses the WebView2 Runtime to render web content, so you must install the WebView2 Runtime before using JadeView on Windows.

## Why do you need to install the WebView2 Runtime?

- JadeView is built on Rust's wry library, and wry depends on WebView2 on the Windows platform
- WebView2 provides high-performance web content rendering
- It ensures that JadeView applications can display and run web content correctly

## Installation Steps

### Method 1: Use the official installer

1. Visit the official WebView2 download page: [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download)

2. Choose the installer that suits your system:
   - **Evergreen Bootstrapper**: A small installer that downloads and installs the Evergreen Runtime matching the device architecture
   - **Evergreen Standalone Installer**: A full installer that can install the Evergreen Runtime in offline environments
   - **Fixed Version**: Choose a specific version of the WebView2 Runtime and package it together with your application

3. Download and run the installer

4. Follow the instructions in the installation wizard to complete the installation

### Method 2: Install via the command line

You can also use the command line to install the WebView2 Runtime:

```bash
# Install using the Evergreen Bootstrapper
MicrosoftEdgeWebView2Setup.exe

# Silent install (no user interface)
MicrosoftEdgeWebView2Setup.exe /silent /install
```

## Verifying the Installation

After installation, you can verify whether the WebView2 Runtime was installed successfully in the following way:

1. Open File Explorer
2. Navigate to `C:\Program Files (x86)\Microsoft\EdgeWebView\Application`
3. Check whether a folder named after a version number exists (for example, `120.0.2210.91`)

## Frequently Asked Questions

### Q: What should I do if I encounter an error during installation?

A: Make sure your system meets the following requirements:
- Windows 10 version 1809 or later
- Windows 11
- Sufficient disk space
- Administrator privileges

If the problem persists, please refer to the [WebView2 troubleshooting guide](https://learn.microsoft.com/en-us/microsoft-edge/webview2/troubleshooting)

### Q: Can the WebView2 Runtime be packaged together with the application?

A: Yes. You can use a fixed version of the WebView2 Runtime and package it together with your application. This ensures that your application always uses a specific version of WebView2, unaffected by system updates.

### Q: Does the WebView2 Runtime update automatically?

A: Yes. The Evergreen version of the WebView2 Runtime updates automatically to ensure you always use the latest and most secure version.

## System Requirements

- **Operating system**: Windows 10 version 1809 or later, or Windows 11
- **Architecture**: x86, x64, or ARM64
- **Disk space**: At least 100 MB
- **Network connection**: Used for download and updates (Evergreen version only)

> Note: the minimum OS version is ultimately governed by the official [WebView2 Runtime requirements](https://learn.microsoft.com/en-us/microsoft-edge/webview2/).

## Related Links

- [WebView2 official documentation](https://learn.microsoft.com/en-us/microsoft-edge/webview2/)
- [WebView2 download page](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download)
- [WebView2 troubleshooting](https://learn.microsoft.com/en-us/microsoft-edge/webview2/troubleshooting)
