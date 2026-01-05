FROM node:18-alpine

WORKDIR /app

# 安装 Wrangler
COPY package.json ./
RUN npm install

# 复制项目文件
COPY . .

# 暴露端口
EXPOSE 8787

# 启动 Wrangler 开发服务器 (模拟 Worker 环境)
CMD ["npm", "start"]
