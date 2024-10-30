import React, { useState, useEffect } from "react";
import { useAuth } from '../UseAuth';
import { jwtDecode } from 'jwt-decode';
import ErrorBoundary from './ErrorBoundary';

interface ValidationError {
    msg: string;
}

interface DecodedToken {
    roles: string[] | string;
    sub: string;
    exp: number;
    user_id: number;
}

enum UserRole {
    ADMIN = "ADMIN",
    MODERATOR = "MODERATOR",
    USER = "USER"
}

enum UserStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    PENDING = "PENDING"
}

const formatRole = (role: string): string => {
    return role.toUpperCase();
};

// Separate the form component to allow ErrorBoundary to catch render errors
const SignupForm: React.FC<{
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: UserRole;
    loading: boolean;
    error: string | null;
    success: boolean;
    tokenDebugInfo: string;
    setFirstName: (value: string) => void;
    setLastName: (value: string) => void;
    setUsername: (value: string) => void;
    setEmail: (value: string) => void;
    setRole: (value: UserRole) => void;
    handleSubmit: (event: React.FormEvent) => Promise<void>;
}> = ({
    firstName,
    lastName,
    username,
    email,
    role,
    loading,
    error,
    success,
    tokenDebugInfo,
    setFirstName,
    setLastName,
    setUsername,
    setEmail,
    setRole,
    handleSubmit
}) => (
    <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Create New User</h2>

        {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-4 bg-gray-100 rounded">
                <p className="text-sm font-medium text-black">Debug Information:</p>
                <pre className="mt-2 p-2 bg-black rounded text-xs overflow-auto">
                    {tokenDebugInfo}
                </pre>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-gray-700 font-medium mb-2">First Name:</label>
                <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label className="block text-gray-700 font-medium mb-2">Last Name:</label>
                <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label className="block text-gray-700 font-medium mb-2">Username:</label>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label className="block text-gray-700 font-medium mb-2">Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label className="block text-gray-700 font-medium mb-2">Role:</label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value={UserRole.USER}>USER</option>
                    <option value={UserRole.MODERATOR}>MODERATOR</option>
                    <option value={UserRole.ADMIN}>ADMIN</option>
                </select>
            </div>
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

        {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700">{error}</p>
            </div>
        )}
        {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <p className="text-green-700">
                    User created successfully! A password reset email has been sent.
                </p>
            </div>
        )}
    </div>
);

const Signup: React.FC = () => {
    const { token } = useAuth();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<UserRole>(UserRole.USER);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [tokenDebugInfo, setTokenDebugInfo] = useState<string>("");

    useEffect(() => {
        if (token) {
            const decodedToken = jwtDecode<DecodedToken>(token);
            console.log("Decoded token:", decodedToken);
            setTokenDebugInfo(JSON.stringify(decodedToken, null, 2));

            let userRoles: string[] = [];
            if (Array.isArray(decodedToken.roles)) {
                userRoles = decodedToken.roles.map(r => String(r).toUpperCase());
            } else if (typeof decodedToken.roles === 'string') {
                userRoles = decodedToken.roles.split(',').map(r => r.trim().toUpperCase());
            }

            const hasAdminRole = userRoles.includes('ADMIN');
            setIsAdmin(hasAdminRole);
        } else {
            setIsAdmin(false);
        }
    }, [token]);

    const generateRandomPassword = async (): Promise<string> => {
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

        if (!response.ok) {
            const errorMsg = `Failed to generate password: ${response.status} ${response.statusText}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        const data = await response.json();
        if (!data.generated_password) {
            throw new Error('Invalid response from password generator');
        }
        return data.generated_password;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        if (!isAdmin) {
            setError("You must have admin privileges to create new users.");
            setLoading(false);
            return;
        }

        if (!token) {
            setError("No authentication token available. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const formattedRole = formatRole(role);
            let generatedPassword: string;

            try {
                generatedPassword = await generateRandomPassword();
            } catch (passwordError) {
                const errorMessage = passwordError instanceof Error
                    ? passwordError.message
                    : "Unknown error occurred";
                setError(`Failed to generate password: ${errorMessage}. Please try again.`);
                setLoading(false);
                return;
            }

            const userData = {
                first_name: firstName,
                last_name: lastName,
                user_name: username,
                email: email,
                password: generatedPassword,
                roles: [formattedRole],
                status: UserStatus.PENDING.toUpperCase()
            };

            console.log("Creating user with data:", {
                ...userData,
                password: '[REDACTED]',
                roles: userData.roles
            });

            const response = await fetch("http://localhost:8000/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(userData),
            });

            const responseData = await response.json();

            if (response.ok) {
                setSuccess(true);
                // Reset form
                setFirstName("");
                setLastName("");
                setUsername("");
                setEmail("");
                setRole(UserRole.USER);
            } else {
                let errorMessage;
                if (Array.isArray(responseData.detail)) {
                    errorMessage = responseData.detail.map((err: ValidationError) => err.msg).join(", ");
                } else if (typeof responseData.detail === 'string') {
                    errorMessage = responseData.detail;
                } else {
                    errorMessage = "Failed to create user. Please try again.";
                }
                console.error("Error creating user:", errorMessage);
                setError(errorMessage);
            }
        } catch (error) {
            console.error("Exception in creating user:", error);
            setError(error instanceof Error ? error.message : "Error creating user. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md mx-auto">
                <p className="text-red-500 text-center">Please log in to access this page.</p>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md mx-auto">
                <p className="text-red-500 text-center">
                    You do not have permission to access this page. Admin privileges required.
                </p>
                <div className="mt-4 p-4 bg-gray-100 rounded">
                    <p className="text-sm font-medium text-black">Debug Information:</p>
                    <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
                        {tokenDebugInfo}
                    </pre>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <SignupForm
                firstName={firstName}
                lastName={lastName}
                username={username}
                email={email}
                role={role}
                loading={loading}
                error={error}
                success={success}
                tokenDebugInfo={tokenDebugInfo}
                setFirstName={setFirstName}
                setLastName={setLastName}
                setUsername={setUsername}
                setEmail={setEmail}
                setRole={setRole}
                handleSubmit={handleSubmit}
            />
        </ErrorBoundary>
    );
};

export default Signup;