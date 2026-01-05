/**
 * Node.js 原生服务器入口
 * 
 * 用于在标准 Node.js/Docker 环境中运行代理服务
 * 替代 Wrangler 开发服务器，支持爪云等容器平台
 */

import http from 'http';
import { WebSocketServer } from 'ws';
import { getPageHtml } from './ui.js';
import { connect as rawConnect } from './socket-adapter.js';

// ==================== 配置变量 ====================
let at = process.env.UUID || process.env.u || process.env.U || 'd2b5ce3b-67f1-4bb2-93ac-15c9e2a786e2';
at = at.toLowerCase();

let fallbackAddress = process.env.PROXYIP || process.env.p || process.env.P || '';
let socks5Config = process.env.SOCKS5 || process.env.s || process.env.S || '';
let customPreferredIPs = [];
let customPreferredDomains = [];
let enableSocksDowngrade = false;
let disableNonTLS = false;
let disablePreferred = false;
let enableRegionMatching = true;
let currentWorkerRegion = process.env.REGION || 'JP'; // 默认日本区域（爪云）
let manualWorkerRegion = '';
let piu = '';
let cp = process.env.PATH_ALIAS || '';

// 协议开关
let ev = true;  // VLESS
let et = false; // Trojan
let ex = false; // XHTTP
let tp = '';

let scu = 'https://url.v1.mk/sub';

// ==================== 常量 ====================
const ADDRESS_TYPE_IPV4 = 1;
const ADDRESS_TYPE_URL = 2;
const ADDRESS_TYPE_IPV6 = 3;

const E_INVALID_DATA = 'invalid data';
const E_INVALID_USER = 'invalid user';
const E_UNSUPPORTED_CMD = 'command is not supported';
const E_UDP_DNS_ONLY = 'UDP proxy only enable for DNS which is port 53';
const E_INVALID_ADDR_TYPE = 'invalid addressType';
const E_EMPTY_ADDR = 'addressValue is empty';
const E_WS_NOT_OPEN = 'webSocket.readyState is not open';

// 熔断器状态
const failureTracker = new Map();
const CIRCUIT_BREAKER_THRESHOLD = 3;
const COOLDOWN_PERIOD_MS = 5 * 60 * 1000;

// ==================== 备用代理IP ====================
const backupIPs = [
    { domain: 'ProxyIP.US.CMLiussss.net', region: 'US', regionCode: 'US', port: 443 },
    { domain: 'ProxyIP.SG.CMLiussss.net', region: 'SG', regionCode: 'SG', port: 443 },
    { domain: 'ProxyIP.JP.CMLiussss.net', region: 'JP', regionCode: 'JP', port: 443 },
    { domain: 'ProxyIP.KR.CMLiussss.net', region: 'KR', regionCode: 'KR', port: 443 },
    { domain: 'ProxyIP.DE.CMLiussss.net', region: 'DE', regionCode: 'DE', port: 443 },
    { domain: 'ProxyIP.SE.CMLiussss.net', region: 'SE', regionCode: 'SE', port: 443 },
    { domain: 'ProxyIP.NL.CMLiussss.net', region: 'NL', regionCode: 'NL', port: 443 },
    { domain: 'ProxyIP.FI.CMLiussss.net', region: 'FI', regionCode: 'FI', port: 443 },
    { domain: 'ProxyIP.GB.CMLiussss.net', region: 'GB', regionCode: 'GB', port: 443 }
];

// ==================== 工具函数 ====================
function isValidFormat(str) {
    const userRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return userRegex.test(str);
}

function isValidIP(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(ip)) return true;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Regex.test(ip)) return true;
    return false;
}

function connect(options) {
    const { hostname, port } = options;
    const key = `${hostname}:${port}`;
    const failures = failureTracker.get(key) || { count: 0, lastFailure: 0 };

    if (failures.count >= CIRCUIT_BREAKER_THRESHOLD && (Date.now() - failures.lastFailure < COOLDOWN_PERIOD_MS)) {
        throw new Error(`Circuit breaker open for ${key}`);
    }

    const socket = rawConnect(options);

    socket.opened.then(() => {
        failureTracker.delete(key);
    }).catch(() => {
        const current = failureTracker.get(key) || { count: 0, lastFailure: 0 };
        current.count++;
        current.lastFailure = Date.now();
        failureTracker.set(key, current);
    });

    return socket;
}

