// src/components/ui/alert.tsx

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export const Alert: React.FC<AlertProps> = ({ children, variant = 'info' }) => {
  const variants = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    error: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${variants[variant]}`}
      role="alert"
    >
      <AlertTriangle className="h-5 w-5" />
      <div className="flex-1">{children}</div>
    </div>
  );
};