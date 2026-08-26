import { useEffect } from 'react'
import { doc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { User } from 'firebase/auth'

const HEARTBEAT_MS = 20000

export function usePresence(user: User | null) {
  useEffect(() => {
    if (!user) return

    const ref = doc(db, 'presence', user.uid)

    function beat() {
      if (!user) return
      setDoc(ref, { email: user.email ?? 'Unknown', lastSeen: serverTimestamp() })
    }

    beat()
    const interval = setInterval(beat, HEARTBEAT_MS)

    function handleUnload() {
      deleteDoc(ref)
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleUnload)
      deleteDoc(ref)
    }
  }, [user])
}
