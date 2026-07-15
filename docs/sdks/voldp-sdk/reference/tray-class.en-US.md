---
title: JadeView_托盘 Class
order: 3
group:
  title: "API Reference"
  order: 4
---

# JadeView_托盘 Class

`JadeView_托盘` is used to manage the tray icon, tray menu, and tray-related events.

## Creation and Destruction

### Creation

- Create the tray icon
- Automatically subscribes to:
  - `tray-event`
  - `tray-menu-command`
- Avoids duplicate creation and duplicate subscription

### Destruction

- Automatically unsubscribes from tray events
- Releases tray resources

## Common Methods

- `置可见(...)`
- `置提示(...)`
- `置图标(...)`
- `添加菜单项(...)`
- `置菜单禁止(...)`
- `置菜单危险(...)`
- `置菜单标题(...)`
- `删除菜单(...)`
- `清空菜单()`

## Tray Interaction Event

Callback form:

- `托盘交互事件(事件类型, 托盘ID)`

The module has already extracted from the raw `tray-event` JSON:

- `event`
- `tray_id`

## Tray Menu Command Event

Callback form:

- `托盘菜单命令事件(托盘ID, 键名, 项目ID, 项目类型, 已选中, 风险项目)`

The module has already extracted from the raw `tray-menu-command` JSON:

- `tray_id`
- `key`
- `item_id`
- `item_type`
- `checked`
- `dangerous`

Users do not need to parse the raw JSON themselves.


```
// 托盘回调事件

<火山程序 类型 = "通常" 版本 = 1 />

方法 JadeView_托盘_托盘交互事件 <接收事件 类型 = 整数>
参数 来源对象 <类型 = JadeView_托盘 注释 = "提供事件产生的具体来源对象">
参数 标记值 <类型 = 整数 注释 = "用户调用\"挂接事件\"命令时所提供的\"标记值\"参数值,非此方式挂接事件则本参数值固定为0.">
参数 事件类型 <类型 = 文本型>
参数 托盘ID <类型 = 整数>
{
    如果 (来源对象 == Jade托盘)
    {
        调试输出 (取源方法名 (), 事件类型, 托盘ID)
    }
    返回 (0)
}

方法 JadeView_托盘_托盘菜单命令事件 <接收事件 类型 = 整数>
参数 来源对象 <类型 = JadeView_托盘 注释 = "提供事件产生的具体来源对象">
参数 标记值 <类型 = 整数 注释 = "用户调用\"挂接事件\"命令时所提供的\"标记值\"参数值,非此方式挂接事件则本参数值固定为0.">
参数 托盘ID <类型 = 整数>
参数 键名 <类型 = 文本型>
参数 项目ID <类型 = 整数>
参数 项目类型 <类型 = 文本型>
参数 已选中 <类型 = 逻辑型>
参数 风险项目 <类型 = 逻辑型>
{
    如果 (来源对象 == Jade托盘)
    {
        调试输出 (取源方法名 (), 托盘ID, 项目ID, 键名, 风险项目)

    }
    返回 (0)
}

```