---
title: 窗口交互控制
order: 2
group:
  title: 前端 API
  order: 2
---

# 窗口交互控制

自定义标题栏、侧边栏等可拖拽区域**优先使用 `jade-region-drag`**；CSS 的 `-webkit-app-region` 作为备选放在后文。

:::warning{title="优先使用 jade-region-drag"}
`-webkit-app-region: drag` 叠加布局动画时会阻塞原生窗口缩放：拖动边框时尺寸短暂停滞、随后突然追上鼠标（单次尺寸更新最长约 453ms；改用属性式拖拽后约 9.6ms）。

自定义标题栏、侧边栏等可拖拽区域建议移除 `-webkit-app-region`，改用 `jade-region-drag` 指定拖动区、`jade-region-no-drag` 排除按钮与输入框；含布局切换、位移、展开收起等动画的应用优先替换，并验证窗口持续拉伸时的响应。
:::

---

## 自定义窗口拖动区（`jade-region-drag`）

基于 **HTML 自定义属性**的拖动方式，用于在无边框 / 自定义标题栏窗口中拖动窗口、双击最大化。

与 `-webkit-app-region` 最大的区别：**右键不会弹出系统标题栏菜单**（还原/移动/大小/最小化/最大化/关闭），右键、悬浮、移动等鼠标事件仍然交给页面。拖动区始终是普通页面区域（客户区），只有「左键按下并移动」才会发起一次程序化的窗口移动。

### 属性

| 属性 | 作用 |
|------|------|
| `jade-region-drag` | 标记该元素**及其所有后代**为可拖动区 |
| `jade-region-no-drag` | 在可拖动区内排除该元素（及其后代），用于按钮、输入框等可点击元素 |

属性为布尔属性，写上即生效，值会被忽略（`jade-region-drag` 与 `jade-region-drag="true"` 等价）。

### 行为

- **单击拖动**：按住左键并移动 → 移动窗口；拖到屏幕边缘支持系统贴边（Aero Snap）；窗口最大化时拖动会自动还原。
- **未移动的点击**：按下后没有移动就松开 → 页面收到普通 `click`，不会拖动窗口。
- **双击**：在拖动区双击 → 最大化 / 还原（切换）。
- **页面鼠标事件保留**：悬浮、右键、`mousemove`、`mousedown` / `mouseup` / `click` 仍交给页面；右键不会弹系统标题栏菜单。拖动开始后由系统移动循环接管，页面通常收不到该次拖动的 `mouseup` / `click`。
- 仅左键会触发拖动；右键、中键不触发拖动，但事件仍交给页面。

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

### 事件：拖动结束（`region-drag`）

拖动区按下后会进入系统窗口移动循环，该循环会捕获鼠标 —— 因此**页面收不到这次拖动的 `mouseup`，也不会有 `click`**。若要在拖动结束后做联动（例如把位置写回配置、恢复页面状态），订阅 `region-drag` 事件：

```c
jade_on("region-drag", on_region_drag);
// 回调收到：来源 ID = 发起拖动的 Window ID；event_data = {"action":"end"}
```

| 项 | 说明 |
|----|------|
| `action` | 目前仅 `"end"`：系统移动循环结束（松开左键）时派发 |
| 触发范围 | 仅 `jade-region-drag` 拖动区发起的拖动 |
| 原地点击 | 按下后未移动就松开 → 页面收到 click，不进入移动循环，因此不派发 `region-drag` |
| 不派发的情况 | 双击拖动区（走最大化/还原，不进入移动循环） |
| 窗口几何 | 事件不带位置尺寸，可用 `get_window_bounds` 查询 |
| 平台 | Windows（Linux 待验证） |

### 与 `-webkit-app-region` 的对比

| | `-webkit-app-region: drag` | `jade-region-drag` |
|---|---|---|
| 拖动窗口 | ✅ | ✅（按住左键并移动） |
| 未移动点击 | 页面收到 | 页面收到 |
| 双击最大化 | ✅ | ✅ |
| 悬浮 / 移动 / 右键页面事件 | 由 WebView2 / 系统处理 | 保留给页面 |
| 右键系统标题栏菜单 | **会弹出** | **不弹出** |
| 排除子元素 | `-webkit-app-region: no-drag` | `jade-region-no-drag` |
| 作用范围 | CSS 样式（含继承语义） | HTML 属性（容器 + 后代） |
| 叠加布局动画 | 可能阻塞窗口缩放 | 无此问题 |

两套方式可在同一页面共存、互不影响。**默认用 `jade-region-drag`**；CSS 方式仅用于无布局动画、且确实需要系统标题栏右键菜单的场景。

---

## 窗口拖动区域（`-webkit-app-region`，备选）

**用途**：自己做**自定义标题栏**时，告诉系统「这一块区域可以用鼠标拖动窗口」，而按钮区域不要拖动。用 CSS 的 **`app-region`** 或 **`-webkit-app-region`**（二者等价，选一种即可）。

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

:::warning
若页面含布局切换、位移、展开收起等动画，请不要使用本节方式，改用本页前文介绍的 `jade-region-drag`。
:::

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

- 优先确认用的是 `jade-region-drag` / `jade-region-no-drag`，属性名拼写正确
- 检查按钮、输入框等交互元素是否被 `jade-region-no-drag` 正确排除
- 若使用 CSS 方式，确认属性名为 `-webkit-app-region` 或 `app-region`，且按钮区域设置了 `no-drag`

### 右键菜单不弹出

- 检查元素是否设置了 `disabled` 属性
- 确认 `WebViewSettings.allow_right_click` 为 `0`（全局禁用右键），否则 `jade-allow-contextmenu` 无意义
- 确保 `jade-allow-contextmenu` 属性已正确添加到目标元素
