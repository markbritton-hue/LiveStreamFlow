import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { auth } from './firebase'
import SignIn from './auth/SignIn'
import ShowsList from './shows/ShowsList'
import ShowDetail from './shows/ShowDetail'
import logo from './assets/logo.png'
import BackButton from './components/BackButton'
import OnlineUsers from './components/OnlineUsers'
import { usePresence } from './presence/usePresence'
import './App.css'

type Theme = 'light' | 'dark'

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return { theme, toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }
}

function AppShell() {
  const { user, loading } = useAuth()
  usePresence(user)
  const { theme, toggleTheme } = useTheme()

  if (loading) return <p>Loading…</p>
  if (!user) return <SignIn />

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-left">
          <img src={logo} alt="LiveStreamFlow" className="app-logo" />
        </div>
        <span className="app-user">
          <OnlineUsers currentUserEmail={user.email} />
          <BackButton />
          <button
            type="button"
            className="link-button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
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
