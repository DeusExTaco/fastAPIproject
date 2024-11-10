import { useState, useCallback, useRef, useEffect } from 'react';
import { DetailedUser } from '../types/usersTypes';
import { fetchUsers } from '../services/usersService';

interface UseUserDataReturn {
  users: DetailedUser[];
  isPolling: boolean;
  setIsPolling: (value: boolean) => void;
  isUpdating: boolean;
  lastUpdated: string | null;
  error: string | null;
  fetchUsers: (force?: boolean) => Promise<void>;
  resetPollingTimer: () => void;
}

const POLLING_INTERVAL = 30000; // 30 seconds
const MIN_FETCH_INTERVAL = 2000; // 2 seconds minimum between manual fetches

export const useUserData = (
  initialUsers: DetailedUser[],
  token: string | null,
  onAuthError: () => void
): UseUserDataReturn => {
  const [users, setUsers] = useState<DetailedUser[]>(initialUsers || []);
  const [isPolling, setIsPolling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const lastFetchTimeRef = useRef<number>(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRef = useRef(token);

  // Keep token ref in sync
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const updateUsers = useCallback(async () => {
    const currentToken = tokenRef.current;
    if (!currentToken || !isMountedRef.current) return;

    try {
      const data = await fetchUsers(currentToken);

      if (!isMountedRef.current) return;

      setUsers(data);
      setLastUpdated(new Date().toUTCString());
      setError(null);
    } catch (error) {
      if (!isMountedRef.current) return;

      if (error instanceof Error) {
        if (error.message === 'AUTH_ERROR') {
          onAuthError();
          return;
        }
        setError(error.message);
      } else {
        setError('Failed to update users');
      }
      console.error('Error updating users:', error);
    }
  }, [onAuthError]);

  const fetchUsersData = useCallback(async (force: boolean = false) => {
    const currentToken = tokenRef.current;
    if (!currentToken) return;
    if (!isMountedRef.current) return;

    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      return;
    }

    lastFetchTimeRef.current = now;
    setIsUpdating(true);

    try {
      await updateUsers();
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [updateUsers]);

  const resetPollingTimer = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (isPolling && tokenRef.current) {
      pollingIntervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          void fetchUsersData(false);
        }
      }, POLLING_INTERVAL);
    }
  }, [isPolling, fetchUsersData]);

  // Set up initial fetch and polling
  useEffect(() => {
    void fetchUsersData(true);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [fetchUsersData]);

  // Handle polling state changes
  useEffect(() => {
    resetPollingTimer();
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isPolling, resetPollingTimer]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPolling) {
        void fetchUsersData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPolling, fetchUsersData]);

  // Handle unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    users,
    isPolling,
    setIsPolling,
    isUpdating,
    lastUpdated,
    error,
    fetchUsers: fetchUsersData,
    resetPollingTimer
  };
};