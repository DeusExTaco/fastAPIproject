import React from 'react';
import { Routes, Route, Navigate} from 'react-router-dom';
import { useAuth } from './UseAuth';
import Home from './pages/Home';
import LoginPage from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ModeratorDashboard from './pages/ModeratorDashboard';
import UserDashboard from './pages/UserDashboard';
import PasswordForm from './components/PasswordForm';
import PasswordRecovery from './components/PasswordRecovery';
import ErrorBoundary from './components/errors/ErrorBoundary.tsx';
import ResetPasswordHandler from './components/ResetPassword';

// Type definitions
interface DashboardUser {
  id: number;
  username: string;
  roles: string[];
}

interface ProtectedRouteProps {
  readonly children: React.ReactNode;
}

interface DashboardProps {
  readonly user: DashboardUser;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    console.log('Protected route accessed without auth, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  console.log('Dashboard rendering for user:', { username: user.username, roles: user.roles });

  if (user.roles.includes('ADMIN')) {
    return (
      <ErrorBoundary>
        <AdminDashboard user={user} />
      </ErrorBoundary>
    );
  }

  if (user.roles.includes('MODERATOR')) {
    return (
      <ErrorBoundary>
        <ModeratorDashboard user={user} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <UserDashboard user={user} />
    </ErrorBoundary>
  );
};

// Main AppRoutes component
const AppRoutes: React.FC = () => {
  const { isAuthenticated, user, login, logout } = useAuth();

  console.log('Auth state in AppRoutes:', { isAuthenticated, hasUser: !!user });

  const handleLogin = (userId: number, username: string, roles: string[], token: string) => {
    console.log('Login handler called:', { userId, username, roles, token });
    login(userId, username, roles, token);
  };

  const handleLogout = () => {
    console.log('Logout handler called');
    logout();
  };

  const handlePasswordChangeSuccess = () => {
    console.log('Password changed successfully');
    handleLogout();
  };

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/password-recovery"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <PasswordRecovery />
            )
          }
        />
        <Route
          path="/reset-password"
          element={<ResetPasswordHandler />}
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user && <Dashboard user={user} />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              {user && (
                <PasswordForm
                  userId={user.id}
                  requireCurrentPassword={true}
                  title="Change Password"
                  onSuccess={handlePasswordChangeSuccess}
                  onLogout={handleLogout}
                />
              )}
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
};

export default AppRoutes;