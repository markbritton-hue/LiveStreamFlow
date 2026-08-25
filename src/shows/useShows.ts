import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Show } from '../types'

export function useShows() {
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'shows'), orderBy('scheduledAt', 'asc'))
    return onSnapshot(q, (snap) => {
      setShows(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Show))
      setLoading(false)
    })
  }, [])

  return { shows, loading }
}

export async function createShow(input: {
  title: string
  scheduledAt: string
  targetDurationMinutes: number
  createdBy: string
}) {
  await addDoc(collection(db, 'shows'), {
    ...input,
    status: 'planned',
    createdAt: serverTimestamp(),
  })
}
