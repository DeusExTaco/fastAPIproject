// src/services/profileService.ts
import { Address, Profile } from '../types/profile';

const BASE_URL = 'http://localhost:8000/api';

export const profileService = {
  async getProfile(userId: number, token: string): Promise<Profile> {
    const response = await fetch(`${BASE_URL}/users/${userId}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile data');
    }

    return response.json();
  },

  async updateProfile(
      userId: number,
      token: string,
      profile: {
        social_media: {
          twitter?: string;
          linkedin?: string;
          GitHub?: string;
          Instagram?: string;
          [p: string]: string | undefined
        }
      }
  ): Promise<Profile> {
    try {

      console.log('Sending profile update:', JSON.stringify(profile, null, 2));

      const response = await fetch(`${BASE_URL}/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);

        // Handle array of errors
        if (errorData.detail && Array.isArray(errorData.detail)) {
          throw new Error(errorData.detail.map((err: any) => err.msg || err).join(', '));
        }

        // Handle single error message
        if (typeof errorData.detail === 'string') {
          throw new Error(errorData.detail);
        }

        // Handle object error
        if (typeof errorData.detail === 'object') {
          throw new Error(JSON.stringify(errorData.detail));
        }

        throw new Error('Failed to update profile');
      }

      return response.json();
    } catch (error) {
      console.error('Profile update error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while updating the profile');
    }
  },

  async getAddresses(userId: number, token: string): Promise<Address[]> {
    const response = await fetch(`${BASE_URL}/users/${userId}/addresses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch addresses');
    }

    return response.json();
  },

  async createAddress(
    userId: number,
    token: string,
    address: Omit<Address, 'id' | 'user_id'>
  ): Promise<Address> {
    const response = await fetch(`${BASE_URL}/users/${userId}/addresses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(address),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create address');
    }

    return response.json();
  },

  async updateAddress(
    userId: number,
    addressId: number,
    token: string,
    address: Omit<Address, 'id' | 'user_id'>
  ): Promise<Address> {
    const response = await fetch(`${BASE_URL}/users/${userId}/addresses/${addressId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(address),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update address');
    }

    return response.json();
  }
};