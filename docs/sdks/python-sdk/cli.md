---
order: 2
---

# CLI 工具

安装 `jadeui` 后可使用统一命令行入口。旧命令 `jadeui-download`、`jadeui-clean` 仍然可用。

```bash
jadeui -V                 # SDK 版本
jadeui --help
jadeui <command> --help   # 子命令完整参数
```

## 快速流程

```bash
jadeui init my-app --frontend html   # 也可选 vue / react
cd my-app
jadeui doctor                        # 检查 Python / DLL / Nuitka / Node+asar
jadeui run                           # 开发运行
jadeui japk                          # 前端明文 JAPK（需 @electron/asar）
jadeui build                         # 宿主 exe（默认 Nuitka）
```

## 子命令

### init — 初始化项目

```bash
jadeui init my-app
jadeui init my-app --frontend html
jadeui init my-app --frontend vue --title "My App"
jadeui init . --frontend react --force
```

| 参数 | 说明 |
|------|------|
| `name` | 项目目录（默认 `.` 表示当前目录） |
| `--frontend` | `html` / `vue` / `react`（TTY 可交互选择；非交互默认 `html`） |
| `--force` | 覆盖已存在文件 |
| `--title` | 窗口标题（默认由项目名推导） |

`vue` / `react` 脚手架生成后需先：

```bash
cd frontend && npm install && npm run build && cd ..
```

Vite 构建产物默认输出到 `web/`，供 JadeUI 加载。

### run — 开发运行

```bash
jadeui run
jadeui run app.py
jadeui run --hot-reload
```

| 参数 | 说明 |
|------|------|
| `script` | 入口脚本（默认见下方「项目约定」） |
| `--hot-reload` | 仅设置环境变量 `JADEUI_HOT_RELOAD=1`（应用需自行读取以启用热重载） |

### doctor — 环境检查

```bash
jadeui doctor
```

检查 Python / 架构、jadeui 与 JadeView DLL、Nuitka、PyInstaller、编译器、Node.js / npm / asar 等。DLL 缺失视为阻断项。

### japk — 打包前端资源

将 HTML/CSS/JS 打成 **明文 ASAR 兼容** `.japk`（不是 Python exe）。官方说明见 [JAPK](/docs/api/japk)。

```bash
# 需已安装 Node.js，并执行: npm install -g @electron/asar
jadeui japk
jadeui japk --src web -o dist/my-app.japk
jadeui japk --list dist/my-app.japk
```

| 参数 | 说明 |
|------|------|
| `--src` | 前端目录（默认 `tool.jadeui.frontend` 或 `web`） |
| `-o, --output` | 输出路径（默认 `dist/<项目名>.japk`） |
| `--list` | 列出已有 JAPK 内容 |

生产环境的签名 / 混淆包请使用 [JadePack](/jadepack) 桌面客户端。

### build — 打包宿主 exe

详见 [应用打包](./packaging)。

```bash
jadeui build
jadeui build app.py -o MyApp
jadeui build --packager pyinstaller
```

### download — 下载原生库

```bash
jadeui download
jadeui download --build 26G02
jadeui download -a x64 --check
```

| 参数 | 说明 |
|------|------|
| `-v, --version` | DLL 版本（默认 SDK 适配版本） |
| `-a, --arch` | `x86` / `x64` / `arm64`（默认跟随当前 Python） |
| `-b, --build` | 构建号（默认同版本最新） |
| `--no-latest-build` | 不查询同版本最新构建号 |
| `-d, --dir` | 安装目录 |
| `--check` | 仅检查本机是否已有 DLL |

自动更新只限同一 release tag 内的 build；不会跨到 `2.4` 等未适配版本。

### clean — 清理缓存

```bash
jadeui clean
```

清理 `jadeui` 包内的 `__pycache__`。

## 项目约定（pyproject.toml）

未在命令行显式传入的参数，会按以下优先级解析：

**CLI 显式参数 → `[tool.jadeui]` → `[project].name` → 内置默认值**

`jadeui init` 会生成最小配置，例如：

```toml
[project]
name = "my-app"
version = "0.1.0"
description = "My App"
requires-python = ">=3.7"

[tool.jadeui]
entry = "app.py"
# output = "MyApp"          # 可选；不写则用 project.name
# icon = "web/favicon.png"
frontend = "web"
# packager = "nuitka"       # 或 pyinstaller
```

| 字段 | 作用于 |
|------|--------|
| `entry` | `run` / `build` 默认入口 |
| `output` / `name` | `build` / `japk` 默认输出基名（`name` 为 `output` 别名） |
| `icon` | `build` 默认图标 |
| `frontend` | `japk --src` |
| `packager` | `build --packager` |

说明：

- 与 **uv / conda / Poetry** 共用同一份 `pyproject.toml` 时互不冲突；JadeUI 只读写 `[tool.jadeui]`，不碰锁文件或环境创建流程。
- 仅当 pyproject 位于当前项目目录，或祖先目录中含有 `[tool.jadeui]` 时才会被采用，避免在 SDK 仓库内误继承根包名。
