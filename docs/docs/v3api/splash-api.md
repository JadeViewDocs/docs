---
title: 启动画面
order: 4
group:
  title: 原生 UI
  order: 4
---

# 启动画面

JadeView 在首个普通窗口标题栏下方的内容区显示启动覆盖层，覆盖内容区和菜单栏，但不覆盖标题栏。覆盖层只包含应用 LOGO 和加载动画，不显示标题或状态文本。它不是独立窗口：随窗口出现、被窗口裁剪，也不会出现在任务栏或 Alt+Tab 中。

窗口是否有标题栏、边框，完全由创建该窗口时的选项（`noframe`、`title_bar_style`、`transparent` 等）决定。启动画面只覆盖标题栏下方的内容区，不会修改窗口样式；标题栏保持可见和可操作。

## 效果

![启动画面](/splash-preview.png)

## 配置（`jade_splash_configure`）

```c
typedef struct JadeSplashOptions {
    uint32_t struct_size;
    uint32_t abi_version;
    uint32_t flags;            /* 第 0 位禁用 Splash */
    const char* logo_path;
    const uint8_t* logo_data;
    size_t logo_data_size;
    uint32_t background_color; /* 0xAARRGGBB */
    uint32_t accent_color;     /* 0xAARRGGBB */
    uint32_t minimum_ms;
} JadeSplashOptions;

int32_t jade_splash_configure(const JadeSplashOptions* options);
```

必须在 `JadeView_init` 之前调用。传 `NULL` 清除配置并关闭启动画面；`struct_size` 必须等于 `sizeof(JadeSplashOptions)`。

| 字段 | 说明 |
|---|---|
| `flags` | 第 0 位为 `1` 时不显示启动画面。 |
| `logo_data` / `logo_data_size` | LOGO 的 PNG/ICO 二进制数据，优先于 `logo_path`。 |
| `logo_path` | PNG/ICO 文件路径；已挂载的 JAPK 路径如 `app/logo.png` 可直接使用。 |
| `background_color` | 覆盖层背景色，`0` 使用默认深色。 |
| `accent_color` | 加载动画颜色，`0` 在深色背景上使用默认白色。 |
| `minimum_ms` | 最短显示时间；页面已加载也不会早于该时间移除。 |

## 示例

```c
JadeSplashOptions splash = { 0 };
splash.struct_size = sizeof splash;
splash.abi_version = JADE_ABI_VERSION;
splash.logo_path = "app/logo.png"; /* 已挂载的 JAPK 路径 */
splash.background_color = 0xFF0E0D14;
splash.accent_color = 0xFFFFFFFF;
splash.minimum_ms = 600;
if (!jade_splash_configure(&splash)) return 1;

if (!JadeView_init(0, NULL, data_dir, app_name, app_sig, 0)) return 1;
```

如果启动画面出现在 JAPK 挂载之前，`app/logo.png` 还不存在，可使用 `logo_data` 直接传 LOGO 字节；菜单项的 `icon_path` 在页面加载后同样可以直接使用 `app/...` 路径。

## 生命周期

- 配置在 `JadeView_init` 之前保存。
- 首个普通窗口创建后，覆盖层附着到标题栏下方的内容区，覆盖菜单栏和页面区域；该窗口的默认 WebView 暂时隐藏并在后台加载。
- 首个 `webview-did-finish-load` 到达后请求关闭；未达到 `minimum_ms` 时继续显示。
- 达到关闭条件后，覆盖层整体淡出再移除，随后显示默认 WebView，窗口菜单栏和原有内容恢复。
- 启动层显示期间隐藏标题栏左侧的返回/刷新按钮；覆盖层关闭后按窗口的 `set_titlebar_components` 设置恢复。
- 覆盖层不拦截鼠标命中测试，窗口仍可正常操作。
- 窗口关闭或进程退出时，覆盖层随窗口销毁。

当前覆盖层渲染接入 Windows；Linux 复用相同配置和绘制逻辑，待后续接入 GTK/GLArea。
