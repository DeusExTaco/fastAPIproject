import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../UseAuth';
import ErrorBoundary from '../components/errors/ErrorBoundary';
import DashboardOverview from '../components/DashboardOverview';
import SettingsPage from '../components/Settings';
import ChangePasswordModal from '../components/password/ChangePasswordModal.tsx';
import type { DetailedUser } from '../types/usersTypes';
import { useNavigation } from '../contexts/NavigationContext';
import { renderUsersContent } from '../utils/renderUtils';

import {
  Users,
  Settings as SettingsIcon,
  Lock,
  LayoutDashboard,
  Bell,
  LogOut,
  User,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  roles: string[];
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
  const [activeComponent, setActiveComponent] = useState<string>('dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const { isNavExpanded, toggleNav, canExpandNav } = useNavigation();

  const handlePasswordModalOpen = () => {
    setIsPasswordModalOpen(true);
    setIsDropdownOpen(false);
  };

  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
  };

  const handleAuthError = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  // Click outside handler for dropdown
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
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8000/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessages: Record<number, string> = {
          401: 'Authentication failed. Please log in again.',
          403: 'You do not have permission to view users'
        };

        const errorMessage = errorMessages[response.status] || data.detail || 'Failed to fetch users';

        if (response.status === 401) {
          handleAuthError();
        }

        setError(errorMessage);
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

  // Initial fetch
  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Fetch when active component changes
  useEffect(() => {
    if (activeComponent === 'users') {
      void fetchUsers();
    }
  }, [activeComponent, fetchUsers]);

  const handleDeleteUser = (userId: number) => {
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
  };

  const handleUserUpdated = () => {
    setIsRefreshing(true);
    void fetchUsers().finally(() => {
      setIsRefreshing(false);
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    {id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard'},
    {id: 'users', icon: Users, label: 'Users'},
    {id: 'notifications', icon: Bell, label: 'Notifications'},
    {id: 'settings', icon: SettingsIcon, label: 'Settings'},
  ];

  const renderComponent = () => {
    switch (activeComponent) {
      case 'users':
        return (
          <ErrorBoundary>
            {renderUsersContent({
              loading,
              error,
              token,
              users,
              currentUserId: user.id,
              isRefreshing,
              onDeleteUser: handleDeleteUser,
              onAuthError: handleAuthError,
              onUserUpdated: handleUserUpdated
            })}
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <div className="bg-gray-100 dark:bg-gray-900">
            <ErrorBoundary>
              <SettingsPage />
            </ErrorBoundary>
          </div>
        );
      case 'dashboard':
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Navigation Sidebar */}
        <div className={`bg-white dark:bg-gray-800 shadow-lg transition-[width] duration-200 ease-out
          ${isNavExpanded ? 'w-52' : 'w-16'}`}>
          {/* Nav Header */}
          <div className="h-16 border-b border-gray-200 dark:border-gray-700">
            <div className="h-full flex items-center">
              <div className="w-full flex items-center">
                <div className={`transition-[width,opacity] duration-200 ease-out
                  overflow-hidden whitespace-nowrap delay-[0ms,100ms] 
                  ${isNavExpanded ? 'w-[calc(100%-4rem)] opacity-100 pl-6' : 'w-0 opacity-0'}`}>
                  <span className="font-bold text-xl dark:text-white">Admin</span>
                </div>
                {canExpandNav && (
                  <div className="w-16 flex justify-center">
                    <button
                      onClick={toggleNav}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {isNavExpanded ? (
                        <ChevronsLeft className="w-5 h-5 dark:text-white"/>
                      ) : (
                        <ChevronsRight className="w-5 h-5 dark:text-white"/>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="mt-4 px-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveComponent(item.id)}
                className="w-full text-left group"
              >
                <div className="h-14 flex items-center relative">
                  {!isNavExpanded && (
                    <div className="absolute left-0 w-16 -ml-3 flex justify-center">
                      <div className={`p-2 rounded-lg transition-colors duration-150
                        ${activeComponent === item.id
                          ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-200 group-hover:bg-gray-100 dark:group-hover:bg-gray-700'}`}>
                        <item.icon className="w-5 h-5"/>
                      </div>
                    </div>
                  )}

                  {isNavExpanded && (
                    <div className={`w-full flex items-center rounded-lg transition-colors duration-150 relative
                      ${activeComponent === item.id
                        ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-200 group-hover:bg-gray-100 dark:group-hover:bg-gray-700'}`}>
                      {activeComponent === item.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
                          bg-blue-600 dark:bg-blue-400 transition-colors duration-150"/>
                      )}
                      <div className="w-16 flex justify-center p-2">
                        <item.icon className="w-5 h-5"/>
                      </div>
                      <div className={`transition-[width,opacity] duration-200 ease-out
                        overflow-hidden whitespace-nowrap delay-[0ms,100ms]
                        ${isNavExpanded ? 'w-40 opacity-100' : 'w-0 opacity-0'}`}>
                        {item.label}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="h-16 sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-sm">
            <div className="h-full flex items-center justify-between px-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                {menuItems.find(item => item.id === activeComponent)?.label ?? 'Dashboard'}
              </h1>

              {/* User Dropdown */}
              <div className="relative h-full flex items-center">
                <button
                  id="dropdown-trigger"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400"/>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {user.username}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div
                    id="user-dropdown"
                    className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 shadow-lg
                             ring-1 ring-black ring-opacity-5 focus:outline-none z-40"
                    style={{ top: '100%' }}
                  >
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {user.roles.join(', ')}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveComponent('settings');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200
                                 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <SettingsIcon className="w-4 h-4 mr-2" />
                        Settings
                      </button>

                      <button
                        onClick={handlePasswordModalOpen}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200
                                 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </button>
                    </div>

                    <div className="py-1 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50
                                 dark:text-red-400 dark:hover:bg-red-900/10"
                      >
                    <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 p-6 overflow-y-auto dark:bg-gray-900">
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