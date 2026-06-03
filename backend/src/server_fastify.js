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
    // Allow requests from Vercel/production domains
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
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // requests per window
  timeWindow: process.env.RATE_LIMIT_TIME_WINDOW || '1m', // 1 minute default
  allowList: [
    '127.0.0.1', // Allow localhost for development
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
  // Validate content-type for POST/PUT requests
  if (['POST', 'PUT'].includes(request.method)) {
    const contentType = request.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return reply.status(415).send({ error: 'Unsupported Media Type', message: 'Content-Type must be application/json' });
    }
  }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  try {
    const startTime = Date.now();
    
    // Test database connection
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
  
  // Initialize PostgreSQL schema
  try {
    await initializeSchema();
    fastify.log.info('[SERVER] Database schema initialized');
  } catch (error) {
    fastify.log.error('[SERVER] Schema initialization failed:', error.message);
    // Continue running - schema might already exist
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

// API Routes

fastify.get('/progress/:userId', async (request, reply) => {
  const userId = request.params.userId;
  
  try {
    if (!userId || userId.length < 5) {
      return reply.status(400).send({ error: 'Invalid user ID format' });
    }
    
    const progress = await fastify.saga.getReaderProgress(userId);
    
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

fastify.post('/choice', async (request, reply) => {
  const { userId, chapterId, choiceIndex } = request.body;
  
  // Validate inputs
  if (!userId || !chapterId || !choiceIndex) {
    return reply.status(400).send({ 
      error: 'Missing required fields',
      required: ['userId', 'chapterId', 'choiceIndex'] 
    });
  }

  try {
    const result = await fastify.saga.makeChoice(userId, parseInt(chapterId), parseInt(choiceIndex));
    
    return { 
      success: true, 
      progress: result.progress,
      nextChapterId: result.nextChapterId 
    };
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
});

fastify.get('/chapter/:id', async (request, reply) => {
  const chapterId = request.params.id;
  
  try {
    if (!/^[\d]+$/.test(chapterId)) {
      return reply.status(400).send({ error: 'Chapter ID must be a positive integer' });
    }
    
    const chapter = narrativeData.chapters[chapterId];
    if (!chapter) {
      return reply.status(404).send({ error: 'Chapter not found', availableChapters: Object.keys(narrativeData.chapters).join(', ') });
    }
    
    return chapter;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

fastify.post('/ai-response', async (request, reply) => {
  const { character, context, userId } = request.body;
  
  // Validate required fields
  if (!character || !context) {
    return reply.status(400).send({ error: 'Missing character or context' });
  }

  try {
    const memory = await fastify.saga.getReaderProgress(userId); 
    const routedResponse = await aiRouter.routeRequest(character, context, userId, memory);
    return routedResponse;
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

fastify.get('/governance/tally/:proposalId', async (request, reply) => {
  const proposalId = request.params.proposalId;
  
  try {
    if (!proposalId) {
      return reply.status(400).send({ error: 'Missing proposal ID' });
    }
    
    const tally = await govStore.getTally(proposalId);
    return { proposalId, currentTally: tally };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

fastify.post('/governance/vote', async (request, reply) => {
  const { proposalId, optionId, userId } = request.body;
  
  // Validate inputs
  if (!proposalId || !optionId || !userId) {
    return reply.status(400).send({ 
      error: 'Missing required fields',
      required: ['proposalId', 'optionId', 'userId'] 
    });
  }

  try {
    const tally = await govStore.recordVote(proposalId, parseInt(optionId), userId);
    return { success: true, currentTally: tally };
  } catch (error) {
    return reply.status(400).send({ error: error.message });
  }
});

fastify.post('/metrics', async (request, reply) => {
  const { userId, metrics } = request.body;
  
  try {
    if (!userId || !metrics) {
      return reply.status(400).send({ 
        error: 'Missing required fields',
        required: ['userId', 'metrics'] 
      });
    }
    
    await fastify.saga.saveMetrics(userId, metrics);
    
    return { success: true, message: 'Metrics recorded successfully' };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

// Admin endpoints
fastify.post('/admin/reset/:userId', async (request, reply) => {
  // Check if admin token exists (simplified for demo)
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Admin authentication required' });
  }

  try {
    await fastify.saga.resetProgress(request.params.userId);
    return { success: true, message: `Progress reset for user ${request.params.userId}` };
  } catch (error) {
    return reply.status(500).send({ error: error.message });
  }
});

// Analytics endpoint
fastify.get('/analytics/active-readers', async (request, reply) => {
  try {
    const limit = parseInt(request.query.limit) || 100;
    const readers = await fastify.saga.getActiveReaders(limit);
    
    return { 
      count: readers.length,
      readers: readers.map(r => ({
        userId: r.user_id,
        lastChapter: r.last_chapter,
        created_at: r.created_at,
        last_active: r.updated_at
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
  
  // Don't expose internal errors in production
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
