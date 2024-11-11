import React, { ChangeEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input } from "@material-tailwind/react";
import ErrorBoundary from '../errors/ErrorBoundary';

interface LoginFormProps {
  onLogin: (userId: number, username: string, roles: string[], token: string) => void;
  onDialogClose?: () => void;  // Optional prop for dialog mode
}

// Custom error class for authentication-related errors
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Custom error class for network/system errors
export class SystemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SystemError';
  }
}

// API request wrapper with proper error handling
export const performLogin = async (username: string, password: string) => {
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

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, onDialogClose }) => {
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

    if (onDialogClose) {
      onDialogClose();
    }
    navigate('/dashboard');
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="w-full">
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-center text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600 text-center text-sm">{successMessage}</p>
        </div>
      )}

      <div className="mb-3">
        <Input
          type="text"
          label="Username"
          value={username}
          onChange={handleUsernameChange}
          labelProps={{
            className: "text-gray-700",
          }}
          size="md"
          containerProps={{className: "w-full"}}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
          crossOrigin={undefined}
        />
      </div>
      <div className="mb-3">
        <Input
          type="password"
          label="Password"
          value={password}
          onChange={handlePasswordChange}
          labelProps={{
            className: "text-gray-700",
          }}
          size="md"
          containerProps={{className: "w-full"}}
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
          crossOrigin={undefined}
        />
      </div>
      <Button
        type="submit"
        color="blue"
        className="w-full py-2 hover:bg-blue-800 text-sm"
        size="sm"
        fullWidth
        placeholder=""
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        Login
      </Button>
      <div className="flex justify-between items-center mt-3 text-xs">
        <Link to="/password-recovery" className="text-indigo-600 hover:underline">
          Forgot Password?
        </Link>
        {!onDialogClose && (
          <Link to="/" className="text-gray-600 hover:underline">
            Go to Home
          </Link>
        )}
      </div>
    </form>
  );

  // If we're in dialog mode, render just the form content
  if (onDialogClose) {
    return (
      <ErrorBoundary>
        <div className="w-full">{formContent}</div>
      </ErrorBoundary>
    );
  }

  // Full page version
  return (
    <ErrorBoundary>
      <div className="bg-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h2>
          {formContent}
        </div>
      </div>
    </ErrorBoundary>
  );
};