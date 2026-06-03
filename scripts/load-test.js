#!/usr/bin/env node

/**
 * Load Testing Script - k6 Compatible
 * Test API endpoints with realistic user patterns
 */

const http = require('http');

const API_BASE = process.env.VITE_API_BASE || 'http://localhost:3001';

// Simulate different user scenarios
const SCENARIOS = {
  // Scenario 1: Reader navigation
  reader_navigation: {
    name: 'Reader Navigation',
    operations: [
      async () => {
        const userId = `reader-${Math.random().toString(36).substr(2, 9)}`;
        
        // Get chapter
        const response = await fetch(`${API_BASE}/chapter/1`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`Chapter fetch failed: ${response.status}`);
        
        return response.json();
      },
      
      // Make a choice
      async (chapter) => {
        const response = await fetch(`${API_BASE}/choice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            chapterId: 1,
            choiceIndex: 0
          })
        });
        
        if (!response.ok) throw new Error(`Choice recording failed: ${response.status}`);
        
        return response.json();
      }
    ]
  },

  // Scenario 2: Governance voting
  governance_voting: {
    name: 'Governance Voting',
    operations: [
      async () => {
        const response = await fetch(`${API_BASE}/governance/tally/G-2029-047`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`Tally fetch failed: ${response.status}`);
        
        return response.json();
      },
      
      async (tally) => {
        const userId = `voter-${Math.random().toString(36).substr(2, 9)}`;
        
        const response = await fetch(`${API_BASE}/governance/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalId: 'G-2029-047',
            optionId: 1,
            userId
          })
        });
        
        if (!response.ok) throw new Error(`Vote recording failed: ${response.status}`);
        
        return response.json();
      }
    ]
  },

  // Scenario 3: Health check monitoring
  health_checks: {
    name: 'Health Checks',
    operations: [
      async () => {
        const response = await fetch(`${API_BASE}/health`, {
          method: 'GET'
        });
        
        if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
        
        return response.json();
      }
    ]
  }
};

// Simple load test runner
async function runLoadTest(scenario, concurrency = 10, iterations = 5) {
  console.log(`\n🧪 Running scenario: ${scenario.name}`);
  console.log(`   Concurrency: ${concurrency}, Iterations: ${iterations}\n`);

  let successful = 0;
  let failed = 0;
  let totalLatency = 0;

  for (let i = 0; i < iterations; i++) {
    const promises = Array(concurrency).fill(null)
      .map(() => runSingleOperation(scenario.operations));

    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === 'fulfilled') {
        successful++;
        totalLatency += result.value.latency || 0;
      } else {
        failed++;
        console.error(`   Operation failed: ${result.reason?.message}`);
      }
    }
  }

  const avgLatency = successful ? Math.round(totalLatency / successful) : 0;
  const successRate = ((successful / (successful + failed)) * 100).toFixed(1);

  console.log(`\n📊 Results:`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Success Rate: ${successRate}%`);
  console.log(`   Avg Latency: ${avgLatency}ms`);

  return { successful, failed, avgLatency, successRate };
}

async function runSingleOperation(operations) {
  const startTime = Date.now();
  
  try {
    let result = {};
    
    for (const op of operations) {
      result = await op(result);
    }
    
    return {
      ...result,
      latency: Date.now() - startTime
    };
  } catch (error) {
    throw error;
  }
}

// Main execution
async function main() {
  console.log('='.repeat(60));
  console.log('🧪 Cognoscent Echo - Load Testing');
  console.log('='.repeat(60));
  console.log(`Target: ${API_BASE}\n`);

  // Run all scenarios
  for (const [name, scenario] of Object.entries(SCENARIOS)) {
    await runLoadTest(scenario, 10, 3);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Load testing completed');
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('\n❌ Load test failed:', error.message);
  process.exit(1);
});
