import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

interface LoginFormProps {
  onLogin: (userId: number, username: string, roles: string[], token: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('setup') === 'success') {
      setSuccessMessage('Password has been set up successfully. Please log in with your new credentials.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
        console.log('Attempting login with username:', username);
        const response = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response data:', {
            ...data,
            access_token: data.access_token ? '[REDACTED]' : undefined
        });

        if (response.ok) {
            console.log("Login successful");
            console.log("User roles:", data.roles);
            onLogin(data.user_id, username, data.roles, data.access_token);
            navigate('/dashboard');
        } else {
            console.error('Login failed:', data);
            setError(data.detail || 'Login failed');
            // Add additional error details if available
            if (data.message) {
                console.error('Error message:', data.message);
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        setError(
            error instanceof Error
                ? `Authentication failed: ${error.message}`
                : 'An error occurred during login. Please try again.'
        );
    }
};

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <form onSubmit={handleSubmit}>
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-center text-sm">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-center text-sm">{successMessage}</p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
              Username:
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg"
          >
            Login
          </button>
        </form>

        <div className="flex justify-between items-center mt-4 text-sm">
          <Link to="/password-recovery" className="text-indigo-600 hover:underline">
            Forgot Password?
          </Link>
          <Link to="/" className="text-gray-600 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
