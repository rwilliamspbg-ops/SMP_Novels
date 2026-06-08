/**
 * Database Transaction Utilities for Cognoscent Echo Platform
 * 
 * This module provides:
 * 1. Atomic transaction wrappers for PostgreSQL operations
 * 2. Event sourcing mechanism for immutable narrative history
 * 3. Transaction guards for ACID compliance
 */

const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL Connection Pool (shared with database.js)
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
 * Executes a block of operations atomically using PostgreSQL transactions.
 * All operations within the callback are wrapped in a BEGIN/COMMIT/Rollback sequence.
 * 
 * @param {function} transactionFn - An async function containing database logic.
 * @returns {Promise<any>} The result of the successful transaction.
 * @throws {Error} Transaction failed with rollback if any error occurs.
 */
async function executeTransactional(transactionFn) {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Execute user-defined logic within transaction scope
    const result = await transactionFn(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    console.error("❌ Transaction failed, rolling back:", error.message);
    await client.query('ROLLBACK');
    throw new Error(`Database transaction failed: ${error.message}`);
  } finally {
    if (client) client.release();
  }
}

/**
 * Records an immutable event into the Event Log table.
 * This implements Event Sourcing pattern for narrative history.
 * Every significant action is recorded as an immutable event.
 * 
 * @param {string} userId - ID of the player/system generating the event
 * @param {string} eventType - e.g., 'PLAYER_MADE_CHOICE', 'DAO_VOTE', 'ELIAS_DISCOVERED_DATA'
 * @param {object} payload - JSON data describing the event context
 * @returns {Promise<object>} The newly created event record
 */
async function recordEvent(userId, eventType, payload) {
  try {
    const client = await pool.connect();
    
    const result = await client.query(
      `INSERT INTO narrative_events (user_id, event_type, payload, occurred_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING *`,
      [userId, eventType, JSON.stringify(payload)]
    );

    await client.release();
    return result.rows[0];
  } catch (error) {
    console.error('Error recording event:', error.message);
    throw new Error(`Event logging failed: ${error.message}`);
  }
}

/**
 * Create narrative_events table if not exists
 * This table stores immutable events for the Event Sourcing pattern
 */
async function ensureEventTableExists() {
  try {
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS narrative_events (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (user_id),
        INDEX (event_type),
        INDEX (occurred_at)
      )
    `);

    await client.release();
    console.log('✅ narrative_events table initialized');
  } catch (error) {
    console.error('Note: narrative_events table already exists or failed:', error.message);
  }
}

/**
 * Get event history for a specific user
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of events to return
 * @returns {Promise<Array>} Array of recent events
 */
async function getEventHistory(userId, limit = 100) {
  try {
    const client = await pool.connect();
    
    const result = await client.query(
      `SELECT id, event_type, payload->>'chapter' as chapter, 
              payload->>'action' as action, occurred_at 
       FROM narrative_events 
       WHERE user_id = $1 
       ORDER BY occurred_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    await client.release();
    return result.rows;
  } catch (error) {
    console.error('Error getting event history:', error.message);
    throw new Error(`Event history fetch failed: ${error.message}`);
  }
}

/**
 * Update metrics with transaction guard
 * @param {string} userId - User ID
 * @param {object} metrics - Metrics object to update
 * @returns {Promise<object>} Updated progress record
 */
async function updateMetricsWithTransaction(userId, metrics) {
  return await executeTransactional(async (client) => {
    const result = await client.query(`
      UPDATE readers_progress
      SET metrics = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING *`,
      [metrics, userId]
    );
    return result.rows[0];
  });
}

module.exports = {
  pool,
  getClient: async () => await pool.connect(),
  executeTransactional,
  recordEvent,
  ensureEventTableExists,
  getEventHistory,
  updateMetricsWithTransaction,
};
