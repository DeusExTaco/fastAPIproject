import React, { useState } from 'react';

interface PasswordRecoveryResultProps {
  email: string;
}

const PasswordRecoveryResult: React.FC<PasswordRecoveryResultProps> = ({ email }) => {
  const [resendMessage, setResendMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResendClick = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/api/resend-password-recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        setResendMessage(data.message);
      } else {
        setResendMessage('Failed to resend the email. Please try again.');
      }
    } catch (error) {
      setResendMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <img
            src={"/src/assets/EmailSentGraphic.png"}
            alt="Recovery Graphic"
            className="w-48 h-48 object-contain rounded-lg"
          />
        </div>
        <h1 className="text-center text-2xl font-bold text-gray-800 mb-6">
          Check your email
        </h1>
        <p className="text-center text-gray-600 mb-6">
          {resendMessage || (
            <>
              We sent a password recovery link to <span className="font-bold">{email}</span>.
              Please check your inbox and follow the instructions to reset your password.
            </>
          )}
        </p>
        <button
          onClick={handleResendClick}
          disabled={isLoading}
          className={`w-full ${
            isLoading 
              ? 'bg-blue-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white font-bold py-2 px-4 rounded-lg transition duration-300`}
        >
          {isLoading ? 'Sending...' : 'Resend Email'}
        </button>
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-blue-500 hover:underline transition duration-300"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default PasswordRecoveryResult;