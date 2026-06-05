-- Cognoscent Echo - PostgreSQL Schema Initialization
-- Run this script after database creation to initialize tables

-- Create readers_progress table
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
);

-- Create governance_votes table
CREATE TABLE IF NOT EXISTS governance_votes (
    id SERIAL PRIMARY KEY,
    proposal_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    option_id INTEGER NOT NULL,
    vote_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (proposal_id, user_id, option_id)
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,
    chapter_number INTEGER UNIQUE NOT NULL,
    title VARCHAR(255),
    content TEXT,
    choices JSONB DEFAULT '[]',
    interactive_element JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_readers_user_id ON readers_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_governance_proposal ON governance_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(chapter_number);
