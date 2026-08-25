import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Show } from '../types'

export function useShows() {
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'shows'), orderBy('scheduledAt', 'asc'))
    return onSnapshot(q, (snap) => {
      setShows(
        snap.docs.map(
          (d) =>
            ({
              location: '',
              notes: '',
              teamMembers: [],
              guestEmails: [],
              assetsFolderUrl: '',
              liveCurrentSegmentId: '',
              ...(d.data() as Partial<Show>),
              id: d.id,
            }) as Show,
        ),
      )
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
    location: '',
    notes: '',
    teamMembers: [],
    guestEmails: [],
    assetsFolderUrl: '',
  })
}

export async function updateShow(showId: string, patch: Partial<Show>) {
  await updateDoc(doc(db, 'shows', showId), patch)
}
