import { useState, useRef, useEffect } from 'react'
import TerminalBox from './components/TerminalBox'
import PlayerInput from './components/PlayerInput'

export default function App() {
  const [history, setHistory] = useState([
    { action: "SYSTEM_INIT", narrative: "You are standing at the edge of the F-7 Graveyard. The shadows are unnaturally long tonight." }
  ])
  const [currentNode, setCurrentNode] = useState("f7_graveyard")
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async (actionText) => {
    setIsLoading(true)
    setHistory(prev => [...prev, { action: actionText, narrative: "..." }])

    try {
      const res = await fetch("http://localhost:8000/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_node: currentNode, player_input: actionText, inventory: [] })
      })
      const data = await res.json()
      
      setHistory(prev => {
        const newHistory = [...prev]
        newHistory[newHistory.length - 1].narrative = data.narrative
        return newHistory
      })
      setCurrentNode(data.new_node)
    } catch (error) {
      setHistory(prev => {
        const newHistory = [...prev]
        newHistory[newHistory.length - 1].narrative = "ERR_CONNECTION_LOST: The bypass is dead."
        return newHistory
      })
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-black text-teal-600 mb-2 tracking-[0.2em] text-center uppercase drop-shadow-[0_0_8px_rgba(0,128,128,0.8)]">
          Pindi Bypass
        </h1>
        <p className="text-center text-gray-500 mb-8 tracking-widest text-sm">NODE: {currentNode.toUpperCase()}</p>
        
        <TerminalBox history={history} />
        <PlayerInput onSubmit={handleAction} isLoading={isLoading} />
      </div>
    </div>
  )
}