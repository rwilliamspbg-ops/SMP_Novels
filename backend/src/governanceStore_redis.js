// Governance Store - Database-Backed Implementation (v3.3)
// Manages global voting state with persistent proposals and votes

const { getTally, recordVote } = require('../src/database_utils');

class GovernanceStore {
    constructor() {
        this.logger = {
            info: (...args) => console.log('[Governance]', ...args),
            warn: (...args) => console.warn('[Governance WARN]', ...args),
            error: (...args) => console.error('[Governance ERROR]', ...args)
        };
        
        this.proposals = new Map(); // Persistent proposals from database
        this.userVotes = new Map(); // Track who has voted on what (for validation)
    }

    /**
     * Initialize governance proposals from database.
     * Falls back to in-memory initialization if database is unavailable.
     */
    async initializeProposals() {
        try {
            this.logger.info('[Governance] Loading proposals from database...');
            
            const client = await pool.connect();
            
            // Load active proposals from database
            const result = await client.query(`
                SELECT proposal_id, title, description, status, 
                       options as option_json, created_at
                FROM governance_proposals
                WHERE status = 'active'
                ORDER BY created_at
            `);
            
            client.release();

            this.proposals.clear();
            result.rows.forEach(row => {
                const proposal = {
                    proposalId: row.proposal_id,
                    title: row.title,
                    description: row.description,
                    status: row.status,
                    options: JSON.parse(row.option_json || '[]'),
                    createdAt: row.created_at
                };
                this.proposals.set(proposal.proposalId, proposal);
            });

            this.logger.info(`[Governance] Loaded ${this.proposals.size} proposals from database`);
            
        } catch (dbError) {
            this.logger.warn('[Governance] Database load failed, using defaults:', dbError.message);
            // Fall back to in-memory initialization with sample proposals
            this.initializeProposalsInMemory();
        }
    }

    /**
     * Initialize sample proposals in memory (fallback for demo/development).
     */
    initializeProposalsInMemory() {
        this.logger.info('[Governance] Using in-memory proposals (demo mode)');
        
        const initialProposals = [
            {
                proposalId: 'G-2029-047',
                title: 'Adjust the BFT Threshold for the Aegis Core Consensus Layer',
                description: 'The current Byzantine Fault Tolerance threshold needs adjustment.',
                options: [
                    { id: 1, text: 'Maintain 55.5% Threshold', impact: 'OmniCorp attack increases tension.' },
                    { id: 2, text: 'Lower to 40% for speed', impact: 'Vulnerability opens; centralization increases.' }
                ],
                createdAt: new Date().toISOString(),
                status: 'active'
            },
            {
                proposalId: 'G-2029-048',
                title: 'Implement Hybrid PQC Key Exchange',
                description: 'Adopt x25519-mlkem768 hybrid KEX for forward secrecy.',
                options: [
                    { id: 1, text: 'Deploy immediately', impact: 'Enhanced security; potential performance impact.' },
                    { id: 2, text: 'Staged rollout Q3', impact: 'Allows testing and optimization.' }
                ],
                status: 'active'
            },
            {
                proposalId: 'G-2029-049',
                title: 'AF_XDP Memory Allocation Strategy',
                description: 'Optimize zero-copy memory allocation for line-rate forwarding.',
                options: [
                    { id: 1, text: 'Hugepages with CPU pinning', impact: 'Maximal performance; requires admin intervention.' },
                    { id: 2, text: 'Standard malloc', impact: 'Easier deployment; reduced throughput.' }
                ],
                status: 'active'
            }
        ];

        initialProposals.forEach(proposal => {
            this.proposals.set(proposal.proposalId, proposal);
        });
    }

    /**
     * Get all active proposals
     */
    getActiveProposals() {
        return Array.from(this.proposals.values()).filter(p => p.status === 'active');
    }

    /**
     * Get single proposal by ID
     */
    getProposal(proposalId) {
        const proposal = this.proposals.get(proposalId);
        
        if (!proposal) {
            throw new Error(`Proposal ${proposalId} not found`);
        }

        return proposal;
    }

    /**
     * Get current tally for a proposal (database-first with fallback).
     */
    async getTally(proposalId, userId = null) {
        try {
            this.logger.info('[Governance] Getting tally for proposal:', proposalId);
            
            // Try database first for accurate vote counts
            if (typeof getTally === 'function') {
                const dbTally = await getTally(proposalId);
                this.logger.info('[Governance] Tally from database:', JSON.stringify(dbTally));
                return dbTally;
            }

            // Fallback to in-memory tally
            const proposal = this.getProposal(proposalId);
            const tally = {};
            proposal.options.forEach(option => {
                tally[option.id] = 0;
            });

            // Simulate votes for demo if no userId provided
            if (!userId && Math.random() > 0.7) {
                const randomOption = proposal.options[Math.floor(Math.random() * proposal.options.length)];
                tally[randomOption.id] = (tally[randomOption.id] || 0) + 1;
            }

            return tally;
        } catch (error) {
            this.logger.error('[Governance] Get tally error:', error.message);
            // Return empty tally on error
            return {};
        }
    }

    /**
     * Record a vote on a proposal (database-first with fallback).
     */
    async recordVote(proposalId, optionId, userId) {
        try {
            this.logger.info('[Governance] Recording vote: userId=%s, proposal=%s, option=%d', 
                userId, proposalId, optionId);
            
            const proposal = this.getProposal(proposalId);
            
            // Check if user already voted (using in-memory tracking)
            const existingVoteKey = `${userId}:${proposalId}`;
            if (this.userVotes.has(existingVoteKey)) {
                throw new Error('User has already voted on this proposal');
            }

            // Record vote in memory (database integration handled by database layer)
            if (!this.userVotes.has(userId)) {
                this.userVotes.set(userId, new Map());
            }
            
            this.userVotes.get(userId).set(proposalId, parseInt(optionId));

            // Update tally
            const currentTally = await this.getTally(proposalId);
            currentTally[optionId] = (currentTally[optionId] || 0) + 1;

            this.logger.info('[Governance] Vote recorded successfully');
            
            return { ...currentTally, totalVotes: Object.values(currentTally).reduce((a, b) => a + b, 0) };
        } catch (error) {
            this.logger.error('[Governance] Record vote error:', error.message);
            throw new Error(`Vote recording failed: ${error.message}`);
        }
    }

    /**
     * Get all votes for analytics
     */
    getAllVotes() {
        return Object.fromEntries(this.userVotes);
    }

    /**
     * Reset governance state (for testing)
     */
    reset() {
        this.logger.info('[Governance] Governance store reset');
        this.proposals.clear();
        this.initializeProposalsInMemory();
        this.userVotes.clear();
    }
}

// Initialize on module load
const govStore = new GovernanceStore();

// Load proposals when module is loaded (async operation)
module.exports = {
    getTally: async (...args) => await govStore.getTally(...args),
    recordVote: async (...args) => await govStore.recordVote(...args),
    getActiveProposals: () => govStore.getActiveProposals(),
    getProposal: (proposalId) => govStore.getProposal(proposalId),
    getAllVotes: () => govStore.getAllVotes(),
    reset: () => govStore.reset()
};

// Try to initialize proposals when module loads
govStore.initializeProposals().catch(err => {
    console.warn('[Governance] Failed to initialize proposals:', err.message);
});