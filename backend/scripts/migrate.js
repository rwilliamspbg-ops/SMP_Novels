/**
 * Migration Script - Add Narrative Events Table for Event Sourcing
 * 
 * This script adds the narrative_events table to support:
 * 1. Immutable event logging for all player actions
 * 2. Temporal debugging capabilities
 * 3. "Replay Mode" feature foundation
 */

const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'interactive_novel',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('📦 Starting narrative_events table migration...');
    
    // Create the events table with indexes for efficient querying
    await pool.query(`
      CREATE TABLE IF NOT EXISTS narrative_events (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ narrative_events table created successfully');

    // Create indexes for efficient querying
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_events_user_id ON narrative_events(user_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_events_event_type ON narrative_events(event_type)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON narrative_events(occurred_at)
    `);

    console.log('✅ Indexes created successfully');
    
    // Add comment for documentation
    await pool.query(`
      COMMENT ON TABLE narrative_events IS 'Immutable event log for narrative history - Event Sourcing pattern';
      
      COMMENT ON COLUMN narrative_events.user_id IS 'Player or system identifier';
      
      COMMENT ON COLUMN narrative_events.event_type IS 'Event category: PLAYER_MADE_CHOICE, DAO_VOTE_CAST, SYSTEM_STATE_CHANGE';
      
      COMMENT ON COLUMN narrative_events.payload IS 'JSONB payload with event details (e.g., chapterId, choiceText)';
      
      COMMENT ON COLUMN narrative_events.occurred_at IS 'Timestamp of when event occurred';
    `);

    console.log('✅ Table comments added');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
  
  console.log('🎉 Migration completed successfully!');
}

// Run migration if executed directly
if (require.main === module) {
  runMigration()
    .then(() => console.log('Done'))
    .catch(console.error);
}

module.exports = { runMigration };
