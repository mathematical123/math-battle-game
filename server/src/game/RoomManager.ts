import { Room } from './Room';
import { Player } from './Player';

export class RoomManager {
    rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map();
    }

    createRoom(roomId: string): Room {
        if (this.rooms.has(roomId)) {
            return this.rooms.get(roomId)!;
        }
        const newRoom = new Room(roomId);
        this.rooms.set(roomId, newRoom);
        return newRoom;
    }

    joinRoom(roomId: string, player: Player): Room | null {
        let room = this.rooms.get(roomId);
        if (!room) {
            room = this.createRoom(roomId);
        }

        // Check if room is full or in progress
        if (room.players.size >= room.maxPlayers) {
            return null;
        }

        room.addPlayer(player);
        return room;
    }

    leaveRoom(roomId: string, playerId: string): void {
        const room = this.rooms.get(roomId);
        if (room) {
            room.removePlayer(playerId);
            if (room.players.size === 0) {
                this.rooms.delete(roomId);
            }
        }
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }
}
