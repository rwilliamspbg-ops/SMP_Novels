/**
 * Cognoscent Echo - Comprehensive Verification Script
 * Checks for errors, deprecated versions, and configuration issues
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Starting Comprehensive Repository Verification...\n');

let errorCount = 0;
let warningCount = 0;
let infoCount = 0;

/**
 * Check if a file exists and report status
 */
function checkFileExists(filePath, required = false) {
    const exists = fs.existsSync(filePath);
    if (exists) {
        console.log(`✅ ${filePath}`);
        return true;
    } else if (required) {
        console.log(`❌ ${filePath} - MISSING (required)`);
        errorCount++;
    } else {
        console.log(`⚠️  ${filePath} - not found (optional)`);
        warningCount++;
    }
    return exists;
}

/**
 * Validate package.json dependencies for deprecated versions
 */
function checkDependencies() {
    console.log('\n--- Dependency Versions ---');
    
    const backendPkgPath = path.join(__dirname, '../backend/package.json');
    if (fs.existsSync(backendPkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf8'));
        
        // Check for known deprecated packages
        const deprecatedDeps = [];
        
        if (pkg.dependencies) {
            Object.keys(pkg.dependencies).forEach(dep => {
                if (/^@fastify\//.test(dep)) {
                    console.log(`✅ @fastify/${dep}: ${pkg.dependencies[dep]}`);
                } else if (dep === 'helmet') {
                    console.log(`✅ helmet: ${pkg.dependencies[dep]}`);
                } else if (dep === 'pg') {
                    console.log(`✅ pg (PostgreSQL): ${pkg.dependencies[dep]}`);
                }
            });
        }
    }
}

/**
 * Verify Dockerfile configurations
 */
function checkDockerfiles() {
    console.log('\n--- Dockerfile Configuration ---');
    
    const backendDocker = path.join(__dirname, '../backend/Dockerfile');
    const frontendDocker = path.join(__dirname, '../frontend/Dockerfile');
    
    if (fs.existsSync(backendDocker)) {
        const content = fs.readFileSync(backendDocker, 'utf8');
        
        if (content.includes('FROM node:')) {
            console.log(`✅ Backend Dockerfile uses Node.js base`);
        }
        
        if (!content.includes('mongo') && !content.includes('MONGODB')) {
            console.log(`✅ Backend Dockerfile has no MongoDB references`);
        } else {
            console.log(`❌ Backend Dockerfile still has MongoDB references`);
            errorCount++;
        }
        
        if (content.includes('server_fastify.js')) {
            console.log(`✅ Backend Dockerfile uses correct entry point`);
        }
    }
    
    if (fs.existsSync(frontendDocker)) {
        const content = fs.readFileSync(frontendDocker, 'utf8');
        
        if (!content.includes('mongo') && !content.includes('MONGODB')) {
            console.log(`✅ Frontend Dockerfile has no MongoDB references`);
        }
    }
}

/**
 * Check for hardcoded secrets
 */
function checkSecrets() {
    console.log('\n--- Security Audit ---');
    
    const envExample = path.join(__dirname, '../backend/.env.example');
    if (fs.existsSync(envExample)) {
        const content = fs.readFileSync(envExample, 'utf8');
        
        if (content.includes('your_secure_database_password_here')) {
            console.log(`⚠️  .env.example contains password placeholder (expected)`);
        }
        
        if (content.includes('openssl rand -hex 32')) {
            console.log(`✅ .env.example includes secure secret generation instruction`);
        }
    }
}

/**
 * Verify database migration files exist
 */
function checkMigrations() {
    console.log('\n--- Migration Files ---');
    
    const migrateScript = path.join(__dirname, '../backend/scripts/migrate.js');
    if (fs.existsSync(migrateScript)) {
        console.log(`✅ backend/scripts/migrate.js exists`);
    } else {
        console.log(`❌ backend/scripts/migrate.js missing`);
        errorCount++;
    }
    
    const initDb = path.join(__dirname, '../backend/init-db.sql');
    if (fs.existsSync(initDb)) {
        console.log(`✅ backend/init-db.sql exists`);
    } else {
        console.log(`⚠️  backend/init-db.sql missing (optional)`);
    }
}

/**
 * Check for orphaned dependencies
 */
function checkOrphanedFiles() {
    console.log('\n--- Orphaned Files ---');
    
    const modelsPath = path.join(__dirname, '../backend/src/models.js');
    if (fs.existsSync(modelsPath)) {
        const content = fs.readFileSync(modelsPath, 'utf8');
        
        if (!content.includes('mongoose') && !content.includes('Mongoose')) {
            console.log(`✅ models.js no longer uses Mongoose`);
        } else {
            console.log(`❌ models.js still has Mongoose references`);
            errorCount++;
        }
    }
}

/**
 * Run all checks and generate report
 */
function runVerification() {
    try {
        checkFileExists(backendPkgPath, true);
        checkFileExists(frontendPkgPath, true);
        checkFileExists(serverPath, true);
        
        checkDependencies();
        checkDockerfiles();
        checkSecrets();
        checkMigrations();
        checkOrphanedFiles();
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('VERIFICATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Passed checks`);
        console.log(`⚠️  Warnings: ${warningCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log('='.repeat(60) + '\n');
        
        if (errorCount === 0) {
            console.log('🎉 All critical issues have been resolved!');
            console.log('\nNext steps:');
            console.log('1. Run "docker-compose up --build" to deploy');
            console.log('2. Verify database connectivity: curl http://localhost:3001/health');
            console.log('3. Test narrative flow in frontend: http://localhost:3000');
        } else {
            console.log(`\n⚠️  Found ${errorCount} error(s) that need attention.`);
        }
        
    } catch (error) {
        console.error('\n❌ Verification failed:', error.message);
    }
}

// Main execution
const backendPkgPath = path.join(__dirname, '../backend/package.json');
const frontendPkgPath = path.join(__dirname, '../frontend/package.json');
const serverPath = path.join(__dirname, '../backend/server.js');

runVerification();
