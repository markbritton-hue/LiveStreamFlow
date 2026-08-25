import { useLocation, useNavigate } from 'react-router-dom'

export default function BackButton() {
  const location = useLocation()
  const navigate = useNavigate()

  if (location.pathname === '/') return null

  return (
    <button type="button" className="back-button" onClick={() => navigate('/')}>
      ← Back
    </button>
  )
}
