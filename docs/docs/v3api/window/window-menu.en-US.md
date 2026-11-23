---
title: Window Menu Bar
order: 1.2
group:
  title: Windows
  order: 1
---

# Window Menu Bar

The window menu bar sits directly below the title bar and is part of the window client area: it takes up height at the top of the page, and page content starts below its bottom edge. JadeView draws it natively, not as page DOM, so page styles and scrolling do not affect it.

For field meanings and icon rules, see [Menu API](/en-US/docs/v3api/menu/menu-api#menu-items); for page context menus, see [Page Context Menu](/en-US/docs/v3api/menu/context-menu-api).

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

- Top-level entries must be submenus (`kind = 1`); any other type rejects the whole call.
- `item_count = 0` hides the menu bar; `NULL, 0` works as well.
- The menu bar height follows its content and scales with the system DPI. It needs no manual height and does not consume title bar height.
- The menu bar hides automatically in full screen and comes back on exit.
- Windows without window decorations never attach the application menu automatically: that includes `title_bar_style` set to `BarOverlay` or `hidden`, and `noframe = 1`. To give such a window a menu bar, call `jade_window_set_menu` for that window.

## Example

```c
JadeMenuItemDesc bar[] = {
    { "file",      NULL,   "File", NULL,    1, 0, { 0 } },
    { "file-new",  "file", "New", "Ctrl+N", 0, 0, { 0 } },
    { "file-open", "file", "Open", "Ctrl+O", 0, 0, { 0 } },
    { "file-quit", "file", "Exit", NULL,    0, 0, { 0 } },
    { "view",      NULL,   "View", NULL,    1, 0, { 0 } },
    { "view-full", "view", "Full Screen", "F11", 0, 0, { 0 } },
};

if (!jade_set_application_menu(bar, 6)) {
    const char* message = jade_last_error_message(); /* e.g. a top-level entry is not a submenu */
}
```

Replace the menu for a single window only:

```c
jade_window_set_menu(window_id, bar, 6);
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
