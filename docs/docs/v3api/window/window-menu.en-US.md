---
title: Window Menu Bar
order: 1.2
group:
  title: Windows
  order: 1
---

# Window Menu Bar

The window menu bar sits directly below the title bar and is part of the window client area: it takes up height at the top of the page, and page content starts below its bottom edge. JadeView draws it natively, not as page DOM, so page styles and scrolling do not affect it.

![JadeView Window Menu Bar overview and callouts](/screenshot/menubar-overview-annotated.en.png)

From the numbered callouts above:

1. **Window title bar**: Keeps native navigation and caption buttons; the menu bar does not consume title bar height.
2. **Window menu bar (28 DIP)**: Fixed below the title bar; its height scales automatically with the system DPI.
3. **Dropdown menu flyout**: Opens on click or hover switch with 10pt continuous-curve corners, a 1px anti-aliased border, and Acrylic backdrop.
4. **Web content area**: Page layout starts directly beneath the menu bar bottom edge without overlap.

For field meanings and icon rules, see [Menu API](/en-US/docs/v3api/menu/menu-api#item-structure-jademenuitemdesc); for page context menus, see [Page Context Menu](/en-US/docs/v3api/menu/context-menu-api).

## Scope

| Setting | Applies to |
| --- | --- |
| `jade_window_set_menu` | One window; takes precedence. |
| `jade_set_application_menu` | Every normal window without its own menu; windows created later inherit it too. |
| Neither call | Normal windows show the built-in default menu (Edit / View / Window / Help). |

```c
int32_t jade_set_application_menu(const JadeMenuItemDesc* items, uint32_t item_count);
int32_t jade_window_set_menu(uint32_t window_id, const JadeMenuItemDesc* items,
                             uint32_t item_count);
```

Both return `1` when the request is queued and `0` when it is rejected; query `jade_last_error_code()` / `jade_last_error_message()` for the reason.

## Rules and limits

- **Top-level entries must be submenus (`kind = 1`)**: Any other type rejects the whole call.
- **Hide the menu bar**: Pass `item_count = 0` (or `NULL, 0`).
- **Fullscreen handling**: The menu bar hides automatically in full screen and comes back on exit.
- **Frameless windows**: Windows without decorations (`title_bar_style` set to `BarOverlay` or `hidden`, or `noframe = 1`) never inherit the application menu automatically; call `jade_window_set_menu` on that window if it needs a menu bar.

:::tip{title="DPI and layout integration"}
The 28 DIP bar height and font atlas rebuild automatically on system DPI changes or cross-monitor moves without manual host adjustments.
:::

## Example

![Custom window menu bar with icon and checkbox item](/screenshot/menubar-custom-annotated.en.png)

The example below attaches a custom menu bar with a glyph icon and a checked checkbox item to a window:

```c
JadeMenuItemDesc bar[] = {
    { "sample", NULL, "Sample", NULL, 1, 0, { 0 } },                 /* top-level kind=1 */
    { "sample.emit", "sample", "Emit Event", NULL, 0, 0,
      { NULL, NULL, 0, 0xE714 } },                                   /* glyph icon */
    { "sample.checked", "sample", "Checked Item", NULL, 3, 2, { 0 } }, /* kind=3 checkbox, flags=2 checked */
};

if (!jade_window_set_menu(window_id, bar, 3)) {
    const char* message = jade_last_error_message();
}
```

Apply the menu bar to all normal windows in the application:

```c
jade_set_application_menu(bar, 3);
```

Python:

```python
menu = Menu.build_from_template(runtime, [
    {
        "id": "sample",
        "label": "Sample",
        "submenu": [
            {"id": "sample.emit", "label": "Emit Event", "icon_codepoint": 0xE714},
            {"id": "sample.checked", "label": "Checked Item", "kind": "checkbox", "checked": True},
        ],
    }
])

window.set_menu(menu)
```

## Events

Selecting an item emits `menu-command` with `{"item_id":"..."}`; the source ID is the owning window. See [Event Types](/en-US/docs/v3api/messaging/event-types#menu-command) for registration and callbacks.

## Compared with popup menus

| Item | Window menu bar | Popup menu |
| --- | --- | --- |
| Entry point | `jade_set_application_menu` / `jade_window_set_menu` | `jade_menu_popup` |
| Position | Fixed below the title bar | Follows the cursor or given coordinates |
| Layout | Consumes height at the top of the page | Floats above the page, no layout impact |
| Lifetime | Stays until replaced or hidden | Closes on selection or dismissal |
