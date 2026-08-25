import { Link, useParams } from 'react-router-dom'
import { useShow } from './useShow'
import RundownBuilder from './RundownBuilder'

export default function ShowDetail() {
  const { showId } = useParams<{ showId: string }>()
  const { show, loading } = useShow(showId ?? '')

  if (loading) return <p>Loading…</p>
  if (!show) return <p>Show not found.</p>

  return (
    <div className="show-detail">
      <Link to="/" className="back-link">
        ← All shows
      </Link>
      <h1>{show.title}</h1>
      <p className="show-meta">
        {new Date(show.scheduledAt).toLocaleString()} · {show.status}
      </p>
      <RundownBuilder show={show} />
    </div>
  )
}
