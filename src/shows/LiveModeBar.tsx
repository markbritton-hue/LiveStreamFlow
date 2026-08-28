import { useEffect, useState } from 'react'

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function LiveModeBar({
  onExit,
  onJumpToCurrent,
  positionLabel,
}: {
  onExit: () => void
  onJumpToCurrent: () => void
  positionLabel: string | null
}) {
  const now = useClock()
  const timeLabel = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })

  return (
    <div className="live-mode-bar live-mode-active">
      <span className="live-badge">🔴 LIVE</span>
      {positionLabel && <span className="live-position">{positionLabel}</span>}
      <span className="live-clock">{timeLabel}</span>
      <div className="live-mode-controls">
        <button type="button" onClick={onJumpToCurrent}>
          🎯 Jump to Current
        </button>
        <button type="button" className="live-mode-exit-button" onClick={onExit}>
          Exit Live Mode
        </button>
      </div>
    </div>
  )
}
