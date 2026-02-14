import { create } from 'zustand';
import { socket } from '../socket';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export interface Player {
    id: string;
    userId?: string;
    name: string;
    score: number;
    hp: number;
    maxHp: number;
    streak: number;
    isReady: boolean;
    teamId?: 1 | 2;
}

export interface MathProblem {
    question: string;
    answer: number;
    difficulty: string;
}

export interface User {
    id: string;
    username: string;
    rank: string;
    rr: number;
    wins: number;
    losses: number;
}

interface GameState {
    // Auth state
    user: User | null;
    isGuest: boolean;
    token: string | null;

    // Connection state
    isConnected: boolean;

    // Game state
    roomId: string | null;
    playerId: string | null;
    players: Player[];
    status: 'WAITING' | 'PLAYING' | 'FINISHED';
    currentProblem: MathProblem | null;
    winner: Player | Player[] | null;
    gameMode: 'casual' | 'ranked';
    selectedGameType: '1v1' | '2v2';
    isRanked: boolean;
    showModeSelector: boolean;
    ratingChanges: Record<string, number> | null;

    // Auth actions
    login: (username: string, password: string) => Promise<boolean>;
    register: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    setGuest: () => void;
    loadAuthFromStorage: () => void;

    // Game actions
    connect: () => void;
    joinRoom: (roomId: string, playerName: string, gameType?: '1v1' | '2v2', isRanked?: boolean) => void;
    setReady: (isReady: boolean) => void;
    submitAnswer: (answer: string) => void;
    setMode: (mode: 'casual' | 'ranked') => void;
    setGameMode: (mode: 'casual' | 'ranked') => void;
    setShowModeSelector: (show: boolean) => void;
    leaveRoom: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    // Initial auth state
    user: null,
    isGuest: false,
    token: null,

    // Initial connection state
    isConnected: false,

    // Initial game state
    roomId: null,
    playerId: null,
    players: [],
    status: 'WAITING',
    currentProblem: null,
    winner: null,
    gameMode: 'casual',
    selectedGameType: '1v1',
    isRanked: false,
    showModeSelector: false,
    ratingChanges: null,

    // Auth actions
    login: async (username, password) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                set({
                    user: data.user,
                    token: data.token,
                    isGuest: false
                });
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Authenticate socket
                if (socket.connected) {
                    socket.emit('authenticate', { token: data.token });
                }

                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    },

    register: async (username, password) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                set({
                    user: data.user,
                    token: data.token,
                    isGuest: false
                });
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Authenticate socket
                if (socket.connected) {
                    socket.emit('authenticate', { token: data.token });
                }

                return true;
            }
            return false;
        } catch (error) {
            console.error('Register error:', error);
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        socket.disconnect();
        set({
            user: null,
            token: null,
            isGuest: false,
            roomId: null,
            players: [],
            status: 'WAITING',
            isConnected: false
        });
    },

    setGuest: () => {
        set({ isGuest: true });
    },

    loadAuthFromStorage: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                set({ user, token, isGuest: false });
            } catch (error) {
                console.error('Error loading auth:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    },

    // Game actions
    connect: () => {
        const { token } = get();
        socket.connect();

        socket.on('connect', () => {
            set({ isConnected: true, playerId: socket.id });

            // Authenticate if token exists
            if (token) {
                socket.emit('authenticate', { token });
            }
        });

        socket.on('disconnect', () => {
            set({ isConnected: false });
        });

        socket.on('room_update', (data) => {
            set({
                roomId: data.roomId,
                players: data.players,
                status: data.status,
                isRanked: data.isRanked || false
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
        });

        socket.on('game_over', (data) => {
            set({
                status: 'FINISHED',
                winner: data.winner,
                ratingChanges: data.ratingChanges || null
            });
        });

        socket.on('error', (msg) => {
            console.error("Socket error:", msg);
            alert(msg); // Simple error handling
        });
    },

    joinRoom: (roomId, playerName, gameType = '1v1', isRanked = false) => {
        socket.emit('join_room', {
            roomId,
            playerName,
            gameMode: gameType,
            isRanked
        });
        set({
            selectedGameType: gameType,
            isRanked,
            showModeSelector: false
        });
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
    },

    setMode: (mode) => {
        set({ gameMode: mode });
    },

    setGameMode: (mode) => {
        set({ gameMode: mode });
    },

    setShowModeSelector: (show) => {
        set({ showModeSelector: show });
    },

    leaveRoom: () => {
        const { roomId } = get();
        if (roomId) {
            socket.emit('leave_room', { roomId });
            set({
                roomId: null,
                players: [],
                status: 'WAITING',
                currentProblem: null,
                winner: null,
                ratingChanges: null
            });
        }
    }
}));
