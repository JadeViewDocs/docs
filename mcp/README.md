# JadeView 文档 MCP

使用 Streamable HTTP 连接 `https://mcp.jade.run/mcp`，可调用 `search_docs` 和 `get_doc` 检索 JadeView 文档。服务直接索引仓库的 `docs/`。

## 服务器部署

GitHub Actions 将站点和 MCP 镜像推到 Docker Hub，再通过同一个 webhook 发送两个镜像的 SHA-256 引用。服务使用 `yiminger/jadeview_docs_mcp`、容器名 `docs-mcp` 和默认端口 `8848`。

从旧部署迁移时，将新版 `deploy/docker-compose.yml` 和 `deploy/webhook-server.py` 同步到服务器的部署目录，保留现有 `.env`，然后运行：

```bash
docker compose up -d --force-recreate webhook
```

更新后的 webhook 会在下一次发布时拉起 MCP 容器。将 `mcp.jade.run` 的 HTTPS 反代指向服务器的 `8848` 端口，保留 `/mcp` 路径。可通过 `/health` 检查服务和文档索引。

`deploy/.env.example` 列出了 MCP 端口和公开来源。设置 `MCP_AUTH_TOKEN` 后，客户端需要发送 `Authorization: Bearer <token>`。

## 本地验证

在 `mcp/` 下执行：

```bash
npm ci
npm run build
npm start
```

另开终端运行 `npm run test:client`。本地地址为 `http://127.0.0.1:8848/mcp`，测试也可通过 `MCP_TEST_URL` 指向其他服务。
