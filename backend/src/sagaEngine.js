const narrativeData = require('./narrativeData');

class SagaEngine {
    constructor() {
        this.states = new Map(); // In-memory store for demo; would be PostgreSQL in prod
    }

    /**
     * Initialize or retrieve user progress.
     * Mapped to the "decisions_made" JSONB requirement.
     */
    getReaderProgress(userId) {
        if (!this.states.has(userId)) {
            this.states.set(userId, {
                currentChapter: 1,
                decisions_made: {}, // { chapterId: choiceIndex }
                branch_selections: [],
                metrics: {
                    throughput: 100,
                    latency: 50,
                    resilience: 80
                },
                unlocked_nodes: ['prologue']
            });
        }
        return this.states.get(userId);
    }

    /**
     * Process a choice and determine the next state.
     */
    makeChoice(userId, chapterId, choiceIndex) {
        const progress = this.getReaderProgress(userId);
        const chapter = narrativeData.chapters[chapterId];

        if (!chapter || !chapter.choices[choiceIndex]) {
            throw new Error("Invalid choice or chapter");
        }

        // Record the decision (JSONB mapping)
        progress.decisions_made[chapterId] = choiceIndex;
        
        const nextChapterId = chapter.choices[choiceIndex].nextChapter;
        progress.currentChapter = nextChapterId;
        progress.branch_selections.push(nextChapterId);

        return progress;
    }

    /**
     * Validate if a reader can access a specific interactive element.
     */
    canAccessElement(userId, elementId) {
        const progress = this.getReaderProgress(userId);
        // Logic for "Unlocked Nodes" based on build plan
        return progress.unlocked_nodes.includes(elementId) || true; // Default true for MVP
    }
}

module.exports = new SagaEngine();
