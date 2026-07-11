---
order: 2
---

# Application Packaging

This guide explains how to package a JadeUI Python application into a standalone executable (.exe).

## Packaging Tool

JadeUI provides a packaging script based on [Nuitka](https://nuitka.net/) that can package a Python application into a standalone executable, without requiring Python to be installed on the target system.

## Installing Nuitka

:::warning{title="Important: Nuitka 4.0rc7 Recommended"}
The onefile mode of Nuitka's official stable release (2.x) has a bug where the VC++ runtime is not packaged correctly, causing the generated exe to fail to run on a clean Windows system (missing `vcruntime140.dll`).

**Nuitka 4.0rc7** fixes this issue; the onefile bootstrap uses static linking.
:::

Install the recommended version:

```bash
pip install https://github.com/HG-ha/jadeui/raw/main/scripts/nuitka-4.0.rc7.zip
```

Or install the PyPI stable release (onefile requires the VC++ runtime on the target system):

```bash
pip install nuitka
```

## Installing the Build Environment
```bash
pip install jadeui[dev]
```

## Downloading the Packaging Script

Download the packaging script from GitHub:

```bash
# Download build.py
curl -O https://raw.githubusercontent.com/HG-ha/Jadeui/main/scripts/build.py
```

Or visit it directly: [build.py](https://github.com/HG-ha/Jadeui/blob/main/scripts/build.py)

## Basic Usage

### The Simplest Packaging

```bash
python build.py app.py
```

This packages using the default configuration:
- Single-file mode (onefile)
- Compression level 1 (basic LTO optimization)
- Automatically includes the JadeUI DLL
- The DLL matches the Python interpreter architecture: 32-bit Python uses the x86 DLL, 64-bit Python uses the x64 DLL, and ARM64 Python uses the arm64 DLL
- Automatically includes the `web` directory (if present)
- Automatically uses `web/favicon.png` as the icon (if present)

### Specifying the Output File Name

```bash
python build.py app.py --output MyApp
```

### Using a Custom Icon

```bash
python build.py app.py --icon custom.ico
```

### Setting the Compression Level

```bash
python build.py app.py -c 2  # Medium compression (recommended)
python build.py app.py -c 3  # Maximum compression
```

### Packaging into a Directory (Non-Single-File)

```bash
python build.py app.py --no-onefile
```

### Including Additional Data Directories

```bash
python build.py app.py --include-data-dir assets=assets
```

## Command-Line Parameters

| Parameter | Description |
|------|------|
| `source` | The Python source file to compile |
| `-i, --icon` | Application icon file (.ico or .png) |
| `-o, --output` | Output executable name (without the .exe extension) |
| `--output-dir` | Output directory (default: dist) |
| `--include-data-dir` | Include a data directory, format: source_dir=target_dir (can be used multiple times) |
| `--include-data-file` | Include a data file, format: source_file=target_file (can be used multiple times) |
| `--console` | Show the console window (hidden by default) |
| `--upx` | Enable UPX compression |
| `--no-jadeui-dll` | Do not automatically include the JadeUI DLL |
| `-c, --compress` | Compression level 0-3 (default: 1) |
| `--no-onefile` | Do not package as a single file; generate a directory |

## Compression Level Description

| Level | Description | Compile Speed | File Size |
|------|------|----------|----------|
| 0 | No compression | Fastest | Largest |
| 1 | Basic optimization (LTO enabled) | Faster | Larger |
| 2 | Medium compression (LTO + remove docstrings and asserts) | Slower | Smaller |
| 3 | Maximum compression (all optimizations + Python -OO mode) | Slowest | Smallest |

**Level 2 is recommended**, striking a balance between file size and compile time.

## Project Structure Recommendation

Recommended project structure:

```
my_app/
├── app.py              # Main program entry point
├── web/                # Web frontend files (automatically included)
│   ├── index.html
│   ├── favicon.png     # Automatically used as the icon
│   ├── css/
│   └── js/
├── assets/             # Other resources (must be specified manually if present)
└── build.py            # Packaging script
```

## Complete Packaging Example

```bash
# Recommended packaging command
python build.py app.py --output myapp

# Package additional resource directories
python build.py app.py --output myapp --include-data-dir assets=assets
```

Output:

```
============================================================
JadeUI Application Packaging
============================================================
Source file: app.py
Output directory: dist
Output file: MyApp.exe
Packaging mode: single file (onefile)
Compression level: 2 - medium compression (LTO + no docs/asserts)
Icon: web/favicon.ico
JadeUI DLL: 2 files
Data directory: ['assets=assets']
============================================================
```

## Packaged Files

After packaging completes, the executable is generated in the `dist` directory:

```
dist/
└── MyApp.exe    # Standalone executable, ready to distribute
```

## Frequently Asked Questions

### Q: The packaged program won't run and reports a missing DLL?

**A:** This is usually because the onefile mode of the Nuitka 2.x stable release was used. Please upgrade to Nuitka 4.0rc7:

```bash
pip install https://github.com/HG-ha/jadeui/raw/main/scripts/nuitka-4.0.rc7.zip
```

Also make sure the packaged JadeView DLL matches the Python interpreter architecture. JadeUI selects `x86` / `x64` / `arm64` based on the interpreter, not the operating system bitness.

### Q: Does the SDK automatically upgrade to the latest JadeView?

**A:** Only within the release tag that the SDK has adapted to. For example, the current SDK targets `v2.3.0-beta.10` and can automatically use later build revisions in the same tag, but it will not automatically jump to `2.4` or another release tag. Minor/major upgrades require an explicit SDK ABI/API adaptation first.

### Q: How can I reduce the size of the packaged file?

**A:**
1. Use a higher compression level: `-c 3`
2. Enable UPX compression: `--upx` (requires UPX to be installed)
3. Make sure no unnecessary files are included
4. Use a lower version of Python, such as Python 3.8

### Q: The web directory wasn't automatically included?

**A:** Make sure the `web` directory is located in the same directory as the source file. If it is elsewhere, specify it manually with `--include-data-dir`.

### Q: How do I debug the packaged program?

**A:** Add the `--console` parameter to show the console window so you can see error output:

```bash
python build.py app.py --console
```
**B:** Enable developer tools
```python
app.initialize(
    enable_dev_tools=False,  # Whether to enable developer tools (F12)
)
```

**C:** Allow the right-click menu
```python
window = Window(
    disable_right_click=False,
)
```

### Q: The packaging process is very slow?

**A:**
- Use a lower compression level (`-c 0` or `-c 1`)
- The first packaging needs to download dependencies; subsequent runs are faster
- Consider using `--no-onefile` to package in directory mode (faster)

## Reference Links

- [Packaging script source](https://github.com/HG-ha/Jadeui/blob/main/scripts/build.py)
- [Nuitka Official Documentation](https://nuitka.net/doc/user-manual.html)
- [JadeUI GitHub Repository](https://github.com/HG-ha/Jadeui)
