import { DetailedUser } from '../types/usersTypes';

const API_URL = 'http://localhost:8000/api';

// Request cache handling
class RequestCache {
  private readonly cache: Map<string, Promise<unknown>> = new Map();
  private readonly timeouts: Map<string, NodeJS.Timeout> = new Map();

  set(key: string, promise: Promise<unknown>, timeoutMs = 100): void {
    this.cache.set(key, promise);

    // Clear any existing timeout
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }

    // Set new timeout to clear this cache entry
    const timeout = setTimeout(() => {
      this.cache.delete(key);
      this.timeouts.delete(key);
    }, timeoutMs);

    this.timeouts.set(key, timeout);
  }

  get(key: string): Promise<unknown> | undefined {
    return this.cache.get(key);
  }

  // Keep this for potential future use or manual cache clearing
  /* istanbul ignore next */
  // clear(): void {
  //   this.cache.clear();
  //   this.timeouts.forEach(timeout => clearTimeout(timeout));
  //   this.timeouts.clear();
  // }
}

// Create a singleton instance of RequestCache
export const requestCache = new RequestCache();

// Helper function for API requests
async function makeRequest<T>(
  requestUrl: string,
  options: RequestInit,
  cacheKey?: string
): Promise<T> {
  // Only use cache for GET requests
  if (cacheKey && options.method === 'GET') {
    const cachedRequest = requestCache.get(cacheKey);
    if (cachedRequest) {
      return cachedRequest as Promise<T>;
    }
  }

  const promise = (async () => {
    const response = await fetch(requestUrl, options);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('AUTH_ERROR');
      }
      if (response.status === 403) {
        throw new Error('PERMISSION_ERROR');
      }
      const data = await response.json();
      throw new Error(data.detail || 'Request failed');
    }

    return response.json();
  })();

  if (cacheKey && options.method === 'GET') {
    requestCache.set(cacheKey, promise);
  }

  return promise as Promise<T>;
}

// API Functions
export const userService = {
  /**
   * Fetch all users
   */
  fetchUsers: async (token: string): Promise<DetailedUser[]> => {
    return makeRequest<DetailedUser[]>(
      `${API_URL}/users`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
      `users-list-${token}`
    );
  },

  /**
   * Fetch a single user by ID
   */
  fetchUserById: async (userId: number, token: string): Promise<DetailedUser> => {
    return makeRequest<DetailedUser>(
      `${API_URL}/users/${userId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
      `user-${userId}-${token}`
    );
  },

  /**
   * Delete a user
   */
  deleteUser: async (userId: number, token: string): Promise<void> => {
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
  },

  /**
   * Update a user
   */
  updateUser: async (
    userId: number,
    token: string,
    userData: Partial<DetailedUser>
  ): Promise<DetailedUser> => {
    return makeRequest<DetailedUser>(
      `${API_URL}/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      }
    );
  },
};

// Re-export individual functions for backward compatibility
export const {
  fetchUsers,
  fetchUserById,
  deleteUser,
  updateUser
} = userService;