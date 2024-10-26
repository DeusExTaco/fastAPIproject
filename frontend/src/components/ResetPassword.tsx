import React, { useState, useEffect } from 'react';
import PasswordForm from './PasswordForm';

const ResetPassword: React.FC = () => {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, []);

  const handleSuccess = () => {
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <PasswordForm
        token={token}
        onSuccess={handleSuccess}
        title="Reset Password"
      />
    </div>
  );
};

export default ResetPassword;