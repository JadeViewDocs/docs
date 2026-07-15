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
      "url": "https://mcp.jade.run/mcp",
      "transport": "http"
    }
  }
}
```

:::info{title=说明}
这是一台**只读检索** server，无需登录、无需 token，可放心分享。它只能搜索 jade.run 的公开文档，不涉及任何写操作或私有数据。
:::

## 各客户端放哪里

- **Claude Code**：命令行一行接入（注意 Claude Code 用 `--transport http`）：

  ```bash
  claude mcp add --transport http jade_view https://mcp.jade.run/mcp
  ```

  或写进项目根的 `.mcp.json`（Claude Code 用 `"type": "http"`）：

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

- **Claude Desktop / Cursor / Cherry Studio**：在各自的 MCP 设置（`mcpServers`）里粘贴上面第一段 JSON 即可。

## 能做什么

接入后，AI 有两件工具可用：

- **`search_docs`** —— 全文检索（中英文都支持），返回最相关的文档片段：标题层级、所在页面链接、正文摘要。
- **`get_doc`** —— 读取整页完整 markdown，拿到完整的 API 签名与代码示例。

典型流程是 AI 先 `search_docs` 找到相关章节，再按需 `get_doc` 读全文。例如直接问：

> JadeView 怎么自定义标题栏？`frame_style` 有哪些取值？

AI 会先检索文档、引用 jade.run 上对应章节，必要时读取整页，再作答。

:::warning{title=检索不到最新内容？}
文档索引在服务启动时根据文档源构建。刚发布的内容若暂时搜不到，等服务随下一次文档发版重新部署后即可检索到。
:::
