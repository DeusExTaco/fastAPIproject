import React, { useState, useEffect } from 'react';
import PasswordForm from './PasswordForm';

export const ResetPassword: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [isInitialSetup, setIsInitialSetup] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const isWelcome = params.get('welcome') === 'true';

    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setIsInitialSetup(isWelcome);
    }
  }, []);

  const handleSuccess = () => {
    setTimeout(() => {
      window.location.href = '/login';
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        {isInitialSetup ? (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-blue-700">
              Welcome! Please set up your password to complete your account creation.
            </p>
          </div>
        ) : null}

        <div className="bg-white shadow-lg rounded-lg">
          <PasswordForm
            token={token}
            onSuccess={handleSuccess}
            title={isInitialSetup ? "Set Up Your Password" : "Reset Password"}
          />
        </div>

        {token ? null : (
          <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500">
            <p className="text-yellow-700">
              Invalid or missing reset token. Please check your email link and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};