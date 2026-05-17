/**
 * Cognoscent Echo - Production API Server
 * Interactive Novel Platform with Wasm Sandboxing & Learning Progress
 */

require('dotenv').config();

const fastify = require('fastify')({ 
  logger: { level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' } 
});

// Register CORS
fastify.register(require('@fastify/cors'), {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Register security middleware
fastify.register(require('@fastify/helmet'));

// ============== WASM Sandbox ==============
const WASM_SANDBOX_PATH = './sandbox/index.html';
const WASM_CONFIG_PATH = './sandbox/config.json';

fastify.get('/sandbox', async () => {
  return { 
    path: WASM_SANDBOX_PATH, 
    status: 'ready',
    features: ['code_execution', 'memory_inspection', 'network_simulation'] 
  };
});

fastify.post('/sandbox/execute', async (request, reply) => {
  const { code, memoryInput, userId } = request.body;
  
  if (!code || typeof code !== 'string') {
    return reply.status(400).send({ error: 'Invalid code' });
  }

  // Security: Validate code - prevent dangerous operations
  const forbiddenPatterns = [
    'require\\(.*\\.env',
    'fs\\.writeFile|fs\\.readFile',
    'process.env\\.',
    'child_process',
    'dlopen',
    '\\/\\/\\s*#.*unsafe'
  ];

  for (const pattern of forbiddenPatterns) {
    if (new RegExp(pattern, 'i').test(code)) {
      throw new Error('Security violation: forbidden operation');
    }
  }

  // Simulate WASM execution environment
  const executionResult = {
    status: 'success',
    memoryAccess: memoryInput || {},
    codeSize: code.length,
    executionTime: Math.random() * 100 + 50,
    warnings: []
  };

  return executionResult;
});

// ============== Learning Progress Tracker ==============
const learningTracker = {
  userIds: new Map(),

  getProgress(userId) {
    if (!this.userIds.has(userId)) {
      this.userIds.set(userId, {
        userId,
        chapterProgress: {},
        skillsLearned: [],
        educationalMilestones: [],
        totalChaptersCompleted: 0,
        currentChapter: 1,
        learningPath: []
      });
    }
    return this.userIds.get(userId);
  },

  recordChapterComplete(userId, chapterId) {
    const progress = this.getProgress(userId);
    progress.chapterProgress[chapterId] = {
      completed: true,
      timestamp: new Date().toISOString(),
      challengesPassed: Math.floor(Math.random() * 10),
      insightsGained: []
    };
    
    progress.totalChaptersCompleted++;
    if (progress.currentChapter !== chapterId) {
      progress.currentChapter = Math.max(progress.currentChapter, chapterId);
    }

    return progress;
  },

  recordSkill(userId, skillName, difficulty) {
    const progress = this.getProgress(userId);
    
    if (!progress.skillsLearned.includes(skillName)) {
      progress.skillsLearned.push({
        name: skillName,
        difficulty: difficulty || 'medium',
        masteredAt: new Date().toISOString()
      });

      return {
        success: true,
        message: `Skill '${skillName}' mastered!`,
        difficulty
      };
    }

    return { success: false, message: 'Skill already mastered' };
  },

  recordMilestone(userId, milestone) {
    const progress = this.getProgress(userId);
    progress.educationalMilestones.push(milestone);
    
    return {
      success: true,
      milestoneCount: progress.educationalMilestones.length
    };
  }
};

// ============== API Routes ==============

// Health check
fastify.get('/ping', async () => ({ 
  status: 'alive', 
  timestamp: new Date().toISOString(),
  version: '2.0.0' 
}));

// Learning Progress API
fastify.get('/progress/:userId', async (request, reply) => {
  const progress = learningTracker.getProgress(request.params.userId);
  
  return {
    userId: progress.userId,
    currentChapter: progress.currentChapter,
    totalChaptersCompleted: progress.totalChaptersCompleted,
    chapterProgress: progress.chapterProgress,
    skillsLearned: progress.skillsLearned,
    educationalMilestones: progress.educationalMilestones,
    learningPath: progress.learningPath || []
  };
});

// Save progress to MongoDB (simplified - in production use sagaEngine_pg.js)
fastify.post('/save-progress/:userId', async (request, reply) => {
  const { chapterId, decisions, choices } = request.body;
  
  // In production, this would save to MongoDB via sagaEngine_pg
  // For now, we'll simulate the save
  learningTracker.getProgress(request.params.userId);
  
  return { 
    success: true, 
    message: `Progress saved for user ${request.params.userId}`,
    timestamp: new Date().toISOString() 
  };
});

// Chapter Content API
fastify.get('/chapter/:id', async (request, reply) => {
  const narrativeData = require('./narrativeData');
  const chapter = narrativeData.chapters[request.params.id];
  
  if (!chapter) {
    return reply.status(404).send({ 
      error: 'Chapter not found',
      availableChapters: Object.keys(narrativeData.chapters).map(Number) 
    });
  }

  // Enhance chapter with learning metadata
  const enhancedChapter = {
    ...chapter,
    educationalContext: {
      skillsRelevant: ['Memory Management', 'Systems Programming', 'Distributed Computing'],
      difficulty: 'Advanced',
      timeEstimate: `${chapter.text.length / 20} minutes reading`
    },
    learningOutcomes: [
      'Understand zero-copy memory allocation patterns',
      'Learn about BFT consensus thresholds',
      'Practice debugging high-frequency trading systems'
    ]
  };

  return enhancedChapter;
});

// Interactive Code Challenge API
fastify.post('/challenge/validate', async (request, reply) => {
  const { code, challengeId } = request.body;
  
  if (!code || typeof code !== 'string') {
    return reply.status(400).send({ error: 'Invalid code' });
  }

  // Validate based on chapter's interactiveElement rules
  const narrativeData = require('./narrativeData');
  const challenges = new Map();
  
  // Define challenge validation logic
  Object.values(narrativeData.chapters).forEach(chapter => {
    if (chapter.interactiveElement?.validationRules) {
      chapter.interactiveElement.validationRules.forEach(rule => {
        challenges.set(rule.condition, rule.feedback);
      });
    }
  });

  const validations = [];
  for (const [condition, feedback] of challenges) {
    const isMatched = code.includes(condition.split(' ')[0]);
    if (isMatched && challengeId === 'code_challenge') {
      validations.push({
        condition,
        passed: true,
        message: feedback
      });
    }
  }

  return {
    valid: validations.length > 0,
    validations,
    score: validations.length * 100
  };
});

// Choice/Navigation API
fastify.post('/choice', async (request, reply) => {
  const { userId, chapterId, choiceIndex } = request.body;
  
  try {
    // Check if user exists, create if not
    learningTracker.getProgress(userId);
    
    // Get next chapter from narrative
    const narrativeData = require('./narrativeData');
    const chapter = narrativeData.chapters[chapterId];
    
    if (!chapter || !chapter.choices) {
      throw new Error('No choices available at this chapter');
    }

    const choice = chapter.choices[choiceIndex];
    const nextChapterId = choice.nextChapter;
    
    // Record completion of current chapter
    learningTracker.recordChapterComplete(userId, chapterId);

    // Save progress
    fastify.post('/save-progress/' + userId, async () => ({}));

    return {
      success: true,
      currentChapter: chapter.id,
      choiceIndex,
      choiceText: choice.text,
      nextChapter: nextChapterId,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    console.error('Error in /choice:', e);
    reply.status(400).send({ error: e.message });
  }
});

// Character AI Response API
fastify.post('/ai-response', async (request, reply) => {
  const { character, context, userId } = request.body;
  
  // Simplified AI routing - in production would use aiRouter.js
  const responseMap = {
    'Elias': "As the Lead Architect, I appreciate your concern. Let's focus on the memory allocation patterns.",
    'Priya': "Your approach is innovative! The distributed consensus model can handle this challenge.",
    'Governor': "This proposal requires community consensus. Let's gather votes from all sectors."
  };

  const response = responseMap[character] || "I'm listening...";

  return {
    character,
    context: context?.summary || 'General conversation',
    response,
    timestamp: new Date().toISOString()
  };
});

// Governance Voting API
fastify.post('/governance/vote', async (request, reply) => {
  const { proposalId, optionId, userId } = request.body;
  
  // Record vote and update tally
  const narrativeData = require('./narrativeData');
  let currentTally = {};

  // Simulate governance storage
  learningTracker.getProgress(userId).governanceVotes[proposalId] = optionId;

  return { 
    success: true, 
    proposalId, 
    voteRecorded: true,
    timestamp: new Date().toISOString() 
  };
});

// WebSocket for Real-time Updates
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server: fastify.server });

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected!');
  
  // Send initial status
  ws.send(JSON.stringify({
    type: 'connect',
    timestamp: new Date().toISOString(),
    platform: 'Cognoscent Echo',
    features: ['live_chapters', 'realtime_ai', 'community_governance']
  }));

  const interval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'heartbeat',
      throughput: Math.floor(100 + Math.random() * 50),
      latency: Math.floor(20 + Math.random() * 30),
      resilience: Math.floor(70 + Math.random() * 20),
      energy: Math.floor(150 + Math.random() * 100),
      timestamp: new Date().toISOString()
    }));
  }, 2000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('🔌 WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
});

// ============== Startup ==============
const start = async () => {
  try {
    // Required environment variables check
    const requiredKeys = ['JWT_SECRET'];
    for (const key of requiredKeys) {
      if (!process.env[key]) {
        console.warn(`⚠️ Warning: ${key} not set. Using defaults.`);
      }
    }

    await fastify.listen({ port: process.env.PORT || 3001, host: '0.0.0.0' });
    console.log('🚀 🌌 Cognoscent Echo v2.0 - Interactive Novel Platform');
    console.log(`   API running on http://0.0.0.0:${process.env.PORT || 3001}`);
    console.log(`   Features: WASM Sandbox | Learning Progress | AI Characters | Governance`);
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
