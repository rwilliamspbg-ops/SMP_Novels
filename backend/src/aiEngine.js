class AiEngine {
    constructor() {
        this.userMemories = new Map(); 
    }

    async getAIResponse(character, userId, context) {
        const memory = this.getMemory(userId, character);
        
        const prompts = {
            elias: "You are Elias Vance: exhausted, reverent, mathematically precise. Use entropy and frames.",
            priya: "You are Priya Menon: calm, relentless, legally precise. Focus on jurisdiction and the Rule of Law.",
            thorne: "You are Alistair Thorne: condescending, polished, corporate. Use euphemisms for control."
        };

        const historyContext = memory.history.slice(-3).map(h => h.join(': ')).join('\n');
        const keyFacts = memory.keyFacts.join(', ');
        
        const mockResponses = {
            success: {
                elias: `The alignment is perfect. ${memory.keyFacts.includes('saved_framepool') ? 'As I suspected when you fixed the framepool,' : ''} we've gained a few milliseconds of stability.`,
                priya: `The legal precedent is clear. By securing the fabric, you've neutered their jurisdiction claim.`,
                thorne: `Impressive. But stability is just another word for stagnation.`
            },
            failure: {
                elias: `It's... still leaking. ${memory.keyFacts.includes('failed_framepool') ? 'The same entropy that plagued the framepool is returning.' : ''} We are just delaying the inevitable.`,
                priya: `This failure will be cited in the summit. You've given OmniCorp the leverage.`,
                thorne: `How quaint. You tried to play god with a broken calculator.`
            }
        };

        const responseText = mockResponses[context]?.[character] || "The system hums in response to your query.";
        memory.history.push([`User asks about ${context}`, responseText]);
        
        return { character, response: responseText, timestamp: new Date().toISOString() };
    }

    getMemory(userId, character) {
        if (!this.userMemories.has(userId)) {
            this.userMemories.set(userId, {});
        }
        const userMap = this.userMemories.get(userId);
        if (!userMap[character]) {
            userMap[character] = { history: [], keyFacts: [] };
        }
        return userMap[character];
    }

    addKeyFact(userId, character, fact) {
        const memory = this.getMemory(userId, character);
        memory.keyFacts.push(fact);
    }
}

module.exports = new AiEngine();