function getBestBackupIP(workerRegion = '') {
    if (backupIPs.length === 0) return null;

    // 优先选择相同区域的IP
    const sameRegion = backupIPs.filter(ip => ip.regionCode === workerRegion);
    if (sameRegion.length > 0) {
        return sameRegion[Math.floor(Math.random() * sameRegion.length)];
    }

    // 随机选择一个
    return backupIPs[Math.floor(Math.random() * backupIPs.length)];
}

// 解析地址和端口（支持 IPv4、IPv6、域名）
function parseAddressAndPort(input) {
    // IPv6 格式: [2001:db8::1]:443
    if (input.includes('[') && input.includes(']')) {
        const match = input.match(/^\[([^\]]+)\](?::(\d+))?$/);
        if (match) {
            return {
                address: match[1],
                port: match[2] ? parseInt(match[2], 10) : null
            };
        }
    }

    // 普通格式: host:port
    const lastColonIndex = input.lastIndexOf(':');
    if (lastColonIndex > 0) {
        const address = input.substring(0, lastColonIndex);
        const portStr = input.substring(lastColonIndex + 1);
        const port = parseInt(portStr, 10);

        if (!isNaN(port) && port > 0 && port <= 65535) {
            return { address, port };
        }
    }

    return { address: input, port: null };
}

// ==================== VLESS 协议解析 ====================
function parseVlessHeader(buffer) {
    if (buffer.byteLength < 24) {
        return { hasError: true, message: 'Invalid data: too short' };
    }

    const view = new DataView(buffer);
    const version = view.getUint8(0);

    // 提取 UUID
    const userIdBytes = new Uint8Array(buffer.slice(1, 17));
    const userId = Array.from(userIdBytes)
        .map((b, i) => {
            const hex = b.toString(16).padStart(2, '0');
            if (i === 3 || i === 5 || i === 7 || i === 9) return hex + '-';
            return hex;
        })
        .join('')
        .replace(/-$/, '');

    // 验证 UUID
    if (userId.toLowerCase() !== at.toLowerCase()) {
        return { hasError: true, message: E_INVALID_USER };
    }

    const optLength = view.getUint8(17);
    const command = view.getUint8(18 + optLength);

    // 只支持 TCP
    if (command !== 1) {
        return { hasError: true, message: E_UNSUPPORTED_CMD };
    }

    // 解析端口和地址
    const portIndex = 18 + optLength + 1;
    const port = view.getUint16(portIndex);
    const addressType = view.getUint8(portIndex + 2);

    let addressValue = '';
    let addressLength = 0;
    let rawDataIndex = portIndex + 3;

    if (addressType === ADDRESS_TYPE_IPV4) {
        addressLength = 4;
        const ipBytes = new Uint8Array(buffer.slice(rawDataIndex, rawDataIndex + 4));
        addressValue = ipBytes.join('.');
        rawDataIndex += 4;
    } else if (addressType === ADDRESS_TYPE_URL) {
        addressLength = view.getUint8(rawDataIndex);
        rawDataIndex++;
        const hostBytes = new Uint8Array(buffer.slice(rawDataIndex, rawDataIndex + addressLength));
        addressValue = new TextDecoder().decode(hostBytes);
        rawDataIndex += addressLength;
    } else if (addressType === ADDRESS_TYPE_IPV6) {
        addressLength = 16;
        const ipv6Bytes = new Uint8Array(buffer.slice(rawDataIndex, rawDataIndex + 16));
        const parts = [];
        for (let i = 0; i < 16; i += 2) {
            parts.push(((ipv6Bytes[i] << 8) + ipv6Bytes[i + 1]).toString(16));
        }
        addressValue = parts.join(':');
        rawDataIndex += 16;
    } else {
        return { hasError: true, message: E_INVALID_ADDR_TYPE };
    }

    if (!addressValue) {
        return { hasError: true, message: E_EMPTY_ADDR };
    }

    return {
        hasError: false,
        addressType,
        addressValue,
        port,
        rawDataIndex,
        version,
        userId
    };
}

