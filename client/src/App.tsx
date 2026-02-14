import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Auth } from './components/auth/Auth';
import { MainMenu } from './components/MainMenu';
import { ModeSelector } from './components/ModeSelector';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import './index.css';

function App() {
  const {
    isConnected,
    isGuest,
    user,
    roomId,
    showModeSelector,
    connect,
    loadAuthFromStorage
  } = useGameStore();

  useEffect(() => {
    loadAuthFromStorage();
    connect();
  }, [connect, loadAuthFromStorage]);

  // Show loading while connecting
  if (!isConnected) {
    return <div className="loading">Connecting to server...</div>;
  }

  // Show auth screen if not logged in and not guest
  if (!user && !isGuest) {
    return <Auth />;
  }

  // Show main menu if no room
  if (!roomId && !showModeSelector) {
    return <MainMenu />;
  }

  // Show mode selector
  if (showModeSelector) {
    return <ModeSelector />;
  }

  // Show game lobby or game
  return (
    <div className="app-container">
      {!roomId ? <Lobby /> : <Game />}
    </div>
  );
}

export default App;
