import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { Show } from '../types'

export function useShow(showId: string) {
  const [show, setShow] = useState<Show | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(
      doc(db, 'shows', showId),
      (snap) => {
      setShow(
        snap.exists()
          ? ({
              ownerId: '',
              endsAt: '',
              location: '',
              notes: '',
              teamMembers: [],
              guestEmails: [],
              assetsFolderUrl: '',
              liveCurrentSegmentId: '',
              roles: [],
              ...(snap.data() as Partial<Show>),
              id: snap.id,
            } as Show)
          : null,
      )
      setLoading(false)
      },
      (err) => {
        console.error('useShow snapshot error:', err)
        setShow(null)
        setLoading(false)
      },
    )
  }, [showId])

  return { show, loading }
}