// ==================== WebSocket 处理 ====================  
async function handleWebSocket(ws, req) {
    console.log('[WS] 新的 WebSocket 连接');

    let remoteSocket = null;
    let vlessResponseHeader = null;
    let isFirstMessage = true;

    ws.on('message', async (data) => {
        try {
            const buffer = data instanceof Buffer ? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) : data;

            if (isFirstMessage) {
                isFirstMessage = false;

                // 解析 VLESS 头
                const vlessHeader = parseVlessHeader(buffer);

                if (vlessHeader.hasError) {
                    console.error('[VLESS] 解析错误:', vlessHeader.message);
                    ws.close();
                    return;
                }

                const { addressValue, port, rawDataIndex, version } = vlessHeader;
                console.log(`[VLESS] 连接到 ${addressValue}:${port}`);

                // 准备 VLESS 响应头
                vlessResponseHeader = new Uint8Array([version, 0]);

                // 确定实际连接目标
                let targetHost = addressValue;
                let targetPort = port;

                // 解析请求参数
                const queryParams = new URLSearchParams(req.url.split('?')[1] || '');
                const relayIP = queryParams.get('proxyip') || queryParams.get('relay');

                if (relayIP) {
                    const parts = parseAddressAndPort(relayIP);
                    targetHost = parts.address;
                    targetPort = parts.port || 443;
                    console.log(`[RELAY] 正在通过中转连接到: ${targetHost}:${targetPort}`);
                } else if (fallbackAddress) {
                    // 如果配置了全局代理IP，使用全局代理IP
                    const [proxyHost, proxyPort] = fallbackAddress.split(':');
                    targetHost = proxyHost;
                    targetPort = parseInt(proxyPort) || 443;
                } else {
                    // 尝试使用备用代理IP
                    const backupIP = getBestBackupIP(currentWorkerRegion);
                    if (backupIP) {
                        targetHost = backupIP.domain;
                        targetPort = backupIP.port;
                    }
                }

                // 详细日志
                console.log(`[RELAY] 模式: ${relayIP ? '🔄 中转' : '📡 直连'}`);
                console.log(`[RELAY] 原始目标: ${addressValue}:${port}`);
                console.log(`[RELAY] 实际目标: ${targetHost}:${targetPort}`);

                // 带超时和故障转移的连接函数
                const CONNECT_TIMEOUT = 10000; // 10秒超时

                async function connectWithTimeout(host, port) {
                    const socket = rawConnect({ hostname: host, port: port });
                    const timeout = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('连接超时')), CONNECT_TIMEOUT)
                    );
                    await Promise.race([socket.opened, timeout]);
                    return socket;
                }

                // 带故障转移的连接
                async function connectWithFallback(primaryHost, primaryPort, isRelay) {
                    try {
                        console.log(`[TCP] 尝试连接 ${primaryHost}:${primaryPort}...`);
                        return await connectWithTimeout(primaryHost, primaryPort);
                    } catch (e) {
                        console.log(`[TCP] 主连接失败: ${e.message}`);

                        // 如果是中转模式且失败，不进行故障转移（用户指定了特定地址）
                        if (isRelay) {
                            console.log(`[TCP] 中转模式，不进行故障转移`);
                            throw e;
                        }

                        // 尝试备用IP
                        const backup = getBestBackupIP(currentWorkerRegion);
                        if (backup && (backup.domain !== primaryHost)) {
                            console.log(`[TCP] 尝试备用IP: ${backup.domain}:${backup.port}`);
                            try {
                                return await connectWithTimeout(backup.domain, backup.port);
                            } catch (e2) {
                                console.log(`[TCP] 备用IP也失败: ${e2.message}`);
                                throw e2;
                            }
                        }
                        throw e;
                    }
                }

                // 建立 TCP 连接（带故障转移）
                try {
                    remoteSocket = await connectWithFallback(targetHost, targetPort, !!relayIP);
                    console.log('[TCP] ✅ 连接成功');

                    // 发送 VLESS 响应头
                    ws.send(vlessResponseHeader);

                    // 发送剩余数据
                    const remainingData = buffer.slice(rawDataIndex);
                    if (remainingData.byteLength > 0) {
                        const writer = remoteSocket.writable.getWriter();
                        await writer.write(new Uint8Array(remainingData));
                        writer.releaseLock();
                    }

                    // 从远程读取数据并发送给客户端
                    const reader = remoteSocket.readable.getReader();
                    (async () => {
                        try {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                if (ws.readyState === 1) { // OPEN
                                    ws.send(value);
                                }
                            }
                        } catch (e) {
                            console.error('[TCP] 读取错误:', e.message);
                        } finally {
                            reader.releaseLock();
                        }
                    })();

                } catch (e) {
                    console.error('[TCP] ❌ 连接失败:', e.message);
                    ws.close();
                    return;
                }


            } else {
                // 后续消息直接转发
                if (remoteSocket && remoteSocket.writable) {
                    try {
                        const writer = remoteSocket.writable.getWriter();
                        await writer.write(new Uint8Array(buffer));
                        writer.releaseLock();
                    } catch (e) {
                        console.error('[WS] 写入错误:', e.message);
                    }
                }
            }

        } catch (e) {
            console.error('[WS] 处理消息错误:', e.message);
            ws.close();
        }
    });

    ws.on('close', () => {
        console.log('[WS] 连接关闭');
        if (remoteSocket) {
            remoteSocket.close();
        }
    });

    ws.on('error', (e) => {
        console.error('[WS] 错误:', e.message);
        if (remoteSocket) {
            remoteSocket.close();
        }
    });
}

