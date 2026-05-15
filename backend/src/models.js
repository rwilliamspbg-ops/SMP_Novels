require('dotenv').config();
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    tier: { type: String, enum: ['free', 'premium', 'enterprise'], default: 'free' },
    createdAt: { type: Date, default: Date.now }
});

const SaveSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    novelId: { type: String, required: true },
    currentChapter: { type: Number, default: 1 },
    decisions: [String],
    metrics: {
        throughput: Number,
        latency: Number,
        resilience: Number,
        energy: Number
    },
    governanceVotes: { type: Map, of: String },
    updatedAt: { type: Date, default: Date.now }
});

const NovelSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: Map, of: mongoose.Schema.Types.Mixed }, // Chapters map
    metadata: { type: Map, of: String }
});

module.exports = {
    User: mongoose.model('User', UserSchema),
    Save: mongoose.model('Save', SaveSchema),
    Novel: mongoose.model('Novel', NovelSchema)
};
