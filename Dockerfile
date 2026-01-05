FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件（利用 Docker 缓存层）
COPY package*.json ./

# 安装生产环境依赖（使用新的 --omit=dev 替代已过时的 --production）
RUN npm install --omit=dev && npm cache clean --force

# 复制源代码
COPY src/ ./src/

# 复制其他必要文件
COPY wrangler.toml ./

# 暴露端口 (Zeabur 默认使用 PORT=8080)
EXPOSE 8080

# 健康检查（使用 node 代替 wget，更轻量）
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# 启动 Node.js 原生服务器
CMD ["npm", "start"]
