import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 3000;
const ROOT_DIR = '/app';

// Simple MIME types for static files
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
    // CORS headers for API requests
    const origin = req.headers.origin;
    if (origin) {
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'https://echo-platform.vercel.app'
        ];
        
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }
    }

    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Strip query parameters for file system path
    const cleanPath = filePath.split('?')[0];
    filePath = path.join(ROOT_DIR, cleanPath);

    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (error, stats) => {
        if (error || !stats.isFile()) {
            // Try index.html for directory requests
            const indexPath = path.join(ROOT_DIR, cleanPath, 'index.html');
            fs.stat(indexPath, (dirError, dirStats) => {
                if (!dirError && dirStats.isFile()) {
                    serveFile(indexPath);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                }
            });
        } else {
            serveFile(filePath);
        }
    });

    function serveFile(filePath) {
        fs.readFile(filePath, (err, content) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
                } else {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Server Error');
                }
                return;
            }

            res.writeHead(200, { 
                'Content-Type': getContentType(path.extname(filePath)),
                'Cache-Control': req.url.endsWith('.html') ? 'no-cache' : 'public, max-age=604800'
            });
            res.end(content);
        });
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Cognoscent Echo Frontend Server`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`   Host: 0.0.0.0:${PORT}`);
    console.log(`   Root: ${ROOT_DIR}\n`);
});
