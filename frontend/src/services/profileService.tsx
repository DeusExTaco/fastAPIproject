// src/services/profileService.ts
import { Address, Profile } from '../types/profile';
import { ProfileServiceError } from '../types/errors/ProfileServiceError';

const BASE_URL = 'http://localhost:8000/api';

const handleApiResponse = async <TData,>(
  response: Response,
  errorMessage: string
): Promise<TData> => {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      return Promise.reject(new ProfileServiceError(errorMessage, errorData));
    } catch {
      return Promise.reject(new ProfileServiceError(errorMessage, null));
    }
  }

  const data = await response.json();
  return data as TData;
};

const makeApiCall = async <TData,>(
  apiCall: () => Promise<Response>,
  errorMessage: string
): Promise<TData> => {
  try {
    const response = await apiCall();
    return await handleApiResponse<TData>(response, errorMessage);
  } catch (error) {
    if (error instanceof ProfileServiceError) {
      return Promise.reject(error);
    }
    return Promise.reject(
      new ProfileServiceError(
        error instanceof Error ? error.message : errorMessage,
        { originalError: error }
      )
    );
  }
};

export const profileService = {
  getProfile: async (userId: number, token: string): Promise<Profile> => {
    return makeApiCall<Profile>(
      () => fetch(`${BASE_URL}/users/${userId}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
      'Failed to fetch profile data'
    );
  },

  updateProfile: async (
    userId: number,
    token: string,
    profile: {
      social_media: {
        twitter?: string;
        linkedin?: string;
        GitHub?: string;
        Instagram?: string;
        [p: string]: string | undefined;
      };
    }
  ): Promise<Profile> => {
    console.log('Sending profile update:', JSON.stringify(profile, null, 2));

    return makeApiCall<Profile>(
      () => fetch(`${BASE_URL}/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      }),
      'Failed to update profile'
    );
  },

  getAddresses: async (userId: number, token: string): Promise<Address[]> => {
    return makeApiCall<Address[]>(
      () => fetch(`${BASE_URL}/users/${userId}/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
      'Failed to fetch addresses'
    );
  },

  createAddress: async (
    userId: number,
    token: string,
    address: Omit<Address, 'id' | 'user_id'>
  ): Promise<Address> => {
    return makeApiCall<Address>(
      () => fetch(`${BASE_URL}/users/${userId}/addresses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(address),
      }),
      'Failed to create address'
    );
  },

  updateAddress: async (
    userId: number,
    addressId: number,
    token: string,
    address: Omit<Address, 'id' | 'user_id'>
  ): Promise<Address> => {
    return makeApiCall<Address>(
      () => fetch(`${BASE_URL}/users/${userId}/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(address),
      }),
      'Failed to update address'
    );
  }
};