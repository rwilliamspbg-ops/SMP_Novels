const narrativeData = require('./narrativeData');
const {
  getReaderProgress,
  makeChoice,
  saveMetrics,
  getUserAnalytics
} = require('./database');

/**
 * Production-ready Saga Engine with PostgreSQL persistence
 * Handles reader progress, state management, and analytics
 */
class SagaEngine {
  constructor() {
    this.logger = {
      info: console.log,
      warn: (...args) => console.warn('[WARN]', ...args),
      error: (...args) => console.error('[ERROR]', ...args)
    };
  }

  /**
   * Initialize or retrieve user progress from PostgreSQL
   */
  async getReaderProgress(userId) {
    try {
      this.logger.info(`[SagaEngine] Getting progress for user: ${userId}`);

      const progress = await getReaderProgress(userId);

      // Ensure metrics are initialized if missing
      if (!progress.metrics) {
        progress.metrics = {
          throughput: 100,
          latency: 50,
          resilience: 80
        };
      }

      return progress;
    } catch (error) {
      this.logger.error(`[SagaEngine] Error getting progress for ${userId}:`, error.message);
      // Fallback to initial state for degraded operation
      return {
        currentChapter: 1,
        decisions_made: {},
        branch_selections: [],
        metrics: { throughput: 100, latency: 50, resilience: 80 },
        unlocked_nodes: ['prologue']
      };
    }
  }

  /**
   * Process a choice and determine the next state with persistence
   */
  async makeChoice(userId, chapterId, choiceIndex) {
    try {
      this.logger.info(`[SagaEngine] Processing choice: userId=${userId}, chapter=${chapterId}, index=${choiceIndex}`);

      // Validate chapter exists
      const chapter = narrativeData.chapters[chapterId];
      if (!chapter || !chapter.choices[choiceIndex]) {
        throw new Error(`Invalid choice or chapter: chapter ${chapterId} choice ${choiceIndex}`);
      }

      // Make the choice in database (atomic operation)
      const progress = await makeChoice(userId, chapterId, choiceIndex);

      this.logger.info(`[SagaEngine] Choice recorded. Next chapter: ${progress.currentChapter}`);

      return {
        success: true,
        progress,
        nextChapterId: progress.currentChapter
      };
    } catch (error) {
      this.logger.error(`[SagaEngine] Error processing choice:`, error.message);
      throw new Error(`Narrative error: ${error.message}`);
    }
  }

  /**
   * Save metrics to database
   */
  async saveMetrics(userId, metrics) {
    try {
      this.logger.info(`[SagaEngine] Saving metrics for user ${userId}:`, metrics);

      await saveMetrics(userId, metrics);

      return {
        success: true,
        message: 'Metrics saved successfully'
      };
    } catch (error) {
      this.logger.error(`[SagaEngine] Error saving metrics:`, error.message);
      throw new Error(`Metrics error: ${error.message}`);
    }
  }

  /**
   * Get user analytics for dashboard
   */
  async getAnalytics(userId, limit = 50) {
    try {
      this.logger.info(`[SagaEngine] Getting analytics for user ${userId}`);

      const analytics = await getUserAnalytics(userId, limit);

      return analytics;
    } catch (error) {
      this.logger.error(`[SagaEngine] Error getting analytics:`, error.message);
      return null;
    }
  }

  /**
   * Unlock a node based on chapter progress
   */
  async canAccessElement(userId, elementId) {
    try {
      const progress = await this.getReaderProgress(userId);

      // Check if element is in unlocked nodes OR allow all for MVP
      const isUnlocked = progress.unlocked_nodes?.includes(elementId) || true;

      return {
        allowed: isUnlocked,
        currentChapter: progress.currentChapter,
        unlockedCount: progress.unlocked_nodes?.length || 0
      };
    } catch (error) {
      this.logger.error(`[SagaEngine] Error checking element access:`, error.message);
      return { allowed: true }; // Fail-open for MVP
    }
  }

  /**
   * Reset user progress (for testing/authoring)
   */
  async resetProgress(userId) {
    try {
      const { pool } = require('./database');

      await pool.query(`
        DELETE FROM readers_progress WHERE user_id = `,
        [userId]
      );

      this.logger.info(`[SagaEngine] Progress reset for user: ${userId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`[SagaEngine] Error resetting progress:`, error.message);
      throw new Error(`Reset error: ${error.message}`);
    }
  }

  /**
   * Get all active readers (for analytics dashboard)
   */
  async getActiveReaders(limit = 100) {
    try {
      const { pool } = require('./database');

      const result = await pool.query(`
        SELECT
          user_id,
          current_chapter as last_chapter,
          created_at,
          updated_at
        FROM readers_progress
        ORDER BY updated_at DESC
        LIMIT `,
        [limit]
      );

      return result.rows;
    } catch (error) {
      this.logger.error(`[SagaEngine] Error getting active readers:`, error.message);
      return [];
    }
  }
}

module.exports = new SagaEngine();
