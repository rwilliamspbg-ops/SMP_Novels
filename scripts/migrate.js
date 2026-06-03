#!/usr/bin/env node
/**
 * Database Migration Script
 * Handles schema creation, sample data seeding, and validation
 */

const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'interactive_novel',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const logger = {
  info: (...args) => console.log('[MIGRATION]', ...args),
  warn: (...args) => console.warn('[MIGRATION WARN]', ...args),
  error: (...args) => console.error('[MIGRATION ERROR]', ...args),
  success: (...args) => console.log('[MIGRATION OK]', ...args)
};

async function runMigration() {
  try {
    logger.info('Starting database migration...');

    // Create tables
    await pool.query(`
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
    logger.success('Created readers_progress table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS governance_votes (
        id SERIAL PRIMARY KEY,
        proposal_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        option_id INTEGER NOT NULL,
        vote_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (proposal_id, user_id, option_id)
      )
    `);
    logger.success('Created governance_votes table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chapters (
        chapter_id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        choices JSONB NOT NULL,
        interactive_element JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.success('Created chapters table');

    // Add indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_readers_user_id ON readers_progress(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_governance_proposal ON governance_votes(proposal_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_chapters_id ON chapters(chapter_id)');
    logger.success('Created indexes');

    // Create trigger for updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language plpgsql;
    `);
    
    await pool.query('DROP TRIGGER IF EXISTS update_readers_progress_updated_at ON readers_progress');
    await pool.query('CREATE TRIGGER update_readers_progress_updated_at BEFORE UPDATE ON readers_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()');
    logger.success('Created updated_at trigger');

    // Insert sample chapters (1-6)
    const chapterData = [
      {
        chapter_id: 1,
        text: "You awaken in the sterile hum of the Aegis Core. Elias Vance, the Lead Architect, stares at a cascading wall of diagnostic data.",
        choices: '[{"text": "Ask Elias about the leak", "nextChapter": 2}, {"text": "Examine the terminal yourself", "nextChapter": 3}]',
        interactive_element: '{"type": "code_snippet", "id": "chapter1_framepool", "language": "go"}'
      },
      {
        chapter_id: 2,
        text: "Elias sighs, not looking away from the screen. 'It is a Byzantine failure in the consensus layer.'",
        choices: '[{"text": "Suggest lowering the threshold", "nextChapter": 4}, {"text": "Argue for higher resilience", "nextChapter": 5}]',
        interactive_element: '{"type": "governance_vote", "proposalId": "G-2029-047"}'
      },
      {
        chapter_id: 3,
        text: "The terminal flashes with red warnings. AF_XDP descriptors failing to align.",
        choices: '[{"text": "Alert Elias immediately", "nextChapter": 2}, {"text": "Try to patch the leak manually", "nextChapter": 6}]',
        interactive_element: null
      },
      { chapter_id: 4, text: "The protocol stabilizes but vulnerability remains.", choices: '[]', interactive_element: null },
      { chapter_id: 5, text: "You maintain the resilience. The system struggles but integrity holds.", choices: '[]', interactive_element: null },
      { chapter_id: 6, text: "Your quick fingers redirect the leaking packets into a null-sink.", choices: '[{"text": "Discuss implications", "nextChapter": 2}]', interactive_element: null }
    ];

    for (const chapter of chapterData) {
      await pool.query(`
        INSERT INTO chapters (chapter_id, text, choices, interactive_element)
        VALUES ($1, $2, $3, $4::jsonb)
        ON CONFLICT (chapter_id) DO UPDATE SET 
          text = EXCLUDED.text,
          choices = EXCLUDED.choices,
          interactive_element = EXCLUDED.interactive_element
      `, [
        chapter.chapter_id,
        chapter.text,
        JSON.stringify(JSON.parse(chapter.choices)),
        chapter.interactive_element
      ]);
    }
    logger.success('Inserted sample chapters');

    await pool.query(`
      INSERT INTO governance_votes (proposal_id, user_id, option_id)
      VALUES ('G-2029-047', 'admin', 1),
             ('G-2029-048', 'admin', 1),
             ('G-2029-049', 'admin', 1)
    `);
    logger.success('Inserted sample governance data');

    // Verify tables exist
    const result = await pool.query('\\dt');
    console.log('\n📊 Current Tables:');
    console.log(result.rows.map(row => row.table_name).join(', '));

    await pool.end();
    logger.info('Migration completed successfully!');

  } catch (error) {
    logger.error('Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
