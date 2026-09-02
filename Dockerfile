# 阶段1：构建 dumi 静态产物（dist）
FROM node:22-alpine AS builder
WORKDIR /app

# chromium 供构建后 SEO 预渲染（puppeteer-core 驱动，无需下完整 Chrome）
RUN apk add --no-cache chromium nss

# 复制全部源码（含 CI 预生成的 public/releases/data.json）。
# 先 COPY 再 npm ci：确保 postinstall 的 `dumi setup` 能读到 .dumirc / 主题 / 文档，正常生成 .dumi/tmp。
COPY . .

# 安装依赖（含 esbuild 等 postinstall、dumi setup）
RUN npm ci

# 构建到 dist（.dumirc 已启用 Rust Bundler utoopack，musl 二进制随 npm ci 自动安装）。
# 用 `npx dumi build` 跳过 package.json 的 prebuild 钩子：
#   发行快照已由部署工作流在构建机上先行生成（带 GITHUB_TOKEN）并随源码 COPY 进来，
#   故镜像构建内不再直连 GitHub。
# 预渲染：dumi 导出的是空 SPA 壳，用无头浏览器把每页完整 DOM 写回 index.html（SEO 伪静态化）。
#   不用 umi SSG：服务端无 matchMedia，antd-style 按 light 渲染烤死进 HTML，深色用户看到白卡片。
#   预渲染只喂爬虫，客户端 React 全量接管，主题按用户偏好渲染。失败路由自动回退空壳。
RUN npx dumi build && \
    CHROME_PATH=/usr/bin/chromium-browser node scripts/prerender.mjs && \
    node scripts/defingerprint.mjs && \
    # 预压缩 .gz 配合 nginx gzip_static：省去线上每请求实时压缩的 CPU（文件均带指纹，可长期复用）
    find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.wasm' -o -name '*.json' -o -name '*.html' \) \
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
