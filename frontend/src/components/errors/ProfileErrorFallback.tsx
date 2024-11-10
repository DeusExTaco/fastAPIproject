// src/components/errors/ProfileErrorFallback.tsx
import React from 'react';
import { Button } from "@material-tailwind/react";
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { ProfileServiceError } from '../../types/errors/ProfileServiceError';

interface ProfileErrorFallbackProps {
  error: Error;
  reset: () => void;
}

const ProfileErrorFallback: React.FC<ProfileErrorFallbackProps> = ({ error, reset }) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const isProfileError = error instanceof ProfileServiceError;
  const profileError = error as ProfileServiceError;

  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
        <h1 className="text-xl font-semibold text-red-700">
          {isProfileError ? 'Profile Error' : 'Something went wrong'}
        </h1>
      </div>

      <div className="text-red-600 mb-6">
        {error.message}
      </div>

      {isProfileError && profileError.details && (
        <div className="mb-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            {showDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>

          {showDetails && (
            <pre className="mt-2 p-4 bg-white rounded-md border border-red-100 text-sm text-gray-700 overflow-auto">
              {JSON.stringify(profileError.details, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <Button
            onClick={reset}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            placeholder=""
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>

        <Button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700"
          placeholder=""
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <RefreshCw className="h-4 w-4" />
          Reload Page
        </Button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6">
          <summary className="text-sm text-gray-700 cursor-pointer hover:text-gray-900">
            Stack Trace
          </summary>
          <pre className="mt-2 text-xs bg-gray-100 p-4 rounded-lg overflow-auto">
            <code>
              {error.stack}
            </code>
          </pre>
        </details>
      )}
    </div>
  );
};

export default ProfileErrorFallback;