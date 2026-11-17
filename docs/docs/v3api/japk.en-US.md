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
| Loading method | File path / memory | File path / [memory loading](/en-US/docs/v3api/japk-load-memory) | File path / [memory loading](/en-US/docs/v3api/japk-load-memory) |
| Use cases | Development debugging, internal tools | Distribution with basic protection | Production environments, commercial distribution |
| Cost | Free | Monthly subscription | Monthly subscription |

> For JadePack downloads and details, see [JadePack](/en-US/docs/v3api/jadepack).

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

Use the `set_protocol_service_path` API to load a JAPK package. For details, see [Core API - Local Protocol Service](/en-US/docs/v3api).

## JAPK Mount

Signatures and structs come from the `host_fs` export block of `include/JadeView.h`.

### Mount model

The real package is `app.japk`, and by default it is mounted as a **read-only virtual directory `app/`** next to it. The host reads it with ordinary file APIs:

```c
FILE *f = fopen("app/index.html", "rb");
```

It does not intercept `app.japk/index.html`, and it never extracts the package to disk. Registering the package, the WebView protocol and the mount share **one immutable index**, so unregistering does not immediately invalidate existing read references.

Platform requirements: Windows **does not ship** a user-mode file system interface, so install the open-source **WinFsp 2.x** separately (MSI from the official site, or `winget install WinFsp.WinFsp` / `choco install winfsp -y`; the installer registers a signed kernel driver). On Linux you need **FUSE3** (an accessible `/dev/fuse`, `fusermount3`, and mount privileges). The framework **never installs drivers or enables system components** for you; check capabilities before mounting. Target platforms are Windows / Linux; macOS is untested.

That dependency **only applies to the mount path**: without `mount_japk`, neither the WinFsp nor the FUSE driver is loaded, and `JadeView_init`, protocol loading and package signature verification are unaffected.

### Register and unregister

#### Register a package on disk (`register_japk`)

```c
uint64_t register_japk(const char* archive_path);
```

Header comment:

> Verifies and decrypts a JAPK once, then reuses its shared read-only index. Returns `0` on failure.

**Return value**: `uint64_t` archive ID; `0` means failure.

#### Register an already-loaded in-memory package (`register_loaded_japk`)

```c
uint64_t register_loaded_japk(void);
```

> Registers the default in-memory package that has already been verified; it is not decrypted again.
> Memory packages require an explicit `mount_root` in `mount_japk`.

Reuses the default in-memory package already verified by `JadeView_load_from_bytes`. When mounting a memory package you **must pass `mount_root` explicitly** — `NULL` is not allowed.

#### Unregister a package (`unregister_japk`)

```c
int32_t unregister_japk(uint64_t archive_id);
```

> Retires the package. Existing native file handles and WebView resource references stay valid; the mounted virtual directory no longer accepts new opens. Unmounting is a separate call.

### Mount and unmount

#### Mount (`mount_japk`)

```c
uint64_t mount_japk(uint64_t archive_id, const char* mount_root);
```

> When `mount_root` is `NULL`, the package path without the `.japk` suffix is used (`app.japk` → `app/`).
> Installs no driver, enables no system component, extracts no file, and intercepts no system API.

You may also pass an explicit **empty directory**. **Return value**: `uint64_t` mount ID.

#### Unmount (`unmount_japk`)

```c
int32_t unmount_japk(uint64_t mount_id);
```

> On `BUSY`, the provider and existing handles remain valid but new opens are refused. Release files, directory iterators and memory maps, then retry.

`jadeview_exit_wait` returns busy / incomplete while active mount handles or unreturned callbacks exist; in that case **keep the library loaded**. Closing a window does not unmount the package.

#### Query the mount root (`get_japk_mount_root`)

```c
char* get_japk_mount_root(uint64_t mount_id);
```

Returns a library-allocated UTF-8 string that the caller must release with [`jade_text_free`](/en-US/docs/v3api/index).

### Capabilities and state

#### Mount capabilities (`get_japk_mount_capabilities`)

```c
int32_t get_japk_mount_capabilities(struct JapkMountCapabilities* out);
```

Call it before mounting; on failure read the thread error from [`jade_last_error_code`](/en-US/docs/v3api/index).

```c
typedef struct JapkMountCapabilities {
  uint32_t backend;
  int32_t available;
  int32_t read_only;
  int32_t caches_plaintext_to_disk;
  int32_t original_archive_prefix;
} JapkMountCapabilities;
```

| Field | C type | Meaning |
| --- | --- | --- |
| `backend` | `uint32_t` | Mount backend identifier |
| `available` | `int32_t` | Whether mounting is available on this platform |
| `read_only` | `int32_t` | Whether the mount is read-only |
| `caches_plaintext_to_disk` | `int32_t` | Whether plaintext is cached to disk |
| `original_archive_prefix` | `int32_t` | Flag related to the original archive path prefix |

> The header does not comment these five fields individually; the table is a direct reading of the field names. For exact enum values rely on `include/JadeView.h` and what the runtime returns.

#### Mount state (`get_japk_mount_state`)

```c
int32_t get_japk_mount_state(uint64_t mount_id, struct JapkMountState* out);
```

```c
typedef struct JapkMountState {
  int32_t healthy;
  size_t active_handles;
} JapkMountState;
```

`healthy` tells whether the mount is healthy; `active_handles` is how many handles are still active — use it to confirm nothing is outstanding before unmounting.

### Recommended flow

```text
1. Wait for app-ready and confirm JadeView_init succeeded
2. register_japk("app.japk")            → archive_id (0 means failure)
   (for a memory package use register_loaded_japk(); mount_root is mandatory)
3. get_japk_mount_capabilities(&cap)   → check available / backend
4. mount_japk(archive_id, NULL)        → mount_id, mounted at app/ by default
5. Read app/index.html with fopen / open / std::fs::File::open
6. Close every handle, directory iterator and mapping
7. unmount_japk(mount_id)              → retry after releasing if it returns busy
8. unregister_japk(archive_id)
```

For a complete example see `examples/next/japk.c` in the repository.

### Security boundary

- Directory and file names are **case-sensitive on every platform** and support Unicode; index validation checks header length, entry ranges and path traversal.
- Files inside the package are **read-only**; there is no way to write a database or execute a program from the package. Self-contained packages do not accept `unpacked` entries that depend on host files.
- On Windows the mount is read-only for the current account; on Linux only the mounting account can access it by default — **this is not the same as "only the host process can read it"**.
- The implementation does not proactively cache mounted content into ordinary disk files; OS caches and swap space are outside that promise.
- Package format, platform attestation, signature verification and host identity binding follow the JAPK v2 signed package rules.

---

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

ASAR (Atom Shell Archive) merges a folder of files (HTML, CSS, JS, images, etc.) into a single file, similar to a `.zip`. JadeView can read web pages directly from inside it without extracting.

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

```text
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

```text
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
