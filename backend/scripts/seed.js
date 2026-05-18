/**
 * Seed Script for Interactive Novel Platform
 * Creates initial novel records and default configurations
 * Run with: node scripts/seed.js
 */

require('dotenv').config();

const mongoose = require('mongoose');

// Connection configuration
const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/interactive_novel',
  options: {
    maxPoolSize: 5,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  }
};

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    console.log('🌌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    console.log('✅ Connected to MongoDB successfully');
    
    return mongoose;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    if (error.message.includes('eauth')) {
      console.log('   Hint: Ensure MONGODB_URI has valid credentials');
    } else if (error.message.includes('ERELA')) {
      console.log('   Hint: Check that MongoDB is accessible at the specified host');
    }
    throw error;
  }
}

// Schema for Novel Chapter
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
  epilogue: { type: Boolean, default: false }
}, { timestamps: true });

// Schema for User Progress
const userProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  currentChapter: Number,
  totalChaptersCompleted: { type: Number, default: 0 },
  chapterProgress: [{
    chapterId: String,
    completed: Boolean,
    completedAt: Date
  }],
  skillsLearned: [{ name: String, difficulty: String, masteredAt: Date }],
  governanceVotes: { type: Map, of: Number }
}, { timestamps: true });

// Chapter Seed Data (default content if not exists)
async function seedChapters() {
  console.log('📚 Seeding chapters...');
  
  const Chapter = mongoose.model('Chapter', chapterSchema);
  
  // Check if chapters collection is empty
  const existingCount = await Chapter.countDocuments();
  
  if (existingCount > 0) {
    console.log(`   Chapters already exist (${existingCount}), skipping seed`);
    return;
  }
  
  // Seed default chapter structure
  const initialChapters = [
    {
      chapterId: 'chapter_1',
      title: 'The Cognitive Echo Awakens',
      text: 'In the quiet corners of memory storage systems, an anomaly has been detected. The distributed ledger shows signs of intelligent processing patterns that defy conventional explanation...',
      choices: [
        { index: 0, text: 'Investigate the memory allocation anomaly', nextChapter: 'chapter_2a' },
        { index: 1, text: 'Consult with the distributed governance committee', nextChapter: 'chapter_2b' }
      ],
      educationalContext: {
        skillsRelevant: ['Memory Management', 'Distributed Systems'],
        difficulty: 'Intermediate',
        timeEstimate: '5 minutes reading'
      }
    },
    {
      chapterId: 'chapter_2a',
      title: 'The Memory Walker Investigates',
      text: 'Deep within the zero-copy memory regions, strange patterns emerge that suggest autonomous decision-making...',
      choices: [
        { index: 0, text: 'Trace the anomalous processes back to origin', nextChapter: 'chapter_3a' },
        { index: 1, text: 'Deploy diagnostic probes into affected partitions', nextChapter: 'chapter_3b' }
      ]
    }
  ];
  
  for (const chapter of initialChapters) {
    const created = await Chapter.create(chapter);
    console.log(`   Created ${created.title} (${created._id})`);
  }
  
  console.log('✅ Chapters seeded successfully');
}

// User Progress Seed
async function seedUsers() {
  console.log('👥 Seeding user progress records...');
  
  const UserProgress = mongoose.model('UserProgress', userProgressSchema);
  
  // Create a demo user with initial progress
  const demoUser = await UserProgress.create({
    userId: 'demo_user_001',
    currentChapter: 1,
    totalChaptersCompleted: 0,
    skillsLearned: []
  });
  
  console.log(`   Created demo user: ${demoUser.userId}`);
}

// Governance Configuration Seed
async function seedGovernance() {
  console.log('⚖️ Seeding governance configurations...');
  
  // This would typically be stored in a config collection
  const governanceConfig = {
    bftThresholdPct: 55.5,
    defaultBlockSizeBytes: 2000,
    enabledFeatures: ['code_review', 'voting', 'proposal_system'],
    monitoringEnabled: true
  };
  
  console.log('   Governance configuration initialized');
  console.log(`   BFT Threshold: ${governanceConfig.bftThresholdPct}%`);
}

// Main seed function
async function seedAll() {
  try {
    const db = await connectToMongoDB();
    
    console.log('\n🌌 Starting seed process...\n');
    
    // Seed chapters (only if empty)
    await seedChapters();
    
    // Seed demo user progress
    await seedUsers();
    
    // Initialize governance configs
    await seedGovernance();
    
    console.log('\n✅ Seed process completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify MongoDB connection string in .env');
    console.log('   2. Update chapter content via admin endpoints');
    console.log('   3. Wire persistence layer to main application flow');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed process failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  - Ensure MongoDB is running and accessible');
    console.log('  - Check MONGODB_URI in .env file');
    console.log('  - Verify network connectivity to database');
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Export for use as module
module.exports = { seedAll, connectToMongoDB };

// Run if executed directly
if (require.main === module) {
  seedAll();
}
