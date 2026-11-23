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

In addition to the CSS `-webkit-app-region: drag`, a dragging mechanism based on **HTML custom attributes**, used to drag the window and double-click to maximize in frameless / custom title bar windows.

Unlike `-webkit-app-region`: **right-click does not open the system window menu**, and right-click, hover and move events still reach the page. The drag region is an ordinary page area (client area); a window move starts only on **left-button press followed by movement**.


### Attributes

| Attribute | Effect |
|------|------|
| `jade-region-drag` | Marks the element **and all its descendants** as a drag region |
| `jade-region-no-drag` | Excludes the element (and its descendants) within a drag region, used for clickable elements such as buttons and input fields |

The attributes are boolean attributes: they take effect once present, and their values are ignored (`jade-region-drag` is equivalent to `jade-region-drag="true"`).

### Behavior

- **Single-click drag**: Hold down the left button and move in the drag region → moves the window; dragging to a screen edge supports system snapping (Aero Snap); dragging while the window is maximized automatically restores it.
- **Click without movement**: Press and release without moving → the page receives a normal `click`; the window does not move.
- **Double-click**: Double-click in the drag region → maximize / restore (toggle).
- **Page mouse events are preserved**: hover, right-click, `mousemove`, `mousedown` / `mouseup` / `click` still reach the page; right-click does not open the system title bar menu. Once a drag starts, the system move loop takes over and the page usually does not receive that drag's `mouseup` / `click`.
- Only the left button starts a drag; right and middle buttons do not, but their events still reach the page.

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

### Event: Drag End (`region-drag`)

Pressing in a drag region enters the system move loop, which captures the mouse — the page therefore **does not receive `mouseup` or `click`** for that drag. Subscribe to `region-drag` to react when the drag ends (for example, to save position or restore page state):

```c
jade_on("region-drag", on_region_drag);
// callback receives: window_id = id of the dragged window; event_data = {"action":"end"}
```

| Item | Description |
|------|-------------|
| `action` | Currently only `"end"`: dispatched when the system move loop ends (left button released) |
| Scope | Only drags started from a `jade-region-drag` region |
| Click in place | Press and release without moving → the page receives a click; no move loop, so `region-drag` is not dispatched |
| Not dispatched | Double-clicking the drag region (maximize/restore, no move loop) |
| Window geometry | Not included; use `get_window_bounds` |
| Platform | Windows (Linux to be verified) |

### Comparison with `-webkit-app-region`

| | `-webkit-app-region: drag` | `jade-region-drag` |
|---|---|---|
| Drag window | ✅ | ✅ (press left button and move) |
| Click without movement | Page receives it | Page receives it |
| Double-click to maximize | ✅ | ✅ |
| Hover / move / right-click page events | Handled by WebView2 / the system | Preserved for the page |
| Right-click system title bar menu | **Pops up** | **Does not pop up** |
| Exclude child elements | `-webkit-app-region: no-drag` | `jade-region-no-drag` |
| Scope | CSS style (with inheritance semantics) | HTML attribute (container + descendants) |

The two approaches can coexist on the same page without interfering with each other; choose whichever you need. For scenarios that require "no right-click system menu", use `jade-region-drag`.

---


## Context Menu Control (`jade-allow-contextmenu`)

**Purpose**: Controls per-element whether the context menu is allowed to pop up. When `WebViewSettings.allow_right_click` is set to `0` (right-clicking globally disabled), this attribute can individually allow it for specific elements.

### Basic Usage

```html
<!-- Allow the context menu to pop up -->
<button jade-allow-contextmenu>Right-click me</button>

<!-- Disallow the context menu (default behavior) -->
<button>Right-clicking me does nothing</button>
```

### Notes

- **Priority**: When the element also has the `disabled` attribute set, `jade-allow-contextmenu` does not take effect
- **Global setting**: When `allow_right_click=1` in `WebViewSettings` (not globally disabled, i.e. right-clicking allowed by default), this attribute is ignored and the context menu can pop up anywhere on the page
- **Default behavior**: Elements without this attribute do not allow the context menu to pop up by default
- **Scope**: This attribute only takes effect on the element actually hit by the right-click itself; it does not cover its child elements (unlike `jade-region-drag`'s "container + descendants" semantics)

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
- Confirm that `WebViewSettings.allow_right_click` is `0` (right-clicking globally disabled), otherwise `jade-allow-contextmenu` is meaningless
- Make sure the `jade-allow-contextmenu` attribute has been correctly added to the target element
