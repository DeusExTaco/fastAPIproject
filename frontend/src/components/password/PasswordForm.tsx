import React, { useCallback, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import PasswordRequirements from './PasswordRequirements.tsx';
import { Button, Input } from "@material-tailwind/react";
import ErrorBoundary from '../errors/ErrorBoundary';

class PasswordError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PasswordError';
    }
}

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

interface UpdatePasswordResponse {
    require_relogin?: boolean;
    detail?: string;
}


const API_BASE_URL = 'http://localhost:8000/api';

const PasswordErrorFallback: React.FC<{ error: Error; reset: () => void }> = ({ error, reset }) => (
    <div className="w-full max-w-md mx-auto bg-red-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Password Update Failed</h3>
        <p className="text-red-600 mb-4">{error.message}</p>
        <Button
            onClick={reset}
            className="bg-red-600 hover:bg-red-700"
            placeholder=""
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
        >
            Try Again
        </Button>
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
    const [formState, setFormState] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        generatedPassword: '',
        isSubmitting: false,
        copied: false
    });
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const validatePassword = (password: string): void => {
        const errors: string[] = [];

        if (!password || password.length < 16) {
            errors.push("Password must be at least 16 characters long");
        }
        if (!password || !/[A-Z]/.test(password)) {
            errors.push("Must contain an uppercase letter");
        }
        if (!password || !/[a-z]/.test(password)) {
            errors.push("Must contain a lowercase letter");
        }
        if (!password || !/\d/.test(password)) {
            errors.push("Must contain a number");
        }
        if (!password || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push("Must contain a special character");
        }

        if (errors.length > 0) {
            throw new PasswordError(errors.join('. '));
        }
    };

    const apiRequest = async <T,>(endpoint: string, options: RequestInit): Promise<T> => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            const message = Array.isArray(data.detail)
                ? data.detail.map((error: ValidationError) => error.msg).join(', ')
                : data.detail || 'An error occurred';
            throw new PasswordError(message);
        }

        return data as T;
    };

    const isFormValid = useCallback(() => {
        try {
            const { newPassword, confirmPassword, currentPassword } = formState;
            if (newPassword !== confirmPassword) {
                return false;
            }
            validatePassword(newPassword);
            return !requireCurrentPassword || (requireCurrentPassword && currentPassword.length > 0);
        } catch {
            return false;
        }
    }, [formState, requireCurrentPassword]);

    const copyToClipboard = async () => {
        if (formState.generatedPassword) {
            try {
                await navigator.clipboard.writeText(formState.generatedPassword);
                setFormState(prev => ({ ...prev, copied: true }));
                setTimeout(() => setFormState(prev => ({ ...prev, copied: false })), 2000);
            } catch {
                throw new PasswordError('Failed to copy password to clipboard');
            }
        }
    };

    const resetForm = () => {
        setFormState(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            generatedPassword: ''
        }));
        setSuccessMessage(null);
    };

    const generateRandomPassword = async () => {
        const data = await apiRequest<{ generated_password: string }>('/auth/generate-password', {
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

        setFormState(prev => ({
            ...prev,
            generatedPassword: data.generated_password,
            newPassword: data.generated_password,
            confirmPassword: data.generated_password
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { newPassword, confirmPassword, currentPassword } = formState;

        setFormState(prev => ({ ...prev, isSubmitting: true }));
        try {
            if (newPassword !== confirmPassword) {
                throw new PasswordError("Passwords don't match");
            }

            validatePassword(newPassword);

            // Check password history if needed
            if (userId) {
                const historyCheck = await apiRequest<{ detail?: string }>('/auth/check-password-history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: userId,
                        new_password: newPassword
                    }),
                });

                if (historyCheck.detail === "Password found in history") {
                    throw new PasswordError("You cannot reuse any of your last 5 passwords");
                }
            }

            let processedToken = token;
            if (token) {
                try {
                    processedToken = atob(token);
                } catch {
                    throw new PasswordError('Invalid password reset token');
                }
            }

            const response = await apiRequest<UpdatePasswordResponse>('/auth/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    new_password: newPassword,
                    ...(processedToken ? { token: processedToken } : {}),
                    ...(userId && !processedToken ? {
                        user_id: userId,
                        current_password: currentPassword
                    } : {})
                })
            });

            setSuccessMessage('Password updated successfully!');
            resetForm();

            if (response.require_relogin) {
                setTimeout(() => {
                    setSuccessMessage('Logging out...');
                    setTimeout(onLogout, 1000);
                }, 2000);
            } else {
                setTimeout(onSuccess, 3000);
            }
        } finally {
            setFormState(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    return (
        <ErrorBoundary fallbackComponent={PasswordErrorFallback}>
            <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 dark:bg-gray-800">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 text-center dark:text-white">{title}</h2>
                </div>

                <div className="mb-6">
                    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                        {successMessage && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                                <p className="text-green-700">{successMessage}</p>
                            </div>
                        )}

                        {requireCurrentPassword && (
                            <Input
                                type="password"
                                color="blue"
                                label="Current Password"
                                value={formState.currentPassword}
                                onChange={(e) => setFormState(prev => ({
                                    ...prev,
                                    currentPassword: e.target.value
                                }))}
                                required={requireCurrentPassword}
                                labelProps={{ className: "text-gray-700" }}
                                containerProps={{ className: "min-w-[100px]" }}
                                crossOrigin={undefined}
                                placeholder=""
                                onPointerEnterCapture={() => {}}
                                onPointerLeaveCapture={() => {}}
                            />
                        )}

                        <Input
                            type="password"
                            color="blue"
                            label="New Password"
                            value={formState.newPassword}
                            onChange={(e) => setFormState(prev => ({
                                ...prev,
                                newPassword: e.target.value
                            }))}
                            required
                            labelProps={{ className: "text-gray-700" }}
                            containerProps={{ className: "min-w-[100px]" }}
                            crossOrigin={undefined}
                            placeholder=""
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}
                        />
                        <PasswordRequirements password={formState.newPassword} />

                        <Input
                            type="password"
                            color="blue"
                            label="Confirm New Password"
                            value={formState.confirmPassword}
                            onChange={(e) => setFormState(prev => ({
                                ...prev,
                                confirmPassword: e.target.value
                            }))}
                            required
                            labelProps={{ className: "text-gray-700" }}
                            containerProps={{ className: "min-w-[100px]" }}
                            crossOrigin={undefined}
                            placeholder=""
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}
                        />

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                type="submit"
                                disabled={!isFormValid() || formState.isSubmitting}
                                color="blue"
                                className="flex-1"
                                fullWidth
                                ripple={false}
                                variant={formState.isSubmitting ? "filled" : "gradient"}
                                placeholder=""
                                onPointerEnterCapture={() => {}}
                                onPointerLeaveCapture={() => {}}
                            >
                                {formState.isSubmitting ? 'Updating...' : 'Update Password'}
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
                                    disabled={formState.isSubmitting}
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
                                        value={formState.generatedPassword}
                                        className="py-2 h-8 bg-gray-50 border border-e-0 border-gray-300 text-gray-500 text-sm border-s-0 focus:ring-blue-500 focus:border-blue-500 block w-full px-3"
                                        placeholder="Click to generate a password"
                                        readOnly
                                        disabled
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={copyToClipboard}
                                    disabled={!formState.generatedPassword}
                                    variant="filled"
                                    ripple={true}
                                    placeholder=""
                                    onPointerEnterCapture={() => {}}
                                    onPointerLeaveCapture={() => {}}
                                    className="py-2 h-8 w-8 rounded-e-lg rounded-l-none flex-shrink-0 z-10 inline-flex items-center justify-center text-sm font-medium text-center text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-75 disabled:hover:bg-blue-700 p-0"
                                    aria-label="Copy to clipboard"
                                >
                                    <div className="w-4 h-4">
                                        {formState.copied ? (
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
        </ErrorBoundary>
    );
};

export default PasswordForm;