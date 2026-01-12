# 阶段1: 构建
FROM oven/bun:latest AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json bun.lock ./
COPY patches ./patches
COPY modules ./modules

# 安装依赖（包含 patch-package）
RUN bun install

# 复制源代码（包含预生成的 changelog 和 contributors）
COPY . .

# 构建静态文件
RUN bun run build

# 阶段2: 生产环境
FROM nginx:alpine

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制静态文件
COPY --from=builder /app/build /usr/share/nginx/html

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

