import { useEffect } from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SubmitRequest from './pages/SubmitRequest'
import AdminDashboard from './pages/AdminDashboard'
import AdminRequestDetail from './pages/AdminRequestDetail'
import { stashReferralCode } from './utils/referral'
import { useAuth } from './context/AuthContext'

// Landing target of a shared referral link: yoursite.com/ref/ABC123
function RefCapture() {
  const { code } = useParams()
  const { user } = useAuth()
  useEffect(() => {
    stashReferralCode(code)
  }, [code])
  return <Navigate to={user ? '/submit-request' : '/login'} replace />
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/ref/:code" element={<RefCapture />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-request"
            element={
              <ProtectedRoute>
                <SubmitRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/requests/:id"
            element={
              <AdminRoute>
                <AdminRequestDetail />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
