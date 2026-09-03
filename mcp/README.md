# jadeview-docs-mcp

JadeView 官方文档的本地 MCP 服务（stdio 传输）。文档 markdown **随 npm 包一起分发**，npx 拉起即用，无需克隆文档仓库、无需联网。

提供两个工具：

| 工具 | 作用 |
|------|------|
| `search_docs(query, lang?, limit?)` | 全文搜索（MiniSearch + 中文 bigram 分词），返回排序后的 section：面包屑、url、源文件 path、片段。中英文均已索引。 |
| `get_doc(path)` | 读整页完整 markdown；`path` 用 search 返回的 `path`（如 `docs/api/window-api.md`）或路由（`/docs/api/window-api`）。 |

典型用法：先 `search_docs` 找到相关章节，再 `get_doc` 拿完整 API 签名 / 代码示例。

## 接入 MCP 客户端

Claude Code / ZCode / Cursor 等客户端，在 MCP 配置里加：

```json
{
  "mcpServers": {
    "jadeview-docs": {
      "command": "npx",
      "args": ["-y", "jadeview-docs-mcp"]
    }
  }
}
```

首次运行 npx 会自动下载并缓存；之后离线也能启动（索引在进程启动时构建，135 页 / 2230+ 段约 300ms）。想锁定版本可把参数换成 `["-y", "jadeview-docs-mcp@<版本号>"]`。

### 环境变量（可选）

| 变量 | 默认 | 说明 |
|------|------|------|
| `BASE_URL` | `https://jade.run` | 生成文档链接的站点前缀 |

## 许可证

[MIT](LICENSE)。包内随附的文档内容版权归 JadeView 文档作者所有。
