---
title: 标题栏
order: 1
group:
  title: 窗口
  order: 1
---

# 标题栏

标题栏显示窗口标题、图标和窗口按钮，也提供拖动窗口的区域。JadeView 支持使用默认标题栏、将网页内容延伸到标题栏区域，以及隐藏标题栏后由页面提供窗口操作。
![JadeView 标题栏示例](/screenshot/titlebar-overview.jpg)


## 选择标题栏样式

创建窗口时，通过 [`WebViewWindowOptions.title_bar_style`](/docs/v3api/window/window-api#窗口配置webviewwindowoptions) 选择标题栏样式。

| 样式 | 适用场景 |
| --- | --- |
| `default` | 使用默认标题栏，显示窗口标题和原生窗口按钮。 |
| `BarOverlay` | 页面延伸至窗口顶部，由页面绘制标题栏内容，JadeView 提供覆盖在页面上的窗口按钮。 |
| `hidden` | 隐藏标题栏，由页面提供拖动区域和窗口操作。 |

窗口边框通过建窗选项 [`noframe`](/docs/v3api/window/window-api#窗口配置webviewwindowoptions) 设置。无边框窗口的页面自行提供拖动区和窗口按钮。[查看窗口创建配置](/docs/v3api/window/window-api#窗口配置webviewwindowoptions)

## 标题栏结构

默认标题栏由导航按钮、窗口标识、标题和窗口按钮组成。导航按钮和图标的显示由配置控制。

![标题栏区域与按钮](/screenshot/titlebar-anatomy.png)

从左到右，各区域的作用如下：

1. **返回按钮**：返回当前 WebView 的上一页。启用后，仅在有可回退历史时显示。通过 [`titlebar_back`](/docs/v3api/window/window-api#窗口配置webviewwindowoptions) 或 [`set_titlebar_components`](#设置标题栏组件set_titlebar_components) 设置。
2. **刷新按钮**：重新加载当前页面。通过 [`titlebar_refresh`](/docs/v3api/window/window-api#窗口配置webviewwindowoptions) 或 [`set_titlebar_components`](#设置标题栏组件set_titlebar_components) 设置。
3. **窗口图标**：显示窗口图标，可通过 [`titlebar_icon`](/docs/v3api/window/window-api#窗口配置webviewwindowoptions) 或 [`set_titlebar_components`](#设置标题栏组件set_titlebar_components) 显示或隐藏。覆盖层标题栏不绘制窗口图标。
4. **标题**：显示窗口标题。创建窗口时可通过 [`title`](/docs/v3api/window/window-api#窗口配置webviewwindowoptions) 设置，运行时可用 [`set_window_title`](/docs/v3api/window/window-geometry#设置窗口标题) 修改。
5. **拖动区域**：默认标题栏中的空白区域可用于移动窗口。使用覆盖层时，可在页面中标记[拖动区](#设置拖动和交互区域)。
6. **窗口按钮**：位于右侧，包括最小化、最大化或还原以及关闭。可通过 [`set_titlebar_components`](#设置标题栏组件set_titlebar_components) 设置最小化和最大化功能。尺寸见下方[按钮尺寸](#按钮尺寸)。

在 `BarOverlay` 模式下，页面负责绘制标题和自定义内容，左右两侧的覆盖层按钮仍由 JadeView 提供。页面需要为按钮留出空间，并设置可拖动和可交互区域。

标题栏下方还可以显示窗口菜单栏，见[窗口菜单栏](/docs/v3api/window/window-menu)。`BarOverlay` 和 `hidden` 的窗口没有窗口装饰，不会自动挂载应用菜单。

## 按钮尺寸

下列尺寸均为逻辑像素（DIP），随系统缩放等比放大。`H` 表示当前标题栏高度：默认 32，可用 [`set_titlebar_style`](#设置标题栏样式set_titlebar_style) 的 `height` 改为 20–100。

| 元素 | 尺寸 | 说明 |
| --- | --- | --- |
| 覆盖层窗口按钮（`BarOverlay`） | 每个 `46 × H`，三个合计 `138 × H` | 按钮组贴在窗口右上角。页面右上角需留出 `138 × H` 的避让区，否则内容会被按钮盖住。 |
| 默认标题栏窗口按钮 | 每个 `46 × H`，三个合计 `138 × H` | 由系统绘制，宽度与覆盖层一致；[`set_titlebar_style`](#设置标题栏样式set_titlebar_style) 只改高度与配色。关闭按钮始终保留系统红色悬浮态。 |
| 返回 / 刷新按钮 | `min(H, 42) × H`；默认高度下为 `32 × 32` | 每个可见按钮单独占一格，隐藏的按钮不占位。 |
| 窗口图标 | 系统小图标尺寸（100% 缩放为 `16 × 16`），右侧再留 8 DIP 间距 | `BarOverlay` 不绘制图标，`icon=0` 时也不占位。 |

覆盖层按钮的命中区域就是上表的矩形本身：`138 × H` 内全部可点击，不会把点击传给页面；区域之外的页面内容照常接收事件。左侧导航按钮在 `BarOverlay` 下同样占据顶部 `min(H, 42) × H` 的条带，页面左侧也要相应避让。

## 创建覆盖层标题栏

覆盖层（`BarOverlay`）让页面直接顶到窗口最上方：JadeView 不绘制标题栏背景、标题文字和窗口图标，只在页面右上角画出三个原生窗口按钮（最小化、最大化或还原、关闭）。标题栏的其余部分全部由网页绘制，看起来就是页面自己的头部。

![页面内容延伸到窗口顶部，右侧三个窗口按钮由 JadeView 覆盖绘制](/screenshot/titlebar-overlay.png)

上图是 JadeView Playground。顶部这一条完全是网页内容：左侧的图标和标题、中间的搜索框都由页面排版；最右侧的三个按钮由 JadeView 画在页面之上，红框标注的 `138 × 48` 就是按钮组占据的区域，对应窗口高度 48 DIP。

覆盖层适合这些场景：自绘标题栏的应用、希望标题栏与页面背景连成一片（渐变、Mica 或 Acrylic 一直铺到窗口顶部）、需要在标题栏里放搜索框、标签页或面包屑的应用。如果连窗口按钮也想自己绘制，改用 `hidden` 样式。

### 覆盖层提供什么

| 项目 | 说明 |
| --- | --- |
| 窗口按钮 | 固定在客户区右上角。每个宽 `46 DIP`，三个共 `138 DIP`，高度等于标题栏高度 `H`。带原生悬浮和按下反馈，关闭按钮保留系统红色悬浮态，最大化按钮的命中结果保留 Windows 11 贴靠布局（Snap Layouts）浮层。 |
| 返回 / 刷新 | 启用后同样以原生方式绘制在左上角，每个占 `min(H, 42) × H`；返回按钮只在有可回退历史时出现，隐藏的按钮不占位。 |
| 高度与配色 | 由 [`set_titlebar_style`](#设置标题栏样式set_titlebar_style) 设置，默认跟随窗口明暗主题。 |
| 不绘制 | 标题栏背景、标题文字、窗口图标和整条拖动带都不画，这些交给页面。 |
| 全屏 | 进入全屏时按钮自动隐藏，退出后恢复。 |

覆盖层按钮画在页面之上，页面的 `z-index` 既盖不住也挤不开它们；按钮矩形内的点击由 JadeView 处理，不会穿透给页面，矩形之外的事件照常交给页面。

### 创建步骤

1. 在应用收到 `app-ready` 之后，用 `window_options_default` 初始化窗口选项，把 `title_bar_style` 设为 `"BarOverlay"`。
2. 按需设置 [`noframe`](/docs/v3api/window/window-api#窗口配置webviewwindowoptions)：`BarOverlay` 本身已经去掉系统标题栏；不加 `noframe` 时保留系统那圈可拖拽的窗口边框，页面在左、右、底三边内缩一个边框宽度（顶部仍贴边）；`noframe = 1` 则让页面四边都贴到窗口外框，适合自绘边框、圆角和阴影。
3. 调用 `create_webview_window` 创建窗口。
4. 创建返回后调用 [`set_titlebar_style`](#设置标题栏样式set_titlebar_style) 设置高度（`20–100`，默认 `32`）与按钮配色。

```c
WebViewWindowOptions options;
if (window_options_default(&options, sizeof options) != JADE_OK) return;

options.title = "My App";
options.title_bar_style = "BarOverlay";
// 页面四边需要完全贴到窗口外框时打开（自绘边框、圆角、阴影）：
// options.noframe = 1;

uint32_t window_id = create_webview_window(url, 0, &options, NULL, NULL);
if (window_id == 0) return;

// 只调高度：48 DIP；颜色传 NULL 表示沿用当前主题
set_titlebar_style(window_id, 48, NULL, NULL, NULL, NULL, NULL);
```

按钮浮在页面之上，页面配色和窗口主题不一致时（例如浅色页面配深色主题），用 `foreground_color` 指定能看清的图标颜色，用 `button_hover_background_color` 指定悬浮底色。

### 页面需要配合的三件事

1. **右侧避让 `138 × H`**：按钮组宽度固定为 `138 DIP`，高度等于标题栏高度，不会随页面内容移动。标题栏右侧要么留白，要么放不介意被覆盖的装饰。
2. **左侧避让导航按钮**：启用返回或刷新后，每个按钮占 `min(H, 42) × H`；两个都启用时左侧条带宽度为 `2 × min(H, 42)`，高度 48 时为 `84`。
3. **标记拖动区和交互区**：标题栏空白处加 `jade-region-drag`，搜索框、图标按钮等加 `jade-region-no-drag`，否则顶部无法拖动窗口，双击也不会最大化。完整行为见[窗口交互控制](/docs/v3api/frontend/window-styling)。

```html
<header class="titlebar" jade-region-drag>
  <img class="logo" src="/logo.png" alt="" />
  <span class="app-name">My App</span>
  <input class="search" jade-region-no-drag placeholder="搜索" aria-label="搜索" />
  <!-- 给覆盖层按钮留出的空白，也可以什么都不放 -->
  <div class="caption-space" aria-hidden="true"></div>
</header>
```

```css
.titlebar {
  height: 48px;          /* 与 set_titlebar_style 的 height 保持一致 */
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 84px;    /* 返回 + 刷新：2 × min(48, 42) */
}
.caption-space {
  width: 138px;          /* 三个窗口按钮 */
  flex: none;
}
```

尺寸直接用 CSS 像素写：WebView2 未缩放时 1 CSS 像素等于 1 DIP，系统 DPI 变化由浏览器换算；页面自身设置过缩放时要按比例调整。

:::warning{title="改高度要同步页面"}
按钮组宽度固定 `138 DIP`，不随高度变化；调大 `height` 只会让按钮变高。页面头部高度和左侧避让宽度要跟着改，否则内容会被压低或留出多余空隙。
:::

## 设置拖动和交互区域

覆盖层或隐藏标题栏使用页面内容时，可用 `jade-region-drag` 标记拖动区，用 `jade-region-no-drag` 排除按钮、输入框等交互元素。

```html
<header jade-region-drag>
  <span>My App</span>
  <input jade-region-no-drag aria-label="搜索" placeholder="搜索" />
</header>
```

窗口按钮与页面内容需要分别预留空间。拖动区的完整行为及示例见[窗口交互控制](/docs/v3api/frontend/window-styling)。

## 自定义组件和颜色

窗口就绪后，可以使用 [`set_titlebar_components`](#设置标题栏组件set_titlebar_components) 调整组件，用 [`set_titlebar_style`](#设置标题栏样式set_titlebar_style) 设置高度与配色。可用字段和平台限制见下方接口说明。

## 修改标题栏样式（`set_window_frame`）

```c
int32_t set_window_frame(uint32_t window_id, const char* title_bar_style);
```

`window_id` 是目标窗口 ID。 `title_bar_style` 可传 `"default"`、`"hidden"` 或 `"BarOverlay"`，传 `NULL` 使用 `"default"`。返回 `1` 表示请求已受理，`0` 表示失败。窗口边框通过[创建窗口配置](/docs/v3api/window/window-api)的 `noframe` 设置。

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
