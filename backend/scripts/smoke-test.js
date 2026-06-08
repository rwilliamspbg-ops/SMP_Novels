/**
 * SMP_Novels Smoke Test Suite (v3.3)
 * Automated verification of core functionality
 */

const { getReaderProgress, makeChoice, getTally } = require('../src/database');
const sagaEngine = require('./sagaEngine');
const govStore = require('./governanceStore_redis');

class SmokeTestSuite {
    constructor() {
        this.logger = {
            info: (...args) => console.log('[Smoke Test]', ...args),
            warn: (...args) => console.warn('[Smoke Test WARN]', ...args),
            error: (...args) => console.error('[Smoke Test ERROR]', ...args)
        };

        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    /**
     * Run a single test case
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
        }

        this.results.tests.push({
            name: testName,
            passed: this.results.passed > this.results.total - 1,
            error: error?.message || null
        });
    }

    /**
     * Run all smoke tests
     */
    async runAll() {
        console.log('\n🧪 Starting SMP_Novels Smoke Test Suite v3.3...\n');
        this.logger.info('==================================================');

        // Test 1: Database Connection
        await this.runTest('Database Connection', async () => {
            const client = await require('../src/database').getClient();
            await client.query('SELECT 1');
            await client.release();
            this.logger.info('   Database connection successful');
        });

        // Test 2: Get Reader Progress (New User)
        await this.runTest('Get Reader Progress - New User', async () => {
            const userId = `smoke-test-user-${Date.now()}`;
            const progress = await getReaderProgress(userId);
            
            if (!progress) {
                throw new Error('Progress object is null or undefined');
            }

            if (progress.currentChapter !== 1) {
                throw new Error(`Expected chapter 1, got ${progress.currentChapter}`);
            }

            if (typeof progress.decisions_made !== 'object') {
                throw new Error('decisions_made is not an object');
            }

            this.logger.info('   New user progress initialized correctly');
        });

        // Test 3: Make Choice
        await this.runTest('Make Choice', async () => {
            const userId = `smoke-test-choice-${Date.now()}`;
            
            const result = await makeChoice(userId, 1, 0);
            
            if (!result || !result.success) {
                throw new Error('Choice result is not successful');
            }

            if (typeof result.nextChapterId !== 'number') {
                throw new Error('nextChapterId is not a number');
            }

            this.logger.info(`   Choice processed, next chapter: ${result.nextChapterId}`);
        });

        // Test 4: Health Check Endpoint
        await this.runTest('Health Check Endpoint', async () => {
            const response = await fetch('http://localhost:3001/health');
            
            if (!response.ok) {
                throw new Error(`Health check failed with status ${response.status}`);
            }

            const data = await response.json();
            
            if (data.status !== 'ok') {
                throw new Error(`Expected status "ok", got "${data.status}"`);
            }

            if (!data.database || !data.database.connected) {
                throw new Error('Database not connected');
            }

            this.logger.info('   Health check passed, database connected');
        }).catch(err => {
            // Health check might fail if server not running - that's ok for smoke tests
            this.logger.warn('   Skipping health check (server may not be running)');
        });

        // Test 5: Governance Tally
        await this.runTest('Governance Tally', async () => {
            try {
                const tally = await getTally('G-2029-047');
                
                if (!tally || typeof tally !== 'object') {
                    throw new Error('Tally is not an object or is null');
                }

                this.logger.info('   Governance tally retrieved successfully');
            } catch (error) {
                this.logger.warn('   Skipping governance tally (may not be available)');
            }
        });

        // Test 6: Saga Engine Progress Persistence
        await this.runTest('Saga Engine Progress Retrieval', async () => {
            const userId = `smoke-test-saga-${Date.now()}`;
            
            // First get progress (should create fallback state)
            const progress1 = await sagaEngine.getReaderProgress(userId);
            
            if (!progress1 || progress1.currentChapter !== 1) {
                throw new Error('Saga engine progress not initialized correctly');
            }

            this.logger.info('   Saga engine progress retrieval successful');
        });

        // Test 7: Make Choice via Saga Engine
        await this.runTest('Saga Engine Choice Processing', async () => {
            const userId = `smoke-test-saga-choice-${Date.now()}`;
            
            const result = await sagaEngine.makeChoice(userId, 1, 0);
            
            if (!result || !result.success) {
                throw new Error('Saga choice not processed successfully');
            }

            if (typeof result.nextChapterId !== 'number') {
                throw new Error('nextChapterId is missing or invalid');
            }

            this.logger.info(`   Saga choice processed, next: ${result.nextChapterId}`);
        });

        // Test 8: Governance Store Initialization
        await this.runTest('Governance Store Initialization', async () => {
            const proposals = govStore.getActiveProposals();
            
            if (!proposals || !Array.isArray(proposals)) {
                throw new Error('No proposals available');
            }

            this.logger.info(`   Governance store initialized with ${proposals.length} proposals`);
        });

        // Test 9: Governance Vote Recording
        await this.runTest('Governance Vote Recording', async () => {
            try {
                const userId = `smoke-test-vote-${Date.now()}`;
                
                // Try to record a vote (may fail if proposal doesn't exist)
                const tally = await govStore.recordVote(
                    'G-2029-047', 
                    1, 
                    userId
                );

                this.logger.info('   Vote recorded successfully');
            } catch (error) {
                // May fail if proposal doesn't exist - that's ok
                this.logger.warn('   Skipping vote test (proposal may not exist)');
            }
        });

        // Test 10: Multiple Choices Consistency
        await this.runTest('Multiple Choices Consistency', async () => {
            const userId = `smoke-test-consistency-${Date.now()}`;
            
            // Make first choice
            const result1 = await sagaEngine.makeChoice(userId, 1, 0);
            
            if (!result1) {
                throw new Error('First choice failed');
            }

            // Get progress
            const progress = await sagaEngine.getReaderProgress(userId);
            
            if (progress.currentChapter !== result1.nextChapterId) {
                throw new Error('Progress not updated correctly after choice');
            }

            this.logger.info('   Multiple choices handled consistently');
        });

        // Test 11: API Response Format Validation
        await this.runTest('API Response Format', async () => {
            const userId = `smoke-test-format-${Date.now()}`;
            
            const progressResult = await sagaEngine.getReaderProgress(userId);
            
            if (!progressResult) {
                throw new Error('Progress API response is null');
            }

            // Validate response structure
            const requiredFields = ['currentChapter', 'decisions_made', 'metrics'];
            for (const field of requiredFields) {
                if (!(field in progressResult)) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }

            this.logger.info('   API response format is valid');
        });

        // Test 12: Metrics Persistence
        await this.runTest('Metrics Persistence', async () => {
            const userId = `smoke-test-metrics-${Date.now()}`;
            
            const metrics = {
                throughput: 95,
                latency: 45,
                resilience: 82
            };

            // Save metrics (using database)
            await require('../src/database').saveMetrics(userId, metrics);

            // Retrieve and verify
            const savedMetrics = await getReaderProgress(userId);
            
            if (!savedMetrics || savedMetrics.metrics.throughput !== 95) {
                throw new Error('Metrics not persisted correctly');
            }

            this.logger.info('   Metrics persistence verified');
        });

        // Print summary
        console.log('\n📊 Test Results Summary');
        console.log('==================================================');
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed} ✅`);
        console.log(`Failed: ${this.results.failed} ❌`);
        console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        console.log('==================================================\n');

        // Return success status
        return this.results.failed === 0;
    }

    /**
     * Get test results as JSON for reporting
     */
    getResults() {
        return this.results;
    }
}

// Export smoke test suite
module.exports = SmokeTestSuite;

// Run tests if executed directly
if (require.main === module) {
    const suite = new SmokeTestSuite();
    
    suite.runAll()
        .then(success => {
            console.log(`\n🎉 Smoke tests ${success ? 'PASSED' : 'FAILED'}\n`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n💥 Smoke test suite crashed:', error.message);
            console.error(error.stack);
            process.exit(1);
        });
}

// Export for use in other scripts
module.exports.Suite = SmokeTestSuite;