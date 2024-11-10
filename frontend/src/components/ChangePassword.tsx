import React, {useCallback} from 'react';
import PasswordForm from './PasswordForm';
import ErrorBoundary from './errors/ErrorBoundary.tsx';
import {useAuth} from '../UseAuth'; // Add this import

interface ChangePasswordProps {
  userId: number;
  onPasswordChanged: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ userId, onPasswordChanged }) => {
  console.log('ChangePassword rendering with userId:', userId);

  const { logout } = useAuth();

  const handleSuccess = useCallback(() => {
    console.log('Password change successful');
    onPasswordChanged();
    logout();
    window.location.replace('/login');
  }, [logout, onPasswordChanged]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-md mx-auto">
          <PasswordForm
            userId={userId}
            requireCurrentPassword={true}
            onSuccess={handleSuccess}
            onLogout={logout}
            title="Change Password"
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ChangePassword;