import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export const Game = () => {
    const { players, currentProblem, playerId, submitAnswer, status, winner } = useGameStore();
    const [answer, setAnswer] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const me = players.find(p => p.id === playerId);
    const opponent = players.find(p => p.id !== playerId); // Works for 1v1

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!answer) return;
        submitAnswer(answer);
        setAnswer('');
        inputRef.current?.focus();
    };

    useEffect(() => {
        // Focus input on new problem
        inputRef.current?.focus();
    }, [currentProblem]);

    if (status === 'FINISHED') {
        return (
            <div className="game-over">
                <h1>Game Over!</h1>
                <h2>Winner: {winner?.name}</h2>
                <button onClick={() => window.location.reload()}>Back to Menu</button>
            </div>
        );
    }

    return (
        <div className="game-arena">
            <div className="stats-bar">
                <div className="player-stat me">
                    <h3>{me?.name} (You)</h3>
                    <div className="hp-bar" style={{ width: `${me?.hp}%`, background: 'green' }}></div>
                    <p>Score: {me?.score} | Streak: {me?.streak}</p>
                </div>

                <div className="vs">VS</div>

                <div className="player-stat opponent">
                    <h3>{opponent?.name || 'Waiting...'}</h3>
                    <div className="hp-bar" style={{ width: `${opponent?.hp}%`, background: 'red' }}></div>
                    <p>Score: {opponent?.score}</p>
                </div>
            </div>

            <div className="battle-field">
                {status === 'WAITING' ? (
                    <div className="waiting-screen">
                        <h2>Waiting for opponent...</h2>
                        {players.length > 1 && <p>Opponent found! Ready up.</p>}
                        <button onClick={() => useGameStore.getState().setReady(true)}>
                            READY
                        </button>
                    </div>
                ) : (
                    <div className="problem-card">
                        <h1 className="question">{currentProblem?.question}</h1>
                        <form onSubmit={handleSubmit}>
                            <input
                                ref={inputRef}
                                type="number"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                autoFocus
                            />
                            <button type="submit">Attack!</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
