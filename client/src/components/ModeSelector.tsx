import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import './ModeSelector.css';

export const ModeSelector = () => {
    const {
        gameMode,
        setMode,
        setRoomId,
        joinRoom,
        setShowModeSelector,
        user,
        isGuest
    } = useGameStore();

    const [selectedMode, setSelectedMode] = useState<'1v1' | '2v2'>('1v1');
    const [roomInput, setRoomInput] = useState('');
    const isRanked = gameMode === 'ranked';

    const handleCreateRoom = () => {
        const randomRoomId = Math.random().toString(36).substr(2, 8);
        joinRoom(randomRoomId, user?.username || 'Guest', selectedMode, isRanked);
    };

    const handleJoinRoom = () => {
        if (roomInput.trim()) {
            joinRoom(roomInput, user?.username || 'Guest', selectedMode, isRanked);
        }
    };

    const handleBack = () => {
        setShowModeSelector(false);
    };

    return (
        <div className="mode-selector">
            <div className="selector-card">
                <button onClick={handleBack} className="back-btn">← Back</button>

                <h2>{isRanked ? '🏆 Ranked Match' : '🎮 Casual Match'}</h2>

                <div className="mode-options">
                    <button
                        className={`mode-btn ${selectedMode === '1v1' ? 'active' : ''}`}
                        onClick={() => setSelectedMode('1v1')}
                    >
                        <span className="mode-icon">⚔️</span>
                        <span className="mode-name">1v1</span>
                        <span className="mode-desc">Head-to-head battle</span>
                    </button>

                    <button
                        className={`mode-btn ${selectedMode === '2v2' ? 'active' : ''}`}
                        onClick={() => setSelectedMode('2v2')}
                    >
                        <span className="mode-icon">👥</span>
                        <span className="mode-name">2v2</span>
                        <span className="mode-desc">Team battle</span>
                    </button>
                </div>

                {isRanked ? (
                    <div className="ranked-section">
                        <button onClick={handleCreateRoom} className="find-match-btn">
                            Find Ranked Match
                        </button>
                        <p className="ranked-info">You'll be matched with players near your rank</p>
                    </div>
                ) : (
                    <div className="casual-section">
                        <button onClick={handleCreateRoom} className="create-room-btn">
                            Create Room
                        </button>

                        <div className="divider">or</div>

                        <div className="join-section">
                            <input
                                type="text"
                                value={roomInput}
                                onChange={(e) => setRoomInput(e.target.value)}
                                placeholder="Enter room code"
                            />
                            <button
                                onClick={handleJoinRoom}
                                disabled={!roomInput.trim()}
                                className="join-room-btn"
                            >
                                Join Room
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
