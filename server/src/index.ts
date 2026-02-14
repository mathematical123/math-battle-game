import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

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
import { GameStatus, Room } from './game/Room';

const roomManager = new RoomManager();

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_room', ({ roomId, playerName }) => {
        const player = createPlayer(socket.id, playerName || `Player ${socket.id.substr(0, 4)}`);
        const room = roomManager.joinRoom(roomId, player);

        if (room) {
            socket.join(roomId);
            // Simplify payload to avoid circular references if any
            io.to(roomId).emit('room_update', {
                roomId: room.id,
                players: Array.from(room.players.values()),
                status: room.status,
                config: { maxPlayers: room.maxPlayers }
            });
            console.log(`${playerName} joined room ${roomId}`);
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
                config: { maxPlayers: room.maxPlayers }
            });

            if (room.allPlayersReady() && room.status === GameStatus.WAITING) {
                room.startGame();
                io.to(roomId).emit('game_start', {
                    currentProblem: room.currentProblem,
                    players: Array.from(room.players.values())
                });
            }
        }
    });

    socket.on('submit_answer', ({ roomId, answer }) => {
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

            if ((room as Room).status === GameStatus.FINISHED) {
                io.to(roomId).emit('game_over', {
                    winner: room.getwinner()
                });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        roomManager.rooms.forEach((room, roomId) => {
            if (room.players.has(socket.id)) {
                roomManager.leaveRoom(roomId, socket.id);
                io.to(roomId).emit('room_update', {
                    roomId: room.id,
                    players: Array.from(room.players.values()),
                    status: room.status,
                    config: { maxPlayers: room.maxPlayers }
                });
            }
        });
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
