import React from 'react';
import { Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from './UseAuth';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import ModeratorDashboard from './pages/ModeratorDashboard';
import UserDashboard from './pages/UserDashboard';
import PasswordForm from './components/password/PasswordForm';
import PasswordRecovery from './components/password/PasswordRecovery';
import ErrorBoundary from './components/errors/ErrorBoundary';
import ResetPasswordHandler from './components/password/ResetPassword';

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

interface HomeWithLoginProps {
  openLogin?: boolean;
  onLogin: (userId: number, username: string, roles: string[], token: string) => void;
}

const HomeWithLogin: React.FC<HomeWithLoginProps> = ({ openLogin = false, onLogin }) => {
  const [searchParams] = useSearchParams();
  const setupSuccess = searchParams.get('setup') === 'success';

  return <Home initialLoginOpen={openLogin || setupSuccess} onLogin={onLogin} />;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    console.log('Protected route accessed without auth, redirecting to home with login dialog');
    return <Navigate to="/?login=true" replace />;
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  console.log('Auth state in AppRoutes:', { isAuthenticated, hasUser: !!user });

  const handleLogin = (userId: number, username: string, roles: string[], token: string) => {
    console.log('Login handler called:', { userId, username, roles, token });
    login(userId, username, roles, token);
  };

  const handleLogout = () => {
    console.log('Logout handler called');
    logout();
    navigate('/');
  };

  const handlePasswordChangeSuccess = () => {
    console.log('Password changed successfully');
    handleLogout();
  };

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <HomeWithLogin
              openLogin={searchParams.get('login') === 'true'}
              onLogin={handleLogin}
            />
          }
        />
        <Route
          path="/login"
          element={<Navigate to="/?login=true" replace />}
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