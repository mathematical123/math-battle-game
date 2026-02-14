import express, { Router, Response } from 'express';
import { User } from '../models/User';
import { Match } from '../models/Match';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router: Router = express.Router();

// Get leaderboard (top 100 players)
router.get('/leaderboard', async (req, res: Response) => {
    try {
        const topPlayers = await User.find()
            .select('username rank rr wins losses')
            .sort({ rr: -1 })
            .limit(100);

        res.json(topPlayers);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user stats
router.get('/stats/:userId', async (req, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('username rank rr wins losses createdAt');
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Get recent matches
        const recentMatches = await Match.find({
            $or: [
                { winners: userId },
                { losers: userId }
            ]
        })
            .sort({ playedAt: -1 })
            .limit(10)
            .select('gameMode isRanked winners losers playedAt');

        res.json({
            user,
            recentMatches
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
