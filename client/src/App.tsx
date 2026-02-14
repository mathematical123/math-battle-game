import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import './index.css';

function App() {
  const { isConnected, roomId, connect } = useGameStore();

  useEffect(() => {
    connect();
  }, [connect]);

  if (!isConnected) {
    return <div className="loading">Connecting to server...</div>;
  }

  return (
    <div className="app-container">
      {!roomId ? <Lobby /> : <Game />}
    </div>
  );
}

export default App;
