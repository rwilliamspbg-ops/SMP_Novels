const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BACKEND_BASE = 'http://backend:3001';
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
};

function send(res, statusCode, body, headers = {}) {
    res.writeHead(statusCode, headers);
    res.end(body);
}

function getContentType(filePath) {
    return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

async function proxyApi(req, res) {
    const targetUrl = new URL(req.url.replace(/^\/api/, ''), BACKEND_BASE);
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;
    delete headers['content-length'];
    delete headers['accept-encoding'];

    const init = { method: req.method, headers };
    if (!['GET', 'HEAD'].includes(req.method)) {
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        init.body = Buffer.concat(chunks);
    }

    const upstream = await fetch(targetUrl, init);
    const responseHeaders = {};
    upstream.headers.forEach((value, key) => {
        responseHeaders[key] = value;
    });
    const body = Buffer.from(await upstream.arrayBuffer());
    send(res, upstream.status, body, responseHeaders);
}

function serveStatic(req, res) {
    const requestPath = new URL(req.url, `http://${req.headers.host}`).pathname;
    const relativePath = requestPath === '/' ? '/index.html' : requestPath;
    const filePath = path.normalize(path.join(ROOT_DIR, relativePath));

    if (!filePath.startsWith(ROOT_DIR)) {
        send(res, 403, 'Forbidden');
        return;
    }

    fs.stat(filePath, (error, stats) => {
        if (error || !stats.isFile()) {
            send(res, 404, 'Not Found');
            return;
        }

        res.writeHead(200, { 'Content-Type': getContentType(filePath) });
        fs.createReadStream(filePath).pipe(res);
    });
}

const server = http.createServer((req, res) => {
    if (req.url.startsWith('/api/')) {
        proxyApi(req, res).catch((error) => {
            console.error('API proxy error:', error);
            send(res, 502, 'Bad Gateway');
        });
        return;
    }

    serveStatic(req, res);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Frontend server running on port ${PORT}`);
});