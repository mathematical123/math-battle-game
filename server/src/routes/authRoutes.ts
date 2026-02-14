import express, { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router: Router = express.Router();

// Register new user
router.post('/register', async (req, res: Response) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password required' });
            return;
        }

        if (username.length < 3 || username.length > 20) {
            res.status(400).json({ error: 'Username must be 3-20 characters' });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            res.status(409).json({ error: 'Username already taken' });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();

        // Generate token
        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                rank: newUser.rank,
                rr: newUser.rr,
                wins: newUser.wins,
                losses: newUser.losses
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login
router.post('/login', async (req, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ error: 'Username and password required' });
            return;
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                rank: user.rank,
                rr: user.rr,
                wins: user.wins,
                losses: user.losses
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            id: user._id,
            username: user.username,
            rank: user.rank,
            rr: user.rr,
            wins: user.wins,
            losses: user.losses
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
