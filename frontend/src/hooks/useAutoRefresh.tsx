// src/hooks/useAutoRefresh.ts

import { useState, useEffect, useCallback } from 'react';

interface RefreshSettings {
  enabled: boolean;
  interval: number;
}

interface UseAutoRefreshProps {
  onRefresh: () => Promise<void>;
  defaultInterval?: number;
  defaultEnabled?: boolean;
}

export function useAutoRefresh({
  onRefresh,
  defaultInterval = 10,
  defaultEnabled = true
}: UseAutoRefreshProps) {
  const [settings, setSettings] = useState<RefreshSettings>({
    enabled: defaultEnabled,
    interval: defaultInterval
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await onRefresh();
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setLoading(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!settings.enabled) return;

    const intervalId = setInterval(() => {
      refresh();
    }, settings.interval * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [settings, refresh]);

  return {
    settings,
    setSettings,
    lastRefresh,
    loading,
    error,
    refresh
  };
}