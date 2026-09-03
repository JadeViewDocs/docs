---
title: JAPK
order: 1
group:
  title: Resources & Local Services
  order: 6
---

# JAPK Asset Package Format

JAPK is JadeView's proprietary application packaging format. It bundles all of your front-end resources — HTML, CSS, JavaScript, images, and more — into a single `.japk` file, much like an archive. The benefits of using JAPK:

- **Simple distribution**: Just send a single file instead of transferring a pile of scattered files
- **Fast loading**: JadeView can read resources directly from inside the package, with no need to extract to a temporary directory
- **Source protection**: Combined with JadePack, content can be protected through obfuscation and signature

---
### Electron ASAR vs. JadePack

| Feature | Electron ASAR | JadePack Obfuscated Package | JadePack Signed Package |
|------|:---:|:---:|:---:|
| Packaging tool | `@electron/asar` CLI | JadePack desktop client | JadePack desktop client |
| File format | ASAR (plaintext) | JAPK v2 obfuscated | JAPK v2 signed |
| Content protection | ❌ None | 3-layer reversible transform | AES-256-GCM encryption |
| Signature verification | ❌ Not supported | ❌ Not supported | ✅ Ed25519 |
| Tamper resistance | ❌ None | ❌ Weak | ✅ Strong |
| Source readable | ✅ Directly viewable | ❌ Requires deobfuscation | ❌ Requires decryption + verification |
| Loading method | File path / memory | File path / [memory loading](/en-US/docs/api/japk-load-memory) | File path / [memory loading](/en-US/docs/api/japk-load-memory) |
| Use cases | Development debugging, internal tools | Distribution with basic protection | Production environments, commercial distribution |
| Cost | Free | Monthly subscription | Monthly subscription |

> For JadePack downloads and details, see [JadePack](/en-US/docs/api/jadepack).

---

## JadePack Build Tool

JadePack is the graphical build tool officially released by JadeView, designed specifically for building and protecting JAPK asset packages:

- **One-click build**: Operate through a graphical interface to easily package a front-end project into a JAPK
- **Content obfuscation**: Even without signing, file content is protected with a 3-layer reversible transform (XOR + byte permutation + bit rotation), so it is not a plaintext package
- **Signature protection**: Supports signing the JAPK to verify its origin and integrity and prevent tampering
- **Unpack support**: Supports storing selected files as "unpacked" for convenient native module loading

:::success
For production environments, we recommend using JadePack to build signed JAPK packages, which provide complete security protection.
:::

---

**JadeView is fully compatible with the Electron ASAR format**, which means:
- Packages created with Electron ASAR can be loaded and run directly by JadeView
- No additional conversion or processing steps are required
- Full interoperability with the Electron ecosystem

:::info
**Note:**
- **Electron ASAR creates plaintext packages**: File content is not encrypted or obfuscated in any way
- **Unsigned packages created by JadePack are also obfuscated packages**: Even without signing, JadePack protects file content with a 3-layer reversible transform (XOR + byte permutation + bit rotation), so it is not a plaintext package

To build a signed and encrypted JAPK package, please use JadePack's graphical build center.
:::

## Loading a JAPK Package

Use the `set_protocol_service_path` API to load a JAPK package. For details, see [Core API - Local Protocol Service](/en-US/docs/api).

## Example

```c
#include "JadeView.h"

// Use a JAPK file
void load_japk_example() {
  char url_buffer[256];
  const char* japk_path = "C:\\path\\to\\your\\app.japk";
  
  int32_t result = set_protocol_service_path(
    japk_path,
    url_buffer,
    sizeof(url_buffer),
    0  // hot_reload: 0 = disable hot reload
  );
  
  if (result == 1) {
    printf("Protocol URL: %s\n", url_buffer);
    // Navigate using url_buffer
  }
}
```

---

## Command-Line Packaging Tutorial (Electron ASAR)

If you don't have any Node.js development experience yet, don't worry — this section starts from scratch and teaches you step by step how to package web files into a JAPK file from the command line.

### What is ASAR?

