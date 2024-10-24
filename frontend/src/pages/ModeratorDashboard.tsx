import React from 'react'
import { useNavigate } from 'react-router-dom'
import ChangePassword from '../components/ChangePassword'
import { useAuth } from '../AuthContext'

interface User {
  id: number;
  username: string;
  roles: string[];
}

interface ModeratorDashboardProps {
  user: User;
}

function ModeratorDashboard({ user }: ModeratorDashboardProps) {
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
      <h2>Moderator Dashboard</h2>
      <p>Welcome, {user.username}!</p>
      <p>Your user ID is: {user.id}</p>
      <p>Your roles: {user.roles.join(', ')}</p>
      <button onClick={handleLogout}>Logout</button>

      <h3>Moderator Features</h3>
      <ul>
        <li>Moderate User Content</li>
        <li>Review Reported Items</li>
        <li>Manage Community Guidelines</li>
      </ul>

      <ChangePassword userId={user.id} onPasswordChanged={handlePasswordChanged} />
    </div>
  )
}

export default ModeratorDashboard