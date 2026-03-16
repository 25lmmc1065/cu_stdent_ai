import { useState } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Navbar from './components/common/Navbar'
import Sidebar from './components/common/Sidebar'
import LoadingSpinner from './components/common/LoadingSpinner'

// Auth
import Login from './components/auth/Login'
import Register from './components/auth/Register'

// Student
import StudentDashboard from './components/student/StudentDashboard'
import FileComplaint from './components/student/FileComplaint'
import ComplaintList from './components/student/ComplaintList'
import ComplaintDetail from './components/student/ComplaintDetail'
import StudentAppeals from './components/student/StudentAppeals'

// Department
import DepartmentDashboard from './components/department/DepartmentDashboard'
import ComplaintManagement from './components/department/ComplaintManagement'

// Admin
import AdminDashboard from './components/admin/AdminDashboard'
import Analytics from './components/admin/Analytics'

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-4rem)] overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const map = { student: '/student', department: '/department', admin: '/admin', pvc: '/admin' }
  return <Navigate to={map[user.role] || '/login'} replace />
}

export default function App() {
  const { loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RoleRedirect />} />

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="file-complaint" element={<FileComplaint />} />
        <Route path="complaints" element={<ComplaintList />} />
        <Route path="complaints/:id" element={<ComplaintDetail />} />
        <Route path="appeals" element={<StudentAppeals />} />
      </Route>

      {/* Department Routes */}
      <Route
        path="/department"
        element={
          <ProtectedRoute allowedRoles={['department']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DepartmentDashboard />} />
        <Route path="complaints" element={<ComplaintManagement />} />
      </Route>

      {/* Admin / PVC Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'pvc']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="users" element={<AdminDashboard />} />
        <Route path="departments" element={<AdminDashboard />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
