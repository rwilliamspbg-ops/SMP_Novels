const redis = require('redis');

class GovernanceStore {
    constructor() {
        this.client = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        this.connect();
    }

    async connect() {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }

    async recordVote(proposalId, optionId, userId) {
        await this.connect();
        // Use a Set to ensure one vote per user per proposal
        const voterKey = `proposal:${proposalId}:voters`;
        const hasVoted = await this.client.sIsMember(voterKey, userId);

        if (hasVoted) {
            throw new Error("User has already voted on this proposal");
        }

        // Use a Hash to store the total tallies
        const tallyKey = `proposal:${proposalId}:tallies`;
        await this.client.hIncrBy(tallyKey, optionId, 1);
        await this.client.sAdd(voterKey, userId);

        return await this.client.hGetAll(tallyKey);
    }

    async getTally(proposalId) {
        await this.connect();
        return await this.client.hGetAll(`proposal:${proposalId}:tallies`);
    }
}

module.exports = new GovernanceStore();
