import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Show } from '../types'

function toShow(d: { id: string; data: () => unknown }): Show {
  return {
    ownerId: '',
    location: '',
    notes: '',
    teamMembers: [],
    guestEmails: [],
    assetsFolderUrl: '',
    liveCurrentSegmentId: '',
    ...(d.data() as Partial<Show>),
    id: d.id,
  } as Show
}

export function useShows(ownerId: string | undefined, email: string | null | undefined) {
  const [ownedShows, setOwnedShows] = useState<Show[]>([])
  const [memberShows, setMemberShows] = useState<Show[]>([])
  const [ownedLoaded, setOwnedLoaded] = useState(false)
  const [memberLoaded, setMemberLoaded] = useState(false)

  useEffect(() => {
    if (!ownerId) {
      setOwnedShows([])
      setOwnedLoaded(true)
      return
    }
    const q = query(collection(db, 'shows'), where('ownerId', '==', ownerId))
    return onSnapshot(
      q,
      (snap) => {
        setOwnedShows(snap.docs.map(toShow))
        setOwnedLoaded(true)
      },
      (err) => {
        console.error('useShows owned snapshot error:', err)
        setOwnedShows([])
        setOwnedLoaded(true)
      },
    )
  }, [ownerId])

  useEffect(() => {
    if (!email) {
      setMemberShows([])
      setMemberLoaded(true)
      return
    }
    const q = query(collection(db, 'shows'), where('teamMembers', 'array-contains', email))
    return onSnapshot(
      q,
      (snap) => {
        setMemberShows(snap.docs.map(toShow))
        setMemberLoaded(true)
      },
      (err) => {
        console.error('useShows member snapshot error:', err)
        setMemberShows([])
        setMemberLoaded(true)
      },
    )
  }, [email])

  const shows = [...ownedShows, ...memberShows.filter((s) => s.ownerId !== ownerId)].sort(
    (a, b) => a.scheduledAt.localeCompare(b.scheduledAt),
  )

  return { shows, loading: !ownedLoaded || !memberLoaded }
}

export async function createShow(input: {
  title: string
  scheduledAt: string
  targetDurationMinutes: number
  ownerId: string
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
    liveCurrentSegmentId: '',
  })
}

export async function updateShow(showId: string, patch: Partial<Show>) {
  await updateDoc(doc(db, 'shows', showId), patch)
}
