---
title: 窗口交互控制
order: 2
group:
  title: 前端 API
  order: 2
---

# 窗口交互控制

## 窗口拖动区域（`app-region`）

**用途**：自己做**自定义标题栏**时，要告诉系统「这一块区域可以用鼠标拖动窗口」，而按钮区域不要拖动。用 CSS 的 **`app-region`** 或 **`-webkit-app-region`**（二者等价，选一种即可）。

**常用写法**：标题条设为 `drag`，上面的按钮设为 `no-drag`。

```css
.title-bar {
  -webkit-app-region: drag;
  app-region: drag;
}
.title-bar button {
  -webkit-app-region: no-drag;
  app-region: no-drag;
}
```

```html
<div class="title-bar" style="-webkit-app-region: drag; app-region: drag;">
  <h1>我的应用</h1>
  <div class="title-bar-buttons">
    <button type="button" style="-webkit-app-region: no-drag; app-region: no-drag;">关闭</button>
  </div>
</div>
```

---

## 自定义窗口拖动区（`jade-region-drag`）

:::warning
v2.3 开始支持。
:::

除了 CSS 的 `-webkit-app-region: drag`，2.3 新增一套基于 **HTML 自定义属性**的拖动方式，用于在无边框 / 自定义标题栏窗口中拖动窗口、双击最大化。

与 `-webkit-app-region` 最大的区别：**右键不会弹出系统标题栏菜单**（还原/移动/大小/最小化/最大化/关闭）。因为该方式下拖动区始终是普通页面区域（客户区），只有「左键按下」才会发起一次程序化的窗口移动；右键落在拖动区只是普通的页面右键，不经过系统标题栏。

:::info
无需任何 C FFI 或前端 JS 初始化，运行时已自动注入，HTML 加属性即可用。平台：Windows / Linux 均支持（Linux 行为建议真机验证）。
:::

### 属性

| 属性 | 作用 |
|------|------|
| `jade-region-drag` | 标记该元素**及其所有后代**为可拖动区 |
| `jade-region-no-drag` | 在可拖动区内排除该元素（及其后代），用于按钮、输入框等可点击元素 |

属性为布尔属性，写上即生效，值会被忽略（`jade-region-drag` 与 `jade-region-drag="true"` 等价）。

### 行为

- **单击拖动**：在拖动区按住左键拖动 → 移动窗口；拖到屏幕边缘支持系统贴边（Aero Snap）；窗口最大化时拖动会自动还原。
- **双击**：在拖动区双击 → 最大化 / 还原（切换）。
- 仅响应**鼠标左键**；右键、中键不触发。
- 拖动区内会阻止默认的文字选中行为；`jade-region-no-drag` 区域不受影响，可正常选中/点击/聚焦。

### 嵌套规则

判定时从被点元素向上找最近的带属性祖先，**谁更近谁说了算**：

- 最近的是 `jade-region-no-drag` → 不拖动（即使外层有 `jade-region-drag`）。
- 最近的是 `jade-region-drag` → 拖动。
- 都没有 → 不拖动。

### HTML 示例

```html
<!-- 整条标题栏可拖动 -->
<div class="titlebar" jade-region-drag>
  <span class="title">我的应用</span>

  <!-- 标题栏里的按钮要可点击，挖洞排除 -->
  <div class="actions" jade-region-no-drag>
    <button onclick="...">设置</button>
    <button onclick="...">关于</button>
  </div>
</div>
```

```css
.titlebar {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

### 与 `-webkit-app-region` 的对比

| | `-webkit-app-region: drag` | `jade-region-drag` |
|---|---|---|
| 拖动窗口 | ✅ | ✅ |
| 双击最大化 | ✅ | ✅ |
| 右键系统标题栏菜单 | **会弹出** | **不弹出** |
| 排除子元素 | `-webkit-app-region: no-drag` | `jade-region-no-drag` |
| 作用范围 | CSS 样式（含继承语义） | HTML 属性（容器 + 后代） |

两套方式可在同一页面共存、互不影响；按需选用即可。需要「无右键系统菜单」的场景请用 `jade-region-drag`。

---

## 和 2.0 创建窗口 API 的配合

- 要不要系统标题栏、要不要边框，由 **`WebViewWindowOptions.frame_style`** 决定（`normal` / `no-titlebar` / `borderless` / `title-overlay`），不要再填已删除的旧字段。
- 需要**整块无边框 WebView 壳子**时，用 **`create_borderless_webview_window`**，见 [窗口 API](/docs/api/window-api)。

---

## 右键菜单控制（`jade-allow-contextmenu`）

**用途**：按元素粒度控制右键菜单是否允许弹出。当 `WebViewSettings.allow_right_click` 设为 `0`（全局禁用右键）时，可通过此属性为特定元素单独放行。

### 基本用法

```html
<!-- 允许弹出右键菜单 -->
<button jade-allow-contextmenu>右键我</button>

<!-- 禁止弹出右键菜单（默认行为） -->
<button>右键我也没用</button>
```

### 注意事项

- **优先级**：元素同时设置了 `disabled` 属性时，`jade-allow-contextmenu` 不生效
- **全局设置**：`WebViewSettings` 中 `allow_right_click=1`（不全局禁用，即默认允许右键）时，此属性被忽略，页面任意处都可弹出右键
- **默认行为**：未设置此属性的元素默认不允许弹出右键菜单
- **作用范围**：该属性只对实际被右键命中的元素本身生效，不覆盖其子元素（与 `jade-region-drag` 的「容器 + 后代」语义不同）

### 动态控制

```javascript
const el = document.getElementById('my-element');
el.setAttribute('jade-allow-contextmenu', '');     // 允许
el.removeAttribute('jade-allow-contextmenu');      // 禁止
```

---

## 故障排除

### 拖动区域不工作

- 确保属性名正确：`-webkit-app-region` 或 `app-region`
- 检查按钮区域是否正确设置了 `no-drag`，避免嵌套覆盖

### 右键菜单不弹出

- 检查元素是否设置了 `disabled` 属性
- 确认 `WebViewSettings.allow_right_click` 为 `0`（全局禁用右键），否则 `jade-allow-contextmenu` 无意义
- 确保 `jade-allow-contextmenu` 属性已正确添加到目标元素
