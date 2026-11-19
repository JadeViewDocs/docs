---
title: V3 ABI contract
order: 1
group:
  title: Overview
  order: 0
---

# V3 ABI contract

This page covers the ABI version identifier, configuration initializer rules, memory ownership and export checks. The host and library must use the same ABI and structure layouts.

Both `create_webview_window` and `create_window` take optional [window features](/en-US/docs/v3api/window-api#window-features-jadewindowfeatures) as their last argument. When using dynamic bindings, check the ABI against `JADE_ABI_VERSION` in the header shipped with the library.

## Load-time check

```c
struct JadeAbiInfo {
    uint32_t abi_version;
    uint32_t pointer_bits;
    uint32_t window_options_size;
    uint32_t webview_settings_size;
};
int32_t jade_get_abi_info(struct JadeAbiInfo *out, size_t capacity);
```

Returns `0` on success or a negative error; insufficient output capacity leaves memory unchanged. This fixed output owns no dynamic memory.

Before passing configurations, SDKs check the ABI, pointer width and structure sizes, and reject a library with a missing export. Python `Runtime` does this automatically.

## Configuration defaults

`WebViewWindowOptions` and `WebViewSettings` begin with `uint32_t struct_size` then `uint32_t abi_version`. Every non-NULL input must have a readable eight-byte header and the declared readable capacity; size tags do not validate arbitrary pointers.

```c
int32_t window_options_default(struct WebViewWindowOptions *out, size_t capacity);
int32_t webview_settings_default(struct WebViewSettings *out, size_t capacity);

struct WebViewWindowOptions options;
if (window_options_default(&options, sizeof options) != JADE_OK) return;
options.title = "My application";
```

Initializers write only complete fields within capacity and set the version/size. NULL outputs, capacities below eight bytes and capacities ending inside a field are rejected without writing. Shorter inputs with the same ABI default the missing trailing fields; unknown trailing bytes are ignored. Same-ABI extensions may append fields but must not move or redefine existing ones.

NULL creation options use all defaults. Windows are visible by default; `hide_window=1` requests a hidden window. Do not substitute a zero-filled structure for the defaults. Python configuration classes set the header and defaults automatically.

## Ownership and fixed layouts

Other existing outputs, event headers, bounds structures and `ResourceOptions` have frozen layouts. They cannot grow without a capacity-aware contract or a new ABI. Bounds continue to use structures rather than JSON.

C strings are UTF-8; respect each API's synchronous input-copy boundary. Free library-owned strings and arrays only with the matching functions. Event data is borrowed during the callback — retain it with `event_clone` / `event_free`. Release `ResourceDeliveryInfo.message` with `free_resource_delivery_info`.

Windows x86 hosts must use the `JADEVIEW_CALL` system/stdcall convention and matching architecture. Acceptance, native Ready and page-load completion remain separate stages.

## Frozen layout values

| Type | x64 | x86 | Frozen check |
|---|---:|---:|---|
| `WebViewWindowOptions` | 160 | 124 | `titlebar_back` 144/112, `titlebar_icon` 152/120 |
| `JadeWindowFeatures` | 24 | 20 | `splash` 16/16 |
| `WebViewSettings` | 128 | 88 | `profile_name` 96/64 |
| `JadeEvent` | 80 | 64 | event header |
| `WebViewBounds` | 32 | 16 | four C string pointers |
| `ResourceDeliveryInfo` | 24 | 16 | delivery diagnostics |
| `JadeAbiInfo` | 16 | 16 | ABI query output |
| `JadeMenuItemDesc` | 72 | 40 | menu item input; `icon` at 40/24 |
| `JadeMenuIconDesc` | 32 | 16 | icon input |

These values are asserted at build time in Rust for both pointer widths and in `tests/next_abi.c` for both C layouts.

## Public export manifest

`tools/check_abi.py` compares every `JADEVIEW_CALL` declaration with the built DLL/SO export table. Release packaging runs it in strict mode: a declared function that is not exported, or an undeclared public export, fails the package. The only accepted non-public exports are `jade_demo_menu_*` and the crash handler's `handle_invalid_parameter` / `handle_pure_virtual_call`.

`JADE_ABI_VERSION` is read from `src/abi.rs` by `build.rs`; the Python SDK tests verify their copy under both 32-bit and 64-bit interpreters.
