import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { createShow, useShows } from './useShows'
import Modal from '../components/Modal'
import ShowsCalendar from './ShowsCalendar'

type ViewMode = 'list' | 'calendar'

export default function ShowsList() {
  const { user } = useAuth()
  const { shows, loading } = useShows(user?.uid, user?.email)
  const [showModal, setShowModal] = useState(false)
  const [view, setView] = useState<ViewMode>(() => {
    try {
      return localStorage.getItem('showsView') === 'calendar' ? 'calendar' : 'list'
    } catch {
      return 'list'
    }
  })
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(60)

  useEffect(() => {
    try {
      localStorage.setItem('showsView', view)
    } catch {
      /* ignore */
    }
  }, [view])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!title || !scheduledAt || !user) return
    await createShow({
      title,
      scheduledAt,
      targetDurationMinutes,
      ownerId: user.uid,
      createdBy: user.email ?? user.uid,
    })
    setTitle('')
    setScheduledAt('')
    setTargetDurationMinutes(60)
    setShowModal(false)
  }

  return (
    <div className="shows-list">
      <div className="shows-list-header">
        <h1>Shows</h1>
        <div className="shows-list-header-actions">
          <div className="view-toggle">
            <button
              type="button"
              className={view === 'list' ? 'view-toggle-active' : ''}
              onClick={() => setView('list')}
            >
              List
            </button>
            <button
              type="button"
              className={view === 'calendar' ? 'view-toggle-active' : ''}
              onClick={() => setView('calendar')}
            >
              Calendar
            </button>
          </div>
          <button type="button" onClick={() => setShowModal(true)}>
            + New Show
          </button>
        </div>
      </div>

      {showModal && (
        <Modal title="New Show" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="new-show-form">
            <label>
              Show title
              <input
                placeholder="Show title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label>
              Date &amp; time
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </label>
            <label>
              Target duration (minutes)
              <input
                type="number"
                min={1}
                value={targetDurationMinutes}
                onChange={(e) => setTargetDurationMinutes(Number(e.target.value))}
              />
            </label>
            <div className="modal-actions">
              <button type="submit">Create Show</button>
              <button type="button" className="link-button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : shows.length === 0 ? (
        <p>No shows yet. Create your first one above.</p>
      ) : view === 'calendar' ? (
        <ShowsCalendar shows={shows} />
      ) : (
        <div className="shows-grid">
          {shows.map((show) => (
            <Link key={show.id} to={`/shows/${show.id}`} className={`show-card status-${show.status}`}>
              <div className="show-card-top">
                <span className="show-title">{show.title}</span>
                <span className={`show-status-badge status-${show.status}`}>{show.status}</span>
              </div>

              <div className="show-card-row">
                <span className="show-card-icon">📅</span>
                {new Date(show.scheduledAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>

              <div className="show-card-row">
                <span className="show-card-icon">⏱️</span>
                {show.targetDurationMinutes} min
              </div>

              {show.location && (
                <div className="show-card-row">
                  <span className="show-card-icon">📍</span>
                  {show.location}
                </div>
              )}

              {show.notes && <p className="show-card-notes">{show.notes}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
