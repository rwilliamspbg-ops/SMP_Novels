-- Cognoscent Echo Platform - Database Initialization Script
-- Version: 3.2 (Event Sourcing Implementation)
-- 
-- This script initializes all required tables for the interactive narrative platform:
-- 1. readers_progress - Player choice tracking and state management
-- 2. governance_votes - DAO voting system for BFT consensus
-- 3. chapters - Narrative content storage
-- 4. narrative_events - Event sourcing table for immutable history

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS narrative_events CASCADE;
DROP TABLE IF EXISTS governance_votes CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS readers_progress CASCADE;

-- =============================================================================
-- READERS_PROGRESS TABLE
-- Tracks player state, decisions, and performance metrics
-- =============================================================================
CREATE TABLE readers_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  current_chapter INTEGER DEFAULT 1,
  decisions_made JSONB DEFAULT '{}',
  branch_selections TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '{"throughput": 0, "latency": 0, "resilience": 0}',
  unlocked_nodes TEXT[] DEFAULT '{"prologue"}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE readers_progress IS 'Player progress tracking with JSONB state for flexibility';
COMMENT ON COLUMN readers_progress.decisions_made IS 'JSONB array of {chapterId: choiceIndex} mappings';
COMMENT ON COLUMN readers_progress.metrics IS '{"throughput": int, "latency": int, "resilience": int}';

-- =============================================================================
-- GOVERNANCE_VOTES TABLE
-- Byzantine Fault Tolerant voting system for DAO decisions
-- =============================================================================
CREATE TABLE governance_votes (
  id SERIAL PRIMARY KEY,
  proposal_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  option_id INTEGER NOT NULL,
  vote_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (proposal_id, user_id, option_id)
);

CREATE INDEX idx_votes_proposal ON governance_votes(proposal_id);
CREATE INDEX idx_votes_user ON governance_votes(user_id);

COMMENT ON TABLE governance_votes IS 'DAO voting records for BFT consensus layer';
COMMENT ON COLUMN governance_votes.proposal_id IS 'Governance proposal identifier (e.g., G-2029-047)';

-- =============================================================================
-- CHAPTERS TABLE
-- Narrative content and interactive elements
-- =============================================================================
CREATE TABLE chapters (
  chapter_id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  choices JSONB NOT NULL,
  interactive_element JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE chapters IS 'Narrative chapter content with branching choices';
COMMENT ON COLUMN chapters.interactive_element IS 'WASM playground, governance vote, or forensic tool configuration';

-- =============================================================================
-- NARRATIVE_EVENTS TABLE (NEW - Event Sourcing)
-- Immutable event log for all significant actions in the narrative
-- Enables temporal debugging and "Replay Mode" features
-- =============================================================================
CREATE TABLE narrative_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_user_id ON narrative_events(user_id);
CREATE INDEX idx_events_event_type ON narrative_events(event_type);
CREATE INDEX idx_events_occurred_at ON narrative_events(occurred_at);

COMMENT ON TABLE narrative_events IS 'Immutable event log for narrative history - Event Sourcing pattern';
COMMENT ON COLUMN narrative_events.user_id IS 'Player or system identifier';
COMMENT ON COLUMN narrative_events.event_type IS 'Event categories: PLAYER_MADE_CHOICE, DAO_VOTE_CAST, SYSTEM_STATE_CHANGE, ELIAS_DISCOVERED_DATA, PRIYA_ARBITRATED, THORNE_SIMULATED';
COMMENT ON COLUMN narrative_events.payload IS 'JSONB with event-specific details (e.g., {chapter: 1, choiceText: "Ask Elias about the leak"})';
COMMENT ON COLUMN narrative_events.occurred_at IS 'Event timestamp for temporal queries';

-- =============================================================================
-- INITIAL DATA INSERTION
-- Seed with first chapter to ensure smooth onboarding
-- =============================================================================
INSERT INTO chapters (chapter_id, text, choices, interactive_element) VALUES
  (1, 'You awaken in the sterile hum of the Aegis Core. Elias Vance, the Lead Architect, stares at a cascading wall of diagnostic data. "The FramePool is leaking," he mutters, his voice strained. "If we cannot stabilize the memory allocation, the entire Cognoscent Echo will collapse into noise."',
   '[{"text": "Ask Elias about the leak", "nextChapter": 2}, {"text": "Examine the terminal yourself", "nextChapter": 3}]',
   '{"type": "code_snippet", "id": "chapter1_framepool", "language": "go", "description": "Elias is optimizing the FramePool implementation", "initialCode": "func NewFramePool(frameSize int) *FramePool {\n    return &FramePool{pool: sync.Pool{New: func() any {\n        return make([]byte, frameSize)\n    }}}\n}", "validationRules": [{"condition": "zero-copy", "feedback": "? Great! This matches AF_XDP requirements."}]}')
ON CONFLICT (chapter_id) DO NOTHING;

-- =============================================================================
-- SCHEMA VERIFICATION
-- =============================================================================
DO $$
DECLARE
  schema_version INTEGER := 3; -- Version number for this schema
BEGIN
  RAISE NOTICE '✅ Schema initialized successfully - Version %', schema_version;
  RAISE NOTICE '   Tables created: readers_progress, governance_votes, chapters, narrative_events';
  RAISE NOTICE '   Event sourcing enabled for immutable history tracking';
END $$;

-- =============================================================================
-- USAGE NOTES
-- =============================================================================
-- 
-- Event Sourcing Pattern:
-- All significant player actions are now recorded as immutable events in narrative_events.
-- This enables:
--   1. Temporal debugging ("What was the state before Chapter 5?")
--   2. Replay Mode features (rewind narrative to specific points)
--   3. Audit trails for critical decisions
--
-- Example Event Insertion:
-- INSERT INTO narrative_events (user_id, event_type, payload) VALUES
--   ('user123', 'PLAYER_MADE_CHOICE', 
--    '{"chapter": 1, "choiceText": "Ask Elias about the leak"}');
--
-- Transaction Safety:
-- All database operations now use executeTransactional() wrapper from database_utils.js.
-- This ensures ACID compliance and prevents inconsistent state.
