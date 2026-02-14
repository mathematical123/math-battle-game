import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { connectDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import rankedRoutes from './routes/rankedRoutes';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'Server is running!',
        message: 'Math Battle Game Server',
        socketPath: '/socket.io'
    });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/ranked', rankedRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // TODO: Restrict in production
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

import { RoomManager } from './game/RoomManager';
import { createPlayer } from './game/Player';
import { GameStatus } from './game/Room';
import { calculateRRChange, updateUserRating } from './game/rankingSystem';
import { Match } from './models/Match';

const roomManager = new RoomManager();

// Socket ID to User ID mapping
const socketToUser = new Map<string, string>();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Authentication handshake (optional)
    socket.on('authenticate', async ({ token }) => {
        if (token) {
            try {
                const secret = process.env.JWT_SECRET || 'fallback-secret-key';
                const decoded = jwt.verify(token, secret) as { userId: string };
                socketToUser.set(socket.id, decoded.userId);
                console.log(`User ${decoded.userId} authenticated on socket ${socket.id}`);
            } catch (error) {
                console.error('Token verification failed:', error);
            }
        }
    });

    socket.on('join_room', ({ roomId, playerName, gameMode, isRanked }) => {
        const userId = socketToUser.get(socket.id);

        // Prevent unauthenticated users from joining ranked
        if (isRanked && !userId) {
            socket.emit('error', 'You must be logged in to play ranked');
            return;
        }

        const player = createPlayer(socket.id, playerName || `Player ${socket.id.substr(0, 4)}`, userId);
        const room = roomManager.joinRoom(roomId, player, gameMode || '1v1', isRanked || false);

        if (room) {
            socket.join(roomId);
            io.to(roomId).emit('room_update', {
                roomId: room.id,
                players: Array.from(room.players.values()),
                status: room.status,
                gameMode: room.gameMode,
                isRanked: room.isRanked,
                config: { maxPlayers: room.maxPlayers }
            });
            console.log(`${playerName} joined room ${roomId} (${room.gameMode}, ranked: ${room.isRanked})`);
        } else {
            socket.emit('error', 'Room is full or unavailable');
        }
    });

    socket.on('player_ready', ({ roomId, isReady }) => {
        const room = roomManager.getRoom(roomId);
        if (room) {
            room.setReady(socket.id, isReady);
            io.to(roomId).emit('room_update', {
                roomId: room.id,
                players: Array.from(room.players.values()),
                status: room.status,
                gameMode: room.gameMode,
                isRanked: room.isRanked,
                config: { maxPlayers: room.maxPlayers }
            });

            if (room.allPlayersReady() && room.status === GameStatus.WAITING) {
                room.startGame();
                io.to(roomId).emit('game_start', {
                    currentProblem: room.currentProblem,
                    players: Array.from(room.players.values()),
                    gameMode: room.gameMode
                });
            }
        }
    });

    socket.on('submit_answer', async ({ roomId, answer }) => {
        const room = roomManager.getRoom(roomId);
        if (room && room.status === GameStatus.PLAYING) {
            const result = room.handleAnswer(socket.id, parseFloat(answer));

            io.to(roomId).emit('game_update', {
                players: Array.from(room.players.values()),
                currentProblem: room.currentProblem,
                lastAction: {
                    playerId: socket.id,
                    result
                }
            });

            if (room.status === GameStatus.FINISHED) {
                const winners = room.getwinner();
                const duration = room.startTime ? Math.floor((Date.now() - room.startTime) / 1000) : 0;

                // Handle ranked rating updates
                if (room.isRanked && winners) {
                    try {
                        const playersArray = Array.from(room.players.values());
                        const winnersArray = Array.isArray(winners) ? winners : [winners];
                        const losersArray = playersArray.filter(p => !winnersArray.includes(p));

                        // For ranked, calculate and update RR
                        if (room.gameMode === '1v1' && winnersArray.length === 1 && losersArray.length === 1) {
                            const winner = winnersArray[0];
                            const loser = losersArray[0];

                            if (winner.userId && loser.userId) {
                                const { User } = await import('./models/User');
                                const winnerUser = await User.findById(winner.userId);
                                const loserUser = await User.findById(loser.userId);

                                if (winnerUser && loserUser) {
                                    const { winnerChange, loserChange } = calculateRRChange(winnerUser.rr, loserUser.rr);
                                    await updateUserRating(winner.userId, winnerChange, true);
                                    await updateUserRating(loser.userId, loserChange, false);

                                    // Save match
                                    const match = new Match({
                                        gameMode: room.gameMode,
                                        isRanked: true,
                                        winners: [winner.userId],
                                        losers: [loser.userId],
                                        finalScores: playersArray.map(p => ({
                                            userId: p.userId || p.id,
                                            score: p.score,
                                            hp: p.hp
                                        })),
                                        duration
                                    });
                                    await match.save();

                                    // Emit rating changes
                                    io.to(roomId).emit('game_over', {
                                        winner: winnersArray,
                                        ratingChanges: {
                                            [winner.userId]: winnerChange,
                                            [loser.userId]: loserChange
                                        }
                                    });
                                    return;
                                }
                            }
                        }
                        // TODO: Implement 2v2 ranked rating updates
                    } catch (error) {
                        console.error('Error updating rankings:', error);
                    }
                }

                // Non-ranked or fallback
                io.to(roomId).emit('game_over', {
                    winner: winners
                });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        socketToUser.delete(socket.id);

        roomManager.rooms.forEach((room, roomId) => {
            if (room.players.has(socket.id)) {
                roomManager.leaveRoom(roomId, socket.id);
                io.to(roomId).emit('room_update', {
                    roomId: room.id,
                    players: Array.from(room.players.values()),
                    status: room.status,
                    gameMode: room.gameMode,
                    isRanked: room.isRanked,
                    config: { maxPlayers: room.maxPlayers }
                });
            }
        });
    });
});

// Connect to database and start server
connectDatabase().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
