// AddUserDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
} from "@material-tailwind/react";
import { AddUserForm } from './AddUserForm';
import ErrorBoundary from '../errors/ErrorBoundary';
import { AlertTriangle } from 'lucide-react';

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ErrorWithValidation = Error & {
  msg?: string;
  detail?: string;
};

const formatErrorMessage = (error: Error): string => {
  const validationError = error as ErrorWithValidation;

  if (validationError.msg || validationError.detail) {
    return (validationError.msg ?? validationError.detail) ?? error.message;
  }

  return error.message || 'An unexpected error occurred';
};

const ErrorFallback: React.ComponentType<{ error: Error; reset: () => void }> = ({
  error,
  reset
}) => (
  <div className="p-4">
    <div className="flex items-center gap-2 mb-4">
      <AlertTriangle className="h-5 w-5 text-red-500" />
      <h3 className="text-lg font-medium text-red-700">Form Error</h3>
    </div>
    <p className="text-sm text-gray-600 mb-4">{formatErrorMessage(error)}</p>
    <button
      onClick={reset}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
    >
      Try Again
    </button>
  </div>
);

export const AddUserDialog: React.FC<AddUserDialogProps> = ({
  open,
  onClose,
  onSuccess
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
      dismiss={{
        escapeKey: true,
        outsidePress: true,
      }}
      placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
    >
      <DialogHeader
        className="text-2xl font-bold text-gray-800 p-4 border-b"
        placeholder=""
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        Add New User
      </DialogHeader>
      <DialogBody
        className="p-4"
        placeholder=""
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        <ErrorBoundary fallbackComponent={ErrorFallback}>
          <AddUserForm onSuccess={onSuccess} onCancel={onClose} />
        </ErrorBoundary>
      </DialogBody>
    </Dialog>
  );
};