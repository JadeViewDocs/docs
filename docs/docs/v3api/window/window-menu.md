---
title: 窗口菜单栏
order: 1.2
group:
  title: 窗口
  order: 1
---

# 窗口菜单栏

窗口菜单栏显示在标题栏下方，是窗口客户区的一部分：它占用页面顶部的高度，页面内容从菜单栏底边开始。菜单栏由 JadeView 原生绘制，不是网页 DOM，因此不受页面样式和滚动影响。

![JadeView 窗口菜单栏结构与批注](/screenshot/menubar-overview-annotated.png)

对照上图编号，各区域说明如下：

1. **窗口标题栏**：保留原生导航与窗口控制按钮；菜单栏不占用标题栏高度。
2. **窗口菜单栏（28 DIP）**：固定在标题栏下方，高度随系统 DPI 等比缩放，不需要手动配置。
3. **弹出下拉菜单**：点击或悬浮切换顶层项后自动展开，采用 10pt 连续曲率圆角、1px 抗锯齿描边与亚克力材质。
4. **网页内容区域**：页面直接从菜单栏底边开始排版，不会被菜单栏压住。

菜单项的字段含义、图标规则见[菜单 API](/docs/v3api/menu/menu-api#菜单项结构jademenuitemdesc)；网页右键菜单见[网页右键菜单](/docs/v3api/menu/context-menu-api)。

## 选择设置范围

| 接口 | 作用范围 |
| --- | --- |
| `jade_window_set_menu` | 只作用于指定窗口，优先级最高。 |
| `jade_set_application_menu` | 所有未单独设置菜单的普通窗口，之后新建的普通窗口同样继承。 |
| 都不调用 | 普通窗口默认显示内置菜单「编辑 / 视图 / 窗口 / 帮助」。 |

```c
int32_t jade_set_application_menu(const JadeMenuItemDesc* items, uint32_t item_count);
int32_t jade_window_set_menu(uint32_t window_id, const JadeMenuItemDesc* items,
                             uint32_t item_count);
```

两者都返回 `1` 表示请求已入队，`0` 表示被拒绝；失败原因可通过 `jade_last_error_code()` / `jade_last_error_message()` 查询。

## 规则与限制

- **顶层项必须是子菜单（`kind = 1`）**：出现普通项或分隔线时整次调用会被拒绝。
- **隐藏菜单栏**：传入 `item_count = 0`（或 `NULL, 0`）即可隐藏菜单栏。
- **自动避让与全屏**：全屏时菜单栏自动隐藏，退出全屏后恢复。
- **无装饰窗口不自动挂载**：`title_bar_style` 为 `BarOverlay` 或 `hidden`，以及 `noframe = 1` 的窗口不会自动继承应用菜单；需要菜单栏时请对该窗口单独调用 `jade_window_set_menu`。

:::tip{title="与标题栏、DPI 的配合"}
菜单栏高度（28 DIP）和文字图集会在系统 DPI 切换或跨屏移动时自动重建，无需宿主手动重算高度。
:::

## 示例

![自定义窗口菜单栏与图标、复选框示例](/screenshot/menubar-custom-annotated.png)

下面示例为单个窗口挂载一个带字形图标与复选框状态的自定义菜单栏，并在点击时通过 `menu-command` 收到回调：

```c
JadeMenuItemDesc bar[] = {
    { "sample", NULL, "示例", NULL, 1, 0, { 0 } },                 /* 顶层项 kind=1 */
    { "sample.emit", "sample", "发送事件", NULL, 0, 0,
      { NULL, NULL, 0, 0xE714 } },                                 /* 字体图标 */
    { "sample.checked", "sample", "复选示例", NULL, 3, 2, { 0 } }, /* kind=3 复选, flags=2 已勾选 */
};

if (!jade_window_set_menu(window_id, bar, 3)) {
    const char* message = jade_last_error_message();
}
```

如果要设置给整个应用的所有普通窗口：

```c
jade_set_application_menu(bar, 3);
```

Python：

```python
menu = Menu.build_from_template(runtime, [
    {
        "id": "sample",
        "label": "示例",
        "submenu": [
            {"id": "sample.emit", "label": "发送事件", "icon_codepoint": 0xE714},
            {"id": "sample.checked", "label": "复选示例", "kind": "checkbox", "checked": True},
        ],
    }
])

window.set_menu(menu)
```

## 事件

菜单项被选中后派发 `menu-command`，负载为 `{"item_id":"..."}`，来源 ID 是所属窗口 ID。事件注册与回调见[事件类型](/docs/v3api/messaging/event-types#menu-command)。

## 与弹出菜单的区别

| 项目 | 窗口菜单栏 | 弹出菜单 |
| --- | --- | --- |
| 入口 | `jade_set_application_menu` / `jade_window_set_menu` | `jade_menu_popup` |
| 位置 | 固定在标题栏下方 | 跟随鼠标或指定坐标 |
| 布局 | 占用页面顶部高度 | 不占布局，浮在页面之上 |
| 生命周期 | 常驻，直到被替换或隐藏 | 选中或取消即关闭 |
