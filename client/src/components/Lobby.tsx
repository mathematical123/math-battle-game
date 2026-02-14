import { useGameStore } from '../store/gameStore';
import './Lobby.css';

export const Lobby = () => {
    const { players, setReady, playerId, selectedGameType, isRanked } = useGameStore();

    const currentPlayer = players.find(p => p.id === playerId);
    const isCurrentPlayerReady = currentPlayer?.isReady || false;

    // Group players by team for 2v2
    const team1Players = selectedGameType === '2v2'
        ? players.filter(p => p.teamId === 1)
        : [];
    const team2Players = selectedGameType === '2v2'
        ? players.filter(p => p.teamId === 2)
        : [];

    return (
        <div className="lobby-container">
            <div className="lobby-header">
                <h1>{isRanked ? '🏆 Ranked Match' : '🎮 Casual Match'}</h1>
                <div className="mode-badge">{selectedGameType}</div>
            </div>

            {selectedGameType === '1v1' ? (
                <div className="players-list">
                    {players.map(player => (
                        <div key={player.id} className={`player-card ${player.isReady ? 'ready' : ''}`}>
                            <span className="player-name">{player.name}</span>
                            {player.isReady && <span className="ready-badge">✓ Ready</span>}
                        </div>
                    ))}
                    {players.length < 2 && (
                        <div className="player-card empty">
                            <span>Waiting for opponent...</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="teams-container">
                    <div className="team team-1">
                        <h3>Team 1</h3>
                        {team1Players.map(player => (
                            <div key={player.id} className={`player-card ${player.isReady ? 'ready' : ''}`}>
                                <span className="player-name">{player.name}</span>
                                {player.isReady && <span className="ready-badge">✓</span>}
                            </div>
                        ))}
                        {team1Players.length < 2 && (
                            <div className="player-card empty">Waiting...</div>
                        )}
                    </div>

                    <div className="team team-2">
                        <h3>Team 2</h3>
                        {team2Players.map(player => (
                            <div key={player.id} className={`player-card ${player.isReady ? 'ready' : ''}`}>
                                <span className="player-name">{player.name}</span>
                                {player.isReady && <span className="ready-badge">✓</span>}
                            </div>
                        ))}
                        {team2Players.length < 2 && (
                            <div className="player-card empty">Waiting...</div>
                        )}
                    </div>
                </div>
            )}

            <button
                onClick={() => setReady(!isCurrentPlayerReady)}
                className={`ready-btn ${isCurrentPlayerReady ? 'unready' : ''}`}
            >
                {isCurrentPlayerReady ? 'Not Ready' : 'Ready'}
            </button>
        </div>
    );
};
