---
order: 0
group:
  title: "API Reference"
  order: 1
---

# Constants

The JadeView E-Language SDK defines a number of constants to simplify coding and improve code readability. Below are all the publicly available constants:

## Theme Constants

The JadeView E-Language SDK provides three theme constants for setting the theme of the WebView window.

### 主题_亮色

**Constant**: `#主题_亮色`

**Value**: `"Light"`

**Description**: Sets the WebView window to use the light theme.

**Use cases**:
- When you need to always use the light theme
- When the application uses the light theme by default

**Example code**:

```e
.局部变量 窗口设置, JadeView窗口设置
窗口设置.窗口主题 ＝ #主题_亮色
```

### 主题_暗色

**Constant**: `#主题_暗色`

**Value**: `"Dark"`

**Description**: Sets the WebView window to use the dark theme.

**Use cases**:
- When you need to always use the dark theme
- When the application uses the dark theme by default

**Example code**:

```e
.局部变量 窗口设置, JadeView窗口设置
窗口设置.窗口主题 ＝ #主题_暗色
```

### 主题_自动

**Constant**: `#主题_自动`

**Value**: `"System"`

**Description**: Sets the WebView window to automatically switch between the light and dark themes following the system theme.

**Use cases**:
- When you want the application to follow the system theme
- When you need to provide a better user experience

**Example code**:

```e
.局部变量 窗口设置, JadeView窗口设置
窗口设置.窗口主题 ＝ #主题_自动
```

## Usage Recommendations

- Prefer using the theme constants rather than string literals directly, as this improves the readability and maintainability of your code
- When setting the window theme, consider the user's system preference; it is recommended to use `#主题_自动` by default
- You can dynamically switch the theme based on the user's settings, for example by providing a theme switching option

## Notes

- The values of the theme constants are of string type; using string literals directly achieves the same effect, but this is not recommended
- Switching the theme may trigger a re-render of the WebView, which may cause a brief flicker
- Some systems or browser versions may not support automatic theme switching, in which case it falls back to the default theme

## Related APIs

- `set_window_theme` - Dynamically sets the window theme
- `get_window_theme` - Gets the current window theme

## Summary

The theme constants provided by the JadeView E-Language SDK simplify the code for setting themes and improve code readability and maintainability. It is recommended to prefer these constants over string literals directly during development.
