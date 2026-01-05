import { getPageHtml } from './ui.js';
import { connect as rawConnect } from 'cloudflare:sockets';

let at = 'd2b5ce3b-67f1-4bb2-93ac-15c9e2a786e2';
let fallbackAddress = '';
let socks5Config = '';
let customPreferredIPs = [];
let customPreferredDomains = [];
let enableSocksDowngrade = false;
let disableNonTLS = false;
let disablePreferred = false;

let enableRegionMatching = true;
let currentWorkerRegion = '';
let manualWorkerRegion = '';
let piu = '';
let cp = '';

let ev = true;
let et = false;
let ex = false;
let tp = '';

let scu = 'https://url.v1.mk/sub';
// 远程配置URL（硬编码）
const remoteConfigUrl = 'https://raw.githubusercontent.com/byJoey/test/refs/heads/main/tist.ini';

let epd = false;   // 优选域名默认关闭
let epi = true;
let egi = true;

let kvStore = null;
let kvConfig = {};

// Buffer Pool for Xhttp
const xhttpBufferPool = [];
const MAX_POOL_SIZE = 20;

// 内存缓存变量 - 减少KV读写消耗
let configCache = { data: null, timestamp: 0 };
const CACHE_TTL = 60 * 1000; // 缓存有效期 60秒

// 动态IP缓存 - 10分钟
let dynamicIPsCache = { data: [], lastFetch: 0 };
const DYNAMIC_IP_CACHE_TTL = 10 * 60 * 1000;

const regionMapping = {
    'US': ['🇺🇸 美国', 'US', 'United States'],
    'SG': ['🇸🇬 新加坡', 'SG', 'Singapore'],
    'JP': ['🇯🇵 日本', 'JP', 'Japan'],
    'KR': ['🇰🇷 韩国', 'KR', 'South Korea'],
    'DE': ['🇩🇪 德国', 'DE', 'Germany'],
    'SE': ['🇸🇪 瑞典', 'SE', 'Sweden'],
    'NL': ['🇳🇱 荷兰', 'NL', 'Netherlands'],
    'FI': ['🇫🇮 芬兰', 'FI', 'Finland'],
    'GB': ['🇬🇧 英国', 'GB', 'United Kingdom'],
    'Oracle': ['甲骨文', 'Oracle'],
    'DigitalOcean': ['数码海', 'DigitalOcean'],
    'Vultr': ['Vultr', 'Vultr'],
    'Multacom': ['Multacom', 'Multacom']
};

let backupIPs = [
    { domain: 'ProxyIP.US.CMLiussss.net', region: 'US', regionCode: 'US', port: 443 },
    { domain: 'ProxyIP.SG.CMLiussss.net', region: 'SG', regionCode: 'SG', port: 443 },
    { domain: 'ProxyIP.JP.CMLiussss.net', region: 'JP', regionCode: 'JP', port: 443 },
    { domain: 'ProxyIP.KR.CMLiussss.net', region: 'KR', regionCode: 'KR', port: 443 },
    { domain: 'ProxyIP.DE.CMLiussss.net', region: 'DE', regionCode: 'DE', port: 443 },
    { domain: 'ProxyIP.SE.CMLiussss.net', region: 'SE', regionCode: 'SE', port: 443 },
    { domain: 'ProxyIP.NL.CMLiussss.net', region: 'NL', regionCode: 'NL', port: 443 },
    { domain: 'ProxyIP.FI.CMLiussss.net', region: 'FI', regionCode: 'FI', port: 443 },
    { domain: 'ProxyIP.GB.CMLiussss.net', region: 'GB', regionCode: 'GB', port: 443 },
    { domain: 'ProxyIP.Oracle.cmliussss.net', region: 'Oracle', regionCode: 'Oracle', port: 443 },
    { domain: 'ProxyIP.DigitalOcean.CMLiussss.net', region: 'DigitalOcean', regionCode: 'DigitalOcean', port: 443 },
    { domain: 'ProxyIP.Vultr.CMLiussss.net', region: 'Vultr', regionCode: 'Vultr', port: 443 },
    { domain: 'ProxyIP.Multacom.CMLiussss.net', region: 'Multacom', regionCode: 'Multacom', port: 443 }
];

const directDomains = [
    { name: "cloudflare.182682.xyz", domain: "cloudflare.182682.xyz" }, { name: "speed.marisalnc.com", domain: "speed.marisalnc.com" },
    { domain: "freeyx.cloudflare88.eu.org" }, { domain: "bestcf.top" }, { domain: "cdn.2020111.xyz" }, { domain: "cfip.cfcdn.vip" },
    { domain: "cf.0sm.com" }, { domain: "cf.090227.xyz" }, { domain: "cf.zhetengsha.eu.org" }, { domain: "cloudflare.9jy.cc" },
    { domain: "cf.zerone-cdn.pp.ua" }, { domain: "cfip.1323123.xyz" }, { domain: "cnamefuckxxs.yuchen.icu" }, { domain: "cloudflare-ip.mofashi.ltd" },
    { domain: "115155.xyz" }, { domain: "cname.xirancdn.us" }, { domain: "f3058171cad.002404.xyz" }, { domain: "8.889288.xyz" },
    { domain: "cdn.tzpro.xyz" }, { domain: "cf.877771.xyz" }, { domain: "xn--b6gac.eu.org" }
];

const E_INVALID_DATA = atob('aW52YWxpZCBkYXRh');
const E_INVALID_USER = atob('aW52YWxpZCB1c2Vy');
const E_UNSUPPORTED_CMD = atob('Y29tbWFuZCBpcyBub3Qgc3VwcG9ydGVk');
const E_UDP_DNS_ONLY = atob('VURQIHByb3h5IG9ubHkgZW5hYmxlIGZvciBETlMgd2hpY2ggaXMgcG9ydCA1Mw==');
const E_INVALID_ADDR_TYPE = atob('aW52YWxpZCBhZGRyZXNzVHlwZQ==');
const E_EMPTY_ADDR = atob('YWRkcmVzc1ZhbHVlIGlzIGVtcHR5');
const E_WS_NOT_OPEN = atob('d2ViU29ja2V0LmVhZHlTdGF0ZSBpcyBub3Qgb3Blbg==');
const E_INVALID_ID_STR = atob('U3RyaW5naWZpZWQgaWRlbnRpZmllciBpcyBpbnZhbGlk');
const E_INVALID_SOCKS_ADDR = atob('SW52YWxpZCBTT0NLUyBhZGRyZXNzIGZvcm1hdA==');
const E_SOCKS_NO_METHOD = atob('bm8gYWNjZXB0YWJsZSBtZXRob2Rz');
const E_SOCKS_AUTH_NEEDED = atob('c29ja3Mgc2VydmVyIG5lZWRzIGF1dGg=');
const E_SOCKS_AUTH_FAIL = atob('ZmFpbCB0byBhdXRoIHNvY2tzIHNlcnZlcg==');
const E_SOCKS_CONN_FAIL = atob('ZmFpbCB0byBvcGVuIHNvY2tzIGNvbm5lY3Rpb24=');

let parsedSocks5Config = {};
let isSocksEnabled = false;

const ADDRESS_TYPE_IPV4 = 1;
const ADDRESS_TYPE_URL = 2;
const ADDRESS_TYPE_IPV6 = 3;

// Circuit Breaker 状态跟踪
const failureTracker = new Map();
const CIRCUIT_BREAKER_THRESHOLD = 3;
const COOLDOWN_PERIOD_MS = 5 * 60 * 1000; // 5分钟冷静期

/**
 * 令牌桶算法限流器
 */
class TokenBucket {
    constructor(capacity, refillRate) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.refillRate = refillRate; // tokens per second
        this.lastRefill = Date.now();
    }

    tryConsume(tokens = 1) {
        this.refill();
        if (this.tokens >= tokens) {
            this.tokens -= tokens;
            return true;
        }
        return false;
    }

    refill() {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;
        if (elapsed > 0) {
            const addedTokens = elapsed * this.refillRate;
            this.tokens = Math.min(this.capacity, this.tokens + addedTokens);
            this.lastRefill = now;
        }
    }
}

/**
 * Advanced Rate Limiter with Per-IP Support
 */
class AdvancedRateLimiter {
    constructor(globalLimit, globalRefill, ipLimit, ipRefill) {
        this.globalBucket = new TokenBucket(globalLimit, globalRefill);
        this.ipBuckets = new Map();
        this.ipLimit = ipLimit;
        this.ipRefill = ipRefill;
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    }

    tryConsume(ip) {
        // Global check
        if (!this.globalBucket.tryConsume()) return false;

        // IP check
        if (!ip) return true; // If no IP provided, just use global

        let bucket = this.ipBuckets.get(ip);
        if (!bucket) {
            bucket = new TokenBucket(this.ipLimit, this.ipRefill);
            this.ipBuckets.set(ip, bucket);
        }

        return bucket.tryConsume();
    }

    cleanup() {
        // Remove buckets that are full (inactive users) to save memory
        for (const [ip, bucket] of this.ipBuckets.entries()) {
            bucket.refill();
            if (bucket.tokens >= bucket.capacity) {
                this.ipBuckets.delete(ip);
            }
        }
    }
}

// Global: 100 burst, 10/s refill | Per-IP: 30 burst, 3/s refill
const rateLimiter = new AdvancedRateLimiter(100, 10, 30, 3);
// Legacy reference for compatibility if used elsewhere (though I will replace usages)
const globalApiLimiter = { tryConsume: () => rateLimiter.tryConsume('global') };

function optimizeHeaders(headers) {
    const newHeaders = new Headers(headers);

    // Dynamic User-Agent Rotation (Simulated for demonstration, usually per-request)
    // In a real scenario, we'd pick from a list of modern UAs
    const modernUAs = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0"
    ];

    if (!newHeaders.has('User-Agent') || newHeaders.get('User-Agent').includes('Go-http-client')) {
        const randomUA = modernUAs[Math.floor(Math.random() * modernUAs.length)];
        newHeaders.set('User-Agent', randomUA);
    }

    // Add Anti-Detect Headers
    newHeaders.set('Sec-CH-UA', '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"');
    newHeaders.set('Sec-CH-UA-Mobile', '?0');
    newHeaders.set('Sec-CH-UA-Platform', '"Windows"');
    newHeaders.set('Sec-Fetch-Dest', 'document');
    newHeaders.set('Sec-Fetch-Mode', 'navigate');
    newHeaders.set('Sec-Fetch-Site', 'none');
    newHeaders.set('Sec-Fetch-User', '?1');
    newHeaders.set('Upgrade-Insecure-Requests', '1');
    newHeaders.set('Accept-Language', 'en-US,en;q=0.9');

    // Remove Proxy Indicators
    newHeaders.delete('X-Forwarded-For');
    newHeaders.delete('CF-Connecting-IP');
    newHeaders.delete('CF-Ray');
    newHeaders.delete('Via');

    return newHeaders;
}

/**
 * 带有熔断机制的连接包装器
 */
function connect(options) {
    const { hostname, port } = options;
    const key = `${hostname}:${port}`;
    const failures = failureTracker.get(key) || { count: 0, lastFailure: 0 };

    if (failures.count >= CIRCUIT_BREAKER_THRESHOLD && (Date.now() - failures.lastFailure < COOLDOWN_PERIOD_MS)) {
        // 如果触发熔断，直接抛出错误（模拟连接失败）
        throw new Error(`Circuit breaker open for ${key}`);
    }

    const socket = rawConnect(options);

    // 监听连接结果
    socket.opened.then(() => {
        // 连接成功，重置失败计数
        failureTracker.delete(key);
    }).catch(() => {
        // 连接失败，增加失败计数
        const current = failureTracker.get(key) || { count: 0, lastFailure: 0 };
        current.count++;
        current.lastFailure = Date.now();
        failureTracker.set(key, current);
    });

    return socket;
}

function isValidFormat(str) {
    const userRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return userRegex.test(str);
}

function isValidIP(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(ip)) return true;

    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Regex.test(ip)) return true;

    const ipv6ShortRegex = /^::1$|^::$|^(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
    if (ipv6ShortRegex.test(ip)) return true;

    return false;
}

async function initKVStore(env) {

    if (env.c || env.C) {
        try {
            kvStore = env.c || env.C;
            await loadKVConfig();
        } catch (error) {
            kvStore = null;
        }
    } else {
    }
}

async function loadKVConfig() {
    // 检查内存缓存 - 减少KV读取次数
    const now = Date.now();
    if (configCache.data && (now - configCache.timestamp < CACHE_TTL)) {
        kvConfig = configCache.data;
        return;
    }

    if (!kvStore) {
        return;
    }

    try {
        const configData = await kvStore.get('c');

        if (configData) {
            kvConfig = JSON.parse(configData);
            // 更新内存缓存
            configCache = { data: kvConfig, timestamp: now };
        } else {
        }
    } catch (error) {
        kvConfig = {};
    }
}

async function saveKVConfig() {
    if (!kvStore) {
        return;
    }

    try {
        const configString = JSON.stringify(kvConfig);
        await kvStore.put('c', configString);
        // 保存时立即更新内存缓存
        configCache = { data: kvConfig, timestamp: Date.now() };
    } catch (error) {
        throw error;
    }
}

function getConfigValue(key, defaultValue = '') {

    if (kvConfig[key] !== undefined) {
        return kvConfig[key];
    }
    return defaultValue;
}

async function setConfigValue(key, value) {
    kvConfig[key] = value;
    await saveKVConfig();
}

async function detectWorkerRegion(request) {
    try {
        const cfCountry = request.cf?.country;

        if (cfCountry) {
            const countryToRegion = {
                'US': 'US', 'SG': 'SG', 'JP': 'JP', 'KR': 'KR',
                'DE': 'DE', 'SE': 'SE', 'NL': 'NL', 'FI': 'FI', 'GB': 'GB',
                'CN': 'SG', 'TW': 'JP', 'AU': 'SG', 'CA': 'US',
                'FR': 'DE', 'IT': 'DE', 'ES': 'DE', 'CH': 'DE',
                'AT': 'DE', 'BE': 'NL', 'DK': 'SE', 'NO': 'SE', 'IE': 'GB'
            };

            if (countryToRegion[cfCountry]) {
                return countryToRegion[cfCountry];
            }
        }

        return 'SG';

    } catch (error) {
        return 'SG';
    }
}

async function checkIPAvailability(domain, port = 443, timeout = 2000) {
    try {
        // 尝试使用 TCP Connect 进行通过性检测 (更准更快)
        const socket = connect({ hostname: domain, port: port });
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
        );

        await Promise.race([
            socket.opened,
            timeoutPromise
        ]);

        socket.close();
        return true;
    } catch (error) {
        // TCP检测失败，尝试HTTP HEAD回退
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(`https://${domain}`, {
                method: 'HEAD',
                signal: controller.signal,
                headers: optimizeHeaders({
                    'User-Agent': 'Mozilla/5.0 (compatible; CF-IP-Checker/2.0)'
                })
            });

            clearTimeout(timeoutId);
            return response.status < 500;
        } catch (e) {
            return false;
        }
    }
}

