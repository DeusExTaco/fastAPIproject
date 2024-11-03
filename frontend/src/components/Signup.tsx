import React, { useState } from "react";
import { useAuth } from '../UseAuth';
import ErrorBoundary from './ErrorBoundary';
import { X } from 'lucide-react';
import {Button, Input, Option, Select, SelectProps} from "@material-tailwind/react";

interface SignupProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

enum UserRole {
    ADMIN = "ADMIN",
    MODERATOR = "MODERATOR",
    USER = "USER"
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

const generateRandomPassword = async (): Promise<string> => {
    const request = {
        length: 16,
        use_upper: true,
        use_lower: true,
        use_numbers: true,
        use_special: true,
    };

    const data = await apiRequest<{ generated_password: string }>(
        '/auth/generate-password',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        }
    );

    return data.generated_password;
};

// Error Message Component
const ErrorMessage: React.FC<{
    error: string;
    onDismiss: () => void;
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
                placeholder=""
                onPointerEnterCapture={() => {
                }}
                onPointerLeaveCapture={() => {
                }}
                className="ml-4 text-red-400 hover:text-red-600 transition-colors focus:outline-none"
                aria-label="Dismiss error"
            >
                <X size={18} />
            </Button>
        </div>
    </div>
);

const Signup: React.FC<SignupProps> = ({ onSuccess, onCancel }) => {
    const { token } = useAuth();
    const [formState, setFormState] = useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        role: UserRole.USER,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showError, setShowError] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const handleFieldChange = (field: keyof typeof formState, value: string) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
    };

    const handleDismissError = () => {
        setShowError(false);
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

    const createUser = async () => {
        if (!token) {
            setError("Authentication token missing. Please log in again.");
            setShowError(true);
            return;
        }
        try {
            const userData = {
                first_name: formState.firstName,
                last_name: formState.lastName,
                user_name: formState.username,
                email: formState.email,
                password: await generateRandomPassword(),
                roles: [formState.role],
                status: "PENDING"
            };

            const response = await fetch(`${API_BASE_URL}/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to create user");
            }

            const responseData = await response.json();

            if (responseData) {
                showSuccessWithDelay("User created successfully! A password reset email has been sent.");
                // Only return true if the user was actually created
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error in createUser:", error);
            setError(error instanceof Error ? error.message : "An unexpected error occurred");
            setShowError(true);
            return false;
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setShowError(false);
        setShowSuccessMessage(false);
        setSuccessMessage(null);

        try {
            const success = await createUser();
            if (success) {
                setFormState({ firstName: "", lastName: "", username: "", email: "", role: UserRole.USER });
                if (onSuccess) {
                    onSuccess();
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange: SelectProps["onChange"] = (value) => {
        if (value) {
            handleFieldChange('role', value as UserRole);
        }
    };

    return (
        <ErrorBoundary>
            <div className="w-full max-w-md mx-auto">
                {error && <ErrorMessage error={error} onDismiss={handleDismissError} show={showError} />}

                {successMessage && (
                    <div className={`bg-green-50 border-l-4 border-green-500 p-4 mb-4 transition-opacity duration-500 ${showSuccessMessage ? 'opacity-100' : 'opacity-0'}`}>
                        <p className="text-green-700 text-left">{successMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Input
                            type="text"
                            label="First Name"
                            value={formState.firstName}
                            onChange={(e) => handleFieldChange('firstName', e.target.value)}
                            required
                            // className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                            labelProps={{
                                className: "text-gray-700",
                            }}
                            containerProps={{className: "min-w-[100px]"}}
                            crossOrigin={undefined}
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}
                        />
                    </div>
                    <div>
                        <Input
                            type="text"
                            label="Last Name"
                            value={formState.lastName}
                            onChange={(e) => handleFieldChange('lastName', e.target.value)}
                            required
                            // className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                            labelProps={{
                                className: "text-gray-700",
                            }}
                            containerProps={{className: "min-w-[100px]"}}
                            crossOrigin={undefined}
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}
                        />
                    </div>
                    <div>
                        <Input
                            type="text"
                            label="Username"
                            value={formState.username}
                            onChange={(e) => handleFieldChange('username', e.target.value)}
                            required
                            // className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                            labelProps={{
                                className: "text-gray-700",
                            }}
                            containerProps={{className: "min-w-[100px]"}}
                            crossOrigin={undefined}
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}
                        />
                    </div>
                    <div>
                        <Input
                            type="email"
                            label="Email"
                            value={formState.email}
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                            required
                            // className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-gray-900 focus:!border-t-gray-900 focus:ring-gray-900/10"
                            labelProps={{
                                className: "text-gray-700",
                            }}
                            containerProps={{className: "min-w-[100px]"}}
                            crossOrigin={undefined}
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}
                        />
                    </div>
                    <div>
                        <Select
                            value={formState.role}
                            onChange={handleRoleChange}
                            label="Role"
                            className="w-full"
                            placeholder=" "
                            onPointerEnterCapture={() => {
                            }}
                            onPointerLeaveCapture={() => {
                            }}
                            lockScroll={true}
                            selected={(element) =>
                                element &&
                                React.cloneElement(element, {
                                    disabled: false,
                                    className: "text-gray-900 list-none",
                                })
                            }
                            menuProps={{
                                className: "[&>ul]:p-0 [&>ul>li]:px-3 [&>ul>li]:py-2 [&>ul>li]:text-gray-900 [&>ul>li.selected]:bg-white [&>ul>li]:bg-white [&>ul>li:hover]:bg-blue-gray-50 [&>ul>li:hover]:text-blue-gray-900 [&>ul>li]:list-none"
                            }}
                            containerProps={{
                                className: "[&>span]:list-none"
                            }}
                        >
                            <Option value={UserRole.USER} className="bg-white list-none">
                                User
                            </Option>
                            <Option value={UserRole.MODERATOR} className="bg-white list-none">
                                Moderator
                            </Option>
                            <Option value={UserRole.ADMIN} className="bg-white list-none">
                                Admin
                            </Option>
                        </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <Button
                            type="submit"
                            disabled={loading}
                            color="blue"
                            className="flex-1"
                            variant="gradient"
                            size="lg"
                            placeholder=""
                            onPointerEnterCapture={() => {
                            }}
                            onPointerLeaveCapture={() => {
                            }}
                        >
                            {loading ? "Creating..." : "Create User"}
                        </Button>

                        <Button
                            type="button"
                            onClick={onCancel}
                            color="gray"
                            className="flex-1"
                            variant="outlined"
                            size="lg"
                            placeholder=""
                            onPointerEnterCapture={() => {
                            }}
                            onPointerLeaveCapture={() => {
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </ErrorBoundary>
    );
};

export default Signup;