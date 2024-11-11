import React from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
} from "@material-tailwind/react";
import { EditUserForm } from './EditUserForm';
import ErrorBoundary from '../errors/ErrorBoundary';
import { AlertTriangle } from 'lucide-react';

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: number;
  token: string | null;
}

const ErrorFallback: React.FC<{ error: Error; reset: () => void }> = ({
  error,
  reset
}) => (
  <div className="p-4">
    <div className="flex items-center gap-2 mb-4">
      <AlertTriangle className="h-5 w-5 text-red-500" />
      <h3 className="text-lg font-medium text-red-700">Form Error</h3>
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

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  open,
  onClose,
  onSuccess,
  userId,
  token
}) => {
  return (
    <Dialog
      open={open}
      handler={onClose}
      animate={{
          mount: { scale: 1, opacity: 1, transition: { duration: 0.15 } },
          unmount: { scale: 0.9, opacity: 0, transition: { duration: 0.1 } },
        }}
      className="flex-auto"
      placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
      dismiss={{
        escapeKey: true,
        outsidePress: false,
      }}
    >
      <DialogHeader
          className="text-2xl font-bold text-gray-800 p-4 border-b"
          placeholder=""
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
      >
        Edit User
      </DialogHeader>
      <DialogBody
          className="p-4"
          placeholder=""
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
      >
        <ErrorBoundary fallbackComponent={ErrorFallback}>
          <EditUserForm
            userId={userId}
            onClose={onClose}
            onSuccess={onSuccess}
            token={token}
          />
        </ErrorBoundary>
      </DialogBody>
    </Dialog>
  );
};