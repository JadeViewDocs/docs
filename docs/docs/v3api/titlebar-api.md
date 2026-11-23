---
title: 标题栏
order: 1
group:
  title: 窗口
  order: 1
---

# 标题栏

## 修改标题栏样式（`set_window_frame`）

```c
int32_t set_window_frame(uint32_t window_id, const char* title_bar_style);
```

`window_id` 是目标窗口 ID。 `title_bar_style` 可传 `"default"`、`"hidden"` 或 `"BarOverlay"`，传 `NULL` 使用 `"default"`。返回 `1` 表示请求已受理，`0` 表示失败。窗口边框通过[创建窗口配置](/docs/v3api/window-api)的 `noframe` 设置。

此接口的参数发生变更，使用新版头文件重新编译宿主，动态绑定也需要同步更新。

## 设置标题栏组件（`set_titlebar_components`）

```c
int32_t set_titlebar_components(uint32_t window_id, int32_t back,
    int32_t refresh, int32_t icon, int32_t minimize, int32_t maximize);

// 允许返回、显示刷新和窗口图标；允许最小化、最大化。
set_titlebar_components(window_id, 1, 1, 1, 1, 1);
```

Windows 专用。五个开关均为 `0/1`，每次调用设置全部五项：

| 参数 | 含义 |
| --- | --- |
| `back` | 是否允许返回按钮；有可回退历史时自动显示，否则隐藏 |
| `refresh` | 是否显示默认标题栏或 `BarOverlay` 的刷新按钮 |
| `icon` | 是否显示默认标题栏的窗口图标，不影响任务栏图标；`BarOverlay` 不绘制图标，只保存设置供切回默认标题栏使用 |
| `minimize` | 是否允许最小化，与创建期 `minimizable` 一致 |
| `maximize` | 是否允许最大化，与创建期 `maximizable` 一致 |

- `back=0` 始终隐藏返回按钮，`back=1` 仅在有可回退历史时显示；刷新按钮在页面加载期间禁用，点击重新加载当前页。
- 标题文字不受此接口控制；最小化、最大化开关不改变关闭按钮。
- 左侧按钮在 `title_bar_style=default` 和 `BarOverlay` 下显示。`BarOverlay` 只占按钮实际区域，不预留页面顶部高度，自定义标题内容需自行避让。
- 创建期的 `titlebar_back` / `titlebar_refresh` / `titlebar_icon` 默认均为 `1`，运行期调用会更新这组设置；切换标题栏样式后设置保留。
- 配色由 `set_titlebar_style` 控制。

**返回值**：`1` 已受理，`0` 拒绝；可用 `jade_last_error_code/message` 查原因。非 Windows 返回平台错误，非 `0/1` 参数返回参数错误。应在窗口创建就绪后调用。

```python
window.set_titlebar_components(back=True, refresh=True, icon=True, minimize=True, maximize=True)
```

## 设置标题栏样式（`set_titlebar_style`）

Windows 专用，统一设置默认标题栏和 `BarOverlay` 的高度与按钮配色。

```c
int32_t set_titlebar_style(uint32_t window_id, int32_t height,
    const char* background_color, const char* foreground_color,
    const char* button_background_color,
    const char* button_hover_background_color, const char* button_hover_foreground_color);
```

| 参数 | 含义 |
| --- | --- |
| `window_id` | 目标 Window ID，不是 WebView ID |
| `height` | `-1` 保持；`0` 恢复默认；自定义高度为 20–100 逻辑像素，超出范围会被拒绝 |
| `background_color` | 标题栏背景色，仅默认标题栏使用 |
| `foreground_color` | 标题文字与按钮常态图标共用的前景色，默认跟随主题。窗口失焦时，标题文字与未悬浮按钮使用淡化前景色 |
| `button_background_color` | 所有按钮的常态背景色，默认透明 |
| `button_hover_background_color` | 除关闭按钮外的悬浮背景色 |
| `button_hover_foreground_color` | 除关闭按钮外的悬浮图标色 |

颜色支持 `#RRGGBB`、`#RRGGBBAA`、`rgb(r,g,b)` 和 `rgba(r,g,b,a)`，其中 `a` 为 `0–1`。每次调用更新全部颜色。传 `NULL` 或空串 `""` 会清除该项自定义颜色，恢复当前窗口主题下的默认样式。默认标题栏和 `BarOverlay` 都适用。非法颜色使整次调用被拒绝。关闭按钮始终保留红色悬浮背景和白色图标。

`BarOverlay` 不绘制标题栏背景或标题文字，但保留设置供切回默认标题栏使用。样式在切换窗口帧后保留，窗口销毁时清理。

覆盖层属于 Window，空窗口也可使用；页面导航、缩放或默认 WebView 销毁不影响按钮。全屏时按钮隐藏，退出后恢复。宿主 EXE 需声明 Windows 8 或更新版本的兼容清单。

返回 `1` 表示已受理，`0` 表示拒绝，可通过 `jade_last_error_code/message` 查询原因。非 Windows 返回平台错误。

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

Python 传 `None`、空串 `""` 或省略颜色参数，都会恢复该项默认样式。

---
