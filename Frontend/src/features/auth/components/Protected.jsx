import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

export default function Protected({ children, role = 'buyer' }) {
  const { user, loading } = useSelector(state => state.auth)
  const location = useLocation()
  if (loading) return <div role="status" style={{ padding: '64px', textAlign: 'center' }}>Loading your account…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (user.role !== role) return <Navigate to="/" replace />
  return children
}
