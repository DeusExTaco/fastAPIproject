import React, { useCallback, useState } from 'react';
import { X, Check, Copy } from 'lucide-react';
import PasswordRequirements from './PasswordRequirements.tsx';
import { Button, Input } from "@material-tailwind/react";

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
    onCancel?: () => void;
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
    if (!password || !/\d/.test(password)) {
        errors.push("Password must contain at least one number.");
    }
    if (!password || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push("Password must contain at least one special character.");
    }

    return errors;
};

const ErrorMessage: React.FC<{
    error: string;
    onDismiss: (e: React.MouseEvent<HTMLButtonElement>) => void;
    show: boolean;
}> = ({ error, onDismiss, show }) => (
    <div
        className={`bg-red-50 border-l-4 border-red-500 p-4 mb-4 transition-all duration-500 ease-in-out ${
            show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
    >
        <div className="flex justify-between items-start">
            <p className="text-red-700 text-left">{error}</p>
            <Button
                onClick={onDismiss}
                className="ml-4 text-red-400 hover:text-red-600 transition-colors focus:outline-none"
                aria-label="Dismiss error"
                variant="text"
                placeholder=""
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
            >
                <X size={18} />
            </Button>
        </div>
    </div>
);

const PasswordForm: React.FC<PasswordFormProps> = ({
    userId = null,
    token = null,
    requireCurrentPassword = false,
    onSuccess = () => {},
    onLogout = () => {},
    onCancel,
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
    const [copied, setCopied] = useState(false);

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

    const copyToClipboard = async () => {
        if (generatedPassword) {
            try {
                await navigator.clipboard.writeText(generatedPassword);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy password:', err);
            }
        }
    };

    const handleDismissError = (e: React.MouseEvent<HTMLButtonElement>) => {
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

            const historyError = await validatePasswordHistory(newPassword);
            if (historyError) {
                setError(historyError);
                setShowError(true);
                setIsSubmitting(false);
                return;
            }

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
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 text-center dark:text-white">{title}</h2>
            </div>

            <div className="mb-6">
                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                    {error && <ErrorMessage error={error} onDismiss={handleDismissError} show={showError} />}

                    {successMessage && (
                        <div className={`bg-green-50 border-l-4 border-green-500 p-4 mb-4 transition-opacity duration-500 ${
                            showSuccessMessage ? 'opacity-100' : 'opacity-0'
                        }`}>
                            <p className="text-green-700 text-left">{successMessage}</p>
                        </div>
                    )}

                    {requireCurrentPassword && (
                        <Input
                            type="password"
                            label="Current Password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required={requireCurrentPassword}
                            // className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                            labelProps={{
                                className: "text-gray-700",
                            }}
                            containerProps={{ className: "min-w-[100px" }}
                            crossOrigin={undefined}
                            placeholder=""
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}

                        />
                    )}

                    <Input
                        type="password"
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        // className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                        labelProps={{
                            className: "text-gray-700",
                        }}
                        containerProps={{ className: "min-w-[100px]" }}
                        crossOrigin={undefined}
                        placeholder=""
                        onPointerEnterCapture={() => {}}
                        onPointerLeaveCapture={() => {}}
                    />
                    <PasswordRequirements password={newPassword} />

                    <Input
                        type="password"
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        // className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                        labelProps={{
                            className: "text-gray-700",
                        }}
                        containerProps={{ className: "min-w-[100px]" }}
                        crossOrigin={undefined}
                        placeholder=""
                        onPointerEnterCapture={() => {}}
                        onPointerLeaveCapture={() => {}}
                    />

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            type="submit"
                            disabled={!isFormValid() || isSubmitting}
                            color="blue"
                            className="flex-1"
                            fullWidth
                            ripple={false}
                            variant={isSubmitting ? "filled" : "gradient"}
                            placeholder=""
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}
                        >
                            {isSubmitting ? 'Updating...' : 'Update Password'}
                        </Button>

                        {onCancel && (
                            <Button
                                type="button"
                                onClick={onCancel}
                                color="gray"
                                className="flex-1 dark:text-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                variant="outlined"
                                ripple={false}
                                placeholder=""
                                onPointerEnterCapture={() => {}}
                                onPointerLeaveCapture={() => {}}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>

                    <div className="w-full">
                        <div className="mb-2 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">Password Generator</span>
                        </div>
                        <div className="flex items-center">
                            <Button
                                type="button"
                                onClick={generateRandomPassword}
                                disabled={isSubmitting}
                                variant="filled"
                                placeholder=""
                                onPointerEnterCapture={() => {}}
                                onPointerLeaveCapture={() => {}}
                                className="flex-shrink-0 z-10 inline-flex py-2 h-8 items-center px-4 text-xs font-bold text-center text-white bg-blue-700 border hover:bg-blue-800 border-blue-700 hover:border-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-none rounded-l-lg"
                            >
                                Generate & Fill
                            </Button>
                            <div className="relative w-full">
                                <input
                                    type="text"
                                    value={generatedPassword}
                                    className="py-2 h-8 bg-gray-50 border border-e-0 border-gray-300 text-gray-500 text-sm border-s-0 focus:ring-blue-500 focus:border-blue-500 block w-full px-3"
                                    placeholder="Click to generate a password"
                                    readOnly
                                    disabled
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={copyToClipboard}
                                disabled={!generatedPassword}
                                variant="filled"
                                ripple={true}
                                placeholder=""
                                onPointerEnterCapture={() => {}}
                                onPointerLeaveCapture={() => {}}
                                className="py-2 h-8 w-8 rounded-e-lg rounded-l-none flex-shrink-0 z-10 inline-flex items-center justify-center text-sm font-medium text-center text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-75 disabled:hover:bg-blue-700 p-0"
                                aria-label="Copy to clipboard"
                            >
                                <div className="w-4 h-4">
                                    {copied ? (
                                        <Check size={16} className="text-white" />
                                    ) : (
                                        <Copy size={16} className="text-white" />
                                    )}
                                </div>
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordForm;