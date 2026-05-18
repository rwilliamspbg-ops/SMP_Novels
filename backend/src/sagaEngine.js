/**
 * Saga Engine - MongoDB Persistence Layer for Interactive Novel Platform
 * Connects user progress and narrative state to MongoDB for durability
 */

const mongoose = require('mongoose');

// Configuration
const MONGO_CONFIG = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/interactive_novel',
  options: {
    maxPoolSize: 5,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  }
};

// Chapter Schema
const chapterSchema = new mongoose.Schema({
  chapterId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
  choices: [{
    index: Number,
    text: String,
    nextChapter: String
  }],
  educationalContext: {
    skillsRelevant: [String],
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
    timeEstimate: String
  },
  epilogue: { type: Boolean, default: false },
  version: { type: Number, default: 1 }
}, { timestamps: true });

// User Progress Schema  
const userProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  currentChapter: { type: Number, default: 1 },
  totalChaptersCompleted: { type: Number, default: 0 },
  chapterProgress: [{
    chapterId: String,
    completed: Boolean,
    completedAt: Date
  }],
  skillsLearned: [{ name: String, difficulty: String, masteredAt: Date }],
  governanceVotes: { type: Map, of: Number },
  lastActiveAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Initialize Mongoose models
async function initializeModels() {
  const Chapter = mongoose.model('Chapter', chapterSchema);
  const UserProgress = mongoose.model('UserProgress', userProgressSchema);
  return { Chapter, UserProgress };
}

// Saga Engine - Orchestrates data consistency across distributed operations
class SagaEngine {
  constructor(Chapter, UserProgress) {
    this.Chapter = Chapter;
    this.UserProgress = UserProgress;
    this.sagaHistory = [];
  }

  /**
   * Save chapter update with saga pattern
   * Ensures atomic operations and rollback capability
   */
  async updateChapter(chapterId, updates) {
    try {
      const oldVersion = await this.Chapter.findOne({ chapterId });
      
      // Create saga transaction
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        if (updates.$set) {
          const updated = await this.Chapter.updateOne(
            { chapterId },
            updates,
            { session }
          );

          // Log saga for audit trail
          this.sagaHistory.push({
            type: 'UPDATE',
            entity: 'Chapter',
            id: chapterId,
            timestamp: new Date(),
            details: { oldVersion, updatedCount: updated.modifiedCount }
          });

          await session.commitTransaction();
          
          return { success: true, message: `Chapter ${chapterId} updated successfully` };
        } else if (updates.$clear) {
          const updated = await this.Chapter.deleteOne(
            { chapterId },
            { session }
          );
          
          this.sagaHistory.push({
            type: 'DELETE',
            entity: 'Chapter',
            id: chapterId,
            timestamp: new Date(),
            details: { deletedCount: updated.deletedCount }
          });

          await session.commitTransaction();
          return { success: true, message: `Chapter ${chapterId} deleted successfully` };
        } else {
          throw new Error('Invalid update operation');
        }
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error('Saga engine update failed:', error);
      throw error;
    }
  }

  /**
   * Save user progress atomically
   */
  async saveProgress(userId, progressData) {
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const existing = await this.UserProgress.findOne({ userId });
        
        if (existing) {
          // Update existing progress
          const updated = await this.UserProgress.findOneAndUpdate(
            { userId },
            { $set: progressData, $inc: { totalChaptersCompleted: progressData.incrementTotal || 0 } },
            { new: true, session }
          );
          
          this.sagaHistory.push({
            type: 'UPDATE',
            entity: 'UserProgress',
            id: userId,
            timestamp: new Date()
          });

          await session.commitTransaction();
          return updated;
        } else {
          // Create new progress record
          const created = await this.UserProgress.create([{
            ...progressData,
            userId
          }], { session });

          this.sagaHistory.push({
            type: 'CREATE',
            entity: 'UserProgress',
            id: userId,
            timestamp: new Date()
          });

          await session.commitTransaction();
          return created[0];
        }
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error('Saga engine progress save failed:', error);
      throw error;
    }
  }

  /**
   * Get saga history for auditing
   */
  getHistory() {
    return this.sagaHistory;
  }

  /**
   * Clear saga history (useful after processing)
   */
  clearHistory() {
    this.sagaHistory = [];
  }
}

/**
 * Database Seeder - Initializes MongoDB with default data
 */
class DatabaseSeeder {
  constructor(Chapter, UserProgress) {
    this.Chapter = Chapter;
    this.UserProgress = UserProgress;
  }

  async seedChapters(narrativeData) {
    const chapters = [];
    
    // Seed chapters from narrative data
    Object.values(narrativeData.chapters).forEach(chapter => {
      chapters.push({
        chapterId: String(chapter.id),
        title: chapter.title,
        text: chapter.text,
        choices: chapter.choices || [],
        educationalContext: {
          skillsRelevant: chapter.learningOutcomes || [],
          difficulty: 'Intermediate',
          timeEstimate: `${Math.round(chapter.duration / 1000)} minutes`
        },
        epilogue: chapter.title.toLowerCase().includes('epilogue'),
        createdAt: new Date()
      });
    });

    // Insert in transaction to ensure consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await this.Chapter.insertMany(chapters, { session });
      await session.commitTransaction();
      return { success: true, count: chapters.length };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async seedDemoUser() {
    const demoProgress = await this.UserProgress.create([{
      userId: 'demo_user_001',
      currentChapter: 1,
      totalChaptersCompleted: 0,
      skillsLearned: [],
      governanceVotes: new Map(),
      lastActiveAt: new Date()
    }]);

    return demoProgress[0];
  }
}

// Main initialization function
async function initializePersistence() {
  try {
    console.log('🌌 Initializing MongoDB persistence layer...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGO_CONFIG.uri, MONGO_CONFIG.options);
    console.log('✅ Connected to MongoDB successfully');
    
    // Initialize models
    const { Chapter, UserProgress } = await initializeModels();
    
    // Create saga engine instance
    const sagaEngine = new SagaEngine(Chapter, UserProgress);
    
    // Check if chapters collection is empty
    const chapterCount = await Chapter.countDocuments();
    
    if (chapterCount === 0) {
      console.log('📚 Seed: Chapters collection is empty');
      
      // Require narrative data from adjacent file
      const narrativeData = require('./narrativeData');
      
      // Create seeder
      const seeder = new DatabaseSeeder(Chapter, UserProgress);
      
      // Seed chapters
      await seeder.seedChapters(narrativeData);
      console.log('✅ Chapters seeded successfully');
    } else {
      console.log(`📚 Chapters already exist (${chapterCount} chapters)`);
    }
    
    // Check for demo user (optional)
    const demoUser = await UserProgress.findOne({ userId: 'demo_user_001' });
    if (!demoUser) {
      const seeder = new DatabaseSeeder(Chapter, UserProgress);
      await seeder.seedDemoUser();
      console.log('✅ Demo user created');
    }
    
    // Create saga engine instance with models for later use
    return { 
      Chapter, 
      UserProgress, 
      sagaEngine,
      connection: mongoose.connection
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize persistence layer:', error.message);
    if (error.message.includes('eauth')) {
      console.log('   Hint: Check MONGODB_URI in .env for valid credentials');
    } else if (error.message.includes('ERELA')) {
      console.log('   Hint: MongoDB service may not be reachable');
    }
    throw error;
  }
}

// Export saga engine and initialization function
module.exports = {
  initializePersistence,
  SagaEngine,
  DatabaseSeeder,
  initializeModels
};
