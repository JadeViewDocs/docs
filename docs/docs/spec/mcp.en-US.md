---
title: Connect AI via MCP
order: 1
group:
  title: "Tools"
  order: 1
---

# Connect AI via MCP

The JadeView docs are now available over **MCP (Model Context Protocol)**. Add the MCP server below to any MCP-capable AI tool (Claude Code, Claude Desktop, Cursor, Cherry Studio, etc.), and the AI can **search the official JadeView docs directly** to answer your questions, instead of relying on copy-paste or memory.

## Configuration

Add the following snippet to your AI tool's MCP configuration:

```json
{
  "mcpServers": {
    "jade_view": {
      "url": "https://WETBQUB2XL.algolia.net/mcp/1/iBPttr-BRpSm28UT8VkQHg/mcp",
      "transport": "http"
    }
  }
}
```

:::info{title=Note}
This is a **read-only search** server. The token in the URL is a public search-only key, so it is safe to share. It can only search the public docs on jade.run, and it involves no write operations or private data.
:::

## Where to put it in each client

- **Claude Code**: connect with a single command line (note that Claude Code uses `--transport http`):

  ```bash
  claude mcp add --transport http jade_view https://WETBQUB2XL.algolia.net/mcp/1/iBPttr-BRpSm28UT8VkQHg/mcp
  ```

  Or add it to the `.mcp.json` at your project root (Claude Code uses `"type": "http"`):

  ```json
  {
    "mcpServers": {
      "jade_view": {
        "type": "http",
        "url": "https://WETBQUB2XL.algolia.net/mcp/1/iBPttr-BRpSm28UT8VkQHg/mcp"
      }
    }
  }
  ```

- **Claude Desktop / Cursor / Cherry Studio**: just paste the first JSON snippet above into their respective MCP settings (`mcpServers`).

## What it can do

Once connected, the AI can run a full-text search over the JadeView docs and return the **most relevant doc snippets** (heading hierarchy, link to the page they appear on, and a summary of the body text). For example, you can simply ask:

> How do I customize the title bar in JadeView? What values can `frame_style` take?

The AI will first search the docs, cite the corresponding section on jade.run, and then answer.

:::warning{title=Can't find the latest content?}
The docs index is updated periodically by a crawler. If something you just published can't be found yet, just wait for the next index refresh.
:::
