---
title: Title Bar
order: 1
group:
  title: Windows
  order: 1
---

# Title Bar

The title bar shows the window title, icon, and window buttons, and provides an area for dragging the window. JadeView supports a default title bar, an overlay that extends page content into the title bar area, and a hidden title bar with window controls supplied by the page.

![JadeView title bar example](/screenshot/titlebar-overview.jpg)

## Choose a title bar style

Set [`WebViewWindowOptions.title_bar_style`](/en-US/docs/v3api/window/window-api#create-a-window-with-its-default-webview) when creating the window.

| Style | Use |
| --- | --- |
| `default` | Use the default title bar with the window title and native window buttons. |
| `BarOverlay` | Extend the page to the top of the window. The page draws the title bar content and JadeView provides overlay buttons. |
| `hidden` | Hide the title bar and provide the drag region and window controls in the page. |

Set the window border with the [`noframe`](/en-US/docs/v3api/window/window-api#create-a-window-with-its-default-webview) creation option. A frameless window supplies its drag region and window controls in the page. See [window creation options](/en-US/docs/v3api/window/window-api).

## Anatomy

The default title bar consists of navigation buttons, the window icon, a title, and window buttons. The navigation buttons and icon are shown according to their configuration.

![Title bar areas and buttons](/screenshot/titlebar-anatomy.png)

From left to right, the areas are:

1. **Back button**: Navigates to the previous page in the current WebView. When enabled, it appears only if there is history to go back to. Configure it with [`titlebar_back`](/en-US/docs/v3api/window/window-api#create-a-window-with-its-default-webview) or [`set_titlebar_components`](#titlebar-components-set_titlebar_components).
2. **Refresh button**: Reloads the current page. Configure it with [`titlebar_refresh`](/en-US/docs/v3api/window/window-api#create-a-window-with-its-default-webview) or [`set_titlebar_components`](#titlebar-components-set_titlebar_components).
3. **Window icon**: Displays the window icon. Show or hide it with [`titlebar_icon`](/en-US/docs/v3api/window/window-api#create-a-window-with-its-default-webview) or [`set_titlebar_components`](#titlebar-components-set_titlebar_components). The overlay title bar does not draw the icon.
4. **Title**: Displays the window title. Set [`title`](/en-US/docs/v3api/window/window-api#create-a-window-with-its-default-webview) when creating the window or call [`set_window_title`](/en-US/docs/v3api/window/window-geometry#set-the-window-title) at runtime.
5. **Drag region**: Empty space in the default title bar can be used to move the window. With an overlay, mark a [drag region](#define-drag-and-interactive-areas) in the page.
6. **Window buttons**: On the right, these minimize, maximize or restore, and close the window. Configure the minimize and maximize functions with [`set_titlebar_components`](#titlebar-components-set_titlebar_components). See [Button sizes](#button-sizes) below.

In `BarOverlay` mode, the page draws the title and custom content, while JadeView provides the overlay buttons on either side. Leave room for the buttons and define draggable and interactive areas in the page.

## Button sizes

All sizes are in device-independent pixels (DIP) and scale with the system DPI. `H` is the current title bar height: 32 by default, adjustable to 20–100 through the `height` argument of [`set_titlebar_style`](#set-the-title-bar-style-set_titlebar_style).

| Element | Size | Notes |
| --- | --- | --- |
| Overlay window buttons (`BarOverlay`) | `46 × H` each, `138 × H` for all three | The group is anchored to the top-right corner of the window. Reserve a `138 × H` area there, or page content will sit under the buttons. |
| Default title bar window buttons | `46 × H` each, `138 × H` for all three | Drawn by the system at the same width as the overlay buttons. [`set_titlebar_style`](#set-the-title-bar-style-set_titlebar_style) only changes height and colors. The close button always keeps the system red hover state. |
| Back / refresh buttons | `min(H, 42) × H`; `32 × 32` at the default height | Each visible button takes one cell; hidden buttons take no space. |
| Window icon | System small icon size (`16 × 16` at 100% scaling), plus an 8 DIP gap on the right | `BarOverlay` draws no icon, and `icon=0` also removes its space. |

The hit area of an overlay button is exactly its rectangle: the whole `138 × H` region captures clicks instead of passing them to the page, while content outside it receives events normally. In `BarOverlay` mode the navigation buttons likewise occupy a `min(H, 42) × H` strip at the top left, so leave room there as well.

## Create an overlay title bar

An overlay (`BarOverlay`) lets the page run all the way to the top of the window: JadeView draws no title bar background, no title text, and no window icon. It only paints the three native window buttons (minimize, maximize or restore, close) at the top-right of the page. Everything else in the title bar is drawn by the page, so the strip reads as part of the app's own header.

![Page content extending to the top of the window, with three native window buttons drawn over it](/screenshot/titlebar-overlay.png)

The screenshot above is JadeView Playground. The entire top strip is page content: the icon and title on the left and the search box in the middle are laid out by the page. Only the three buttons on the far right are painted by JadeView over the page, and the red `138 × 48` box marks the area they occupy, for a window height of 48 DIP.

Use an overlay when the app draws its own title bar, when the title bar should blend into the page background (a gradient, Mica, or Acrylic running to the top edge of the window), or when the title bar needs to host a search box, tabs, or a breadcrumb. If the window buttons must also be custom-drawn, use the `hidden` style instead.

### What the overlay provides

| Item | Description |
| --- | --- |
| Window buttons | Anchored to the top-right of the client area. Each is `46 DIP` wide, `138 DIP` for all three, and as tall as the title bar height `H`. They keep native hover and pressed feedback, the close button keeps the system red hover state, and the maximize button keeps the Windows 11 Snap Layouts flyout in its hit-test result. |
| Back / refresh | When enabled, these are also painted natively, at the top-left, each occupying `min(H, 42) × H`. Back appears only when there is history to return to, and hidden buttons take no space. |
| Height and colors | Set through [`set_titlebar_style`](#set-the-title-bar-style-set_titlebar_style); they follow the window's light or dark theme by default. |
| Not drawn | The title bar background, title text, window icon, and the full-width drag strip are all left to the page. |
| Full screen | The buttons hide automatically in full screen and come back on exit. |

The overlay buttons are painted above the page, so page `z-index` can neither cover nor push them aside. Clicks inside their rectangles are handled by JadeView and never reach the page; clicks outside go to the page as usual.

### Create the window

1. After the app receives `app-ready`, initialize the window options with `window_options_default` and set `title_bar_style` to `"BarOverlay"`.
2. Optionally set [`noframe`](/en-US/docs/v3api/window/window-api#create-a-window-with-its-default-webview): `BarOverlay` already removes the system title bar. Without `noframe`, the system's resizable window border stays and the page is inset by one border width on the left, right, and bottom (the top still reaches the window edge). With `noframe = 1` the page reaches all four window edges, which suits a page that draws its own border, rounded corners, and shadow.
3. Call `create_webview_window`.
4. Once it returns, call [`set_titlebar_style`](#set-the-title-bar-style-set_titlebar_style) to set the height (`20–100`, `32` by default) and the button colors.

```c
WebViewWindowOptions options;
if (window_options_default(&options, sizeof options) != JADE_OK) return;

options.title = "My App";
options.title_bar_style = "BarOverlay";
// Turn this on when the page must reach all four window edges (custom border, corners, shadow):
// options.noframe = 1;

uint32_t window_id = create_webview_window(url, 0, &options, NULL, NULL);
if (window_id == 0) return;

// Height only: 48 DIP. NULL keeps the current theme color for each entry
set_titlebar_style(window_id, 48, NULL, NULL, NULL, NULL, NULL);
```

The buttons float above the page. When the page palette does not match the window theme (a light page with a dark theme, for example), use `foreground_color` to set a glyph color that stays readable and `button_hover_background_color` to set the hover fill.

### Three things the page must do

1. **Leave `138 × H` free at the top-right**: the button group is always `138 DIP` wide and as tall as the title bar. It never moves for page content, so leave that strip empty or put only decoration there.
2. **Leave room for the navigation buttons at the top-left**: with back or refresh enabled, each takes `min(H, 42) × H`. With both enabled the strip is `2 × min(H, 42)` wide, which is `84` at a height of 48.
3. **Mark drag and interactive regions**: put `jade-region-drag` on the empty parts of the header and `jade-region-no-drag` on the search box, icon buttons, and the like. Without it the window cannot be dragged by its top edge, and double-clicking will not maximize. See [window interaction](/en-US/docs/v3api/frontend/window-styling) for the full behavior.

```html
<header class="titlebar" jade-region-drag>
  <img class="logo" src="/logo.png" alt="" />
  <span class="app-name">My App</span>
  <input class="search" jade-region-no-drag placeholder="Search" aria-label="Search" />
  <!-- Space reserved for the overlay buttons; it may also stay empty -->
  <div class="caption-space" aria-hidden="true"></div>
</header>
```

```css
.titlebar {
  height: 48px;          /* match the height passed to set_titlebar_style */
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 84px;    /* back + refresh: 2 × min(48, 42) */
}
.caption-space {
  width: 138px;          /* the three window buttons */
  flex: none;
}
```

Sizes can be written in CSS pixels directly: at 100% zoom in WebView2, one CSS pixel equals one DIP, and the browser converts across system DPI. If the page applies its own zoom, scale these values accordingly.

:::warning{title="Keep the page in sync with the height"}
The button group is always `138 DIP` wide and does not change with height; increasing `height` only makes the buttons taller. Update the page header height and the left inset as well, or content will be squeezed or leave a gap.
:::

## Define drag and interactive areas

When using page content with an overlay or hidden title bar, mark draggable areas with `jade-region-drag` and exclude buttons, inputs, and other interactive elements with `jade-region-no-drag`.

```html
<header jade-region-drag>
  <span>My App</span>
  <input jade-region-no-drag aria-label="Search" placeholder="Search" />
</header>
```

Leave room for the window buttons in the page layout. See [Window Interaction](/en-US/docs/v3api/frontend/window-styling) for drag-region behavior and examples.

## Customize components and colors

Once the window is ready, call [`set_titlebar_components`](#titlebar-components-set_titlebar_components) to configure components and [`set_titlebar_style`](#set-the-title-bar-style-set_titlebar_style) to set height and colors. The sections below describe their parameters and platform support.

## Change the title bar style (`set_window_frame`)

```c
int32_t set_window_frame(uint32_t window_id, const char* title_bar_style);
```

Pass the Window ID and `"default"`, `"hidden"`, or `"BarOverlay"`. A null style selects `"default"`. The return value is `1` when accepted and `0` on failure. Set `noframe` in the [window creation options](/en-US/docs/v3api/window/window-api) to choose the window border.

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