// ==================== HTTP 请求处理 ====================
function handleHttpRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    console.log(`[HTTP] ${req.method} ${path}`);

    // API: 速度测试 - 下载
    if (path.endsWith('/api/speedtest/down')) {
        const bytes = parseInt(url.searchParams.get('bytes') || '0');
        const size = Math.min(bytes, 50 * 1024 * 1024); // 50MB 上限

        if (size <= 0) {
            res.writeHead(400);
            res.end('Invalid size');
            return;
        }

        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': size.toString(),
            'Cache-Control': 'no-store, no-cache',
            'Access-Control-Allow-Origin': '*'
        });

        let sent = 0;
        const chunkSize = 65536;

        function sendChunk() {
            if (sent >= size) {
                res.end();
                return;
            }
            const toSend = Math.min(chunkSize, size - sent);
            const chunk = Buffer.alloc(toSend);
            for (let i = 0; i < toSend; i++) {
                chunk[i] = Math.floor(Math.random() * 256);
            }
            sent += toSend;

            if (res.write(chunk)) {
                setImmediate(sendChunk);
            } else {
                res.once('drain', sendChunk);
            }
        }
        sendChunk();
        return;
    }

    // API: 速度测试 - 上传
    if (path.endsWith('/api/speedtest/up')) {
        if (req.method !== 'POST') {
            res.writeHead(405);
            res.end('Method not allowed');
            return;
        }

        let received = 0;
        const startTime = Date.now();

        req.on('data', (chunk) => {
            received += chunk.length;
        });

        req.on('end', () => {
            const duration = Date.now() - startTime;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'ok',
                receivedBytes: received,
                durationMs: duration
            }));
        });
        return;
    }

    // API: 获取区域
    if (path.endsWith('/region')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ region: currentWorkerRegion }));
        return;
    }

    // API: 配置
    if (path.includes('/api/config')) {
        if (req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                p: fallbackAddress,
                uuid: at,
                region: currentWorkerRegion
            }));
            return;
        }

        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    const config = JSON.parse(body);
                    if (config.p) fallbackAddress = config.p;
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'ok' }));
                } catch (e) {
                    res.writeHead(400);
                    res.end('Invalid JSON');
                }
            });
            return;
        }
    }

    // ==================== /sub 订阅端点 ====================
    // 检查是否为有效的 UUID 路径
    const pathParts = path.split('/').filter(p => p);

    if (pathParts.length >= 2 && pathParts[1] === 'sub') {
        const requestUuid = pathParts[0];

        // 验证 UUID
        if (!isValidFormat(requestUuid) || requestUuid.toLowerCase() !== at.toLowerCase()) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        console.log('[订阅] 生成订阅内容...');

        // 获取请求的 host
        const host = req.headers.host || `localhost:${PORT}`;
        const target = url.searchParams.get('target') || 'base64';

        // 生成 VLESS 链接
        const vlessLink = `vless://${at}@${host}:443?encryption=none&security=tls&sni=${host}&fp=chrome&type=ws&host=${host}&path=${encodeURIComponent('/?ed=2048')}#赛博代理-${host}`;

        console.log(`[订阅] 目标格式: ${target}`);
        console.log(`[订阅] 生成链接: ${vlessLink.substring(0, 60)}...`);

        if (target === 'base64') {
            // Base64 编码的订阅
            const base64Content = Buffer.from(vlessLink, 'utf-8').toString('base64');
            res.writeHead(200, {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'subscription-userinfo': 'upload=0; download=0; total=10737418240; expire=0'
            });
            res.end(base64Content);
        } else {
            // 纯文本格式
            res.writeHead(200, {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache'
            });
            res.end(vlessLink);
        }

        console.log('[订阅] 订阅内容已发送');
        return;
    }

    // 检查 UUID 路径显示 UI

    if (pathParts.length >= 1) {
        const potentialUuid = pathParts[0];

        // 显示 UI 页面
        if (isValidFormat(potentialUuid) && potentialUuid.toLowerCase() === at.toLowerCase()) {
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache'
            });
            res.end(getPageHtml(at));
            return;
        }

        // 自定义路径
        if (cp && potentialUuid === cp) {
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache'
            });
            res.end(getPageHtml(at));
            return;
        }
    }

    // 根路径 - 显示简单状态
    if (path === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'running',
            name: '赛博代理 V3',
            region: currentWorkerRegion,
            timestamp: new Date().toISOString()
        }));
        return;
    }

    // 404
    res.writeHead(404);
    res.end('Not Found');
}

