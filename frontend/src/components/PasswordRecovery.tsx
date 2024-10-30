import React, { useState } from 'react';
import { PasswordRecoveryResult } from './PasswordRecoveryResult';

export const PasswordRecovery: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/password-recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'An error occurred while sending the recovery email.');
      }
    } catch (error) {
      console.error('Password recovery request error:', error);
      setError(
        error instanceof Error
          ? `Failed to send recovery email: ${error.message}`
          : 'An error occurred while sending the recovery email. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return <PasswordRecoveryResult email={email} />;
  }

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <img
            src={"/src/assets/PasswordRecoveryGraphic.png"}
            alt="Recovery Graphic"
            className="w-48 h-48 object-contain rounded-lg"
          />
        </div>
        <h1 className="text-center text-2xl font-bold text-gray-800 mb-6">
          Forgot your password?
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Enter your email address and we will send you instructions to reset your password.
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 font-semibold mb-2"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${
              isLoading 
                ? 'bg-blue-300 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white font-bold py-2 px-4 rounded-lg transition duration-300`}
          >
            {isLoading ? 'Sending...' : 'Continue'}
          </button>
          <div className="text-center mt-6">
            <a
              href="/"
              className="text-blue-500 hover:underline transition duration-300"
            >
              Back to Home
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordRecovery;