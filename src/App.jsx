import { useState, useEffect } from 'react'
import TerminalBox from './components/TerminalBox'
import PlayerInput from './components/PlayerInput'

const GRID_SIZE = 10;

// Define impassable terrain (e.g., graveyard fences, blocked alleys)
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
  const [history, setHistory] = useState([
    { action: "SYSTEM_INIT", narrative: "Jarvis HUD online. Calibrating spectral sensors for Twin Cities sector." }
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

        // 1. Collision Check: If the new coordinate is a wall, block movement completely
        const isWall = WALL_LOCATIONS.some(w => w.x === newX && w.y === newY);
        if (isWall) return prev;

        // 2. Event Check: If we step on a ghost, trigger the enriched AI payload
        const ghost = GHOST_LOCATIONS.find(g => g.x === newX && g.y === newY);
        if (ghost && (newX !== prev.x || newY !== prev.y)) {
          triggerAIWarning(ghost.id);
        }

        return { x: newX, y: newY };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pass the specific ghost ID to the handleAction function
  const triggerAIWarning = async (ghostId) => {
    handleAction(`Proximity alert triggered.`, ghostId);
  };

  // Accept the optional entity parameter and append it to the JSON payload
  const handleAction = async (actionText, entity = null) => {
    setIsLoading(true);
    setHistory(prev => [...prev, { action: actionText, narrative: "..." }]);

    try {
      const res = await fetch("http://localhost:8000/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            current_node: `[${playerPosition.x}, ${playerPosition.y}]`, 
            player_input: actionText, 
            entity_scanned: entity,
            inventory: [] 
        })
      });
      const data = await res.json();
      
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].narrative = data.narrative;
        return newHistory;
      });
    } catch (error) {
      setHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].narrative = "ERR: Vertex AI connection severed.";
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
            className={`w-full h-12 border border-teal-900 flex items-center justify-center transition-colors duration-200
              ${isPlayer ? 'bg-teal-500 shadow-[0_0_15px_rgba(0,255,204,0.8)] z-10' : ''}
              ${isWall ? 'bg-gray-800 border-gray-900 texture-noise' : ''}
              ${isGhost && !isPlayer && !isWall ? 'bg-red-900/50 animate-pulse' : ''}
              ${!isPlayer && !isGhost && !isWall ? 'bg-black' : ''}
            `}
          >
            {isPlayer && <span className="text-xl">🕵️</span>}
            {isGhost && !isPlayer && <span className="text-xl drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]">👻</span>}
            {isWall && <span className="text-gray-900 text-sm font-black">✖</span>}
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="min-h-screen flex flex-row items-center justify-center p-6 gap-8 bg-[#050505] text-[#00ffcc] font-mono">
      {/* 2D Game Canvas */}
      <div className="w-1/2 max-w-xl">
        <h2 className="text-2xl mb-4 font-bold tracking-widest uppercase">Sector Map</h2>
        <div className="grid grid-cols-10 gap-1 bg-gray-900 p-2 border-2 border-teal-800 rounded-md">
          {renderGrid()}
        </div>
        <p className="mt-4 text-gray-500 text-sm">Use WASD or Arrow Keys to move.</p>
      </div>

      {/* AI Tactical HUD */}
      <div className="w-1/2 max-w-xl flex flex-col h-[600px]">
        <h1 className="text-3xl font-black text-teal-600 mb-2 tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(0,128,128,0.8)]">
          Jarvis Tactical HUD
        </h1>
        <p className="text-gray-500 mb-4 tracking-widest text-sm">POS: [{playerPosition.x}, {playerPosition.y}]</p>
        
        <div className="flex-grow overflow-hidden flex flex-col">
           <TerminalBox history={history} />
           <PlayerInput onSubmit={handleAction} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}