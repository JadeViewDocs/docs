---
title: 用 MCP 接入 AI
order: 1
group:
  title: "工具"
  order: 1
---

# 用 MCP 接入 AI

JadeView 文档已接入 **MCP（Model Context Protocol）**。在支持 MCP 的 AI 工具（Claude Code、Claude Desktop、Cursor、Cherry Studio 等）里加上下面这台 MCP server，就能让 AI **直接检索 JadeView 官方文档**来回答问题，而不必复制粘贴或凭记忆作答。

## 配置

把下面这段加进你的 AI 工具的 MCP 配置：

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

:::info{title=说明}
这是一台**只读检索** server，URL 里的 token 是公开的 search-only 密钥，可放心分享。它只能搜索 jade.run 的公开文档，不涉及任何写操作或私有数据。
:::

## 各客户端放哪里

- **Claude Code**：命令行一行接入（注意 Claude Code 用 `--transport http`）：

  ```bash
  claude mcp add --transport http jade_view https://WETBQUB2XL.algolia.net/mcp/1/iBPttr-BRpSm28UT8VkQHg/mcp
  ```

  或写进项目根的 `.mcp.json`（Claude Code 用 `"type": "http"`）：

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

- **Claude Desktop / Cursor / Cherry Studio**：在各自的 MCP 设置（`mcpServers`）里粘贴上面第一段 JSON 即可。

## 能做什么

接入后，AI 可对 JadeView 文档做全文检索，返回**最相关的文档片段**（标题层级、所在页面链接、正文摘要）。例如直接问：

> JadeView 怎么自定义标题栏？`frame_style` 有哪些取值？

AI 会先检索文档、引用 jade.run 上对应章节再作答。

:::warning{title=检索不到最新内容？}
文档索引由爬虫定期更新。如果刚发布的内容暂时搜不到，等下一次索引刷新即可。
:::
