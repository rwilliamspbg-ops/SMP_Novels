/**
 * Authentication Middleware for API Routes
 */

const jwt = require('jsonwebtoken');

// Verify JWT token
function verifyAdminToken(token, secret) {
  try {
    const decoded = jwt.verify(token, secret);
    
    // Check if token has admin privileges
    if (decoded.role !== 'admin') {
      throw new Error('Insufficient privileges');
    }
    
    return decoded;
  } catch (err) {
    throw err;
  }
}

/**
 * Rate limiting middleware
 */
function rateLimit(maxRequests, windowMs = 60000) {
  const store = new Map();
  
  return async function(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    
    if (!store.has(ip)) {
      store.set(ip, []);
    }
    
    const requests = store.get(ip);
    const now = Date.now();
    
    // Clean old entries
    requests.filter((reqTime) => now - reqTime < windowMs);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. ${maxRequests} requests per ${windowMs / 1000}s`,
        resetAt: now + windowMs
      });
    }
    
    requests.push(now);
    store.set(ip, requests);
    
    next();
  };
}

/**
 * Request validation middleware
 */
function validateRequest(schema) {
  return async function(req, res, next) {
    try {
      // In production, use a library like Joi or Zod here
      // For now, basic type checking
      
      if (req.body && schema) {
        const errors = [];
        
        for (const [field, validator] of Object.entries(schema)) {
          if (!(await validator(req.body[field], field))) {
            errors.push(`${field} validation failed`);
          }
        }
        
        if (errors.length > 0) {
          return res.status(400).json({
            error: 'Validation failed',
            details: errors
          });
        }
      }
      
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  verifyAdminToken,
  rateLimit,
  validateRequest
};
