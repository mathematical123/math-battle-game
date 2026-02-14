import { Room } from './Room';
import { Player } from './Player';

export class RoomManager {
    rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map();
    }

    createRoom(roomId: string, gameMode: '1v1' | '2v2' = '1v1', isRanked: boolean = false): Room {
        if (this.rooms.has(roomId)) {
            return this.rooms.get(roomId)!;
        }
        const newRoom = new Room(roomId, undefined, gameMode, isRanked);
        this.rooms.set(roomId, newRoom);
        return newRoom;
    }

    joinRoom(roomId: string, player: Player, gameMode?: '1v1' | '2v2', isRanked?: boolean): Room | null {
        let room = this.rooms.get(roomId);
        if (!room) {
            room = this.createRoom(roomId, gameMode, isRanked);
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
