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
  const [guestShows, setGuestShows] = useState<Show[]>([])
  const [ownedLoaded, setOwnedLoaded] = useState(false)
  const [memberLoaded, setMemberLoaded] = useState(false)
  const [guestLoaded, setGuestLoaded] = useState(false)

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
      setGuestShows([])
      setMemberLoaded(true)
      setGuestLoaded(true)
      return
    }
    const subscribe = (
      field: 'teamMembers' | 'guestEmails',
      setShows: (s: Show[]) => void,
      setLoaded: (b: boolean) => void,
    ) =>
      onSnapshot(
        query(collection(db, 'shows'), where(field, 'array-contains', email)),
        (snap) => {
          setShows(snap.docs.map(toShow))
          setLoaded(true)
        },
        (err) => {
          console.error(`useShows ${field} snapshot error:`, err)
          setShows([])
          setLoaded(true)
        },
      )
    const unsubMember = subscribe('teamMembers', setMemberShows, setMemberLoaded)
    const unsubGuest = subscribe('guestEmails', setGuestShows, setGuestLoaded)
    return () => {
      unsubMember()
      unsubGuest()
    }
  }, [email])

  const seen = new Set<string>()
  const shows = [...ownedShows, ...memberShows, ...guestShows]
    .filter((s) => {
      if (seen.has(s.id)) return false
      seen.add(s.id)
      return true
    })
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

  return { shows, loading: !ownedLoaded || !memberLoaded || !guestLoaded }
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
