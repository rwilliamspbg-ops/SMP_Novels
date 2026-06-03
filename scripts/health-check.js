#!/usr/bin/env node

/**
 * Health Check & Monitoring Script
 * Verifies all system components and reports status
 */

const http = require('http');
const pg = require('pg');

// Configuration
const CONFIG = {
  backend: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'interactive_novel',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  }
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Service health checks
const SERVICES = [
  {
    name: 'Backend API',
    check: () => http.get('http://localhost:3001/health', (res) => {
      return res.statusCode === 200;
    }).catch(() => false),
    expectedStatus: 200
  },
  {
    name: 'Frontend Server',
    check: () => http.get('http://localhost:3000/health', (res) => {
      return res.statusCode === 200;
    }).catch(() => false),
    expectedStatus: 200
  }
];

// Database health check
async function checkDatabase() {
  try {
    const client = await pg.connect(CONFIG.backend, { connectionTimeoutMillis: 5000 });
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    
    client.end();
    
    console.log(`${colors.green}✓ Database: Connected${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Database: Connection failed - ${error.message}${colors.reset}`);
    return false;
  }
}

// Memory usage check
function checkMemory() {
  const memUsage = process.memoryUsage();
  const totalMem = Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100;
  
  console.log(`${colors.cyan}Memory Usage:${colors.reset}`);
  console.log(`   Heap Used: ${totalMem}MB`);
  
  return totalMem < 512; // Warning if > 512MB
}

// Report generation
function generateReport(startTime, results) {
  const duration = Date.now() - startTime;
  const healthyCount = Object.values(results).filter(r => r.status === 'healthy').length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Health Check Report');
  console.log('='.repeat(60));
  console.log(`Duration: ${duration}ms`);
  console.log(`Healthy Services: ${healthyCount}/${totalCount}`);
  
  if (healthyCount === totalCount) {
    console.log(`${colors.green}✅ All systems operational${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  ${healthyCount}/${totalCount} services healthy${colors.reset}`);
  }
  console.log('='.repeat(60));
}

// Main execution
async function main() {
  const startTime = Date.now();
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 Cognoscent Echo - Health Check & Monitoring');
  console.log('='.repeat(60) + '\n');
  
  // Run all checks in parallel where possible
  const results = {};
  
  try {
    // Database check (sequential, required first)
    results.database = await checkDatabase();
    
    // Service health checks
    for (const service of SERVICES) {
      try {
        const isHealthy = await service.check();
        results[service.name] = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          message: isHealthy 
            ? `OK (status ${service.expectedStatus})`
            : 'Connection failed or wrong status'
        };
      } catch (error) {
        results[service.name] = {
          status: 'error',
          message: error.message
        };
      }
    }
    
    // Memory check
    const memoryOK = checkMemory();
    results.memory = {
      status: memoryOK ? 'healthy' : 'warning',
      message: `Heap usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    };
    
  } catch (error) {
    console.error(`\n❌ Health check failed:`, error.message);
    process.exit(1);
  }
  
  // Generate report
  generateReport(startTime, results);
  
  // Exit with appropriate code
  const allHealthy = Object.values(results).every(r => r.status === 'healthy');
  process.exit(allHealthy ? 0 : 1);
}

main();
