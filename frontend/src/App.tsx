import React, { useState } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import ModeratorDashboard from './pages/ModeratorDashboard'
import UserDashboard from './pages/UserDashboard'
import ResetPassword from './pages/ResetPassword'
import PasswordRecovery from './components/PasswordRecovery'  // Import PasswordRecovery
import { AuthProvider, useAuth } from './AuthContext'

interface User {
  id: number;
  username: string;
  roles: string[];
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

function AppContent() {
  const { isAuthenticated, login } = useAuth();
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userId: number, username: string, roles: string[]) => {
    setUser({ id: userId, username, roles });
    login(userId, username, roles);
  };

  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/dashboard" element={
          isAuthenticated && user ? <Dashboard user={user} /> : <Navigate to="/login" replace />
        } />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/password-recovery" element={<PasswordRecovery />} />  {/* Add this line */}
      </Routes>
    </div>
  )
}

function Dashboard({ user }: { user: User }) {
  if (user.roles.includes('ADMIN')) {
    return <AdminDashboard user={user} />;
  } else if (user.roles.includes('MODERATOR')) {
    return <ModeratorDashboard user={user} />;
  } else {
    return <UserDashboard user={user} />;
  }
}

export default App