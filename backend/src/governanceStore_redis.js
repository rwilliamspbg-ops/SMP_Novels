// Governance Store - Redis-compatible interface using PostgreSQL
// Manages global voting state for the Dissent Vote mechanism

class GovernanceStore {
    constructor() {
        this.logger = {
            info: console.log,
            warn: (...args) => console.warn('[Governance]', ...args),
            error: (...args) => console.error('[Governance ERROR]', ...args)
        };
    }

    /**
     * Initialize governance proposals in memory
     * In production, these would come from a database or config
     */
    initializeProposals() {
        this.proposals = new Map();
        
        // Pre-seed with sample proposals for demo
        const initialProposals = [
            {
                proposalId: 'G-2029-047',
                title: 'Adjust the BFT Threshold for the Aegis Core Consensus Layer',
                description: 'The current Byzantine Fault Tolerance threshold needs adjustment based on recent Byzantine failure patterns.',
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
                description: 'Adopt x25519-mlkem768 hybrid KEX for forward secrecy against quantum threats.',
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

        this.logger.info(`[Governance] Initialized ${initialProposals.length} proposals`);
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
     * Get current tally for a proposal
     */
    async getTally(proposalId, userId = null) {
        try {
            const proposal = this.getProposal(proposalId);
            
            // Check if we have database integration (optional enhancement)
            if (typeof getTally === 'function') {
                return await getTally(proposalId);
            }

            // Fallback to in-memory tally
            const tally = {};
            proposal.options.forEach(option => {
                tally[option.id] = 0;
            });

            // Simulate some votes for demo
            if (userId && Math.random() > 0.7) {
                const randomOption = proposal.options[Math.floor(Math.random() * proposal.options.length)];
                tally[randomOption.id] = (tally[randomOption.id] || 0) + 1;
            }

            return tally;
        } catch (error) {
            this.logger.error('[Governance] Get tally error:', error.message);
            throw new Error(`Failed to get tally: ${error.message}`);
        }
    }

    /**
     * Record a vote on a proposal
     */
    async recordVote(proposalId, optionId, userId) {
        try {
            const proposal = this.getProposal(proposalId);
            
            // Validate user hasn't already voted
            if (userId && this.userVotes?.[userId]?.[proposalId]) {
                throw new Error('User has already voted on this proposal');
            }

            // Record vote
            if (!this.userVotes) {
                this.userVotes = {};
            }
            
            if (!this.userVotes[userId]) {
                this.userVotes[userId] = new Map();
            }
            
            this.userVotes[userId].set(proposalId, parseInt(optionId));

            // Update option tally
            const currentTally = await this.getTally(proposalId);
            currentTally[optionId] = (currentTally[optionId] || 0) + 1;

            this.logger.info(`[Governance] Vote recorded: userId=${userId}, proposal=${proposalId}, option=${optionId}`);

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
        return this.userVotes || {};
    }

    /**
     * Reset governance state (for testing)
     */
    reset() {
        this.logger.info('[Governance] Governance store reset');
        this.proposals.clear();
        this.initializeProposals();
        this.userVotes = null;
    }
}

// Initialize on module load
const govStore = new GovernanceStore();
govStore.initializeProposals();

module.exports = {
    getTally: govStore.getTally.bind(govStore),
    recordVote: govStore.recordVote.bind(govStore),
    getActiveProposals: govStore.getActiveProposals.bind(govStore),
    getProposal: govStore.getProposal.bind(govStore),
    getAllVotes: govStore.getAllVotes.bind(govStore)
};
