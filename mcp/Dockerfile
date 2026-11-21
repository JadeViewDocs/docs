# JadeView docs MCP server — build stage compiles TS, runtime serves over HTTP.
FROM node:22-alpine AS build
WORKDIR /app/mcp
COPY mcp/package.json mcp/package-lock.json ./
RUN npm ci
COPY mcp/tsconfig.json ./
COPY mcp/src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app/mcp
ENV NODE_ENV=production
COPY mcp/package.json mcp/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/mcp/dist ./dist
# The markdown source the server indexes. Kept read-only at runtime.
COPY docs /app/docs
ENV DOCS_DIR=/app/docs
ENV HOST=0.0.0.0
ENV PORT=8848
EXPOSE 8848
USER node
HEALTHCHECK --interval=3s --timeout=2s --start-period=5s CMD node -e "fetch('http://127.0.0.1:8848/health').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
CMD ["node", "dist/server.js"]
