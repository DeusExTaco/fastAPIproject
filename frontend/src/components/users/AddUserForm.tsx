import React, { useState } from "react";
import { useAuth } from '../../UseAuth';
import { X } from 'lucide-react';
import {
  Button,
  Input,
  Option,
  Select,
  SelectProps,
} from "@material-tailwind/react";

interface AddUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

enum UserRole {
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
  USER = "USER"
}

const API_BASE_URL = 'http://localhost:8000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  ok: boolean;
}

const safeApiRequest = async <T,>(
  endpoint: string,
  options: RequestInit
): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    return {
      data: data as T,
      error: !response.ok ? (data.detail || "An error occurred during the API request") : undefined,
      ok: response.ok
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      ok: false
    };
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

  const result = await safeApiRequest<{ generated_password: string }>(
    '/auth/generate-password',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    }
  );

  if (!result.ok || !result.data?.generated_password) {
    throw new Error(result.error ?? "Failed to generate password");
  }

  return result.data.generated_password;
};

const createUser = async (token: string | null, formState: typeof initialFormState) => {
  if (!token) {
    throw new Error("Authentication token missing. Please log in again.");
  }

  const password = await generateRandomPassword();

  const userData = {
    first_name: formState.firstName,
    last_name: formState.lastName,
    user_name: formState.username,
    email: formState.email,
    password,
    roles: [formState.role],
    status: "PENDING"
  };

  const result = await safeApiRequest<{ id: string }>(
    '/users',
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    }
  );

  if (!result.ok) {
    throw new Error(result.error ?? "Failed to create user");
  }

  return true;
};

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
      <p className="text-red-700">{error}</p>
      <button
        onClick={onDismiss}
        className="ml-4 text-red-400 hover:text-red-600 transition-colors"
        aria-label="Dismiss error"
      >
        <X size={18} />
      </button>
    </div>
  </div>
);

const initialFormState = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  role: UserRole.USER,
};

export const AddUserForm: React.FC<AddUserFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { token } = useAuth();
  const [formState, setFormState] = useState(initialFormState);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setShowError(false);
    setSuccessMessage(null);
    setShowSuccessMessage(false);

    try {
      await createUser(token, formState);
      showSuccessWithDelay("User created successfully! A password reset email has been sent.");
      setFormState(initialFormState);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      setShowError(true);
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
    <div className="w-full">
      {error && <ErrorMessage error={error} onDismiss={handleDismissError} show={showError} />}

      {successMessage && (
        <div
          className={`bg-green-50 border-l-4 border-green-500 p-4 mb-4 transition-opacity duration-500 ${
            showSuccessMessage ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="text"
            color={"blue"}
            label="First Name"
            value={formState.firstName}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            required
            className="w-full"
            crossOrigin={undefined}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />

          <Input
            type="text"
            color={"blue"}
            label="Last Name"
            value={formState.lastName}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            required
            className="w-full"
            crossOrigin={undefined}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />

          <Input
            type="text"
            color={"blue"}
            label="Username"
            value={formState.username}
            onChange={(e) => handleFieldChange('username', e.target.value)}
            required
            className="w-full"
            crossOrigin={undefined}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />

          <Input
            type="email"
            label="Email"
            color={"blue"}
            value={formState.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            required
            className="w-full"
            crossOrigin={undefined}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />
        </div>

        <div className="flex justify-end">
          <div className="w-full sm:w-[calc(50%-0.5rem)]">
            <Select
              value={formState.role}
              onChange={handleRoleChange}
              label="Role"
              color={"blue"}
              className="w-full"
              placeholder={""}
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
            >
              <Option value={UserRole.USER}>User</Option>
              <Option value={UserRole.MODERATOR}>Moderator</Option>
              <Option value={UserRole.ADMIN}>Admin</Option>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button
            type="button"
            onClick={onCancel}
            color="gray"
            className="px-4 py-2"
            variant="outlined"
            size="lg"
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={loading}
            color="blue"
            className="px-4 py-2 hover:bg-blue-700"
            size="md"
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            {loading ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </div>
  );
};