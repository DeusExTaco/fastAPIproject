import React, {useState} from "react";
import {useAuth} from '../UseAuth';
import ErrorBoundary from './ErrorBoundary';
import {X} from 'lucide-react';
import TextInput from "@/components/TextInput.tsx";
import {Option, Select, SelectProps} from "@material-tailwind/react";
import MaterialButton from './MaterialButton';

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
            <MaterialButton
                onClick={onDismiss}
                className="ml-4 text-red-400 hover:text-red-600 transition-colors focus:outline-none"
                aria-label="Dismiss error"
            >
                <X size={18} />
            </MaterialButton>
        </div>
    </div>
);

const Signup: React.FC = () => {
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

            await apiRequest('/users', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(userData),
            });

            showSuccessWithDelay("User created successfully! A password reset email has been sent.");
        } catch (error) {
            console.error("Error in createUser:", error);
            setError(error instanceof Error ? error.message : "An unexpected error occurred");
            setShowError(true);
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
            await createUser();
            setFormState({ firstName: "", lastName: "", username: "", email: "", role: UserRole.USER });
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
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md mx-auto">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Create New User</h2>

                {error && <ErrorMessage error={error} onDismiss={handleDismissError} show={showError} />}

                {successMessage && (
                    <div className={`bg-green-50 border-l-4 border-green-500 p-4 mb-4 transition-opacity duration-500 ${showSuccessMessage ? 'opacity-100' : 'opacity-0'}`}>
                        <p className="text-green-700 text-left">{successMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <TextInput
                        type="text"
                        label="First Name"
                        value={formState.firstName}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        required
                        className="mb-4"
                    />
                    <TextInput
                        type="text"
                        label="Last Name"
                        value={formState.lastName}
                        onChange={(e) => handleFieldChange('lastName', e.target.value)}
                        required
                        className="mb-4"
                    />
                    <TextInput
                        type="text"
                        label="Username"
                        value={formState.username}
                        onChange={(e) => handleFieldChange('username', e.target.value)}
                        required
                        className="mb-4"
                    />
                    <TextInput
                        type="email"
                        label="Email"
                        value={formState.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        required
                        className="mb-4"
                    />
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
                            <Option
                                value={UserRole.USER}
                                className="bg-white list-none"
                            >
                                User
                            </Option>
                            <Option
                                value={UserRole.MODERATOR}
                                className="bg-white list-none"
                            >
                                Moderator
                            </Option>
                            <Option
                                value={UserRole.ADMIN}
                                className="bg-white list-none"
                            >
                                Admin
                            </Option>
                        </Select>
                    <MaterialButton
                        type="submit"
                        disabled={loading}
                        color="blue"
                        className="w-full py-2"
                        fullWidth
                        variant={loading ? "filled" : "gradient"}
                    >
                        {loading ? "Creating..." : "Create User"}
                    </MaterialButton>
                </form>
            </div>
        </ErrorBoundary>
    );
};

export default Signup;
