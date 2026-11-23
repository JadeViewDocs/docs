---
title: 关闭窗口
order: 9
group:
  title: 窗口
  order: 1
---

# 关闭窗口

## 关闭窗口

### 关闭窗口（`close_window`）

发起关闭；若页面注册了 `beforeunload` 且用户选择留下，关闭可能被推迟或取消，具体以 WebView 与页面脚本为准。

```c
int32_t close_window(uint32_t window_id);
```

- `window_id` `uint32_t` - 目标 Window ID

#### 关闭流程

前端调用 `window.close()`、点击标题栏关闭按钮或按 Alt+F4 时，所有关闭方式走同一条流程：

1. 先派发 `window-closing`（宿主可拦截，回调返回非空指针即阻止关闭，见 [事件类型](/docs/v3api/event-types)）；
2. 关闭窗口并派发 `window-closed`；
3. 最后一个窗口关闭时派发 `window-all-closed`。

:::info{title=说明}
- **标题栏关闭按钮可拦截**：与 `window.close()`、Alt+F4 一致，可被 `window-closing` 回调拦住。
- **`close_window()`**：走「程序化关闭」语义，绕过 `window-closing` 直接关闭窗口。
:::

**关闭来源与页面地址：** `window-closing` 回调的 `event_data` 区分来源——`{"source":"system"}` 表示用户发起（Alt+F4、系统关闭按钮、标题栏关闭按钮）；`{"source":"frontend","url":"<页面当前地址>"}` 表示由前端 `window.close()` 发起。页面地址由 JadeView 直接读取 WebView 当前地址得到，不采用页面自报值。

**兜底：** 窗口若未经正常关闭流程就被销毁，仍会补发 `window-closed`（以及所有窗口都关闭时的 `window-all-closed`）并清理窗口状态，宿主不会漏收关闭通知。

最大化或固定尺寸窗口仍保留标题栏按钮。
