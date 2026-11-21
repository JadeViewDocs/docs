---
title: 用 MCP 接入 AI
order: 1
group:
  title: "工具"
  order: 1
---

# 用 MCP 接入 AI

在支持 MCP 的客户端中添加远程服务器，传输方式选择 **Streamable HTTP**，地址填写 `https://mcp.jade.run/mcp`。

支持 `mcpServers` JSON 配置的客户端可以使用以下配置（传输字段以客户端为准）：

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

Claude Code 也可以用命令行接入：

```bash
claude mcp add --transport http jade_view https://mcp.jade.run/mcp
```

- `search_docs` 全文检索中英文文档，返回相关片段和页面链接。
- `get_doc` 按路径读取整页文档，包括 API 参数和代码示例。

服务随文档站部署，启动时索引当次发布的 Markdown。
