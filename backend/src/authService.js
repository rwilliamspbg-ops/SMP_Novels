const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('./models');

const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) {
    throw new Error('Missing required environment variable: JWT_SECRET');
}

class AuthService {
    async register(username, email, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        return this.generateToken(user._id);
    }

    async login(username, password) {
        const user = await User.findOne({ username });
        if (!user) throw new Error('User not found');
        
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error('Invalid password');
        
        return this.generateToken(user._id);
    }

    generateToken(userId) {
        return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '7d' });
    }

    verifyToken(token) {
        try {
            return jwt.verify(token, SECRET_KEY);
        } catch (e) {
            throw new Error('Invalid token');
        }
    }
}

module.exports = new AuthService();
