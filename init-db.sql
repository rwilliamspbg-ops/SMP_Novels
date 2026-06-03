-- Cognoscent Echo - PostgreSQL Schema Initialization
-- Run this script after database creation to initialize tables

\c interactive_novel

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
    chapter_id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    choices JSONB NOT NULL,
    interactive_element JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX idx_readers_user_id ON readers_progress(user_id);
CREATE INDEX idx_governance_proposal ON governance_votes(proposal_id);
CREATE INDEX idx_chapters_id ON chapters(chapter_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_readers_progress_updated_at BEFORE UPDATE ON readers_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample governance proposals
INSERT INTO governance_votes (proposal_id, user_id, option_id, vote_timestamp)
VALUES 
    ('G-2029-047', 'admin', 1, NOW()),
    ('G-2029-048', 'admin', 1, NOW()),
    ('G-2029-049', 'admin', 1, NOW())
ON CONFLICT DO NOTHING;

-- Add sample chapters (chapters 1-6)
INSERT INTO chapters (chapter_id, text, choices, interactive_element) VALUES
    (1, 
     "You awaken in the sterile hum of the Aegis Core. Elias Vance, the Lead Architect, stares at a cascading wall of diagnostic data. 'The FramePool is leaking,' he mutters, his voice strained. 'If we cannot stabilize the memory allocation, the entire Cognoscent Echo will collapse into noise.'",
     '[{"text": "Ask Elias about the leak", "nextChapter": 2}, {"text": "Examine the terminal yourself", "nextChapter": 3}]',
     '{"type": "code_snippet", "id": "chapter1_framepool", "language": "go", "description": "Elias is optimizing the FramePool implementation", "initialCode": "func NewFramePool(frameSize int) *FramePool { return &FramePool{pool: sync.Pool{New: func() any { return make([]byte, frameSize) } }}} }"}'),
    (2,
     "Elias sighs, not looking away from the screen. 'It is a Byzantine failure in the consensus layer. The nodes are disagreeing on the state of the memory pool. We need a tighter BFT threshold or we lose everything.'",
     '[{"text": "Suggest lowering the threshold", "nextChapter": 4}, {"text": "Argue for higher resilience", "nextChapter": 5}]',
     '{"type": "governance_vote", "proposalId": "G-2029-047", "description": "Adjust the BFT Threshold for the Aegis Core Consensus Layer.", "options": [{"text": "Maintain 55.5% Threshold", "impact": "OmniCorp attack increases tension."}, {"text": "Lower to 40% for speed", "impact": "Vulnerability opens; centralization increases."}]}'),
    (3,
     "The terminal flashes with red warnings. You see the AF_XDP descriptors failing to align. The throughput is dropping precipitously. You realize the leak isn't accidental; it is a coordinated attack on the memory fabric.",
     '[{"text": "Alert Elias immediately", "nextChapter": 2}, {"text": "Try to patch the leak manually", "nextChapter": 6}]',
     null),
    (4,
     "The protocol stabilizes, but a sliver of vulnerability remains. The efficiency is higher, but you can feel the centralization creeping in. The Echo is quieter now, but less free.",
     '[]',
     null),
    (5,
     "You maintain the resilience. The system struggles, the latency spikes, but the integrity of the Cognoscent Echo holds. You have preserved the truth, though at the cost of performance.",
     '[]',
     null),
    (6,
     "Your quick fingers dance across the keys. You manage to redirect the leaking packets into a null-sink. The system breathes again, and Elias looks at you with newfound respect.",
     '[{"text": "Discuss the implications with Elias", "nextChapter": 2}]',
     null);

-- Verify schema
\dt
\d readers_progress
\d governance_votes
\d chapters
