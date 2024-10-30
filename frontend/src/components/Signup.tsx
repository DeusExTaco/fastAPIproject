import React, { useState, useEffect } from "react";
import { useAuth } from '../UseAuth';
import { jwtDecode } from 'jwt-decode';
import ErrorBoundary from './ErrorBoundary';
import { X } from 'lucide-react';

// Types and Interfaces
interface ValidationError {
    msg: string;
}

interface DecodedToken {
    roles: string[] | string;
    sub: string;
    exp: number;
    user_id: number;
}

interface PasswordGeneratorResponse {
    generated_password: string;
}

interface UserData {
    first_name: string;
    last_name: string;
    user_name: string;
    email: string;
    password: string;
    roles: UserRole[];  // Changed from string[] to UserRole[]
    status: string;
}

interface FormState {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: UserRole;  // Make sure this is typed as UserRole
}

interface FormProps {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: UserRole;
    loading: boolean;
    error: string | null;
    showError: boolean;
    successMessage: string | null;
    showSuccessMessage: boolean;
    tokenDebugInfo: string;
    onFieldChange: (field: keyof FormState, value: string) => void;
    onSubmit: (event: React.FormEvent) => Promise<void>;
    onDismissError: () => void;
}

// Enums
enum UserRole {
    ADMIN = "ADMIN",
    MODERATOR = "MODERATOR",
    USER = "USER"
}

enum UserStatus {
    // ACTIVE = "ACTIVE",
    // INACTIVE = "INACTIVE",
    PENDING = "PENDING"
}

// API Functions
const API_BASE_URL = 'http://localhost:8000/api';

