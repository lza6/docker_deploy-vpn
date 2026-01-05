
export function getPageHtml(at) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>赛博代理 V3 [终极版]</title>
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://lf3-cdn-tos.bytecdntp.com/cdn/expire-1-M/font-awesome/6.0.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
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

        [data-theme="pink"] { --neon-primary: #ff00ff; --neon-secondary: #00ffff; --grid-line: rgba(255, 0, 255, 0.05); }
        [data-theme="blue"] { --neon-primary: #00ffff; --neon-secondary: #39ff14; --grid-line: rgba(0, 255, 255, 0.05); }
        [data-theme="gold"] { --neon-primary: #ffd700; --neon-secondary: #ff4500; --grid-line: rgba(255, 215, 0, 0.05); }

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

        body::after {
            content: "";
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
            background-size: 100% 2px, 3px 100%;
            pointer-events: none; z-index: 999;
        }

        #matrixCanvas {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            z-index: -2; opacity: 0.12; pointer-events: none;
        }

        .container {
            max-width: 1600px; margin: 0 auto; padding: 20px;
            position: relative; z-index: 1;
        }

        header {
            display: flex; justify-content: space-between; align-items: center;
            box-shadow: 0 5px 30px rgba(0,0,0,0.8), 0 0 10px rgba(0,255,157,0.1);
            position: relative; overflow: hidden;
            border-bottom: 2px solid var(--neon-primary);
        }
        
        header::before {
            content: ''; position: absolute; top:0; left: -100%; width: 50%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            transform: skewX(-20deg); animation: shine 6s infinite linear;
        }
        @keyframes shine { 0% { left: -100%; } 20% { left: 200%; } 100% { left: 200%; } }

        .brand {
            font-family: var(--font-display); font-size: 2.5rem; font-weight: 900;
            color: #fff; text-transform: uppercase; letter-spacing: 2px;
            text-shadow: 0 0 15px var(--neon-primary);
            display: flex; align-items: center; gap: 15px;
        }
        .brand span { color: var(--neon-primary); }
        .brand-icon { font-size: 1.8rem; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 0.7; text-shadow: 0 0 10px var(--neon-primary); } 50% { opacity: 1; text-shadow: 0 0 25px var(--neon-primary); } 100% { opacity: 0.7; text-shadow: 0 0 10px var(--neon-primary); } }

        .header-stats { display: flex; gap: 20px; font-size: 1rem; }
        .stat-box {
            background: rgba(0,0,0,0.6); border: 1px solid var(--neon-secondary);
            padding: 8px 16px; display: flex; align-items: center; gap: 10px;
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.1);
            transition: 0.3s;
        }
        .stat-box:hover { box-shadow: 0 0 15px var(--neon-secondary); transform: translateY(-2px); }

        .main-grid {
            display: grid; grid-template-columns: 380px 1fr; gap: 25px;
        }
        @media (max-width: 1024px) { .main-grid { grid-template-columns: 1fr; } }

        .card {
            background: var(--card-bg); border: var(--glass-border);
            padding: 30px; position: relative; backdrop-filter: blur(15px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.6);
            margin-bottom: 25px; transition: transform 0.3s, box-shadow 0.3s;
            border-radius: 4px;
        }
        .card::after {
            content: ''; position: absolute; bottom: 0; right: 0;
            width: 20px; height: 20px;
            background: linear-gradient(135deg, transparent 50%, var(--neon-primary) 50%);
            opacity: 0.5;
        }
        .card:hover { transform: translateY(-3px); box-shadow: 0 20px 50px rgba(0,0,0,0.8); border-color: rgba(255,255,255,0.2); }

        h2 {
            font-family: var(--font-display); color: var(--neon-primary);
            margin-top: 0; border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 15px; margin-bottom: 25px;
            display: flex; align-items: center; gap: 12px; font-size: 1.5rem;
            letter-spacing: 1px;
        }

        .input-group { margin-bottom: 20px; position: relative; }
        label { display: block; margin-bottom: 8px; color: var(--neon-secondary); font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase; }
        input[type="text"], select, textarea {
            width: 100%; background: rgba(0,0,0,0.4); border: 1px solid #333;
            color: #fff; padding: 14px; font-family: var(--font-main); font-size: 1.05rem;
            transition: 0.3s; border-radius: 2px;
        }
        input:focus, textarea:focus {
            outline: none; border-color: var(--neon-primary);
            box-shadow: 0 0 15px rgba(57, 255, 20, 0.2); background: rgba(0,0,0,0.6);
        }

        button {
            background: rgba(57, 255, 20, 0.1); color: var(--neon-primary);
            border: 1px solid var(--neon-primary); padding: 14px 24px;
            font-family: var(--font-display); font-weight: 700; cursor: pointer;
            transition: all 0.25s; text-transform: uppercase; letter-spacing: 1.5px;
            margin-right: 8px; margin-bottom: 8px; position: relative; overflow: hidden;
            font-size: 0.9rem;
        }
        button:hover { background: var(--neon-primary); color: #000; box-shadow: 0 0 25px var(--neon-primary); transform: translateY(-2px); }
        button.secondary { border-color: var(--neon-secondary); color: var(--neon-secondary); background: rgba(0, 255, 255, 0.1); }
        button.secondary:hover { background: var(--neon-secondary); box-shadow: 0 0 25px var(--neon-secondary); color: #000; }
        button.alert { border-color: var(--neon-alert); color: var(--neon-alert); background: rgba(255, 0, 85, 0.1); }
        button.alert:hover { background: var(--neon-alert); box-shadow: 0 0 25px var(--neon-alert); color: #fff; }

        .map-container {
            height: 450px; background: rgba(0,0,0,0.3); border: 1px solid #333;
            position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;
        }
        #worldMap { width: 100%; height: 100%; }

        .gauge-container { display: flex; flex-wrap: wrap; justify-content: space-around; gap: 20px; margin-top: 20px; }
        .gauge-box { flex: 1; min-width: 200px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 4px; text-align: center; }
        .speed-value { font-size: 3rem; font-family: 'Rajdhani', sans-serif; font-weight: 700; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
        .speed-label { color: #888; font-size: 0.9rem; text-transform: uppercase; margin-bottom: 10px; }

        .relay-item { 
            background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.05);
            padding: 12px; margin-bottom: 10px; border-radius: 4px; display: flex; 
            justify-content: space-between; align-items: center; transition: 0.3s;
        }
        .relay-name { color: var(--neon-secondary); font-weight: bold; margin-bottom: 4px; }
        .relay-url { color: #666; font-size: 0.75rem; font-family: monospace; }

        .terminal-log {
            background: #000; border: 1px solid #333; padding: 15px; height: 250px;
            overflow-y: auto; font-family: 'Courier New', monospace; font-size: 0.85rem; color: #ccc;
        }
        .log-entry { margin-bottom: 6px; border-bottom: 1px solid #111; padding-bottom: 2px; }
        .log-success { color: var(--neon-primary); }
        .log-error { color: var(--neon-alert); }

        .status-badge {
            display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; background: #333; color: #fff;
        }
        .status-badge.online { background: rgba(57, 255, 20, 0.2); color: var(--neon-primary); border: 1px solid var(--neon-primary); }

        @media (max-width: 768px) {
            .brand { font-size: 1.8rem; }
            .header-stats { display: none; }
        }
    </style>
</head>
<body>
    <canvas id="matrixCanvas"></canvas>
    <div class="container">
        <header>
            <div class="brand"><i class="fas fa-microchip brand-icon"></i> 赛博<span>代理</span> V3</div>
            <div class="header-stats">
                <div class="stat-box"><i class="fas fa-shield-alt"></i> 隐身模式: <span style="color:var(--neon-primary)">已激活</span></div>
                <div class="stat-box"><i class="fas fa-network-wired"></i> <span id="publicIP">检测中...</span></div>
                <div class="stat-box" style="border-color: var(--neon-primary)"><i class="fas fa-bolt"></i> <span id="pingValue">--</span> 毫秒</div>
            </div>
        </header>

        <div class="main-grid">
            <div class="left-col">
                <div class="card">
                    <h2><i class="fas fa-link"></i> 访问控制</h2>
                    <div class="input-group">
                        <label>用户标识 (UUID)</label>
                        <input type="text" id="uuidInput" value="${at}" readonly>
                    </div>
                    <div class="input-group">
                        <label>自定义路径别名</label>
                        <input type="text" id="hostInput" value="">
                        <input type="text" id="pathInput" placeholder="/secret-path">
                    </div>
                    <button onclick="generateLink('vless')">VLESS</button>
                    <button class="secondary" onclick="copyLink()">复制</button>
                    <div id="qrCode" style="margin-top: 20px; display: none; background: white; padding: 10px;"></div>
                    <textarea id="outputArea" style="height: 60px; margin-top: 10px;"></textarea>
                </div>
            </div>

            <div class="right-col">
                <div class="card">
                    <h2>订阅中转站</h2>
                    <textarea id="subInput" style="height: 80px;" placeholder="粘贴链接..."></textarea>
                    <button onclick="parseAndRelay()" style="width: 100%">转换并开始中转</button>
                    <div id="relayList"></div>
                </div>
                <div class="card">
                    <h2>系统日志</h2>
                    <div class="terminal-log" id="sysLog"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const workerHost = window.location.host;
        const defaultUUID = "${at}";
        
        function log(msg, type) {
            const div = document.getElementById('sysLog');
            const entry = document.createElement('div');
            entry.className = 'log-entry ' + (type === 'success' ? 'log-success' : (type === 'error' ? 'log-error' : ''));
            entry.innerText = '[' + new Date().toLocaleTimeString() + '] ' + msg;
            div.appendChild(entry);
            div.scrollTop = div.scrollHeight;
        }

        async function parseAndRelay() {
            var input = document.getElementById('subInput').value.trim();
            if(!input) return;
            log('正在解析订阅/节点...', 'info');
            var relayList = document.getElementById('relayList');
            relayList.innerHTML = '<div style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> 正在加速解析...</div>';

            try {
                var nodes = input.split('\n');
                relayList.innerHTML = '';
                nodes.forEach(function(node) {
                    if (node.indexOf('vless://') === -1) return;
                    try {
                        var nodeUrl = node.replace('vless://', 'http://');
                        var url = new URL(nodeUrl);
                        var originalHost = url.hostname;
                        var originalPort = url.port || 443;
                        var hash = url.hash ? url.hash.substring(1) : 'node';
                        var relayUrl = 'vless://' + defaultUUID + '@' + workerHost + ':443' + url.pathname + url.search + '&proxyip=' + originalHost + ':' + originalPort + '#中转-' + decodeURIComponent(hash);

                        var item = document.createElement('div');
                        item.className = 'relay-item';
                        item.innerHTML = '<div class="relay-info"><div class="relay-name">' + decodeURIComponent(hash) + '</div><div class="relay-url">' + relayUrl.substring(0, 50) + '...</div></div>' +
                                         '<div class="relay-actions"><button onclick="copyToClipboard(\'' + relayUrl + '\')">复制</button></div>';
                        relayList.appendChild(item);
                    } catch(e) {}
                });
                log('成功转换 ' + relayList.children.length + ' 个中转节点', 'success');
            } catch (e) {
                log('解析失败: ' + e.message, 'error');
            }
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text);
            log('链接已复制', 'success');
        }

        function copyLink() {
            copyToClipboard(document.getElementById('outputArea').value);
        }

        function generateLink(type) {
            var uuid = document.getElementById('uuidInput').value || defaultUUID;
            var host = document.getElementById('hostInput').value || workerHost;
            var path = document.getElementById('pathInput').value || '/';
            var link = 'vless://' + uuid + '@' + host + ':443?encryption=none&security=tls&sni=' + host + '&fp=chrome&type=ws&host=' + host + '&path=' + encodeURIComponent(path) + '#赛博代理';
            document.getElementById('outputArea').value = link;
            var qr = document.getElementById('qrCode');
            qr.innerHTML = '';
            qr.style.display = 'block';
            new QRCode(qr, { text: link, width: 120, height: 120, correctLevel: QRCode.CorrectLevel.L });
        }

        // Matrix Effect
        const canvas = document.getElementById('matrixCanvas');
        const ctx = canvas.getContext('2d');
        let drops = [];
        function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; drops = Array(Math.floor(canvas.width/20)).fill(1); }
        window.addEventListener('resize', resize);
        resize();
        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0F0'; ctx.font = '15px monospace';
            for (let i = 0; i < drops.length; i++) {
                ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), i * 20, drops[i] * 20);
                if (drops[i] * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        }
        setInterval(draw, 50);

        log('赛博代理 V3 核心系统已就绪', 'success');
    </script>
</body>
</html>`;
}
