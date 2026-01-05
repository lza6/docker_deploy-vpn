/**
 * Node.js TCP Socket 适配层
 * 
 * 用于替代 Cloudflare Workers 的 cloudflare:sockets 模块
 * 在标准 Node.js 环境（如 Docker/爪云）中提供相同的 API
 */

import net from 'net';
import { Readable, Writable } from 'stream';

/**
 * 将 Node.js Socket 转换为 Web Streams API 兼容格式
 * 模拟 Cloudflare Workers 的 connect() 返回值
 */
export function connect(options) {
    const { hostname, port, secureTransport } = options;

    // 创建 TCP Socket
    const socket = new net.Socket();

    // 创建 Promise 用于跟踪连接状态
    let resolveOpened, rejectOpened;
    const opened = new Promise((resolve, reject) => {
        resolveOpened = resolve;
        rejectOpened = reject;
    });

    let resolveClosed;
    const closed = new Promise((resolve) => {
        resolveClosed = resolve;
    });

    // 创建 ReadableStream (从 socket 读取数据)
    const readable = new ReadableStream({
        start(controller) {
            socket.on('data', (chunk) => {
                try {
                    controller.enqueue(new Uint8Array(chunk));
                } catch (e) {
                    // Stream 可能已关闭
                }
            });

            socket.on('end', () => {
                try {
                    controller.close();
                } catch (e) {
                    // 已关闭
                }
            });

            socket.on('error', (err) => {
                try {
                    controller.error(err);
                } catch (e) {
                    // 已关闭
                }
            });
        },
        cancel() {
            socket.destroy();
        }
    });

    // 创建 WritableStream (向 socket 写入数据)
    const writable = new WritableStream({
        write(chunk) {
            return new Promise((resolve, reject) => {
                const buffer = Buffer.from(chunk);
                socket.write(buffer, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        },
        close() {
            return new Promise((resolve) => {
                socket.end(() => resolve());
            });
        },
        abort(reason) {
            socket.destroy(reason);
        }
    });

    // 连接事件处理
    socket.on('connect', () => {
        resolveOpened({
            remoteAddress: socket.remoteAddress,
            remotePort: socket.remotePort,
            localAddress: socket.localAddress,
            localPort: socket.localPort
        });
    });

    socket.on('error', (err) => {
        rejectOpened(err);
    });

    socket.on('close', () => {
        resolveClosed();
    });

    // 发起连接
    socket.connect({
        host: hostname,
        port: parseInt(port, 10)
    });

    // 返回与 Cloudflare Workers 兼容的对象
    return {
        readable,
        writable,
        opened,
        closed,
        close() {
            socket.destroy();
        },
        // 额外暴露原始 socket 用于特殊操作
        _socket: socket
    };
}

/**
 * 默认导出，保持与 cloudflare:sockets 相同的导入方式
 */
export default { connect };
