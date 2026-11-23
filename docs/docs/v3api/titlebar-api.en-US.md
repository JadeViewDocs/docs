---
title: Title Bar
order: 1
group:
  title: Windows
  order: 1
---

# Title Bar

## Change the title bar style (`set_window_frame`)

```c
int32_t set_window_frame(uint32_t window_id, const char* title_bar_style);
```

Pass the Window ID and `"default"`, `"hidden"`, or `"BarOverlay"`. A null style selects `"default"`. The return value is `1` when accepted and `0` on failure. Set `noframe` in the [window creation options](/en-US/docs/v3api/window-api) to choose the window border.

The function signature has changed. Recompile the host with the new header and update any dynamic bindings.

## Titlebar Components (`set_titlebar_components`)

Windows only. Each call sets all five flags; every flag must be `0` or `1`.

```c
int32_t set_titlebar_components(uint32_t window_id, int32_t back,
    int32_t refresh, int32_t icon, int32_t minimize, int32_t maximize);

set_titlebar_components(window_id, 1, 1, 1, 1, 1);
```

- `back=1` shows Back only when the WebView has history; `back=0` always hides it.
- `refresh` shows Refresh in the default caption and `BarOverlay`. Refresh reloads the current page and is disabled while loading.
- `icon` controls the window icon in the default caption, not the actual window or taskbar icon. `BarOverlay` does not draw an icon but keeps the flag for switching back.
- `minimize` / `maximize` match the creation options `minimizable` / `maximizable`; they do not affect Close.
- Creation options `titlebar_back` / `titlebar_refresh` / `titlebar_icon` default to `1`. Runtime calls update them, and the settings survive title-bar style changes.
- Left-hand buttons appear in `title_bar_style=default` and `BarOverlay`. `BarOverlay` reserves only the button rectangles, so custom page headers must leave space for them.
- Title text is unaffected. Button colors are configured with `set_titlebar_style`.

Call after the window is ready. Returns `1` when queued, `0` on rejection; use `jade_last_error_code/message` for the cause. Non-Windows platforms and flags outside `0/1` are errors.

```python
window.set_titlebar_components(back=True, refresh=True, icon=True, minimize=True, maximize=True)
```

## Set the Title Bar Style (`set_titlebar_style`)

Windows only. Sets the height and button colors for both the default caption and `BarOverlay`.

```c
int32_t set_titlebar_style(uint32_t window_id, int32_t height,
    const char* background_color, const char* foreground_color,
    const char* button_background_color,
    const char* button_hover_background_color, const char* button_hover_foreground_color);
```

| Parameter | Meaning |
| --- | --- |
| `window_id` | Target Window ID, not a WebView ID |
| `height` | `-1` keeps the current value; `0` restores the mode default; custom heights are 20–100 DIP; values outside this range are rejected |
| `background_color` | Caption background, default caption only |
| `foreground_color` | Shared color for title text and normal button icons. Follows the theme by default. The title and unhovered buttons are dimmed when the window is inactive |
| `button_background_color` | Normal background of all buttons; transparent by default |
| `button_hover_background_color` | Hover background of buttons other than Close |
| `button_hover_foreground_color` | Hover icon color of buttons other than Close |

Colors accept `#RRGGBB`, `#RRGGBBAA`, `rgb(r,g,b)` and `rgba(r,g,b,a)` (`a` in `0`–`1`). Each call updates all colors. Pass `NULL` or an empty string to restore the window theme default. An invalid color rejects the whole update. Close keeps its red hover background and white glyph.

`BarOverlay` does not draw the caption background or title, but retains their settings for switching back to the default caption. Styles survive frame changes and are removed when the Window is destroyed.

Overlay controls belong to the Window (even empty ones) and survive navigation, zoom and default WebView destruction. They reserve no page height — keep content clear of both button groups. Controls hide in fullscreen and return on exit. The host EXE must declare Windows 8 or newer in its manifest.

Returns `1` when accepted or `0` when rejected; use `jade_last_error_code/message` for details. Non-Windows platforms return a platform error.

```python
window.set_titlebar_style(
    height=40,
    background_color="#202124",
    foreground_color="#F5F5F5",
    button_background_color="#00000000",
    button_hover_background_color="#3367D6",
    button_hover_foreground_color="#FFFFFF",
)
```

In Python, pass `None` or `""`, or omit a color argument to restore its default.

***
