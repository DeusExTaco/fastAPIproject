import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import TextInput from "@/components/TextInput";
import PasswordRequirements from './PasswordRequirements';
import MaterialButton from "./MaterialButton";

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

const API_BASE_URL = 'http://localhost:8000/api';

const apiRequest = async <T,>(endpoint: string, options: RequestInit): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.detail || "An error occurred";
        throw new Error(errorMessage);
    }
    return await response.json() as T;
};

const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

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

    return errors;
};

// Error Message Component
const ErrorMessage: React.FC<{
    error: string;
    onDismiss: (e: React.MouseEvent<HTMLButtonElement>) => void;  // Updated type
    show: boolean;
}> = ({ error, onDismiss, show }) => (
    <div
        className={`bg-red-50 border-l-4 border-red-500 p-4 mb-4 transition-all duration-500 ease-in-out ${
            show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
    >
        <div className="flex justify-between items-start">
            <p className="text-red-700 text-left">{error}</p>
            <MaterialButton
                onClick={onDismiss}
                className="ml-4 text-red-400 hover:text-red-600 transition-colors focus:outline-none"
                aria-label="Dismiss error"
                variant="text"
            >
                <X size={18} />
            </MaterialButton>
        </div>
    </div>
);

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
    const [error, setError] = useState<string | null>(null);
    const [showError, setShowError] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isFormValid = useCallback(() => {
        const complexityErrors = validatePassword(newPassword);
        const passwordsMatch = newPassword === confirmPassword;
        const currentPasswordValid = !requireCurrentPassword || (requireCurrentPassword && currentPassword.length > 0);
        const fieldsHaveValues = newPassword.length > 0 && confirmPassword.length > 0;

        return complexityErrors.length === 0 &&
               passwordsMatch &&
               currentPasswordValid &&
               fieldsHaveValues;
    }, [newPassword, confirmPassword, currentPassword, requireCurrentPassword]);

    const handleDismissError = (e: React.MouseEvent<HTMLButtonElement>) => {  // Updated type
        e.preventDefault();
        e.stopPropagation();

        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        setShowError(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setGeneratedPassword('');

        setTimeout(() => {
            setError(null);
        }, 500);
    };

    const showSuccessWithDelay = (message: string, delay: number = 3000) => {
        setSuccessMessage(message);
        setShowSuccessMessage(true);

        setTimeout(() => {
            setShowSuccessMessage(false);
            setTimeout(() => setSuccessMessage(null), 500);
        }, delay);
    };

    const validatePasswordHistory = async (password: string): Promise<string | null> => {
        if (!userId) return null;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/check-password-history`, {
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

            const data = await response.json();

            if (!response.ok && data.detail === "Password found in history") {
                return "You cannot reuse any of your last 5 passwords.";
            }
            return null;
        } catch (error) {
            console.error('Error checking password history:', error);
            return null;
        }
    };

    const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setNewPassword(newValue);
    };


    const generateRandomPassword = async () => {
        try {
            const data = await apiRequest<{ generated_password: string }>(
                '/auth/generate-password',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        length: 16,
                        use_upper: true,
                        use_lower: true,
                        use_numbers: true,
                        use_special: true,
                    }),
                }
            );

            setGeneratedPassword(data.generated_password);
            setNewPassword(data.generated_password);
            setConfirmPassword(data.generated_password);
        } catch (error) {
            setError(
                error instanceof Error
                    ? `Failed to generate password: ${error.message}`
                    : 'Error occurred while generating password. Please try again.'
            );
            setShowError(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setShowError(false);
        setShowSuccessMessage(false);
        setSuccessMessage(null);

        try {
            if (newPassword !== confirmPassword) {
                setError("New passwords don't match");
                setShowError(true);
                setIsSubmitting(false);
                return;
            }

            // Check password history
            const historyError = await validatePasswordHistory(newPassword);
            if (historyError) {
                setError(historyError);
                setShowError(true);
                setIsSubmitting(false);
                return;
            }

            // Base64 decode token if present
            let processedToken = token;
            try {
                if (token) {
                    processedToken = atob(token);
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

            const response = await fetch(`${API_BASE_URL}/auth/update-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (response.ok) {
                showSuccessWithDelay('Password updated successfully!');

                setNewPassword('');
                setConfirmPassword('');
                if (requireCurrentPassword) {
                    setCurrentPassword('');
                }

                if (data.require_relogin) {
                    setTimeout(() => {
                        showSuccessWithDelay('Logging out...', 1000);
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

                setError(errorMessage);
                setShowError(true);
                setNewPassword('');
                setConfirmPassword('');
                if (requireCurrentPassword) {
                    setCurrentPassword('');
                }
            }
        } catch (error) {
            console.error('Password update error:', error);
            setError(
                error instanceof Error
                    ? `Failed to update password: ${error.message}`
                    : 'An error occurred while updating password. Please try again.'
            );
            setShowError(true);
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
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                    {error && <ErrorMessage error={error} onDismiss={handleDismissError} show={showError} />}

                    {successMessage && (
                        <div className={`bg-green-50 border-l-4 border-green-500 p-4 mb-4 transition-opacity duration-500 ${showSuccessMessage ? 'opacity-100' : 'opacity-0'}`}>
                            <p className="text-green-700 text-left">{successMessage}</p>
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
                        <TextInput
                            type="password"
                            label="Current Password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required={requireCurrentPassword}
                            className="mb-4"
                        />
                    )}

                    <TextInput
                        type="password"
                        label="New Password"
                        value={newPassword}
                        onChange={handleNewPasswordChange}
                        required
                        className="mb-4"
                    />
                    <PasswordRequirements password={newPassword} />

                    <TextInput
                        type="password"
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="mb-4"
                    />

                    <div className="space-y-4">
                        <MaterialButton
                            type="submit"
                            disabled={!isFormValid() || isSubmitting}
                            color="blue"
                            className="w-full py-2"
                            fullWidth
                            variant={isSubmitting ? "filled" : "gradient"}
                        >
                            {isSubmitting ? 'Updating...' : 'Update Password'}
                        </MaterialButton>

                        <MaterialButton
                            type="button"
                            onClick={generateRandomPassword}
                            disabled={isSubmitting}
                            color="blue"
                            variant="outlined"
                            className="w-full py-2"
                            fullWidth
                        >
                            Generate Random Password
                        </MaterialButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordForm;