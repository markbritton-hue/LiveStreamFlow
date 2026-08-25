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
import type { Section } from '../types'

function sectionsRef(showId: string) {
  return collection(db, 'shows', showId, 'sections')
}

export function useSections(showId: string) {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(sectionsRef(showId), orderBy('order', 'asc'))
    return onSnapshot(q, (snap) => {
      setSections(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Section))
      setLoading(false)
    })
  }, [showId])

  return { sections, loading }
}

export async function createSection(showId: string, title: string, order: number) {
  const ref = await addDoc(sectionsRef(showId), { title, order })
  return ref.id
}

export async function renameSection(showId: string, sectionId: string, title: string) {
  await updateDoc(doc(db, 'shows', showId, 'sections', sectionId), { title })
}

export async function deleteSection(showId: string, sectionId: string) {
  await deleteDoc(doc(db, 'shows', showId, 'sections', sectionId))
}

export async function reorderSections(showId: string, orderedIds: string[]) {
  const batch = writeBatch(db)
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, 'shows', showId, 'sections', id), { order: index })
  })
  await batch.commit()
}
