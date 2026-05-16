const { Pool } = require('pg');

// Graceful Postgres-backed saga engine with an in-memory fallback for local testing.
class SagaEngine {
    constructor() {
        this.useInMemory = false;
        this.delegate = null;
        try {
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/echo_db'
            });
            // initialize, but if it fails we'll catch and switch to in-memory
            this.init().catch((err) => {
                console.error('Postgres init failed, falling back to in-memory sagaEngine:', err.message || err);
                this._enableInMemoryFallback();
            });
        } catch (e) {
            console.error('Postgres pool creation failed, using in-memory fallback:', e.message || e);
            this._enableInMemoryFallback();
        }
    }

    _enableInMemoryFallback() {
        this.useInMemory = true;
        this.delegate = require('./sagaEngine');
    }

    async init() {
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS reader_progress (
                user_id TEXT PRIMARY KEY,
                current_chapter INTEGER DEFAULT 1,
                decisions_made JSONB DEFAULT '{}',
                branch_selections JSONB DEFAULT '[]',
                metrics JSONB DEFAULT '{"throughput": 100, "latency": 50, "resilience": 80}',
                unlocked_nodes JSONB DEFAULT '["prologue"]'
            );
        `);
    }

    async getReaderProgress(userId) {
        if (this.useInMemory && this.delegate) return this.delegate.getReaderProgress(userId);
        const res = await this.pool.query('SELECT * FROM reader_progress WHERE user_id = $1', [userId]);
        if (res.rows.length === 0) {
            const defaultState = {
                user_id: userId,
                current_chapter: 1,
                decisions_made: {},
                branch_selections: [],
                metrics: { throughput: 100, latency: 50, resilience: 80 },
                unlocked_nodes: ['prologue']
            };
            await this.pool.query(
                'INSERT INTO reader_progress (user_id, current_chapter, decisions_made, branch_selections, metrics, unlocked_nodes) VALUES ($1, $2, $3, $4, $5, $6)',
                [userId, 1, '{}', '[]', '{"throughput": 100, "latency": 50, "resilience": 80}', '["prologue"]']
            );
            return defaultState;
        }
        return res.rows[0];
    }

    async makeChoice(userId, chapterId, choiceIndex) {
        if (this.useInMemory && this.delegate) return this.delegate.makeChoice(userId, chapterId, choiceIndex);
        const narrativeData = require('./narrativeData');
        const chapter = narrativeData.chapters[chapterId];
        if (!chapter || !chapter.choices[choiceIndex]) throw new Error("Invalid choice");

        const nextChapterId = chapter.choices[choiceIndex].nextChapter;
        
        // Use upsert to ensure a reader_progress row exists for this user
        await this.pool.query(`
            INSERT INTO reader_progress (user_id, current_chapter, decisions_made, branch_selections, metrics, unlocked_nodes)
            VALUES ($1, $2, jsonb_build_object($3::text, ($4)::jsonb), to_jsonb(ARRAY[$2]::int[]), '{"throughput": 100, "latency": 50, "resilience": 80}', '["prologue"]')
            ON CONFLICT (user_id) DO UPDATE
            SET current_chapter = EXCLUDED.current_chapter,
                decisions_made = jsonb_set(COALESCE(reader_progress.decisions_made, '{}'::jsonb), ARRAY[$3::text], ($4)::jsonb, true),
                branch_selections = COALESCE(reader_progress.branch_selections, '[]'::jsonb) || to_jsonb(ARRAY[$2]::int[])
        `, [userId, nextChapterId, chapterId.toString(), JSON.stringify(choiceIndex)]);

        return this.getReaderProgress(userId);
    }
}

module.exports = new SagaEngine();
