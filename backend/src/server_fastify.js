const fastify = require('fastify')({ 
  logger: { 
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.ENABLE_JSON_LOGGING === 'true' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard'
      }
    } : undefined
  } 
});

const cors = require('@fastify/cors');
const rateLimit = require('@fastify/rate-limit');
const helmet = require('helmet');
const { initializeSchema, getClient } = require('./database');

// Security headers
fastify.register(helmet);

// CORS with proper origin handling
fastify.register(cors, {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://echo-platform.vercel.app',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: true,
  credentials: true,
  maxAge: 600
});

// Rate limiting - configurable by environment
fastify.register(rateLimit, {
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  timeWindow: process.env.RATE_LIMIT_TIME_WINDOW || '1m',
  allowList: [
    '127.0.0.1',
    process.env.ALLOWED_IPS?.split(',') || []
  ]
});

// Add rate limit headers
fastify.addHook('onRequest', async (request, reply) => {
  reply.header('X-RateLimit-Limit', request.rateLimit.limit);
  reply.header('X-RateLimit-Remaining', request.rateLimit.remaining);
  reply.header('X-RateLimit-Reset', request.rateLimit.reset);
  return reply;
});

// Request validation middleware
fastify.addHook('preHandler', async (request, reply) => {
  if (['POST', 'PUT'].includes(request.method)) {
    const contentType = request.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return reply.status(415).send({ error: 'Unsupported Media Type' });
    }
  }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  try {
    const startTime = Date.now();
    
    const client = await getClient();
    await client.query('SELECT 1');
    await client.release();
    
    const dbCheckTime = Date.now() - startTime;
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: { connected: true, ping_ms: dbCheckTime },
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
      }
    };
  } catch (error) {
    return reply.status(503).send({ 
      status: 'error', 
      error: 'Database connection failed',
      message: error.message 
    });
  }
});

// Ready handler - initialize database schema on startup
fastify.ready(async (err) => {
  if (err) {
    fastify.log.error('[SERVER] Failed to start:', err.message);
    process.exit(1);
  }
  
  try {
    await initializeSchema();
    fastify.log.info('[SERVER] Database schema initialized');
  } catch (error) {
    fastify.log.error('[SERVER] Schema initialization failed:', error.message);
  }
  
  const addressInfo = fastify.server.address();
  const port = addressInfo.port;
  const host = addressInfo.address === '::' ? '0.0.0.0' : addressInfo.address;
  
  console.log(`\n🚀 Cognoscent Echo Production API`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`   Host: ${host}:${port}`);
  console.log(`   Database: ${process.env.DB_NAME || 'postgres'}@${process.env.DB_HOST || 'localhost'}`);
  console.log(`   CORS Origins: ${process.env.ALLOWED_CORS_URLS || '*'}`);
  console.log(`   Rate Limit: ${parseInt(process.env.RATE_LIMIT_MAX || '100')} req/${process.env.RATE_LIMIT_TIME_WINDOW || '1m'}`);
  console.log(`\n📚 Narrative Engine Ready\n`);
});

// ============================================================================
// API ROUTES - Core Narrative Endpoints
// ============================================================================

