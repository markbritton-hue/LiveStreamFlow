import { useOnlineUsers } from '../presence/useOnlineUsers'

function initialsFor(email: string) {
  const name = email.split('@')[0]
  return name.slice(0, 2).toUpperCase()
}

export default function OnlineUsers({ currentUserEmail }: { currentUserEmail?: string | null }) {
  const users = useOnlineUsers()

  if (users.length === 0) return null

  const sorted = [...users].sort((a, b) => {
    if (a.email === currentUserEmail) return -1
    if (b.email === currentUserEmail) return 1
    return 0
  })

  return (
    <div className="online-users">
      {sorted.map((u) => (
        <span
          key={u.uid}
          className={`online-user-avatar${u.email === currentUserEmail ? ' online-user-self' : ''}`}
          title={u.email === currentUserEmail ? `${u.email} (you)` : u.email}
        >
          {initialsFor(u.email)}
        </span>
      ))}
    </div>
  )
}
