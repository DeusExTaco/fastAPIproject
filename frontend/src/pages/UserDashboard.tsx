import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChangePassword from '../components/ChangePassword';
import { useAuth } from '../UseAuth';

console.log("UserDashboard file loaded");

interface User {
  id: number;
  username: string;
  roles: string[];
}

interface UserDashboardProps {
  user: User;
}

function UserDashboard({ user }: Readonly<UserDashboardProps>) {
  console.log("UserDashboard rendering", { user });
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Add debugging useEffect
  useEffect(() => {
    console.log("UserDashboard mounted", {
      username: user.username,
      roles: user.roles
    });
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordChanged = () => {
    console.log('Password changed successfully');
  };

  // Verify user role
  const isUser = user.roles.some(role =>
    role.toLowerCase() === 'user'
  );

  console.log('Is regular user?', isUser);

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">User Dashboard</h2>
          <p className="text-gray-700 mb-2 text-center">Welcome, {user.username}!</p>
          <p className="text-gray-600 mb-4 text-center">User ID: {user.id}</p>
          <p className="text-gray-600 mb-8 text-center">Roles: {user.roles.join(', ')}</p>

          {/* Debug Info Section */}
          <div className="mb-4 p-4 bg-black rounded">
            <p>Debug Info:</p>
            <pre>{JSON.stringify({ user }, null, 2)}</pre>
          </div>

          {/* User Features Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">User Features</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              <li>View Profile</li>
              <li>Edit Settings</li>
              <li>Access User Content</li>
            </ul>
          </div>

          {/* Password Change Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h3>
            <ChangePassword userId={user.id} onPasswordChanged={handlePasswordChanged} />
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;