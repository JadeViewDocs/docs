---
title: Connect AI via MCP
order: 1
group:
  title: "Tools"
  order: 1
---

# Connect AI via MCP

The JadeView docs ship an official **MCP (Model Context Protocol)** server — the npm package [`jadeview-docs-mcp`](https://www.npmjs.com/package/jadeview-docs-mcp) with the docs bundled inside. Add this server to any MCP-capable AI tool (Claude Code, Claude Desktop, Cursor, ZCode, Cherry Studio, etc.), and the AI can **search the official JadeView docs directly** to answer your questions, instead of relying on copy-paste or memory.

## Configuration

Add the following snippet to your AI tool's MCP configuration:

```json
{
  "mcpServers": {
    "jade_view": {
      "command": "npx",
      "args": ["-y", "jadeview-docs-mcp"]
    }
  }
}
```

:::info{title=Note}
This is a **local read-only search** server: on first run npx downloads and caches it automatically (the markdown docs ship inside the package, so it even starts offline afterwards). No login or token is required. It can only search the public JadeView docs, and it involves no write operations or private data.
:::

## npm mirror in mainland China

If pulling packages from the npm registry is slow or blocked in your network, switch to the npmmirror mirror — either of:

```bash
# Option 1: this run only
npx -y --registry=https://registry.npmmirror.com jadeview-docs-mcp

# Option 2: switch globally (affects all npm / npx operations)
npm config set registry https://registry.npmmirror.com
```

Or add a line `registry=https://registry.npmmirror.com` to the `.npmrc` in your user directory.

:::warning{title=Mirror sync delay}
npmmirror syncs new versions from the official registry with a few minutes' delay; a just-published version may be missing from the mirror for a short while — simply retry later.
:::

## Where to put it in each client

- **Claude Code**: connect with a single command line:

  ```bash
  claude mcp add jade_view -- npx -y jadeview-docs-mcp
  ```

  Or add it to the `.mcp.json` at your project root:

  ```json
  {
    "mcpServers": {
      "jade_view": {
        "command": "npx",
        "args": ["-y", "jadeview-docs-mcp"]
      }
    }
  }
  ```

- **Claude Desktop / Cursor / ZCode / Cherry Studio**: just paste the first JSON snippet above into their respective MCP settings (`mcpServers`).

## What it can do

Once connected, the AI has two tools available:

- **`search_docs`** — full-text search (both Chinese and English), returning the most relevant doc snippets: heading hierarchy, a link to the page, and a summary of the body text.
- **`get_doc`** — read the full markdown of a whole page to get complete API signatures and code samples.

The typical flow is: the AI first calls `search_docs` to find the relevant sections, then `get_doc` to read the full page when needed. For example, you can simply ask:

> How do I customize the title bar in JadeView? What values can `frame_style` take?

The AI will first search the docs, cite the corresponding section on jade.run, read the full page if needed, and then answer.

:::warning{title=Can't find the latest content?}
The docs index ships with the npm package and is built when the process starts. `npx -y` resolves the latest version on every run, so newly released docs are usually available right away; if a cached copy gets in the way, pin the latest version explicitly (e.g. `jadeview-docs-mcp@<version>`).
:::
