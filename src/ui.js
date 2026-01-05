
export function getPageHtml(at) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>赛博代理 V3 [终极版]</title>
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
    <style>
        :root {
            --neon-primary: #39ff14;
            --neon-secondary: #00ffff;
            --neon-alert: #ff0055;
            --bg-color: #050505;
            --card-bg: rgba(10, 12, 16, 0.85);
            --glass-border: 1px solid rgba(255, 255, 255, 0.08);
            --grid-line: rgba(57, 255, 20, 0.05);
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

        /* 扫描线效果 */
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
            border-bottom: 2px solid var(--neon-primary);
            padding: 20px; margin-bottom: 30px;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(10px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.5);
            position: relative; overflow: hidden;
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
        button::before {
            content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(57, 255, 20, 0.4), transparent);
            transition: 0.5s;
        }
        button:hover {
            background: var(--neon-primary); color: #000;
            box-shadow: 0 0 25px var(--neon-primary); transform: translateY(-2px);
        }
        button:hover::before { left: 100%; }
        button:active { transform: translateY(0); }

        button.secondary { border-color: var(--neon-secondary); color: var(--neon-secondary); background: rgba(0, 255, 255, 0.1); }
        button.secondary:hover { background: var(--neon-secondary); box-shadow: 0 0 25px var(--neon-secondary); color: #000; }
        
        button.alert { border-color: var(--neon-alert); color: var(--neon-alert); background: rgba(255, 0, 85, 0.1); }
        button.alert:hover { background: var(--neon-alert); box-shadow: 0 0 25px var(--neon-alert); color: #fff; }

        /* 地图与可视化 */
        .map-container {
            height: 450px; background: rgba(0,0,0,0.3); border: 1px solid #333;
            position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;
        }
        #worldMap { width: 100%; height: 100%; }

        .gauge-container { display: flex; flex-wrap: wrap; justify-content: space-around; gap: 20px; margin-top: 20px; }
        .gauge-box { flex: 1; min-width: 200px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 4px; text-align: center; }
        .speed-value { font-size: 3rem; font-family: 'Rajdhani', sans-serif; font-weight: 700; color: #fff; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
        .speed-label { color: #888; font-size: 0.9rem; text-transform: uppercase; margin-bottom: 10px; }

        /* 日志 */
        .terminal-log {
            background: #000; border: 1px solid #333; padding: 15px; height: 250px;
            overflow-y: auto; font-family: 'Courier New', monospace; font-size: 0.85rem; color: #ccc;
            box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
        }
        .log-entry { margin-bottom: 6px; border-bottom: 1px solid #111; padding-bottom: 2px; display: flex; }
        .log-time { color: #555; margin-right: 15px; min-width: 80px; }
        .log-info { color: var(--neon-secondary); }
        .log-success { color: var(--neon-primary); }
        .log-error { color: var(--neon-alert); }

        .theme-switches { display: flex; gap: 15px; margin-top: 15px; }
        .theme-btn {
            width: 35px; height: 35px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); cursor: pointer; transition: 0.3s;
        }
        .theme-btn:hover { transform: scale(1.1); border-color: #fff; }

        .status-badge {
            display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; background: #333; color: #fff;
        }
        .status-badge.online { background: rgba(57, 255, 20, 0.2); color: var(--neon-primary); border: 1px solid var(--neon-primary); }
        .status-badge.offline { background: rgba(255, 0, 85, 0.2); color: var(--neon-alert); border: 1px solid var(--neon-alert); }
        
        /* 移动端适配 */
        @media (max-width: 768px) {
            .brand { font-size: 1.8rem; }
            .header-stats { display: none; }
            .map-container { height: 300px; }
            .speed-value { font-size: 2.5rem; }
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
            <!-- 移动端菜单切换 -->
        </header>

        <div class="main-grid">
            
            <!-- 左侧列: 控制面板 -->
            <div class="left-col">
                <div class="card">
                    <h2><i class="fas fa-link"></i> 访问控制</h2>
                    <div class="input-group">
                        <label>用户标识 (UUID)</label>
                        <input type="text" id="uuidInput" value="${at}" readonly style="cursor: text; opacity: 0.8; letter-spacing:1px;">
                    </div>
                    <div class="input-group">
                        <label>自定义路径别名</label>
                        <input type="text" id="pathInput" placeholder="/secret-path">
                    </div>
                    <div class="input-group">
                        <label>伪装域名 / 主机名</label>
                        <input type="text" id="hostInput" placeholder="自动检测">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top:20px;">
                        <button onclick="generateLink('vless')"><i class="fas fa-paper-plane"></i> VLESS</button>
                        <button class="secondary" onclick="generateLink('clash')">CLASH</button>
                        <button class="secondary" onclick="generateLink('singbox')">SING-BOX</button>
                        <button class="secondary" onclick="copyLink()"><i class="fas fa-copy"></i> 复制</button>
                    </div>

                    <div id="qrCode" style="margin-top: 25px; text-align: center; background: #fff; padding: 15px; display: none; border-radius: 8px; box-shadow: 0 0 20px rgba(255,255,255,0.2);"></div>
                    <textarea id="outputArea" style="height: 100px; margin-top: 20px; font-size: 0.85rem;" readonly onclick="this.select()"></textarea>
                </div>

                <div class="card">
                    <h2><i class="fas fa-cogs"></i> 系统参数</h2>
                    <label>界面主题</label>
                    <div class="theme-switches">
                        <div class="theme-btn" style="background:#39ff14; box-shadow: 0 0 10px #39ff14" onclick="setTheme('green')"></div>
                        <div class="theme-btn" style="background:#ff00ff; box-shadow: 0 0 10px #ff00ff" onclick="setTheme('pink')"></div>
                        <div class="theme-btn" style="background:#00ffff; box-shadow: 0 0 10px #00ffff" onclick="setTheme('blue')"></div>
                        <div class="theme-btn" style="background:#ffd700; box-shadow: 0 0 10px #ffd700" onclick="setTheme('gold')"></div>
                    </div>
                    <hr style="border-color:rgba(255,255,255,0.1); margin: 25px 0;">
                    <div class="input-group">
                        <label>覆盖优选IP (KV存储)</label>
                        <input type="text" id="kvProxyIP" placeholder="1.2.3.4 (可选)">
                    </div>
                    <button class="alert" onclick="saveKVConfig()" style="width: 100%"><i class="fas fa-save"></i> 更新配置</button>
                </div>
            </div>

            <!-- 右侧列: 可视化与工具 -->
            <div class="right-col">
                
                <!-- 世界地图 -->
                <div class="card">
                    <h2>
                        <i class="fas fa-globe"></i> 全球网络 
                        <span class="status-badge online" style="margin-left:auto" id="regionBadge">...</span>
                    </h2>
                    <div class="map-container">
                        <canvas id="worldMap"></canvas>
                        <div style="position: absolute; bottom: 15px; left: 15px; font-size: 0.8rem; background:rgba(0,0,0,0.7); padding:5px 10px; border-radius:4px;">
                            <i class="fas fa-circle" style="color: var(--neon-primary)"></i> 活跃节点
                            <span style="color:#666; margin: 0 8px;">|</span>
                            <i class="fas fa-circle" style="color: #444;"></i> 离线节点
                        </div>
                    </div>
                </div>

                <!-- 速度测试 -->
                <div class="card">
                    <h2><i class="fas fa-tachometer-alt"></i> 吞吐量指标</h2>
                    <div class="gauge-container">
                        <div class="gauge-box">
                            <div class="speed-value" id="dlSpeed">0.0</div>
                            <div class="speed-label"><i class="fas fa-download"></i> 下载速度 (Mbps)</div>
                            <div style="height: 60px;"><canvas id="dlChart"></canvas></div>
                        </div>
                        <div class="gauge-box">
                            <div class="speed-value" id="ulSpeed">0.0</div>
                            <div class="speed-label"><i class="fas fa-upload"></i> 上传速度 (Mbps)</div>
                            <div style="height: 60px;"><canvas id="ulChart"></canvas></div>
                        </div>
                    </div>
                    <button onclick="runSpeedTest()" id="startTestBtn" style="width: 100%; margin-top: 25px;"><i class="fas fa-play"></i> 开始速度测试</button>
                </div>

                <!-- 系统日志 -->
                <div class="card">
                    <h2><i class="fas fa-terminal"></i> 系统日志</h2>
                    <div class="terminal-log" id="sysLog">
                        <div class="log-entry"><span class="log-time">[系统]</span><span class="log-success">赛博代理 V3 已初始化。反检测: 开启。</span></div>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <script>
        // --- 核心变量 ---
        const workerHost = window.location.host;
        const defaultUUID = "${at}";
        document.getElementById('hostInput').value = workerHost;

        // --- 日志记录器 ---
        function log(msg, type = 'info') {
            const logDiv = document.getElementById('sysLog');
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            const time = new Date().toLocaleTimeString();
            let typeClass = 'log-info';
            if(type === 'success') typeClass = 'log-success';
            if(type === 'error') typeClass = 'log-error';
            
            entry.innerHTML = \`<span class="log-time">[\${time}]</span><span class="\${typeClass}">\${msg}</span>\`;
            logDiv.appendChild(entry);
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        // --- 主题管理器 ---
        function setTheme(color) {
            document.documentElement.setAttribute('data-theme', color);
            localStorage.setItem('theme', color);
            log('主题已更新: ' + color.toUpperCase());
        }
        const savedTheme = localStorage.getItem('theme');
        if(savedTheme) setTheme(savedTheme);

        // --- 矩阵背景 ---
        const matrixCanvas = document.getElementById('matrixCanvas');
        const mCtx = matrixCanvas.getContext('2d');
        let mDrops = [];
        
        function resizeMatrix() {
            matrixCanvas.width = window.innerWidth;
            matrixCanvas.height = window.innerHeight;
            const columns = matrixCanvas.width / 20;
            mDrops = Array(Math.floor(columns)).fill(1);
        }
        window.addEventListener('resize', resizeMatrix);
        resizeMatrix();

        function drawMatrix() {
            mCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            mCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
            mCtx.fillStyle = '#0F0';
            mCtx.font = '15px monospace';
            for (let i = 0; i < mDrops.length; i++) {
                const text = String.fromCharCode(0x30A0 + Math.random() * 96);
                mCtx.fillText(text, i * 20, mDrops[i] * 20);
                if (mDrops[i] * 20 > matrixCanvas.height && Math.random() > 0.975) mDrops[i] = 0;
                mDrops[i]++;
            }
        }
        setInterval(drawMatrix, 50);

        // --- 全息地图 (Canvas 网络图) ---
        const mapCanvas = document.getElementById('worldMap');
        const mapCtx = mapCanvas.getContext('2d');
        
        const mapNodes = [
            {x: 20, y: 35, name: "北美-西部"}, {x: 28, y: 38, name: "北美-东部"}, 
            {x: 48, y: 25, name: "欧洲-西部"}, {x: 52, y: 28, name: "欧洲-东部"}, 
            {x: 75, y: 35, name: "亚洲-东部"}, {x: 82, y: 38, name: "日本"}, 
            {x: 70, y: 60, name: "亚洲-南部"}, {x: 80, y: 75, name: "澳大利亚"}, 
            {x: 30, y: 65, name: "南美-东部"}, {x: 50, y: 55, name: "非洲"}
        ];

        let activeRegion = "GLOBAL";
        
        function resizeMap() {
            const container = mapCanvas.parentElement;
            mapCanvas.width = container.clientWidth;
            mapCanvas.height = container.clientHeight;
        }
        window.addEventListener('resize', resizeMap);
        resizeMap();

        function drawMap() {
            mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
            
            // 绘制连接线
            mapCtx.strokeStyle = 'rgba(57, 255, 20, 0.2)';
            mapCtx.lineWidth = 1;
            mapCtx.beginPath();
            
            const w = mapCanvas.width;
            const h = mapCanvas.height;

            for(let i=0; i<mapNodes.length; i++) {
                for(let j=i+1; j<mapNodes.length; j++) {
                    const n1 = mapNodes[i];
                    const n2 = mapNodes[j];
                    const dist = Math.sqrt(Math.pow(n1.x-n2.x, 2) + Math.pow(n1.y-n2.y, 2));
                    if(dist < 35) { 
                         mapCtx.moveTo(n1.x/100 * w, n1.y/100 * h);
                         mapCtx.lineTo(n2.x/100 * w, n2.y/100 * h);
                    }
                }
            }
            mapCtx.stroke();

            // 绘制节点
            mapNodes.forEach(node => {
                const cx = node.x/100 * w;
                const cy = node.y/100 * h;
                
                // 激活节点高亮
                const isActive = activeRegion !== "GLOBAL" && node.name.toUpperCase().includes(activeRegion);
                const color = isActive ? 'var(--neon-primary)' : 'rgba(255,255,255,0.4)';
                
                // 发光效果
                const grad = mapCtx.createRadialGradient(cx, cy, 2, cx, cy, isActive ? 15 : 8);
                grad.addColorStop(0, isActive ? 'rgba(57, 255, 20, 0.8)' : 'rgba(255,255,255,0.1)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                mapCtx.fillStyle = grad;
                mapCtx.beginPath();
                mapCtx.arc(cx, cy, isActive ? 15 : 8, 0, Math.PI*2);
                mapCtx.fill();

                // 核心点
                mapCtx.fillStyle = '#fff';
                mapCtx.beginPath();
                mapCtx.arc(cx, cy, 2, 0, Math.PI*2);
                mapCtx.fill();
            });
            
            requestAnimationFrame(drawMap);
        }
        drawMap(); 

        // --- 速度测试图表 ---
        const dlChartCtx = document.getElementById('dlChart').getContext('2d');
        const ulChartCtx = document.getElementById('ulChart').getContext('2d');
        
        const chartCommon = {
            type: 'line',
            data: { labels: Array(30).fill(''), datasets: [{ data: Array(30).fill(null), borderColor: '#39ff14', borderWidth: 2, tension: 0.4, pointRadius: 0, fill: true, backgroundColor: 'rgba(57,255,20,0.1)' }] },
            options: { 
                responsive: true, maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { x: { display: false }, y: { display: false, min: 0 } },
                animation: { duration: 0 }
            }
        };

        const dlChart = new Chart(dlChartCtx, JSON.parse(JSON.stringify(chartCommon)));
        const ulChart = new Chart(ulChartCtx, JSON.parse(JSON.stringify(chartCommon)));
        ulChart.data.datasets[0].borderColor = '#00ffff';
        ulChart.data.datasets[0].backgroundColor = 'rgba(0,255,255,0.1)';
        ulChart.update();

        let isTesting = false;

        async function runSpeedTest() {
            if(isTesting) return;
            isTesting = true;
            const btn = document.getElementById('startTestBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在测试...';
            btn.disabled = true;
            
            log('正在进行下行测试 (50MB)...', 'info');

            // --- 下载测试 ---
            try {
                const dlStart = Date.now();
                let dlLoaded = 0;
                const dlUrl = '/api/speedtest/down?bytes=50000000'; 
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                
                const response = await fetch(dlUrl, { signal: controller.signal });
                const reader = response.body.getReader();
                
                const dlInterval = setInterval(() => {
                    const elapsed = (Date.now() - dlStart) / 1000;
                    if(elapsed > 0) {
                        const mbps = (dlLoaded * 8 / 1000000) / elapsed;
                        document.getElementById('dlSpeed').innerText = mbps.toFixed(2);
                        
                        const d = dlChart.data.datasets[0].data;
                        d.shift(); d.push(mbps);
                        dlChart.update();
                    }
                }, 100);

                while(true) {
                    const { done, value } = await reader.read();
                    if(done) break;
                    dlLoaded += value.length;
                }
                clearInterval(dlInterval);
                clearTimeout(timeoutId);
                
                const finalDlMbps = (dlLoaded * 8 / 1000000) / ((Date.now() - dlStart) / 1000);
                document.getElementById('dlSpeed').innerText = finalDlMbps.toFixed(2);
                log(\`下行测试完成: \${finalDlMbps.toFixed(2)} Mbps\`, 'success');

            } catch(e) {
                log('下行测试失败: ' + e.message, 'error');
            }

            // --- 上传测试 ---
            log('正在进行上行测试 (10MB)...', 'info');
            try {
                const chunkSize = 1024 * 1024; 
                const chunks = 10;
                const data = new Uint8Array(chunkSize * chunks).fill(0xAA); 
                
                const startTime = Date.now();
                const response = await fetch('/api/speedtest/up', {
                    method: 'POST', body: data
                });
                
                const resData = await response.json();
                if(resData && resData.durationMs) {
                    const mbps = (resData.receivedBytes * 8 / 1000000) / (resData.durationMs / 1000);
                    document.getElementById('ulSpeed').innerText = mbps.toFixed(2);
                    
                    const d = ulChart.data.datasets[0].data;
                    d.fill(mbps); 
                    ulChart.update();
                    
                    log(\`上行测试完成: \${mbps.toFixed(2)} Mbps\`, 'success');
                }
            } catch(e) {
                log('上行测试失败: ' + e.message, 'error');
            }

            isTesting = false;
            btn.innerHTML = originalText;
            btn.disabled = false;
        }

        // --- 初始化逻辑 ---
        async function init() {
            try {
                // 获取区域
                const res = await fetch(window.location.pathname + '/region');
                const data = await res.json();
                document.getElementById('regionBadge').innerText = data.region;
                activeRegion = data.region;
                if(data.region === 'CUSTOM') {
                    document.getElementById('regionBadge').classList.remove('online');
                    document.getElementById('regionBadge').style.background = '#444';
                }
                
                // 初始延迟测试
                const pStart = performance.now();
                await fetch(window.location.pathname + '/region'); // 使用轻量端点
                const ping = Math.round(performance.now() - pStart);
                document.getElementById('pingValue').innerText = ping;
                
                // 获取配置
                const cfg = await fetch(window.location.pathname + '/api/config').then(r => r.json());
                if(cfg.p) document.getElementById('kvProxyIP').value = cfg.p;

            } catch(e) {
                log('初始化警告: ' + e.message, 'error');
            }
        }
        
        function generateLink(type) {
            const uuid = document.getElementById('uuidInput').value || defaultUUID;
            const host = document.getElementById('hostInput').value || workerHost;
            const pathAlias = document.getElementById('pathInput').value;
            
            // 根据用户输入调整路径
            let connectionPath = pathAlias ? pathAlias : '/';
            if(!connectionPath.startsWith('/')) connectionPath = '/' + connectionPath;

            let link = '';
            if(type === 'vless') {
                const sni = host;
                link = \`vless://\${uuid}@\${host}:443?encryption=none&security=tls&sni=\${sni}&fp=chrome&type=ws&host=\${host}&path=\${encodeURIComponent(connectionPath)}#赛博代理-\${host}\`;
            }
            if(type === 'clash') link = \`https://\${host}/\${uuid}?target=clash\`;
            if(type === 'singbox') link = \`https://\${host}/\${uuid}?target=singbox\`;
            
            document.getElementById('outputArea').value = link;
            
            const qr = document.getElementById('qrCode');
            qr.innerHTML = '';
            qr.style.display = 'inline-block';
            new QRCode(qr, { text: link, width: 120, height: 120, colorDark : "#000000", colorLight : "#ffffff" });
            
            log('已生成安全的 ' + type.toUpperCase() + ' 配置。', 'success');
        }

        function copyLink() {
            const txt = document.getElementById('outputArea').value;
            if(txt) {
                navigator.clipboard.writeText(txt);
                log('配置已复制到剪贴板。', 'success');
            }
        }

        async function saveKVConfig() {
            const p = document.getElementById('kvProxyIP').value;
            try {
                await fetch(window.location.pathname + '/api/config', {
                    method: 'POST',
                    body: JSON.stringify({ p })
                });
                log('配置已持久化到边缘KV存储。', 'success');
            } catch(e) { log('持久化失败: '+e.message, 'error'); }
        }

        init();
    </script>
</body>
</html>`;
}
