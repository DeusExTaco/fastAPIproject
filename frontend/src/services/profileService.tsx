// src/services/profileService.tsx
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

  // If response status is 204 (No Content) or response doesn't have a body, return null
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null as TData;
  }

  try {
    const data = await response.json();
    return data as TData;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unexpected end of JSON input')) {
      // If the response is empty but status is OK, return null
      return null as TData;
    }
    throw error;
  }
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

"updateProfile": async (
    userId: number,
    token: string,
    profile: Partial<Profile>
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
    address: Partial<Address>
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
    address: Partial<Address>
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
  },

  deleteAddress: async (userId: number, addressId: number, token: string): Promise<void> => {
    return makeApiCall<void>(
      () => fetch(`${BASE_URL}/users/${userId}/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }),
      'Failed to delete address'
    );
  },
};