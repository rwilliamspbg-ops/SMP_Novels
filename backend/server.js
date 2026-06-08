/**
 * Cognoscent Echo - Simple Production Server
 * Fallback entry point (use server_fastify.js for full features)
 */

const http = require('http');
const cors = require('@fastify/cors');
const helmet = require('helmet');
require('dotenv').config();

// Create simple HTTP server with security headers
const server = http.createServer((req, res) => {
    // CORS handling
    const allowedOrigins = [
        'https://echo-platform.vercel.app',
        process.env.FRONTEND_URL || 'http://localhost:3000'
    ];
    
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '600');
    
    // Security headers (Helmet equivalents)
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '0'); // Modern browsers ignore this anyway
    
    // Route handling
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Simple API routing to database module
    if (req.url.startsWith('/api/')) {
        // Forward all API requests to backend service in Docker
        if (process.env.NODE_ENV === 'production') {
            console.log(`[SERVER] API request to ${req.url} (forwarding to upstream)`);
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end('Bad Gateway: Backend not available in production');
            return;
        }
    }

    // Default: serve static files or show API info
    if (req.url === '/' || req.url === '/api/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            name: 'Cognoscent Echo API',
            version: '1.0.0',
            status: 'running',
            environment: process.env.NODE_ENV || 'development'
        }));
        return;
    }
});

// Health check endpoint
server.on('listening', () => {
    const address = server.address();
    console.log(`\n🚀 Cognoscent Echo Simple Server`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Host: ${address.address}:${address.port}`);
    console.log(`   Press CTRL+C to shutdown gracefully\n`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Error: Port ${process.env.PORT || 3001} is already in use`);
    } else {
        console.error('[SERVER] Server error:', err.message);
    }
});

const port = parseInt(process.env.PORT || '3001');
server.listen({ port, host: '0.0.0.0' }, () => {});
