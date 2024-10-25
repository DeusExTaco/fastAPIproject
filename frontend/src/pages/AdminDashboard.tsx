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

function AdminDashboard({ user }: Readonly<AdminDashboardProps>) {
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
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg w-full text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Admin Dashboard</h2>
        <p className="text-gray-700 mb-2">Welcome, {user.username}!</p>
        <p className="text-gray-600 mb-4">User ID: {user.id}</p>
        <p className="text-gray-600 mb-8">Roles: {user.roles.join(', ')}</p>

        <h3 className="text-xl font-semibold text-gray-800 mb-4">Admin Features</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
          <li>Manage Users</li>
          <li>View System Logs</li>
          <li>Configure System Settings</li>
        </ul>

        {/* Centered ChangePassword component */}
        <ChangePassword userId={user.id} onPasswordChanged={handlePasswordChanged} />

        <button
          onClick={handleLogout}
          className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition duration-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;