// Get user progress
fastify.get('/progress/:userId', async (request, reply) => {
  const userId = request.params.userId;
  
  try {
    if (!userId || userId.length < 5) {
      return reply.status(400).send({ error: 'Invalid user ID format' });
    }
    
    const saga = require('./sagaEngine');
    const progress = await saga.getReaderProgress(userId);
    
    return {
      success: true,
      currentChapter: progress.currentChapter,
      decisions_made: progress.decisions_made,
      branch_selections: progress.branch_selections,
      metrics: progress.metrics,
      unlocked_nodes: progress.unlocked_nodes
    };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

// Process choice
fastify.post('/choice', async (request, reply) => {
  const { userId, chapterId, choiceIndex } = request.body;
  
  if (!userId || !chapterId || !choiceIndex) {
    return reply.status(400).send({ 
      error: 'Missing required fields',
      required: ['userId', 'chapterId', 'choiceIndex'] 
    });
  }

  try {
    const saga = require('./sagaEngine');
    const result = await saga.makeChoice(userId, parseInt(chapterId), parseInt(choiceIndex));
    
    return { 
      success: true, 
      progress: result.progress,
      nextChapterId: result.nextChapterId,
      decisions_made: result.decisions_made
    };
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
});

// Get chapter by ID
fastify.get('/chapter/:id', async (request, reply) => {
  const chapterId = request.params.id;
  
  try {
    if (!/^\d+$/.test(chapterId)) {
      return reply.status(400).send({ error: 'Chapter ID must be a positive integer' });
    }
    
    const narrativeData = require('./narrativeData');
    const chapter = narrativeData.chapters[chapterId];
    if (!chapter) {
      return reply.status(404).send({ 
        error: 'Chapter not found', 
        availableChapters: Object.keys(narrativeData.chapters || {}).join(', ') 
      });
    }
    
    return chapter;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

// AI response endpoint
fastify.post('/ai-response', async (request, reply) => {
  const { character, context, userId } = request.body;
  
  if (!character || !context) {
    return reply.status(400).send({ error: 'Missing character or context' });
  }

  try {
    const saga = require('./sagaEngine');
    const memory = await saga.getReaderProgress(userId);
    
    // Placeholder for actual AI routing - TODO: integrate with aiRouter
    return {
      success: true,
      character: character,
      response: `AI generated response for ${character} based on context`,
      metrics: memory.metrics
    };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

// Governance tally endpoint
fastify.get('/governance/tally/:proposalId', async (request, reply) => {
  const proposalId = request.params.proposalId;
  
  try {
    if (!proposalId) {
      return reply.status(400).send({ error: 'Missing proposal ID' });
    }
    
    const govStore = require('./governanceStore');
    const tally = await govStore.getTally(proposalId);
    return { proposalId, currentTally: tally };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

// Governance vote endpoint
fastify.post('/governance/vote', async (request, reply) => {
  const { proposalId, optionId, userId } = request.body;
  
  if (!proposalId || !optionId || !userId) {
    return reply.status(400).send({ 
      error: 'Missing required fields',
      required: ['proposalId', 'optionId', 'userId'] 
    });
  }

  try {
    const govStore = require('./governanceStore');
    const tally = await govStore.recordVote(proposalId, parseInt(optionId), userId);
    return { success: true, currentTally: tally };
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
});

// Metrics endpoint
fastify.post('/metrics', async (request, reply) => {
  const { userId, metrics } = request.body;
  
  try {
    if (!userId || !metrics) {
      return reply.status(400).send({ 
        error: 'Missing required fields',
        required: ['userId', 'metrics'] 
      });
    }
    
    // Save metrics to database
    await require("./sagaEngine").saveMetrics(userId, metrics);
    
    return { success: true, message: 'Metrics recorded successfully' };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

// Admin chapter routes integration
const { setupAdminRoutes } = require("./admin_routes");
setupAdminRoutes(fastify);

// Analytics endpoint
fastify.get('/analytics/active-readers', async (request, reply) => {
  try {
    const limit = parseInt(request.query.limit) || 100;
    
    // Get active readers from saga engine
    const saga = require('./sagaEngine');
    const readers = saga.getActiveUsers(limit);
    
    return { 
      count: readers.length,
      readers: readers.map(r => ({
        userId: r,
        status: 'active'
      }))
    };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

// Error handlers
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error('[SERVER] Error:', { 
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: request.url,
    method: request.method 
  });
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && !error.message.includes('User not found')) {
    return reply.status(500).send({ error: 'Internal server error' });
  }
  
  return reply.status(500).send({ 
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown
const start = async () => {
  try {
    await fastify.listen({ port: parseInt(process.env.PORT || '3001'), host: '0.0.0.0' });
    
    const addressInfo = fastify.server.address();
    console.log(`\n📍 Server listening on ${addressInfo.address}:${addressInfo.port}`);
    console.log(`   Press CTRL+C to shutdown gracefully\n`);
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();