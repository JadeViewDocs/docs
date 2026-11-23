---
title: 系统托盘
order: 2
group:
  title: 原生 UI
  order: 4
---

# 系统托盘

创建带提示文字的托盘图标。图标点击触发 `tray-event`。托盘菜单的完整写法见[托盘菜单](/docs/v3api/menu/tray-menu)。

整个进程里**只允许一个托盘**；重复 `tray_create` 只会拿到同一个 `tray_id`。

| 平台 | 说明 |
|---|---|
| Windows | 托盘位于任务栏通知区域；图标建议使用多尺寸 ICO。 |
| Linux | 使用桌面环境的 StatusNotifierItem 协议；图标位置与交互由桌面环境决定，部分环境需要安装扩展才显示。 |

## 快速开始

```c
uint32_t tray = tray_create();
tray_set_icon_from_file(tray, "app/tray.ico");
tray_set_tooltip(tray, "JadeView");
```

`app/tray.ico` 可以是已挂载 JAPK 的 `app/...` 路径；JAPK 尚未挂载时使用 `set_tray_icon_from_data` 传 PNG/ICO 字节。

---

## 创建托盘（`tray_create`）

```c
uint32_t tray_create(void);
```

**参数**：无。

**返回值**：

- `> 0`：托盘 ID（`tray_id`），后续所有托盘 API 都要带这个 id。
- `0`：分配失败。

**说明**：

- 每个进程只创建一个托盘；已有托盘时直接返回同一个 id。
- 实际创建在 GUI 线程异步执行；如果系统托盘创建失败，会写日志并清除注册。

---

## 销毁托盘（`tray_destroy`）

```c
int32_t tray_destroy(uint32_t tray_id);
```

**参数**：

| 参数 | 类型 | 说明 |
|---|---|---|
| `tray_id` | `uint32_t` | `tray_create` 返回的当前托盘 ID。 |

**返回值**：`1` = 请求已入队；`0` = `tray_id` 为 `0`、不是当前托盘，或无法入队。

**说明**：移除托盘图标；之后再调用 `tray_create` 会分配新的 id。

---

## 设置托盘可见性（`tray_set_visible`）

```c
int32_t tray_set_visible(uint32_t tray_id, int32_t visible);
```

**参数**：

| 参数 | 类型 | 说明 |
|---|---|---|
| `tray_id` | `uint32_t` | `tray_create` 返回的托盘 ID。 |
| `visible` | `int32_t` | `0` = 隐藏托盘图标，非 `0` = 显示。 |

**返回值**：`1` = 请求已入队；`0` = 参数无效或无法入队。

**说明**：只改变可见性，不销毁托盘；隐藏期间没有托盘图标可点击。

---

## 设置托盘提示文字（`tray_set_tooltip`）

```c
int32_t tray_set_tooltip(uint32_t tray_id, const char* tooltip_utf8);
```

**参数**：

| 参数 | 类型 | 说明 |
|---|---|---|
| `tray_id` | `uint32_t` | `tray_create` 返回的托盘 ID。 |
| `tooltip_utf8` | `const char*` | UTF-8 提示文字，不能为 `NULL`；建议使用单行短文本。 |

**返回值**：`1` = 请求已入队；`0` = 参数无效或无法入队。

**说明**：鼠标悬停在托盘图标上时显示；内容在调用期间同步复制。

---

## 从文件设置托盘图标（`tray_set_icon_from_file`）

```c
int32_t tray_set_icon_from_file(uint32_t tray_id, const char* icon_path_utf8);
```

**参数**：

| 参数 | 类型 | 说明 |
|---|---|---|
| `tray_id` | `uint32_t` | `tray_create` 返回的托盘 ID。 |
| `icon_path_utf8` | `const char*` | PNG/ICO 文件路径，UTF-8；支持已挂载 JAPK 的 `app/...` 路径。 |

**返回值**：`1` = 请求已入队；`0` = 参数无效或无法入队。

**说明**：

- 直接传绝对路径即可；相对路径会按当前进程目录、工作目录和可执行文件目录解析。
- 图片解码和托盘更新在 GUI 线程异步执行；失败只写日志，不额外派发事件。
- JAPK 尚未挂载时 `app/...` 不存在，改用 `set_tray_icon_from_data`。

---

## 从二进制数据设置托盘图标（`set_tray_icon_from_data`）

```c
int32_t set_tray_icon_from_data(uint32_t tray_id, const uint8_t* icon_data, uint32_t data_len);
```

**参数**：

| 参数 | 类型 | 说明 |
|---|---|---|
| `tray_id` | `uint32_t` | `tray_create` 返回的托盘 ID。 |
| `icon_data` | `const uint8_t*` | PNG/ICO 字节内容，不能为 `NULL`。 |
| `data_len` | `uint32_t` | `icon_data` 的字节数，必须大于 `0`。 |

**返回值**：`1` = 请求已入队；`0` = 参数无效或无法入队。

**说明**：

- 数据在调用期间同步复制，返回后可以立即释放。
- 适合 JAPK 尚未挂载、图标来自内存或网络时使用。
- 图片解码和托盘更新异步执行；失败只写日志。

---

## 事件

托盘事件统一为 `tray-event`，数据包含 `tray_id`、`event`、屏幕坐标 `x` / `y` 和时间戳。`event` 的取值和常见用法见[托盘菜单](/docs/v3api/menu/tray-menu)。

---

## 和主窗口的关系

关掉主窗口**不会**自动删托盘；要不要随最后一窗退出进程，由你在 `window-closing` / `window-all-closed` 里自己决定。退出前调用 `tray_destroy(tray_id)`，避免图标残留。
