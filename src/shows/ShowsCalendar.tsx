import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Show } from '../types'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function ymd(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export default function ShowsCalendar({ shows }: { shows: Show[] }) {
  const navigate = useNavigate()
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const showsByDay = useMemo(() => {
    const map = new Map<string, Show[]>()
    for (const show of shows) {
      const d = new Date(show.scheduledAt)
      if (Number.isNaN(d.getTime())) continue
      const key = ymd(d)
      const list = map.get(key)
      if (list) list.push(show)
      else map.set(key, [show])
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
    }
    return map
  }, [shows])

  const weeks = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = new Date(first)
    start.setDate(first.getDate() - first.getDay())
    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    const rows: Date[][] = []
    for (let i = 0; i < 6; i++) rows.push(days.slice(i * 7, i * 7 + 7))
    // Drop a trailing week that is entirely in the next month.
    if (rows[5].every((d) => d.getMonth() !== cursor.getMonth())) rows.pop()
    return rows
  }, [cursor])

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })

  function shiftMonth(delta: number) {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1))
  }

  return (
    <div className="shows-calendar">
      <div className="shows-calendar-toolbar">
        <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          ‹
        </button>
        <span className="shows-calendar-month">{monthLabel}</span>
        <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">
          ›
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
        >
          Today
        </button>
      </div>

      <div className="shows-calendar-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="shows-calendar-weekday">
            {d}
          </div>
        ))}
        {weeks.flat().map((day) => {
          const inMonth = day.getMonth() === cursor.getMonth()
          const isToday = ymd(day) === ymd(today)
          const dayShows = showsByDay.get(ymd(day)) ?? []
          return (
            <div
              key={day.toISOString()}
              className={`shows-calendar-day${inMonth ? '' : ' shows-calendar-day-muted'}${
                isToday ? ' shows-calendar-day-today' : ''
              }`}
            >
              <span className="shows-calendar-daynum">{day.getDate()}</span>
              {dayShows.map((show) => (
                <button
                  key={show.id}
                  type="button"
                  className={`shows-calendar-event status-${show.status}`}
                  onClick={() => navigate(`/shows/${show.id}`)}
                  title={`${show.title} — ${new Date(show.scheduledAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}`}
                >
                  {show.title}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
