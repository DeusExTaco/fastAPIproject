import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {useAuth} from "../AuthContext";


interface ChangePasswordProps {
  userId: number;
  onPasswordChanged: () => void;
}

interface ValidationError {
    type: string;
    loc: (string | number)[];
    msg: string;
    input: string;
    ctx?: Record<string, any>; // Optional context
}


const ChangePassword: React.FC<ChangePasswordProps> = ({ userId, onPasswordChanged }) => {
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const { logout } = useAuth();
  const navigate = useNavigate();

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); // Reset error state
    setSuccess(''); // Reset success state

    if (newPassword !== confirmPassword) {
        setError("New passwords don't match");
        setNewPassword('');
        setConfirmPassword('');
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                current_password: currentPassword,
                new_password: newPassword,
            }),
        });

        if (response.ok) {
            setSuccess('Password changed successfully. You will now be logged out.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setGeneratedPassword('');
            onPasswordChanged();

            // Delay logout and navigation by 2 seconds
            setTimeout(() => {
              logout(); // Log the user out
              navigate('/login'); // Redirect to login page
            }, 3000);
        } else {
            const errorData = await response.json(); // Parse the error response
            setNewPassword('');
            setConfirmPassword('');
            // Extract and display the error messages
            if (errorData.detail && Array.isArray(errorData.detail)) {
                const messages = errorData.detail.map((err: ValidationError) => err.msg).join(', '); // Specify type for err
                setError(messages); // Set the error message
            } else {
                setError('Failed to change password'); // Fallback error message
            }
        }
    } catch (error) {
        console.error("Fetch Error:", error); // Log any fetch errors
        setError('An error occurred changing your password. Please try again.'); // General error message
    }
};

  // Function to handle random password generation
  const generateRandomPassword = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/generate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          length: 16, // You can customize these options as needed
          use_upper: true,
          use_lower: true,
          use_numbers: true,
          use_special: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedPassword(data.generated_password);
        setNewPassword(data.generated_password);
        setConfirmPassword(data.generated_password);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to generate password');
      }
    } catch (error) {
      setError('An error occurred while generating password. Please try again.');
    }
  };

   return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Change Password</h3>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
        {generatedPassword && <p className="text-gray-500 text-sm mb-4">Generated Password: {generatedPassword}</p>}

        <div className="mb-4">
          <label htmlFor="currentPassword" className="block text-gray-700 font-medium mb-2">Current Password:</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter current password"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-2">New Password:</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
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
            autoComplete="new-password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Confirm new password"
          />
        </div>

        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition duration-200">
          Change Password
        </button>

        <div className="flex justify-center mt-4">
          <button type="button" onClick={generateRandomPassword} className="text-indigo-600 hover:underline">
            Generate Random New Password
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
