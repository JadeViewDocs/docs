# 阶段1：构建 dumi 静态产物（dist）
FROM node:22-alpine AS builder
WORKDIR /app

# 复制全部源码（含 CI 预生成的 public/releases/data.json）。
# 先 COPY 再 npm ci：确保 postinstall 的 `dumi setup` 能读到 .dumirc / 主题 / 文档，正常生成 .dumi/tmp。
COPY . .

# 安装依赖（含 esbuild 等 postinstall、dumi setup）
RUN npm ci

# 构建到 dist（.dumirc 已启用 Rust Bundler utoopack，musl 二进制随 npm ci 自动安装）。
# 用 `npx dumi build` 跳过 package.json 的 prebuild 钩子：
#   发行快照已由部署工作流在构建机上先行生成（带 GITHUB_TOKEN）并随源码 COPY 进来，
#   故镜像构建内不再直连 GitHub。
# USE_SSG=1：启用 umi 自带 ssr + exportStatic（见 .dumirc.ts），构建时 Node 端直接
#   渲染出含正文的静态 HTML（SEO 伪静态化），无需浏览器（Linux 下无 Windows 盘符 bug）。
RUN USE_SSG=1 npx dumi build

# 阶段2：生产环境（nginx 提供静态文件）
FROM nginx:alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
