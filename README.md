# Cloudflare Worker Docker 部署指南

此目录包含了将 Cloudflare Worker 脚本部署到 Docker 容器中所需的所有文件。我们使用 `wrangler dev` 本地模式来模拟 Worker 运行环境。

## 目录结构
- `Dockerfile`: 构建 Docker 镜像的配置文件
- `package.json`: 定义依赖 (Wrangler) 和启动脚本
- `wrangler.toml`: Wrangler 配置文件
- `src/index.js`: 您的 Worker 脚本 (已包含所有优化)

## 部署步骤

### 1. 构建镜像

在 `docker_deploy` 目录下打开终端，运行：

```bash
docker build -t my-cf-worker .
```

### 2. 运行容器

运行容器并映射端口 8787：

```bash
docker run -d -p 8787:8787 --name my-worker my-cf-worker
```

### 3. 本地访问

容器启动后，您可以通过以下地址访问：

- 首页: `http://localhost:8787/` (或者您的服务器 IP)
- 订阅: `http://localhost:8787/{UUID}`

### 4. 环境变量配置

如果您需要修改环境变量（如 UUID），可以在 `wrangler.toml` 中的 `[vars]` 部分添加，或者修改 `src/index.js` 中的默认值。

注意：由于是在本地 Node.js 环境中模拟 Worker，部分 Cloudflare 特有功能（如全球分布、KV 分布式特性）仅为本地模拟版本，适合个人部署使用。
