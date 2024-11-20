// src/components/layouts/DialogLayout.tsx
import React from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  IconButton
} from "@material-tailwind/react";
import { X } from 'lucide-react';

interface DialogLayoutProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
  error?: React.ReactNode;
}

const DialogLayout: React.FC<DialogLayoutProps> = ({
  open,
  title,
  children,
  footer,
  onClose,
  error
}) => {
  return (
    <Dialog
      open={open}
      handler={onClose}
      size="xl"
      className="h-[calc(100vh-2rem)] flex flex-col dark:bg-gray-800"
      dismiss={{ escapeKey: true, outsidePress: false }}
      placeholder={""}
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
    >
      {/* Fixed Header */}
      <DialogHeader
        className="flex justify-between items-center border-b dark:border-gray-700 shrink-0 py-2 relative z-[1]"
        placeholder={""}
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h2>
        <IconButton
          variant="text"
          color="blue-gray"
          onClick={onClose}
          className="rounded-full h-8 w-8"
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <X className="h-4 w-4" />
        </IconButton>
      </DialogHeader>

      {/* Error Display */}
      {error && (
        <div className="shrink-0 relative z-[1]">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <DialogBody
        className="flex-1 !overflow-visible p-0 relative"
        placeholder={""}
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        <div className="absolute inset-0 overflow-y-auto">
          {children}
        </div>
      </DialogBody>

      {/* Fixed Footer */}
      <DialogFooter
        className="flex justify-end gap-2 p-3 border-t rounded-b-3xl dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800 relative z-[1]"
        placeholder={""}
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        {footer}
      </DialogFooter>
    </Dialog>
  );
};

export default DialogLayout;