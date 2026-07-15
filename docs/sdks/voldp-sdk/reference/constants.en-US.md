---
title: Constants
order: 0
group:
  title: "API Reference"
  order: 4
---

# Constants

This page lists the commonly used constant classes in the current module.

## For Windows and Appearance

- `主题颜色`
- `背景材质`
- `边框风格`
- `提示框类型`

These constants are mainly used in:

- `JadeView_窗口选项`
- `置窗口主题(...)`
- `置窗口材质(...)`
- `消息框(...)`

## For System Capabilities

- `热键功能键`
- `路径常量`
- `对话框属性`

These constants are mainly used in:

- `注册全局热键(...)`
- `取路径(...)`
- File dialog property strings

## For Event Subscription

- `订阅_窗口事件`
- `订阅_视图事件`
- `订阅_通知事件`
- `订阅_系统事件`

Description:

- Most ordinary events are subscribed automatically during `初始化()`
- Interceptable events and special events such as `文件拖入` need to be subscribed manually
- The callback for a subscribed event can be quickly declared by clicking the lightning icon next to the variable declaration in the class

## For the Tray

- `托盘菜单项类型`
- `托盘事件类型`

Description:

- `托盘菜单项类型` is used in `添加菜单项(...)`
- `托盘事件类型` is used to understand the event type parameter of `托盘交互事件`
