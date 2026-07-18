---
order: 2
---

# CLI

After installing `jadeui`, use the unified CLI. Legacy entry points `jadeui-download` and `jadeui-clean` still work.

```bash
jadeui -V                 # SDK version
jadeui --help
jadeui <command> --help   # full flags for a subcommand
```

## Quick workflow

```bash
jadeui init my-app --frontend html   # or vue / react
cd my-app
jadeui doctor                        # check Python / DLL / Nuitka / Node+asar
jadeui run                           # run in development
jadeui japk                          # plaintext JAPK (needs @electron/asar)
jadeui build                         # host exe (Nuitka by default)
```

## Subcommands

### init — scaffold a project

```bash
jadeui init my-app
jadeui init my-app --frontend html
jadeui init my-app --frontend vue --title "My App"
jadeui init . --frontend react --force
```

| Argument | Description |
|----------|-------------|
| `name` | Project directory (default `.` = current directory) |
| `--frontend` | `html` / `vue` / `react` (interactive on TTY; non-interactive default `html`) |
| `--force` | Overwrite existing files |
| `--title` | Window title (derived from project name by default) |

For `vue` / `react`, build the frontend first:

```bash
cd frontend && npm install && npm run build && cd ..
```

Vite output goes to `web/` for JadeUI to load.

### run — development run

```bash
jadeui run
jadeui run app.py
jadeui run --hot-reload
```

| Argument | Description |
|----------|-------------|
| `script` | Entry script (see Project conventions below) |
| `--hot-reload` | Sets `JADEUI_HOT_RELOAD=1` only (your app must read it) |

### doctor — environment check

```bash
jadeui doctor
```

Checks Python / arch, jadeui + JadeView DLL, Nuitka, PyInstaller, compilers, Node.js / npm / asar. Missing DLL is treated as a blocker.

### japk — pack front-end assets

Packs HTML/CSS/JS into a **plaintext ASAR-compatible** `.japk` (not a Python exe). See [JAPK](/docs/api/japk).

```bash
# Requires Node.js and: npm install -g @electron/asar
jadeui japk
jadeui japk --src web -o dist/my-app.japk
jadeui japk --list dist/my-app.japk
```

| Argument | Description |
|----------|-------------|
| `--src` | Front-end directory (default `tool.jadeui.frontend` or `web`) |
| `-o, --output` | Output path (default `dist/<project-name>.japk`) |
| `--list` | List contents of an existing JAPK |

For signed / obfuscated production packages, use the [JadePack](/jadepack) desktop client.

### build — pack host exe

See [Application packaging](./packaging). Missing Nuitka / PyInstaller is **installed automatically** (disable with `--no-auto-deps`).

```bash
jadeui build
jadeui build app.py -o MyApp
jadeui build --packager pyinstaller
```

### download — download native libraries

```bash
jadeui download
jadeui download --build 26G02
jadeui download -a x64 --check
```

| Argument | Description |
|----------|-------------|
| `-v, --version` | DLL version (SDK-adapted version by default) |
| `-a, --arch` | `x86` / `x64` / `arm64` (follows current Python by default) |
| `-b, --build` | Build id (latest for the same tag by default) |
| `--no-latest-build` | Do not query the latest build within the tag |
| `-d, --dir` | Install directory |
| `--check` | Only check whether a DLL is already present |

Auto-updates stay within the same release tag; they never jump to unadapted versions such as `2.4`.

### clean — clear caches

```bash
jadeui clean
```

Removes `__pycache__` under the installed `jadeui` package.

## Project conventions (`pyproject.toml`)

When a CLI flag is omitted, values resolve in this order:

**Explicit CLI args → `[tool.jadeui]` → `[project].name` → built-in defaults**

`jadeui init` writes a minimal file, for example:

```toml
[project]
name = "my-app"
version = "0.1.0"
description = "My App"
requires-python = ">=3.7"

[tool.jadeui]
entry = "app.py"
# output = "MyApp"          # optional; falls back to project.name
# icon = "web/favicon.png"
frontend = "web"
# packager = "nuitka"       # or pyinstaller
```

| Field | Used by |
|-------|---------|
| `entry` | Default entry for `run` / `build` |
| `output` / `name` | Default output basename for `build` / `japk` (`name` aliases `output`) |
| `icon` | Default icon for `build` |
| `frontend` | `japk --src` |
| `packager` | `build --packager` |

Notes:

- Safe to share one `pyproject.toml` with **uv / conda / Poetry**. JadeUI only uses `[tool.jadeui]` and does not manage lockfiles or environments.
- A parent `pyproject.toml` without `[tool.jadeui]` is ignored so SDK/monorepo roots are not inherited by accident.
