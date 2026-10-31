import { useState } from 'react'

export default function PlayerInput({ onSubmit, isLoading }) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && input.trim() && !isLoading) {
      onSubmit(input)
      setInput('')
    }
  }

  return (
    <input
      type="text"
      className="w-full bg-black border border-teal-800 text-teal-300 p-3 rounded-md focus:outline-none focus:border-teal-400 focus:shadow-[0_0_10px_rgba(0,255,204,0.3)] transition-all"
      placeholder={isLoading ? "Awaiting connection..." : "Enter your action..."}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
      autoFocus
    />
  )
}