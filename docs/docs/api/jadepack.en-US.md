---
title: JadePack
order: 2
group:
  title: Resources & Local Services
  order: 6
---

# JadePack Build Tool

JadePack is the official graphical desktop client released by JadeView, used for building, obfuscating, and signature-protecting JAPK asset packages.

<div className="jv-cta-row">
  <a href="https://store.jade.run/downloads/jadepack/latest" target="_blank" rel="noopener noreferrer" className="jv-cta-button">Download JadePack</a>
  <a href="/en-US/jadepack" className="jv-cta-button secondary">Product page</a>
</div>

---

## Download and Installation

- **Download URL**: [https://store.jade.run/downloads/jadepack/latest](https://store.jade.run/downloads/jadepack/latest)
- **Installer type**: NSIS installer (`.exe`)
- **Platform**: Windows 10 / 11

Run the installer and follow the wizard to complete the installation.

:::info{title="Monthly Subscription"}
JadePack is a monthly subscription product. After downloading and installing, follow the on-screen instructions to complete your subscription and unlock all features.
:::

---

## Supported Features

### Obfuscated Package (No Signature Required)

Even without a signature, JadePack applies a 3-layer reversible transform (XOR + byte permutation + bit rotation) to the packaged content, producing a **non-plaintext** obfuscated package. This is suitable for basic protection scenarios and requires no public key when loading.

| Feature | Description |
|------|------|
| Content protection | 3 layers of reversible transformation, stored as non-plaintext |
| Loading method | `JadeView_load_from_bytes`, no public key required |
| Use case | Internal tools, prototype distribution |

### Signed Package

Provides a complete security solution with Ed25519 signature + AES-256-GCM encryption, verifying the source and integrity to prevent tampering.

| Feature | Description |
|------|------|
| Signature algorithm | Ed25519 |
| Encryption algorithm | AES-256-GCM |
| Content protection | Dual protection of signature + encryption |
| Loading method | `JadeView_load_from_bytes` + public key |
| Use case | Production environments, commercial distribution |

### Unpacked Files

Supports storing certain files (such as `.node` native modules) as "unpacked", so they are not obfuscated/encrypted during packaging, allowing native modules to be loaded directly from the file system.

### Compiling the Installer

Packages the application directory into an NSIS installer, containing the complete content including the main program, asset files, the WebView2 runtime, and more.

**Configuration options:**

| Option | Description |
|--------|------|
| Application directory | The root directory path of the application to be packaged |
| Main program | The entry executable file (e.g. `rtexA.exe`) |
| Application unique identifier | Matches parameter 5 used when initializing JadeView (e.g. `titles.jade.run`) |
| Excluded files | Files/folders excluded during packaging (wildcards supported), such as `AutoTheme.bak`, `JadeView.ec`, etc. |
| Application name | The program name displayed after installation |
| Application version | The installer version number (e.g. `1.0.5`) |
| Compression level | Compression strength; higher values yield a greater compression ratio but take longer. Options are `zip` / `lzma` / `solid` |
| Create desktop shortcut | Whether to create a shortcut on the user's desktop |
| Installation mode | The mode the user can select during installation (e.g. "Choose at install time") |
| Application icon | The icon file for the installer and shortcut (`.ico` format) |
| Output directory | The output path for the generated installer |
| Installation language | The language of the installation wizard interface, supporting Simplified Chinese, English, and more |
| WebView2 runtime | How to handle cases where WebView2 is not installed on the target system. "Online install — download during installation" means it is automatically downloaded and installed from Microsoft's servers |
| Minimum version | The minimum required operating system version (optional) |

**Workflow:**

1. Switch to the **Installer** tab in the Build Center
2. Fill in the configuration options above
3. Click the **Package and Generate Installer** button
4. Wait for packaging to complete, then retrieve the `.exe` installer from the output directory

---

## Relationship with the JadeView API

JAPK packages built by JadePack are loaded through the following APIs:

- **Load from a local file**: `set_protocol_service_path`, see [JAPK Asset Package Format](/en-US/docs/api/japk)
- **Load from memory**: `JadeView_load_from_bytes`, see [Loading from Memory](/en-US/docs/api/japk-load-memory)

Before loading a signed package, you must call `JadeView_set_public_key` to set the verification public key.
