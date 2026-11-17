---
title: V3 ABI 契约
order: 1
group:
  title: 概览
  order: 0
---

# V3 ABI 契约

本页说明二进制接口的版本标识、配置结构体的初始化规则、内存所有权与导出检查。宿主与库须使用同一 ABI 和结构体布局。

## 加载检查

```c
struct JadeAbiInfo {
    uint32_t abi_version;
    uint32_t pointer_bits;
    uint32_t window_options_size;
    uint32_t webview_settings_size;
};
int32_t jade_get_abi_info(struct JadeAbiInfo *out, size_t capacity);
```

成功返回 0，失败返回负错误码；输出容量不足时不写入。该固定输出无动态内存，不需要释放。SDK 在传入配置前检查 ABI、进程位数与所需结构体尺寸，DLL 缺少该符号时明确拒绝。Python `Runtime` 已内置检查。

## 配置与默认值

`WebViewWindowOptions`、`WebViewSettings` 的前两个字段依次为 `uint32_t struct_size`、`uint32_t abi_version`。结构体必须有至少可读的 8 字节前缀，声明尺寸必须对应实际可读缓冲区；尺寸标记不能验证任意野指针。

```c
int32_t window_options_default(struct WebViewWindowOptions *out, size_t capacity);
int32_t webview_settings_default(struct WebViewSettings *out, size_t capacity);

struct WebViewWindowOptions options;
if (window_options_default(&options, sizeof options) != JADE_OK) return;
options.title = "My application";
```

初始化函数只写容量内完整字段，设置尺寸和版本；NULL、少于 8 字节或落在字段中间的容量被拒绝，错误时不写入。读取同 ABI 的较短配置时，缺失尾部字段采用默认值；更长结构的未知尾部不读取。后续同 ABI 只允许尾部追加，已有字段不能移动或改变含义。

NULL 创建配置使用全部默认值。窗口默认可见，`hide_window=1` 才隐藏；不要用清零结构代替推荐默认值。Python `WindowOptions` / `WebViewSettings` 自动设置前缀和默认值。

## 所有权与固定布局

其它已有输出结构、事件头、布局结构和 `ResourceOptions` 布局冻结，不能无尺寸参数地继续追加。后续需要扩展时使用容量明确的新契约或升级 ABI。普通布局参数仍为结构体，不使用 JSON。

C 字符串为 UTF-8，输入在 API 约定的同步复制边界内有效；数组和库分配字符串必须使用配套释放函数。事件正文仅在回调期间有效，保留时用 `event_clone/event_free`。`ResourceDeliveryInfo.message` 由 `free_resource_delivery_info` 释放。

Windows x86 使用 `JADEVIEW_CALL` 声明的 system/stdcall 约定，宿主不可混用调用约定或位数。接口受理成功、原生 Ready 和页面加载完成仍是不同阶段。

## 冻结的布局尺寸

| 类型 | x64 | x86 | 冻结检查 |
|---|---:|---:|---|
| `WebViewWindowOptions` | 168 | 132 | `titlebar_back` 152/120、`titlebar_icon` 160/128 |
| `WebViewSettings` | 128 | 88 | `profile_name` 96/64 |
| `JadeEvent` | 80 | 64 | 事件头 |
| `WebViewBounds` | 32 | 16 | 四个 C 字符串指针 |
| `ResourceDeliveryInfo` | 24 | 16 | 资源诊断 |
| `JadeAbiInfo` | 16 | 16 | ABI 查询输出 |
| `JadeMenuItemDesc` | 72 | 40 | 菜单项输入，`icon` 位于 40/24 |
| `JadeMenuIconDesc` | 32 | 16 | 图标输入 |

Rust 在两种指针宽度下于编译期断言这些值，`tests/next_abi.c` 同时断言 x64/x86 的 C 布局。

## 公开导出清单

`tools/check_abi.py` 对比生成头文件中的 `JADEVIEW_CALL` 声明与已构建 DLL/SO 的导出表。发行打包以严格模式运行：声明了但未导出、或导出了未声明且不在允许列表中的符号，都会使打包失败。允许的非公开导出只有 `jade_demo_menu_*` 和 crash handler 的 `handle_invalid_parameter` / `handle_pure_virtual_call`。`JADE_ABI_VERSION` 由 `build.rs` 从 `src/abi.rs` 读取，Python SDK 测试在 32/64 位解释器下校验其副本。
