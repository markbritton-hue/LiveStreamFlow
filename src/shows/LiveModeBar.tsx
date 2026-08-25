export default function LiveModeBar({
  onExit,
  onPrev,
  onNext,
  onJumpToCurrent,
  canGoPrev,
  canGoNext,
  positionLabel,
}: {
  onExit: () => void
  onPrev: () => void
  onNext: () => void
  onJumpToCurrent: () => void
  canGoPrev: boolean
  canGoNext: boolean
  positionLabel: string | null
}) {
  return (
    <div className="live-mode-bar live-mode-active">
      <span className="live-badge">🔴 LIVE</span>
      {positionLabel && <span className="live-position">{positionLabel}</span>}
      <div className="live-mode-controls">
        <button type="button" onClick={onPrev} disabled={!canGoPrev}>
          ◀ Prev
        </button>
        <button type="button" onClick={onNext} disabled={!canGoNext}>
          Next ▶
        </button>
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
