---
title: YAML 存储 API
order: 2
group:
  title: 系统与工具
  order: 5
---

# YAML 存储 API

:::warning
2.3 大幅扩展。`yaml_set` / `yaml_get` 自 2.0 起可用，2.3 新增 `yaml_set_str`、`yaml_get_str`、`yaml_get_all`、`yaml_has`、`yaml_delete`、`yaml_clear`、`yaml_delete_file`、`yaml_keys`、`yaml_len` 等接口，并增强了路径语法、返回值语义与写入安全性。
:::

JadeView 提供了一组 C FFI 接口，用于在 `data_directory` 下读写 YAML 格式的持久化数据（主题、上次打开的路径、各类开关等）。所有文件操作均通过安全路径检查（防路径穿越），并支持文件锁和原子写入。

这组接口**不需要**经过网页，适合主进程自己持久化少量键值结构。其它工具能力见 [工具 API](/docs/api/tools-api)。

## 前置条件

调用任何 YAML API 之前，必须先通过 [`JadeView_init`](/docs/api/index) 初始化，设置 `data_directory`。YAML 文件将存储在该目录下。

---

## 接口一览

| 接口 | 说明 | 版本 |
|------|------|------|
| `yaml_set` | 设置路径值（自动解析类型） | 2.0 |
| `yaml_get` | 获取路径值（JSON 格式，两阶段查询） | 2.0 |
| `yaml_set_str` | 强制字符串存储 | 2.3 |
| `yaml_get_str` | 获取路径值（`CoTaskMemAlloc` 分配，需调用方释放） | 2.3 |
| `yaml_get_all` | 读取整个文件 | 2.3 |
| `yaml_has` | 检查路径是否存在 | 2.3 |
| `yaml_delete` | 删除指定路径 | 2.3 |
| `yaml_clear` | 清空文件为 `{}` | 2.3 |
| `yaml_delete_file` | 删除文件 | 2.3 |
| `yaml_keys` | 列出路径下的所有 key | 2.3 |
| `yaml_len` | 返回数组长度 / 对象 key 数 | 2.3 |

---

## 路径语法

路径使用点号 `.` 分隔层级，方括号 `[N]` 访问数组下标（数组下标语法 **2.3 新增**）：

```
user.name          → 映射键
items[0]           → 数组第 0 个元素
users[0].name      → 数组嵌套映射
matrix[0][1]       → 多维数组
```

- 路径不存在时，`yaml_set` 会自动创建中间节点（映射或数组）。
- 数组下标越界时，自动用 `null` 填充至目标位置。

---

## 返回值语义

:::warning
2.3 新增负数错误码语义；`yaml_get` 等读取接口新增两阶段查询返回值。
:::

| 返回值 | 含义 |
|--------|------|
| `1` | 成功 |
| `≥ 2` | getter 两阶段查询：需要的字节数（含 NUL） |
| `0` | 路径不存在 / 文件不存在 / 空操作 |
| `-1` | IO 错误 |
| `-2` | 类型不匹配（如中间节点非映射/非数组） |
| `-4` | 格式解析失败 |

---

## 接口详解

### 设置值（`yaml_set`）

```c
int yaml_set(const char* file_name, const char* key_path, const char* value);
```

设置指定路径的值。`value` 按以下优先级解析（自 2.3 起 `yaml_set` 会自动解析数值与布尔，原 `yaml_set_num` / `yaml_set_bool` 已合并至此）：

1. **JSON 解析** — `"123"` → 数字 123，`"true"` → 布尔 true，`"[1,2]"` → 数组
2. **YAML 片段解析** — 复杂 YAML 结构
3. **纯文本存储** — 以上均失败时作为字符串存储

```c
// 数字
yaml_set("config", "server.port", "8080");    // 存为数字 8080

// 布尔
yaml_set("config", "debug.enabled", "true");  // 存为布尔 true

// 字符串
yaml_set("config", "app.title", "My App");    // 存为字符串 "My App"

// 数组下标（2.3）
yaml_set("config", "tags[0]", "rust");        // tags: [rust]
yaml_set("config", "tags[1]", "webview");     // tags: [rust, webview]

// 嵌套
yaml_set("config", "db.primary.host", "localhost");
```

:::info
中间节点已存在且非映射、非空时返回 `-2`，**不会覆盖**已有数据。
:::

---

### 获取值（`yaml_get`）

```c
int yaml_get(const char* file_name, const char* key_path, char* buffer, size_t buffer_size);
```

获取指定路径的值，以 JSON 字符串写入 `buffer`。

**两阶段查询（2.3）**：当 `buffer` 为空或 `buffer_size` 不足时，返回所需字节数（含 NUL），不写入数据。调用方可据此分配足够空间后再次调用。

```c
// 第一阶段：查询所需字节数
int needed = yaml_get("config", "server.port", NULL, 0);
// needed >= 2

// 第二阶段：分配 buffer 并读取
char* buf = malloc(needed);
int rc = yaml_get("config", "server.port", buf, needed);
// rc == 1, buf == "8080"
free(buf);
```

---

### 强制字符串存储（`yaml_set_str`）

:::warning
v2.3 开始支持。
:::

```c
int yaml_set_str(const char* file_name, const char* key_path, const char* value);
```

与 `yaml_set` 类似，但**强制将 value 作为字符串存储**，不尝试 JSON/YAML 解析。

```c
yaml_set_str("config", "user.id", "12345");
// 存为字符串 "12345"，而非数字 12345
```

---

### 获取值（指针版，`yaml_get_str`）

