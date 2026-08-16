---
title: Signed JAPK Tutorial
order: 4
badge: v2.4
group:
  title: "Tutorial"
  order: 1
---

# Signed JAPK Tutorial

This tutorial shows how to turn a production Web build into a JAPK package certified by the JadeTweak platform root, then verify, decrypt, and run it from a JadeView host executable.

A signed JAPK is not a standalone executable. It is an encrypted Web resource container loaded by a host application through JadeView. You normally distribute it together with the host EXE and the matching JadeView DLL.

:::warning{title="Version requirements"}
This tutorial requires:

- **JadeView 2.4.0-beta.3 or later**
- **JadePack 2.3.0 or later**
- A **JadeTweak v3 application certificate**

The file container still uses `JAPKV002`, while the package signature protocol is v3. Legacy self-signed packages, runtime public-key injection, and unsigned JAPK packages are no longer accepted.
:::

## Final application layout

A typical release contains three primary files:

```text
ExampleApp/
|-- ExampleApp.exe
|-- JadeView_x64.dll
`-- app.japk
```

- `ExampleApp.exe` is the host that calls the JadeView C API.
- `JadeView_x64.dll` verifies the platform certificate chain, package signature, and content integrity, then creates the WebView.
- `app.japk` is the signed and encrypted resource package produced by JadePack.

You may also embed `app.japk` as an EXE resource and pass its bytes to JadeView through the memory-loading API.

## JAPK trust chain

JadeView no longer trusts a public key supplied by the host at runtime. The verification chain is fixed:

```text
JadeTweak platform root public key compiled into JadeView
        | verifies
JadeTweak v3 certificate attestation
        | binds
App ID + app name + main EXE basename + leaf public key
        | verifies
JadePack v3 package signature
        | decrypts and verifies
ASAR Web resources and their SHA-256 hash
```

This process rejects:

- Packages self-signed with an arbitrary key;
- Packages with modified metadata, ciphertext, or Web resources;
- Packages whose App ID or app name differs from the host initialization values;
- Packages loaded by the wrong host executable;
- Legacy signature protocols, unsigned packages, and ambiguous JAPK layouts.

:::info{title="Offline verification"}
Runtime verification is an offline cryptographic operation. Expiring or revoking a certificate prevents new signing operations, but previously signed packages remain verifiable offline.
:::

## Prerequisites

Prepare the following:

1. A production build of your Web application;
2. The final filename of the host executable;
3. A JadeTweak v3 application certificate;
4. [JadePack](https://store.jade.run/downloads/jadepack/latest);
5. The DLL, import library, and `JadeView.h` from [JadeView 2.4.0-beta.3](https://github.com/tuyangJs/JadeView/releases/tag/v2.4.0-beta.3) or later.

The Web build directory must contain an entry page:

```text
web-dist/
|-- index.html
|-- assets/
|   |-- index.js
|   `-- index.css
`-- images/
    `-- logo.png
```

For a Vite application, a relative asset base is recommended:

```js
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
});
```

## Step 1: Define the application identity

Define all three identity fields before requesting a certificate.

| Field | Example | Runtime use |
|---|---|---|
| App ID | `com.example.product` | Passed as `app_signature` to `JadeView_init` and used as the `JADE://` domain |
| App name | `Example Product` | Passed as `app_name` to `JadeView_init` |
| Main executable | `ExampleApp.exe` | Compared with the filename of the current process |

:::warning{title="The app name and EXE name are independent"}
`app_name` does not need to equal `main_exe`. For example, the app name can be `Example Product` while the executable is `ExampleApp.exe`. Each value must independently match its corresponding certificate field.
:::

Important details:

- `app_signature` in the JadeView API means the **App ID**, not a Base64 package signature.
- The App ID and app name are compared exactly.
- On Windows, the main executable comparison is case-insensitive, but the certificate value must be one basename rather than a path.
- Debug builds are checked too. A certificate bound to `ExampleApp.exe` will reject `ExampleApp_debug.exe`.
- Application identity fields are locked after a certificate has been issued. Confirm the names before release.

## Step 2: Request a v3 certificate

