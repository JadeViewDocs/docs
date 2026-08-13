---
title: Web Permissions
order: 2
badge: v2.4
group:
  title: Windows & Views
  order: 1
---

# Web Permission API

JadeView 2.4 provides a unified web permission interception system. When a page requests camera, microphone, display capture, file access, clipboard read, geolocation, notifications, and other permissions, the main process can centrally decide whether to allow or deny them through this event.

## Event Name

```c
jade_on("webview-permission-request", permission_callback);
```

Corresponding event constant:

```c
#define JADEVIEW_EVENT_WEBVIEW_PERMISSION_REQUEST "webview-permission-request"
```

## Callback Signature

```c
int32_t JADEVIEW_CALL permission_callback(
    uint32_t window_id,
    const char* event_data
);
```

- `window_id`: id of the window that initiated the permission request.
- `event_data`: UTF-8 JSON, for example:

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

## Permission Types

| `kind` | Meaning |
| --- | --- |
| `camera` | Camera |
| `microphone` | Microphone |
| `display-capture` | Screen / window / tab capture |
| `file-system-access` | File system access, such as `showOpenFilePicker`, `showDirectoryPicker` |
| `clipboard-read` | Read the clipboard |
| `geolocation` | Geolocation |
| `notifications` | Web notifications |
| `midi` | MIDI devices |
| `sensors` | Sensors |
| `local-fonts` | Local font access |
| `window-management` | Multi-window management |
| `pointer-lock` | Pointer lock |
| `automatic-downloads` | Automatic downloads |
| `autoplay` | Media autoplay |
| `other` | Other or unrecognized permissions |

## Callback Return Value

The integer returned by the callback determines the permission result:

| Return value | Result |
| --- | --- |
| `0` | Use the browser default behavior |
| `1` | Allow the permission |
| `-1` | Deny the permission |

## Multiple-Callback Rules

- If any callback returns `-1`, the final result is deny.
- If no callback returns `-1` and all callbacks return `1`, the final result is allow.
- Otherwise, the default behavior is used.
- The default behavior is used when no `webview-permission-request` callback is registered.

## Example

```c
int32_t JADEVIEW_CALL on_permission(uint32_t window_id, const char* data) {
    /*
     * Parse the JSON according to your business logic before deciding.
     * This example allows only camera and denies all other permissions.
     */
    if (strstr(data, "\"kind\":\"camera\"") != NULL) {
        return 1;
    }
    return -1;
}

jade_on("webview-permission-request", on_permission);
```

## Platform Support

- Windows: fully supports WebView2 permission types; `requestingUrl` and `origin` in event data are available.
- Linux: due to WebKitGTK limitations, `requestingUrl` and `origin` may be empty; Windows-specific types such as `file-system-access` may be reported as `other`.

## Error Handling Recommendations

- The permission callback is synchronous; do not block for a long time or perform time-consuming work inside it.
- When this event is not registered, the browser default behavior is used; if you need strict unified allow/deny, register `webview-permission-request` first.
- This event is an interception event and is called inline synchronously on the GUI thread; see [Event Types](/en-US/docs/api/event-types#ipc-callback-returns).
