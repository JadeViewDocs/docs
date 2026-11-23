---
title: 任务栏特效
order: 8
group:
  title: 窗口
  order: 1
---

# 任务栏特效

## 任务栏特效

### 设置任务栏进度条（`set_window_progress`）

在任务栏按钮上显示进度条（如下载进度、安装进度等）。

```c
int32_t set_window_progress(uint32_t window_id, int32_t progress, int32_t state);
```

- **参数**：
  - `window_id` `uint32_t`
  - `progress` `int32_t` - 进度值（0–100）
  - `state` `int32_t` - 状态：`0` 无进度、`1` 正常、`2` 暂停（黄色）、`3` 错误（红色）、`4` 不确定
- **返回值**：`1` 成功，`0` 失败

:::warning
仅 Windows 平台。
:::

---

### 任务栏图标闪烁（`flash_window`）

```c
int32_t flash_window(uint32_t window_id, uint32_t count);
```

- **参数**：`window_id` `uint32_t`；`count` `uint32_t` - 闪烁次数，`0` 停止闪烁
- **返回值**：`1` 成功，`0` 失败

:::warning
仅 Windows 平台。
:::

---