1. Sign in to [JadeTweak application certificates](https://store.jade.run/certificates).
2. Open the new-certificate form.
3. Enter the App ID, app name, and main executable filename.
4. Submit the request and wait until the certificate is available for signing.

The certificate is used for remote signing. JadeView receives a certificate attestation containing the application identity, leaf public key, and platform-root signature. The host application does not need to store a certificate private key.

## Step 3: Build the Web resources

Run the production build command for your frontend project. For example:

```bash
npm run build
```

or:

```bash
bun run build
```

Before packaging, verify that:

- `index.html` exists at the root of the output directory;
- All referenced scripts, styles, and images are inside the output directory;
- The page does not depend on a development server;
- Resource URLs work from the `JADE://{app-id}` custom protocol;
- You selected the build output rather than the source directory.

## Step 4: Package and sign with JadePack

Start JadePack, sign in to JadeTweak, and open **Build Center > Resource Packaging**.

Fill in the following fields:

1. **Source directory (Web build output)**: select the `web-dist` or `dist` directory from the previous step;
2. **Output path (.japk)**: for example, `D:\release\ExampleApp\app.japk`;
3. **Remote signing certificate**: select the v3 certificate for this application identity;
4. Configure exclusions and reproducible ordering when needed;
5. Click **Package and Sign**.

:::warning{title="Do not release an obfuscated-only package"}
The strict loading path in JadeView 2.4.0-beta.3 only accepts packages carrying a JadeTweak platform attestation. A production package must be created with the signing action.
:::

The resulting `.japk` contains:

- A strict JAPK v2 container header;
- A v3 signature manifest;
- A certificate attestation issued by the JadeTweak platform root;
- An Ed25519 package signature;
- AES-256-GCM encrypted ASAR content;
- A SHA-256 hash of the decrypted content.

Do not modify the generated file. Changing even one byte causes JadeView to reject it.

## Step 5: Load the package from the host

The recommended flow calls `JadeView_load_from_bytes` first to obtain a precise error code, then mounts the verified and decrypted in-memory resources by passing an empty path to `set_protocol_service_path`.

Complete C example:

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include "JadeView.h"

static uint8_t* read_all_bytes(const char* path, size_t* size_out) {
    FILE* file = fopen(path, "rb");
    uint8_t* data = NULL;
    long length = 0;

    if (!file) {
        return NULL;
    }
    if (fseek(file, 0, SEEK_END) != 0 || (length = ftell(file)) <= 0) {
        fclose(file);
        return NULL;
    }
    rewind(file);

    data = (uint8_t*)malloc((size_t)length);
    if (!data || fread(data, 1, (size_t)length, file) != (size_t)length) {
        free(data);
        fclose(file);
        return NULL;
    }

    fclose(file);
    *size_out = (size_t)length;
    return data;
}

static const char* JADEVIEW_CALL on_japk_load_failed(
    uint32_t window_id,
    const char* event_data
) {
    (void)window_id;
    fprintf(stderr, "JAPK load failed: %s\n", event_data ? event_data : "unknown");
    return NULL;
}

static const char* JADEVIEW_CALL on_all_windows_closed(
    uint32_t window_id,
    const char* event_data
) {
    (void)window_id;
    (void)event_data;
    jadeview_exit();
    return NULL;
}

static const char* JADEVIEW_CALL on_app_ready(
    uint32_t window_id,
    const char* event_data
) {
    size_t japk_size = 0;
    uint8_t* japk_data = NULL;
    char protocol_url[512] = {0};
    int32_t result = 0;

    if (window_id != 1) {
        fprintf(stderr, "JadeView init failed: %s\n", event_data ? event_data : "unknown");
        return NULL;
    }

    japk_data = read_all_bytes("app.japk", &japk_size);
    if (!japk_data) {
        fprintf(stderr, "Cannot read app.japk\n");
        return NULL;
    }

    result = JadeView_load_from_bytes(japk_data, japk_size);
    free(japk_data); /* JadeView_load_from_bytes copies the input. */

    if (result != 0) {
        fprintf(stderr, "JadeView_load_from_bytes failed: %d\n", result);
        return NULL;
    }

    /* An empty path mounts the verified and decrypted in-memory ASAR. */
    result = set_protocol_service_path(
        "",
        protocol_url,
        sizeof(protocol_url),
        0
    );
    if (result != 1) {
        fprintf(stderr, "Cannot mount JAPK resources\n");
        return NULL;
    }

    WebViewWindowOptions options = {0};
    options.title = "Example Product";
    options.width = 1024;
    options.height = 720;
    options.resizable = 1;
    options.frame_style = "normal";
    options.background_color = "#FFFFFFFF";
    options.theme = "System";
    options.maximizable = 1;
    options.minimizable = 1;
    options.x = -1;
    options.y = -1;
    options.focus = 1;
    options.auto_save_state = 1;

    if (create_webview_window(protocol_url, 0, &options, NULL) == 0) {
        fprintf(stderr, "Cannot create WebView window\n");
    }

    return NULL;
}

int main(void) {
    /* Register events before JadeView_init. */
    jade_on("app-ready", on_app_ready);
    jade_on("japk-load-failed", on_japk_load_failed);
    jade_on("window-all-closed", on_all_windows_closed);

    if (JadeView_init(
            0,                      /* enable_devmod */
            NULL,                   /* log_path */
            "./data",              /* data_directory */
            "Example Product",     /* must equal certificate app_name */
            "com.example.product", /* must equal certificate App ID */
            1                       /* single_instance */
        ) != 1) {
        return 1;
    }

    return run_message_loop();
}
```

Compile the host as the filename registered in the certificate, `ExampleApp.exe` in this example. JadeView resolves the current process filename automatically and performs the third identity check.

:::info{title="Resolving app.japk"}
The example reads `app.japk` from the current working directory to keep the code focused. A production host should resolve an absolute path relative to its executable and must not assume that the process starts in the installation directory.
:::

## Loading directly from a file path

For a standalone JAPK file, you can skip `JadeView_load_from_bytes` and pass the file path directly to the protocol service:

```c
char protocol_url[512] = {0};

int32_t mounted = set_protocol_service_path(
    "D:\\release\\ExampleApp\\app.japk",
    protocol_url,
    sizeof(protocol_url),
    0
);
```

File-path mode performs the same platform-chain, identity, signature, decryption, and content-hash checks, but the API only returns `1` or `0`. Prefer the memory-loading flow when you need a specific error code.

Choose one flow:

- After `JadeView_load_from_bytes`, pass an empty string to `set_protocol_service_path`;
- When passing the `.japk` path directly, do not call `JadeView_load_from_bytes` first, or the package will be verified and decrypted twice.

## Do not set a runtime public key

Legacy examples may contain:

```c
JadeView_set_public_key(public_key);
```

Do not call this in current applications. JadeView embeds the only trusted JadeTweak platform root public key:

- Passing the exact platform root is only a compatibility no-op;
- Passing any other key returns `-11` (policy denied);
- A host-provided key cannot make a self-signed package trusted.

No JAPK public-key file is required in the application distribution.

## Reading verified signature information

After the package loads successfully, the host can inspect the verified metadata:

```c
char* signature_info = JadeView_get_signature_info();
if (signature_info) {
    printf("%s\n", signature_info);
    jade_text_free(signature_info);
}
```

The JSON contains the App ID, app name, main executable, certificate ID, certificate version, signing time, and request ID. It is useful for diagnostics, but it is not a substitute for verification; `JadeView_load_from_bytes` has already performed the cryptographic checks.

## Error codes and troubleshooting

| Return value | Meaning | Check first |
|---:|---|---|
| `0` | Package loaded | Continue mounting the resources |
| `-1` | Invalid argument | Null data pointer or zero file size |
| `-2` | Not initialized | Confirm that `JadeView_init` succeeded first |
| `-4` | Invalid JAPK format | Use Package and Sign in JadePack 2.3.0+ |
| `-5` | Invalid package signature | Check whether the file or signature metadata changed |
| `-6` | Application identity mismatch | Compare the App ID and app name independently |
| `-7` | Decryption failed | Check for damaged ciphertext or signing data |
| `-11` | Security policy denied | Remove custom runtime public-key injection |
| `-13` | Main process mismatch | Compare the current EXE filename with `main_exe` |
| `-14` | Content integrity failure | The decrypted ASAR does not match its signed hash |
| `-15` | Invalid platform certificate | Use a valid JadeTweak v3 certificate attestation |

Subscribe to `japk-load-failed` to receive a textual reason. Production hosts should also configure `log_path` and preserve JadeView diagnostic logs.

### The window opens blank

If verification succeeds but the page is blank, the problem is normally in the Web build rather than the certificate. Check that:

- `index.html` is at the package root;
- Script, stylesheet, and image URLs are valid;
- The frontend does not still point to a development server;
- The asset base works with the `JADE://` protocol;
- JadePack received the correct build output directory.

### Debug works but release fails

Compare the real process filenames first. A common cause is building `ExampleApp.exe` for development and renaming it in the release pipeline, so it no longer matches the certificate `main_exe`.

To change the main executable name, request a certificate for the intended identity and sign the package again. Do not edit the signed manifest inside the JAPK.

## Release checklist

- [ ] Use Package and Sign, not obfuscated-only packaging;
- [ ] Use JadeView `2.4.0-beta.3` or later;
- [ ] Use JadePack `2.3.0` or later;
- [ ] Match the `JadeView_init` App ID and app name to the certificate;
- [ ] Match the final EXE filename to certificate `main_exe`;
- [ ] Do not post-process or rewrite `app.japk` after signing;
- [ ] Remove calls to `JadeView_set_public_key`;
- [ ] Match the x86, x64, or ARM64 JadeView DLL to the host architecture;
- [ ] Test the final EXE and JAPK from a clean installation directory;
- [ ] Apply appropriate release integrity controls to the host, DLL, and installer.

:::warning{title="Host integrity boundary"}
The JAPK platform signature protects the Web resource package and its application identity. Replacing the host EXE or JadeView DLL is outside the JAPK trust boundary. Distribute production applications through a trusted channel and apply Windows code signing to the EXE, DLL, or installer when required by your product.
:::
