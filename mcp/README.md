# JadeView Docs MCP

自建的 JadeView 文档 MCP 服务，**替代官方 Algolia MCP**。数据直接读本地 markdown 源文件（`../docs`），所以官方 Algolia 索引里缺失的正文（如 `window-api` 的 `create_webview_window` 签名）这里都查得到。

- 传输：**Streamable HTTP**（无状态），可本地跑也可部署
- 索引：启动时扫描 `docs/**/*.md`，按标题切成 section（复刻 docsearch 的 `hierarchy + content + url + anchor + lang`）
- 搜索：MiniSearch + 中文 bigram 分词（中文没有空格，标准分词搜不到）
- 中英文都索引（`.md`=zh，`.en-US.md`=en）

## 线上服务

已部署，公网入口（前置反代终结 HTTPS）：

- **MCP 端点**：`https://mcp.jade.run/mcp`
- **健康检查**：`https://mcp.jade.run/health` → `{"ok":true,"pages":...,"sections":...}`

反代把 `mcp.jade.run` 反向代理到服务器容器 `docs-mcp` 的 `http://127.0.0.1:8848`。

## 工具

| 工具 | 作用 |
|------|------|
| `search_docs(query, lang?, limit?)` | 全文搜索，返回排序后的 section：面包屑、url、源文件 path、片段 |
| `get_doc(path)` | 读整页完整 markdown；`path` 用 search 返回的 `path`（如 `docs/docs/api/window-api.md`）或路由（`/docs/api/window-api`） |

典型用法：先 `search_docs` 找到相关页，再 `get_doc` 拿完整 API 签名/代码示例。

## 本地运行

```bash
cd mcp
bun install            # 或 npm install
bunx tsx src/server.ts # 或  npm run dev
# -> http://127.0.0.1:8848/mcp
```

命令行自测（不起服务）：

```bash
bunx tsx src/cli.ts 创建窗口
bunx tsx src/cli.ts --lang en window
```

端到端自测（需先起服务）：

```bash
bunx tsx src/smoke-test.ts
```

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `PORT` | `8848` | 监听端口 |
| `HOST` | `127.0.0.1` | 监听地址（容器里设 `0.0.0.0`） |
| `DOCS_DIR` | `../docs` | markdown 根目录 |
| `BASE_URL` | `https://jade.run` | 生成 url 的站点前缀 |
| `MCP_AUTH_TOKEN` | 空 | 设置后，`POST /mcp` 需带 `Authorization: Bearer <token>` |

## 接入 Claude Code

和官方 Algolia MCP 一样的写法，把 url 换成本服务：

```json
{
  "mcpServers": {
    "jadeview_docs": {
      "url": "http://127.0.0.1:8848/mcp",
      "transport": "http"
    }
  }
}
```

部署到服务器后换成公网地址，并建议开 `MCP_AUTH_TOKEN`（客户端在 `headers` 里带 `Authorization`）。

## 部署

`mcp/Dockerfile` 从项目根构建（需要能 `COPY docs`）：

```bash
# 在 JadeView_docs 项目根执行
docker build -f mcp/Dockerfile -t jadeview-docs-mcp .
docker run -p 8848:8848 jadeview-docs-mcp
```

内容更新后重建镜像即可（索引在启动时构建，130 页 ~300ms）。也可挂载 `docs` 卷 + 重启容器免重建。

## 说明

- `get_doc` 的 `path` 形如 `docs/docs/api/window-api.md`（双 `docs` 是因为源码里 dumi 文档嵌套在 `docs/docs/` 下，这是真实的仓库相对路径）。
- 路由规则：zh 无前缀 `/docs/...`，en 加 `/en-US`；`index.md` 映射到所在目录。锚点用 GitHub 风格 slug（中文保留原字，浏览器里会 URL 编码）。
