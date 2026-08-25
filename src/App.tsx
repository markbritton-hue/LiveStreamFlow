import { HashRouter, Routes, Route } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { auth } from './firebase'
import SignIn from './auth/SignIn'
import ShowsList from './shows/ShowsList'
import ShowDetail from './shows/ShowDetail'
import './App.css'

function AppShell() {
  const { user, loading } = useAuth()

  if (loading) return <p>Loading…</p>
  if (!user) return <SignIn />

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-name">LiveStreamFlow</span>
        <span className="app-user">
          {user.email}
          <button type="button" className="link-button" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </span>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<ShowsList />} />
          <Route path="/shows/:showId" element={<ShowDetail />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppShell />
      </HashRouter>
    </AuthProvider>
  )
}
