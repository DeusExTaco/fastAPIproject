// LoginDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
} from "@material-tailwind/react";
import { LoginForm } from '../login/LoginForm';
import ErrorBoundary from '../errors/ErrorBoundary';
import { AlertTriangle } from 'lucide-react';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onLogin: (userId: number, username: string, roles: string[], token: string) => void;
}

const ErrorFallback: React.FC<{ error: Error; reset: () => void }> = ({
  error,
  reset
}) => (
  <div className="p-4">
    <div className="flex items-center gap-2 mb-4">
      <AlertTriangle className="h-5 w-5 text-red-500" />
      <h3 className="text-lg font-medium text-red-700">Login Error</h3>
    </div>
    <p className="text-sm text-gray-600 mb-4">{error.message}</p>
    <button
      onClick={reset}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
    >
      Try Again
    </button>
  </div>
);

export const LoginDialog: React.FC<LoginDialogProps> = ({
  open,
  onClose,
  onLogin
}) => {
  return (
    <Dialog
      open={open}
      handler={onClose}
      animate={{
        mount: { scale: 1, opacity: 1, transition: { duration: 0.15 } },
        unmount: { scale: 0.9, opacity: 0, transition: { duration: 0.1 } },
      }}
      className="w-80"
      size="xs"
      dismiss={{
        escapeKey: true,
        outsidePress: true,
      }}
      placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
    >
      <DialogHeader
        className="text-xl font-bold text-gray-800 p-3 border-b"
        placeholder=""
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        Login
      </DialogHeader>
      <DialogBody
        className="p-3"
        placeholder=""
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        <ErrorBoundary fallbackComponent={ErrorFallback}>
            <LoginForm onLogin={onLogin} onDialogClose={onClose} />
        </ErrorBoundary>
      </DialogBody>
    </Dialog>
  );
};