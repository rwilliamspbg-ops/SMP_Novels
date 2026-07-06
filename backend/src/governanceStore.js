const { getTally, recordVote } = require('./database');

/**
 * Governance Store with Database Persistence
 * Manages proposals and user votes with persistent storage
 */
class GovernanceStore {
    constructor() {
        this.logger = {
            info: (...args) => console.log('[Governance]', ...args),
            warn: (...args) => console.warn('[Governance WARN]', ...args),
            error: (...args) => console.error('[Governance ERROR]', ...args)
        };

        // In-memory cache for proposals
        this.proposals = new Map();
        this.initializeProposals();
    }

    /**
     * Initialize default proposals
     */
    initializeProposals() {
        const initialProposals = [
            {
                proposalId: 'G-2029-047',
                title: 'Aegis Core BFT Threshold',
                description: 'Adjust the Byzantine Fault Tolerance threshold for the consensus layer.',
                options: [
                    { id: 0, text: 'Maintain 55.5% (High Security)', impact: 'Preserves decentralization but increases latency.' },
                    { id: 1, text: 'Lower to 40% (High Speed)', impact: 'Increases throughput but raises centralization risk.' }
                ],
                status: 'active'
            },
            {
                proposalId: 'G-2029-088',
                title: 'The Dissent Registry Act',
                description: 'Determine the fate of the dissenters private keys.',
                options: [
                    { id: 0, text: 'Publicize (Transparency)', impact: 'Corporate oversight increases.' },
                    { id: 1, text: 'Purge (Sovereignty)', impact: 'Protects minority privacy.' }
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
     * Get current tally for a proposal from database
     */
    async getTally(proposalId) {
        try {
            this.logger.info('[Governance] Getting tally for proposal:', proposalId);
            const tally = await getTally(proposalId);
            return tally;
        } catch (error) {
            this.logger.error('[Governance] Get tally error:', error.message);
            return {};
        }
    }

    /**
     * Record a vote on a proposal in the database
     */
    async recordVote(proposalId, optionId, userId) {
        try {
            this.logger.info('[Governance] Recording vote: userId=%s, proposal=%s, option=%d',
                userId, proposalId, optionId);

            // Validate proposal exists
            this.getProposal(proposalId);

            const tally = await recordVote(proposalId, parseInt(optionId), userId);

            this.logger.info('[Governance] Vote recorded successfully');
            return tally;
        } catch (error) {
            this.logger.error('[Governance] Record vote error:', error.message);
            throw new Error(`Vote recording failed: ${error.message}`);
        }
    }
}

// Export singleton instance
module.exports = new GovernanceStore();
