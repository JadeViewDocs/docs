---
order: 3
---

# Application packaging

Packaging a JadeUI Python app is usually two steps:

1. **Front-end assets**: plaintext JAPK (development) or a [JadePack](/jadepack) signed package (production)
2. **Python host**: `jadeui build` into a standalone `.exe` (Nuitka by default, PyInstaller optional)

See [CLI](./cli) for the full command surface and project conventions.

## Front-end assets (JAPK)

```bash
# Requires Node.js and: npm install -g @electron/asar
jadeui japk
jadeui japk --src web -o dist/my-app.japk
```

Load at runtime:

```python
from jadeui import Window

Window(title="My App").run(japk="dist/my-app.japk")
```

Or via `LocalServer`:

```python
from jadeui import LocalServer

server = LocalServer()
url = server.start("myapp", japk="dist/my-app.japk")
```

:::info{title="Plaintext vs production"}
`jadeui japk` produces an Electron ASAR-compatible plaintext package for development / internal tools. For signed and obfuscated production packages, use [JadePack](/jadepack). Format details: [JAPK](/docs/api/japk).
:::

## Host exe (`jadeui build`)

### Install a packager

:::warning{title="Important: Nuitka 4.0rc7 recommended"}
Nuitka's stable 2.x onefile mode may omit the VC++ runtime, so the exe can fail on a clean Windows machine (`vcruntime140.dll` missing).

**Nuitka 4.0rc7** fixes this with a statically linked onefile bootstrap.
:::

```bash
# Recommended (onefile does not need VC++ runtime on the target)
pip install https://github.com/HG-ha/jadeui/raw/main/scripts/nuitka-4.0.rc7.zip

# Or PyPI stable (onefile may need VC++ runtime on the target)
pip install nuitka

# Optional: PyInstaller
pip install jadeui[pyinstaller]
```

Toolchain checks:

```bash
pip install jadeui[dev]
jadeui doctor
```

### Basic usage

```bash
jadeui build
jadeui build app.py
jadeui build app.py -o MyApp
jadeui build --packager pyinstaller
jadeui build -i app.ico -o MyApp --output-dir dist
jadeui build --include-data-dir assets=assets --console
jadeui build --no-onefile -c 2
```

Defaults:

- Onefile mode
- Compress level 1 (basic LTO)
- Auto-include JadeView DLL (matched to the current Python arch: `x86` / `x64` / `arm64`)
- Auto-include sibling `web/` when present
- Auto-use `web/favicon.png` as icon when present
- Without `-o`, the output name follows `pyproject.toml` (see [CLI conventions](./cli#project-conventions-pyprojecttoml))

### Flags

| Flag | Description |
|------|-------------|
| `source` | Python entry (default `tool.jadeui.entry` or `app.py`) |
| `--packager` | `nuitka` (default) or `pyinstaller` |
| `-i, --icon` | Icon (`.ico` / `.png`) |
| `-o, --output` | Output basename (no extension) |
| `--output-dir` | Output directory (default `dist`) |
| `--include-data-dir` | Data dir mapping `src=dest` (repeatable) |
| `--include-data-file` | Data file mapping `src=dest` (repeatable) |
| `--console` | Show a console window |
| `--upx` | Enable UPX (Nuitka) |
| `--no-jadeui-dll` | Do not auto-include JadeView DLL |
| `-c, --compress` | Nuitka compress level `0-3` (default `1`) |
| `--no-onefile` | Directory build instead of onefile |

### Compress levels (Nuitka)

| Level | Notes | Speed | Size |
|------|-------|-------|------|
| 0 | No extra compression | Fastest | Largest |
| 1 | Basic LTO | Fast | Larger |
| 2 | LTO + strip docstrings / asserts | Slower | Smaller |
| 3 | Full opts + Python `-OO` | Slowest | Smallest |

`-c 2` is a good daily default.

## Suggested layout

```
my_app/
├── app.py
├── pyproject.toml      # [project] + [tool.jadeui]
├── web/                # front end (auto-included / japk source)
│   ├── index.html
│   └── favicon.png
└── assets/             # extra data (pass --include-data-dir)
```

## End-to-end example

```bash
jadeui init my-app --frontend html
cd my-app
jadeui doctor
jadeui run
jadeui japk
jadeui build -o MyApp -c 2
```

Typical output:

```
dist/
├── my-app.japk    # front-end assets (if you ran japk)
└── MyApp.exe      # host executable
```

## Legacy script

`scripts/build.py` in the repo still forwards to the same implementation. New projects should call `jadeui build` directly.

## FAQ

### Q: Missing DLL / VC++ runtime after packaging?

**A:** Prefer Nuitka 4.0rc7, and make sure the bundled JadeView DLL matches the Python interpreter architecture used for the build.

### Q: Does the SDK auto-upgrade JadeView?

**A:** Only within the adapted release tag (for example builds under `v2.3.0`). It will not jump to `2.4` automatically.

### Q: How do I shrink the binary?

**A:** Raise `-c`, optionally `--upx`, drop unused data dirs, or use an older Python.

### Q: `web/` was not included?

**A:** Keep `web` next to the entry script, or pass `--include-data-dir`.

### Q: How do I debug the packaged app?

**A:**

```bash
jadeui build app.py --console
```

During development, enable DevTools / context menu:

```python
app.initialize(enable_dev_tools=True)
window = Window(disable_right_click=False, ...)
```

## Links

- [CLI](./cli)
- [JAPK](/docs/api/japk)
- [JadePack](/jadepack)
- [Nuitka docs](https://nuitka.net/doc/user-manual.html)
- [JadeUI GitHub](https://github.com/HG-ha/Jadeui)
