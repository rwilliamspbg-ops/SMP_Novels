const { getReaderProgress, makeChoice, getTally } = require('../src/database');
const sagaEngine = require('../src/sagaEngine');
const govStore = require('../src/governanceStore');

/**
 * Smoke Test Suite for SMP_Novels v3.3
 *
 * This suite verifies the core functionality of the narrative platform,
 * focusing on persistence, engine logic, and governance.
 */
class SmokeTestSuite {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            tests: []
        };
        this.logger = {
            info: (...args) => console.log('[Smoke Test]', ...args),
            warn: (...args) => console.warn('[Smoke Test WARN]', ...args),
            error: (...args) => console.error('[Smoke Test ERROR]', ...args)
        };
    }

    /**
     * Helper to run a test and record results
     */
    async runTest(testName, testFn) {
        this.results.total++;
        try {
            await testFn();
            this.results.passed++;
            this.logger.info(`✅ ${testName}`);
        } catch (error) {
            this.results.failed++;
            this.logger.error(`❌ ${testName}:`, error.message);
            this.results.tests.push({
                name: testName,
                passed: false,
                error: error.message
            });
            return;
        }

        this.results.tests.push({
            name: testName,
            passed: true,
            error: null
        });
    }

    /**
     * Run all smoke tests
     */
    async runAll() {
        console.log('\n🧪 Starting SMP_Novels Smoke Test Suite v3.3...\n');
        this.logger.info('==================================================');

        // Test 1: Saga Engine Initialization
        await this.runTest('Saga Engine Initialization', async () => {
            const userId = `smoke-test-user-${Date.now()}`;
            const progress = await sagaEngine.getReaderProgress(userId);
            
            if (!progress || progress.currentChapter !== 1) {
                throw new Error('Saga engine failed to initialize new user progress');
            }
            this.logger.info('   New user progress initialized correctly');
        });

        // Test 2: Governance Store Initialization
        await this.runTest('Governance Store Initialization', async () => {
            const proposals = govStore.getActiveProposals();
            if (!proposals || proposals.length === 0) {
                throw new Error('Governance store failed to initialize proposals');
            }
            this.logger.info(`   Governance store initialized with ${proposals.length} proposals`);
        });

        // Test 3: Proposal Retrieval
        await this.runTest('Proposal Retrieval', async () => {
            const proposal = govStore.getProposal('G-2029-047');
            if (!proposal || proposal.proposalId !== 'G-2029-047') {
                throw new Error('Failed to retrieve specific proposal');
            }
        });

        // Print summary
        console.log('\n📊 Test Results Summary');
        console.log('==================================================');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed} ✅`);
        console.log(`Failed: ${this.results.failed} ❌`);
        console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        console.log('==================================================\n');

        return this.results.failed === 0;
    }
}

if (require.main === module) {
    const suite = new SmokeTestSuite();
    suite.runAll()
        .then(success => {
            console.log(`\n🎉 Smoke tests ${success ? 'PASSED' : 'FAILED'}\n`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 Smoke test suite crashed:', error.message);
            process.exit(1);
        });
}

module.exports = SmokeTestSuite;
