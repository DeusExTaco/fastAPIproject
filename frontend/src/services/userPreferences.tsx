import { UserPreferences, UserPreferencesUpdate } from '../types/userPreferences';

const API_BASE_URL = 'http://localhost:8000/api';

export const userPreferencesService = {
  async getUserPreferences(userId: number, token: string): Promise<UserPreferences> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/preferences`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user preferences');
    }

    return response.json();
  },

  async updateUserPreferences(
    userId: number,
    preferences: UserPreferencesUpdate,
    token: string
  ): Promise<UserPreferences> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/preferences`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      throw new Error('Failed to update user preferences');
    }

    return response.json();
  },
};