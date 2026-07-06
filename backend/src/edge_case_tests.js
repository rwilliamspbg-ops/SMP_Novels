const sagaEngine = require('./sagaEngine_pg');
const aiEngine = require('./aiEngine');

async function runEdgeCaseTests() {
    console.log('--- 🧪 EDGE CASE AUDIT STARTING ---');
    const userId = 'edge-case-user-999';

    // 1. Test: Rapid-Fire Choices (Race Condition Simulation)
    console.log('\nTesting Race Conditions (Rapid Choice Execution)...');
    try {
        await Promise.all([
            sagaEngine.makeChoice(userId, 1, 0),
            sagaEngine.makeChoice(userId, 1, 1),
            sagaEngine.makeChoice(userId, 1, 0)
        ]);
        console.log('Race Condition: ⚠️ Potential Overwrite (Expected in MVP, but flagged for production)');
    } catch (e) {
        console.log(`Race Condition: ✅ Caught error: ${e.message}`);
    }

    // 2. Test: AI Memory Collision
    console.log('\nTesting AI Memory Collision...');
    aiEngine.addKeyFact(userId, 'elias', ' laaaaaaaa very long string to test buffer limits 1234567890');
    aiEngine.addKeyFact(userId, 'elias', 'Another fact');
    const resp = await aiEngine.getAIResponse('elias', userId, 'success');
    console.log(`AI Memory Retrieval: ${resp.response ? '✅' : '❌'}`);

    // 3. Test: Out-of-Bounds Navigation
    console.log('\nTesting Out-of-Bounds Navigation...');
    try {
        await sagaEngine.makeChoice(userId, 999, 0); // Chapter 999 does not exist
        console.log('Out-of-Bounds: ❌ (Did not throw)');
    } catch (e) {
        console.log(`Out-of-Bounds: ✅ Caught Error: ${e.message}`);
    }

    // 4. Test: Governance Vote Spoofing
    const govStore = require('./governanceStore_redis');
    console.log('\nTesting Vote Spoofing (Double Voting)...');
    try {
        await govStore.recordVote('G-2029-088', 'purge', userId);
        await govStore.recordVote('G-2029-088', 'publicize', userId); // Second vote
        console.log('Vote Spoofing: ❌ (Allowed second vote)');
    } catch (e) {
        console.log(`Vote Spoofing: ✅ Prevented: ${e.message}`);
    }
}

runEdgeCaseTests().then(() => process.exit(0));
