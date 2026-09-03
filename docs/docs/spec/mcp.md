---
title: 用 MCP 接入 AI
order: 1
group:
  title: "工具"
  order: 1
---

# 用 MCP 接入 AI

JadeView 文档提供官方 **MCP（Model Context Protocol）** 服务——npm 包 [`jadeview-docs-mcp`](https://www.npmjs.com/package/jadeview-docs-mcp)，文档随包分发。在支持 MCP 的 AI 工具（Claude Code、Claude Desktop、Cursor、ZCode、Cherry Studio 等）里加上这台 server，AI 就能**直接检索 JadeView 官方文档**作答，而不必复制粘贴或凭记忆作答。

## 配置

把下面这段加进你的 AI 工具的 MCP 配置：

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

:::info{title=说明}
这是一个**本地只读检索** server：首次运行时 npx 自动从 npm 下载并缓存（文档 markdown 随包分发，之后离线也能启动），无需登录、无需 token。它只能搜索 JadeView 公开文档，不涉及任何写操作或私有数据。
:::

## 国内镜像加速

国内网络环境拉取 npm 包慢或失败时，可改用 npmmirror 镜像源，任选其一：

```bash
# 方式一：仅本次使用
npx -y --registry=https://registry.npmmirror.com jadeview-docs-mcp

# 方式二：全局切换（影响所有 npm / npx 操作）
npm config set registry https://registry.npmmirror.com
```

或在用户目录的 `.npmrc` 里写入一行：`registry=https://registry.npmmirror.com`。

:::warning{title=镜像同步延迟}
npmmirror 从官方源同步新版本有几分钟延迟，刚发版后镜像里暂时找不到最新版本属正常现象，稍后重试即可。
:::

## 各客户端放哪里

- **Claude Code**：命令行一行接入：

  ```bash
  claude mcp add jade_view -- npx -y jadeview-docs-mcp
  ```

  或写进项目根的 `.mcp.json`：

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

- **Claude Desktop / Cursor / ZCode / Cherry Studio**：在各自的 MCP 设置（`mcpServers`）里粘贴上面第一段 JSON 即可。

## 能做什么

接入后，AI 有两件工具可用：

- **`search_docs`** —— 全文检索（中英文都支持），返回最相关的文档片段：标题层级、所在页面链接、正文摘要。
- **`get_doc`** —— 读取整页完整 markdown，拿到完整的 API 签名与代码示例。

典型流程是 AI 先 `search_docs` 找到相关章节，再按需 `get_doc` 读全文。例如直接问：

> JadeView 怎么自定义标题栏？`frame_style` 有哪些取值？

AI 会先检索文档、引用 jade.run 上对应章节，必要时读取整页，再作答。

:::warning{title=检索不到最新内容？}
文档索引随 npm 包发布、进程启动时构建。`npx -y` 每次运行都会解析最新版本，刚发布的新版本文档通常直接可用；若被缓存，把包版本显式升到最新（如 `jadeview-docs-mcp@<版本号>`）即可。
:::
