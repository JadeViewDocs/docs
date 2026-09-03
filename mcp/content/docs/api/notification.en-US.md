---
title: Notifications
order: 1
group:
  title: Native UI
  order: 4
---

# Notifications

## Show a system notification (`show_notification`)

**Purpose**: Pop up a **system notification** on **Windows / Linux** (on Windows it appears in the Action Center / bottom-right corner; on Linux it goes through freedesktop `org.freedesktop.Notifications` / zbus), with a title, body, an optional icon, and buttons. Ideal for letting the user know a task has finished, that confirmation is needed, and so on.

```c
int32_t show_notification(const NotificationParams* params);
```

### What each `NotificationParams` field does

| Field | Purpose |
|------|------|
| `summary` | **Title**, required, the first thing the user sees. |
| `body` | The body text. |
| `icon` | **Absolute disk path** to the small icon. |
| `timeout` | How long it stays (in milliseconds). **Currently has no effect on Windows** (the toast duration is decided by system settings); on Linux, `<= 0` is decided by the notification service. |
| `button1` / `button2` | The button labels on the notification; clicking them triggers **`notification-action`** and similar events (see [Event Types](/en-US/docs/api/event-types#notification-events)). |
| `text3` | An extra line of supplementary text. |
| `action` | A parameter related to the notification action; it is passed into the system callback data. |

Returns `1` if the notification was sent for display, `0` on failure. **Supported on both Windows and Linux** (on Linux it goes through freedesktop `org.freedesktop.Notifications` / zbus and also returns `1` on success).

### Behavior

You no longer need a separate "register application" call: **the library completes registration internally the first time a notification is shown**. When the user clicks, dismisses, or display fails, the event name the main process receives through **`jade_on`** is listed in [Event Types · Notification-related events](/en-US/docs/api/event-types#notification-events).

**Example** (handle the result in the callback after calling from the C side):

```c
NotificationParams p = { 0 };
p.summary = "Task complete";
p.body = "Processing has finished";
show_notification(&p);
```
