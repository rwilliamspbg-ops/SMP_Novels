/**
 * Admin Routes - Chapter Management Endpoints (v3.3)
 * Provides full CRUD operations for story chapters
 */

const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL Connection Pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'interactive_novel',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

/**
 * Setup admin chapter routes on Fastify server
 */
async function setupAdminRoutes(server) {
    // ========================================================================
    // GET /chapters - List all chapters
    // ========================================================================
    server.get('/chapters', async (request, reply) => {
        try {
            const result = await pool.query(`
                SELECT chapter_id, text, choices, interactive_element, created_at
                FROM chapters
                ORDER BY chapter_id
            `);

            const chapters = {};
            result.rows.forEach(row => {
                chapters[row.chapter_id] = {
                    chapterId: row.chapter_id,
                    text: row.text,
                    choices: JSON.parse(row.choices || '{}'),
                    interactiveElement: row.interactive_element ? JSON.parse(row.interactive_element) : null,
                    createdAt: row.created_at
                };
            });

            return {
                success: true,
                chapters,
                count: result.rows.length
            };
        } catch (error) {
            server.log.error('[Admin] Failed to list chapters:', error.message);
            throw new Error(`Failed to list chapters: ${error.message}`);
        }
    });

    // ========================================================================
    // GET /chapters/:chapterId - Get single chapter by ID
    // ========================================================================
    server.get('/chapters/:chapterId', async (request, reply) => {
        const chapterId = request.params.chapterId;

        // Validate chapter ID is a positive integer
        if (!/^\d+$/.test(chapterId)) {
            return reply.status(400).send({ 
                error: 'Invalid chapter ID format',
                message: 'Chapter ID must be a positive integer'
            });
        }

        try {
            const result = await pool.query(`
                SELECT text, choices, interactive_element
                FROM chapters
                WHERE chapter_id = $1`,
                [chapterId]
            );

            if (result.rows.length === 0) {
                return reply.status(404).send({ 
                    error: 'Chapter not found',
                    availableChapters: Object.keys(narrativeData.chapters || {}).join(', ')
                });
            }

            const row = result.rows[0];
            return {
                chapterId: parseInt(chapterId),
                text: row.text,
                choices: JSON.parse(row.choices || '{}'),
                interactiveElement: row.interactive_element ? JSON.parse(row.interactive_element) : null
            };
        } catch (error) {
            server.log.error('[Admin] Failed to get chapter:', error.message);
            throw new Error(`Failed to get chapter: ${error.message}`);
        }
    });

    // ========================================================================
    // POST /chapters - Create new chapter
    // ========================================================================
    server.post('/chapters', async (request, reply) => {
        const { chapterId, text, choices, interactiveElement } = request.body;

        // Validate required fields
        if (!chapterId || !text || !choices) {
            return reply.status(400).send({ 
                error: 'Missing required fields',
                required: ['chapterId', 'text', 'choices'],
                provided: Object.keys(request.body).join(', ')
            });
        }

        // Validate chapter ID is a positive integer
        if (!/^\d+$/.test(chapterId)) {
            return reply.status(400).send({ 
                error: 'Invalid chapter ID format',
                message: 'Chapter ID must be a positive integer'
            });
        }

        try {
            const result = await pool.query(`
                INSERT INTO chapters (chapter_id, text, choices, interactive_element)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (chapter_id) DO UPDATE SET
                    text = EXCLUDED.text,
                    choices = EXCLUDED.choices,
                    interactive_element = EXCLUDED.interactive_element
                RETURNING chapter_id, created_at`,
                [
                    parseInt(chapterId), 
                    text, 
                    JSON.stringify(choices), 
                    interactiveElement ? JSON.stringify(interactiveElement) : null
                ]
            );

            const row = result.rows[0];
            
            this.logger.info('[Admin] Chapter created/updated: chapter_id=%d', row.chapter_id);

            return {
                success: true,
                message: `Chapter ${row.chapter_id} created successfully`,
                chapterId: row.chapter_id,
                createdAt: row.created_at
            };
        } catch (error) {
            server.log.error('[Admin] Failed to create chapter:', error.message);
            throw new Error(`Failed to create chapter: ${error.message}`);
        }
    });

    // ========================================================================
    // PUT /chapters/:chapterId - Update existing chapter
    // ========================================================================
    server.put('/chapters/:chapterId', async (request, reply) => {
        const chapterId = request.params.chapterId;
        const { text, choices, interactiveElement } = request.body;

        // Validate required fields
        if (!text || !choices) {
            return reply.status(400).send({ 
                error: 'Missing required fields',
                required: ['text', 'choices']
            });
        }

        // Validate chapter ID is a positive integer
        if (!/^\d+$/.test(chapterId)) {
            return reply.status(400).send({ 
                error: 'Invalid chapter ID format'
            });
        }

        try {
            const result = await pool.query(`
                UPDATE chapters 
                SET text = $1, 
                    choices = $2, 
                    interactive_element = $3,
                    updated_at = CURRENT_TIMESTAMP
                WHERE chapter_id = $4
                RETURNING chapter_id, updated_at`,
                [
                    text, 
                    JSON.stringify(choices), 
                    interactiveElement ? JSON.stringify(interactiveElement) : null,
                    parseInt(chapterId)
                ]
            );

            if (result.rows.length === 0) {
                return reply.status(404).send({ 
                    error: 'Chapter not found',
                    chapterId: parseInt(chapterId)
                });
            }

            const row = result.rows[0];
            
            this.logger.info('[Admin] Chapter updated: chapter_id=%d', row.chapter_id);

            return {
                success: true,
                message: `Chapter ${chapterId} updated successfully`,
                chapterId: parseInt(chapterId),
                updatedAt: row.updated_at
            };
        } catch (error) {
            server.log.error('[Admin] Failed to update chapter:', error.message);
            throw new Error(`Failed to update chapter: ${error.message}`);
        }
    });

    // ========================================================================
    // DELETE /chapters/:chapterId - Delete chapter
    // ========================================================================
    server.delete('/chapters/:chapterId', async (request, reply) => {
        const chapterId = request.params.chapterId;

        // Validate chapter ID is a positive integer
        if (!/^\d+$/.test(chapterId)) {
            return reply.status(400).send({ 
                error: 'Invalid chapter ID format'
            });
        }

        try {
            const result = await pool.query(`
                DELETE FROM chapters 
                WHERE chapter_id = $1
                RETURNING chapter_id`,
                [parseInt(chapterId)]
            );

            if (result.rows.length === 0) {
                return reply.status(404).send({ 
                    error: 'Chapter not found',
                    chapterId: parseInt(chapterId)
                });
            }

            const deletedId = result.rows[0].chapter_id;
            
            this.logger.info('[Admin] Chapter deleted: chapter_id=%d', deletedId);

            return {
                success: true,
                message: `Chapter ${deletedId} deleted successfully`,
                deletedChapterId: deletedId
            };
        } catch (error) {
            server.log.error('[Admin] Failed to delete chapter:', error.message);
            throw new Error(`Failed to delete chapter: ${error.message}`);
        }
    });

    // ========================================================================
    // Helper: Add chapter directly from narrative data
    // Useful for adding chapters that already exist in narrativeData.js
    // ========================================================================
    server.post('/chapters/narrative/:chapterId', async (request, reply) => {
        const narrativeData = require('./narrativeData');
        const chapterId = request.params.chapterId;

        if (!/^\d+$/.test(chapterId)) {
            return reply.status(400).send({ error: 'Invalid chapter ID' });
        }

        const chapter = narrativeData.chapters[chapterId];
        
        if (!chapter) {
            return reply.status(404).send({ 
                error: 'Chapter not found in narrative data',
                availableChapters: Object.keys(narrativeData.chapters || {}).join(', ')
            });
        }

        // Add to database from narrative data
        try {
            await pool.query(`
                INSERT INTO chapters (chapter_id, text, choices, interactive_element)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (chapter_id) DO UPDATE SET
                    text = EXCLUDED.text,
                    choices = EXCLUDED.choices,
                    interactive_element = EXCLUDED.interactive_element`,
                [
                    parseInt(chapterId),
                    chapter.text,
                    JSON.stringify(chapter.choices || []),
                    chapter.interactiveElement ? JSON.stringify(chapter.interactiveElement) : null
                ]
            );

            this.logger.info('[Admin] Added narrative chapter: chapter_id=%d', chapterId);

            return {
                success: true,
                message: `Narrative chapter ${chapterId} synced to database`,
                chapterId: parseInt(chapterId)
            };
        } catch (error) {
            server.log.error('[Admin] Failed to sync narrative chapter:', error.message);
            throw new Error(`Failed to sync chapter: ${error.message}`);
        }
    });

    // ========================================================================
    // Helper: List all active governance proposals
    // ========================================================================
    server.get('/governance/proposals', async (request, reply) => {
        try {
            const govStore = require('./governanceStore');
            const proposals = govStore.getActiveProposals();

            return {
                success: true,
                proposals,
                count: proposals.length
            };
        } catch (error) {
            server.log.error('[Admin] Failed to list proposals:', error.message);
            throw new Error(`Failed to list proposals: ${error.message}`);
        }
    });

    return {
        success: true,
        message: 'Chapter management routes initialized',
        endpoints: [
            '/chapters (GET) - List all chapters',
            '/chapters/:chapterId (GET) - Get single chapter',
            '/chapters (POST) - Create new chapter',
            '/chapters/:chapterId (PUT) - Update existing chapter',
            '/chapters/:chapterId (DELETE) - Delete chapter',
            '/chapters/narrative/:chapterId (POST) - Sync from narrative data',
            '/governance/proposals (GET) - List active proposals'
        ]
    };
}

// Export for testing or manual use
module.exports = { setupAdminRoutes, pool };