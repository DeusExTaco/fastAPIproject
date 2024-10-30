import React, { useState, useCallback } from 'react';
import PasswordRequirements from './PasswordRequirements';

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

const validatePassword = async (password: string, userId?: number | null): Promise<string[]> => {
  const errors: string[] = [];

  // Basic validation
  if (!password || password.length < 16) {
    errors.push("Password must be at least 16 characters long.");
  }
  if (!password || !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (!password || !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (!password || !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }
  if (!password || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }

  // Only check password history if we have both a userId and a valid password
  if (userId && password && errors.length === 0) {
    try {
      console.log("Checking password history for user:", userId);
      const response = await fetch('http://localhost:8000/api/auth/check-password-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          new_password: password
        }),
      });

      console.log("History check response status:", response.status);
      const data = await response.json();
      console.log("History check response:", data);

      if (!response.ok) {
        if (data.detail === "Password found in history") {
          errors.push("You cannot reuse any of your last 5 passwords.");
        } else {
          console.error("Password history check failed:", data.detail);
        }
      }
    } catch (error) {
      console.error('Error checking password history:', error);
    }
  }

  return errors;
};

export const PasswordForm: React.FC<PasswordFormProps> = ({
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const validatePasswordInput = useCallback(async (password: string) => {
    console.log("Validating password for user:", userId);
    setIsValidating(true);
    try {
      const errors = await validatePassword(password, userId);
      console.log("Validation errors:", errors);
      setValidationErrors(errors);
      return errors.length === 0;
    } finally {
      setIsValidating(false);
    }
  }, [userId]);

  const handleNewPasswordChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setNewPassword(newValue);
    await validatePasswordInput(newValue);
  };

  const generateRandomPassword = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/generate-password', {
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
        const data = await response.json();
        setGeneratedPassword(data.generated_password);
        setNewPassword(data.generated_password);
        setConfirmPassword(data.generated_password);
        await validatePasswordInput(data.generated_password);
      } else {
        const errorData = await response.json();
        setErrors([errorData.detail || 'Failed to generate password']);
      }
    } catch (error) {
      console.error('Password generation error:', error);
      setErrors([
        error instanceof Error
          ? `Failed to generate password: ${error.message}`
          : 'Error occurred while generating password. Please try again.'
      ]);
    }
  };


const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setMessage('');
    setShowSuccessMessage(false);
    setIsSubmitting(true);

    try {
        if (newPassword !== confirmPassword) {
            setErrors(["New passwords don't match"]);
            setIsSubmitting(false);
            return;
        }

        const isValid = await validatePasswordInput(newPassword);
        if (!isValid) {
            setErrors(validationErrors);
            setIsSubmitting(false);
            return;
        }

        // Base64 decode token if present
        let processedToken = token;
        try {
            if (token) {
                processedToken = atob(token);
                console.log('Token processing:', {
                    originalLength: token.length,
                    decodedLength: processedToken.length
                });
            }
        } catch (e) {
            console.error('Token decoding error:', e);
        }

        const requestBody = {
            new_password: newPassword,
            ...(processedToken ? { token: processedToken } : {}),
            ...(userId && !processedToken ? {
                user_id: userId,
                current_password: currentPassword
            } : {})
        };

        console.log('Request details:', {
            hasToken: !!processedToken,
            hasUserId: !!userId,
            requiresCurrentPassword: requireCurrentPassword,
            bodyStructure: {
                hasPassword: !!requestBody.new_password,
                hasToken: !!requestBody.token,
                hasUserId: !!requestBody.user_id,
                hasCurrentPassword: !!requestBody.current_password
            }
        });

        const response = await fetch('http://localhost:8000/api/auth/update-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        console.log('Response:', {
            status: response.status,
            statusText: response.statusText,
            data: data
        });

        if (response.ok) {
            setMessage('Password updated successfully!');
            setShowSuccessMessage(true);

            setNewPassword('');
            setConfirmPassword('');
            if (requireCurrentPassword) {
                setCurrentPassword('');
            }

            if (data.require_relogin) {
                setTimeout(() => {
                    setMessage('Logging out...');
                    setTimeout(() => {
                        onLogout();
                    }, 1000);
                }, 2000);
            } else {
                setTimeout(() => {
                    onSuccess();
                }, 3000);
            }
        } else {
            let errorMessage;
            if (response.status === 422 && Array.isArray(data.detail)) {
                errorMessage = data.detail.map((error: ValidationError) => error.msg).join(', ');
            } else {
                errorMessage = data.detail || 'Failed to update password';
            }

            console.error('Server error:', errorMessage);
            setErrors([errorMessage]);
            setNewPassword('');
            setConfirmPassword('');
            if (requireCurrentPassword) {
                setCurrentPassword('');
            }
        }
    } catch (error) {
        console.error('Password update error:', error);
        setErrors([
            error instanceof Error
                ? `Failed to update password: ${error.message}`
                : 'An error occurred while updating password. Please try again.'
        ]);
    } finally {
        setIsSubmitting(false);
    }
};

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center">{title}</h2>
      </div>

      <div className="mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <ul className="text-red-700 text-left pl-4">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {showSuccessMessage && message && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 transition-all duration-500">
              <p className="text-green-700 text-left">{message}</p>
            </div>
          )}

          {generatedPassword && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <p className="text-blue-700 text-left">
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
              onChange={handleNewPasswordChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <PasswordRequirements password={newPassword} />
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
              disabled={isValidating || validationErrors.length > 0 || isSubmitting}
              className={`w-full px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isValidating || validationErrors.length > 0 || isSubmitting
                  ? 'bg-indigo-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? 'Updating...' : isValidating ? 'Validating...' : 'Update Password'}
            </button>

            <button
              type="button"
              onClick={generateRandomPassword}
              disabled={isSubmitting}
              className={`w-full px-4 py-2 text-indigo-600 bg-white border border-indigo-600 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Generate Random Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordForm;