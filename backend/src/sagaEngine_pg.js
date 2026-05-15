const { Pool } = require('pg');

class SagaEngine {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/echo_db'
        });
        this.init();
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
        const narrativeData = require('./narrativeData');
        const chapter = narrativeData.chapters[chapterId];
        if (!chapter || !chapter.choices[choiceIndex]) throw new Error("Invalid choice");

        const nextChapterId = chapter.choices[choiceIndex].nextChapter;
        
        await this.pool.query(`
            UPDATE reader_progress 
            SET current_chapter = $1, 
                decisions_made = jsonb_set(decisions_made, ARRAY[$2::text], $3),
                branch_selections = branch_selections || $1
            WHERE user_id = $4
        `, [nextChapterId, chapterId, JSON.stringify(choiceIndex), userId]);

        return this.getReaderProgress(userId);
    }
}

module.exports = new SagaEngine();
