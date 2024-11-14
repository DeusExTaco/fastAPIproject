// src/services/profileService.ts
// noinspection JSUnusedGlobalSymbols

import {Address, ErrorResponse, Profile, RequestConfig, ValidationError} from '../types/profile';
import {ProfileServiceError} from '../types/errors/ProfileServiceError';

/**
 * API configuration constants
 */
const BASE_URL = 'http://localhost:8000/api';
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Creates a promise that rejects after a specified timeout
 */
const timeoutPromise = (timeout: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeout);
  });
};


/**
 * Handles API responses and error cases
 */
const handleApiResponse = async <T extends unknown>(
  response: Response,
  requestInfo: RequestConfig
): Promise<T> => {
  if (!response.ok) {
    let errorData: ErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        detail: 'Failed to parse error response'
      };
    }

    const requestDetails = {
      method: requestInfo.method || 'GET',
      url: requestInfo.endpoint,
      timestamp: new Date().toISOString()
    };

    if (response.status === 422 || response.status === 400) {
      const validationErrors: Record<string, string[]> = {};
      if (Array.isArray(errorData.errors)) {
        errorData.errors.forEach((error: ValidationError) => {
          const field = error.loc[error.loc.length - 1];
          validationErrors[field] = validationErrors[field] || [];
          validationErrors[field].push(error.msg);
        });
      }

      return Promise.reject(
        ProfileServiceError.validationError(
          validationErrors,
          'Validation failed. Please check your input.'
        )
      );
    }

    if (response.status === 401 || response.status === 403) {
      return Promise.reject(
        ProfileServiceError.authError(
          response.status,
          errorData.detail || 'Authentication failed'
        )
      );
    }

    return Promise.reject(
      new ProfileServiceError(errorData.detail || 'API request failed', {
        status: response.status,
        originalError: errorData,
        requestInfo: requestDetails
      })
    );
  }

  if (response.status === 204) {
    return null as T;
  }

  const data = await response.json();
  return data as T;
};

/**
 * Makes an API call with retry logic
 */
const makeApiCall = async <T extends unknown>(requestConfig: RequestConfig): Promise<T> => {
  const {
    endpoint,
    method = 'GET',
    token,
    body,
    timeout = REQUEST_TIMEOUT,
    retry = true
  } = requestConfig;

  const headers: HeadersInit = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include',
    mode: 'cors'
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  let lastError: Error | null = null;
  let retries = 0;

  while (retries < (retry ? MAX_RETRIES : 1)) {
    try {
      const fetchPromise = fetch(`${BASE_URL}${endpoint}`, config);
      const response = await Promise.race([
        fetchPromise,
        timeoutPromise(timeout)
      ]);

      return await handleApiResponse<T>(response, requestConfig);
    } catch (error) {
      lastError = error as Error;

      if (error instanceof ProfileServiceError) {
        const status = (error.details.status as number) || 0;
        if (status >= 400 && status < 500 && status !== 0) {
          return Promise.reject(error);
        }
      }

      retries++;
      if (retries < MAX_RETRIES && retry) {
        await new Promise(resolve =>
          setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries - 1))
        );
        continue;
      }
      break;
    }
  }

  if (lastError instanceof TypeError && lastError.message === 'Failed to fetch') {
    return Promise.reject(ProfileServiceError.networkError(lastError));
  }

  if (lastError instanceof ProfileServiceError) {
    return Promise.reject(lastError);
  }

  return Promise.reject(
    new ProfileServiceError('Request failed', {
      originalError: lastError,
      requestInfo: {
        method,
        url: endpoint,
        timestamp: new Date().toISOString()
      }
    })
  );
};

/**
 * Prepares profile data for API submission
 */
const prepareProfileData = (profile: Partial<Profile>): Partial<Profile> => {
  const preparedData: Partial<Profile> = {};

  if (profile.avatar_url !== undefined) {
    preparedData.avatar_url = profile.avatar_url || null;
  }

  if (profile.date_of_birth !== undefined) {
    preparedData.date_of_birth = profile.date_of_birth || "";
  }

  if (profile.gender !== undefined) {
    preparedData.gender = profile.gender || "";
  }

  if (profile.phone !== undefined) {
    preparedData.phone = profile.phone || "";
  }

  if (profile.website !== undefined) {
    preparedData.website = profile.website || null;
  }

  if (profile.bio !== undefined) {
    preparedData.bio = profile.bio || "";
  }

  if (profile.privacy_settings) {
    preparedData.privacy_settings = {
      profile_visibility: profile.privacy_settings.profile_visibility || 'private',
      show_email: profile.privacy_settings.show_email === 'yes' ? 'yes' : 'no',
      show_phone: profile.privacy_settings.show_phone === 'yes' ? 'yes' : 'no'
    };
  }

  if (profile.notification_preferences) {
    preparedData.notification_preferences = {
      email: Boolean(profile.notification_preferences.email),
      push: Boolean(profile.notification_preferences.push),
      sms: Boolean(profile.notification_preferences.sms)
    };
  }

  if (profile.social_media) {
    preparedData.social_media = {...profile.social_media};
  }

  return preparedData;
};

/**
 * Profile service with CRUD operations and utilities
 */
export const profileService = {
  getProfile: async (userId: number, token: string): Promise<Profile> => {
    return makeApiCall<Profile>({
      endpoint: `/users/${userId}/profile`,
      token
    });
  },

  updateProfile: async (
    userId: number,
    token: string,
    profile: Partial<Profile>
  ): Promise<Profile> => {
    console.log('profile', profile);
    const preparedProfile = prepareProfileData(profile);
    console.log('preparedProfile', preparedProfile);
    return makeApiCall<Profile>({
      endpoint: `/users/${userId}/profile`,
      method: 'PUT',
      token,
      body: preparedProfile
    });
  },

  getAddresses: async (userId: number, token: string): Promise<Address[]> => {
    return makeApiCall<Address[]>({
      endpoint: `/users/${userId}/addresses`,
      token
    });
  },

  createAddress: async (
    userId: number,
    token: string,
    address: Omit<Address, 'id' | 'user_id'>
  ): Promise<Address> => {
    return makeApiCall<Address>({
      endpoint: `/users/${userId}/addresses`,
      method: 'POST',
      token,
      body: address
    });
  },

  updateAddress: async (
    userId: number,
    addressId: number,
    token: string,
    address: Omit<Address, 'id' | 'user_id'>
  ): Promise<Address> => {
    return makeApiCall<Address>({
      endpoint: `/users/${userId}/addresses/${addressId}`,
      method: 'PUT',
      token,
      body: address
    });
  },

  deleteAddress: async (
    userId: number,
    addressId: number,
    token: string
  ): Promise<void> => {
    await makeApiCall<void>({
      endpoint: `/users/${userId}/addresses/${addressId}`,
      method: 'DELETE',
      token
    });
  },

  /**
   * Checks the connection status with the API server
   */
  checkConnection: async (token: string): Promise<boolean> => {
    try {
      await makeApiCall<{ status: string }>({
        endpoint: '/health',
        token,
        timeout: 5000,
        retry: false
      });
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
};

/**
 * Type guard for ProfileServiceError
 */
export const isProfileServiceError = (error: unknown): error is ProfileServiceError => {
  return error instanceof ProfileServiceError;
};

/**
 * Extracts a human-readable message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
  if (isProfileServiceError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};