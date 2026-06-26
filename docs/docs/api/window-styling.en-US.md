---
title: Window Interaction Control
order: 2
group:
  title: Frontend API
  order: 2
---

# Window Interaction Control

## Window Drag Region (`app-region`)

**Purpose**: When building your own **custom title bar**, you need to tell the system "this region can be used to drag the window with the mouse" while the button areas should not be draggable. Use the CSS **`app-region`** or **`-webkit-app-region`** (the two are equivalent, just pick one).

**Common pattern**: Set the title bar to `drag` and the buttons on it to `no-drag`.

```css
.title-bar {
  -webkit-app-region: drag;
  app-region: drag;
}
.title-bar button {
  -webkit-app-region: no-drag;
  app-region: no-drag;
}
```

```html
<div class="title-bar" style="-webkit-app-region: drag; app-region: drag;">
  <h1>My App</h1>
  <div class="title-bar-buttons">
    <button type="button" style="-webkit-app-region: no-drag; app-region: no-drag;">Close</button>
  </div>
</div>
```

---

## Custom Window Drag Region (`jade-region-drag`)

:::warning
Supported since v2.3.
:::

In addition to the CSS `-webkit-app-region: drag`, v2.3 adds a new dragging mechanism based on **HTML custom attributes**, used to drag the window and double-click to maximize in frameless / custom title bar windows.

The biggest difference from `-webkit-app-region`: **right-clicking does not bring up the system title bar menu** (Restore / Move / Size / Minimize / Maximize / Close). Because with this approach the drag region is always a regular page region (the client area), only a **left mouse button press** initiates a programmatic window move; a right-click landing on the drag region is just a regular page right-click and does not go through the system title bar.

:::info
No C FFI or frontend JS initialization is needed; it is automatically injected at runtime, so just add the attribute in your HTML and it works. Platform: Windows.
:::

### Attributes

| Attribute | Effect |
|------|------|
| `jade-region-drag` | Marks the element **and all its descendants** as a drag region |
| `jade-region-no-drag` | Excludes the element (and its descendants) within a drag region, used for clickable elements such as buttons and input fields |

The attributes are boolean attributes: they take effect once present, and their values are ignored (`jade-region-drag` is equivalent to `jade-region-drag="true"`).

### Behavior

- **Single-click drag**: Hold down the left button in the drag region and drag → moves the window; dragging to a screen edge supports system snapping (Aero Snap); dragging while the window is maximized automatically restores it.
- **Double-click**: Double-click in the drag region → maximize / restore (toggle).
- Responds only to the **left mouse button**; right and middle buttons do not trigger it.
- The drag region prevents the default text selection behavior; `jade-region-no-drag` areas are not affected and can be selected / clicked / focused normally.

### Nesting Rules

When determining behavior, the search goes upward from the clicked element to find the nearest ancestor with one of these attributes, and **the nearest one wins**:

- If the nearest is `jade-region-no-drag` → no drag (even if there is a `jade-region-drag` on an outer element).
- If the nearest is `jade-region-drag` → drag.
- If there is none → no drag.

### HTML Example

```html
<!-- The entire title bar is draggable -->
<div class="titlebar" jade-region-drag>
  <span class="title">My App</span>

  <!-- The buttons in the title bar must be clickable, so carve them out -->
  <div class="actions" jade-region-no-drag>
    <button onclick="...">Settings</button>
    <button onclick="...">About</button>
  </div>
</div>
```

```css
.titlebar {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

### Comparison with `-webkit-app-region`

| | `-webkit-app-region: drag` | `jade-region-drag` |
|---|---|---|
| Drag window | ✅ | ✅ |
| Double-click to maximize | ✅ | ✅ |
| Right-click system title bar menu | **Pops up** | **Does not pop up** |
| Exclude child elements | `-webkit-app-region: no-drag` | `jade-region-no-drag` |
| Scope | CSS style (with inheritance semantics) | HTML attribute (container + descendants) |

The two approaches can coexist on the same page without interfering with each other; choose whichever you need. For scenarios that require "no right-click system menu", use `jade-region-drag`.

---

## Working with the 2.0 Window Creation API

- Whether to have a system title bar and whether to have a border is determined by **`WebViewWindowOptions.frame_style`** (`normal` / `no-titlebar` / `borderless` / `title-overlay`); do not fill in the removed legacy fields.
- When you need a **fully frameless WebView shell**, use **`create_borderless_webview_window`**, see [Window API](/en-US/docs/api/window-api).

---

## Built-in Title Bar Button Overlay (`title-overlay`)

**Purpose**: A Windows-exclusive style that provides a **bordered + no-title-bar + built-in title bar buttons in the top-right corner** effect, without having to implement window control button functionality yourself. Each button is 45 pixels wide and 32 pixels high by default.

### Features

- The window has a border but no system title bar
- Minimize, maximize, and close buttons are automatically drawn in the top-right corner
- Uses Windows 10/11-style Segoe MDL2 Assets icons
- Button backgrounds are transparent and show a background color on hover
- The close button shows a red background + white icon on hover
- Completely no frontend implementation of button interaction logic is required

### Usage

Set `frame_style` to `title-overlay` when creating the window:

```c
WebViewWindowOptions options = {0};
options.title = "My App";
options.width = 800;
options.height = 600;
options.frame_style = "title-overlay";
// ... other options
```

Or switch dynamically at runtime:

```c
set_window_frame_style(window_id, "title-overlay");
```

### Custom Styling

You can customize the button appearance via `set_titlebar_overlay_style`:

```c
// Customize button height and colors
set_titlebar_overlay_style(
    window_id,
    32,          // Button height (pixels)
    "#FFFFFF",   // Icon color (white)
    "#333333"    // Hover background color (dark gray)
);
```

:::info
The `title-overlay` style is only supported on the Windows platform. On other platforms it falls back to the `no-titlebar` style.
:::

---

## Context Menu Control (`jade-allow-contextmenu`)

**Purpose**: Controls per-element whether the context menu is allowed to pop up. When `WebViewSettings.disable_right_click` globally disables right-clicking, this attribute can individually allow it for specific elements.

### Basic Usage

```html
<!-- Allow the context menu to pop up -->
<button jade-allow-contextmenu>Right-click me</button>

<!-- Disallow the context menu (default behavior) -->
<button>Right-clicking me does nothing</button>
```

### Notes

- **Priority**: When the element also has the `disabled` attribute set, `jade-allow-contextmenu` does not take effect
- **Global setting**: When `disable_right_click=0` in `WebViewSettings` (not globally disabled), this attribute is ignored and the context menu can pop up anywhere on the page
- **Default behavior**: Elements without this attribute do not allow the context menu to pop up by default

### Dynamic Control

```javascript
const el = document.getElementById('my-element');
el.setAttribute('jade-allow-contextmenu', '');     // Allow
el.removeAttribute('jade-allow-contextmenu');      // Disallow
```

---

## Troubleshooting

### Drag Region Not Working

- Make sure the attribute name is correct: `-webkit-app-region` or `app-region`
- Check that the button areas have `no-drag` set correctly to avoid nested overrides

### Context Menu Not Popping Up

- Check whether the element has the `disabled` attribute set
- Confirm that `WebViewSettings.disable_right_click` is `1` (right-clicking globally disabled), otherwise `jade-allow-contextmenu` is meaningless
- Make sure the `jade-allow-contextmenu` attribute has been correctly added to the target element