const apiRequest = async <T,>(
    endpoint: string,
    options: RequestInit
): Promise<T> => {
    try {
        console.log(`Making ${options.method} request to ${endpoint}`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        console.log('API Response:', response.status, response.statusText);

        const data = await response.json();
        console.log('API Response Data:', data);

        if (!response.ok) {
            const errorMessage = Array.isArray(data.detail)
                ? data.detail.map((err: ValidationError) => err.msg).join(", ")
                : data.detail || "An error occurred";

            console.error('API Error:', errorMessage);
            throw new Error(errorMessage);
        }

        return data as T;
    } catch (error) {
        console.error('API Request Error:', error);
        if (error instanceof Error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
        throw new Error('An unexpected error occurred');
    }
};

const generateRandomPassword = async (): Promise<string> => {
    const request = {
        length: 16,
        use_upper: true,
        use_lower: true,
        use_numbers: true,
        use_special: true,
    };

    const data = await apiRequest<PasswordGeneratorResponse>(
        '/auth/generate-password',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        }
    );
    console.log("in signup, generate password", data.generated_password)
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
            <button
                onClick={onDismiss}
                className="ml-4 text-red-400 hover:text-red-600 transition-colors focus:outline-none"
                aria-label="Dismiss error"
            >
                <X size={18} />
            </button>
        </div>
    </div>
);

// Form Component
const SignupForm: React.FC<FormProps> = ({
    firstName,
    lastName,
    username,
    email,
    role,
    loading,
    error,
    showError,
    successMessage,
    showSuccessMessage,
    // tokenDebugInfo,
    onFieldChange,
    onSubmit,
    onDismissError
}) => {
    // const renderDebugInfo = () => (
    //     process.env.NODE_ENV === 'development' && (
    //         <div className="mb-4 p-4 bg-gray-100 rounded">
    //             <p className="text-sm font-medium text-black">Debug Information:</p>
    //             <pre className="mt-2 p-2 bg-black rounded text-xs overflow-auto text-white">
    //                 {tokenDebugInfo}
    //             </pre>
    //         </div>
    //     )
    // );

    const renderFormField = (
        label: string,
        name: keyof FormState,
        type: string = "text",
        value: string
    ) => (
        <div>
            <label className="block text-gray-700 font-medium mb-2">{label}:</label>
            {type === "select" ? (
                <select
                    value={value}
                    onChange={(e) => onFieldChange(name, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {Object.values(UserRole).map((role) => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onFieldChange(name, e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            )}
        </div>
    );

    return (
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                Create New User
            </h2>

            {/*{renderDebugInfo()}*/}

            {(showError || error) && (
                <ErrorMessage
                    error={error || ""}
                    onDismiss={onDismissError}
                    show={showError}
                />
            )}

            {(showSuccessMessage || successMessage) && (
                <div className={`bg-green-50 border-l-4 border-green-500 p-4 mb-4 transition-opacity duration-500 ${
                    showSuccessMessage ? 'opacity-100' : 'opacity-0'
                }`}>
                    <p className="text-green-700 text-left">{successMessage}</p>
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
                {renderFormField("First Name", "firstName", "text", firstName)}
                {renderFormField("Last Name", "lastName", "text", lastName)}
                {renderFormField("Username", "username", "text", username)}
                {renderFormField("Email", "email", "email", email)}
                {renderFormField("Role", "role", "select", role)}

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 text-white font-semibold rounded-md transition-colors ${
                        loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                    {loading ? "Creating..." : "Create User"}
                </button>
            </form>
        </div>
    );
};

// Unauthorized Message Component
const UnauthorizedMessage: React.FC<{ tokenDebugInfo?: string }> = ({ tokenDebugInfo }) => (
    <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md mx-auto">
        <p className="text-red-500 text-center">
            {tokenDebugInfo
                ? "You do not have permission to access this page. Admin privileges required."
                : "Please log in to access this page."
            }
        </p>
        {tokenDebugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
                <p className="text-sm font-medium text-black">Debug Information:</p>
                <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                    {tokenDebugInfo}
                </pre>
            </div>
        )}
    </div>
);

// Main Component
const Signup: React.FC = () => {
    const { token } = useAuth();
    const [formState, setFormState] = useState<FormState>({
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
    const [isAdmin, setIsAdmin] = useState(false);
    const [tokenDebugInfo, setTokenDebugInfo] = useState<string>("");

    useEffect(() => {
        if (!token) {
            setIsAdmin(false);
            return;
        }

        try {
            const decodedToken = jwtDecode<DecodedToken>(token);
            setTokenDebugInfo(JSON.stringify(decodedToken, null, 2));

            const userRoles = Array.isArray(decodedToken.roles)
                ? decodedToken.roles
                : decodedToken.roles.split(',').map(r => r.trim().toUpperCase());

            setIsAdmin(userRoles.includes('ADMIN'));
        } catch (err) {
            console.error('Error decoding token:', err);
            setIsAdmin(false);
        }
    }, [token]);

    useEffect(() => {
        if (error) {
            setShowError(true);
        }
    }, [error]);

    useEffect(() => {
        return () => {
            setSuccessMessage(null);
            setShowSuccessMessage(false);
            setError(null);
            setShowError(false);
        };
    }, []);

    const handleFieldChange = (field: keyof FormState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleDismissError = () => {
        setShowError(false);
        setTimeout(() => {
            setError(null);
        }, 500);
    };

    const resetForm = () => {
        setFormState({
            firstName: "",
            lastName: "",
            username: "",
            email: "",
            role: UserRole.USER,
        });
    };

    const createUser = async (password: string): Promise<void> => {
        const userData: UserData = {
            first_name: formState.firstName,
            last_name: formState.lastName,
            user_name: formState.username,
            email: formState.email,
            password,
            roles: [formState.role],  // This should now be correctly typed
            status: UserStatus.PENDING
        };

        console.log('Creating user with data:', {
            ...userData,
            password: '[REDACTED]',
            roles: userData.roles
        });

        try {
            await apiRequest<UserData>('/users', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(userData),
            });
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error;
        }
    };

    const showSuccessWithDelay = (message: string, delay: number = 3000) => {
        setSuccessMessage(message);
        setShowSuccessMessage(true);

        const hideTimer = setTimeout(() => {
            setShowSuccessMessage(false);

            const clearTimer = setTimeout(() => {
                setSuccessMessage(null);
            }, 500);

            return () => clearTimeout(clearTimer);
        }, delay);

        return () => clearTimeout(hideTimer);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!isAdmin || !token) {
            setError("Unauthorized access");
            return;
        }

        setLoading(true);
        setError(null);
        setShowError(false);
        setShowSuccessMessage(false);
        setSuccessMessage(null);

        try {
            console.log('Starting user creation process...');
            const password = await generateRandomPassword();
            console.log('Generated password successfully');

            await createUser(password);
            console.log('User created successfully');

            resetForm();
            showSuccessWithDelay("User created successfully! A password reset email has been sent.");
        } catch (err) {
            console.error('Error in handleSubmit:', err);
            const errorMessage = err instanceof Error
                ? err.message
                : "An unexpected error occurred while creating the user";
            setError(errorMessage);
            setShowError(true);
        } finally {
            setLoading(false);
        }
    };

    if (!token || !isAdmin) {
        return <UnauthorizedMessage tokenDebugInfo={token ? tokenDebugInfo : undefined} />;
    }

    return (
        <ErrorBoundary>
            <SignupForm
                {...formState}
                loading={loading}
                error={error}
                showError={showError}
                successMessage={successMessage}
                showSuccessMessage={showSuccessMessage}
                tokenDebugInfo={tokenDebugInfo}
                onFieldChange={handleFieldChange}
                onSubmit={handleSubmit}
                onDismissError={handleDismissError}
            />
        </ErrorBoundary>
    );
};

export default Signup;