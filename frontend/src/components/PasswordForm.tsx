import React, { useState } from 'react';

interface ValidationError {
  field: string;
  msg: string;
}

interface PasswordFormProps {
  userId?: number | null;
  token?: string | null;
  requireCurrentPassword?: boolean;
  onSuccess?: () => void;
  onLogout?: () => void;
  title?: string;
}

const PasswordForm: React.FC<PasswordFormProps> = ({
  userId = null,
  token = null,
  requireCurrentPassword = false,
  onSuccess = () => {},
  onLogout = () => {},
  title = "Update Password"
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setMessage('');

    if (newPassword !== confirmPassword) {
      setErrors(["New passwords don't match"]);
      return;
    }

    const requestBody = {
      new_password: newPassword,
      ...(token ? { token } : {}),
      ...(userId && !token ? {
        user_id: userId,
        current_password: currentPassword
      } : {})
    };

    try {
      const response = await fetch('http://localhost:8000/api/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password updated successfully.');
        if (data.require_relogin) {
          setTimeout(() => {
            onLogout();
          }, 2000);
        }
        onSuccess();
      } else {
        if (response.status === 422 && Array.isArray(data.detail)) {
          setErrors(data.detail.map((error: ValidationError) => error.msg));
          console.log(errors)
        } else {
          setErrors([data.detail || 'Failed to update password']);
        }
        setNewPassword('');
        setConfirmPassword('');
        if (requireCurrentPassword) {
          setCurrentPassword('');
        }
      }
    } catch (error) {
      setErrors(['An error occurred. Please try again.']);
    }
  };

  const generateRandomPassword = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/generate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          length: 16,
          use_upper: true,
          use_lower: true,
          use_numbers: true,
          use_special: true,
        }),
      });

      if (response.ok) {
        const data: { generated_password: string } = await response.json();
        setGeneratedPassword(data.generated_password);
        setNewPassword(data.generated_password);
        setConfirmPassword(data.generated_password);
      } else {
        const errorData = await response.json();
        setErrors([errorData.detail || 'Failed to generate password']);
      }
    } catch (error) {
      setErrors(['Error occurred while generating password.']);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center">{title}</h2>
      </div>

      <div className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/*Display errors in a list*/}
          {errors.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <ul className="text-red-700 list-disc pl-4">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <p className="text-green-700">{message}</p>
            </div>
          )}

          {generatedPassword && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-700">
                Generated Password: {generatedPassword}
              </p>
            </div>
          )}

          {requireCurrentPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password:
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required={requireCurrentPassword}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password:
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password:
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Password
            </button>

            <button
              type="button"
              onClick={generateRandomPassword}
              className="w-full px-4 py-2 text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Generate Random Password
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium mb-2">Password Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>At least 16 characters long</li>
              <li>At least one uppercase letter</li>
              <li>At least one lowercase letter</li>
              <li>At least one number</li>
              <li>At least one special character</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordForm;