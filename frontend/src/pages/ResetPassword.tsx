import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

interface ValidationError {
    type: string;
    loc: (string | number)[];
    msg: string;
    input: string;
    ctx?: Record<string, any>;
}

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('No reset token provided.');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      setNewPassword('');
      setConfirmPassword('');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      if (response.ok) {
        setMessage('Password reset successful. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to reset password');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  };

  const generateRandomPassword = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/generate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ length: 16, use_upper: true, use_lower: true, use_numbers: true, use_special: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedPassword(data.generated_password);
        setNewPassword(data.generated_password);
        setConfirmPassword(data.generated_password);
      } else {
        setError('Failed to generate password');
      }
    } catch (error) {
      setError('Error occurred while generating password.');
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Reset Password</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {message && <p className="text-green-500 text-sm mb-4">{message}</p>}
        {generatedPassword && <p className="text-gray-500 text-sm mb-4">Generated Password: {generatedPassword}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-2">New Password:</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter new password"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">Confirm New Password:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Confirm new password"
            />
          </div>

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition duration-200">
            Reset Password
          </button>
        </form>

        <div className="flex justify-center mt-4">
          <button type="button" onClick={generateRandomPassword} className="text-indigo-600 hover:underline">
            Generate Random New Password
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
