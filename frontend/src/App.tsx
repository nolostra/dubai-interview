import { Routes, Route, Navigate } from 'react-router-dom'
import { getToken } from './api'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

function App() {
  const token = getToken()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/settings" element={token ? <Settings /> : <Navigate to="/login" replace />} />
      <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
