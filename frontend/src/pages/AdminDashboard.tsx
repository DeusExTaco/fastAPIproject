import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ChangePassword from '../components/ChangePassword';
import Signup from '../components/Signup';
import { useAuth } from '../UseAuth';
import EditUser from '../components/EditUser';

console.log("AdminDashboard file loaded");

interface User {
  id: number;
  username: string;
  roles: string[];
}

interface DetailedUser {
  id: number;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface AdminDashboardProps {
  user: User;
}

function AdminDashboard({ user }: Readonly<AdminDashboardProps>) {
  console.log("AdminDashboard rendering", {user});
  const navigate = useNavigate();
  const {logout, token} = useAuth();
  const [users, setUsers] = useState<DetailedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortField, setSortField] = useState<keyof DetailedUser>('user_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const isUserAdmin = user.roles.some(role =>
      role.toLowerCase() === 'admin'
  );

  const handleAuthError = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const fetchUsers = useCallback(async () => {
    try {
      if (!users.length) {
        setLoading(true);
      }
      setError(null);

      if (!token) {
        setError('No authentication token available');
        handleAuthError();
        return;
      }

      console.log('Fetching users');
      const response = await fetch('http://localhost:8000/api/users/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          setError('You do not have permission to view users');
        } else if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          handleAuthError();
        } else {
          setError(data.detail || 'Failed to fetch users');
        }
        return;
      }

      console.log('Fetched users successfully:', {
        count: data.length,
        sampleUser: data[0] ? {
          id: data[0].id,
          username: data[0].user_name,
          roles: data[0].roles
        } : null
      });

      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      let errorMessage = 'Failed to fetch users';

      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [token, users.length, handleAuthError]);

  useEffect(() => {
    console.log("AdminDashboard mounted", {
      username: user.username,
      roles: user.roles
    });
    if (isUserAdmin) {
      void fetchUsers();
    }
  }, [user, refreshTrigger, token, isUserAdmin, fetchUsers]);

  const refreshUserList = () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSort = (field: keyof DetailedUser) => {
    if (sortField === field) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
    if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${userName}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          setError('You do not have permission to delete users');
          return;
        } else if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          handleAuthError();
          return;
        }
        setError(errorData.detail || 'Failed to delete user');
        return;
      }

      setUsers(users.filter(u => u.id !== userId));
      console.log(`User ${userName} deleted successfully`);
    } catch (err) {
      console.error('Error deleting user:', err);
      let errorMessage = 'Failed to delete user';

      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleEditUser = (userId: number) => {
    setEditingUserId(userId);
  };

  const handleUserUpdated = () => {
    setEditingUserId(null);
    refreshUserList();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordChanged = () => {
    console.log('Password changed successfully');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBadgeClass = (roles: string | string[] | null) => {
    if (!roles) return 'bg-gray-100 text-gray-800';

    const roleList = Array.isArray(roles)
        ? roles.map(r => r.toLowerCase())
        : roles.toLowerCase().split(',').map(r => r.trim());

    if (roleList.includes('admin')) return 'bg-red-100 text-red-800';
    if (roleList.includes('moderator')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
};

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const SortIcon = ({field}: { field: keyof DetailedUser }) => {
    if (sortField !== field) return <span className="ml-1">↕</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  if (!isUserAdmin) {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-700">You do not have admin privileges to view this dashboard.</p>
            <button
                onClick={handleLogout}
                className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="bg-gray-100 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white shadow-lg rounded-lg p-8">
            {/* Header Section */}
            <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">Admin Dashboard</h2>
            <p className="text-gray-700 mb-2 text-center">Welcome, {user.username}!</p>
            <p className="text-gray-600 mb-4 text-center">User ID: {user.id}</p>
            <p className="text-gray-600 mb-8 text-center">Roles: {user.roles.join(', ')}</p>

            {/* Users Table Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">User Management</h3>
                <div className="flex items-center gap-2">
                  {isRefreshing && (
                      <div className="text-sm text-gray-500">Refreshing...</div>
                  )}
                  <button
                      onClick={refreshUserList}
                      disabled={loading || isRefreshing}
                      className={`inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ${
                          (loading || isRefreshing) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    {isRefreshing ? (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
                             fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                  strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                    )}
                    Refresh
                  </button>
                </div>
              </div>

              {loading && !users.length ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading users...</p>
                  </div>
              ) : error ? (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={refreshUserList}
                        className="mt-2 text-red-600 hover:text-red-800 underline"
                    >
                      Try Again
                    </button>
                  </div>
              ) : (
                  <div
                      className={`overflow-x-auto rounded-lg border border-gray-200 shadow-sm transition-opacity duration-200 ${
                          isRefreshing ? 'opacity-50' : 'opacity-100'
                      }`}>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                      <tr>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('user_name')}
                        >
                          User <SortIcon field="user_name"/>
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('email')}
                        >
                          Email <SortIcon field="email"/>
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('roles')}
                        >
                          Role <SortIcon field="roles"/>
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('status')}
                        >
                          Status <SortIcon field="status"/>
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('created_at')}
                        >
                          Created <SortIcon field="created_at"/>
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('last_login')}
                        >
                          Last Login <SortIcon field="last_login"/>
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {sortedUsers.map((tableUser) => (
                          <tr key={tableUser.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {tableUser.first_name} {tableUser.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {tableUser.user_name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{tableUser.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeClass(tableUser.roles)}`}>
                                  {Array.isArray(tableUser.roles)
                                      ? tableUser.roles.join(', ').toUpperCase()
                                      : String(tableUser.roles).toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                          <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(tableUser.status)}`}>
                            {tableUser.status}
                          </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(tableUser.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(tableUser.last_login)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                  onClick={() => handleEditUser(tableUser.id)}
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                  title="Edit user"
                              >
                                Edit
                              </button>
                              <button
                                  onClick={() => handleDeleteUser(tableUser.id, tableUser.user_name)}
                                  className={`text-red-600 hover:text-red-900 ${tableUser.id === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  disabled={tableUser.id === user.id}
                                  title={tableUser.id === user.id ? "You cannot delete your own account" : "Delete user"}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              )}
            </div>

            {/* Password Change Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h3>
              <ChangePassword userId={user.id} onPasswordChanged={handlePasswordChanged}/>
            </div>

            {/* Create User Section */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New User</h3>
              <p className="text-gray-600 mb-4">Create new user accounts with specific roles and permissions.</p>
              <Signup/>
            </div>

            {/* Logout Button */}
            <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Edit User Modal */}
        {editingUserId && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 w-full max-w-4xl">
                <EditUser
                    userId={editingUserId}
                    onClose={() => setEditingUserId(null)}
                    onUserUpdated={handleUserUpdated}
                />
              </div>
            </div>
        )}
      </div>
  );
}


export default AdminDashboard;