import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Option, Select, Button, Input } from "@material-tailwind/react";
import { AlertTriangle } from 'lucide-react';

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

interface EditUserProps {
  userId: number;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
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

const fetchUserData = async (userId: number, token: string): Promise<UserData> => {
  const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to fetch user data');
  }

  return parseUserData(data);
};

const updateUserData = async (
  userId: number,
  token: string,
  updateData: Omit<UserData, 'roles'> & { roles: Role[] }
): Promise<void> => {
  const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to update user');
  }
};

export const EditUserForm: React.FC<EditUserProps> = ({
  userId,
  onClose,
  onSuccess,
  token
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData>(INITIAL_USER_DATA);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (!token) {
          setError('Authentication token missing');
          return;
        }

        const data = await fetchUserData(userId, token);
        setUserData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    void loadUserData();
  }, [userId, token]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
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

    try {
      if (!token) {
        setError('Authentication token missing');
        return;
      }

      const updateData = {
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        roles: Array.from(userData.roles),
        status: userData.status,
        user_name: userData.user_name
      };

      await updateUserData(userId, token, updateData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            name="user_name"
            type="text"
            label="Username"
            value={userData.user_name}
            onChange={handleInputChange}
            disabled
            crossOrigin={undefined}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />

          <Input
            name="email"
            type="email"
            label="Email"
            value={userData.email}
            onChange={handleInputChange}
            crossOrigin={undefined}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />

          <Input
            name="first_name"
            type="text"
            label="First Name"
            value={userData.first_name}
            onChange={handleInputChange}
            crossOrigin={undefined}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />

          <Input
            name="last_name"
            type="text"
            label="Last Name"
            value={userData.last_name}
            onChange={handleInputChange}
            crossOrigin={undefined}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles
            </label>
            {roleError && (
              <p className="text-sm text-red-600 mb-2">{roleError}</p>
            )}
            <div className="space-y-2">
              {AVAILABLE_ROLES.map((role) => (
                <label
                  key={role}
                  className="flex items-center space-x-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={userData.roles.has(role)}
                    onChange={() => handleRoleToggle(role)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span>{role.charAt(0) + role.slice(1).toLowerCase()}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Select
              value={userData.status}
              onChange={handleStatusChange}
              label="Status"
              className="w-full"
              placeholder={""}
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
            >
              <Option value="ACTIVE">Active</Option>
              <Option value="INACTIVE">Inactive</Option>
              <Option value="PENDING">Pending</Option>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button
            type="button"
            onClick={onClose}
            variant="outlined"
            color="blue"
            className="px-4 py-2"
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="blue"
            className="px-4 py-2"
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};