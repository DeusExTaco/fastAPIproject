import React, {ChangeEvent, FormEvent, useEffect, useState} from 'react';
import {Option, Select, Button, Input} from "@material-tailwind/react";

interface EditUserProps {
    userId: number;
    onClose: () => void;
    onSuccess: () => void;
    token: string | null;
}

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';
type Role = 'ADMIN' | 'USER' | 'MODERATOR';

interface UserData {
    first_name: string;
    last_name: string;
    email: string;
    roles: Set<Role>;
    status: UserStatus;
    user_name: string;
}

interface UpdateUserData {
    first_name?: string;
    last_name?: string;
    email?: string;
    roles?: Role[];
    status?: UserStatus;
    user_name?: string;
}

type Result<T, E = Error> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: E;
};

class ApiError extends Error {
    constructor(message: string, public status?: number) {
        super(message);
        this.name = 'ApiError';
    }
}

const AVAILABLE_ROLES: Role[] = ['ADMIN', 'USER', 'MODERATOR'];
const INITIAL_USER_DATA: UserData = {
    first_name: '',
    last_name: '',
    email: '',
    roles: new Set<Role>(),
    status: 'PENDING',
    user_name: ''
};

const parseUserData = (data: any): UserData => {
    const rolesArray: Role[] = Array.isArray(data.roles)
        ? data.roles
        : (data.roles || '').split(',').map((role: string) => role.trim().toUpperCase() as Role);

    const status: UserStatus = typeof data.status === 'object' && data.status !== null && 'value' in data.status
        ? data.status.value
        : (typeof data.status === 'string' ? data.status.toUpperCase() as UserStatus : 'PENDING');

    return {
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        roles: new Set<Role>(rolesArray),
        status: status,
        user_name: data.user_name || ''
    };
};

const fetchUserData = async (userId: number, token: string): Promise<Result<UserData>> => {
    try {
        const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        const textResponse = await response.text();
        const data = JSON.parse(textResponse);

        if (!response.ok) {
            return {
                ok: false,
                error: new ApiError(data.detail || 'Failed to fetch user data', response.status)
            };
        }

        return {
            ok: true,
            value: parseUserData(data)
        };
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error : new Error('An unexpected error occurred')
        };
    }
};

const updateUserData = async (
    userId: number,
    token: string,
    data: UpdateUserData
): Promise<Result<boolean>> => {
    try {
        const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            return {
                ok: false,
                error: new ApiError(responseData.detail ?? 'Failed to update user')
            };
        }

        return { ok: true, value: true };
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error : new Error('An unexpected error occurred')
        };
    }
};

export const EditUser: React.FC<EditUserProps> = ({ userId, onClose, onSuccess, token }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [roleError, setRoleError] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData>(INITIAL_USER_DATA);
    const [originalData, setOriginalData] = useState<UserData | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadUserData = async () => {
            if (!token) {
                if (isMounted) {
                    setError('No authentication token found');
                    setLoading(false);
                }
                return;
            }

            const result = await fetchUserData(userId, token);

            if (isMounted) {
                if (!result.ok) {
                    setError(result.error.message);
                } else {
                    setUserData(result.value);
                    setOriginalData(result.value);
                    setError(null);
                }
                setLoading(false);
            }
        };

        void loadUserData();
        return () => { isMounted = false; };
    }, [userId, token]);

    const handleCancel = () => {
        if (originalData) {
            setUserData(originalData);
            setError(null);
            setRoleError(null);
        }
        onClose();
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (value: string | undefined) => {
        if (value) {
            setUserData(prev => ({ ...prev, status: value as UserStatus }));
        }
    };

    const handleRoleToggle = (role: Role) => {
        setRoleError(null);
        setUserData(prev => {
            const newRoles = new Set(prev.roles);
            if (newRoles.has(role)) {
                newRoles.delete(role);
            } else {
                newRoles.add(role);
            }
            return { ...prev, roles: newRoles };
        });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setRoleError(null);

        if (userData.roles.size === 0) {
            setRoleError('Please select at least one role');
            return;
        }

        if (!token) {
            setError('No authentication token found');
            return;
        }

        const updateData: UpdateUserData = {
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            roles: Array.from(userData.roles),
            status: userData.status,
            user_name: userData.user_name
        };

        const result = await updateUserData(userId, token, updateData);

        if (!result.ok) {
            setError(result.error.message);
            return;
        }

        onSuccess();
        onClose();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit User</h2>
            {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="user_name" className="sr-only">Username</label>
                        <Input
                            id="user_name"
                            name="user_name"
                            type="text"
                            label="Username"
                            value={userData.user_name}
                            onChange={handleInputChange}
                            disabled
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}
                            crossOrigin={undefined}
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="sr-only">Email</label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            label="Email"
                            value={userData.email}
                            onChange={handleInputChange}
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}
                            crossOrigin={undefined}
                        />
                    </div>
                    <div>
                        <label htmlFor="first_name" className="sr-only">First Name</label>
                        <Input
                            id="first_name"
                            name="first_name"
                            type="text"
                            label="First Name"
                            value={userData.first_name}
                            onChange={handleInputChange}
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}
                            crossOrigin={undefined}
                        />
                    </div>
                    <div>
                        <label htmlFor="last_name" className="sr-only">Last Name</label>
                        <Input
                            id="last_name"
                            name="last_name"
                            type="text"
                            label="Last Name"
                            value={userData.last_name}
                            onChange={handleInputChange}
                            onPointerEnterCapture={() => {}}
                            onPointerLeaveCapture={() => {}}
                            crossOrigin={undefined}
                        />
                    </div>
                    <div className="flex items-start space-x-4 mb-4">
                        <fieldset>
                            <legend className="block text-sm font-medium text-gray-700 mb-1">Roles</legend>
                            {AVAILABLE_ROLES.map((role) => (
                                <div key={role} className="flex items-center mb-1">
                                    <input
                                        type="checkbox"
                                        id={`role-${role}`}
                                        checked={userData.roles.has(role)}
                                        onChange={() => handleRoleToggle(role)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor={`role-${role}`}
                                        className="ml-2 block text-sm text-gray-700"
                                    >
                                        {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
                                    </label>
                                </div>
                            ))}
                            {roleError && (
                                <p className="text-sm text-red-600 mt-1" role="alert">{roleError}</p>
                            )}
                        </fieldset>

                        <div className="self-start mt-1">
                            <label htmlFor="status" className="sr-only">Status</label>
                            <Select
                                id="status"
                                value={userData.status}
                                onChange={handleStatusChange}
                                label="Status"
                                className="w-full text-sm"
                                placeholder=" "
                                onPointerEnterCapture={() => {}}
                                onPointerLeaveCapture={() => {}}
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
                                <Option value="ACTIVE" className="bg-white list-none">Active</Option>
                                <Option value="INACTIVE" className="bg-white list-none">Inactive</Option>
                                <Option value="PENDING" className="bg-white list-none">Pending</Option>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <Button
                        type="button"
                        onClick={handleCancel}
                        color="blue"
                        variant="outlined"
                        ripple={false}
                        placeholder=""
                        onPointerEnterCapture={() => {}}
                        onPointerLeaveCapture={() => {}}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        color="blue"
                        ripple={false}
                        placeholder=""
                        onPointerEnterCapture={() => {}}
                        onPointerLeaveCapture={() => {}}
                        className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
};