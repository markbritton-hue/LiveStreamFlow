import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { createShow, useShows } from './useShows'
import { formatShowRange } from '../types'
import Modal from '../components/Modal'
import ShowsCalendar from './ShowsCalendar'

export default function ShowsList() {
  const { user } = useAuth()
  const { shows: allShows, loading } = useShows(user?.uid, user?.email)
  const [showArchived, setShowArchived] = useState(false)
  const archivedCount = allShows.filter((s) => s.archived).length
  const shows = showArchived ? allShows : allShows.filter((s) => !s.archived)
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(60)

  const endBeforeStart = !!endsAt && !!scheduledAt && endsAt < scheduledAt

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!title || !scheduledAt || !user || endBeforeStart) return
    await createShow({
      title,
      scheduledAt,
      endsAt,
      targetDurationMinutes,
      ownerId: user.uid,
      createdBy: user.email ?? user.uid,
    })
    setTitle('')
    setScheduledAt('')
    setEndsAt('')
    setTargetDurationMinutes(60)
    setShowModal(false)
  }

  return (
    <div className="shows-list">
      <div className="shows-list-header">
        <h1>Shows</h1>
        {archivedCount > 0 && (
          <label className="show-archived-toggle">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived ({archivedCount})
          </label>
        )}
        <button type="button" onClick={() => setShowModal(true)}>
          + New Show
        </button>
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
              Start date &amp; time
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </label>
            <label>
              End date &amp; time
              <input
                type="datetime-local"
                value={endsAt}
                min={scheduledAt || undefined}
                onChange={(e) => setEndsAt(e.target.value)}
              />
              {endBeforeStart && (
                <span className="field-hint error">End must be after the start.</span>
              )}
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
              <button type="submit" disabled={endBeforeStart}>
                Create Show
              </button>
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
        <p>
          {allShows.length === 0
            ? 'No shows yet. Create your first one above.'
            : 'All shows are archived. Tick "Show archived" to see them.'}
        </p>
      ) : (
        <div className="shows-split">
          <div className="shows-list-pane">
            {shows.map((show) => (
              <Link
                key={show.id}
                to={`/shows/${show.id}`}
                className={`show-card status-${show.status}`}
              >
                <div className="show-card-top">
                  <span className="show-title">{show.title}</span>
                  <span className={`show-status-badge status-${show.status}`}>
                    {show.archived ? 'archived' : show.status}
                  </span>
                </div>

                <div className="show-card-row">
                  <span className="show-card-icon">📅</span>
                  {formatShowRange(show.scheduledAt, show.endsAt)}
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

          <div className="shows-calendar-pane">
            <ShowsCalendar shows={shows} />
          </div>
        </div>
      )}
    </div>
  )
}
