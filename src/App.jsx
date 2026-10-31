import { useState, useEffect } from 'react'
import TerminalBox from './components/TerminalBox'
import PlayerInput from './components/PlayerInput'

const GRID_SIZE = 10;

const WALL_LOCATIONS = [
  { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }, 
  { x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 }, { x: 8, y: 7 }
];

const GHOST_LOCATIONS = [
  { x: 3, y: 3, id: 'F-7 Graveyard Poltergeist' },
  { x: 7, y: 8, id: 'Shah Allah Ditta Ancient Djinn' }
];

export default function App() {
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [characterType, setCharacterType] = useState('male'); // 'male' or 'female'
  const [history, setHistory] = useState([
    { action: "SYSTEM_INIT", narrative: "Jarvis HUD online. Calibrating spectral sensors for Twin Cities sector. Operative deployed." }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      setPlayerPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;

        if (e.key === 'ArrowUp' || e.key === 'w') newY = Math.max(0, prev.y - 1);
        if (e.key === 'ArrowDown' || e.key === 's') newY = Math.min(GRID_SIZE - 1, prev.y + 1);
        if (e.key === 'ArrowLeft' || e.key === 'a') newX = Math.max(0, prev.x - 1);
        if (e.key === 'ArrowRight' || e.key === 'd') newX = Math.min(GRID_SIZE - 1, prev.x + 1);

        const isWall = WALL_LOCATIONS.some(w => w.x === newX && w.y === newY);
        if (isWall) return prev;

        const ghost = GHOST_LOCATIONS.find(g => g.x === newX && g.y === newY);
        if (ghost && (newX !== prev.x || newY !== prev.y)) {
          triggerAIWarning(ghost.id, { x: newX, y: newY });
        }

        return { x: newX, y: newY };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerAIWarning = async (ghostId, overridePos) => {
    handleAction(`Proximity scan triggered on entity.`, ghostId, overridePos);
  };

  const handleAction = async (actionText, entity = null, overridePos = null) => {
    const pos = overridePos || playerPosition;
    setIsLoading(true);
    setHistory(prev => [...prev, { action: actionText, narrative: "..." }]);

    try {
      const res = await fetch("https://pindi-bypass-api-55433376727.us-central1.run.app/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            current_node: `[${pos.x}, ${pos.y}]`, 
            player_input: actionText, 
            entity_scanned: entity,
            inventory: [] 
        })
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].narrative = data.narrative;
        return newHistory;
      });
    } catch (error) {
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].narrative = "ERR: Vertex AI connection severed. Running local spectral fallback.";
        return newHistory;
      });
    }
    setIsLoading(false);
  };

  const renderGrid = () => {
    let cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isPlayer = playerPosition.x === x && playerPosition.y === y;
        const isGhost = GHOST_LOCATIONS.some(g => g.x === x && g.y === y);
        const isWall = WALL_LOCATIONS.some(w => w.x === x && w.y === y);
        
        cells.push(
          <div 
            key={`${x}-${y}`} 
            className={`w-12 h-12 border border-teal-900/60 flex items-center justify-center transition-all duration-200 relative
              ${isPlayer ? 'bg-teal-950/80 border-teal-400 shadow-[0_0_15px_rgba(0,255,204,0.6)] z-10' : ''}
              ${isWall ? 'bg-gray-900 border-gray-800' : ''}
              ${isGhost && !isPlayer && !isWall ? 'bg-red-950/60 border-red-500 animate-pulse' : ''}
              ${!isPlayer && !isGhost && !isWall ? 'bg-black/90' : ''}
            `}
          >
            {isPlayer && (
              <div className="absolute inset-1 bg-teal-500/20 rounded flex items-center justify-center border border-teal-400 animate-bounce">
                <span className="text-lg">{characterType === 'male' ? '🕵️‍♂️' : '🕵️‍♀️'}</span>
              </div>
            )}
            {isGhost && !isPlayer && (
              <div className="absolute inset-1 bg-red-500/20 rounded flex items-center justify-center border border-red-500/50 animate-pulse">
                <span className="text-lg drop-shadow-[0_0_8px_rgba(255,0,0,0.9)]">👻</span>
              </div>
            )}
            {isWall && <span className="text-gray-700 font-black text-xs">█</span>}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center p-6 gap-8 bg-[#030303] text-[#00ffcc] font-mono">
      {/* Sector Map & Controls */}
      <div className="flex flex-col items-center p-5 bg-gray-950 border-2 border-teal-800/80 rounded-2xl shadow-[0_0_25px_rgba(0,128,128,0.25)]">
        <div className="flex items-center justify-between w-full mb-4 px-1">
          <h2 className="text-lg font-bold tracking-widest uppercase text-teal-400">Sector Map</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setCharacterType('male')}
              className={`px-3 py-1 text-xs rounded border transition-all ${characterType === 'male' ? 'bg-teal-500 text-black border-teal-400 font-bold shadow-[0_0_10px_rgba(0,255,204,0.5)]' : 'bg-black text-teal-500 border-teal-900'}`}
            >
              Male Operative
            </button>
            <button 
              onClick={() => setCharacterType('female')}
              className={`px-3 py-1 text-xs rounded border transition-all ${characterType === 'female' ? 'bg-teal-500 text-black border-teal-400 font-bold shadow-[0_0_10px_rgba(0,255,204,0.5)]' : 'bg-black text-teal-500 border-teal-900'}`}
            >
              Female Operative
            </button>
          </div>
        </div>

        <div 
          className="grid gap-1 bg-black p-2 border-2 border-teal-900/80 rounded-xl"
          style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}
        >
          {renderGrid()}
        </div>
        <div className="mt-4 flex justify-between w-full text-xs text-gray-400 px-1">
          <span>Controls: WASD / Arrow Keys</span>
          <span className="text-red-400 font-semibold">👻 Spectral Anomalies Active</span>
        </div>
      </div>

      {/* AI Tactical HUD */}
      <div className="w-full max-w-xl flex flex-col h-[580px] p-6 bg-gray-950 border-2 border-teal-800/80 rounded-2xl shadow-[0_0_25px_rgba(0,128,128,0.25)]">
        <h1 className="text-2xl font-black text-teal-400 mb-1 tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(0,255,204,0.6)]">
          Jarvis Tactical HUD
        </h1>
        <div className="flex justify-between items-center mb-4">
          <p className="text-teal-600 tracking-widest text-xs font-semibold">COORDINATES: [{playerPosition.x}, {playerPosition.y}]</p>
          <span className="text-xs bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800">SEC-7 TWIN CITIES</span>
        </div>
        
        <div className="flex-grow overflow-hidden flex flex-col">
          <TerminalBox history={history} />
          <PlayerInput onSubmit={handleAction} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}