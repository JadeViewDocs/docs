---
title: Window Flags and Level
order: 5
group:
  title: Windows
  order: 1
---

# Window Flags and Level

## Window Flags & Level

For scenarios such as side docks, floating panels, desktop widgets, and launchers: keep the window out of the taskbar / Alt-Tab, avoid stealing focus while it stays resident, or push the window down to the desktop wallpaper layer.

### Skip the Taskbar / Alt-Tab (`set_window_skip_taskbar`)

Hides the window from the taskbar and the Alt-Tab switcher; commonly used for floating tool windows and widgets. You can also set it at creation time via `WebViewWindowOptions.skip_taskbar`.

```c
int32_t set_window_skip_taskbar(uint32_t window_id, int32_t skip);
```

- **Parameters**: `window_id`; `skip` (`1` = skip the taskbar / Alt-Tab, `0` = restore)
- **Return value**: `1` = success, `0` = failure

:::info{title="Platform Implementation"}
Windows: adds `WS_EX_TOOLWINDOW` and removes `WS_EX_APPWINDOW`; Linux: GTK `skip-taskbar-hint`.
:::

***

### Do Not Steal Focus (`set_window_no_activate`)

Keeps the window from gaining activation focus when clicked or shown, suitable for resident floating panels (clicking it won't interrupt your typing elsewhere). You can also set it at creation time via `WebViewWindowOptions.no_activate`.

```c
int32_t set_window_no_activate(uint32_t window_id, int32_t no_activate);
```

- **Parameters**: `window_id`; `no_activate` (`1` = do not steal focus, `0` = restore)
- **Return value**: `1` = success, `0` = failure


***

### Set the Window Level (`set_window_level`)

Sets which layer the window sits on in one call — more flexible than plain "always on top": you can push the window below all others, or even pin it to the desktop wallpaper layer as a widget.

```c
// level: "topmost" | "normal" | "bottom" | "desktop"
int32_t set_window_level(uint32_t window_id, const char* level);
```

- **Parameters**: `window_id`; `level` `string` - the level string; see the table below
- **Return value**: `1` = success, `0` = failure

| level     | Behavior                                                                                       | Implementation                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `topmost` | On top, above normal windows                                                                   | `set_always_on_top(true)` (cross-platform)                                                               |
| `normal`  | Normal layer; cancels topmost / bottom                                                         | Clears always-on-top / always-on-bottom                                                                  |
| `bottom`  | Below other windows                                                                            | `set_always_on_bottom(true)` (cross-platform)                                                            |
| `desktop` | Pinned to the desktop wallpaper layer (only visible after minimizing all windows; widget-like) | First `bottom`; on Windows parents to `Progman` / `WorkerW`, on Linux sets GTK `WindowTypeHint::Desktop` |

:::warning{title="Platform Differences"}
`topmost` / `normal` / `bottom` are stable cross-platform; `desktop` (wallpaper layer) is best-effort, depends on window manager behavior, and is recommended to be verified on a real machine. If parenting fails, it at least degrades to `bottom` (still below all windows).
:::

***
