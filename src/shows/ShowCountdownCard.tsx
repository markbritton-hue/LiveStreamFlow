import { useEffect, useState } from 'react'
import { formatShowRange } from '../types'

function formatCountdown(scheduledAt: string): { label: string; isPast: boolean } {
  const target = new Date(scheduledAt).getTime()
  const now = Date.now()
  const diffMs = target - now
  const isPast = diffMs <= 0
  const abs = Math.abs(diffMs)

  const totalSeconds = Math.floor(abs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (days > 0 || hours > 0) parts.push(`${hours}h`)
  if (days === 0) {
    parts.push(`${minutes}m`)
    if (days === 0 && hours === 0) parts.push(`${seconds}s`)
  } else if (hours > 0 || days > 0) {
    parts.push(`${minutes}m`)
  }

  return { label: parts.join(' '), isPast }
}

export default function ShowCountdownCard({
  scheduledAt,
  endsAt,
}: {
  scheduledAt: string
  endsAt?: string
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const { label, isPast } = formatCountdown(scheduledAt)
  void now

  return (
    <div className="show-date-card">
      <div className="show-card-row">
        <span className="show-card-icon">📅</span>
        {formatShowRange(scheduledAt, endsAt)}
      </div>
      <div className={`show-countdown${isPast ? ' show-countdown-past' : ''}`}>
        {isPast ? `Started ${label} ago` : `Starts in ${label}`}
      </div>
    </div>
  )
}
