# 赛博代理 V3 - Docker 版

## 功能特点

- ✅ **原生 Node.js** - 不依赖 Cloudflare 特定模块
- ✅ **完整 VLESS 支持** - WebSocket + TCP 转发
- ✅ **中文 UI** - 赛博朋克风格界面
- ✅ **多平台兼容** - 支持爪云、Railway、自建 VPS 等

## 快速部署

### 方法一：Docker Compose（推荐）

```bash
# 1. 修改 docker-compose.yml 中的 UUID
# 2. 启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f
```

### 方法二：直接运行

```bash
# 安装依赖
npm install

# 启动服务
npm start
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `UUID` | 用户标识 | 随机生成 |
| `PROXYIP` | 代理IP (可选) | 自动选择 |
| `REGION` | 服务器区域 | JP |
| `PORT` | 监听端口 | 8787 |
| `PATH_ALIAS` | 自定义路径 | 无 |

## 访问服务

- **UI 面板**: `http://your-domain:8787/你的UUID/`
- **API**: `http://your-domain:8787/你的UUID/api/config`

## 爪云部署

1. 创建 **Devbox** (Node.js 18)
2. 上传 `docker_deploy` 文件夹
3. 运行 `npm install && npm start`
4. 暴露端口 8787

## 文件结构

```
docker_deploy/
├── src/
│   ├── server.js        # 主服务器入口
│   ├── socket-adapter.js # TCP Socket 适配层
│   └── ui.js            # 中文 UI
├── Dockerfile
├── docker-compose.yml
└── package.json
```