async function getBestBackupIP(workerRegion = '') {

    if (backupIPs.length === 0) {
        return null;
    }

    const availableIPs = backupIPs.map(ip => ({ ...ip, available: true }));

    if (enableRegionMatching && workerRegion) {
        const sortedIPs = getSmartRegionSelection(workerRegion, availableIPs);
        if (sortedIPs.length > 0) {
            const selectedIP = sortedIPs[0];
            return selectedIP;
        }
    }

    const selectedIP = availableIPs[0];
    return selectedIP;
}

function getNearbyRegions(region) {
    const nearbyMap = {
        'US': ['SG', 'JP', 'KR'],
        'SG': ['JP', 'KR', 'US'],
        'JP': ['SG', 'KR', 'US'],
        'KR': ['JP', 'SG', 'US'],
        'DE': ['NL', 'GB', 'SE', 'FI'],
        'SE': ['DE', 'NL', 'FI', 'GB'],
        'NL': ['DE', 'GB', 'SE', 'FI'],
        'FI': ['SE', 'DE', 'NL', 'GB'],
        'GB': ['DE', 'NL', 'SE', 'FI']
    };

    return nearbyMap[region] || [];
}

function getAllRegionsByPriority(region) {
    const nearbyRegions = getNearbyRegions(region);
    const allRegions = ['US', 'SG', 'JP', 'KR', 'DE', 'SE', 'NL', 'FI', 'GB'];

    return [region, ...nearbyRegions, ...allRegions.filter(r => r !== region && !nearbyRegions.includes(r))];
}

function getSmartRegionSelection(workerRegion, availableIPs) {

    if (!enableRegionMatching || !workerRegion) {
        return availableIPs;
    }

    const priorityRegions = getAllRegionsByPriority(workerRegion);

    const sortedIPs = [];

    for (const region of priorityRegions) {
        let regionIPs = availableIPs.filter(ip => ip.regionCode === region);
        // Fisher-Yates Shuffle - 防止永远只连第一个 IP，增加负载均衡
        for (let i = regionIPs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [regionIPs[i], regionIPs[j]] = [regionIPs[j], regionIPs[i]];
        }
        sortedIPs.push(...regionIPs);
    }

    return sortedIPs;
}

function parseAddressAndPort(input) {
    if (input.includes('[') && input.includes(']')) {
        const match = input.match(/^\[([^\]]+)\](?::(\d+))?$/);
        if (match) {
            return {
                address: match[1],
                port: match[2] ? parseInt(match[2], 10) : null
            };
        }
    }

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

