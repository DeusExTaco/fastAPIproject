import React from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
} from "@material-tailwind/react";
import { XCircle } from 'lucide-react';
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  isDeleting: boolean;
  error: string | null;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isDeleting,
  error
}) => {
  return (
    <Dialog
        open={isOpen}
        handler={onClose}
        className="bg-white rounded-xl max-w-[560px] w-full"
        animate={{
          mount: {scale: 1, y: 0},
          unmount: {scale: 0.9, y: -100},
        }}
        placeholder={undefined}
        onPointerEnterCapture={undefined}
        onPointerLeaveCapture={undefined}
    >
      <DialogHeader
          className="p-4"
          placeholder={undefined}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
      >
        <div className="flex items-center space-x-4">
          <div className={`flex h-12 w-12 flex-shrink-0 items-center 
            justify-center rounded-full
            ${error ? 'bg-red-100' : 'bg-none'}`}
          >
            {error ? (
              <XCircle className="h-6 w-6 text-red-600" />
            ) : (
              <ExclamationTriangleIcon className="h-8 w-8 text-red-800" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            {error ? 'Error Deleting User' : 'Delete User'}
          </h3>
        </div>
      </DialogHeader>

      <DialogBody
          className="px-6 pb-2"
          placeholder={undefined}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
      >
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="w-full">
            <p className="text-md text-gray-700 whitespace-nowrap">
              Are you sure you want to delete user "{userName}"? This action cannot be undone.
            </p>
          </div>
        )}
      </DialogBody>

      <DialogFooter
          className="flex justify-end space-x-2 p-4"
          placeholder={undefined}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
      >
        <Button
          variant="text"
          color="gray"
          onClick={onClose}
          className="mr-1"
          placeholder={undefined}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
        >
          {error ? 'Close' : 'Cancel'}
        </Button>

        {!error && (
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            color="red"
            className="flex items-center justify-center"
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            {isDeleting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
};

export default DeleteModal;