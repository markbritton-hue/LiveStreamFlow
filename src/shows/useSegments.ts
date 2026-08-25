import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Segment } from '../types'

function segmentsRef(showId: string) {
  return collection(db, 'shows', showId, 'segments')
}

export function useSegments(showId: string) {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(segmentsRef(showId), orderBy('order', 'asc'))
    return onSnapshot(q, (snap) => {
      setSegments(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Segment))
      setLoading(false)
    })
  }, [showId])

  return { segments, loading }
}

export async function addSegment(
  showId: string,
  input: Omit<Segment, 'id' | 'order'>,
  order: number,
) {
  const ref = await addDoc(segmentsRef(showId), { ...input, order })
  return ref.id
}

export async function updateSegment(showId: string, segmentId: string, patch: Partial<Segment>) {
  await updateDoc(doc(db, 'shows', showId, 'segments', segmentId), patch)
}

export async function deleteSegment(showId: string, segmentId: string) {
  await deleteDoc(doc(db, 'shows', showId, 'segments', segmentId))
}

export async function reorderSegments(showId: string, orderedIds: string[]) {
  const batch = writeBatch(db)
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, 'shows', showId, 'segments', id), { order: index })
  })
  await batch.commit()
}
