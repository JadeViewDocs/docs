---
title: Taskbar Effects
order: 8
group:
  title: Windows
  order: 1
---

# Taskbar Effects

## Taskbar Effects

### Set the Taskbar Progress Bar (`set_window_progress`)

Displays a progress bar on the taskbar button (e.g. download progress, install progress, etc.).

```c
int32_t set_window_progress(uint32_t window_id, int32_t progress, int32_t state);
```

- **Parameters**:
  - `window_id` `uint32_t`
  - `progress` `int` - Progress value (0–100)
  - `state` `int` - State: `0`=no progress, `1`=normal, `2`=paused (yellow), `3`=error (red), `4`=indeterminate
- **Return value**: `1` = success, `0` = failure

:::warning
Windows platform only.
:::

***

### Flash the Taskbar Icon (`flash_window`)

Flashes the taskbar icon to attract the user's attention (e.g. when a message arrives).

```c
int32_t flash_window(uint32_t window_id, uint32_t count);
```

- **Parameters**: `window_id` `uint32_t`; `count` `uint32_t` - Number of flashes, `0` = stop flashing
- **Return value**: `1` = success, `0` = failure

:::warning
Windows platform only.
:::

***
