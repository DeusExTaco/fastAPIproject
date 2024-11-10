import { DetailedUser } from '../types/usersTypes';

const API_URL = 'http://localhost:8000/api';

export const fetchUsers = async (token: string): Promise<DetailedUser[]> => {
  const response = await fetch(`${API_URL}/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('AUTH_ERROR');
    }
    throw new Error('Failed to fetch users');
  }

  return response.json();
};

export const deleteUser = async (userId: number, token: string): Promise<void> => {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('AUTH_ERROR');
    }
    if (response.status === 403) {
      throw new Error('PERMISSION_ERROR');
    }
    const data = await response.json();
    throw new Error(data.detail || 'Failed to delete user');
  }
};