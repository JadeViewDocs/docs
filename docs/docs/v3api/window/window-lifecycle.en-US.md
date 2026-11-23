---
title: Close and Count Windows
order: 9
group:
  title: Windows
  order: 1
---

# Close and Count Windows

## Closing and Counting

### Close the Window

Initiates closing; if the page registered a `beforeunload` handler and the user chooses to stay, closing may be deferred or canceled, depending on the WebView and the page script.

```c
int32_t close_window(uint32_t window_id);
```

**Parameters:**

- `window_id` `uint32_t` - Target window id

#### Close Flow

All close methods — `window.close()`, the title-bar close button and Alt+F4 — share one flow:

1. Dispatch `window-closing` first (the host can intercept it; return a non-null pointer from the callback to block closing — see [Event Types](/en-US/docs/v3api/messaging/event-types));
2. Close the window and dispatch `window-closed`;
3. When the last window closes, dispatch `window-all-closed`.

:::info{title=Notes}
- The title-bar close button can be intercepted by the `window-closing` callback, like `window.close()` and Alt+F4.
- `close_window()` uses "programmatic close" semantics and **bypasses `window-closing`**, closing the window directly.
:::

**Close source and page URL:** the `event_data` of the `window-closing` callback now distinguishes the source — `{"source":"system"}` means user-initiated (Alt+F4, system close button, title-bar close button); `{"source":"frontend","url":"<page's current URL>"}` means initiated by the frontend `window.close()`. The page URL is read directly from the WebView's current address by JadeView, not taken from a value the page reports.

**Fallback:** if a window is destroyed for any reason without going through the normal close flow, `window-closed` (and `window-all-closed` when all windows are closed) is still emitted afterward and the window state is cleaned up, so the host will not miss the close notification.

***

### Get the Window Count

Queries how many windows are still open in the current JadeView.

```c
uint32_t get_window_count(void);
```

Maximized or fixed-size windows retain the title-bar buttons.
