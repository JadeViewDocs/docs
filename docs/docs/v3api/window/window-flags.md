---
title: 窗口标志与层级
order: 5
group:
  title: 窗口
  order: 1
---

# 窗口标志与层级

## 窗口标志与层级

适用于侧边 Dock、悬浮面板、桌面挂件、启动器等场景：让窗口不出现在任务栏 / Alt-Tab、常驻时不抢焦点，或把窗口压到桌面壁纸层。

### 不进任务栏 / Alt-Tab（`set_window_skip_taskbar`）

```c
int32_t set_window_skip_taskbar(uint32_t window_id, int32_t skip);
```

- **参数**：`window_id`；`skip`（`1` 不进任务栏 / Alt-Tab，`0` 恢复）
- **返回值**：`1` 成功，`0` 失败

:::info{title=平台实现}
Windows：加 `WS_EX_TOOLWINDOW` 并去 `WS_EX_APPWINDOW`；Linux：GTK `skip-taskbar-hint`。
:::

---

### 不抢焦点（`set_window_no_activate`）

让窗口在点击 / 显示时都不获得激活焦点，适合常驻的悬浮面板。

```c
int32_t set_window_no_activate(uint32_t window_id, int32_t no_activate);
```

- **参数**：`window_id`；`no_activate`（`1` 不抢焦点，`0` 恢复）
- **返回值**：`1` 成功，`0` 失败


---

### 设置窗口层级（`set_window_level`）

一次性设定窗口处于哪个层级，比单纯的「置顶」更灵活。

```c
// level: "topmost" | "normal" | "bottom" | "desktop"
int32_t set_window_level(uint32_t window_id, const char* level);
```

- **参数**：`window_id`；`level` `string` - 层级字符串，取值见下表
- **返回值**：`1` 成功，`0` 失败

| level | 行为 | 实现 |
|-------|------|------|
| `topmost` | 置顶，盖在普通窗口之上 | `set_always_on_top(true)`（跨平台） |
| `normal` | 普通层，取消置顶 / 置底 | 取消 always-on-top / always-on-bottom |
| `bottom` | 压在其它窗口下方 | `set_always_on_bottom(true)`（跨平台） |
| `desktop` | 贴桌面壁纸层（最小化所有窗口才见，类挂件） | 先 `bottom`；Windows 寄生 `Progman` / `WorkerW`，Linux 设 GTK `WindowTypeHint::Desktop` |

:::warning{title=平台差异}
`topmost` / `normal` / `bottom` 跨平台稳定；`desktop`（壁纸层）为 best-effort，与窗口管理器行为相关，建议真机验证。寄生失败时至少退化为 `bottom`。
:::

---

### 设置内容保护（`set_content_protection`）

打开后，部分截屏和录屏软件较难采到窗口内容，效果因系统和采集方式而异。创建时可设置 `JadeWindowFeatures.content_protection`。

```c
int32_t set_content_protection(uint32_t window_id, int32_t content_protection);
```

- `window_id` `uint32_t` - **Window ID**（不是 WebView ID）
- `content_protection` `int32_t` - 非 `0` 启用保护，`0` 禁用保护

---
