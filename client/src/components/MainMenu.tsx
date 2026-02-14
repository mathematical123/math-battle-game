import { useGameStore } from '../../store/gameStore';
import './MainMenu.css';

export const MainMenu = () => {
    const { user, isGuest, logout, setGameMode, setShowModeSelector } = useGameStore();

    const handlePlayCasual = () => {
        setShowModeSelector(true);
    };

    const handlePlayRanked = () => {
        setGameMode('ranked');
        setShowModeSelector(true);
    };

    return (
        <div className="main-menu">
            <div className="menu-card">
                <h1>Math Battle</h1>

                {!isGuest && user && (
                    <div className="user-profile">
                        <h2>{user.username}</h2>
                        <div className="rank-display">
                            <span className="rank">{user.rank}</span>
                            <span className="rr">{user.rr} RR</span>
                        </div>
                        <div className="stats">
                            <span>{user.wins}W / {user.losses}L</span>
                        </div>
                    </div>
                )}

                {isGuest && (
                    <div className="guest-indicator">
                        <p>🎭 Playing as Guest</p>
                    </div>
                )}

                <div className="menu-options">
                    <button onClick={handlePlayCasual} className="menu-btn casual">
                        🎮 Play Casual
                    </button>

                    {!isGuest && (
                        <button onClick={handlePlayRanked} className="menu-btn ranked">
                            🏆 Play Ranked
                        </button>
                    )}
                </div>

                {!isGuest && (
                    <button onClick={logout} className="logout-btn">
                        Logout
                    </button>
                )}
            </div>
        </div>
    );
};
