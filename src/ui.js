/**
 * UI 模块 - 赛博代理 V3 Docker 版
 * 提供完整的订阅管理界面
 */

export function getPageHtml(uuid) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>赛博代理 V3 [终极版]</title>
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --neon-primary: #00ff9d;
            --neon-secondary: #00d2ff;
            --neon-alert: #ff2d55;
            --bg-color: #08080c;
            --card-bg: rgba(13, 16, 23, 0.9);
            --glass-border: 1px solid rgba(255, 255, 255, 0.05);
            --grid-line: rgba(0, 255, 157, 0.05);
            --font-main: 'Share Tech Mono', monospace;
            --font-display: 'Orbitron', sans-serif;
        }

        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        
        body {
            background-color: var(--bg-color);
            background-image: 
                linear-gradient(var(--grid-line) 1px, transparent 1px),
                linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
            background-size: 40px 40px;
            color: #e0e0e0;
            font-family: var(--font-main);
            margin: 0;
            overflow-x: hidden;
            min-height: 100vh;
        }

        #matrixCanvas {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            z-index: -2; opacity: 0.12; pointer-events: none;
        }

        .container {
            max-width: 1200px; margin: 0 auto; padding: 20px;
            position: relative; z-index: 1;
        }

        header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 20px 30px; margin-bottom: 25px;
            background: var(--card-bg);
            border: var(--glass-border);
            border-bottom: 2px solid var(--neon-primary);
            box-shadow: 0 5px 30px rgba(0,0,0,0.8), 0 0 10px rgba(0,255,157,0.1);
        }

        .brand {
            font-family: var(--font-display); font-size: 2rem; font-weight: 900;
            color: #fff; text-transform: uppercase; letter-spacing: 2px;
            text-shadow: 0 0 15px var(--neon-primary);
            display: flex; align-items: center; gap: 15px;
        }
        .brand span { color: var(--neon-primary); }

        .header-stats { display: flex; gap: 20px; font-size: 0.9rem; }
        .stat-box {
            background: rgba(0,0,0,0.6); border: 1px solid var(--neon-secondary);
            padding: 8px 16px; display: flex; align-items: center; gap: 10px;
        }

        .main-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 25px;
        }
        @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }

        .card {
            background: var(--card-bg); border: var(--glass-border);
            padding: 25px; position: relative; backdrop-filter: blur(15px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.6);
            margin-bottom: 25px; transition: transform 0.3s, box-shadow 0.3s;
            border-radius: 4px;
        }
        .card:hover { transform: translateY(-3px); box-shadow: 0 20px 50px rgba(0,0,0,0.8); }
        .card.full-width { grid-column: 1 / -1; }

        h2 {
            font-family: var(--font-display); color: var(--neon-primary);
            margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 15px; margin-bottom: 20px;
            display: flex; align-items: center; gap: 12px; font-size: 1.3rem;
        }

        .input-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 8px; color: var(--neon-secondary); font-size: 0.85rem; text-transform: uppercase; }
        input[type="text"], select, textarea {
            width: 100%; background: rgba(0,0,0,0.4); border: 1px solid #333;
            color: #fff; padding: 12px; font-family: var(--font-main); font-size: 1rem;
            transition: 0.3s; border-radius: 2px;
        }
        input:focus, textarea:focus {
            outline: none; border-color: var(--neon-primary);
            box-shadow: 0 0 15px rgba(57, 255, 20, 0.2);
        }

        button {
            background: rgba(57, 255, 20, 0.1); color: var(--neon-primary);
            border: 1px solid var(--neon-primary); padding: 12px 20px;
            font-family: var(--font-display); font-weight: 700; cursor: pointer;
            transition: all 0.25s; text-transform: uppercase; letter-spacing: 1px;
            margin: 5px; font-size: 0.85rem;
        }
        button:hover { background: var(--neon-primary); color: #000; box-shadow: 0 0 25px var(--neon-primary); }
        button.secondary { border-color: var(--neon-secondary); color: var(--neon-secondary); background: rgba(0, 255, 255, 0.1); }
        button.secondary:hover { background: var(--neon-secondary); color: #000; }

        .client-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin: 15px 0; }
        .client-btn { padding: 10px; text-align: center; font-size: 0.8rem; }

        .output-area {
            background: rgba(0,0,0,0.6); border: 1px solid #333;
            padding: 15px; margin-top: 15px; word-break: break-all;
            font-size: 0.9rem; min-height: 60px; border-radius: 4px;
        }

        #qrCode { margin-top: 15px; display: flex; justify-content: center; }
        #qrCode canvas { border: 4px solid #fff; }

        .relay-item { 
            background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.1);
            padding: 12px; margin-bottom: 10px; border-radius: 4px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .relay-name { color: var(--neon-secondary); font-weight: bold; margin-bottom: 4px; }
        .relay-url { color: #666; font-size: 0.75rem; font-family: monospace; word-break: break-all; }

        .log-panel {
            background: #000; border: 1px solid #333; padding: 15px; height: 200px;
            overflow-y: auto; font-size: 0.85rem; color: #888;
        }
        .log-entry { margin-bottom: 6px; }
        .log-success { color: var(--neon-primary); }
        .log-error { color: var(--neon-alert); }
        .log-info { color: var(--neon-secondary); }

        .status-badge {
            display: inline-block; padding: 4px 10px; border-radius: 4px;
            font-size: 0.8rem; font-weight: bold;
        }
        .status-online { background: rgba(57, 255, 20, 0.2); color: var(--neon-primary); border: 1px solid var(--neon-primary); }

        .toast {
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: rgba(0, 30, 0, 0.95); border: 1px solid var(--neon-primary);
            color: var(--neon-primary); padding: 12px 25px; border-radius: 4px;
            z-index: 9999; opacity: 0; transition: opacity 0.3s;
            box-shadow: 0 0 20px rgba(0,255,157,0.3);
        }
        .toast.show { opacity: 1; }

        @media (max-width: 768px) {
            .brand { font-size: 1.5rem; }
            .header-stats { display: none; }
            header { padding: 15px; }
            .container { padding: 10px; }
        }
    </style>
</head>
<body>
    <canvas id="matrixCanvas"></canvas>
    <div class="container">
        <header>
            <div class="brand">⚡ 赛博<span>代理</span> V3</div>
            <div class="header-stats">
                <div class="stat-box">🛡️ 隐身模式: <span style="color:var(--neon-primary)">已激活</span></div>
                <div class="stat-box">📍 区域: <span id="regionDisplay">检测中...</span></div>
            </div>
        </header>

        <div class="main-grid">
            <!-- 左侧：链接生成 -->
            <div class="card">
                <h2>🔗 链接生成</h2>
                <div class="input-group">
                    <label>用户标识 (UUID)</label>
                    <input type="text" id="uuidInput" value="${uuid}" readonly>
                </div>
                <div class="input-group">
                    <label>自定义 HOST (可选)</label>
                    <input type="text" id="hostInput" placeholder="留空使用当前域名">
                </div>
                <div style="margin: 15px 0;">
                    <button onclick="generateLink('vless')">生成 VLESS</button>
                    <button class="secondary" onclick="copyOutput()">📋 复制</button>
                </div>
                <div class="output-area" id="outputArea">点击上方按钮生成链接...</div>
                <div id="qrCode"></div>
            </div>

            <!-- 右侧：客户端订阅 -->
            <div class="card">
                <h2>📱 客户端订阅</h2>
                <p style="color:#888; font-size:0.85rem; margin-bottom:15px;">选择您的客户端，自动生成对应格式的订阅链接</p>
                <div class="client-grid">
                    <button class="client-btn" onclick="generateSubLink('clash')">Clash</button>
                    <button class="client-btn" onclick="generateSubLink('v2ray')">V2Ray</button>
                    <button class="client-btn" onclick="generateSubLink('surge')">Surge</button>
                    <button class="client-btn" onclick="generateSubLink('quantumult')">Quantumult</button>
                    <button class="client-btn" onclick="generateSubLink('shadowrocket')">Shadowrocket</button>
                    <button class="client-btn" onclick="generateSubLink('base64')">通用Base64</button>
                </div>
                <div class="output-area" id="subOutput">选择客户端生成订阅链接...</div>
                <button class="secondary" onclick="copySubOutput()" style="margin-top:10px;">📋 复制订阅</button>
            </div>

            <!-- 节点中转 -->
            <div class="card full-width">
                <h2>🔄 节点中转 (反代功能)</h2>
                <p style="color:#888; font-size:0.85rem; margin-bottom:15px;">
                    输入您的节点地址，通过本服务器中转访问。支持被墙节点的救活。
                </p>
                <div class="input-group">
                    <label>节点地址 (IP:端口 或 域名:端口)</label>
                    <textarea id="relayInput" rows="3" placeholder="每行一个，例如:
1.2.3.4:443
node.example.com:8443
[2001:db8::1]:443"></textarea>
                </div>
                <div class="input-group">
                    <label>节点备注 (可选)</label>
                    <input type="text" id="relayName" placeholder="例如: 我的节点">
                </div>
                <div>
                    <button onclick="generateRelayLinks()">✨ 生成中转链接</button>
                    <button class="secondary" onclick="clearRelay()">🗑️ 清空</button>
                    <button class="secondary" onclick="copyAllRelay()">📋 复制全部</button>
                </div>
                <div id="relayResult" style="margin-top:15px;"></div>
            </div>

            <!-- 订阅转换 -->
            <div class="card">
                <h2>📥 万能订阅转换</h2>
                <p style="color:#888; font-size:0.85rem; margin-bottom:15px;">
                    支持 <span style="color:var(--neon-primary)">VLESS / VMess / Trojan / SS / SSR / SOCKS5 / Hysteria2</span> 协议<br>
                    可直接粘贴 Base64 编码订阅，自动解码转换
                </p>
                <div class="input-group">
                    <label>原始订阅/节点链接</label>
                    <textarea id="subConvertInput" rows="4" placeholder="支持多种格式:
• vless://... / vmess://... / trojan://...
• ss://... / ssr://... / socks5://... / hy2://...
• Base64 编码的订阅内容
• IP:Port 格式 (如 1.2.3.4:443)
每行一个，或直接粘贴 Base64 订阅"></textarea>
                </div>

                <button onclick="convertSubscription()">🔄 转换并中转</button>
                <div id="convertResult" style="margin-top:15px;"></div>
            </div>

            <!-- 系统日志 -->
            <div class="card">
                <h2>📊 系统日志</h2>
                <div class="log-panel" id="logPanel"></div>
            </div>
        </div>
    </div>

    <div id="toast" class="toast"></div>

    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
    <script>
        // ===================== 全局配置 =====================
        const CONFIG = {
            uuid: '${uuid}',
            host: window.location.host,
            protocol: window.location.protocol
        };

        // ===================== 工具函数 =====================
        function log(msg, type) {
            var panel = document.getElementById('logPanel');
            var entry = document.createElement('div');
            entry.className = 'log-entry ' + (type === 'success' ? 'log-success' : type === 'error' ? 'log-error' : 'log-info');
            entry.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
            panel.appendChild(entry);
            panel.scrollTop = panel.scrollHeight;
        }

        function showToast(msg) {
            var toast = document.getElementById('toast');
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(function() { toast.classList.remove('show'); }, 3000);
        }

        function copyToClipboard(text) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    showToast('已复制到剪贴板');
                    log('链接已复制', 'success');
                }).catch(function(err) {
                    fallbackCopy(text);
                });
            } else {
                fallbackCopy(text);
            }
        }

        function fallbackCopy(text) {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                showToast('已复制到剪贴板');
                log('链接已复制', 'success');
            } catch (e) {
                showToast('复制失败，请手动复制');
                log('复制失败: ' + e.message, 'error');
            }
            document.body.removeChild(ta);
        }

        // ===================== 链接生成 =====================
        function generateLink(type) {
            var uuid = document.getElementById('uuidInput').value || CONFIG.uuid;
            var host = document.getElementById('hostInput').value || CONFIG.host;
            var wsPath = '/?ed=2048';
            
            var link = 'vless://' + uuid + '@' + host + ':443?' +
                'encryption=none&security=tls&sni=' + host + 
                '&fp=chrome&type=ws&host=' + host + 
                '&path=' + encodeURIComponent(wsPath) + 
                '#赛博代理-' + host;
            
            document.getElementById('outputArea').textContent = link;
            
            // 生成二维码
            var qrDiv = document.getElementById('qrCode');
            qrDiv.innerHTML = '';
            try {
                new QRCode(qrDiv, {
                    text: link,
                    width: 150,
                    height: 150,
                    correctLevel: QRCode.CorrectLevel.L
                });
            } catch(e) {
                log('二维码生成失败: ' + e.message, 'error');
            }
            
            log('VLESS 链接已生成', 'success');
        }

        function copyOutput() {
            var text = document.getElementById('outputArea').textContent;
            if (text && text !== '点击上方按钮生成链接...') {
                copyToClipboard(text);
            } else {
                showToast('请先生成链接');
            }
        }

        // ===================== 订阅生成 =====================
        function generateSubLink(target) {
            var baseUrl = CONFIG.protocol + '//' + CONFIG.host + '/' + CONFIG.uuid + '/sub';
            var url = baseUrl;
            if (target !== 'base64') {
                url += '?target=' + target;
            }
            document.getElementById('subOutput').textContent = url;
            log('订阅链接已生成: ' + target, 'success');
        }

        function copySubOutput() {
            var text = document.getElementById('subOutput').textContent;
            if (text && text !== '选择客户端生成订阅链接...') {
                copyToClipboard(text);
            } else {
                showToast('请先选择客户端');
            }
        }

        // ===================== 节点中转 =====================
        function generateRelayLinks() {
            var input = document.getElementById('relayInput').value.trim();
            var name = document.getElementById('relayName').value.trim() || '中转节点';
            
            if (!input) {
                showToast('请输入节点地址');
                return;
            }
            
            var lines = input.split('\\n').filter(function(l) { return l.trim(); });
            var resultDiv = document.getElementById('relayResult');
            resultDiv.innerHTML = '';
            
            var allLinks = [];
            
            lines.forEach(function(line, index) {
                var addr = line.trim();
                if (!addr) return;
                
                // 解析地址和端口
                var host, port;
                if (addr.indexOf('[') === 0) {
                    // IPv6
                    var match = addr.match(/^\[([^\]]+)\]:?(\d*)$/);
                    if (match) {
                        host = match[1];
                        port = match[2] || '443';
                    }
                } else {
                    var parts = addr.split(':');
                    if (parts.length >= 2) {
                        port = parts.pop();
                        host = parts.join(':');
                    } else {
                        host = addr;
                        port = '443';
                    }
                }
                
                if (!host) return;
                
                // 生成中转链接
                var relayLink = 'vless://' + CONFIG.uuid + '@' + CONFIG.host + ':443?' +
                    'encryption=none&security=tls&sni=' + CONFIG.host +
                    '&fp=chrome&type=ws&host=' + CONFIG.host +
                    '&path=' + encodeURIComponent('/?ed=2048&proxyip=' + host + ':' + port) +
                    '#中转-' + name + '-' + (index + 1);
                
                allLinks.push(relayLink);
                
                // 显示结果
                var item = document.createElement('div');
                item.className = 'relay-item';
                item.innerHTML = '<div style="flex:1;">' +
                    '<div class="relay-name">' + name + '-' + (index + 1) + '</div>' +
                    '<div class="relay-url">' + host + ':' + port + '</div>' +
                    '</div>' +
                    '<button onclick="copyToClipboard(\\'' + relayLink.replace(/'/g, "\\'") + '\\')">复制</button>';
                resultDiv.appendChild(item);
            });
            
            // 存储所有链接用于批量复制
            resultDiv.dataset.allLinks = allLinks.join('\\n');
            
            log('已生成 ' + allLinks.length + ' 个中转链接', 'success');
        }

        function clearRelay() {
            document.getElementById('relayInput').value = '';
            document.getElementById('relayName').value = '';
            document.getElementById('relayResult').innerHTML = '';
            log('已清空中转配置', 'info');
        }

        function copyAllRelay() {
            var resultDiv = document.getElementById('relayResult');
            var allLinks = resultDiv.dataset.allLinks;
            if (allLinks) {
                copyToClipboard(allLinks);
            } else {
                showToast('请先生成中转链接');
            }
        }

        // ===================== 订阅转换（多协议支持） =====================
        
        // Base64 解码
        function safeBase64Decode(str) {
            try {
                // 处理 URL-safe base64
                str = str.replace(/-/g, '+').replace(/_/g, '/');
                // 补齐 padding
                while (str.length % 4) str += '=';
                return decodeURIComponent(escape(atob(str)));
            } catch(e) {
                try {
                    return atob(str);
                } catch(e2) {
                    return null;
                }
            }
        }
        
        // 解析各种协议链接
        function parseProxyLink(line) {
            line = line.trim();
            if (!line) return null;
            
            var result = {
                type: 'unknown',
                host: '',
                port: '',
                name: '节点',
                originalLink: line
            };
            
            try {
                // VLESS: vless://uuid@host:port?params#name
                if (line.indexOf('vless://') === 0) {
                    result.type = 'vless';
                    var urlPart = line.replace('vless://', 'http://');
                    var hashIdx = urlPart.indexOf('#');
                    if (hashIdx > -1) {
                        result.name = decodeURIComponent(urlPart.substring(hashIdx + 1));
                        urlPart = urlPart.substring(0, hashIdx);
                    }
                    var url = new URL(urlPart);
                    result.host = url.hostname;
                    result.port = url.port || '443';
                    return result;
                }
                
                // VMess: vmess://base64json
                if (line.indexOf('vmess://') === 0) {
                    result.type = 'vmess';
                    var vmessData = line.substring(8);
                    var decoded = safeBase64Decode(vmessData);
                    if (decoded) {
                        var json = JSON.parse(decoded);
                        result.host = json.add || json.host || '';
                        result.port = String(json.port || '443');
                        result.name = json.ps || json.remarks || 'VMess节点';
                    }
                    return result;
                }
                
                // Trojan: trojan://password@host:port?params#name
                if (line.indexOf('trojan://') === 0) {
                    result.type = 'trojan';
                    var urlPart = line.replace('trojan://', 'http://fake:');
                    var hashIdx = urlPart.indexOf('#');
                    if (hashIdx > -1) {
                        result.name = decodeURIComponent(urlPart.substring(hashIdx + 1));
                        urlPart = urlPart.substring(0, hashIdx);
                    }
                    var url = new URL(urlPart);
                    result.host = url.hostname;
                    result.port = url.port || '443';
                    return result;
                }
                
                // Shadowsocks: ss://base64@host:port#name 或 ss://base64#name
                if (line.indexOf('ss://') === 0) {
                    result.type = 'ss';
                    var ssPart = line.substring(5);
                    var hashIdx = ssPart.indexOf('#');
                    if (hashIdx > -1) {
                        result.name = decodeURIComponent(ssPart.substring(hashIdx + 1));
                        ssPart = ssPart.substring(0, hashIdx);
                    }
                    // 尝试解析 SIP002 格式
                    if (ssPart.indexOf('@') > -1) {
                        var parts = ssPart.split('@');
                        var serverPart = parts[parts.length - 1];
                        var colonIdx = serverPart.lastIndexOf(':');
                        if (colonIdx > -1) {
                            result.host = serverPart.substring(0, colonIdx);
                            result.port = serverPart.substring(colonIdx + 1);
                        }
                    } else {
                        // 旧格式 base64
                        var decoded = safeBase64Decode(ssPart);
                        if (decoded) {
                            var match = decoded.match(/@([^:]+):(\d+)/);
                            if (match) {
                                result.host = match[1];
                                result.port = match[2];
                            }
                        }
                    }
                    return result;
                }
                
                // SSR: ssr://base64
                if (line.indexOf('ssr://') === 0) {
                    result.type = 'ssr';
                    var ssrData = safeBase64Decode(line.substring(6));
                    if (ssrData) {
                        var parts = ssrData.split(':');
                        if (parts.length >= 2) {
                            result.host = parts[0];
                            result.port = parts[1];
                        }
                        var remarkMatch = ssrData.match(/remarks=([^&]+)/);
                        if (remarkMatch) {
                            result.name = safeBase64Decode(remarkMatch[1]) || 'SSR节点';
                        }
                    }
                    return result;
                }
                
                // SOCKS5: socks5://user:pass@host:port 或 socks://...
                if (line.indexOf('socks5://') === 0 || line.indexOf('socks://') === 0) {
                    result.type = 'socks5';
                    var prefix = line.indexOf('socks5://') === 0 ? 'socks5://' : 'socks://';
                    var urlPart = line.replace(prefix, 'http://');
                    var hashIdx = urlPart.indexOf('#');
                    if (hashIdx > -1) {
                        result.name = decodeURIComponent(urlPart.substring(hashIdx + 1));
                        urlPart = urlPart.substring(0, hashIdx);
                    }
                    var url = new URL(urlPart);
                    result.host = url.hostname;
                    result.port = url.port || '1080';
                    result.name = result.name || 'SOCKS5节点';
                    return result;
                }
                
                // HTTP(S) Proxy: http://host:port
                if (line.indexOf('http://') === 0 || line.indexOf('https://') === 0) {
                    result.type = 'http';
                    var url = new URL(line);
                    result.host = url.hostname;
                    result.port = url.port || (line.indexOf('https://') === 0 ? '443' : '80');
                    result.name = 'HTTP代理';
                    return result;
                }
                
                // Hysteria2: hysteria2://auth@host:port?params#name
                if (line.indexOf('hysteria2://') === 0 || line.indexOf('hy2://') === 0) {
                    result.type = 'hysteria2';
                    var prefix = line.indexOf('hysteria2://') === 0 ? 'hysteria2://' : 'hy2://';
                    var urlPart = line.replace(prefix, 'http://fake:');
                    var hashIdx = urlPart.indexOf('#');
                    if (hashIdx > -1) {
                        result.name = decodeURIComponent(urlPart.substring(hashIdx + 1));
                        urlPart = urlPart.substring(0, hashIdx);
                    }
                    var url = new URL(urlPart);
                    result.host = url.hostname;
                    result.port = url.port || '443';
                    return result;
                }
                
                // 纯 IP:Port 格式
                if (/^[\d\.\[\]:a-fA-F]+$/.test(line) || line.match(/^[a-zA-Z0-9\.\-]+:\d+$/)) {
                    result.type = 'raw';
                    if (line.indexOf('[') === 0) {
                        // IPv6
                        var match = line.match(/^\[([^\]]+)\]:?(\d*)$/);
                        if (match) {
                            result.host = match[1];
                            result.port = match[2] || '443';
                        }
                    } else {
                        var parts = line.split(':');
                        result.port = parts.pop();
                        result.host = parts.join(':');
                    }
                    result.name = '自定义节点';
                    return result;
                }
                
            } catch(e) {
                log('解析失败 [' + line.substring(0, 20) + '...]: ' + e.message, 'error');
            }
            
            return null;
        }
        
        function convertSubscription() {
            var input = document.getElementById('subConvertInput').value.trim();
            if (!input) {
                showToast('请输入订阅链接');
                return;
            }
            
            var resultDiv = document.getElementById('convertResult');
            resultDiv.innerHTML = '<div style="color:#888;">正在解析...</div>';
            
            // 尝试 Base64 解码
            var lines = [];
            if (!input.includes('://') && !input.includes(':')) {
                // 可能是 Base64 编码的订阅
                var decoded = safeBase64Decode(input);
                if (decoded && decoded.includes('://')) {
                    lines = decoded.split('\\n').filter(function(l) { return l.trim(); });
                    log('检测到 Base64 编码订阅，已自动解码 ' + lines.length + ' 条', 'info');
                }
            }
            
            if (lines.length === 0) {
                lines = input.split('\\n').filter(function(l) { return l.trim(); });
            }
            
            var converted = [];
            var stats = { vless: 0, vmess: 0, trojan: 0, ss: 0, ssr: 0, socks5: 0, hysteria2: 0, raw: 0, failed: 0 };
            
            lines.forEach(function(line) {
                var parsed = parseProxyLink(line);
                if (parsed && parsed.host) {
                    stats[parsed.type] = (stats[parsed.type] || 0) + 1;
                    
                    // 生成中转链接
                    var relayLink = 'vless://' + CONFIG.uuid + '@' + CONFIG.host + ':443?' +
                        'encryption=none&security=tls&sni=' + CONFIG.host +
                        '&fp=chrome&type=ws&host=' + CONFIG.host +
                        '&path=' + encodeURIComponent('/?ed=2048&proxyip=' + parsed.host + ':' + parsed.port) +
                        '#中转-' + parsed.name;
                    
                    converted.push({
                        type: parsed.type.toUpperCase(),
                        name: parsed.name,
                        original: parsed.host + ':' + parsed.port,
                        link: relayLink
                    });
                } else {
                    stats.failed++;
                }
            });
            
            // 显示统计
            var statsText = [];
            if (stats.vless > 0) statsText.push('VLESS:' + stats.vless);
            if (stats.vmess > 0) statsText.push('VMess:' + stats.vmess);
            if (stats.trojan > 0) statsText.push('Trojan:' + stats.trojan);
            if (stats.ss > 0) statsText.push('SS:' + stats.ss);
            if (stats.ssr > 0) statsText.push('SSR:' + stats.ssr);
            if (stats.socks5 > 0) statsText.push('SOCKS5:' + stats.socks5);
            if (stats.hysteria2 > 0) statsText.push('Hysteria2:' + stats.hysteria2);
            if (stats.raw > 0) statsText.push('IP直连:' + stats.raw);
            
            if (converted.length === 0) {
                resultDiv.innerHTML = '<div style="color:#ff5555;">没有找到有效的代理链接</div>' +
                    '<div style="color:#888; font-size:0.8rem; margin-top:10px;">支持格式: VLESS, VMess, Trojan, SS, SSR, SOCKS5, Hysteria2, IP:Port, Base64订阅</div>';
                return;
            }
            
            log('解析完成: ' + statsText.join(', ') + (stats.failed > 0 ? ' (失败:' + stats.failed + ')' : ''), 'success');
            
            resultDiv.innerHTML = '<div style="color:var(--neon-primary); margin-bottom:10px;">✅ 已转换 ' + converted.length + ' 个节点 [' + statsText.join(' | ') + ']</div>';
            
            var allLinks = [];
            
            converted.forEach(function(item) {
                allLinks.push(item.link);
                var div = document.createElement('div');
                div.className = 'relay-item';
                div.innerHTML = '<div style="flex:1;">' +
                    '<div class="relay-name"><span style="background:rgba(0,255,157,0.2);padding:2px 6px;border-radius:3px;font-size:0.7rem;margin-right:8px;">' + item.type + '</span>' + item.name + '</div>' +
                    '<div class="relay-url">' + item.original + '</div>' +
                    '</div>' +
                    '<button onclick="copyToClipboard(\\'' + item.link.replace(/'/g, "\\'") + '\\')">复制</button>';
                resultDiv.appendChild(div);
            });
            
            // 添加批量操作按钮
            var btnDiv = document.createElement('div');
            btnDiv.style.cssText = 'margin-top:15px; display:flex; gap:10px; flex-wrap:wrap;';
            btnDiv.innerHTML = '<button class="secondary" onclick="copyToClipboard(\\'' + allLinks.join('\\n').replace(/'/g, "\\'") + '\\')">📋 复制全部链接</button>' +
                '<button class="secondary" onclick="copyToClipboard(\\'' + btoa(allLinks.join('\\n')).replace(/'/g, "\\'") + '\\')">📦 复制 Base64 订阅</button>';
            resultDiv.appendChild(btnDiv);
        }


        // ===================== Matrix 背景效果 =====================

        (function initMatrix() {
            var canvas = document.getElementById('matrixCanvas');
            var ctx = canvas.getContext('2d');
            var drops = [];
            
            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                drops = [];
                var cols = Math.floor(canvas.width / 20);
                for (var i = 0; i < cols; i++) {
                    drops[i] = Math.floor(Math.random() * -100);
                }
            }
            
            function draw() {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#0F0';
                ctx.font = '15px monospace';
                
                for (var i = 0; i < drops.length; i++) {
                    var char = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
                    ctx.fillText(char, i * 20, drops[i] * 20);
                    
                    if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }
            }
            
            window.addEventListener('resize', resize);
            resize();
            setInterval(draw, 50);
        })();

        // ===================== 初始化 =====================
        (function init() {
            log('赛博代理 V3 系统已就绪', 'success');
            log('UUID: ' + CONFIG.uuid, 'info');
            log('Host: ' + CONFIG.host, 'info');
            
            // 检测区域
            fetch('/' + CONFIG.uuid + '/region')
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    document.getElementById('regionDisplay').textContent = data.region || 'Unknown';
                    log('区域检测: ' + data.region, 'success');
                })
                .catch(function(e) {
                    document.getElementById('regionDisplay').textContent = 'JP';
                    log('使用默认区域: JP', 'info');
                });
        })();
    </script>
</body>
</html>`;
}
