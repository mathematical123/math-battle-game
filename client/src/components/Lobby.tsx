import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const Lobby = () => {
    const [name, setName] = useState('');
    const [roomId, setRoomId] = useState('');
    const joinRoom = useGameStore(state => state.joinRoom);

    const handleJoin = () => {
        if (name && roomId) {
            joinRoom(roomId, name);
        }
    };

    return (
        <div className="lobby-container">
            <h1>Math Battle</h1>
            <div className="form-group">
                <label>Player Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                />
            </div>
            <div className="form-group">
                <label>Room ID</label>
                <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter Room Code"
                />
            </div>
            <button onClick={handleJoin} disabled={!name || !roomId}>
                Join Battle
            </button>
        </div>
    );
};
