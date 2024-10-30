// src/AppRoutes.tsx
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './UseAuth';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ModeratorDashboard from './pages/ModeratorDashboard';
import UserDashboard from './pages/UserDashboard';
import PasswordForm from './components/PasswordForm';
import PasswordRecovery from './components/PasswordRecovery';
import ErrorBoundary from './components/ErrorBoundary';

const AppRoutes: React.FC = () => {
  console.log('AppRoutes rendering');
  const auth = useAuth();
  const { isAuthenticated, user, login, logout } = auth;

  console.log('Auth state in AppRoutes:', { isAuthenticated, hasUser: !!user });

  const handleLogin = (userId: number, username: string, roles: string[], token: string) => {
    console.log('Login handler called:', { userId, username, roles, token });
    login(userId, username, roles, token);
  };

  const handleLogout = () => {
    console.log('Logout handler called');
    logout();
  };

  // Protected Route wrapper component
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!isAuthenticated || !user) {
      console.log('Protected route accessed without auth, redirecting to login');
      return <Navigate to="/login" replace />;
    }
    return <ErrorBoundary>{children}</ErrorBoundary>;
  };

  const ResetPasswordWithToken = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    if (!token) {
      console.log('No reset token found, redirecting to login');
      return <Navigate to="/login" replace />;
    }

    return (
      <ErrorBoundary>
        <PasswordForm
          token={token}
          title="Reset Password"
          onSuccess={() => {
            console.log('Password reset successful');
            window.location.href = '/login';
          }}
        />
      </ErrorBoundary>
    );
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
              <Login onLogin={handleLogin} />
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
        <Route path="/reset-password" element={<ResetPasswordWithToken />} />

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
                  onSuccess={() => {
                    console.log('Password changed successfully');
                    handleLogout();
                  }}
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

// Dashboard component to handle role-based rendering
function Dashboard({ user }: { user: { id: number; username: string; roles: string[] } }) {
  console.log('Dashboard rendering for user:', { username: user.username, roles: user.roles });

  // Role-based component selection
  if (user.roles.includes('ADMIN')) {
    return (
      <ErrorBoundary>
        <AdminDashboard user={user} />
      </ErrorBoundary>
    );
  } else if (user.roles.includes('MODERATOR')) {
    return (
      <ErrorBoundary>
        <ModeratorDashboard user={user} />
      </ErrorBoundary>
    );
  } else {
    return (
      <ErrorBoundary>
        <UserDashboard user={user} />
      </ErrorBoundary>
    );
  }
}

export default AppRoutes;