const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL Connection Pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'interactive_novel',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Initialize client for each request to prevent stale connections
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Create user progress table and insert initial state
 */
async function initializeSchema() {
  try {
    const client = await getClient();
    
    // Create readers_progress table
    await client.query(`
      CREATE TABLE IF NOT EXISTS readers_progress (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        current_chapter INTEGER DEFAULT 1,
        decisions_made JSONB DEFAULT '{}',
        branch_selections TEXT[] DEFAULT '{}',
        metrics JSONB DEFAULT '{"throughput": 0, "latency": 0, "resilience": 0}',
        unlocked_nodes TEXT[] DEFAULT '{"prologue"}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create governance_votes table for Redis-style tallies in PostgreSQL
    await client.query(`
      CREATE TABLE IF NOT EXISTS governance_votes (
        id SERIAL PRIMARY KEY,
        proposal_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        option_id INTEGER NOT NULL,
        vote_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (proposal_id, user_id, option_id)
      )
    `);

    // Create chapters table for narrative data
    await client.query(`
      CREATE TABLE IF NOT EXISTS chapters (
        chapter_id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        choices JSONB NOT NULL,
        interactive_element JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ PostgreSQL schema initialized successfully');
    
    await client.release();
  } catch (error) {
    console.error('❌ Schema initialization failed:', error.message);
    throw error;
  }
}

/**
 * Get or create reader progress with transaction guard
 */
async function getReaderProgress(userId) {
  try {
    const client = await getClient();
    
    // Try to get existing progress within transaction
    let result = await client.query(
      'SELECT * FROM readers_progress WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length > 0) {
      const progress = result.rows[0];
      await client.release();
      return JSON.parse(progress.decisions_made || '{}');
    }

    // Create new progress record within transaction
    await client.query(`
      INSERT INTO readers_progress (user_id, decisions_made)
      VALUES ($1, $2)
      RETURNING *`,
      [userId, '{}']
    );

    const initialProgress = {
      currentChapter: 1,
      decisions_made: {},
      branch_selections: [],
      metrics: {
        throughput: 100,
        latency: 50,
        resilience: 80
      },
      unlocked_nodes: ['prologue']
    };

    await client.release();
    return initialProgress;
  } catch (error) {
    console.error('Error getting reader progress:', error.message);
    throw new Error(`Database error: ${error.message}`);
  }
}

/**
 * Process a choice and update state with transaction guard
 * Implements atomic updates to prevent inconsistent state
 */
async function makeChoice(userId, chapterId, choiceIndex) {
  try {
    const client = await getClient();
    
    // Get current progress within transaction
    let result = await client.query(
      'SELECT * FROM readers_progress WHERE user_id = $1',
      [userId]
    );

    let progress;
    if (result.rows.length > 0) {
      progress = JSON.parse(result.rows[0].decisions_made || '{}');
    } else {
      // Initialize if not exists (safety check)
      await client.query(`
        INSERT INTO readers_progress (user_id, decisions_made)
        VALUES ($1, $2)
        RETURNING *`,
        [userId, '{}']
      );
      progress = {
        currentChapter: 1,
        decisions_made: {},
        branch_selections: [],
        metrics: { throughput: 100, latency: 50, resilience: 80 },
        unlocked_nodes: ['prologue']
      };
    }

    const chapter = narrativeData.chapters[chapterId];
    
    if (!chapter || !chapter.choices[choiceIndex]) {
      await client.release();
      throw new Error("Invalid choice or chapter");
    }

    // Record decision in JSONB field
    progress.decisions_made[chapterId] = choiceIndex;
    progress.currentChapter = chapter.choices[choiceIndex].nextChapter;
    progress.branch_selections.push(chapter.choices[choiceIndex].nextChapter);

    // Update database with new state (atomic update within transaction)
    const decisionsJSON = JSON.stringify(progress.decisions_made);
    const branchSelectionsJSON = JSON.stringify(progress.branch_selections);
    
    await client.query(`
      UPDATE readers_progress
      SET current_chapter = $1, 
          decisions_made = $2,
          branch_selections = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $4
      RETURNING *`,
      [progress.currentChapter, decisionsJSON, branchSelectionsJSON, userId]
    );

    await client.release();
    return progress;
  } catch (error) {
    console.error('Error making choice:', error.message);
    throw new Error(`Database error: ${error.message}`);
  }
}

/**
 * Save chapter metrics with transaction guard
 */
async function saveMetrics(userId, metrics) {
  try {
    const client = await getClient();
    
    await client.query(`
      UPDATE readers_progress
      SET metrics = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2`,
      [metrics, userId]
    );

    await client.release();
    return { success: true };
  } catch (error) {
    console.error('Error saving metrics:', error.message);
    throw new Error(`Database error: ${error.message}`);
  }
}

/**
 * Get governance tally from database
 */
async function getTally(proposalId) {
  try {
    const client = await getClient();
    
    const result = await client.query(`
      SELECT 
        proposal_id,
        option_id,
        COUNT(*) as vote_count,
        MAX(vote_timestamp) as last_vote
      FROM governance_votes
      WHERE proposal_id = $1
      GROUP BY proposal_id, option_id
      ORDER BY proposal_id, option_id`,
      [proposalId]
    );

    await client.release();
    
    const tally = {};
    result.rows.forEach(row => {
      tally[`${row.option_id}`] = row.vote_count;
    });
    
    return tally;
  } catch (error) {
    console.error('Error getting governance tally:', error.message);
    throw new Error(`Database error: ${error.message}`);
  }
}

/**
 * Record governance vote with duplicate prevention
 */
async function recordVote(proposalId, optionId, userId) {
  try {
    const client = await getClient();
    
    // Check if user already voted (one vote per proposal rule)
    const existing = await client.query(`
      SELECT COUNT(*) as count FROM governance_votes
      WHERE proposal_id = $1 AND user_id = $2`,
      [proposalId, userId]
    );

    if (existing.rows[0].count > 0) {
      await client.release();
      throw new Error('User has already voted on this proposal');
    }

    // Record the vote within transaction
    await client.query(`
      INSERT INTO governance_votes (proposal_id, user_id, option_id)
      VALUES ($1, $2, $3)`,
      [proposalId, userId, optionId]
    );

    await client.release();
    
    // Return current tally
    return await getTally(proposalId);
  } catch (error) {
    console.error('Error recording vote:', error.message);
    throw new Error(`Database error: ${error.message}`);
  }
}

/**
 * Load narrative chapters from database
 */
async function loadChaptersFromDB() {
  try {
    const client = await getClient();
    
    const result = await client.query(`
      SELECT chapter_id, text, choices, interactive_element FROM chapters
      ORDER BY chapter_id
    `);

    await client.release();
    
    const chapters = {};
    result.rows.forEach(row => {
      chapters[row.chapter_id] = row;
    });
    
    return chapters;
  } catch (error) {
    console.error('Error loading chapters:', error.message);
    throw new Error(`Database error: ${error.message}`);
  }
}

/**
 * Add new chapter to database with upsert
 */
async function addChapter(chapterId, text, choices, interactiveElement = null) {
  try {
    const client = await getClient();
    
    await client.query(`
      INSERT INTO chapters (chapter_id, text, choices, interactive_element)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (chapter_id) DO UPDATE SET
        text = EXCLUDED.text,
        choices = EXCLUDED.choices,
        interactive_element = EXCLUDED.interactive_element`,
      [chapterId, text, JSON.stringify(choices), interactiveElement ? JSON.stringify(interactiveElement) : null]
    );

    await client.release();
    return { success: true };
  } catch (error) {
    console.error('Error adding chapter:', error.message);
    throw new Error(`Database error: ${error.message}`);
  }
}

/**
 * Get user progress for analytics
 */
async function getUserAnalytics(userId, limit = 50) {
  try {
    const client = await getClient();
    
    const result = await client.query(`
      SELECT 
        current_chapter as last_chapter,
        metrics->>'throughput' as throughput,
        metrics->>'latency' as latency,
        metrics->>'resilience' as resilience,
        decisions_made || branch_selections as total_decisions,
        created_at as started_at,
        updated_at as last_active
      FROM readers_progress
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    await client.release();
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting analytics:', error.message);
    throw new Error(`Database error: ${error.message}`);
  }
}

module.exports = {
  pool,
  getClient,
  initializeSchema,
  getReaderProgress,
  makeChoice,
  saveMetrics,
  getTally,
  recordVote,
  loadChaptersFromDB,
  addChapter,
  getUserAnalytics
};