:::warning
v2.3 开始支持。
:::

```c
char* yaml_get_str(const char* file_name, const char* key_path);
```

获取指定路径的值，返回 JSON 字符串指针。内部使用 `CoTaskMemAlloc` 分配内存，**调用方必须用 `CoTaskMemFree` 释放**。

```c
char* ptr = yaml_get_str("config", "app.title");
if (ptr) {
    printf("title: %s\n", ptr);
    CoTaskMemFree(ptr);  // 必须释放
}
```

路径不存在时返回 `NULL`。

---

### 读取整个文件（`yaml_get_all`）

:::warning
v2.3 开始支持。
:::

```c
int yaml_get_all(const char* file_name, char* buffer, size_t buffer_size);
```

读取整个 YAML 文件，以 JSON 字符串写入 `buffer`。支持两阶段查询（buffer 不足时返回所需字节数）。

:::info
**文件不存在时返回 `{}` 且 rc 为 `1`（无 `0` 返回路径）**，因此「返回值语义」表中的「`0`=文件不存在」对本函数不适用。
:::

---

### 检查路径是否存在（`yaml_has`）

:::warning
v2.3 开始支持。
:::

```c
int yaml_has(const char* file_name, const char* key_path);
```

检查路径是否存在。返回 `1` 存在，`0` 不存在；此外还可能返回 `-1`（IO/参数错误）、`-4`（格式解析失败）。

---

### 删除路径（`yaml_delete`）

:::warning
v2.3 开始支持。
:::

```c
int yaml_delete(const char* file_name, const char* key_path);
```

删除指定路径的键或数组元素。

> 注意：当前实现删除数组元素后，后续元素会**前移**（`Vec::remove` 语义）；后续版本可能调整为留空，请勿依赖该行为。

---

### 清空文件（`yaml_clear`）

:::warning
v2.3 开始支持。
:::

```c
int yaml_clear(const char* file_name);
```

清空文件内容为 `{}`。

---

### 删除文件（`yaml_delete_file`）

:::warning
v2.3 开始支持。
:::

```c
int yaml_delete_file(const char* file_name);
```

删除数据文件，同时清理关联的锁文件和临时文件。

---

### 列出 key（`yaml_keys`）

:::warning
v2.3 开始支持。
:::

```c
int yaml_keys(const char* file_name, const char* key_path, char* buffer, size_t buffer_size);
```

列出指定路径下的所有 key，以 JSON 数组写入 `buffer`。

- 映射类型：返回 key 字符串数组，如 `["name", "age", "active"]`
- 数组类型：返回索引数组，如 `[0, 1, 2]`
- `key_path` 为空字符串时，查询根节点

支持两阶段查询。

---

### 返回长度（`yaml_len`）

:::warning
v2.3 开始支持。
:::

```c
int yaml_len(const char* file_name, const char* key_path);
```

返回映射的 key 数量或数组的长度。`key_path` 为空字符串时，查询根节点。

- 返回 `≥ 0`：长度
- 返回 `-1`：IO/参数错误
- 返回 `-2`：目标非映射/非数组
- 返回 `-4`：格式解析失败

> 注意：**路径不存在时返回 `0`**，故 `0` 存在二义性（空映射/空数组 或 路径不存在），可配合 `yaml_has` 区分。

---

## 文件安全

:::warning
2.3 强化了写入安全：原子写入、文件锁、序列化失败不写盘。
:::

- **路径穿越防护**：`file_name` 不允许包含 `\`、`/`、`..`、`:`。
- **原子写入**：先写临时文件，再 rename，Windows 下加重试，避免写入中断损坏文件。
- **文件锁**：使用 `CreateFileW` + `LockFileEx`，排他锁用于写操作，共享锁用于读操作。
- **序列化安全**：序列化失败时返回 `-1` 且**不写盘**，避免清空已有文件。

> 内部实现自 2.3 起由 `serde_yaml` 迁移至 `serde_yml`。

---

## Python 调用示例

```python
import ctypes
import json
from ctypes import c_char_p, c_int, c_void_p, c_size_t

dll = ctypes.WinDLL("JadeView.dll")

# 绑定
dll.yaml_set.argtypes = [c_char_p, c_char_p, c_char_p]
dll.yaml_set.restype = c_int
dll.yaml_get.argtypes = [c_char_p, c_char_p, c_char_p, c_size_t]
dll.yaml_get.restype = c_int
dll.yaml_get_str.argtypes = [c_char_p, c_char_p]
dll.yaml_get_str.restype = c_void_p  # 必须用 c_void_p，不能用 c_char_p
dll.yaml_has.argtypes = [c_char_p, c_char_p]
dll.yaml_has.restype = c_int

# 写入
dll.yaml_set(b"config", b"app.name", b"MyApp")
dll.yaml_set(b"config", b"app.version", b"1.0")

# 读取
buf = ctypes.create_string_buffer(1024)
rc = dll.yaml_get(b"config", b"app.name", buf, ctypes.sizeof(buf))
if rc == 1:
    name = json.loads(buf.value.decode("utf-8"))
    print(f"app.name = {name}")

# yaml_get_str（注意释放）
ptr = dll.yaml_get_str(b"config", b"app.name")
if ptr:
    val = json.loads(ctypes.string_at(ptr).decode("utf-8"))
    ctypes.windll.ole32.CoTaskMemFree(ctypes.c_void_p(ptr))
    print(f"app.name = {val}")

# 检查存在
if dll.yaml_has(b"config", b"app.name") == 1:
    print("app.name exists")
```
