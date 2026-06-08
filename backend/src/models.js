/**
 * Cognoscent Echo - Database Models (PostgreSQL)
 * 
 * ⚠️ IMPORTANT: This file is DEPRECATED.
 * The application now uses PostgreSQL exclusively via database.js.
 * Keep this for historical reference or future migration.
 */

// @ts-check

/**
 * User model for authentication and progress tracking
 * @typedef {Object} User
 * @property {string} username - User's display name
 * @property {string} password - Hashed password (bcrypt)
 * @property {string} email - User's email address
 * @property {'free'|'premium'|'enterprise'} tier - Subscription tier
 * @property {Date} createdAt - Account creation timestamp
 */

/**
 * Progress save for tracking user narrative state
 * @typedef {Object} Save
 * @property {string} userId - Reference to User
 * @property {string} novelId - Novel identifier
 * @property {number} currentChapter - Current chapter in narrative
 * @property {string[]} decisions - Array of decision history
 * @property {Object} metrics - Performance metrics (throughput, latency, etc.)
 * @property {Map<string, string>} governanceVotes - Governance voting records
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * Novel content model for chapter management
 * @typedef {Object} Novel
 * @property {string} title - Novel title
 * @property {string} slug - Unique identifier
 * @property {Map<string, Mixed>} content - Chapters map
 * @property {Map<string, string>} metadata - Chapter metadata
 */

/**
 * Note: This file is kept for reference only.
 * Actual database operations are handled in database.js using PostgreSQL Pool.
 * 
 * To migrate away from this file:
 * 1. Remove all references to models.js from server files
 * 2. Use database.js functions directly (getReaderProgress, makeChoice, etc.)
 */

console.warn('models.js is deprecated. Use database.js instead.');

module.exports = {
    User: null, // Not using MongoDB - removed
    Save: null, // Not using MongoDB - removed  
    Novel: null // Not using MongoDB - removed
};
