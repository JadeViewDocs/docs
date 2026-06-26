---
title: Application Distribution
order: 1
group:
  title: "Release Behavior"
  order: 3
---

# Application Distribution

How do you package, protect, and distribute a program built with JadeView to end users? This article starts from the overall workflow and introduces three core capabilities: the JAPK resource package, in-memory loading, and the NSIS installer.

---

## Release Workflow Overview

A typical JadeView application release workflow:

1. **Development complete** → The frontend resources (HTML/CSS/JS) and the main process (the exe that calls the JadeView DLL) are ready
2. **Package the frontend resources** → Use JadePack or `@electron/asar` to package the frontend project into a JAPK file
3. **Protect the resource content** → JadePack provides obfuscation and signature protection to prevent source code leakage and tampering
4. **Embed or distribute the JAPK** → You can distribute the JAPK as a standalone file, or embed it in the exe and load it from memory
5. **Build the installer** → JadePack's built-in NSIS installer packages everything in one click, producing a complete setup program

---

## JAPK Resource Package

JAPK is JadeView's dedicated format for packaging frontend resources, bundling HTML, CSS, JavaScript, images, and more into a single `.japk` file.

**Key advantages:**

- **Simple distribution**: Just one file, no need to ship a pile of scattered files
- **Fast loading**: JadeView reads resources directly from inside the package, with no need to extract them to a temporary directory
- **ASAR compatible**: Fully compatible with the Electron ASAR format, so packages from the Electron ecosystem can be used directly

**Build methods:**

| Method | Content Protection | Use Case |
|------|---------|---------|
| `@electron/asar` (free) | Plaintext, no protection | Development and debugging, internal tools |
| JadePack obfuscated package | XOR obfuscation, non-plaintext | Distribution with basic protection |
| JadePack signed package | Ed25519 signature + AES-256-GCM encryption | Production environments, commercial distribution |

For detailed information, see [JAPK Resource Package Format](/en-US/docs/api/japk).

---

## Source Code Protection

Frontend resources (JS/CSS/HTML) are plaintext by default, so distributing a JAPK package directly may expose you to the risk of source code leakage and tampering. JadePack provides two layers of protection:

### Obfuscation Protection

Even without signing, JadePack applies XOR obfuscation protection to the packaged content, producing a non-plaintext obfuscated package. No public key is required when loading, making it suitable for basic protection scenarios.

### Signing and Encryption

Provides a complete security solution combining Ed25519 signatures and AES-256-GCM encryption:

- **Tamper protection**: Signature verification ensures the package content has not been modified
- **Forgery protection**: Only those holding the private key can build a verifiable signed package
- **Rollback protection**: Once a public key is set, a failed signed-package load will not fall back to the obfuscated-package logic

Signed packages are recommended for production environments. For details, see [JadePack Build Tool](/en-US/docs/api/jadepack).

---

## In-Memory Loading

JadeView supports loading a JAPK package directly from memory, with no need for the local file system. This means you can embed the JAPK data inside an executable to achieve single-file distribution.

**Use cases:**

- Embed the JAPK in the exe's resources, so users see only a single executable
- Download the JAPK from the network and load it directly, without writing to disk
- Prevent users from directly accessing and modifying the frontend resource files

**Usage:**

```c
// 1. Initialize
JadeView_init(1, NULL, NULL, "MyApp", "com.example.app", 0);

// 2. (Optional) Set the public key to accept signed packages only
JadeView_set_public_key("QeeOu5LQdQooeyOID6h/ChFEo5RhbAFoKgslznp5Nbk=");

// 3. Load the JAPK from memory
int rc = JadeView_load_from_bytes(japk_data, data_size);

// 4. Get the protocol URL and create a window
char url_buffer[256];
set_protocol_service_path("", url_buffer, sizeof(url_buffer));
create_webview_window(url_buffer, 0, &options, NULL);
```

For the full API documentation, see [Loading from Memory](/en-US/docs/api/japk-load-memory).

---

## NSIS Installer

JadePack includes a built-in one-click NSIS installer packaging feature that packages the application directory into a complete Windows setup program.

### Features

- **One-click packaging**: Configure through a graphical interface, with no need to hand-write NSIS scripts
- **WebView2 bootstrapping**: Automatically prompts to install WebView2 when it is not present on the target system
- **Desktop shortcut**: Optionally create a desktop shortcut
- **Custom icon**: Supports application icons in `.ico` format
- **Compression options**: Supports three compression levels: zip / lzma / solid
- **Multilingual**: The installation wizard supports Simplified Chinese, English, and more

### Configuration Options

| Option | Description |
|--------|------|
| Application directory | Path to the root directory of the application to package |
| Main program | The entry executable (e.g. `MyApp.exe`) |
| Application unique identifier | Matches parameter 5 used during JadeView initialization |
| Excluded files | Files/folders to exclude when packaging (wildcards supported) |
| Application name | The program name shown after installation |
| Application version | The installer version number (e.g. `1.0.5`) |
| Compression level | Compression strength; options are `zip` / `lzma` / `solid` |
| Create desktop shortcut | Whether to create a shortcut on the user's desktop |
| Installation mode | The mode the user can choose during installation |
| Application icon | The icon for the installer and shortcut (`.ico` format) |
| Output directory | The output path for the generated installer |
| Installation language | The language of the installation wizard interface |
| WebView2 runtime | How to handle it when not installed (online install / offline install / do nothing) |
| Minimum version | The minimum required operating system version |

### Workflow

1. In the JadePack build center, switch to the **Installer** tab
2. Fill in the configuration options above
3. Click the **Package and Generate Installer** button
4. Wait for packaging to complete, then retrieve the `.exe` installer from the output directory

---

## Recommended Distribution Schemes

Depending on the scenario, the following distribution schemes are recommended:

### Internal Tools / Prototypes

```
Frontend resources → @electron/asar packaging → plaintext JAPK → distributed with the exe
```

Simple and fast, with no extra tooling required.

### User-Facing Desktop Applications

```
Frontend resources → JadePack obfuscated package → embedded in exe, loaded from memory → JadePack NSIS installer
```

Obfuscation protects the source code, single-file distribution, with an installer experience.

### Commercial Software

```
Frontend resources → JadePack signed package → embedded in exe, loaded from memory → JadePack NSIS installer
```

Dual protection through signing and encryption, tamper and forgery proof, with a professional installation experience.
