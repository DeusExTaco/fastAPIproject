import React from 'react';
import PasswordForm from './PasswordForm';
import { useAuth } from '../AuthContext';

interface ChangePasswordProps {
  userId: number;
  onPasswordChanged?: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({
  userId,
  onPasswordChanged = () => {}
}) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <PasswordForm
        userId={userId}
        requireCurrentPassword={true}
        onSuccess={onPasswordChanged}
        onLogout={handleLogout}
        title="Change Password"
      />
    </div>
  );
};

export default ChangePassword;