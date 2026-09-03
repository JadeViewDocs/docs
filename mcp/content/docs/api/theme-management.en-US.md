---
title: Theme Management
order: 2
group:
  title: Windows & Views
  order: 1
---

# Theme Management

**Purpose**: Control whether a window is **light / dark / follows the system**, and whether system background effects such as **Mica or Acrylic** are used on Windows 11; you can also set a **background color string** directly. In 2.0, theme names are all **strings** (`Light` / `Dark` / `System`), and the enum type names from the old header files are no longer used.

---

<h2 id="window-theme">Window Light/Dark Theme</h2>

Corresponding APIs: **`set_window_theme`**, **`get_window_theme`**. **Purpose**: Switch or query the **light/dark theme** of the current window (and its embedded WebView).

```c
int32_t set_window_theme(uint32_t window_id, const char* theme);
int32_t get_window_theme(uint32_t window_id);
```

`theme`: `"Light"`, `"Dark"`, `"System"`. **When `theme` is `NULL`, nothing is done and it returns `0` directly.**

**`get_window_theme` return value**: `1` = Dark, `0` = Light; `"System"` is resolved to `1` / `0` according to the system's actual light/dark state; with no theme / unknown it always returns `0`.

:::info{title=Platform Support}
Available on both Windows and Linux. `"System"` (follow system) is read on Linux via the **XDG Desktop Portal** `org.freedesktop.appearance`, falling back to `gsettings`.
Windows' **immersive dark native title bar** has no Linux equivalent—on Linux the title bar is drawn by HTML, so its light/dark appearance simply follows your page CSS with the theme.
:::

---

## Setting the Window Background Material (`set_window_backdrop`)

**Purpose**: On **Windows 11**, apply a system-provided **background material** (such as Mica or Acrylic) to a window, matching the kind of effects found under "Personalization" in the system settings. Common values for `backdrop_type`: **`mica`**, **`micaAlt`**, **`acrylic`**, plus **`default`** (a solid color that does not depend on the Win11 DWM material API). Values are **case-insensitive** (e.g. `Mica`, `MICA` both work).

```c
int32_t set_window_backdrop(uint32_t window_id, const char* backdrop_type);
```

:::warning{title=Platform Differences}
**Windows 11 only**. Linux (WebKitGTK) has no equivalent for system materials; the call is a no-op and returns `0`. On Linux, use `set_window_background_color` to set a solid color instead, or use a `transparent` window plus a semi-transparent page background.
:::

---

## Setting the Window Background Color (`set_window_background_color`)

**Purpose**: Fill the window background with a **hexadecimal color** (such as `#RRGGBB`), without relying on Mica.

```c
int32_t set_window_background_color(uint32_t window_id, const char* background_color_hex);
```

---

## Specifying It When Creating a Window

Set the initial theme in **`WebViewWindowOptions.theme`**; see [Core API](/en-US/docs/api/index#webview-window-options).
