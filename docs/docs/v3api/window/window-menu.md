---
title: 窗口菜单栏
order: 1.2
group:
  title: 窗口
  order: 1
---

# 窗口菜单栏

窗口菜单栏显示在标题栏下方，是窗口客户区的一部分：它占用页面顶部的高度，页面内容从菜单栏底边开始。菜单栏由 JadeView 原生绘制，不是网页 DOM，因此不受页面样式和滚动影响。

菜单项的字段含义、图标规则见[菜单 API](/docs/v3api/menu/menu-api#菜单项)；右键菜单见[网页右键菜单](/docs/v3api/menu/context-menu-api)。

## 设置范围

| 设置 | 作用范围 |
| --- | --- |
| `jade_window_set_menu` | 指定窗口，优先级最高。 |
| `jade_set_application_menu` | 所有没有单独菜单的普通窗口，之后新建的窗口同样继承。 |
| 都不调用 | 普通窗口显示内置默认菜单「编辑 / 视图 / 窗口 / 帮助」。 |

```c
int32_t jade_set_application_menu(const JadeMenuItemDesc* items, uint32_t item_count);
int32_t jade_window_set_menu(uint32_t window_id, const JadeMenuItemDesc* items,
                             uint32_t item_count);
```

两者都返回 `1` 表示请求已入队，`0` 表示被拒绝；原因用 `jade_last_error_code()` / `jade_last_error_message()` 查询。

## 规则与限制

- 顶层项必须是子菜单（`kind = 1`），出现其它类型时整次调用被拒绝。
- `item_count = 0` 隐藏菜单栏，传 `NULL, 0` 也可以。
- 菜单栏高度由内容决定，随系统 DPI 缩放，不需要手动设置，也不占用标题栏高度。
- 全屏时菜单栏自动隐藏，退出全屏后恢复。
- 没有窗口装饰的窗口不会自动挂载应用菜单：`title_bar_style` 为 `BarOverlay` 或 `hidden`、以及 `noframe = 1` 的窗口都属此类。这类窗口需要菜单栏时，对单个窗口调用 `jade_window_set_menu`。

## 示例

```c
JadeMenuItemDesc bar[] = {
    { "file",      NULL,   "文件", NULL,   1, 0, { 0 } },
    { "file-new",  "file", "新建", "Ctrl+N", 0, 0, { 0 } },
    { "file-open", "file", "打开", "Ctrl+O", 0, 0, { 0 } },
    { "file-quit", "file", "退出", NULL,   0, 0, { 0 } },
    { "view",      NULL,   "视图", NULL,   1, 0, { 0 } },
    { "view-full", "view", "全屏", "F11",  0, 0, { 0 } },
};

if (!jade_set_application_menu(bar, 6)) {
    const char* message = jade_last_error_message(); /* 顶层项不是子菜单等 */
}
```

只替换某个窗口的菜单：

```c
jade_window_set_menu(window_id, bar, 6);
```

## 事件

菜单项被选中后派发 `menu-command`，数据为 `{"item_id":"..."}`，来源 ID 是所属窗口 ID。事件注册与回调见[事件类型](/docs/v3api/messaging/event-types#menu-command)。

## 与弹出菜单的区别

| 项目 | 窗口菜单栏 | 弹出菜单 |
| --- | --- | --- |
| 入口 | `jade_set_application_menu` / `jade_window_set_menu` | `jade_menu_popup` |
| 位置 | 固定在标题栏下方 | 跟随鼠标或指定坐标 |
| 布局 | 占用页面顶部高度 | 不占布局，浮在页面之上 |
| 生命周期 | 常驻，直到被替换或隐藏 | 选中或取消即关闭 |
