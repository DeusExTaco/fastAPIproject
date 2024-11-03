import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../UseAuth';
import UsersTable from '../components/UsersTable';
import ErrorBoundary from '../components/ErrorBoundary';
import DashboardOverview from '../components/DashboardOverview';
import SettingsPage from '../components/Settings';
// import ResetPasswordModal from '../components/ResetPassword';
import ChangePasswordModal from '../components/ChangePasswordModal';

import {
  Users,
  Settings as SettingsIcon,
  Lock,
  UserPlus,
  Menu,
  ChevronLeft,
  LayoutDashboard,
  Bell,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';

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
  const navigate = useNavigate();
  const {logout, token} = useAuth();
  const [users, setUsers] = useState<DetailedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [activeComponent, setActiveComponent] = useState<string>('dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handlePasswordModalOpen = () => {
    setIsPasswordModalOpen(true);
    setIsDropdownOpen(false); // Close dropdown if opened from there
  };

  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
  };

  const handleAuthError = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('user-dropdown');
      const trigger = document.getElementById('dropdown-trigger');
      if (
          dropdown &&
          trigger &&
          !dropdown.contains(event.target as Node) &&
          !trigger.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!token) {
      setError('No authentication token available');
      handleAuthError();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching users...'); // Debug log

      const response = await fetch('http://localhost:8000/api/users/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Received users data:', data); // Debug log

      if (!response.ok) {
        if (response.status === 403) {
          setError('You do not have permission to view users');
        } else if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          handleAuthError();
        } else {
          setError(data.detail ?? 'Failed to fetch users');
        }
        return;
      }

      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [token, handleAuthError]);

  // Fetch users when component mounts and when token changes
  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (activeComponent === 'users') {
      void fetchUsers();
    }
  }, [activeComponent, fetchUsers]);

  const refreshUserList = () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter(u => u.id !== userId));
  };


  const handleUserUpdated = () => {
    setIsRefreshing(true);
    void fetchUsers().finally(() => {
      setIsRefreshing(false);
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordChanged = () => {
    console.log('Password changed successfully');
  };

  const menuItems = [
    {id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard'},
    {id: 'users', icon: Users, label: 'Users'},
    // {
    //   id: 'reset-password',
    //   icon: Lock,
    //   label: 'Change Password',
    //   onClick: handlePasswordModalOpen
    // },
    // {id: 'create-user', icon: UserPlus, label: 'Create User'},
    {id: 'notifications', icon: Bell, label: 'Notifications'},
    {id: 'settings', icon: SettingsIcon, label: 'Settings'},
  ];

  const renderNavItems = () => (
      <nav className="mt-4">
        {menuItems.map((item) => (
            <button
                key={item.id}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else {
                    setActiveComponent(item.id);
                  }
                }}
                className={`w-full flex items-center p-4 hover:bg-gray-100 transition-colors ${
                    activeComponent === item.id ? 'bg-gray-100 text-blue-600' : 'text-gray-700'
                }`}
            >
              <item.icon size={24} className="min-w-[24px]"/>
              {isNavExpanded && (
                  <span className="ml-4 truncate">{item.label}</span>
              )}
            </button>
        ))}
      </nav>
  );

  const renderUserDropdown = () => (
      <div className="py-1">
        <button
            onClick={() => {
              setActiveComponent('settings');
              setIsDropdownOpen(false);
            }}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <SettingsIcon className="w-4 h-4 mr-2"/>
          Settings
        </button>

        <button
            onClick={handlePasswordModalOpen}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Lock className="w-4 h-4 mr-2"/>
          Change Password
        </button>
      </div>
  );


  const renderComponent = () => {
    switch (activeComponent) {
      case 'users':
        return (
            <div className="bg-white rounded-lg shadow">
              <ErrorBoundary>
                {loading ? (
                    <div className="p-4 text-center">Loading users...</div>
                ) : error ? (
                    <div className="p-4 text-red-600">{error}</div>
                ) : (
                    <UsersTable
                        users={users}
                        currentUserId={user.id}
                        isRefreshing={isRefreshing}
                        token={token}
                        onDeleteUser={handleDeleteUser}
                        onAuthError={handleAuthError}
                        setActiveComponent={setActiveComponent}
                        onUserUpdated={handleUserUpdated}
                    />
                )}
              </ErrorBoundary>
            </div>
        );
      case 'settings':
        return (
            <div className="bg-gray-100">
              <ErrorBoundary>
                <SettingsPage/>
              </ErrorBoundary>
            </div>
        );
      case 'dashboard':
        return <DashboardOverview/>;
      default:
        return <DashboardOverview/>;
    }
  };

  return (
      <>
        <div className="flex h-screen bg-gray-100">
          {/* Navigation Sidebar */}
          <div className={`bg-white shadow-lg transition-all duration-300 ${
              isNavExpanded ? 'w-64' : 'w-20'
          }`}>
            {/* Nav Header */}
            <div className="flex items-center justify-between p-4 border-b">
              {isNavExpanded && <span className="font-bold text-xl">Admin</span>}
              <button
                  onClick={() => setIsNavExpanded(!isNavExpanded)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isNavExpanded ? <ChevronLeft size={24}/> : <Menu size={24}/>}
              </button>
            </div>

            {/* Nav Items */}
            <nav className="mt-4">
              {menuItems.map((item) => (
                  <button
                      key={item.id}
                      onClick={() => {
                        if (item.onClick) {
                          item.onClick();
                        } else {
                          setActiveComponent(item.id);
                        }
                      }}
                      className={`w-full flex items-center p-4 hover:bg-gray-100 transition-colors ${
                          activeComponent === item.id ? 'bg-gray-100 text-blue-600' : 'text-gray-700'
                      }`}
                  >
                    <item.icon size={24} className="min-w-[24px]"/>
                    {isNavExpanded && (
                        <span className="ml-4 truncate">{item.label}</span>
                    )}
                  </button>
              ))}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto">
            {/* Header */}
            <header className="bg-white shadow-sm px-6 py-4">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">
                  {menuItems.find(item => item.id === activeComponent)?.label ?? 'Dashboard'}
                </h1>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                      id="dropdown-trigger"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
                  >
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="w-5 h-5 text-blue-600"/>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user.username}</span>
                    <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                            isDropdownOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {isDropdownOpen && (
                      <div
                          id="user-dropdown"
                          className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.username}</p>
                          <p className="text-xs text-gray-500 mt-1">{user.roles.join(', ')}</p>
                        </div>

                        <div className="py-1">
                          <button
                              onClick={() => {
                                setActiveComponent('settings');
                                setIsDropdownOpen(false);
                              }}
                              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <SettingsIcon className="w-4 h-4 mr-2"/>
                            Settings
                          </button>

                          <button
                              onClick={() => {
                                handlePasswordModalOpen();
                                setIsDropdownOpen(false);
                              }}
                              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Lock className="w-4 h-4 mr-2"/>
                            Change Password
                          </button>
                        </div>

                        <div className="py-1 border-t border-gray-100">
                          <button
                              onClick={handleLogout}
                              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="w-4 h-4 mr-2"/>
                            Logout
                          </button>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            </header>

            {/* Content Area */}
            <main className="p-6">
              {renderComponent()}
            </main>
          </div>
        </div>

        {/* Password Reset Modal */}
       <ChangePasswordModal
          open={isPasswordModalOpen}
          onClose={handlePasswordModalClose}
          userId={user.id}
        />
      </>
  );
}
export default AdminDashboard;