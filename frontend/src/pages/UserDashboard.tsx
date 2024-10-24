import React from 'react'
import { useNavigate } from 'react-router-dom'
import ChangePassword from '../components/ChangePassword'
import { useAuth } from '../AuthContext'

interface User {
  id: number;
  username: string;
  roles: string[];
}

interface UserDashboardProps {
  user: User;
}

function UserDashboard({ user }: UserDashboardProps) {
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
      <h2>User Dashboard</h2>
      <p>Welcome, {user.username}!</p>
      <p>Your user ID is: {user.id}</p>
      <p>Your roles: {user.roles.join(', ')}</p>
      <button onClick={handleLogout}>Logout</button>

      <h3>User Features</h3>
      <ul>
        <li>View Profile</li>
        <li>Edit Settings</li>
        <li>Access User Content</li>
      </ul>

      <ChangePassword userId={user.id} onPasswordChanged={handlePasswordChanged} />
    </div>
  )
}

export default UserDashboard