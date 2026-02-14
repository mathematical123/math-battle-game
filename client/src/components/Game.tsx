import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export const Game = () => {
    const {
        players,
        currentProblem,
        playerId,
        submitAnswer,
        status,
        winner,
        selectedGameType,
        isRanked,
        ratingChanges,
        leaveRoom
    } = useGameStore();

    const [answer, setAnswer] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const me = players.find(p => p.id === playerId);
    const myTeamId = me?.teamId;

    // Get teammates and opponents
    const teammates = selectedGameType === '2v2'
        ? players.filter(p => p.teamId === myTeamId && p.id !== playerId)
        : [];
    const opponents = selectedGameType === '2v2'
        ? players.filter(p => p.teamId !== myTeamId)
        : players.filter(p => p.id !== playerId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!answer) return;
        submitAnswer(answer);
        setAnswer('');
        inputRef.current?.focus();
    };

    useEffect(() => {
        inputRef.current?.focus();
    }, [currentProblem]);

    if (status === 'FINISHED') {
        const winnersArray = Array.isArray(winner) ? winner : [winner];
        const isWinner = winnersArray.some(w => w?.id === playerId);
        const myRatingChange = me?.userId && ratingChanges ? ratingChanges[me.userId] : null;

        return (
            <div className="game-over">
                <h1>{isWinner ? '🎉 Victory!' : '😞 Defeat'}</h1>
                {selectedGameType === '2v2' ? (
                    <div>
                        <h2>Winners: {winnersArray.map(w => w?.name).join(', ')}</h2>
                    </div>
                ) : (
                    <h2>Winner: {winner?.name}</h2>
                )}

                {isRanked && myRatingChange !== null && (
                    <div className={`rating-change ${myRatingChange > 0 ? 'gain' : 'loss'}`}>
                        {myRatingChange > 0 ? '+' : ''}{myRatingChange} RR
                    </div>
                )}

                <button onClick={leaveRoom} className="menu-btn">
                    Back to Menu
                </button>
            </div>
        );
    }

    return (
        <div className="game-arena">
            {selectedGameType === '2v2' ? (
                <div className="teams-stats">
                    <div className="team-column my-team">
                        <h3 className="team-title">Your Team</h3>
                        <PlayerStatCard player={me} isMe />
                        {teammates.map(player => (
                            <PlayerStatCard key={player.id} player={player} />
                        ))}
                    </div>

                    <div className="vs-divider">VS</div>

                    <div className="team-column enemy-team">
                        <h3 className="team-title">Enemy Team</h3>
                        {opponents.map(player => (
                            <PlayerStatCard key={player.id} player={player} isEnemy />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="stats-bar">
                    <PlayerStatCard player={me} isMe />
                    <div className="vs">VS</div>
                    <PlayerStatCard player={opponents[0]} isEnemy />
                </div>
            )}

            <div className="battle-field">
                {status === 'PLAYING' && currentProblem ? (
                    <div className="problem-card">
                        <h1 className="question">{currentProblem.question}</h1>
                        <form onSubmit={handleSubmit}>
                            <input
                                ref={inputRef}
                                type="number"
                                step="any"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                autoFocus
                                placeholder="Your answer"
                            />
                            <button type="submit">Attack!</button>
                        </form>
                    </div>
                ) : (
                    <div className="waiting-screen">
                        <h2>Get Ready!</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper component for player stat cards
const PlayerStatCard = ({ player, isMe, isEnemy }: {
    player?: typeof useGameStore extends () => { players: infer P } ? P[number] : never;
    isMe?: boolean;
    isEnemy?: boolean;
}) => {
    if (!player) return <div className="player-stat empty">Waiting...</div>;

    return (
        <div className={`player-stat ${isMe ? 'me' : ''} ${isEnemy ? 'enemy' : ''}`}>
            <h3>{player.name} {isMe && '(You)'}</h3>
            <div className="hp-container">
                <div
                    className="hp-bar"
                    style={{
                        width: `${player.hp}%`,
                        background: isMe ? '#11998e' : isEnemy ? '#ee0979' : '#667eea'
                    }}
                >
                    {player.hp}%
                </div>
            </div>
            <p>Score: {player.score} | Streak: {player.streak}🔥</p>
        </div>
    );
};
