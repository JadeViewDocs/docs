---
title: 主题管理
order: 2
group:
  title: 窗口
  order: 1
---

# 主题管理

**用途**：控制窗口是**浅色 / 深色 / 跟随系统**，以及在 Windows 11 上是否使用 **Mica、亚克力**等系统背景效果；也可直接设**背景色字符串**。主题名都是 **字符串**（`Light` / `Dark` / `System`），不再使用旧头文件里的枚举类型名。

---

<h2 id="window-theme">窗口明暗主题</h2>

对应 API：**`set_window_theme`**、**`get_window_theme`**。**用途**：切换或查询当前窗口（及内嵌 WebView）的**明暗主题**。

```c
int32_t set_window_theme(uint32_t window_id, const char* theme);
int32_t get_window_theme(uint32_t window_id);
```

`theme`：`"Light"`、`"Dark"`、`"System"`。**`theme` 为 `NULL` 时不做任何处理、直接返回 `0`**。

**`get_window_theme` 返回值**：`1` = Dark，`0` = Light；`"System"` 按系统实际明暗解析为 `1` / `0`；无主题 / 未知一律返回 `0`。

:::info{title=平台支持}
Windows 与 Linux 均可用。`"System"`（跟随系统）在 Linux 下通过 **XDG 桌面门户** `org.freedesktop.appearance` 读取，回退 `gsettings`。
Windows 的**沉浸式暗色原生标题栏**在 Linux 无对应——Linux 标题栏为 HTML 自绘，明暗由你的页面 CSS 跟随主题即可。
:::

---

## 设置窗口背景材质（`set_window_backdrop`）

**用途**：在 **Windows 11** 上给窗口加上系统提供的**背景材质**（如云母、亚克力），和系统设置里「个性化」那类效果一致。`backdrop_type` 常用取值：**`mica`**、**`micaAlt`**、**`acrylic`**，以及 **`default`**（纯色底，不依赖 Win11 DWM 材质 API）。取值**大小写不敏感**（如 `Mica`、`MICA` 均可）。

`mica_keepActive`、`micaAlt_keepActive` 和 `acrylic_keepActive` 在失焦时继续显示相应的 Windows 原生材质。系统绘制的非客户区可能仍显示为激活外观，窗口焦点正常切换。以上模式无需安装 Windows App Runtime，系统透明效果和对比度设置仍然适用。

```c
int32_t set_window_backdrop(uint32_t window_id, const char* backdrop_type);
```

:::warning{title=平台差异}
系统材质需要 **Windows 11 22H2 或更新版本**。`default` 在 Windows 与 Linux 都可用。Linux 上也可用 `set_window_background_color` 设纯色。
:::

---

## 设置窗口背景色（`set_window_background_color`）

**用途**：用 **十六进制颜色**（如 `#RRGGBB`）填窗口背景，不依赖 Mica。

```c
int32_t set_window_background_color(uint32_t window_id, const char* background_color_hex);
```

---

## 创建窗口时顺带指定

在 **`WebViewWindowOptions.theme`** 里填初始主题，见 [核心 API](/docs/v3api/index#webview-window-options)。
