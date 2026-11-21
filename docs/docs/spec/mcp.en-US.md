---
title: Connect AI with MCP
order: 1
group:
  title: "Tools"
  order: 1
---

# Connect AI with MCP

Add a remote MCP server in your client. Choose **Streamable HTTP** and use `https://mcp.jade.run/mcp`.

For clients with an `mcpServers` JSON configuration, use the following entry and match the transport field to your client:

```json
{
  "mcpServers": {
    "jade_view": {
      "type": "http",
      "url": "https://mcp.jade.run/mcp"
    }
  }
}
```

In Claude Code you can also run:

```bash
claude mcp add --transport http jade_view https://mcp.jade.run/mcp
```

- `search_docs` searches Chinese and English documentation and returns excerpts with page links.
- `get_doc` reads a full page by path, including API parameters and examples.

The server is deployed with the documentation site and indexes that deployment's Markdown on startup.
