---
title: 系统托盘
order: 2
group:
  title: 原生 UI
  order: 4
---

# 系统托盘

创建带提示文字的托盘图标。图标点击触发 `tray-event`。如果要在右键时弹出菜单，请在事件回调中调用 `jade_menu_popup`，参见[菜单](/docs/v3api/menu-api)。

整个进程里**只允许一个托盘**；重复 `tray_create` 只会拿到同一个 `tray_id`。

:::info{title=平台差异}
"任务栏右下角"是 Windows 的表述；**Linux** 托盘依赖桌面环境的 StatusNotifierItem 协议，图标位置与交互由桌面环境决定（部分环境需安装相应扩展才显示）。
:::

---

## 创建托盘（`tray_create`）

**用途**：**创建**托盘图标（若已有则直接返回已有 id）。

```c
uint32_t tray_create(void);
```

返回值大于 0 即为 `tray_id`，后面所有托盘 API 都要带这个 id。

---

## 销毁托盘（`tray_destroy`）

**用途**：移除托盘图标。

```c
int32_t tray_destroy(uint32_t tray_id);
```

`tray_id` 必须对应当前托盘，否则返回 `0`。

---

## 设置托盘可见性（`tray_set_visible`）

**用途**：**显示或隐藏**托盘上的小图标（不销毁，只是看不见）。

```c
int32_t tray_set_visible(uint32_t tray_id, int32_t visible);
```

非 `0` 显示，`0` 隐藏。

---

## 设置托盘提示文字（`tray_set_tooltip`）

**用途**：鼠标悬停在托盘图标上时显示的**一句话提示**。

```c
int32_t tray_set_tooltip(uint32_t tray_id, const char* tooltip_utf8);
```

指针不能为 `NULL`。

---

## 从文件设置托盘图标（`tray_set_icon_from_file`）

**用途**：从 **.ico 等图片文件**加载托盘图标。

```c
int32_t tray_set_icon_from_file(uint32_t tray_id, const char* icon_path_utf8);
```

---

## 从二进制数据设置托盘图标（`set_tray_icon_from_data`）

支持传递二进制数据（如 ICO/PNG 文件的字节内容）作为托盘图标，无需写入临时文件。

```c
int32_t set_tray_icon_from_data(uint32_t tray_id, const uint8_t* icon_data, uint32_t data_len);
```

- **参数**：
  - `tray_id` `uint32_t` - 托盘图标 ID
  - `icon_data` `const uint8_t*` - 图标二进制数据指针
  - `data_len` `uint32_t` - 数据长度（字节）
- **返回值**：`1` = 成功，`0` = 失败

---

## 和主窗口的关系

关掉主窗口**不会**自动删托盘；要不要随最后一窗退出进程，由你在 `window-closing` / `window-all-closed` 里自己决定。
