const fastify = require('fastify')({ logger: false });
const sagaEngine = require('./sagaEngine');
const narrativeData = require('./narrativeData');

async function runTests() {
    console.log('--- Testing API & State Persistence ---');
    const userId = 'test-user-123';

    // 1. Test Initial State
    const state1 = sagaEngine.getReaderProgress(userId);
    console.log(`Initial Chapter: ${state1.currentChapter === 1 ? '✅' : '❌'}`);

    // 2. Test Valid Choice
    sagaEngine.makeChoice(userId, 1, 0); // Ask Elias
    const state2 = sagaEngine.getReaderProgress(userId);
    console.log(`State Advance (1->2): ${state2.currentChapter === 2 ? '✅' : '❌'}`);
    console.log(`Decision Recorded: ${state2.decisions_made[1] === 0 ? '✅' : '❌'}`);

    // 3. Test Invalid Choice
    try {
        sagaEngine.makeChoice(userId, 1, 99);
        console.log('Invalid Choice: ❌ (Did not throw)');
    } catch (e) {
        console.log('Invalid Choice: ✅ (Caught Error)');
    }

    // 4. Test AI Memory
    const ai = require('./aiEngine');
    ai.addKeyFact(userId, 'elias', 'saved_framepool');
    const resp = await ai.getAIResponse('elias', userId, 'success');
    console.log(`AI Memory Integration: ${resp.response.includes('framepool') ? '✅' : '❌'}`);
}

runTests().then(() => process.exit(0));
