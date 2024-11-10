import React from 'react';
import { Dialog } from "@material-tailwind/react";
import { useAuth } from '../UseAuth';
import PasswordForm from './PasswordForm';
import ErrorBoundary from './errors/ErrorBoundary.tsx';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  userId: number;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  open,
  onClose,
  userId
}) => {
  const { logout } = useAuth();

  const handleSuccess = () => {
    console.log('Password change successful');
    setTimeout(() => {
      logout();
      window.location.replace('/login');
    }, 3000);
  };

  return (
    <Dialog
      open={open}
      handler={onClose}
      className="bg-transparent shadow-none"
      size="md"
      dismiss={{
        enabled: true,
        escapeKey: true,
        outsidePress: true
      }}
      placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
    >
      <ErrorBoundary>
        <div className="h-full w-full px-4">
          <PasswordForm
            userId={userId}
            requireCurrentPassword={true}
            onSuccess={handleSuccess}
            onLogout={logout}
            onCancel={onClose}
            title="Change Password"
          />
        </div>
      </ErrorBoundary>
    </Dialog>
  );
};

export default ChangePasswordModal;