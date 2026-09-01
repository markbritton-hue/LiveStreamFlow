import { useState, type FormEvent } from 'react'
import { inviteTeamMember } from '../auth/inviteTeamMember'

export default function InviteTeamMember({
  onInvited,
}: {
  onInvited: (email: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await inviteTeamMember(email, password)
      onInvited(email)
      setEmail('')
      setPassword('')
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button type="button" className="link-button" onClick={() => setOpen(true)}>
        + Create login for a new team member
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="invite-team-member-form">
      <input
        type="email"
        placeholder="Their email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Temporary password (6+ chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />
      {error && <p className="error">{error}</p>}
      <div className="invite-team-member-actions">
        <button type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create account & add'}
        </button>
        <button type="button" className="link-button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  )
}
