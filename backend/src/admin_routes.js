/**
 * Admin Content Management Routes
 * Handles narrative content updates and chapter management
 */

const fastify = require('fastify')({ logger: { level: 'debug' } });
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Required JWT verification
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Update narrative content (admin endpoint)
 * POST /content/update
 */
fastify.post('/content/update', async (request, reply) => {
  // Verify admin authentication
  const authHeader = request.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ 
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header' 
    });
  }

  const token = authHeader.substring(7);
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid token' });
  }

  // Check admin role (simplified - in production use proper RBAC)
  if (decoded.role !== 'admin') {
    return reply.status(403).send({ 
      error: 'Forbidden', 
      message: 'Admin privileges required' 
    });
  }

  const { chapterId, content, options = [] } = request.body;

  // Validate input
  if (!chapterId || typeof chapterId !== 'string') {
    return reply.status(400).send({ 
      error: 'Bad Request',
      message: 'chapterId is required and must be a string' 
    });
  }

  if (!content || typeof content !== 'string') {
    return reply.status(400).send({ 
      error: 'Bad Request',
      message: 'content is required and must be a string' 
    });
  }

  // Validate options structure
  if (options && !Array.isArray(options)) {
    return reply.status(400).send({ 
      error: 'Bad Request',
      message: 'options must be an array' 
    });
  }

  // Update narrative data in memory (persistence layer would use MongoDB here)
  const narrativeData = require('./narrativeData');
  
  // Create or update chapter
  if (!narrativeData.chapters[chapterId]) {
    // New chapter being created
    narrativeData.chapters[chapterId] = {
      id: chapterId,
      title: content.split('\n')[0] || `Chapter ${chapterId}`,
      text: content,
      choices: options?.map((opt, idx) => ({
        index: idx,
        text: opt.text || `Option ${idx + 1}`,
        nextChapter: option?.nextChapter || 'chapter_2'
      })) || []
    };

    return reply.status(201).send({
      success: true,
      message: `Chapter ${chapterId} created successfully`,
      chapter: narrativeData.chapters[chapterId]
    });
  } else {
    // Updating existing chapter
    const oldChapter = narrativeData.chapters[chapterId];
    
    narrativeData.chapters[chapterId] = {
      ...oldChapter,
      title: content.split('\n')[0] || oldChapter.title,
      text: content,
      choices: options?.map((opt, idx) => ({
        index: idx,
        text: opt.text || `Option ${idx + 1}`,
        nextChapter: opt.nextChapter || oldChapter.choices[idx]?.nextChapter
      })) || []
    };

    return reply.status(200).send({
      success: true,
      message: `Chapter ${chapterId} updated successfully`,
      previousVersion: {
        title: oldChapter.title,
        textLength: oldChapter.text.length
      },
      chapter: narrativeData.chapters[chapterId]
    });
  }
});

/**
 * List all chapters (admin endpoint)
 * GET /content/list
 */
fastify.get('/content/list', async (request, reply) => {
  // Verify admin authentication
  const authHeader = request.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ 
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header' 
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    
    if (decoded.role !== 'admin') {
      return reply.status(403).send({ 
        error: 'Forbidden', 
        message: 'Admin privileges required' 
      });
    }

    const chapters = narrativeData.chapters;
    const chapterList = Object.values(chapters).map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      textLength: chapter.text.length,
      choiceCount: chapter.choices?.length || 0,
      hasEpilogue: !!chapter.epilogue,
      createdAt: chapter.createdAt || new Date().toISOString()
    }));

    return reply.send({
      success: true,
      count: chapterList.length,
      chapters: chapterList
    });
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized', message: err.message });
  }
});

/**
 * Delete a chapter (admin endpoint - careful with this!)
 * DELETE /content/delete/:chapterId
 */
fastify.delete('/content/delete/:chapterId', async (request, reply) => {
  // Verify admin authentication
  const authHeader = request.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ 
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header' 
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    
    if (decoded.role !== 'admin') {
      return reply.status(403).send({ 
        error: 'Forbidden', 
        message: 'Admin privileges required' 
      });
    }

    const chapterId = request.params.chapterId;
    const narrativeData = require('./narrativeData');

    if (!narrativeData.chapters[chapterId]) {
      return reply.status(404).send({ 
        error: 'Not Found',
        message: `Chapter ${chapterId} not found` 
      });
    }

    // Delete chapter from memory
    delete narrativeData.chapters[chapterId];

    return reply.status(200).send({
      success: true,
      message: `Chapter ${chapterId} deleted successfully`,
      chapterId: chapterId
    });
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized', message: err.message });
  }
});

module.exports = fastify;
