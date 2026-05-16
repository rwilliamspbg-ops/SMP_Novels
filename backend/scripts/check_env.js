#!/usr/bin/env node
const fs = require('fs');

// If a .env file exists, load it for local dev convenience.
try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional in environments where it's not installed globally
}

const required = [
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'MONGODB_URI',
  'DATABASE_URL',
  'REDIS_URL',
  'FRONTEND_URL'
];

console.log('Startup environment check — verifying required environment variables');

const missing = required.filter((k) => !process.env[k] || process.env[k] === 'ci_dummy');

if (missing.length > 0) {
  console.error('\nERROR: Missing required environment variables:');
  missing.forEach((m) => console.error(` - ${m}`));
  if (!fs.existsSync('./.env')) {
    console.error('\nTip: create a .env from .env.example:');
    console.error('  cp .env.example .env && edit .env to add secrets');
  } else {
    console.error('\nTip: update .env with real values for the required keys');
  }
  process.exit(1);
}

console.log('All required environment variables are present.');
process.exit(0);
