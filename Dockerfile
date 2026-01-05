FROM node:18-alpine

WORKDIR /app

# 复制 package.json 并安装依赖
COPY package.json ./
RUN npm install --production

# 复制项目文件
COPY . .

# 暴露端口
EXPOSE 8787

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8787/ || exit 1

# 启动 Node.js 原生服务器
CMD ["npm", "start"]
