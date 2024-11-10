import React, { ChangeEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from "@material-tailwind/react";
import ErrorBoundary from './errors/ErrorBoundary.tsx';

interface LoginFormProps {
  onLogin: (userId: number, username: string, roles: string[], token: string) => void;
}

// Custom error class for authentication-related errors
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Custom error class for network/system errors
class SystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SystemError';
  }
}

// API request wrapper with proper error handling
const performLogin = async (username: string, password: string) => {
  let response;
  try {
    response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        username,
        password
      })
    });
  } catch (error) {
    // Network errors should propagate to ErrorBoundary
    return {
      ok: false,
      error: new SystemError('Unable to connect to the authentication service. Please try again later.')
    };
  }

  try {
    const data = await response.json();

    if (!response.ok) {
      // Authentication errors should be handled locally
      return {
        ok: false,
        error: new AuthenticationError(data.detail || 'Invalid credentials')
      };
    }

    return {
      ok: true,
      data
    };
  } catch (error) {
    // JSON parsing errors should propagate to ErrorBoundary
    return {
      ok: false,
      error: new SystemError('Received invalid response from server')
    };
  }
};

const LoginFormContent: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  useEffect(() => {
    if (searchParams.get('setup') === 'success') {
      setSuccessMessage('Password has been successfully changed. Please log in with your new credentials.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const result = await performLogin(username, password);

    if (!result.ok) {
      if (result.error instanceof AuthenticationError) {
        // Handle authentication errors locally
        setError(result.error.message);
        return;
      }
      // Let system errors propagate to ErrorBoundary
      throw result.error;
    }

    onLogin(
      result.data.user_id,
      username,
      result.data.roles,
      result.data.access_token
    );
    navigate('/dashboard');
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
            <Input
              type="text"
              label="Username"
              value={username}
              onChange={handleUsernameChange}
              labelProps={{
                className: "text-gray-700",
              }}
              containerProps={{className: "min-w-[100px]"}}
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
              crossOrigin={undefined}
            />
          </div>
          <div className="mb-4">
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={handlePasswordChange}
              labelProps={{
                className: "text-gray-700",
              }}
              containerProps={{className: "min-w-[100px]"}}
              placeholder={""}
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
              crossOrigin={undefined}
            />
          </div>
          <Button
            type="submit"
            color="blue"
            className="w-full py-2 hover:bg-blue-800"
            fullWidth
            placeholder=""
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            Login
          </Button>
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

// Wrap the form with ErrorBoundary
const LoginForm: React.FC<LoginFormProps> = (props) => (
  <ErrorBoundary>
    <LoginFormContent {...props} />
  </ErrorBoundary>
);

export default LoginForm;