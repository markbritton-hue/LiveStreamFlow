import { deleteApp, getApps, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import { firebaseConfig } from '../firebase'

/**
 * Creates a Firebase Auth account for a team member without disturbing the
 * currently signed-in admin session. Uses a throwaway secondary app instance
 * (createUserWithEmailAndPassword signs in on whatever `auth` it's called
 * with) and tears it down afterward.
 */
export async function inviteTeamMember(email: string, password: string) {
  const name = `invite-${Date.now()}`
  const secondaryApp = initializeApp(firebaseConfig, name)
  try {
    const secondaryAuth = getAuth(secondaryApp)
    await createUserWithEmailAndPassword(secondaryAuth, email, password)
  } finally {
    const existing = getApps().find((a) => a.name === name)
    if (existing) await deleteApp(existing)
  }
}
