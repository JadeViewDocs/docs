# 维护者手册（mcp/ — 不随 npm 包发布）

本目录是 npm 包 **jadeview-docs-mcp** 的源码（stdio 传输），随文档仓库同源维护。npm 包页面展示的 `README.md` 只含用户视角内容；本文件是维护者手册，**不在发布清单里**（`package.json` 的 `files` 只含 `dist` / `content` / `README.md` / `LICENSE`）。

## 自动发布（GitHub Actions）

`.github/workflows/publish-npm.yml`（仓库根目录）：

- **触发**：`push` 到 `main` 且改动 `docs/**`（文档内容）或 `mcp/` 源码；也可在 Actions 页面手动 `workflow_dispatch`。
- **流程**：`sync-content` 从同仓库 `../docs` 刷新 `content/` → 无变化则空跑结束 → 有变化则 `npm version patch` → `build` → `test:client` → `npm publish` → 把 `content/` 与版本号提交回 `main`（GITHUB_TOKEN 推送，不会再次触发 workflow，无循环）。
- **唯一必需的 Secret**：`NPM_TOKEN` —— npm **Granular Access Token**（勾选 *Bypass two-factor authentication*，对 `jadeview-docs-mcp` 有 Read & Write）。配置命令：

  ```bash
  gh secret set NPM_TOKEN -R luoxueyousheng/docs
  ```

### 手动触发 / 查看运行

```bash
gh workflow run publish-npm -R luoxueyousheng/docs
gh run list -R luoxueyousheng/docs -w publish-npm
```

## 手动发布（备用）

```bash
cd mcp
npm run sync-content <path-to-docs-repo/docs>   # 同仓库内即 ../docs，或设 JADEVIEW_DOCS_SRC
npm run build && npm run test:client
npm version patch                               # 或 minor
npm publish                                     # 本地发布需 2FA OTP
```

> `prepublishOnly` 钩子会自动执行 `npm run build`，直接 `npm publish` 也安全。

## 本地开发

```bash
npm install
npm run build          # tsc -> dist/
npm run test:client    # 起 dist/stdio.js 做端到端 MCP 冒烟测试
npm run test:npx       # 发布前完整模拟：npm pack + npx -y <tarball> 实测 bin 入口
```

## 备忘

- 数据随包走：`content/` 由 `scripts/sync-content.mjs` 生成并提交，运行时从包内读取；
- `DOCS_DIR` 环境变量可覆盖文档来源，仅调试用，用户文档里未宣传；
- 历史说明：本目录原为 HTTP 版 MCP（express，部署于 mcp.jade.run），v1.0.0 起被 npm stdio 包替代并移除；服务器侧旧容器 `yiminger/jadeview_docs_mcp` 与反代需手动下线；
- 令牌只存在于 GitHub Secrets / 环境变量，绝不写入仓库。
