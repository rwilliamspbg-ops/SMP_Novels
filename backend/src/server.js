const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const path = require('path');
const authService = require('./authService');
const { User, Save, Novel } = require('./models');
const aiEngine = require('./aiEngine');
const billingService = require('./billingService');
const narrativeData = require('./narrativeData');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// FORCE ALL CORS - Allow any origin, any header, any method
app.use(cors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*'
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/interactive_novel', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('? MongoDB Connected')).catch(err => console.error('? DB Error:', err));

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
        const decoded = authService.verifyToken(token);
        req.userId = decoded.userId;
        next();
    } catch (e) { res.status(401).json({ error: 'Unauthorized' }); }
};

app.get('/ping', (req, res) => res.json({ status: 'alive', timestamp: new Date() }));

app.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const token = await authService.register(username, email, password);
        res.json({ token });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const token = await authService.login(username, password);
        res.json({ token });
    } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/novel/:slug/chapter/:id', authenticate, async (req, res) => {
    try {
        const novel = await Novel.findOne({ slug: req.params.slug });
        if (!novel) return res.status(404).json({ error: 'Novel not found' });
        const chapter = novel.content.get(req.params.id.toString());
        res.json(chapter);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/ai-response', authenticate, async (req, res) => {
    const { character, context } = req.body;
    const response = await aiEngine.getAIResponse(character, req.userId, context);
    res.json({ character, response });
});

app.post('/save', authenticate, async (req, res) => {
    try {
        const { novelId, update } = req.body;
        const save = await Save.findOneAndUpdate(
            { userId: req.userId, novelId },
            { ...update, updatedAt: new Date() },
            { upsert: true, new: true }
        );
        res.json(save);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/admin/novel/update', authenticate, async (req, res) => {
    try {
        const { slug, chapterId, update } = req.body;

        if (!slug || typeof slug !== 'string') return res.status(400).json({ error: 'Missing slug' });
        const chapterNum = Number(chapterId);
        if (!Number.isFinite(chapterNum) || chapterNum < 1) return res.status(400).json({ error: 'Invalid chapterId' });
        if (!update || typeof update !== 'object') return res.status(400).json({ error: 'Missing update object' });

        // Minimal validation for expected admin UI payload
        // (keeps it flexible so Phase 2 can harden later)
        const normalized = {
            text: typeof update.text === 'string' ? update.text : '',
            choices: Array.isArray(update.choices) ? update.choices : [],
            interactiveElement: update.interactiveElement ?? null,
        };

        const novel = await Novel.findOne({ slug });
        if (!novel) {
            return res.status(404).json({ error: 'Novel not found for given slug' });
        }

        // chapters stored in a Map; keys are strings
        novel.content.set(chapterNum.toString(), normalized);

        // ensure doc is persisted
        novel.metadata = novel.metadata || new Map();
        novel.metadata.set('lastUpdatedBy', req.userId.toString());
        novel.metadata.set('lastUpdatedAt', new Date().toISOString());

        await novel.save();

        res.json({ ok: true, slug, chapterId: chapterNum, updated: normalized });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

wss.on('connection', (ws) => {
    console.log('WebSocket client connected!');
    const interval = setInterval(() => {
        ws.send(JSON.stringify({
            throughput: 100 + (Math.random() * 20 - 10),
            latency: 50 + (Math.random() * 10 - 5),
            resilience: 80 + (Math.random() * 4 - 2),
            energy: 200 + (Math.random() * 50 - 25),
            timestamp: new Date().toISOString()
        }));
    }, 2000);
    ws.on('close', () => clearInterval(interval));
});

const PORT = 3001;

// --- Cognoscent Echo PDF Viewer Integration ---
const PDF_PATH = path.join(process.cwd(), "THE_COGNOSCENT_ECHO.pdf");
const VIEWER_PATH = path.join(process.cwd(), "src", "viewer.html");

app.get("/novel-viewer", (_req, res) => {
    res.sendFile(VIEWER_PATH);
});

app.get("/novel.pdf", (_req, res) => {
    res.sendFile(PDF_PATH);
});

// Start server
server.listen(PORT, () => console.log(`?? Server on port ${PORT}`));
