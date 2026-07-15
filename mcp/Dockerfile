# JadeView docs MCP server — build stage compiles TS, runtime serves over HTTP.
FROM node:22-alpine AS build
WORKDIR /app/mcp
COPY mcp/package.json ./
RUN npm install
COPY mcp/tsconfig.json ./
COPY mcp/src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app/mcp
ENV NODE_ENV=production
COPY mcp/package.json ./
RUN npm install --omit=dev
COPY --from=build /app/mcp/dist ./dist
# The markdown source the server indexes. Kept read-only at runtime.
COPY docs /app/docs
ENV DOCS_DIR=/app/docs
ENV HOST=0.0.0.0
ENV PORT=8848
EXPOSE 8848
CMD ["node", "dist/server.js"]
