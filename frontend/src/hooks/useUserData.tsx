import { useState, useCallback, useRef, useEffect } from 'react';
import { DetailedUser } from '../types/usersTypes';
import { loadRefreshSettings } from '../utils/usersUtils';

const API_URL = 'http://localhost:8000/api';

interface UseUserDataReturn {
  users: DetailedUser[];
  isUpdating: boolean;
  lastUpdated: string | null;
  error: string | null;
  fetchUsers: (showLoading?: boolean) => Promise<void>;
  resetPollingTimer: () => void;
  setIsPolling: (isPolling: boolean) => void;
}

export const useUserData = (
  initialUsers: DetailedUser[],
  token: string,
  onAuthError: () => void,
  currentUserId?: number
): UseUserDataReturn => {
  // State management
  const [users, setUsers] = useState<DetailedUser[]>(initialUsers);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Refs for cleanup and polling
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch users function
  const fetchUsers = useCallback(async (showLoading = true) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    if (showLoading) {
      setIsUpdating(true);
    }

    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          onAuthError();
          throw new Error('AUTH_ERROR');
        }
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (error) {
      // Only set error if it's not an abort error
      if (error instanceof Error && error.name !== 'AbortError') {
        setError(error.message);
        if (error.message === 'AUTH_ERROR') {
          onAuthError();
        }
      }
    } finally {
      if (showLoading) {
        setIsUpdating(false);
      }
    }
  }, [token, onAuthError]);

  // Start polling function
  const startPolling = useCallback(() => {
    if (!currentUserId) return;

    const settings = loadRefreshSettings(currentUserId);
    if (settings.enabled && settings.interval) {
      // Clear existing timer if any
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }

      // Set new timer
      pollingTimerRef.current = setInterval(() => {
        void fetchUsers(false); // Don't show loading state for polling updates
      }, settings.interval * 60 * 1000); // Convert minutes to milliseconds
    }
  }, [fetchUsers, currentUserId]);

  // Stop polling function
  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  // Reset polling timer
  const resetPollingTimer = useCallback(() => {
    stopPolling();
    if (isPolling) {
      startPolling();
    }
  }, [stopPolling, startPolling, isPolling]);

  // Effect to handle polling state changes
  useEffect(() => {
    if (isPolling) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
      // Cleanup any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isPolling, startPolling, stopPolling]);

  // Effect to set initial polling state based on saved settings
  useEffect(() => {
    if (currentUserId) {
      const settings = loadRefreshSettings(currentUserId);
      setIsPolling(settings.enabled);
    }
  }, [currentUserId]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [stopPolling]);

  return {
    users,
    isUpdating,
    lastUpdated,
    error,
    fetchUsers,
    resetPollingTimer,
    setIsPolling
  };
};