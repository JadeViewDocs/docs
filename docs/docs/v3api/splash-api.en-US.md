---
title: Startup Splash
order: 4
group:
  title: Native UI
  order: 4
---

# Startup Splash

JadeView shows a splash overlay in the content area below the title bar of the first normal window. It covers the content area and menu bar, but not the title bar. The overlay contains only the application logo and a loading animation, with no title or status text. It is not a separate window: it appears with the window, is clipped by it, and never shows up in the taskbar or Alt+Tab.

Whether the window has a title bar or border is entirely up to the options used to create that window (`noframe`, `title_bar_style`, `transparent`, and so on). The splash covers only the content area below the title bar and does not alter window styles; the title bar remains visible and usable.

## Preview

![Startup splash](/splash-preview.png)

## Configuration (`jade_splash_configure`)

```c
typedef struct JadeSplashOptions {
    uint32_t struct_size;
    uint32_t abi_version;
    uint32_t flags;            /* bit 0 disables the splash */
    const char* logo_path;
    const uint8_t* logo_data;
    size_t logo_data_size;
    uint32_t background_color; /* 0xAARRGGBB */
    uint32_t accent_color;     /* 0xAARRGGBB */
    uint32_t minimum_ms;
} JadeSplashOptions;

int32_t jade_splash_configure(const JadeSplashOptions* options);
```

Call it before `JadeView_init`. Pass `NULL` to clear the configuration and disable the splash; `struct_size` must equal `sizeof(JadeSplashOptions)`.

| Field | Description |
|---|---|
| `flags` | Bit 0 set disables the splash. |
| `logo_data` / `logo_data_size` | PNG/ICO logo bytes; takes precedence over `logo_path`. |
| `logo_path` | PNG/ICO file path. A mounted JAPK path such as `app/logo.png` works. |
| `background_color` | Overlay background color; `0` uses the default dark color. |
| `accent_color` | Loading animation color; `0` uses the default white on dark backgrounds. |
| `minimum_ms` | Minimum display time; the overlay stays visible at least this long. |

## Example

```c
JadeSplashOptions splash = { 0 };
splash.struct_size = sizeof splash;
splash.abi_version = JADE_ABI_VERSION;
splash.logo_path = "app/logo.png"; /* mounted JAPK path */
splash.background_color = 0xFF0E0D14;
splash.accent_color = 0xFFFFFFFF;
splash.minimum_ms = 600;
if (!jade_splash_configure(&splash)) return 1;

if (!JadeView_init(0, NULL, data_dir, app_name, app_sig, 0)) return 1;
```

If the splash starts before the JAPK mount is available, `app/logo.png` does not exist yet; pass the logo through `logo_data` instead. Menu item `icon_path` values can use the same `app/...` paths after the page loads.

## Lifecycle

- The configuration is stored before `JadeView_init`.
- When the first normal window is created, the overlay attaches to the content area below its title bar, covering the menu bar and page area; that window's default WebView stays hidden and loads in the background.
- The first `webview-did-finish-load` requests the overlay to close; it remains visible until `minimum_ms` has elapsed.
- Once the close condition is met, the whole overlay fades out before it is removed; the default WebView is then shown and the window menu bar and normal content return.
- While the overlay is visible, the title bar's left back/refresh buttons are hidden; after it closes, the window's `set_titlebar_components` settings apply again.
- The overlay does not take mouse hits; the window remains usable.
- Closing the window or exiting the process destroys the overlay with the window.

The splash renderer is currently wired on Windows; Linux will reuse the same options and drawing logic with a GTK/GLArea implementation.

