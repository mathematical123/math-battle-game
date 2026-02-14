import { create } from 'zustand';
import { socket } from '../socket';

export interface Player {
    id: string;
    name: string;
    score: number;
    hp: number;
    maxHp: number;
    streak: number;
    isReady: boolean;
}

export interface MathProblem {
    question: string;
    answer: number;
    difficulty: string; // Using string to avoid enum sharing issues for now
}

interface GameState {
    isConnected: boolean;
    roomId: string | null;
    playerId: string | null;
    players: Player[];
    status: 'WAITING' | 'PLAYING' | 'FINISHED';
    currentProblem: MathProblem | null;
    winner: Player | null;

    // Actions
    connect: () => void;
    joinRoom: (roomId: string, playerName: string) => void;
    setReady: (isReady: boolean) => void;
    submitAnswer: (answer: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    isConnected: false,
    roomId: null,
    playerId: null,
    players: [],
    status: 'WAITING',
    currentProblem: null,
    winner: null,

    connect: () => {
        socket.connect();

        socket.on('connect', () => {
            set({ isConnected: true, playerId: socket.id });
        });

        socket.on('disconnect', () => {
            set({ isConnected: false });
        });

        socket.on('room_update', (data) => {
            set({
                roomId: data.roomId,
                players: data.players,
                status: data.status
            });
        });

        socket.on('game_start', (data) => {
            set({
                status: 'PLAYING',
                currentProblem: data.currentProblem,
                players: data.players
            });
        });

        socket.on('game_update', (data) => {
            set({
                players: data.players,
                currentProblem: data.currentProblem
            });
            // Could handle lastAction for effects here
        });

        socket.on('game_over', (data) => {
            set({ status: 'FINISHED', winner: data.winner });
        });

        socket.on('error', (msg) => {
            console.error("Socket error:", msg);
        });
    },

    joinRoom: (roomId, playerName) => {
        socket.emit('join_room', { roomId, playerName });
    },

    setReady: (isReady) => {
        const { roomId } = get();
        if (roomId) {
            socket.emit('player_ready', { roomId, isReady });
        }
    },

    submitAnswer: (answer) => {
        const { roomId } = get();
        if (roomId) {
            socket.emit('submit_answer', { roomId, answer });
        }
    }
}));
