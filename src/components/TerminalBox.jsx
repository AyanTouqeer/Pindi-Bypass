export default function TerminalBox({ history }) {
  return (
    <div className="h-96 overflow-y-auto border border-teal-800 bg-black p-4 mb-4 rounded-md shadow-[0_0_15px_rgba(0,255,204,0.15)] flex flex-col gap-4">
      {history.map((entry, idx) => (
        <div key={idx} className="animate-fade-in">
          <div className="text-gray-500 font-bold">&gt; {entry.action}</div>
          <div className="text-teal-400 mt-1 leading-relaxed">{entry.narrative}</div>
        </div>
      ))}
    </div>
  )
}