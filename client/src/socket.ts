import { io, Socket } from 'socket.io-client';

// Auto-detect production URL or localhost
const URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.PROD ? undefined : 'http://localhost:3001');

export const socket: Socket = io(URL, {
    autoConnect: false
});
