const narrativeData = require('./narrativeData');

class StateManager {
    constructor() {
        this.userStates = new Map();
    }

    getUserState(userId) {
        if (!this.userStates.has(userId)) {
            this.userStates.set(userId, {
                currentChapter: 1,
                decisions: [],
                metrics: {
                    throughput: 100,
                    latency: 50,
                    resilience: 80,
                    energy: 200
                },
                characterRelationships: {
                    elias: 50,
                    priya: 50
                },
                governanceVotes: {}
            });
        }
        return this.userStates.get(userId);
    }

    updateState(userId, update) {
        const state = this.getUserState(userId);
        Object.assign(state, update);
        return state;
    }

    updateMetrics(userId, metricUpdates) {
        const state = this.getUserState(userId);
        Object.assign(state.metrics, metricUpdates);
        return state;
    }

    recordVote(userId, proposalId, option) {
        const state = this.getUserState(userId);
        state.governanceVotes[proposalId] = option;
        return state;
    }
}

module.exports = new StateManager();
