// hooks/useUserData.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { DetailedUser } from '../types/types';

interface UseUserDataReturn {
  users: DetailedUser[];
  isPolling: boolean;
  setIsPolling: (value: boolean) => void;
  isUpdating: boolean;
  lastUpdated: string | null;
  error: string | null;
  fetchUsers: () => Promise<void>;
  resetPollingTimer: () => void;
}

export const useUserData = (
  initialUsers: DetailedUser[],
  token: string | null,
  onAuthError: () => void
): UseUserDataReturn => {
  // State
  const [users, setUsers] = useState<DetailedUser[]>(initialUsers || []);
  const [isPolling, setIsPolling] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const isMountedRef = useRef(true);
  const lastFetchTimeRef = useRef<number>(Date.now());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Constants
  const POLLING_INTERVAL = 30000; // 30 seconds
  const MIN_FETCH_INTERVAL = 2000; // 2 seconds minimum between manual fetches

  const updateUsers = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/users/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          onAuthError();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newUsers = await response.json();

      if (!isMountedRef.current) return;

      setUsers(prevUsers => {
        const prevJson = JSON.stringify(prevUsers);
        const newJson = JSON.stringify(newUsers);
        return prevJson !== newJson ? newUsers : prevUsers;
      });
      setLastUpdated(new Date().toUTCString());
    } catch (error) {
      console.error('Error updating users:', error);
      setError(error instanceof Error ? error.message : 'Failed to update users');
    }
  }, [token, onAuthError]);

  const fetchUsers = useCallback(async (force: boolean = false) => {
    if (!token || !isMountedRef.current) {
      console.log('Fetch skipped - no token or component unmounted');
      return;
    }

    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      console.log('Fetch skipped - too soon since last fetch');
      return;
    }

    lastFetchTimeRef.current = now;
    setIsUpdating(true);
    setError(null);

    try {
      await updateUsers();
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [token, updateUsers]);

  const resetPollingTimer = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          void fetchUsers(false);
        }
      }, POLLING_INTERVAL);
    }
  }, [fetchUsers]);

  // Effect for polling
  useEffect(() => {
    if (!isPolling) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    void fetchUsers(false);

    pollingIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchUsers(false);
      }
    }, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isPolling, fetchUsers]);

  // Effect for visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPolling) {
        lastFetchTimeRef.current = 0;
        void fetchUsers(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPolling, fetchUsers]);

  // Effect for initial users
  useEffect(() => {
    setUsers(initialUsers || []);
  }, [initialUsers]);

  // Effect for cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  return {
    users,
    isPolling,
    setIsPolling,
    isUpdating,
    lastUpdated,
    error,
    fetchUsers,
    resetPollingTimer
  };
};