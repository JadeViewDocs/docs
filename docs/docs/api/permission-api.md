---
title: 网页权限
order: 2
badge: v2.4
group:
  title: 窗口与视图
  order: 1
---

# 网页权限 API

JadeView 2.4 提供统一网页权限拦截系统。当页面请求摄像头、麦克风、录屏、文件访问、剪贴板读取、地理位置、通知等权限时，主进程可通过统一处理器集中决定允许或拒绝。

## 注册处理器

```c
set_webview_permission_handler(permission_callback);
```

清除处理器：

```c
clear_webview_permission_handler();
```

## 回调签名

```c
int32_t JADEVIEW_CALL permission_callback(
    uint32_t window_id,
    const char* event_data
);
```

- `window_id`：发起权限请求的窗口 ID。
- `event_data`：UTF-8 JSON，例如：

```json
{
  "window_id": 1,
  "kind": "camera",
  "requestingUrl": "https://example.com/",
  "origin": "https://example.com",
  "isUserInitiated": true,
  "mediaTypes": ["video"]
}
```

## 权限类型

| `kind` | 含义 |
| --- | --- |
| `camera` | 摄像头 |
| `microphone` | 麦克风 |
| `display-capture` | 屏幕 / 窗口 / 标签页录制 |
| `file-system-access` | 文件系统访问，如 `showOpenFilePicker`、`showDirectoryPicker` |
| `clipboard-read` | 读取剪贴板 |
| `geolocation` | 地理位置 |
| `notifications` | 网页通知 |
| `midi` | MIDI 设备 |
| `sensors` | 传感器 |
| `local-fonts` | 本地字体访问 |
| `window-management` | 多窗口管理 |
| `pointer-lock` | 指针锁定 |
| `automatic-downloads` | 自动下载 |
| `autoplay` | 媒体自动播放 |
| `other` | 其它或未识别权限 |

## 回调返回值

回调返回的整数决定权限结果：

| 返回值 | 处理结果 |
| --- | --- |
| `0` | 使用浏览器默认行为 |
| `1` | 允许该权限 |
| `-1` | 拒绝该权限 |
| 其它值 | 拒绝该权限 |

未设置处理器时使用浏览器默认行为。

## 示例

```c
int32_t JADEVIEW_CALL on_permission(uint32_t window_id, const char* data) {
    /*
     * 根据业务解析 JSON 后决定。
     * 这里示例：只允许摄像头，拒绝其它所有权限。
     */
    if (strstr(data, "\"kind\":\"camera\"") != NULL) {
        return 1;
    }
    return -1;
}

set_webview_permission_handler(on_permission);
```

## 平台支持

- Windows：完整支持 WebView2 权限类型，事件数据中的 `requestingUrl` 和 `origin` 可用。
- Linux：受 WebKitGTK 限制，`requestingUrl` 和 `origin` 可能为空；`file-system-access` 等 Windows 专属类型可能进入 `other`。

## 错误处理建议

- 权限回调是同步调用，不要在回调中长时间阻塞或执行耗时操作。
- 未设置处理器时使用浏览器默认行为；需要严格统一放行 / 拒绝时，请先调用 `set_webview_permission_handler`。
- 权限处理器在 GUI 线程内联同步调用，相关说明见 [事件类型](/docs/api/event-types#ipc-callback-returns)。
