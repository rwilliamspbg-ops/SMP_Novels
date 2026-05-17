const redis = require('redis');

// In-memory fallback store used when Redis is not available (local dev convenience)
class InMemoryGovernance {
    constructor() {
        this.voters = new Map(); // key -> Set of userIds
        this.tallies = new Map(); // key -> Map optionId -> count
    }

    async recordVote(proposalId, optionId, userId) {
        const voterKey = `proposal:${proposalId}:voters`;
        const tallyKey = `proposal:${proposalId}:tallies`;
        if (!this.voters.has(voterKey)) this.voters.set(voterKey, new Set());
        const set = this.voters.get(voterKey);
        if (set.has(userId)) throw new Error('User has already voted on this proposal');
        set.add(userId);
        if (!this.tallies.has(tallyKey)) this.tallies.set(tallyKey, new Map());
        const map = this.tallies.get(tallyKey);
        map.set(optionId, (map.get(optionId) || 0) + 1);
        // return plain object
        return Object.fromEntries(map.entries());
    }

    async getTally(proposalId) {
        const tallyKey = `proposal:${proposalId}:tallies`;
        const map = this.tallies.get(tallyKey) || new Map();
        return Object.fromEntries(map.entries());
    }
}

class GovernanceStore {
    constructor() {
        this.useInMemory = false;
        this.client = null;
        this.delegate = null;
        try {
            this.client = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
            // connect but handle failures gracefully
            this.client.connect().catch((err) => {
                console.error('Redis connect failed, falling back to in-memory governance store:', err.message || err);
                this._enableInMemory();
            });
        } catch (e) {
            console.error('Redis client creation failed, using in-memory fallback:', e.message || e);
            this._enableInMemory();
        }
    }

    _enableInMemory() {
        this.useInMemory = true;
        this.delegate = new InMemoryGovernance();
    }

    async _ensure() {
        if (this.useInMemory) return;
        if (!this.client || !this.client.isOpen) {
            try {
                await this.client.connect();
            } catch (e) {
                console.error('Redis connection error, switching to in-memory:', e.message || e);
                this._enableInMemory();
            }
        }
    }

    async recordVote(proposalId, optionId, userId) {
        if (this.useInMemory) return this.delegate.recordVote(proposalId, optionId, userId);
        await this._ensure();
        if (this.useInMemory) return this.delegate.recordVote(proposalId, optionId, userId);
        const voterKey = `proposal:${proposalId}:voters`;
        const hasVoted = await this.client.sIsMember(voterKey, userId);
        if (hasVoted) throw new Error("User has already voted on this proposal");
        const tallyKey = `proposal:${proposalId}:tallies`;
        await this.client.hIncrBy(tallyKey, optionId, 1);
        await this.client.sAdd(voterKey, userId);
        return await this.client.hGetAll(tallyKey);
    }

    async getTally(proposalId) {
        if (this.useInMemory) return this.delegate.getTally(proposalId);
        await this._ensure();
        if (this.useInMemory) return this.delegate.getTally(proposalId);
        return await this.client.hGetAll(`proposal:${proposalId}:tallies`);
    }
}

module.exports = new GovernanceStore();
