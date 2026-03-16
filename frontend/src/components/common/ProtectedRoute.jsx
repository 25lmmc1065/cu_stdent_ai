import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner fullScreen />

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectMap = {
      student: '/student',
      department: '/department',
      admin: '/admin',
      pvc: '/admin',
    }
    return <Navigate to={redirectMap[user.role] || '/login'} replace />
  }

  return children
}
