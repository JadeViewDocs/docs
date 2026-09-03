# 阶段1：构建 dumi 静态产物（dist）
FROM node:22-alpine AS builder
WORKDIR /app

# chromium 供构建后 SEO 预渲染（puppeteer-core 驱动，无需下完整 Chrome）。
# python3/make/g++：npm ci 时部分原生包（esbuild/utoopack Rust bundler 的 node 绑定、
#   以及 dumi-theme-lobehub 依赖的 sharp 等）需要 node-gyp 在 musl alpine 上编源码，
#   缺这些会直接导致 `RUN npm ci` exit code 1 且构建仍然继续往下一步骤跳（buildx 失败）。
RUN apk add --no-cache chromium nss python3 make g++ linux-headers

# 复制全部源码（含 CI 预生成的 public/releases/data.json）。
# 先 COPY 再 npm ci：确保 postinstall 的 `dumi setup` 能读到 .dumirc / 主题 / 文档，正常生成 .dumi/tmp。
COPY . .

# 安装依赖（含 esbuild 等 postinstall、dumi setup）
#   --mount=type=cache：GitHub Actions runner 的 BuildKit 会跨 workflow run 复用
#       /root/.npm 缓存，节省 60%+ 的 tarball 下载时间，也顺带减轻 npm registry
#       限流导致的偶发 ECONNRESET。
#   npm ci 失败时自动重试 2 次：公共 registry 常见的瞬时网络错误（ETIMEDOUT /
#       503 / socket hang up）直接拖慢整个 CI；第二次重试前清掉可能损坏的
#       _cacache 目录，避免"已下载一半的 tar 被当完整包校验失败"。
#   --no-audit --no-fund：关闭 npm audit/fund 的额外 HTTP 请求与网络依赖。
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    set -eux; \
    for i in 1 2 3; do \
      if npm ci --no-audit --no-fund --loglevel=error; then \
        echo "npm ci 成功 (第 ${i} 次尝试)"; \
        break; \
      fi; \
      echo "npm ci 第 ${i} 次尝试失败，5s 后重试…" >&2; \
      rm -rf node_modules; \
      npm cache clean --force 2>/dev/null || true; \
      if [ $i -eq 3 ]; then echo "npm ci 连续失败，退出构建" >&2; exit 1; fi; \
      sleep 5; \
    done

# 构建到 dist（.dumirc 已启用 Rust Bundler utoopack，musl 二进制随 npm ci 自动安装）。
# 用 `npx dumi build` 跳过 package.json 的 prebuild 钩子：
#   发行快照已由部署工作流在构建机上先行生成（带 GITHUB_TOKEN）并随源码 COPY 进来，
#   故镜像构建内不再直连 GitHub。
# ⚠️ 必须 -o pipefail：下面用 `| tail -40` 截断日志，无 pipefail 时管道退出码取
#   tail 的（恒 0），dumi build 真失败也会被当成功继续走——上次事故根源之一。
# 构建重试：dumi/utoopack 在高并发下偶有缓存锁竞争失败，重试一轮能解。
RUN set -euxo pipefail; \
    for i in 1 2; do \
      if npx dumi build 2>&1 | tail -40; then break; fi; \
      echo "dumi build 第 ${i} 次失败，5s 后重试…" >&2; \
      if [ $i -eq 2 ]; then echo "dumi build 连续失败，退出构建" >&2; exit 1; fi; \
      sleep 5; \
    done

# 预渲染：dumi 导出的是空 SPA 壳，用无头浏览器把每页完整 DOM 写回 index.html（SEO 伪静态化）。
#   不用 umi SSG：服务端无 matchMedia，antd-style 按 light 渲染烤死进 HTML，深色用户看到白卡片。
#   预渲染只喂爬虫，客户端 React 全量接管，主题按用户偏好渲染。失败路由自动回退空壳。
# defingerprint：把 HTML 里的 `<script src="/assets/chunk-<hash>.js">` 这类内容指纹引用
#   再同步一份不带 hash 的 symlink 副本，避免部署后 hash 变化导致缓存层回源打到错误 404。
RUN set -eux; \
    CHROME_PATH=/usr/bin/chromium-browser node scripts/prerender.mjs; \
    node scripts/defingerprint.mjs

# 预压缩 .gz 配合 nginx gzip_static：省去线上每请求实时压缩的 CPU（文件均带指纹，可长期复用）
RUN find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.wasm' -o -name '*.json' -o -name '*.html' \) \
    -exec gzip -k -9 {} \;

# 阶段2：生产环境（nginx 提供静态文件）
FROM nginx:alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
