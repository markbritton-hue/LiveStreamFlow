import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'

const STALE_AFTER_MS = 45000
const TICK_MS = 15000

export interface OnlineUser {
  uid: string
  email: string
  lastSeenMs: number
}

export function useOnlineUsers() {
  const [raw, setRaw] = useState<OnlineUser[]>([])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    return onSnapshot(collection(db, 'presence'), (snap) => {
      const list: OnlineUser[] = []
      snap.forEach((d) => {
        const data = d.data() as { email?: string; lastSeen?: Timestamp }
        list.push({
          uid: d.id,
          email: data.email ?? 'Unknown',
          lastSeenMs: data.lastSeen?.toMillis?.() ?? 0,
        })
      })
      setRaw(list)
    })
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(interval)
  }, [])

  return useMemo(
    () => raw.filter((u) => now - u.lastSeenMs < STALE_AFTER_MS),
    [raw, now],
  )
}
