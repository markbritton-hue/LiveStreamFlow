import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useShow } from './useShow'
import { updateShow } from './useShows'
import RundownBuilder from './RundownBuilder'
import EmailListInput from './EmailListInput'
import type { Show } from '../types'

function toDateTimeLocal(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function ShowDetail() {
  const { showId } = useParams<{ showId: string }>()
  const { show, loading } = useShow(showId ?? '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Show | null>(null)

  useEffect(() => {
    if (show && !editing) setDraft(show)
  }, [show, editing])

  if (loading) return <p>Loading…</p>
  if (!show) return <p>Show not found.</p>

  async function handleSave() {
    if (!draft || !showId) return
    await updateShow(showId, {
      title: draft.title,
      scheduledAt: draft.scheduledAt,
      targetDurationMinutes: draft.targetDurationMinutes,
      location: draft.location,
      notes: draft.notes,
      teamMembers: draft.teamMembers,
      guestEmails: draft.guestEmails,
    })
    setEditing(false)
  }

  function handleCancel() {
    setDraft(show)
    setEditing(false)
  }

  return (
    <div className="show-detail">
      <Link to="/" className="back-link">
        ← All shows
      </Link>

      {!editing ? (
        <>
          <div className="show-detail-header">
            <div>
              <h1>{show.title}</h1>
              <p className="show-meta">
                {new Date(show.scheduledAt).toLocaleString()} · {show.status}
                {show.location && ` · ${show.location}`}
              </p>
            </div>
            <button type="button" onClick={() => setEditing(true)}>
              Edit Show
            </button>
          </div>

          {(show.notes || show.teamMembers.length > 0 || show.guestEmails.length > 0) && (
            <div className="show-info-panel">
              {show.notes && (
                <div className="show-info-row">
                  <span className="show-info-label">Notes</span>
                  <p>{show.notes}</p>
                </div>
              )}
              {show.teamMembers.length > 0 && (
                <div className="show-info-row">
                  <span className="show-info-label">Team</span>
                  <p>{show.teamMembers.join(', ')}</p>
                </div>
              )}
              {show.guestEmails.length > 0 && (
                <div className="show-info-row">
                  <span className="show-info-label">Guests</span>
                  <p>{show.guestEmails.join(', ')}</p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        draft && (
          <div className="show-edit-panel">
            <label>
              Title
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>

            <label>
              Date &amp; time
              <input
                type="datetime-local"
                value={toDateTimeLocal(draft.scheduledAt)}
                onChange={(e) => setDraft({ ...draft, scheduledAt: e.target.value })}
              />
            </label>

            <label>
              Target duration (minutes)
              <input
                type="number"
                min={1}
                value={draft.targetDurationMinutes}
                onChange={(e) =>
                  setDraft({ ...draft, targetDurationMinutes: Number(e.target.value) })
                }
              />
            </label>

            <label>
              Location
              <input
                placeholder="Venue / address"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
            </label>

            <label>
              Notes
              <textarea
                rows={3}
                placeholder="General notes about this show..."
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </label>

            <label>
              Team members
              <EmailListInput
                emails={draft.teamMembers}
                onChange={(teamMembers) => setDraft({ ...draft, teamMembers })}
                placeholder="Add team member email + Enter"
              />
            </label>

            <label>
              Guest emails
              <EmailListInput
                emails={draft.guestEmails}
                onChange={(guestEmails) => setDraft({ ...draft, guestEmails })}
                placeholder="Add guest email + Enter"
              />
            </label>

            <div className="show-edit-actions">
              <button type="button" onClick={handleSave}>
                Save
              </button>
              <button type="button" className="link-button" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        )
      )}

      <RundownBuilder show={show} />
    </div>
  )
}