ASAR (Atom Shell Archive) is a file packaging format that merges all the files in a folder (HTML, CSS, JS, images, etc.) into a single file. This file is like a `.zip` archive, the difference being that JadeView can read web pages directly from inside it without extracting.

`@electron/asar` is a command-line tool for creating and unpacking ASAR files. It is free.

### Step 0: Install Node.js

Node.js provides a command-line tool called `npm`, which we'll use to install `@electron/asar`.

1. Open your browser and visit https://nodejs.org
2. Download the **LTS (Long-Term Support)** version; Windows users are recommended to choose the `.msi` installer
3. Double-click to install and just keep clicking "Next" (keep the default options)
4. After installation, press `Win + R`, type `cmd`, and press Enter to open the Command Prompt
5. Enter the following command to verify the installation succeeded:

```bash
node --version
```

If you see a version number like `v20.x.x`, the installation was successful.

### Step 1: Install the Packaging Tool

Enter the following command in the Command Prompt (only needs to be run once; after a global install it is permanently available):

```bash
npm install -g @electron/asar
```

- `npm install`: tells npm to install a tool
- `-g`: global install, usable from any directory after installation
- `@electron/asar`: the name of the tool to install

Verify that the installation succeeded:

```bash
asar --version
```

Seeing a version number means it's OK.

### Step 2: Prepare Your Web Project

Place your web files into a folder. Suppose your project is called `my-app`, for example:

```
my-app/
├── index.html          ← entry page (required)
├── src/
│   ├── renderer.js     ← JS script
│   └── styles.css      ← stylesheet
└── assets/
    └── icon.png        ← image resource
```

:::success
**`index.html` is required.** JadeView opens it by default when loading a JAPK, just as a browser looks for the homepage when opening a website.
:::

### Step 3: Package

In the Command Prompt, first navigate to the directory containing `my-app`, then run:

```bash
asar pack my-app app.japk
```

What this command means:
- `asar pack`: tells the tool "I want to package"
- `my-app`: the name of the folder to package
- `app.japk`: the name of the generated file (it can be any name; the `.japk` extension is a convention)

After running it, an `app.japk` file is generated in the current directory — this is the JAPK package you need.

### Verifying the Packaging Result

To see which files are in the package, use the following command to list its contents:

```bash
asar list app.japk
```

It will output something like:

```
/index.html
/src/renderer.js
/src/styles.css
/assets/icon.png
```

### Advanced Usage

#### Excluding Certain Files (e.g., `.node` native modules)

Some files (such as `.node` native modules) cannot be packaged and need to stay outside the package to be loaded separately:

```bash
asar pack my-app app.japk --unpack "*.node"
```

- `--unpack "*.node"`: all files with the `.node` extension are not packaged but placed separately in the `app.japk.unpacked` folder

#### Generating to a Specified Directory

```bash
asar pack my-app ./dist/app.japk
```

- Generates `app.japk` into the `dist` folder under the current directory

#### Unpacking (Extracting Files from the Package)

If you want to restore the files inside a JAPK:

```bash
asar extract app.japk ./extracted
```

- Extracts the contents of `app.japk` into the `extracted` folder

### Important Notes

**Electron ASAR creates plaintext packages, and unsigned packages created by JadePack are also obfuscated packages.**

**JAPK built with Electron ASAR:**
- File content is entirely plaintext, without any encryption or obfuscation
- Anyone can directly view the package contents
- The file's origin and integrity cannot be verified
- Not suitable for production environments or scenarios requiring security protection

**Unsigned JAPK built with JadePack:**
- Uses a 3-layer reversible transform (XOR + byte permutation + bit rotation) to protect file content (not plaintext)
- Provides basic content protection
- But does not include signature information, so the origin cannot be verified
- Suitable for scenarios that need basic protection but not signing

**Recommended approach:** Use JadePack's graphical build center to create signed JAPK packages, which provide complete security protection, identity verification, and integrity checking.


### Related Resources

- [https://github.com/electron/asar](https://github.com/electron/asar)
- [https://www.electronjs.org/docs/latest/tutorial/asar-archives](https://www.electronjs.org/docs/latest/tutorial/asar-archives)