// ==================== 服务器启动 ====================
const PORT = process.env.PORT || 8787;
const HOST = process.env.HOST || '0.0.0.0';

const server = http.createServer(handleHttpRequest);

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    handleWebSocket(ws, req);
});

server.listen(PORT, HOST, () => {
    console.log('================================================');
    console.log('          赛博代理 V3 [Docker 版]');
    console.log('================================================');
    console.log(`[启动] 服务运行在 http://${HOST}:${PORT}`);
    console.log(`[配置] UUID: ${at}`);
    console.log(`[配置] 区域: ${currentWorkerRegion}`);
    console.log(`[配置] 代理IP: ${fallbackAddress || '自动选择'}`);
    console.log('================================================');
    console.log(`[访问] UI 面板: http://localhost:${PORT}/${at}/`);
    console.log('================================================');
});

// ==================== 优雅关闭处理 ====================
function gracefulShutdown(signal) {
    console.log(`\n[关闭] 收到 ${signal} 信号，正在优雅关闭...`);

    // 关闭 WebSocket 服务器
    wss.clients.forEach((client) => {
        client.close();
    });

    // 关闭 HTTP 服务器
    server.close(() => {
        console.log('[关闭] HTTP 服务器已停止');
        console.log('[关闭] 服务已完全关闭');
        process.exit(0);
    });

    // 设置超时强制退出，防止卡住
    setTimeout(() => {
        console.log('[关闭] 超时，强制退出...');
        process.exit(0);
    }, 5000);
}

// 监听终止信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
