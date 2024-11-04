import React, { ChangeEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {Button, Input} from "@material-tailwind/react";

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

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

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
      const response = await fetch('http://localhost:8000/api/auth/login', {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      onLogin(data.user_id, username, data.roles, data.access_token);
      navigate('/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      setError(
        error instanceof Error
          ? error.message
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
            <Input
                type="text"
                label="Username"
                value={username}
                onChange={handleUsernameChange}
                // className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                labelProps={{
                  className: "text-gray-700",
                }}
                containerProps={{className: "min-w-[100px]"}}
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
                crossOrigin={undefined}            />
          </div>
          <div className="mb-4">
            <Input
                type="password"
                label="Password"
                value={password}
                onChange={handlePasswordChange}
                // className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                labelProps={{
                  className: "text-gray-700",
                }}
                containerProps={{className: "min-w-[100px]"}}
                placeholder={""}
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
                crossOrigin={undefined}            />
          </div>
          <Button
            type="submit"
            color="blue"
            className="w-full py-2"
            variant="gradient"
            fullWidth
            placeholder=""
            onPointerEnterCapture={() => {
            }}
            onPointerLeaveCapture={() => {
            }}
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

export default LoginForm;