export default {
    async fetch(request, env, ctx) {
        try {
            // Global Error Handler Wrapper
            return await handleRequest(request, env, ctx);
        } catch (err) {
            console.error('Critical Worker Error:', err);
            return new Response(JSON.stringify({
                error: 'Internal Server Error',
                message: err.message,
                timestamp: new Date().toISOString()
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};

async function handleRequest(request, env, ctx) {
    try {

        await initKVStore(env);

        at = (env.u || env.U || at).toLowerCase();
        const subPath = (env.d || env.D || at).toLowerCase();

        const ci = getConfigValue('p', env.p || env.P);
        let useCustomIP = false;

        const manualRegion = getConfigValue('wk', env.wk || env.WK);
        if (manualRegion && manualRegion.trim()) {
            manualWorkerRegion = manualRegion.trim().toUpperCase();
            currentWorkerRegion = manualWorkerRegion;
        } else if (ci && ci.trim()) {
            useCustomIP = true;
            currentWorkerRegion = 'CUSTOM';
        } else {
            currentWorkerRegion = await detectWorkerRegion(request);
        }

        const regionMatchingControl = env.rm || env.RM;
        if (regionMatchingControl && regionMatchingControl.toLowerCase() === 'no') {
            enableRegionMatching = false;
        }

        const envFallback = getConfigValue('p', env.p || env.P);
        if (envFallback) {
            fallbackAddress = envFallback.trim();
        }

        socks5Config = getConfigValue('s', env.s || env.S) || socks5Config;
        if (socks5Config) {
            try {
                parsedSocks5Config = parseSocksConfig(socks5Config);
                isSocksEnabled = true;
            } catch (err) {
                isSocksEnabled = false;
            }
        }

        const customPreferred = getConfigValue('yx', env.yx || env.YX);
        if (customPreferred) {
            try {
                const preferredList = customPreferred.split(',').map(item => item.trim()).filter(item => item);
                customPreferredIPs = [];
                customPreferredDomains = [];

                preferredList.forEach(item => {

                    let nodeName = '';
                    let addressPart = item;

                    if (item.includes('#')) {
                        const parts = item.split('#');
                        addressPart = parts[0].trim();
                        nodeName = parts[1].trim();
                    }

                    const { address, port } = parseAddressAndPort(addressPart);

                    if (!nodeName) {
                        nodeName = '自定义优选-' + address + (port ? ':' + port : '');
                    }

                    if (isValidIP(address)) {
                        customPreferredIPs.push({
                            ip: address,
                            port: port,
                            isp: nodeName
                        });
                    } else {
                        customPreferredDomains.push({
                            domain: address,
                            port: port,
                            name: nodeName
                        });
                    }
                });
            } catch (err) {
                customPreferredIPs = [];
                customPreferredDomains = [];
            }
        }

        const downgradeControl = getConfigValue('qj', env.qj || env.QJ);
        if (downgradeControl && downgradeControl.toLowerCase() === 'no') {
            enableSocksDowngrade = true;
        }

        const dkbyControl = getConfigValue('dkby', env.dkby || env.DKBY);
        if (dkbyControl && dkbyControl.toLowerCase() === 'yes') {
            disableNonTLS = true;
        }

        const yxbyControl = env.yxby || env.YXBY;
        if (yxbyControl && yxbyControl.toLowerCase() === 'yes') {
            disablePreferred = true;
        }

        const vlessControl = getConfigValue('ev', env.ev);
        if (vlessControl !== undefined && vlessControl !== '') {
            ev = vlessControl === 'yes' || vlessControl === true || vlessControl === 'true';
        }

        const tjControl = getConfigValue('et', env.et);
        if (tjControl !== undefined && tjControl !== '') {
            et = tjControl === 'yes' || tjControl === true || tjControl === 'true';
        }

        tp = getConfigValue('tp', env.tp) || '';

        const xhttpControl = getConfigValue('ex', env.ex);
        if (xhttpControl !== undefined && xhttpControl !== '') {
            ex = xhttpControl === 'yes' || xhttpControl === true || xhttpControl === 'true';
        }

        scu = getConfigValue('scu', env.scu) || 'https://url.v1.mk/sub';

        const preferredDomainsControl = getConfigValue('epd', env.epd || 'no');
        if (preferredDomainsControl !== undefined && preferredDomainsControl !== '') {
            epd = preferredDomainsControl !== 'no' && preferredDomainsControl !== false && preferredDomainsControl !== 'false';
        }

        const preferredIPsControl = getConfigValue('epi', env.epi);
        if (preferredIPsControl !== undefined && preferredIPsControl !== '') {
            epi = preferredIPsControl !== 'no' && preferredIPsControl !== false && preferredIPsControl !== 'false';
        }

        const githubIPsControl = getConfigValue('egi', env.egi);
        if (githubIPsControl !== undefined && githubIPsControl !== '') {
            egi = githubIPsControl !== 'no' && githubIPsControl !== false && githubIPsControl !== 'false';
        }

        if (!ev && !et && !ex) {
            ev = true;
        }

        piu = getConfigValue('yxURL', env.yxURL || env.YXURL) || 'https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt';

        cp = getConfigValue('d', env.d || env.D) || '';

        const defaultURL = 'https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt';
        if (piu !== defaultURL) {
            directDomains.length = 0;
            customPreferredIPs = [];
            customPreferredDomains = [];
        }

        const url = new URL(request.url);



        // Enhanced Speed Test Download (V2)
        if (url.pathname.endsWith('/api/speedtest/down')) {
            const bytes = parseInt(url.searchParams.get('bytes') || '0');
            const size = Math.min(bytes, 50 * 1024 * 1024); // 50MB Cap

            if (size <= 0) return new Response('Invalid size', { status: 400 });

            const stream = new ReadableStream({
                start(controller) {
                    const chunkSize = 65536; // 64KB
                    let sent = 0;

                    function push() {
                        if (sent >= size) {
                            controller.close();
                            return;
                        }
                        const toSend = Math.min(chunkSize, size - sent);
                        const chunk = new Uint8Array(toSend);
                        crypto.getRandomValues(chunk); // Harder to compress = more accurate speed test

                        controller.enqueue(chunk);
                        sent += toSend;

                        // Prevent blocking the event loop too much
                        if (controller.desiredSize <= 0) {
                            setTimeout(push, 10);
                        } else {
                            setTimeout(push, 0);
                        }
                    }
                    push();
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': size.toString(),
                    'Cache-Control': 'no-store, no-cache',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Handle Speed Test Upload
        if (url.pathname.endsWith('/api/speedtest/up')) {
            if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

            // Read and discard body
            const reader = request.body.getReader();
            let received = 0;
            const startTime = Date.now();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                received += value.length;
            }
            const duration = Date.now() - startTime;

            return new Response(JSON.stringify({
                status: 'ok',
                receivedBytes: received,
                durationMs: duration
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (url.pathname.includes('/api/config')) {
            // Rate Limit Check
            const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
            if (!rateLimiter.tryConsume(clientIP)) {
                return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const pathParts = url.pathname.split('/').filter(p => p);

            const apiIndex = pathParts.indexOf('api');
            if (apiIndex > 0) {
                const pathSegments = pathParts.slice(0, apiIndex);
                const pathIdentifier = pathSegments.join('/');

                let isValid = false;
                if (cp && cp.trim()) {

                    const cleanCustomPath = cp.trim().startsWith('/') ? cp.trim().substring(1) : cp.trim();
                    isValid = (pathIdentifier === cleanCustomPath);
                } else {

                    isValid = (isValidFormat(pathIdentifier) && pathIdentifier === at);
                }

                if (isValid) {
                    return await handleConfigAPI(request);
                } else {
                    return new Response(JSON.stringify({ error: '路径验证失败' }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            return new Response(JSON.stringify({ error: '无效的API路径' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (url.pathname.includes('/api/preferred-ips')) {
            // Rate Limit Check
            const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
            if (!rateLimiter.tryConsume(clientIP)) {
                return new Response(JSON.stringify({ error: 'Too Many Requests' }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const pathParts = url.pathname.split('/').filter(p => p);

            const apiIndex = pathParts.indexOf('api');
            if (apiIndex > 0) {
                const pathSegments = pathParts.slice(0, apiIndex);
                const pathIdentifier = pathSegments.join('/');

                let isValid = false;
                if (cp && cp.trim()) {

                    const cleanCustomPath = cp.trim().startsWith('/') ? cp.trim().substring(1) : cp.trim();
                    isValid = (pathIdentifier === cleanCustomPath);
                } else {

                    isValid = (isValidFormat(pathIdentifier) && pathIdentifier === at);
                }

                if (isValid) {
                    return await handlePreferredIPsAPI(request);
                } else {
                    return new Response(JSON.stringify({ error: '路径验证失败' }), {
                        status: 403,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            return new Response(JSON.stringify({ error: '无效的API路径' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (request.method === 'POST' && ex) {
            const r = await handleXhttpPost(request);
            if (r) {
                ctx.waitUntil(r.closed);
                return new Response(r.readable, {
                    headers: {
                        'X-Accel-Buffering': 'no',
                        'Cache-Control': 'no-store',
                        Connection: 'keep-alive',
                        'User-Agent': 'Go-http-client/2.0',
                        'Content-Type': 'application/grpc',
                    },
                });
            }
            return new Response('Internal Server Error', { status: 500 });
        }

        if (request.headers.get('Upgrade') === atob('d2Vic29ja2V0')) {
            return await handleWsRequest(request);
        }

        if (request.method === 'GET') {
            // 处理 /{UUID}/region 或 /{自定义路径}/region
            if (url.pathname.endsWith('/region')) {
                const pathParts = url.pathname.split('/').filter(p => p);

                if (pathParts.length === 2 && pathParts[1] === 'region') {
                    const pathIdentifier = pathParts[0];
                    let isValid = false;

                    if (cp && cp.trim()) {
                        // 使用自定义路径
                        const cleanCustomPath = cp.trim().startsWith('/') ? cp.trim().substring(1) : cp.trim();
                        isValid = (pathIdentifier === cleanCustomPath);
                    } else {
                        // 使用UUID路径
                        isValid = (isValidFormat(pathIdentifier) && pathIdentifier === at);
                    }

                    if (isValid) {
                        const ci = getConfigValue('p', env.p || env.P);
                        const manualRegion = getConfigValue('wk', env.wk || env.WK);

                        if (manualRegion && manualRegion.trim()) {
                            return new Response(JSON.stringify({
                                region: manualRegion.trim().toUpperCase(),
                                detectionMethod: '手动指定地区',
                                manualRegion: manualRegion.trim().toUpperCase(),
                                timestamp: new Date().toISOString()
                            }), {
                                headers: { 'Content-Type': 'application/json' }
                            });
                        } else if (ci && ci.trim()) {
                            return new Response(JSON.stringify({
                                region: 'CUSTOM',
                                detectionMethod: '自定义ProxyIP模式', ci: ci,
                                timestamp: new Date().toISOString()
                            }), {
                                headers: { 'Content-Type': 'application/json' }
                            });
                        } else {
                            const detectedRegion = await detectWorkerRegion(request);
                            return new Response(JSON.stringify({
                                region: detectedRegion,
                                detectionMethod: 'API检测',
                                timestamp: new Date().toISOString()
                            }), {
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    } else {
                        return new Response(JSON.stringify({
                            error: '访问被拒绝',
                            message: '路径验证失败'
                        }), {
                            status: 403,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            }

            // 处理 /{UUID}/test-api 或 /{自定义路径}/test-api
            if (url.pathname.endsWith('/test-api')) {
                const pathParts = url.pathname.split('/').filter(p => p);

                if (pathParts.length === 2 && pathParts[1] === 'test-api') {
                    const pathIdentifier = pathParts[0];
                    let isValid = false;

                    if (cp && cp.trim()) {
                        // 使用自定义路径
                        const cleanCustomPath = cp.trim().startsWith('/') ? cp.trim().substring(1) : cp.trim();
                        isValid = (pathIdentifier === cleanCustomPath);
                    } else {
                        // 使用UUID路径
                        isValid = (isValidFormat(pathIdentifier) && pathIdentifier === at);
                    }

                    if (isValid) {
                        try {
                            const testRegion = await detectWorkerRegion(request);
                            return new Response(JSON.stringify({
                                detectedRegion: testRegion,
                                message: 'API测试完成',
                                timestamp: new Date().toISOString()
                            }), {
                                headers: { 'Content-Type': 'application/json' }
                            });
                        } catch (error) {
                            return new Response(JSON.stringify({
                                error: error.message,
                                message: 'API测试失败'
                            }), {
                                status: 500,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    } else {
                        return new Response(JSON.stringify({
                            error: '访问被拒绝',
                            message: '路径验证失败'
                        }), {
                            status: 403,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            }

            // 处理 /{UUID}/latency-check 或 /{自定义路径}/latency-check - 服务端延迟测试API解决Mixed Content问题
            if (url.pathname.endsWith('/latency-check')) {
                const pathParts = url.pathname.split('/').filter(p => p);
                if (pathParts.length === 2 && pathParts[1] === 'latency-check') {
                    const pathIdentifier = pathParts[0];
                    let isValid = false;
                    if (cp && cp.trim()) {
                        const cleanCustomPath = cp.trim().startsWith('/') ? cp.trim().substring(1) : cp.trim();
                        isValid = (pathIdentifier === cleanCustomPath);
                    } else {
                        isValid = (isValidFormat(pathIdentifier) && pathIdentifier === at);
                    }
                    if (isValid) {
                        const targetIP = url.searchParams.get('ip');
                        const targetPort = parseInt(url.searchParams.get('port') || '443');
                        if (!targetIP) {
                            return new Response(JSON.stringify({ latency: -1, status: 'error', message: 'Missing ip parameter' }),
                                { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
                        }
                        const start = Date.now();
                        try {
                            const socket = connect({ hostname: targetIP, port: targetPort });
                            await socket.opened;
                            const duration = Date.now() - start;
                            socket.close();
                            return new Response(JSON.stringify({ latency: duration, status: 'ok', ip: targetIP, port: targetPort }),
                                { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
                        } catch (e) {
                            return new Response(JSON.stringify({ latency: -1, status: 'error', message: e.message, ip: targetIP, port: targetPort }),
                                { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
                        }
                    } else {
                        return new Response(JSON.stringify({ error: '访问被拒绝', message: '路径验证失败' }),
                            { status: 403, headers: { 'Content-Type': 'application/json' } });
                    }
                }
            }

            if (url.pathname === '/') {
                // 检查是否有自定义首页URL配置
                const customHomepage = getConfigValue('homepage', env.homepage || env.HOMEPAGE);
                if (customHomepage && customHomepage.trim()) {
                    try {
                        // 从自定义URL获取内容
                        const homepageResponse = await fetch(customHomepage.trim(), {
                            method: 'GET',
                            headers: optimizeHeaders({
                                'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
                                'Accept': request.headers.get('Accept') || '*/*',
                                'Accept-Language': request.headers.get('Accept-Language') || 'en-US,en;q=0.9',
                            }),
                            redirect: 'follow'
                        });

                        if (homepageResponse.ok) {
                            // 获取响应内容
                            const contentType = homepageResponse.headers.get('Content-Type') || 'text/html; charset=utf-8';
                            const content = await homepageResponse.text();

                            // 返回自定义首页内容
                            return new Response(content, {
                                status: homepageResponse.status,
                                headers: {
                                    'Content-Type': contentType,
                                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                                }
                            });
                        }
                    } catch (error) {
                        // 如果获取失败，继续使用默认终端页面
                        console.error('获取自定义首页失败:', error);
                    }
                }
                // 优先检查Cookie中的语言设置
                const cookieHeader = request.headers.get('Cookie') || '';
                let langFromCookie = null;
                if (cookieHeader) {
                    const cookies = cookieHeader.split(';').map(c => c.trim());
                    for (const cookie of cookies) {
                        if (cookie.startsWith('preferredLanguage=')) {
                            langFromCookie = cookie.split('=')[1];
                            break;
                        }
                    }
                }

                let isFarsi = false;

                if (langFromCookie === 'fa' || langFromCookie === 'fa-IR') {
                    isFarsi = true;
                } else if (langFromCookie === 'zh' || langFromCookie === 'zh-CN') {
                    isFarsi = false;
                } else {
                    // 如果没有Cookie，使用浏览器语言检测
                    const acceptLanguage = request.headers.get('Accept-Language') || '';
                    const browserLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
                    isFarsi = browserLang === 'fa' || acceptLanguage.includes('fa-IR') || acceptLanguage.includes('fa');
                }

                const lang = isFarsi ? 'fa' : 'zh-CN';
                const langAttr = isFarsi ? 'fa-IR' : 'zh-CN';

                const translations = {
                    zh: {
                        title: '终端',
                        terminal: '终端',
                        congratulations: '恭喜你来到这',
                        enterU: '请输入你U变量的值',
                        enterD: '请输入你D变量的值',
                        command: '命令: connect [',
                        uuid: 'UUID',
                        path: 'PATH',
                        inputU: '输入U变量的内容并且回车...',
                        inputD: '输入D变量的内容并且回车...',
                        connecting: '正在连接...',
                        invading: '正在入侵...',
                        success: '连接成功！返回结果...',
                        error: '错误: 无效的UUID格式',
                        reenter: '请重新输入有效的UUID'
                    },
                    fa: {
                        title: 'ترمینال',
                        terminal: 'ترمینال',
                        congratulations: 'تبریک می‌گوییم به شما',
                        enterU: 'لطفا مقدار متغیر U خود را وارد کنید',
                        enterD: 'لطفا مقدار متغیر D خود را وارد کنید',
                        command: 'دستور: connect [',
                        uuid: 'UUID',
                        path: 'PATH',
                        inputU: 'محتویات متغیر U را وارد کرده و Enter را بزنید...',
                        inputD: 'محتویات متغیر D را وارد کرده و Enter را بزنید...',
                        connecting: 'در حال اتصال...',
                        invading: 'در حال نفوذ...',
                        success: 'اتصال موفق! در حال بازگشت نتیجه...',
                        error: 'خطا: فرمت UUID نامعتبر',
                        reenter: 'لطفا UUID معتبر را دوباره وارد کنید'
                    }
                };

                const t = translations[isFarsi ? 'fa' : 'zh'];

                const terminalHtml = `<!DOCTYPE html>
<html lang="${langAttr}" dir="${isFarsi ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.title}</title>
    <style>
        :root {
            --primary: #00ff41;
            --secondary: #008f11;
            --bg: #050505;
            --panel: rgba(10, 20, 10, 0.85);
            --error: #ff3333;
            --font-family: 'Segoe UI', 'Roboto', 'Courier New', monospace;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
        body {
            background-color: var(--bg);
            color: var(--primary);
            font-family: var(--font-family);
            height: 100vh;
            overflow: hidden;
            display: flex;
            justify-content: center;
            align-items: center;
            background-image: 
                radial-gradient(circle at 50% 50%, #0a1f0a 0%, #000 100%);
        }
        
        /* Grid Background */
        .grid-bg {
            position: absolute; width: 200%; height: 200%;
            background-image: 
                linear-gradient(rgba(0, 255, 65, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 65, 0.05) 1px, transparent 1px);
            background-size: 40px 40px;
            transform: perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px);
            animation: gridMove 20s linear infinite;
            z-index: -1;
        }
        @keyframes gridMove { 0% { transform: perspective(500px) rotateX(60deg) translateY(0) translateZ(-200px); } 100% { transform: perspective(500px) rotateX(60deg) translateY(40px) translateZ(-200px); } }

        .login-card {
            width: 100%; max-width: 480px;
            padding: 40px;
            background: var(--panel);
            border: 1px solid rgba(0, 255, 65, 0.3);
            border-radius: 12px;
            box-shadow: 0 0 40px rgba(0, 255, 65, 0.1);
            backdrop-filter: blur(10px);
            position: relative;
            transform: translateY(20px);
            opacity: 0;
            animation: cardFadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        @keyframes cardFadeIn { to { opacity: 1; transform: translateY(0); } }

        .login-card::before {
            content: ''; position: absolute; top: -1px; left: 20px; right: 20px; height: 1px;
            background: linear-gradient(90deg, transparent, var(--primary), transparent);
        }
        .login-card::after {
            content: ''; position: absolute; bottom: -1px; left: 20px; right: 20px; height: 1px;
            background: linear-gradient(90deg, transparent, var(--primary), transparent);
        }

        h1 {
            text-align: center; font-size: 24px; letter-spacing: 2px;
            text-shadow: 0 0 15px rgba(0, 255, 65, 0.6);
            margin-bottom: 10px; font-weight: 600;
        }
        .subtitle {
            text-align: center; font-size: 13px; color: #6dbf6d; margin-bottom: 40px; opacity: 0.8;
        }

        .input-group { position: relative; margin-bottom: 30px; }
        .input-group input {
            width: 100%; background: rgba(0, 0, 0, 0.3);
            border: 1px solid #1a331a; border-radius: 6px;
            padding: 15px; color: #fff; font-size: 16px;
            transition: 0.3s; outline: none; text-align: center; letter-spacing: 1px;
            font-family: 'Courier New', monospace;
        }
        .input-group input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 15px rgba(0, 255, 65, 0.2);
            background: rgba(0, 20, 0, 0.6);
        }
        
        .action-btn {
            width: 100%; padding: 15px; border: none; outline: none;
            background: linear-gradient(180deg, #003300 0%, #001a00 100%);
            border: 1px solid var(--primary);
            color: var(--primary); font-size: 14px; font-weight: bold;
            text-transform: uppercase; letter-spacing: 2px;
            cursor: pointer; transition: 0.3s; border-radius: 6px;
            position: relative; overflow: hidden;
        }
        .action-btn:hover {
            box-shadow: 0 0 20px rgba(0, 255, 65, 0.4);
            text-shadow: 0 0 5px var(--primary);
            background: rgba(0, 50, 0, 0.8);
        }
        .action-btn:disabled { opacity: 0.6; cursor: wait; }

        .footer-status {
            display: flex; justify-content: space-between; margin-top: 30px;
            font-size: 11px; color: #447744; border-top: 1px solid rgba(0, 255, 65, 0.1);
            padding-top: 15px;
        }
        .status-pill {
            display: flex; align-items: center; gap: 6px;
        }
        .dot { width: 6px; height: 6px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 5px var(--primary); }
        
        .lang-switch {
            position: absolute; top: 15px; right: 15px;
        }
        .lang-switch select {
            background: transparent; color: #6dbf6d; border: none; font-size: 12px; cursor: pointer; outline: none;
        }
        
        .toast {
            position: fixed; top: 30px; left: 50%; transform: translateX(-50%);
            padding: 10px 20px; background: rgba(20, 0, 0, 0.9);
            border: 1px solid var(--error); color: var(--error);
            border-radius: 4px; font-size: 13px;
            opacity: 0; transition: 0.3s; pointer-events: none;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
        }
        .toast.show { opacity: 1; transform: translateX(-50%) translateY(10px); }

    </style>
</head>
<body>
    <div class="grid-bg"></div>
    <div class="login-card">
        <div class="lang-switch">
             <select onchange="changeLanguage(this.value)">
                <option value="zh" ${!isFarsi ? 'selected' : ''}>CN</option>
                <option value="fa" ${isFarsi ? 'selected' : ''}>FA</option>
            </select>
        </div>
    
        <h1>SECURE GATEWAY</h1>
        <div class="subtitle">${t.congratulations}</div>
        
        <div class="input-group">
            <input type="text" id="uuidInput" placeholder="${cp && cp.trim() ? t.inputD : t.inputU}" autocomplete="off">
        </div>
        
        <button class="action-btn" onclick="submit()">Connect System</button>
        
        <div class="footer-status">
            <div class="status-pill"><div class="dot"></div>${currentWorkerRegion || "GLOBAL"}</div>
            <div id="latency" style="color: #6dbf6d">--ms</div>
        </div>
    </div>
    
    <div id="toast" class="toast"></div>

    <script>
        const input = document.getElementById('uuidInput');
        const btn = document.querySelector('.action-btn');
        
        // Init
        input.focus();
        setTimeout(() => {
             const start = performance.now();
             fetch('/favicon.ico').then(() => {
                 const lat = Math.round(performance.now() - start);
                 document.getElementById('latency').textContent = lat + 'ms';
             }).catch(() => {});
        }, 800);

        function showToast(msg) {
            const t = document.getElementById('toast');
            t.textContent = msg;
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 3000);
        }

        function changeLanguage(lang) {
            localStorage.setItem('preferredLanguage', lang);
            document.cookie = 'preferredLanguage=' + lang + '; path=/; max-age=31536000; SameSite=Lax';
            location.reload();
        }

        async function submit() {
            const val = input.value.trim();
            if(!val) return;
            
            btn.disabled = true;
            const originalText = btn.innerText;
            btn.innerText = "${isFarsi ? 'در حال اتصال...' : 'VERIFYING...'}";
            
             await new Promise(r => setTimeout(r, 800));

             const cp = '${cp || ""}';
             let target = '';
             let valid = false;
             
             if(cp) {
                 target = val.startsWith('/') ? val : '/' + val;
                 valid = true;
             } else {
                 const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                 if(uuidRegex.test(val)) {
                     target = '/' + val;
                     valid = true;
                 }
             }
             
             if(valid) {
                 btn.innerText = "${isFarsi ? 'موفق!' : 'ACCESS GRANTED'}";
                 btn.style.borderColor = '#fff';
                 btn.style.boxShadow = '0 0 30px #fff';
                 setTimeout(() => window.location.href = target, 600);
             } else {
                 showToast("${isFarsi ? 'خطا: ورودی نامعتبر' : 'ACCESS DENIED: Invalid Format'}");
                 btn.disabled = false;
                 btn.innerText = originalText;
             }
        }

        input.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') submit();
        });
    </script>
</body>
</html>`;
                return new Response(terminalHtml, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
            }

            if (cp && cp.trim()) {
                const cleanCustomPath = cp.trim().startsWith('/') ? cp.trim() : '/' + cp.trim();
                const normalizedCustomPath = cleanCustomPath.endsWith('/') && cleanCustomPath.length > 1 ? cleanCustomPath.slice(0, -1) : cleanCustomPath;
                const normalizedPath = url.pathname.endsWith('/') && url.pathname.length > 1 ? url.pathname.slice(0, -1) : url.pathname;

                if (normalizedPath === normalizedCustomPath) {
                    return await handleSubscriptionPage(request, at);
                }

                if (normalizedPath === normalizedCustomPath + '/sub') {
                    return await handleSubscriptionRequest(request, at, url);
                }

                if (url.pathname.length > 1 && url.pathname !== '/') {
                    const user = url.pathname.replace(/\/$/, '').replace('/sub', '').substring(1);
                    if (isValidFormat(user)) {
                        return new Response(JSON.stringify({
                            error: '访问被拒绝',
                            message: '当前 Worker 已启用自定义路径模式，UUID 访问已禁用'
                        }), {
                            status: 403,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            } else {

                if (url.pathname.length > 1 && url.pathname !== '/' && !url.pathname.includes('/sub')) {
                    const user = url.pathname.replace(/\/$/, '').substring(1);
                    if (isValidFormat(user)) {
                        if (user === at) {
                            return await handleSubscriptionPage(request, user);
                        } else {
                            return new Response(JSON.stringify({ error: 'UUID错误 请注意变量名称是u不是uuid' }), {
                                status: 403,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        }
                    }
                }
                if (url.pathname.includes('/sub')) {
                    const pathParts = url.pathname.split('/');
                    if (pathParts.length === 2 && pathParts[1] === 'sub') {
                        const user = pathParts[0].substring(1);
                        if (isValidFormat(user)) {
                            if (user === at) {
                                return await handleSubscriptionRequest(request, user, url);
                            } else {
                                return new Response(JSON.stringify({ error: 'UUID错误' }), {
                                    status: 403,
                                    headers: { 'Content-Type': 'application/json' }
                                });
                            }
                        }
                    }
                }
            }
            if (url.pathname.toLowerCase().includes(`/${subPath}`)) {
                return await handleSubscriptionRequest(request, at);
            }
        }
        const apiResponse = await handleApiRequest(request, at);
        if (apiResponse) return apiResponse;

        return new Response(JSON.stringify({ error: 'Not Found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        // Global Error Handler
        const errorMsg = err.message || 'Unknown Error';
        return new Response(JSON.stringify({
            status: 'Error',
            message: errorMsg,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

function generateQuantumultConfig(links) {
    return btoa(links.join('\n'));
}

async function handleSubscriptionRequest(request, user, url = null) {
    if (!url) url = new URL(request.url);

    const finalLinks = [];
    const workerDomain = url.hostname;
    const target = url.searchParams.get('target') || 'base64';

    async function addNodesFromList(list) {
        if (ev) {
            finalLinks.push(...generateLinksFromSource(list, user, workerDomain));
        }
        if (et) {
            finalLinks.push(...await generateTrojanLinksFromSource(list, user, workerDomain));
        }
        if (ex) {
            finalLinks.push(...generateXhttpLinksFromSource(list, user, workerDomain));
        }
    }

    if (currentWorkerRegion === 'CUSTOM') {
        const nativeList = [{ ip: workerDomain, isp: '原生地址' }];
        await addNodesFromList(nativeList);
    } else {
        try {
            const nativeList = [{ ip: workerDomain, isp: '原生地址' }];
            await addNodesFromList(nativeList);
        } catch (error) {
            if (!currentWorkerRegion) {
                currentWorkerRegion = await detectWorkerRegion(request);
            }

            const bestBackupIP = await getBestBackupIP(currentWorkerRegion);
            if (bestBackupIP) {
                fallbackAddress = bestBackupIP.domain + ':' + bestBackupIP.port;
                const backupList = [{ ip: bestBackupIP.domain, isp: 'ProxyIP-' + currentWorkerRegion }];
                await addNodesFromList(backupList);
            } else {
                const nativeList = [{ ip: workerDomain, isp: '原生地址' }];
                await addNodesFromList(nativeList);
            }
        }
    }

    const hasCustomPreferred = customPreferredIPs.length > 0 || customPreferredDomains.length > 0;

    if (disablePreferred) {
    } else if (hasCustomPreferred) {

        if (customPreferredIPs.length > 0 && epi) {
            await addNodesFromList(customPreferredIPs);
        }

        if (customPreferredDomains.length > 0 && epd) {
            const customDomainList = customPreferredDomains.map(d => ({ ip: d.domain, isp: d.name || d.domain }));
            await addNodesFromList(customDomainList);
        }
    } else {

        if (epd) {
            const domainList = directDomains.map(d => ({ ip: d.domain, isp: d.name || d.domain }));
            await addNodesFromList(domainList);
        }

        if (epi) {
            const defaultURL = 'https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt';
            if (piu === defaultURL) {
                try {
                    const dynamicIPList = await fetchDynamicIPs();
                    if (dynamicIPList.length > 0) {
                        await addNodesFromList(dynamicIPList);
                    }
                } catch (error) {
                    if (!currentWorkerRegion) {
                        currentWorkerRegion = await detectWorkerRegion(request);
                    }

                    const bestBackupIP = await getBestBackupIP(currentWorkerRegion);
                    if (bestBackupIP) {
                        fallbackAddress = bestBackupIP.domain + ':' + bestBackupIP.port;

                        const backupList = [{ ip: bestBackupIP.domain, isp: 'ProxyIP-' + currentWorkerRegion }];
                        await addNodesFromList(backupList);
                    }
                }
            }
        }

        if (egi) {
            try {
                const newIPList = await fetchAndParseNewIPs();
                if (newIPList.length > 0) {
                    if (ev) {
                        finalLinks.push(...generateLinksFromNewIPs(newIPList, user, workerDomain));
                    }
                    if (et) {
                        finalLinks.push(...await generateTrojanLinksFromNewIPs(newIPList, user, workerDomain));
                    }
                }
            } catch (error) {
                if (!currentWorkerRegion) {
                    currentWorkerRegion = await detectWorkerRegion(request);
                }

                const bestBackupIP = await getBestBackupIP(currentWorkerRegion);
                if (bestBackupIP) {
                    fallbackAddress = bestBackupIP.domain + ':' + bestBackupIP.port;

                    const backupList = [{ ip: bestBackupIP.domain, isp: 'ProxyIP-' + currentWorkerRegion }];
                    await addNodesFromList(backupList);
                }
            }
        }
    }

    if (finalLinks.length === 0) {
        const errorRemark = "所有节点获取失败";
        const proto = atob('dmxlc3M=');
        const errorLink = `${proto}://00000000-0000-0000-0000-000000000000@127.0.0.1:80?encryption=none&security=none&type=ws&host=error.com&path=%2F#${encodeURIComponent(errorRemark)}`;
        finalLinks.push(errorLink);
    }

    let subscriptionContent;
    let contentType = 'text/plain; charset=utf-8';

    switch (target.toLowerCase()) {
        case atob('Y2xhc2g='):
        case atob('Y2xhc2hy'):
            subscriptionContent = await generateClashConfig(finalLinks);
            contentType = 'text/yaml; charset=utf-8';
            break;
        case atob('c3VyZ2U='):
        case atob('c3VyZ2Uy'):
        case atob('c3VyZ2Uz'):
        case atob('c3VyZ2U0'):
            subscriptionContent = generateSurgeConfig(finalLinks);
            break;
        case atob('cXVhbnR1bXVsdA=='):
        case atob('cXVhbng='):
        case 'quanx':
            subscriptionContent = generateQuantumultConfig(finalLinks);
            break;
        case atob('c3M='):
        case atob('c3Ny'):
            subscriptionContent = generateSSConfig(finalLinks);
            break;
        case atob('djJyYXk='):
            subscriptionContent = generateV2RayConfig(finalLinks);
            break;
        case atob('bG9vbg=='):
            subscriptionContent = generateLoonConfig(finalLinks);
            break;
        case atob('c2luZ2JveA=='):
        case 'singbox':
            subscriptionContent = generateSingboxConfig(finalLinks, user);
            contentType = 'application/json; charset=utf-8';
            break;
        default:
            subscriptionContent = btoa(finalLinks.join('\n'));
    }

    return new Response(subscriptionContent, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
    });
}

function generateLinksFromSource(list, user, workerDomain) {

    const CF_HTTP_PORTS = [80, 8080, 8880, 2052, 2082, 2086, 2095];
    const CF_HTTPS_PORTS = [443, 2053, 2083, 2087, 2096, 8443];

    const defaultHttpsPorts = [443];
    const defaultHttpPorts = disableNonTLS ? [] : [80];
    const links = [];
    const wsPath = '/?ed=2048';
    const proto = atob('dmxlc3M=');

    list.forEach(item => {
        let nodeNameBase = item.isp.replace(/\s/g, '_');
        if (item.colo && item.colo.trim()) {
            nodeNameBase = `${nodeNameBase}-${item.colo.trim()}`;
        }
        const safeIP = item.ip.includes(':') ? `[${item.ip}]` : item.ip;

        let portsToGenerate = [];

        if (item.port) {

            const port = item.port;

            if (CF_HTTPS_PORTS.includes(port)) {

                portsToGenerate.push({ port: port, tls: true });
            } else if (CF_HTTP_PORTS.includes(port)) {

                if (!disableNonTLS) {
                    portsToGenerate.push({ port: port, tls: false });
                }
            } else {

                portsToGenerate.push({ port: port, tls: true });
            }
        } else {

            defaultHttpsPorts.forEach(port => {
                portsToGenerate.push({ port: port, tls: true });
            });
            defaultHttpPorts.forEach(port => {
                portsToGenerate.push({ port: port, tls: false });
            });
        }

        portsToGenerate.forEach(({ port, tls }) => {
            if (tls) {

                const wsNodeName = `${nodeNameBase}-${port}-WS-TLS`;
                const wsParams = new URLSearchParams({
                    encryption: 'none',
                    security: 'tls',
                    sni: workerDomain,
                    fp: 'chrome',
                    type: 'ws',
                    host: workerDomain,
                    path: wsPath
                });
                links.push(`${proto}://${user}@${safeIP}:${port}?${wsParams.toString()}#${encodeURIComponent(wsNodeName)}`);
            } else {

                const wsNodeName = `${nodeNameBase}-${port}-WS`;
                const wsParams = new URLSearchParams({
                    encryption: 'none',
                    security: 'none',
                    type: 'ws',
                    host: workerDomain,
                    path: wsPath
                });
                links.push(`${proto}://${user}@${safeIP}:${port}?${wsParams.toString()}#${encodeURIComponent(wsNodeName)}`);
            }
        });
    });
    return links;
}

async function generateTrojanLinksFromSource(list, user, workerDomain) {

    const CF_HTTP_PORTS = [80, 8080, 8880, 2052, 2082, 2086, 2095];
    const CF_HTTPS_PORTS = [443, 2053, 2083, 2087, 2096, 8443];

    const defaultHttpsPorts = [443];
    const defaultHttpPorts = disableNonTLS ? [] : [80];
    const links = [];
    const wsPath = '/?ed=2048';

    const password = tp || user;

    list.forEach(item => {
        let nodeNameBase = item.isp.replace(/\s/g, '_');
        if (item.colo && item.colo.trim()) {
            nodeNameBase = `${nodeNameBase}-${item.colo.trim()}`;
        }
        const safeIP = item.ip.includes(':') ? `[${item.ip}]` : item.ip;

        let portsToGenerate = [];

        if (item.port) {
            const port = item.port;

            if (CF_HTTPS_PORTS.includes(port)) {
                portsToGenerate.push({ port: port, tls: true });
            } else if (CF_HTTP_PORTS.includes(port)) {
                if (!disableNonTLS) {
                    portsToGenerate.push({ port: port, tls: false });
                }
            } else {
                portsToGenerate.push({ port: port, tls: true });
            }
        } else {
            defaultHttpsPorts.forEach(port => {
                portsToGenerate.push({ port: port, tls: true });
            });
            defaultHttpPorts.forEach(port => {
                portsToGenerate.push({ port: port, tls: false });
            });
        }

        portsToGenerate.forEach(({ port, tls }) => {
            if (tls) {

                const wsNodeName = `${nodeNameBase}-${port}-${atob('VHJvamFu')}-WS-TLS`;
                const wsParams = new URLSearchParams({
                    security: 'tls',
                    sni: workerDomain,
                    fp: 'chrome',
                    type: 'ws',
                    host: workerDomain,
                    path: wsPath
                });
                links.push(`${atob('dHJvamFuOi8v')}${password}@${safeIP}:${port}?${wsParams.toString()}#${encodeURIComponent(wsNodeName)}`);
            } else {

                const wsNodeName = `${nodeNameBase}-${port}-${atob('VHJvamFu')}-WS`;
                const wsParams = new URLSearchParams({
                    security: 'none',
                    type: 'ws',
                    host: workerDomain,
                    path: wsPath
                });
                links.push(`${atob('dHJvamFuOi8v')}${password}@${safeIP}:${port}?${wsParams.toString()}#${encodeURIComponent(wsNodeName)}`);
            }
        });
    });
    return links;
}

async function fetchDynamicIPs() {
    const now = Date.now();
    // 检查缓存
    if (dynamicIPsCache.data && dynamicIPsCache.data.length > 0 && (now - dynamicIPsCache.lastFetch < DYNAMIC_IP_CACHE_TTL)) {
        console.log('Using cached dynamic IPs');
        return dynamicIPsCache.data;
    }

    const v4Url1 = "https://www.wetest.vip/page/cloudflare/address_v4.html";
    const v6Url1 = "https://www.wetest.vip/page/cloudflare/address_v6.html";
    let results = [];

    // 读取筛选配置（默认全部启用）
    const ipv4Enabled = getConfigValue('ipv4', '') === '' || getConfigValue('ipv4', 'yes') !== 'no';
    const ipv6Enabled = getConfigValue('ipv6', '') === '' || getConfigValue('ipv6', 'yes') !== 'no';
    const ispMobile = getConfigValue('ispMobile', '') === '' || getConfigValue('ispMobile', 'yes') !== 'no';
    const ispUnicom = getConfigValue('ispUnicom', '') === '' || getConfigValue('ispUnicom', 'yes') !== 'no';
    const ispTelecom = getConfigValue('ispTelecom', '') === '' || getConfigValue('ispTelecom', 'yes') !== 'no';

    try {
        const fetchPromises = [];
        if (ipv4Enabled) {
            fetchPromises.push(fetchAndParseWetest(v4Url1));
        } else {
            fetchPromises.push(Promise.resolve([]));
        }
        if (ipv6Enabled) {
            fetchPromises.push(fetchAndParseWetest(v6Url1));
        } else {
            fetchPromises.push(Promise.resolve([]));
        }

        const [ipv4List, ipv6List] = await Promise.all(fetchPromises);
        results = [...ipv4List, ...ipv6List];

        // 按运营商筛选
        if (results.length > 0) {
            results = results.filter(item => {
                const isp = item.isp || '';
                if (isp.includes('移动') && !ispMobile) return false;
                if (isp.includes('联通') && !ispUnicom) return false;
                if (isp.includes('电信') && !ispTelecom) return false;
                return true;
            });
        }

        if (results.length > 0) {
            // 更新缓存
            dynamicIPsCache = { data: results, lastFetch: now };
            return results;
        }
    } catch (e) {
        console.error('Fetch IPs failed:', e);
    }

    return [];
}

async function fetchAndParseWetest(url) {
    try {
        const response = await fetch(url, { headers: optimizeHeaders({ 'User-Agent': 'Mozilla/5.0' }) });
        if (!response.ok) {
            return [];
        }
        const html = await response.text();
        const results = [];
        const rowRegex = /<tr[\s\S]*?<\/tr>/g;
        const cellRegex = /<td data-label="线路名称">(.+?)<\/td>[\s\S]*?<td data-label="优选地址">([\d.:a-fA-F]+)<\/td>[\s\S]*?<td data-label="数据中心">(.+?)<\/td>/;

        let match;
        while ((match = rowRegex.exec(html)) !== null) {
            const rowHtml = match[0];
            const cellMatch = rowHtml.match(cellRegex);
            if (cellMatch && cellMatch[1] && cellMatch[2]) {
                const colo = cellMatch[3] ? cellMatch[3].trim().replace(/<.*?>/g, '') : '';
                results.push({
                    isp: cellMatch[1].trim().replace(/<.*?>/g, ''),
                    ip: cellMatch[2].trim(),
                    colo: colo
                });
            }
        }

        if (results.length === 0) {
        }

        return results;
    } catch (error) {
        return [];
    }
}

// 静默断开连接（防探测优化）- 随机延迟后断开，迷惑探测器
async function silentDisconnect(ws, minDelay = 200, maxDelay = 700) {
    const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
    await new Promise(r => setTimeout(r, delay));
    closeSocketQuietly(ws);
}

async function handleWsRequest(request) {
    // 检测并设置当前Worker地区，确保WebSocket请求能正确进行就近匹配
    if (!currentWorkerRegion || currentWorkerRegion === '') {
        if (manualWorkerRegion && manualWorkerRegion.trim()) {
            currentWorkerRegion = manualWorkerRegion.trim().toUpperCase();
        } else {
            currentWorkerRegion = await detectWorkerRegion(request);
        }
    }

    const wsPair = new WebSocketPair();
    const [clientSock, serverSock] = Object.values(wsPair);
    serverSock.accept();

    let remoteConnWrapper = { socket: null };
    let isDnsQuery = false;
    let protocolType = null;

    const earlyData = request.headers.get(atob('c2VjLXdlYnNvY2tldC1wcm90b2NvbA==')) || '';
    const readable = makeReadableStream(serverSock, earlyData);

    readable.pipeTo(new WritableStream({
        async write(chunk) {
            if (isDnsQuery) return await forwardUDP(chunk, serverSock, null);
            if (remoteConnWrapper.socket) {
                // 性能优化：直接通过 writer 写入，减少 getWriter/releaseLock 开销
                if (!remoteConnWrapper.writer) {
                    remoteConnWrapper.writer = remoteConnWrapper.socket.writable.getWriter();
                }
                await remoteConnWrapper.writer.write(chunk);
                return;
            }

            if (!protocolType) {

                if (ev && chunk.byteLength >= 24) {
                    const vlessResult = parseWsPacketHeader(chunk, at);
                    if (!vlessResult.hasError) {
                        protocolType = 'vless';
                        const { addressType, port, hostname, rawIndex, version, isUDP } = vlessResult;
                        if (isUDP) {
                            if (port === 53) isDnsQuery = true;
                            else {
                                // 防探测优化：非DNS UDP静默断开
                                await silentDisconnect(serverSock);
                                return;
                            }
                        }
                        const respHeader = new Uint8Array([version[0], 0]);
                        const rawData = chunk.slice(rawIndex);
                        if (isDnsQuery) return forwardUDP(rawData, serverSock, respHeader);
                        await forwardTCP(addressType, hostname, port, rawData, serverSock, respHeader, remoteConnWrapper);
                        return;
                    }
                }

                if (et && chunk.byteLength >= 56) {
                    const tjResult = await parseTrojanHeader(chunk, at);
                    if (!tjResult.hasError) {
                        protocolType = atob('dHJvamFu');
                        const { addressType, port, hostname, rawClientData } = tjResult;
                        await forwardTCP(addressType, hostname, port, rawClientData, serverSock, null, remoteConnWrapper);
                        return;
                    }
                }

                // 防探测优化：静默断开而非返回错误信息
                await silentDisconnect(serverSock);
                return;
            }
        },
        async close() {
            if (remoteConnWrapper.writer) {
                try { await remoteConnWrapper.writer.close(); } catch (e) { }
            }
        },
        abort(reason) {
            if (remoteConnWrapper.writer) {
                try { remoteConnWrapper.writer.abort(reason); } catch (e) { }
            }
        }
    })).catch((err) => { });

    return new Response(null, { status: 101, webSocket: clientSock });
}

async function forwardTCP(addrType, host, portNum, rawData, ws, respHeader, remoteConnWrapper) {
    /** @param {boolean} useSocks */
    async function connectAndSend(address, port, useSocks = false) {
        /** @type {{readable: ReadableStream, writable: WritableStream, closed: Promise<void>}} */
        const remoteSock = useSocks ?
            await establishSocksConnection(addrType, address, port) :
            connect({ hostname: address, port: port });
        const writer = remoteSock.writable.getWriter();
        await writer.write(rawData);
        writer.releaseLock();
        return remoteSock;
    }

    async function retryConnection() {
        if (enableSocksDowngrade && isSocksEnabled) {
            try {
                remoteConnWrapper.writer = null; // 重置 writer
                remoteConnWrapper.socket = socksSocket;
                socksSocket.closed.catch(() => { }).finally(() => closeSocketQuietly(ws));
                connectStreams(socksSocket, ws, respHeader, null);
                return;
            } catch (socksErr) {
                const bestBackupIPs = await getSmartBackupIPs(currentWorkerRegion);
                // 尝试最多2个不同的备份节点
                for (const ipInfo of bestBackupIPs.slice(0, 2)) {
                    try {
                        const fallbackSocket = await connectAndSend(ipInfo.domain, ipInfo.port, isSocksEnabled);
                        remoteConnWrapper.writer = null;
                        remoteConnWrapper.socket = fallbackSocket;
                        fallbackSocket.closed.catch(() => { }).finally(() => closeSocketQuietly(ws));
                        connectStreams(fallbackSocket, ws, respHeader, null);
                        return; // 成功连接，退出
                    } catch (e) {
                        continue; // 尝试下一个
                    }
                }
                // 全部失败
                closeSocketQuietly(ws);
            }
        } else {
            let backupHost, backupPort;
            if (fallbackAddress && fallbackAddress.trim()) {
                const parsed = parseAddressAndPort(fallbackAddress);
                backupHost = parsed.address;
                backupPort = parsed.port || portNum;

                try {
                    const fallbackSocket = await connectAndSend(backupHost, backupPort, isSocksEnabled);
                    remoteConnWrapper.writer = null;
                    remoteConnWrapper.socket = fallbackSocket;
                    fallbackSocket.closed.catch(() => { }).finally(() => closeSocketQuietly(ws));
                    connectStreams(fallbackSocket, ws, respHeader, null);
                } catch (fallbackErr) {
                    closeSocketQuietly(ws);
                }
            } else {
                const bestBackupIPs = await getSmartBackupIPs(currentWorkerRegion);
                // 尝试最多2个不同的备份节点
                for (const ipInfo of bestBackupIPs.slice(0, 2)) {
                    try {
                        const fallbackSocket = await connectAndSend(ipInfo.domain, ipInfo.port, isSocksEnabled);
                        remoteConnWrapper.writer = null;
                        remoteConnWrapper.socket = fallbackSocket;
                        fallbackSocket.closed.catch(() => { }).finally(() => closeSocketQuietly(ws));
                        connectStreams(fallbackSocket, ws, respHeader, null);
                        return;
                    } catch (e) {
                        continue;
                    }
                }
                closeSocketQuietly(ws);
            }
        }
    }

    try {
        const initialSocket = await connectAndSend(host, portNum, enableSocksDowngrade ? false : isSocksEnabled);
        remoteConnWrapper.writer = null; // 重置 writer
        remoteConnWrapper.socket = initialSocket;
        connectStreams(initialSocket, ws, respHeader, retryConnection);
    } catch (err) {
        retryConnection();
    }
}

// 获取智能排序后的备份IP列表
async function getSmartBackupIPs(workerRegion = '') {
    if (backupIPs.length === 0) return [];
    const availableIPs = backupIPs.map(ip => ({ ...ip, available: true }));
    if (enableRegionMatching && workerRegion) {
        return getSmartRegionSelection(workerRegion, availableIPs);
    }
    return availableIPs;
}

function generateSingboxConfig(links, user) {
    const outbounds = [];
    const tags = [];

    // 解析链接并构建 outbounds
    links.forEach((link, index) => {
        try {
            const url = new URL(link);
            const protocol = url.protocol.replace(':', '');
            const tag = decodeURIComponent(url.hash.substring(1)) || `Proxy-${index + 1}`;
            tags.push(tag);

            if (protocol === 'vless') {
                const uuid = url.username;
                const server = url.hostname;
                const port = parseInt(url.port);
                const params = url.searchParams;

                const outbound = {
                    type: "vless",
                    tag: tag,
                    server: server,
                    server_port: port,
                    uuid: uuid,
                    flow: "",
                    tls: {
                        enabled: params.get("security") === "tls",
                        server_name: params.get("sni") || server,
                        insecure: true,
                        utls: {
                            enabled: true,
                            fingerprint: params.get("fp") || "chrome"
                        }
                    },
                    packet_encoding: "xudp",
                    transport: {
                        type: params.get("type") || "ws",
                        path: params.get("path") || "/",
                        headers: {
                            Host: params.get("host") || server
                        }
                    }
                };
                outbounds.push(outbound);
            } else if (protocol === 'trojan') {
                const password = url.username;
                const server = url.hostname;
                const port = parseInt(url.port);
                const params = url.searchParams;

                const outbound = {
                    type: "trojan",
                    tag: tag,
                    server: server,
                    server_port: port,
                    password: password,
                    tls: {
                        enabled: true,
                        server_name: params.get("sni") || server,
                        insecure: true,
                        utls: {
                            enabled: true,
                            fingerprint: params.get("fp") || "chrome"
                        }
                    },
                    transport: {
                        type: params.get("type") || "ws",
                        path: params.get("path") || "/",
                        headers: {
                            Host: params.get("host") || server
                        }
                    }
                };
                outbounds.push(outbound);
            }
        } catch (e) { }
    });

    const config = {
        log: {
            level: "info",
            timestamp: true
        },
        dns: {
            servers: [
                { tag: "google", address: "tls://8.8.8.8", detour: "proxy" },
                { tag: "local", address: "223.5.5.5", detour: "direct" }
            ],
            rules: [
                { outbound: "any", server: "local" }
            ]
        },
        inbounds: [
            {
                type: "tun",
                tag: "tun-in",
                interface_name: "tun0",
                inet4_address: "172.19.0.1/30",
                mtu: 9000,
                auto_route: true,
                strict_route: true,
                stack: "system",
                sniff: true
            }
        ],
        outbounds: [
            {
                type: "selector",
                tag: "proxy",
                outbounds: ["auto", ...tags]
            },
            {
                type: "urltest",
                tag: "auto",
                outbounds: tags,
                url: "http://www.gstatic.com/generate_204",
                interval: "10m",
                tolerance: 50
            },
            ...outbounds,
            { type: "direct", tag: "direct" },
            { type: "block", tag: "block" }
        ],
        route: {
            rules: [
                { protocol: "dns", outbound: "dns-out" },
                { geosite: "cn", outbound: "direct" },
                { geoip: "cn", outbound: "direct" },
                { geoip: "private", outbound: "direct" }
            ],
            auto_detect_interface: true
        }
    };

    return JSON.stringify(config, null, 2);
}

function parseWsPacketHeader(chunk, token) {
    if (chunk.byteLength < 24) return { hasError: true, message: E_INVALID_DATA };
    const version = new Uint8Array(chunk.slice(0, 1));
    if (formatIdentifier(new Uint8Array(chunk.slice(1, 17))) !== token) return { hasError: true, message: E_INVALID_USER };
    const optLen = new Uint8Array(chunk.slice(17, 18))[0];
    const cmd = new Uint8Array(chunk.slice(18 + optLen, 19 + optLen))[0];
    let isUDP = false;
    if (cmd === 1) { } else if (cmd === 2) { isUDP = true; } else { return { hasError: true, message: E_UNSUPPORTED_CMD }; }
    const portIdx = 19 + optLen;
    const port = new DataView(chunk.slice(portIdx, portIdx + 2)).getUint16(0);
    let addrIdx = portIdx + 2, addrLen = 0, addrValIdx = addrIdx + 1, hostname = '';
    const addressType = new Uint8Array(chunk.slice(addrIdx, addrValIdx))[0];
    switch (addressType) {
        case ADDRESS_TYPE_IPV4: addrLen = 4; hostname = new Uint8Array(chunk.slice(addrValIdx, addrValIdx + addrLen)).join('.'); break;
        case ADDRESS_TYPE_URL: addrLen = new Uint8Array(chunk.slice(addrValIdx, addrValIdx + 1))[0]; addrValIdx += 1; hostname = new TextDecoder().decode(chunk.slice(addrValIdx, addrValIdx + addrLen)); break;
        case ADDRESS_TYPE_IPV6: addrLen = 16; const ipv6 = []; const ipv6View = new DataView(chunk.slice(addrValIdx, addrValIdx + addrLen)); for (let i = 0; i < 8; i++) ipv6.push(ipv6View.getUint16(i * 2).toString(16)); hostname = ipv6.join(':'); break;
        default: return { hasError: true, message: `${E_INVALID_ADDR_TYPE}: ${addressType}` };
    }
    if (!hostname) return { hasError: true, message: `${E_EMPTY_ADDR}: ${addressType}` };
    return { hasError: false, addressType, port, hostname, isUDP, rawIndex: addrValIdx + addrLen, version };
}

function makeReadableStream(socket, earlyDataHeader) {
    let cancelled = false;
    return new ReadableStream({
        start(controller) {
            socket.addEventListener('message', (event) => { if (!cancelled) controller.enqueue(event.data); });
            socket.addEventListener('close', () => { if (!cancelled) { closeSocketQuietly(socket); controller.close(); } });
            socket.addEventListener('error', (err) => controller.error(err));
            const { earlyData, error } = base64ToArray(earlyDataHeader);
            if (error) controller.error(error); else if (earlyData) controller.enqueue(earlyData);
        },
        cancel() { cancelled = true; closeSocketQuietly(socket); }
    });
}

async function connectStreams(remoteSocket, webSocket, headerData, retryFunc) {
    let header = headerData, hasData = false;
    await remoteSocket.readable.pipeTo(
        new WritableStream({
            async write(chunk, controller) {
                hasData = true;
                if (webSocket.readyState !== 1) controller.error(E_WS_NOT_OPEN);
                if (header) {
                    webSocket.send(concat_typed_arrays(header, chunk));
                    header = null;
                } else {
                    webSocket.send(chunk);
                }
            },
            abort(reason) { },
        })
    ).catch((error) => { closeSocketQuietly(webSocket); });
    if (!hasData && retryFunc) retryFunc();
}

async function forwardUDP(udpChunk, webSocket, respHeader) {
    try {
        /** @type {{readable: ReadableStream, writable: WritableStream, closed: Promise<void>, close: Function}} */
        const tcpSocket = connect({ hostname: '8.8.4.4', port: 53 });
        let header = respHeader;
        const writer = tcpSocket.writable.getWriter();
        await writer.write(udpChunk);
        writer.releaseLock();

        // UDP会话超时管理（30秒无活动断开，防止僵尸连接）
        const UDP_TIMEOUT_MS = 30 * 1000;
        let lastActivity = Date.now();
        const timeoutChecker = setInterval(() => {
            if (Date.now() - lastActivity > UDP_TIMEOUT_MS) {
                clearInterval(timeoutChecker);
                try { tcpSocket.close(); } catch (e) { }
                closeSocketQuietly(webSocket);
            }
        }, 5000);

        await tcpSocket.readable.pipeTo(new WritableStream({
            async write(chunk) {
                lastActivity = Date.now(); // 刷新最后活动时间
                if (webSocket.readyState === 1) {
                    if (header) { webSocket.send(await new Blob([header, chunk]).arrayBuffer()); header = null; }
                    else { webSocket.send(chunk); }
                }
            },
            close() {
                clearInterval(timeoutChecker);
            },
            abort() {
                clearInterval(timeoutChecker);
            }
        }));
        clearInterval(timeoutChecker); // 正常完成时也清除
    } catch (error) {
        // 静默处理错误
    }
}

async function establishSocksConnection(addrType, address, port) {
    const { username, password, hostname, socksPort } = parsedSocks5Config;
    const socket = connect({ hostname, port: socksPort });
    const writer = socket.writable.getWriter();
    await writer.write(new Uint8Array(username ? [5, 2, 0, 2] : [5, 1, 0]));
    const reader = socket.readable.getReader();
    let res = (await reader.read()).value;
    if (res[0] !== 5 || res[1] === 255) throw new Error(E_SOCKS_NO_METHOD);
    if (res[1] === 2) {
        if (!username || !password) throw new Error(E_SOCKS_AUTH_NEEDED);
        const encoder = new TextEncoder();
        const authRequest = new Uint8Array([1, username.length, ...encoder.encode(username), password.length, ...encoder.encode(password)]);
        await writer.write(authRequest);
        res = (await reader.read()).value;
        if (res[0] !== 1 || res[1] !== 0) throw new Error(E_SOCKS_AUTH_FAIL);
    }
    const encoder = new TextEncoder(); let DSTADDR;
    switch (addrType) {
        case ADDRESS_TYPE_IPV4: DSTADDR = new Uint8Array([1, ...address.split('.').map(Number)]); break;
        case ADDRESS_TYPE_URL: DSTADDR = new Uint8Array([3, address.length, ...encoder.encode(address)]); break;
        case ADDRESS_TYPE_IPV6: DSTADDR = new Uint8Array([4, ...address.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]); break;
        default: throw new Error(E_INVALID_ADDR_TYPE);
    }
    await writer.write(new Uint8Array([5, 1, 0, ...DSTADDR, port >> 8, port & 255]));
    res = (await reader.read()).value;
    if (res[1] !== 0) throw new Error(E_SOCKS_CONN_FAIL);
    writer.releaseLock(); reader.releaseLock();
    return socket;
}

function parseSocksConfig(address) {
    let [latter, former] = address.split("@").reverse();
    let username, password, hostname, socksPort;

    if (former) {
        const formers = former.split(":");
        if (formers.length !== 2) throw new Error(E_INVALID_SOCKS_ADDR);
        [username, password] = formers;
    }

    const latters = latter.split(":");
    socksPort = Number(latters.pop());
    if (isNaN(socksPort)) throw new Error(E_INVALID_SOCKS_ADDR);

    hostname = latters.join(":");
    if (hostname.includes(":") && !/^\[.*\]$/.test(hostname)) throw new Error(E_INVALID_SOCKS_ADDR);

    return { username, password, hostname, socksPort };
}

async function handleSubscriptionPage(request, user = null) {
    if (!user) user = at;

    const pageHtml = getPageHtml(user);

    return new Response(pageHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

async function parseTrojanHeader(buffer, ut) {

    const passwordToHash = tp || ut;
    const sha224Password = await sha224Hash(passwordToHash);

    if (buffer.byteLength < 56) {
        return {
            hasError: true,
            message: "invalid " + atob('dHJvamFu') + " data - too short"
        };
    }
    let crLfIndex = 56;
    if (new Uint8Array(buffer.slice(56, 57))[0] !== 0x0d || new Uint8Array(buffer.slice(57, 58))[0] !== 0x0a) {
        return {
            hasError: true,
            message: "invalid " + atob('dHJvamFu') + " header format (missing CR LF)"
        };
    }
    const password = new TextDecoder().decode(buffer.slice(0, crLfIndex));
    if (password !== sha224Password) {
        return {
            hasError: true,
            message: "invalid " + atob('dHJvamFu') + " password"
        };
    }

    const socks5DataBuffer = buffer.slice(crLfIndex + 2);
    if (socks5DataBuffer.byteLength < 6) {
        return {
            hasError: true,
            message: atob('aW52YWxpZCBTT0NLUzUgcmVxdWVzdCBkYXRh')
        };
    }

    const view = new DataView(socks5DataBuffer);
    const cmd = view.getUint8(0);
    if (cmd !== 1) {
        return {
            hasError: true,
            message: "unsupported command, only TCP (CONNECT) is allowed"
        };
    }

    const atype = view.getUint8(1);
    let addressLength = 0;
    let addressIndex = 2;
    let address = "";
    switch (atype) {
        case 1:
            addressLength = 4;
            address = new Uint8Array(
                socks5DataBuffer.slice(addressIndex, addressIndex + addressLength)
            ).join(".");
            break;
        case 3:
            addressLength = new Uint8Array(
                socks5DataBuffer.slice(addressIndex, addressIndex + 1)
            )[0];
            addressIndex += 1;
            address = new TextDecoder().decode(
                socks5DataBuffer.slice(addressIndex, addressIndex + addressLength)
            );
            break;
        case 4:
            addressLength = 16;
            const dataView = new DataView(socks5DataBuffer.slice(addressIndex, addressIndex + addressLength));
            const ipv6 = [];
            for (let i = 0; i < 8; i++) {
                ipv6.push(dataView.getUint16(i * 2).toString(16));
            }
            address = ipv6.join(":");
            break;
        default:
            return {
                hasError: true,
                message: `invalid addressType is ${atype}`
            };
    }

    if (!address) {
        return {
            hasError: true,
            message: `address is empty, addressType is ${atype}`
        };
    }

    const portIndex = addressIndex + addressLength;
    const portBuffer = socks5DataBuffer.slice(portIndex, portIndex + 2);
    const portRemote = new DataView(portBuffer).getUint16(0);

    return {
        hasError: false,
        addressRemote: address,
        addressType: atype,
        port: portRemote,
        hostname: address,
        rawClientData: socks5DataBuffer.slice(portIndex + 4)
    };
}

async function sha224Hash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // 优先尝试使用 Web Crypto API (性能更高)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        try {
            const hashBuffer = await crypto.subtle.digest("SHA-224", data);
            return Array.from(new Uint8Array(hashBuffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        } catch (e) {
            // 如果不支持 SHA-224，回退到 JS 实现
        }
    }

    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    let H = [
        0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
        0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4
    ];

    const msgLen = data.length;
    const bitLen = msgLen * 8;
    const paddedLen = Math.ceil((msgLen + 9) / 64) * 64;
    const padded = new Uint8Array(paddedLen);
    padded.set(data);
    padded[msgLen] = 0x80;

    const view = new DataView(padded.buffer);
    view.setUint32(paddedLen - 4, bitLen, false);

    for (let chunk = 0; chunk < paddedLen; chunk += 64) {
        const W = new Uint32Array(64);

        for (let i = 0; i < 16; i++) {
            W[i] = view.getUint32(chunk + i * 4, false);
        }

        for (let i = 16; i < 64; i++) {
            const s0 = rightRotate(W[i - 15], 7) ^ rightRotate(W[i - 15], 18) ^ (W[i - 15] >>> 3);
            const s1 = rightRotate(W[i - 2], 17) ^ rightRotate(W[i - 2], 19) ^ (W[i - 2] >>> 10);
            W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
        }

        let [a, b, c, d, e, f, g, h] = H;

        for (let i = 0; i < 64; i++) {
            const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            const ch = (e & f) ^ (~e & g);
            const temp1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
            const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) >>> 0;

            h = g;
            g = f;
            f = e;
            e = (d + temp1) >>> 0;
            d = c;
            c = b;
            b = a;
            a = (temp1 + temp2) >>> 0;
        }

        H[0] = (H[0] + a) >>> 0;
        H[1] = (H[1] + b) >>> 0;
        H[2] = (H[2] + c) >>> 0;
        H[3] = (H[3] + d) >>> 0;
        H[4] = (H[4] + e) >>> 0;
        H[5] = (H[5] + f) >>> 0;
        H[6] = (H[6] + g) >>> 0;
        H[7] = (H[7] + h) >>> 0;
    }

    const result = [];
    for (let i = 0; i < 7; i++) {
        result.push(
            ((H[i] >>> 24) & 0xff).toString(16).padStart(2, '0'),
            ((H[i] >>> 16) & 0xff).toString(16).padStart(2, '0'),
            ((H[i] >>> 8) & 0xff).toString(16).padStart(2, '0'),
            (H[i] & 0xff).toString(16).padStart(2, '0')
        );
    }

    return result.join('');
}

function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
}

let ACTIVE_CONNECTIONS = 0;
const XHTTP_BUFFER_SIZE = 128 * 1024;
const CONNECT_TIMEOUT_MS = 5000;
const IDLE_TIMEOUT_MS = 45000;
const MAX_RETRIES = 2;
const MAX_CONCURRENT = 32;

function xhttp_sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function validate_uuid_xhttp(id, uuid) {
    for (let index = 0; index < 16; index++) {
        if (id[index] !== uuid[index]) {
            return false;
        }
    }
    return true;
}

class XhttpCounter {
    #total

    constructor() {
        this.#total = 0;
    }

    get() {
        return this.#total;
    }

    add(size) {
        this.#total += size;
    }
}

function concat_typed_arrays(first, ...args) {
    let len = first.length;
    for (let a of args) {
        len += a.length;
    }
    const r = new first.constructor(len);
    r.set(first, 0);
    len = first.length;
    for (let a of args) {
        r.set(a, len);
        len += a.length;
    }
    return r;
}

function parse_uuid_xhttp(uuid) {
    uuid = uuid.replaceAll('-', '');
    const r = [];
    for (let index = 0; index < 16; index++) {
        const v = parseInt(uuid.substr(index * 2, 2), 16);
        r.push(v);
    }
    return r;
}

function get_xhttp_buffer(size) {
    if (!size || size === XHTTP_BUFFER_SIZE) {
        return xhttpBufferPool.pop() || new Uint8Array(XHTTP_BUFFER_SIZE);
    }
    return new Uint8Array(size);
}

function release_xhttp_buffer(buffer) {
    if (buffer && buffer.length === XHTTP_BUFFER_SIZE && xhttpBufferPool.length < MAX_POOL_SIZE) {
        xhttpBufferPool.push(buffer);
    }
}

async function read_xhttp_header(readable, uuid_str) {
    const reader = readable.getReader({ mode: 'byob' });

    try {
        let r = await reader.readAtLeast(1 + 16 + 1, get_xhttp_buffer());
        let rlen = 0;
        let idx = 0;
        let cache = r.value;
        rlen += r.value.length;

        const version = cache[0];
        const id = cache.slice(1, 1 + 16);
        const uuid = parse_uuid_xhttp(uuid_str);
        if (!validate_uuid_xhttp(id, uuid)) {
            return `invalid UUID`;
        }
        const pb_len = cache[1 + 16];
        const addr_plus1 = 1 + 16 + 1 + pb_len + 1 + 2 + 1;

        if (addr_plus1 + 1 > rlen) {
            if (r.done) {
                return `header too short`;
            }
            idx = addr_plus1 + 1 - rlen;
            r = await reader.readAtLeast(idx, get_xhttp_buffer());
            rlen += r.value.length;
            cache = concat_typed_arrays(cache, r.value);
        }

        const cmd = cache[1 + 16 + 1 + pb_len];
        if (cmd !== 1) {
            return `unsupported command: ${cmd}`;
        }
        const port = (cache[addr_plus1 - 1 - 2] << 8) + cache[addr_plus1 - 1 - 1];
        const atype = cache[addr_plus1 - 1];
        let header_len = -1;
        if (atype === ADDRESS_TYPE_IPV4) {
            header_len = addr_plus1 + 4;
        } else if (atype === ADDRESS_TYPE_IPV6) {
            header_len = addr_plus1 + 16;
        } else if (atype === ADDRESS_TYPE_URL) {
            header_len = addr_plus1 + 1 + cache[addr_plus1];
        }

        if (header_len < 0) {
            return 'read address type failed';
        }

        idx = header_len - rlen;
        if (idx > 0) {
            if (r.done) {
                return `read address failed`;
            }
            r = await reader.readAtLeast(idx, get_xhttp_buffer());
            rlen += r.value.length;
            cache = concat_typed_arrays(cache, r.value);
        }

        let hostname = '';
        idx = addr_plus1;
        switch (atype) {
            case ADDRESS_TYPE_IPV4:
                hostname = cache.slice(idx, idx + 4).join('.');
                break;
            case ADDRESS_TYPE_URL:
                hostname = new TextDecoder().decode(
                    cache.slice(idx + 1, idx + 1 + cache[idx]),
                );
                break;
            case ADDRESS_TYPE_IPV6:
                hostname = cache
                    .slice(idx, idx + 16)
                    .reduce(
                        (s, b2, i2, a) =>
                            i2 % 2
                                ? s.concat(((a[i2 - 1] << 8) + b2).toString(16))
                                : s,
                        [],
                    )
                    .join(':');
                break;
        }

        if (hostname.length < 1) {
            return 'failed to parse hostname';
        }

        const data = cache.slice(header_len);
        return {
            hostname,
            port,
            data,
            resp: new Uint8Array([version, 0]),
            reader,
            done: r.done,
        };
    } catch (error) {
        try { reader.releaseLock(); } catch (_) { }
        throw error;
    }
}

async function upload_to_remote_xhttp(counter, writer, httpx) {
    async function inner_upload(d) {
        if (!d || d.length === 0) {
            return;
        }
        counter.add(d.length);
        try {
            await writer.write(d);
        } catch (error) {
            throw error;
        }
    }

    try {
        await inner_upload(httpx.data);
        let chunkCount = 0;
        while (!httpx.done) {
            const r = await httpx.reader.read(get_xhttp_buffer());
            if (r.done) break;
            await inner_upload(r.value);
            httpx.done = r.done;
            chunkCount++;
            if (chunkCount % 10 === 0) {
                await xhttp_sleep(0);
            }
            if (!r.value || r.value.length === 0) {
                await xhttp_sleep(2);
            }
        }
    } catch (error) {
        throw error;
    }
}

function create_xhttp_uploader(httpx, writable) {
    const counter = new XhttpCounter();
    const writer = writable.getWriter();

    const done = (async () => {
        try {
            await upload_to_remote_xhttp(counter, writer, httpx);
        } catch (error) {
            throw error;
        } finally {
            try {
                await writer.close();
            } catch (error) {

            }
        }
    })();

    return {
        counter,
        done,
        abort: () => {
            try { writer.abort(); } catch (_) { }
        }
    };
}

function create_xhttp_downloader(resp, remote_readable) {
    const counter = new XhttpCounter();
    let stream;

    const done = new Promise((resolve, reject) => {
        stream = new TransformStream(
            {
                start(controller) {
                    counter.add(resp.length);
                    controller.enqueue(resp);
                },
                transform(chunk, controller) {
                    counter.add(chunk.length);
                    controller.enqueue(chunk);
                },
                cancel(reason) {
                    reject(`download cancelled: ${reason}`);
                },
            },
            null,
            new ByteLengthQueuingStrategy({ highWaterMark: XHTTP_BUFFER_SIZE }),
        );

        let lastActivity = Date.now();
        const idleTimer = setInterval(() => {
            if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
                try {
                    stream.writable.abort?.('idle timeout');
                } catch (_) { }
                clearInterval(idleTimer);
                reject('idle timeout');
            }
        }, 5000);

        const reader = remote_readable.getReader();
        const writer = stream.writable.getWriter();

        ; (async () => {
            try {
                let chunkCount = 0;
                while (true) {
                    const r = await reader.read();
                    if (r.done) {
                        break;
                    }
                    lastActivity = Date.now();
                    await writer.write(r.value);
                    chunkCount++;
                    if (chunkCount % 5 === 0) {
                        await xhttp_sleep(0);
                    }
                }
                await writer.close();
                resolve();
            } catch (err) {
                reject(err);
            } finally {
                try {
                    reader.releaseLock();
                } catch (_) { }
                try {
                    writer.releaseLock();
                } catch (_) { }
                clearInterval(idleTimer);
            }
        })();
    });

    return {
        readable: stream.readable,
        counter,
        done,
        abort: () => {
            try { stream.readable.cancel(); } catch (_) { }
            try { stream.writable.abort(); } catch (_) { }
        }
    };
}

async function connect_to_remote_xhttp(httpx, ...remotes) {
    let attempt = 0;
    let lastErr;

    const connectionList = [httpx.hostname, ...remotes.filter(r => r && r !== httpx.hostname)];

    for (const hostname of connectionList) {
        if (!hostname) continue;

        attempt = 0;
        while (attempt < MAX_RETRIES) {
            attempt++;
            try {
                const remote = connect({ hostname, port: httpx.port });
                const timeoutPromise = xhttp_sleep(CONNECT_TIMEOUT_MS).then(() => {
                    throw new Error(atob('Y29ubmVjdCB0aW1lb3V0'));
                });

                await Promise.race([remote.opened, timeoutPromise]);

                const uploader = create_xhttp_uploader(httpx, remote.writable);
                const downloader = create_xhttp_downloader(httpx.resp, remote.readable);

                return {
                    downloader,
                    uploader,
                    close: () => {
                        try { remote.close(); } catch (_) { }
                    }
                };
            } catch (err) {
                lastErr = err;
                if (attempt < MAX_RETRIES) {
                    await xhttp_sleep(500 * attempt);
                }
            }
        }
    }

    return null;
}

async function handle_xhttp_client(body, uuid) {
    if (ACTIVE_CONNECTIONS >= MAX_CONCURRENT) {
        return new Response('Too many connections', { status: 429 });
    }

    ACTIVE_CONNECTIONS++;

    let cleaned = false;
    const cleanup = () => {
        if (!cleaned) {
            ACTIVE_CONNECTIONS = Math.max(0, ACTIVE_CONNECTIONS - 1);
            cleaned = true;
        }
    };

    try {
        const httpx = await read_xhttp_header(body, uuid);
        if (typeof httpx !== 'object' || !httpx) {
            return null;
        }

        const remoteConnection = await connect_to_remote_xhttp(httpx, fallbackAddress, '13.230.34.30');
        if (remoteConnection === null) {
            return null;
        }

        const connectionClosed = Promise.race([
            (async () => {
                try {
                    await remoteConnection.downloader.done;
                } catch (err) {

                }
            })(),
            (async () => {
                try {
                    await remoteConnection.uploader.done;
                } catch (err) {

                }
            })(),
            xhttp_sleep(IDLE_TIMEOUT_MS).then(() => {

            })
        ]).finally(() => {
            try { remoteConnection.close(); } catch (_) { }
            try { remoteConnection.downloader.abort(); } catch (_) { }
            try { remoteConnection.uploader.abort(); } catch (_) { }

            cleanup();
        });

        return {
            readable: remoteConnection.downloader.readable,
            closed: connectionClosed
        };
    } catch (error) {
        cleanup();
        return null;
    }
}

async function handleXhttpPost(request) {
    try {
        return await handle_xhttp_client(request.body, at);
    } catch (err) {
        return null;
    }
}

function base64ToArray(b64Str) {
    if (!b64Str) return { error: null };
    try { b64Str = b64Str.replace(/-/g, '+').replace(/_/g, '/'); return { earlyData: Uint8Array.from(atob(b64Str), (c) => c.charCodeAt(0)).buffer, error: null }; }
    catch (error) { return { error }; }
}

// 优化 closeSocketQuietly，防止资源泄漏\r\nfunction closeSocketQuietly(socket) {\r\n    if (!socket) return;\r\n    try {\r\n        if (socket.readyState === 1 || socket.readyState === 2) socket.close();\r\n        // 增加对 ReadableStream/WritableStream 的关闭尝试\r\n        if (socket.readable && !socket.readable.locked) socket.readable.cancel().catch(() => {});\r\n        if (socket.writable && !socket.writable.locked) socket.writable.abort().catch(() => {});\r\n    } catch (error) { }\r\n}

const hexTable = Array.from({ length: 256 }, (v, i) => (i + 256).toString(16).slice(1));
function formatIdentifier(arr, offset = 0) {
    const id = (hexTable[arr[offset]] + hexTable[arr[offset + 1]] + hexTable[arr[offset + 2]] + hexTable[arr[offset + 3]] + "-" + hexTable[arr[offset + 4]] + hexTable[arr[offset + 5]] + "-" + hexTable[arr[offset + 6]] + hexTable[arr[offset + 7]] + "-" + hexTable[arr[offset + 8]] + hexTable[arr[offset + 9]] + "-" + hexTable[arr[offset + 10]] + hexTable[arr[offset + 11]] + hexTable[arr[offset + 12]] + hexTable[arr[offset + 13]] + hexTable[arr[offset + 14]] + hexTable[arr[offset + 15]]).toLowerCase();
    if (!isValidFormat(id)) throw new TypeError(E_INVALID_ID_STR);
    return id;
}

async function fetchAndParseNewIPs() {
    const url = piu || "https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt";
    try {
        const urls = url.includes(',') ? url.split(',').map(u => u.trim()).filter(u => u) : [url];
        const apiResults = await fetchPreferredAPI(urls, '443', 5000);

        if (apiResults.length > 0) {
            const results = [];
            const regex = /^(\[[\da-fA-F:]+\]|[\d.]+|[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*)(?::(\d+))?(?:#(.+))?$/;

            for (const item of apiResults) {
                const match = item.match(regex);
                if (match) {
                    results.push({
                        ip: match[1],
                        port: parseInt(match[2] || '443', 10),
                        name: match[3]?.trim() || match[1]
                    });
                }
            }
            return results;
        }

        const response = await fetch(url);
        if (!response.ok) return [];
        const text = await response.text();
        const results = [];
        const lines = text.trim().replace(/\r/g, "").split('\n');
        const simpleRegex = /^([^:]+):(\d+)#(.*)$/;

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            const match = trimmedLine.match(simpleRegex);
            if (match) {
                results.push({
                    ip: match[1],
                    port: parseInt(match[2], 10),
                    name: match[3].trim() || match[1]
                });
            }
        }
        return results;
    } catch (error) {
        return [];
    }
}

function generateLinksFromNewIPs(list, user, workerDomain) {

    const CF_HTTP_PORTS = [80, 8080, 8880, 2052, 2082, 2086, 2095];
    const CF_HTTPS_PORTS = [443, 2053, 2083, 2087, 2096, 8443];

    const links = [];
    const wsPath = '/?ed=2048';
    const proto = atob('dmxlc3M=');

    list.forEach(item => {
        const nodeName = item.name.replace(/\s/g, '_');
        const port = item.port;

        if (CF_HTTPS_PORTS.includes(port)) {

            const wsNodeName = `${nodeName}-${port}-WS-TLS`;
            const link = `${proto}://${user}@${item.ip}:${port}?encryption=none&security=tls&sni=${workerDomain}&fp=chrome&type=ws&host=${workerDomain}&path=${wsPath}#${encodeURIComponent(wsNodeName)}`;
            links.push(link);
        } else if (CF_HTTP_PORTS.includes(port)) {

            if (!disableNonTLS) {
                const wsNodeName = `${nodeName}-${port}-WS`;
                const link = `${proto}://${user}@${item.ip}:${port}?encryption=none&security=none&type=ws&host=${workerDomain}&path=${wsPath}#${encodeURIComponent(wsNodeName)}`;
                links.push(link);
            }
        } else {

            const wsNodeName = `${nodeName}-${port}-WS-TLS`;
            const link = `${proto}://${user}@${item.ip}:${port}?encryption=none&security=tls&sni=${workerDomain}&fp=chrome&type=ws&host=${workerDomain}&path=${wsPath}#${encodeURIComponent(wsNodeName)}`;
            links.push(link);
        }
    });
    return links;
}

function generateXhttpLinksFromSource(list, user, workerDomain) {
    const links = [];
    const nodePath = user.substring(0, 8);

    list.forEach(item => {
        let nodeNameBase = item.isp.replace(/\s/g, '_');
        if (item.colo && item.colo.trim()) {
            nodeNameBase = `${nodeNameBase}-${item.colo.trim()}`;
        }
        const safeIP = item.ip.includes(':') ? `[${item.ip}]` : item.ip;
        const port = item.port || 443;

        const wsNodeName = `${nodeNameBase}-${port}-xhttp`;
        const params = new URLSearchParams({
            encryption: 'none',
            security: 'tls',
            sni: workerDomain,
            fp: 'chrome',
            allowInsecure: '1',
            type: 'xhttp',
            host: workerDomain,
            path: `/${nodePath}`,
            mode: 'stream-one'
        });

        links.push(`vless://${user}@${safeIP}:${port}?${params.toString()}#${encodeURIComponent(wsNodeName)}`);
    });

    return links;
}

async function generateTrojanLinksFromNewIPs(list, user, workerDomain) {

    const CF_HTTP_PORTS = [80, 8080, 8880, 2052, 2082, 2086, 2095];
    const CF_HTTPS_PORTS = [443, 2053, 2083, 2087, 2096, 8443];

    const links = [];
    const wsPath = '/?ed=2048';

    const password = tp || user;

    list.forEach(item => {
        const nodeName = item.name.replace(/\s/g, '_');
        const port = item.port;

        if (CF_HTTPS_PORTS.includes(port)) {

            const wsNodeName = `${nodeName}-${port}-${atob('VHJvamFu')}-WS-TLS`;
            const link = `${atob('dHJvamFuOi8v')}${password}@${item.ip}:${port}?security=tls&sni=${workerDomain}&fp=chrome&type=ws&host=${workerDomain}&path=${wsPath}#${encodeURIComponent(wsNodeName)}`;
            links.push(link);
        } else if (CF_HTTP_PORTS.includes(port)) {

            if (!disableNonTLS) {
                const wsNodeName = `${nodeName}-${port}-${atob('VHJvamFu')}-WS`;
                const link = `${atob('dHJvamFuOi8v')}${password}@${item.ip}:${port}?security=none&type=ws&host=${workerDomain}&path=${wsPath}#${encodeURIComponent(wsNodeName)}`;
                links.push(link);
            }
        } else {

            const wsNodeName = `${nodeName}-${port}-${atob('VHJvamFu')}-WS-TLS`;
            const link = `${atob('dHJvamFuOi8v')}${password}@${item.ip}:${port}?security=tls&sni=${workerDomain}&fp=chrome&type=ws&host=${workerDomain}&path=${wsPath}#${encodeURIComponent(wsNodeName)}`;
            links.push(link);
        }
    });
    return links;
}

async function handleConfigAPI(request) {
    if (request.method === 'GET') {

        if (!kvStore) {
            return new Response(JSON.stringify({
                error: 'KV存储未配置',
                kvEnabled: false
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            ...kvConfig,
            kvEnabled: true
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (request.method === 'POST') {

        if (!kvStore) {
            return new Response(JSON.stringify({
                success: false,
                message: 'KV存储未配置，无法保存配置'
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        try {
            const newConfig = await request.json();

            for (const [key, value] of Object.entries(newConfig)) {
                if (value === '' || value === null || value === undefined) {
                    delete kvConfig[key];
                } else {
                    kvConfig[key] = value;
                }
            }

            await saveKVConfig();

            updateConfigVariables();

            if (newConfig.yx !== undefined) {
                updateCustomPreferredFromYx();
            }

            const newPreferredIPsURL = getConfigValue('yxURL', '') || 'https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt';
            const defaultURL = 'https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt';
            if (newPreferredIPsURL !== defaultURL) {
                directDomains.length = 0;
                customPreferredIPs = [];
                customPreferredDomains = [];
            } else {
                backupIPs = [
                    { domain: 'ProxyIP.US.CMLiussss.net', region: 'US', regionCode: 'US', port: 443 },
                    { domain: 'ProxyIP.SG.CMLiussss.net', region: 'SG', regionCode: 'SG', port: 443 },
                    { domain: 'ProxyIP.JP.CMLiussss.net', region: 'JP', regionCode: 'JP', port: 443 },
                    { domain: 'ProxyIP.KR.CMLiussss.net', region: 'KR', regionCode: 'KR', port: 443 },
                    { domain: 'ProxyIP.DE.CMLiussss.net', region: 'DE', regionCode: 'DE', port: 443 },
                    { domain: 'ProxyIP.SE.CMLiussss.net', region: 'SE', regionCode: 'SE', port: 443 },
                    { domain: 'ProxyIP.NL.CMLiussss.net', region: 'NL', regionCode: 'NL', port: 443 },
                    { domain: 'ProxyIP.FI.CMLiussss.net', region: 'FI', regionCode: 'FI', port: 443 },
                    { domain: 'ProxyIP.GB.CMLiussss.net', region: 'GB', regionCode: 'GB', port: 443 },
                    { domain: 'ProxyIP.Oracle.cmliussss.net', region: 'Oracle', regionCode: 'Oracle', port: 443 },
                    { domain: 'ProxyIP.DigitalOcean.CMLiussss.net', region: 'DigitalOcean', regionCode: 'DigitalOcean', port: 443 },
                    { domain: 'ProxyIP.Vultr.CMLiussss.net', region: 'Vultr', regionCode: 'Vultr', port: 443 },
                    { domain: 'ProxyIP.Multacom.CMLiussss.net', region: 'Multacom', regionCode: 'Multacom', port: 443 }
                ];
                directDomains.length = 0;
                directDomains.push(
                    { name: "cloudflare.182682.xyz", domain: "cloudflare.182682.xyz" },
                    { name: "speed.marisalnc.com", domain: "speed.marisalnc.com" },
                    { domain: "freeyx.cloudflare88.eu.org" },
                    { domain: "bestcf.top" },
                    { domain: "cdn.2020111.xyz" },
                    { domain: "cfip.cfcdn.vip" },
                    { domain: "cf.0sm.com" },
                    { domain: "cf.090227.xyz" },
                    { domain: "cf.zhetengsha.eu.org" },
                    { domain: "cloudflare.9jy.cc" },
                    { domain: "cf.zerone-cdn.pp.ua" },
                    { domain: "cfip.1323123.xyz" },
                    { domain: "cnamefuckxxs.yuchen.icu" },
                    { domain: "cloudflare-ip.mofashi.ltd" },
                    { domain: "115155.xyz" },
                    { domain: "cname.xirancdn.us" },
                    { domain: "f3058171cad.002404.xyz" },
                    { domain: "8.889288.xyz" },
                    { domain: "cdn.tzpro.xyz" },
                    { domain: "cf.877771.xyz" },
                    { domain: "xn--b6gac.eu.org" }
                );
            }

            return new Response(JSON.stringify({
                success: true,
                message: '配置已保存',
                config: kvConfig
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {

            return new Response(JSON.stringify({
                success: false,
                message: '保存配置失败: ' + error.message
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
    });
}

async function handlePreferredIPsAPI(request) {

    if (!kvStore) {
        return new Response(JSON.stringify({
            success: false,
            error: 'KV存储未配置',
            message: '需要配置KV存储才能使用此功能'
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const ae = getConfigValue('ae', '') === 'yes';
    if (!ae) {
        return new Response(JSON.stringify({
            success: false,
            error: 'API功能未启用',
            message: '出于安全考虑，优选IP API功能默认关闭。请在配置管理页面开启"允许API管理"选项后使用。'
        }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        if (request.method === 'GET') {

            const yxValue = getConfigValue('yx', '');
            const pi = parseYxToArray(yxValue);

            return new Response(JSON.stringify({
                success: true,
                count: pi.length,
                data: pi
            }), {
                headers: { 'Content-Type': 'application/json' }
            });

        } else if (request.method === 'POST') {

            const body = await request.json();

            const ipsToAdd = Array.isArray(body) ? body : [body];

            if (ipsToAdd.length === 0) {
                return new Response(JSON.stringify({
                    success: false,
                    error: '请求数据为空',
                    message: '请提供IP数据'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const yxValue = getConfigValue('yx', '');
            let pi = parseYxToArray(yxValue);

            const addedIPs = [];
            const skippedIPs = [];
            const errors = [];

            for (const item of ipsToAdd) {

                if (!item.ip) {
                    errors.push({ ip: '未知', reason: 'IP地址是必需的' });
                    continue;
                }

                const port = item.port || 443;
                const name = item.name || `API优选-${item.ip}:${port}`;

                if (!isValidIP(item.ip) && !isValidDomain(item.ip)) {
                    errors.push({ ip: item.ip, reason: '无效的IP或域名格式' });
                    continue;
                }

                const exists = pi.some(existItem =>
                    existItem.ip === item.ip && existItem.port === port
                );

                if (exists) {
                    skippedIPs.push({ ip: item.ip, port: port, reason: '已存在' });
                    continue;
                }

                const newIP = {
                    ip: item.ip,
                    port: port,
                    name: name,
                    addedAt: new Date().toISOString()
                };

                pi.push(newIP);
                addedIPs.push(newIP);
            }

            if (addedIPs.length > 0) {
                const newYxValue = arrayToYx(pi);
                await setConfigValue('yx', newYxValue);
                updateCustomPreferredFromYx();
            }

            return new Response(JSON.stringify({
                success: addedIPs.length > 0,
                message: `成功添加 ${addedIPs.length} 个IP`,
                added: addedIPs.length,
                skipped: skippedIPs.length,
                errors: errors.length,
                data: {
                    addedIPs: addedIPs,
                    skippedIPs: skippedIPs.length > 0 ? skippedIPs : undefined,
                    errors: errors.length > 0 ? errors : undefined
                }
            }), {
                headers: { 'Content-Type': 'application/json' }
            });

        } else if (request.method === 'DELETE') {

            const body = await request.json();

            if (body.all === true) {

                const yxValue = getConfigValue('yx', '');
                const pi = parseYxToArray(yxValue);
                const deletedCount = pi.length;

                await setConfigValue('yx', '');
                updateCustomPreferredFromYx();

                return new Response(JSON.stringify({
                    success: true,
                    message: `已清空所有优选IP，共删除 ${deletedCount} 个`,
                    deletedCount: deletedCount
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            if (!body.ip) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'IP地址是必需的',
                    message: '请提供要删除的ip字段，或使用 {"all": true} 清空所有'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const port = body.port || 443;

            const yxValue = getConfigValue('yx', '');
            let pi = parseYxToArray(yxValue);
            const initialLength = pi.length;

            const filteredIPs = pi.filter(item =>
                !(item.ip === body.ip && item.port === port)
            );

            if (filteredIPs.length === initialLength) {
                return new Response(JSON.stringify({
                    success: false,
                    error: '优选IP不存在',
                    message: `${body.ip}:${port} 未找到`
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            const newYxValue = arrayToYx(filteredIPs);
            await setConfigValue('yx', newYxValue);
            updateCustomPreferredFromYx();

            return new Response(JSON.stringify({
                success: true,
                message: '优选IP已删除',
                deleted: { ip: body.ip, port: port }
            }), {
                headers: { 'Content-Type': 'application/json' }
            });

        } else {
            return new Response(JSON.stringify({
                success: false,
                error: '不支持的请求方法',
                message: '支持的方法: GET, POST, DELETE'
            }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: '处理请求失败',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

function updateConfigVariables() {
    const manualRegion = getConfigValue('wk', '');
    if (manualRegion && manualRegion.trim()) {
        manualWorkerRegion = manualRegion.trim().toUpperCase();
        currentWorkerRegion = manualWorkerRegion;
    } else {
        const ci = getConfigValue('p', '');
        if (ci && ci.trim()) {
            currentWorkerRegion = 'CUSTOM';
        } else {
            manualWorkerRegion = '';
        }
    }

    const regionMatchingControl = getConfigValue('rm', '');
    if (regionMatchingControl && regionMatchingControl.toLowerCase() === 'no') {
        enableRegionMatching = false;
    } else {
        enableRegionMatching = true;
    }

    const vlessControl = getConfigValue('ev', '');
    if (vlessControl !== undefined && vlessControl !== '') {
        ev = vlessControl === 'yes' || vlessControl === true || vlessControl === 'true';
    }

    const tjControl = getConfigValue('et', '');
    if (tjControl !== undefined && tjControl !== '') {
        et = tjControl === 'yes' || tjControl === true || tjControl === 'true';
    }

    tp = getConfigValue('tp', '') || '';

    const xhttpControl = getConfigValue('ex', '');
    if (xhttpControl !== undefined && xhttpControl !== '') {
        ex = xhttpControl === 'yes' || xhttpControl === true || xhttpControl === 'true';
    }

    if (!ev && !et && !ex) {
        ev = true;
    }

    scu = getConfigValue('scu', '') || 'https://url.v1.mk/sub';

    const preferredDomainsControl = getConfigValue('epd', 'no');
    if (preferredDomainsControl !== undefined && preferredDomainsControl !== '') {
        epd = preferredDomainsControl !== 'no' && preferredDomainsControl !== false && preferredDomainsControl !== 'false';
    }

    const preferredIPsControl = getConfigValue('epi', '');
    if (preferredIPsControl !== undefined && preferredIPsControl !== '') {
        epi = preferredIPsControl !== 'no' && preferredIPsControl !== false && preferredIPsControl !== 'false';
    }

    const githubIPsControl = getConfigValue('egi', '');
    if (githubIPsControl !== undefined && githubIPsControl !== '') {
        egi = githubIPsControl !== 'no' && githubIPsControl !== false && githubIPsControl !== 'false';
    }

    cp = getConfigValue('d', '') || '';

    piu = getConfigValue('yxURL', '') || 'https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt';

    const envFallback = getConfigValue('p', '');
    if (envFallback) {
        fallbackAddress = envFallback.trim();
    } else {
        fallbackAddress = '';
    }

    socks5Config = getConfigValue('s', '') || '';
    if (socks5Config) {
        try {
            parsedSocks5Config = parseSocksConfig(socks5Config);
            isSocksEnabled = true;
        } catch (err) {
            isSocksEnabled = false;
        }
    } else {
        isSocksEnabled = false;
    }

    const yxbyControl = getConfigValue('yxby', '');
    if (yxbyControl && yxbyControl.toLowerCase() === 'yes') {
        disablePreferred = true;
    } else {
        disablePreferred = false;
    }

    const defaultURL = 'https://raw.githubusercontent.com/qwer-search/bestip/refs/heads/main/kejilandbestip.txt';
    if (piu !== defaultURL) {
        directDomains.length = 0;
        customPreferredIPs = [];
        customPreferredDomains = [];
    }
}

function updateCustomPreferredFromYx() {
    const yxValue = getConfigValue('yx', '');
    if (yxValue) {
        try {
            const preferredList = yxValue.split(',').map(item => item.trim()).filter(item => item);
            customPreferredIPs = [];
            customPreferredDomains = [];

            preferredList.forEach(item => {
                let nodeName = '';
                let addressPart = item;

                if (item.includes('#')) {
                    const parts = item.split('#');
                    addressPart = parts[0].trim();
                    nodeName = parts[1].trim();
                }

                const { address, port } = parseAddressAndPort(addressPart);

                if (!nodeName) {
                    nodeName = '自定义优选-' + address + (port ? ':' + port : '');
                }

                if (isValidIP(address)) {
                    customPreferredIPs.push({
                        ip: address,
                        port: port,
                        isp: nodeName
                    });
                } else {
                    customPreferredDomains.push({
                        domain: address,
                        port: port,
                        name: nodeName
                    });
                }
            });
        } catch (err) {
            customPreferredIPs = [];
            customPreferredDomains = [];
        }
    } else {
        customPreferredIPs = [];
        customPreferredDomains = [];
    }
}

function parseYxToArray(yxValue) {
    if (!yxValue || !yxValue.trim()) return [];

    const items = yxValue.split(',').map(item => item.trim()).filter(item => item);
    const result = [];

    for (const item of items) {

        let nodeName = '';
        let addressPart = item;

        if (item.includes('#')) {
            const parts = item.split('#');
            addressPart = parts[0].trim();
            nodeName = parts[1].trim();
        }

        const { address, port } = parseAddressAndPort(addressPart);

        if (!nodeName) {
            nodeName = address + (port ? ':' + port : '');
        }

        result.push({
            ip: address,
            port: port || 443,
            name: nodeName,
            addedAt: new Date().toISOString()
        });
    }

    return result;
}

function arrayToYx(array) {
    if (!array || array.length === 0) return '';

    return array.map(item => {
        const port = item.port || 443;
        return `${item.ip}:${port}#${item.name}`;
    }).join(',');
}

function isValidDomain(domain) {
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
}

async function parseTextToArray(content) {
    var processed = content.replace(/[	"'\r\n]+/g, ',').replace(/,+/g, ',');
    if (processed.charAt(0) == ',') processed = processed.slice(1);
    if (processed.charAt(processed.length - 1) == ',') processed = processed.slice(0, processed.length - 1);
    return processed.split(',');
}

async function fetchPreferredAPI(urls, defaultPort = '443', timeout = 3000) {
    if (!urls?.length) return [];
    const results = new Set();
    await Promise.allSettled(urls.map(async (url) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            let text = '';
            try {
                const buffer = await response.arrayBuffer();
                const contentType = (response.headers.get('content-type') || '').toLowerCase();
                const charset = contentType.match(/charset=([^\s;]+)/i)?.[1]?.toLowerCase() || '';

                let decoders = ['utf-8', 'gb2312'];
                if (charset.includes('gb') || charset.includes('gbk') || charset.includes('gb2312')) {
                    decoders = ['gb2312', 'utf-8'];
                }

                let decodeSuccess = false;
                for (const decoder of decoders) {
                    try {
                        const decoded = new TextDecoder(decoder).decode(buffer);
                        if (decoded && decoded.length > 0 && !decoded.includes('\ufffd')) {
                            text = decoded;
                            decodeSuccess = true;
                            break;
                        } else if (decoded && decoded.length > 0) {
                            continue;
                        }
                    } catch (e) {
                        continue;
                    }
                }

                if (!decodeSuccess) {
                    text = await response.text();
                }

                if (!text || text.trim().length === 0) {
                    return;
                }
            } catch (e) {
                return;
            }
            const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
            const isCSV = lines.length > 1 && lines[0].includes(',');
            const IPV6_PATTERN = /^[^\[\]]*:[^\[\]]*:[^\[\]]/;
            if (!isCSV) {
                lines.forEach(line => {
                    const hashIndex = line.indexOf('#');
                    const [hostPart, remark] = hashIndex > -1 ? [line.substring(0, hashIndex), line.substring(hashIndex)] : [line, ''];
                    let hasPort = false;
                    if (hostPart.startsWith('[')) {
                        hasPort = /\]:(\d+)$/.test(hostPart);
                    } else {
                        const colonIndex = hostPart.lastIndexOf(':');
                        hasPort = colonIndex > -1 && /^\d+$/.test(hostPart.substring(colonIndex + 1));
                    }
                    const port = new URL(url).searchParams.get('port') || defaultPort;
                    results.add(hasPort ? line : `${hostPart}:${port}${remark}`);
                });
            } else {
                const headers = lines[0].split(',').map(h => h.trim());
                const dataLines = lines.slice(1);
                if (headers.includes('IP地址') && headers.includes('端口') && headers.includes('数据中心')) {
                    const ipIdx = headers.indexOf('IP地址'), portIdx = headers.indexOf('端口');
                    const remarkIdx = headers.indexOf('国家') > -1 ? headers.indexOf('国家') :
                        headers.indexOf('城市') > -1 ? headers.indexOf('城市') : headers.indexOf('数据中心');
                    const tlsIdx = headers.indexOf('TLS');
                    dataLines.forEach(line => {
                        const cols = line.split(',').map(c => c.trim());
                        if (tlsIdx !== -1 && cols[tlsIdx]?.toLowerCase() !== 'true') return;
                        const wrappedIP = IPV6_PATTERN.test(cols[ipIdx]) ? `[${cols[ipIdx]}]` : cols[ipIdx];
                        results.add(`${wrappedIP}:${cols[portIdx]}#${cols[remarkIdx]}`);
                    });
                } else if (headers.some(h => h.includes('IP')) && headers.some(h => h.includes('延迟')) && headers.some(h => h.includes('下载速度'))) {
                    const ipIdx = headers.findIndex(h => h.includes('IP'));
                    const delayIdx = headers.findIndex(h => h.includes('延迟'));
                    const speedIdx = headers.findIndex(h => h.includes('下载速度'));
                    const port = new URL(url).searchParams.get('port') || defaultPort;
                    dataLines.forEach(line => {
                        const cols = line.split(',').map(c => c.trim());
                        const wrappedIP = IPV6_PATTERN.test(cols[ipIdx]) ? `[${cols[ipIdx]}]` : cols[ipIdx];
                        results.add(`${wrappedIP}:${port}#CF优选 ${cols[delayIdx]}ms ${cols[speedIdx]}MB/s`);
                    });
                }
            }
        } catch (e) { }
    }));
    return Array.from(results);
}

async function handleApiRequest(request, at) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.endsWith('/region')) {
        return new Response(JSON.stringify({
            region: currentWorkerRegion,
            detectionMethod: 'Cloudflare'
        }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (path.endsWith('/test-api')) {
        return new Response(JSON.stringify({
            detectedRegion: currentWorkerRegion,
            timestamp: Date.now()
        }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (path.endsWith('/api/config')) {
        if (request.method === 'GET') {
            return new Response(JSON.stringify({
                ...kvConfig,
                kvEnabled: !!kvStore
            }), { headers: { 'Content-Type': 'application/json' } });
        } else if (request.method === 'POST') {
            if (!kvStore) return new Response(JSON.stringify({ success: false, message: 'KV not enabled' }), { status: 503 });
            try {
                const body = await request.json();
                Object.assign(kvConfig, body);
                await kvStore.put('config', JSON.stringify(kvConfig));
                return new Response(JSON.stringify({ success: true, message: 'Saved' }), { headers: { 'Content-Type': 'application/json' } });
            } catch (e) {
                return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
            }
        }
    }

    return null;
}