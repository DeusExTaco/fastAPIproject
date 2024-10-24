import React from 'react'
import { useNavigate } from 'react-router-dom'
import ChangePassword from '../components/ChangePassword'
import { useAuth } from '../AuthContext'

interface User {
  id: number;
  username: string;
  roles: string[];
}

interface AdminDashboardProps {
  user: User;
}

function AdminDashboard({ user }: AdminDashboardProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handlePasswordChanged = () => {
    console.log('Password changed successfully');
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>Welcome, {user.username}!</p>
      <p>Your user ID is: {user.id}</p>
      <p>Your roles: {user.roles.join(', ')}</p>
      <button onClick={handleLogout}>Logout</button>

      <h3>Admin Features</h3>
      <ul>
        <li>Manage Users</li>
        <li>View System Logs</li>
        <li>Configure System Settings</li>
      </ul>

      <ChangePassword
        userId={user.id}
        onPasswordChanged={handlePasswordChanged}
      />
    </div>
  )
}

export default AdminDashboard