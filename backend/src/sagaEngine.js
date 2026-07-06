const { getReaderProgress, makeChoice } = require('../src/database');

/**
 * Saga Engine with Database-Backed Persistence (v3.3)
 *
 * Implements persistent storage for reader progress using PostgreSQL.
 * Falls back to in-memory state only when database is unavailable.
 */
class SagaEngine {
    constructor() {
        this.logger = {
            info: (...args) => console.log('[Saga]', ...args),
            warn: (...args) => console.warn('[Saga WARN]', ...args),
            error: (...args) => console.error('[Saga ERROR]', ...args)
        };

        // Fallback state for first-time users or database failures
        this.fallbackStates = new Map();
    }

    /**
     * Initialize or retrieve user progress from database.
     * Falls back to in-memory state if database is unavailable.
     */
    async getReaderProgress(userId) {
        try {
            // Try database first (persistent storage)
            this.logger.info('[Saga] Loading progress for userId:', userId);

            const result = await getReaderProgress(userId);

            this.logger.info('[Saga] Progress loaded from database, chapter:', result.currentChapter);
            return result;
        } catch (dbError) {
            // Database unavailable or error - use fallback state
            this.logger.warn('[Saga] Database read failed for userId:', userId, dbError.message);

            // Create or retrieve fallback state
            const fallbackState = await this.getFallbackProgress(userId);
            this.logger.info('[Saga] Using fallback state, chapter:', fallbackState.currentChapter);
            return fallbackState;
        }
    }

    /**
     * Process a choice and update state.
     * Uses database for persistent updates with atomic transaction safety.
     */
    async makeChoice(userId, chapterId, choiceIndex) {
        try {
            this.logger.info('[Saga] Processing choice: userId=%s, chapter=%d, choice=%d',
                userId, chapterId, choiceIndex);

            // Use database for persistent updates (atomic transaction)
            const result = await makeChoice(userId, parseInt(chapterId), parseInt(choiceIndex));

            this.logger.info('[Saga] Choice processed successfully, next chapter: %d',
                result.currentChapter);

            return {
                success: true,
                progress: result,
                nextChapterId: result.currentChapter,
                decisions_made: result.decisions_made
            };
        } catch (error) {
            this.logger.error('[Saga] Choice processing failed:', error.message);
            throw new Error(`Choice processing failed: ${error.message}`);
        }
    }

    /**
     * Get fallback progress for first-time users or database failures.
     * This is used when database is unavailable or for initial state.
     */
    async getFallbackProgress(userId) {
        if (!this.fallbackStates.has(userId)) {
            this.fallbackStates.set(userId, {
                currentChapter: 1,
                decisions_made: {}, // { chapterId: choiceIndex }
                branch_selections: [],
                metrics: {
                    throughput: 100,
                    latency: 50,
                    resilience: 80
                },
                unlocked_nodes: ['prologue']
            });
        }

        return this.fallbackStates.get(userId);
    }

    /**
     * Clear fallback state (for testing or reset).
     */
    clearFallbackState(userId) {
        this.fallbackStates.delete(userId);
    }

    /**
     * Get all active user sessions (for analytics).
     */
    getActiveUsers(limit = 100) {
        return Array.from(this.fallbackStates.keys()).slice(0, limit);
    }
}

// Export singleton instance
const sagaEngine = new SagaEngine();

module.exports = sagaEngine;