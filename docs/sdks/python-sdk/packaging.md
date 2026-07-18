---
order: 3
---

# 应用打包

将 JadeUI Python 应用打包为可分发产物时，通常分为两步：

1. **前端资源**：明文 JAPK（开发）或 [JadePack](/jadepack) 签名包（生产）
2. **Python 宿主**：`jadeui build` 打成独立 `.exe`（默认 Nuitka，可选 PyInstaller）

CLI 总览与项目约定见 [CLI 工具](./cli)。

## 前端资源（JAPK）

```bash
# 需已安装 Node.js，并执行: npm install -g @electron/asar
jadeui japk
jadeui japk --src web -o dist/my-app.japk
```

运行时加载示例：

```python
from jadeui import Window

Window(title="My App").run(japk="dist/my-app.japk")
```

或通过 `LocalServer`：

```python
from jadeui import LocalServer

server = LocalServer()
url = server.start("myapp", japk="dist/my-app.japk")
```

:::info{title="明文 vs 生产包"}
`jadeui japk` 生成的是 Electron ASAR 兼容明文包，适合开发 / 内部工具。生产签名与混淆请使用 [JadePack](/jadepack)。通用格式说明见 [JAPK](/docs/api/japk)。
:::

## 宿主 exe（jadeui build）

### 安装打包器

:::warning{title="重要：推荐使用 Nuitka 4.0rc7"}
Nuitka 官方稳定版 (2.x) 的 onefile 模式存在 bug，没有正确打包 VC++ 运行时，导致生成的 exe 在纯净 Windows 上可能缺少 `vcruntime140.dll`。

**Nuitka 4.0rc7** 修复了此问题（onefile bootstrap 静态链接）。
:::

```bash
# 推荐（onefile 无需目标机 VC++ 运行时）
pip install https://github.com/HG-ha/jadeui/raw/main/scripts/nuitka-4.0.rc7.zip

# 或 PyPI 稳定版（onefile 可能需要目标机 VC++ 运行时）
pip install nuitka

# 可选：PyInstaller
pip install jadeui[pyinstaller]
```

编译环境（MSVC / clang 等）可配合：

```bash
pip install jadeui[dev]
jadeui doctor
```

### 基本用法

```bash
jadeui build
jadeui build app.py
jadeui build app.py -o MyApp
jadeui build --packager pyinstaller
jadeui build -i app.ico -o MyApp --output-dir dist
jadeui build --include-data-dir assets=assets --console
jadeui build --no-onefile -c 2
```

默认行为：

- 单文件模式（onefile）
- 压缩级别 1（基础 LTO）
- 自动包含 JadeView DLL（按当前 Python 架构匹配 `x86` / `x64` / `arm64`）
- 若存在同级 `web/` 目录则自动包含
- 若存在 `web/favicon.png` 则自动用作图标
- 未指定 `-o` 时，输出名跟随 `pyproject.toml`（见 [CLI 项目约定](./cli#项目约定-pyprojecttoml)）

### 命令行参数

| 参数 | 说明 |
|------|------|
| `source` | Python 入口（默认 `tool.jadeui.entry` 或 `app.py`） |
| `--packager` | `nuitka`（默认）或 `pyinstaller` |
| `-i, --icon` | 图标（`.ico` / `.png`） |
| `-o, --output` | 输出可执行文件名（不含扩展名） |
| `--output-dir` | 输出目录（默认 `dist`） |
| `--include-data-dir` | 数据目录，`源=目标`（可多次） |
| `--include-data-file` | 数据文件，`源=目标`（可多次） |
| `--console` | 显示控制台窗口 |
| `--upx` | 启用 UPX（Nuitka） |
| `--no-jadeui-dll` | 不自动包含 JadeView DLL |
| `-c, --compress` | Nuitka 压缩级别 `0-3`（默认 `1`） |
| `--no-onefile` | 打包为目录而非单文件 |

### 压缩级别（Nuitka）

| 级别 | 说明 | 编译速度 | 文件大小 |
|------|------|----------|----------|
| 0 | 不额外压缩 | 最快 | 最大 |
| 1 | 基础优化（LTO） | 较快 | 较大 |
| 2 | LTO + 移除 docstring / assert | 较慢 | 较小 |
| 3 | 全部优化 + Python `-OO` | 最慢 | 最小 |

推荐日常使用 `-c 2`。

## 推荐项目结构

```
my_app/
├── app.py
├── pyproject.toml      # [project] + [tool.jadeui]
├── web/                # 前端（自动包含 / japk 源）
│   ├── index.html
│   └── favicon.png
└── assets/             # 其它资源（需 --include-data-dir）
```

## 完整示例

```bash
jadeui init my-app --frontend html
cd my-app
jadeui doctor
jadeui run
jadeui japk
jadeui build -o MyApp -c 2
```

输出示例：

```
dist/
├── my-app.japk    # 前端资源（若执行了 japk）
└── MyApp.exe      # 宿主可执行文件
```

## 兼容旧脚本

仓库内旧入口 `scripts/build.py` 仍会转发到同一套打包实现，新项目请直接使用 `jadeui build`。

## 常见问题

### Q: 打包后提示缺少 DLL / VC++ 运行时？

**A:** 优先改用 Nuitka 4.0rc7；并确认产物中的 JadeView DLL 与打包时使用的 Python 架构一致（不要用「系统是 64 位」代替「解释器是 64 位」）。

### Q: SDK 会自动升到最新 JadeView 吗？

**A:** 只会在已适配的 release tag 内选择最新 build（例如 `v2.3.0` 下的 `26G02` → 同 tag 后续修订）。不会自动跨到 `2.4`。

### Q: 如何减小体积？

**A:** 提高 `-c`、可选 `--upx`、去掉不必要的数据目录；必要时使用较低版本 Python。

### Q: web 目录没有被自动包含？

**A:** 确保 `web` 与入口脚本同级；否则用 `--include-data-dir` 指定。

### Q: 如何调试打包后的程序？

**A:**

```bash
jadeui build app.py --console
```

并在开发阶段启用 DevTools / 右键菜单：

```python
app.initialize(enable_dev_tools=True)
window = Window(disable_right_click=False, ...)
```

## 参考链接

- [CLI 工具](./cli)
- [JAPK](/docs/api/japk)
- [JadePack](/jadepack)
- [Nuitka 文档](https://nuitka.net/doc/user-manual.html)
- [JadeUI GitHub](https://github.com/HG-ha/Jadeui)
