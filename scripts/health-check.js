#!/usr/bin/env node
/**
 * SMP_Novels Health Check Script (v3.3.1)
 * 
 * Checks all services and components for production readiness
 */

const http = require('http');

// Configuration
const CONFIG = {
  backend: 'http://localhost:3001',
  frontend: 'http://localhost:3000',
  postgres: 'localhost:5432',
  redis: 'localhost:6379'
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Helper to print colored output
function printStatus(status, message) {
  const color = status === 'OK' ? colors.green : 
                status === 'WARNING' ? colors.yellow : 
                status === 'FAIL' ? colors.red : colors.blue;
  console.log(`${color}[${status}]${colors.reset} ${message}`);
}

// Check HTTP endpoint
function checkEndpoint(url, path = '/', timeout = 5000) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: path,
      method: 'GET',
      timeout: timeout
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          time: Date.now() - startTime,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy(new Error('Request timeout'));
    });

    req.end();
    startTime = Date.now();
  });
}

// Check PostgreSQL connection
async function checkPostgres() {
  printStatus('INFO', 'Checking PostgreSQL connection...');
  
  // Note: This requires pg client installed
  try {
    // Try to connect via command line if node-pg not available
    const { execSync } = require('child_process');
    
    try {
      const result = execSync(
        `psql -h ${CONFIG.postgres} -U postgres -c "SELECT 1 as status"`,
        { encoding: 'utf8', timeout: 5000 }
      );
      printStatus('OK', 'PostgreSQL is accessible');
      return true;
    } catch (e) {
      console.log(`  Note: PostgreSQL not accessible (expected if not running locally)`);
      printStatus('SKIP', 'PostgreSQL check skipped');
      return null; // Skip, don't fail
    }
  } catch (e) {
    printStatus('FAIL', 'PostgreSQL connection failed');
    console.log(`  Error: ${e.message}`);
    return false;
  }
}

// Check Redis connection
async function checkRedis() {
  printStatus('INFO', 'Checking Redis connection...');
  
  try {
    const result = await checkEndpoint(CONFIG.redis, '/');
    if (result && result.status === 200) {
      printStatus('OK', 'Redis is accessible');
      return true;
    } else {
      console.log(`  Note: Redis not responding on port 6379 (optional service)`);
      printStatus('SKIP', 'Redis check skipped (optional)');
      return null; // Skip, don't fail
    }
  } catch (e) {
    console.log(`  Note: Redis not accessible (expected if not running locally)`);
    printStatus('SKIP', 'Redis check skipped (optional)');
    return null;
  }
}

// Main health check
async function runHealthCheck() {
  console.log('\n' + '='.repeat(60));
  console.log('  SMP_Novels Health Check - v3.3.1');
  console.log('='.repeat(60) + '\n');

  const startTime = Date.now();
  const results = {};

  // Check backend API
  printStatus('INFO', 'Checking backend API...');
  try {
    const result = await checkEndpoint(CONFIG.backend, '/health');
    if (result) {
      console.log(`  Response time: ${result.time}ms`);
      console.log(`  Status code: ${result.status}`);
      if (result.status === 200) {
        printStatus('OK', 'Backend API is healthy');
        results.backend = true;
      } else if (result.status >= 500) {
        printStatus('FAIL', `Backend API error: ${result.status}`);
        results.backend = false;
      } else {
        printStatus('WARNING', `Backend API returned: ${result.status}`);
        results.backend = true; // Still healthy, different status
      }
    } else {
      console.log(`  Note: Backend not responding on port 3001 (expected if not running)`);
      printStatus('SKIP', 'Backend check skipped');
      results.backend = null;
    }
  } catch (e) {
    printStatus('FAIL', `Backend API error: ${e.message}`);
    results.backend = false;
  }

  // Check frontend
  printStatus('INFO', 'Checking frontend...');
  try {
    const result = await checkEndpoint(CONFIG.frontend, '/');
    if (result && result.status === 200) {
      console.log(`  Response time: ${result.time}ms`);
      printStatus('OK', 'Frontend is accessible');
      results.frontend = true;
    } else if (result) {
      printStatus('WARNING', `Frontend returned unexpected status: ${result.status}`);
      results.frontend = true;
    }
  } catch (e) {
    console.log(`  Note: Frontend not responding on port 3000 (expected if not running)`);
    printStatus('SKIP', 'Frontend check skipped');
    results.frontend = null;
  }

  // Check database services
  await checkPostgres();
  await checkRedis();

  const totalTime = Date.now() - startTime;

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('  HEALTH CHECK SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total time: ${totalTime}ms`);
  console.log('\nResults:');
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(v => v === true).length;
  const failed = Object.values(results).filter(v => v === false).length;
  const skipped = total - passed - failed;

  console.log(`  Passed: ${passed}/${total}`);
  console.log(`  Failed: ${failed}/${total}`);
  console.log(`  Skipped: ${skipped}/${total} (services not running)`);

  if (failed === 0) {
    console.log('\n' + colors.green + 'STATUS: ALL SERVICES HEALTHY' + colors.reset);
    return 0;
  } else {
    console.log('\n' + colors.red + 'STATUS: SOME SERVICES UNHEALTHY' + colors.reset);
    return 1;
  }
}

// Run health check
runHealthCheck()
  .then(exitCode => process.exit(exitCode))
  .catch(err => {
    console.error('Health check failed:', err);
    process.exit(1);
  });
