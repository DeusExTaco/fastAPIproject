import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../UseAuth';
import { fetchPerformanceMetrics } from '../services/perfromanceService.tsx';
import {
  Cpu, Clock, AlertTriangle, MemoryStick, Shield, Globe
} from 'lucide-react';

import { StatCard } from './dashboard/StatCard';
import RefreshControls from './dashboard/RefreshControls.tsx';
import {
  SystemResourcesChart,
  ConnectionMetricsChart,
  AuthenticationChart,
  DurationChart,
  EndpointStatsChart,
  IpStatsChart
} from './dashboard/charts';

import { SystemStatus } from './dashboard/SystemStatus';
import { ConnectionDetails } from './dashboard/ConnectionDetails';

import {
  processTimeSeriesData,
  processConnectionMetrics,
  calculateAuthRate
} from '../utils/dashboardUtils';

import {
  loadRefreshSettings,
  saveRefreshSettings,
  DEFAULT_REFRESH_SETTINGS,
  clearRefreshSettings
} from '../utils/dashboardSettings';

import type { PerformanceData, RefreshSettings } from '../types/dashboardTypes';

const DashboardOverview: React.FC = () => {
  const { token, user } = useAuth();
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [refreshSettings, setRefreshSettings] = useState<RefreshSettings>(() =>
    loadRefreshSettings(user?.id ?? '')
  );

  // Process time series data
  const timeSeriesData = useMemo(() =>
    processTimeSeriesData(performanceData?.metrics),
    [performanceData?.metrics]
  );

  // Process connection metrics
  const connectionMetrics = useMemo(() =>
    processConnectionMetrics(performanceData?.metrics),
    [performanceData?.metrics]
  );

  // Process authentication data
  const authData = useMemo(() => {
    if (!performanceData?.summary?.last_24h) return [];
    const { authenticated_connections = 0, anonymous_connections = 0 } = performanceData.summary.last_24h;
    return [
      { name: 'Authenticated', value: authenticated_connections, color: '#4F46E5' },
      { name: 'Anonymous', value: anonymous_connections, color: '#E5E7EB' }
    ];
  }, [performanceData?.summary?.last_24h]);

  // Process endpoint statistics
  const endpointStatsData = useMemo(() => {
    if (!performanceData?.summary?.last_24h?.endpoint_stats) return [];
    return Object.entries(performanceData.summary.last_24h.endpoint_stats)
      .map(([endpoint, stats]) => ({
        endpoint,
        requests: stats.requests,
        avgDuration: stats.avg_duration,
        authRate: stats.auth_rate,
      }))
      .sort((a, b) => b.requests - a.requests);
  }, [performanceData?.summary?.last_24h?.endpoint_stats]);

  // Process IP statistics
  const ipStatsData = useMemo(() => {
    if (!performanceData?.summary?.last_24h?.ip_stats) return [];
    return Object.entries(performanceData.summary.last_24h.ip_stats)
      .map(([ip, stats]) => ({
        ip,
        requests: stats.requests,
        endpoints: stats.endpoints.length,
        rateLimited: stats.rate_limited_count,
      }))
      .sort((a, b) => b.requests - a.requests);
  }, [performanceData?.summary?.last_24h?.ip_stats]);

  const updateRefreshSettings = useCallback((newSettings: Partial<RefreshSettings>) => {
    setRefreshSettings(current => {
      const updatedSettings = { ...current, ...newSettings };
      saveRefreshSettings(user?.id ?? '', updatedSettings);
      return updatedSettings;
    });
  }, [user?.id]);

  const resetSettings = useCallback(() => {
    clearRefreshSettings(user?.id ?? '');
    setRefreshSettings(DEFAULT_REFRESH_SETTINGS);
  }, [user?.id]);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (!token) return;

    try {
      if (isManualRefresh) setManualLoading(true);
      setLoading(true);
      const data = await fetchPerformanceMetrics(token);
      setPerformanceData(data);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
    } finally {
      setLoading(false);
      if (isManualRefresh) setManualLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      void fetchData();
    }
  }, [token, fetchData]);

  useEffect(() => {
    if (!refreshSettings.enabled || !token || !user?.id) return;

    const intervalId = setInterval(() => {
      void fetchData(false);
    }, refreshSettings.interval * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [refreshSettings.enabled, refreshSettings.interval, fetchData, token, user?.id]);

  if (loading && !performanceData) {
    return <div className="text-center p-8">Loading performance metrics...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600 p-8">{error}</div>;
  }

  if (!performanceData?.summary?.last_24h) {
    return null;
  }

  const summary = performanceData.summary.last_24h;

  return (
    <div className="space-y-6">
      <RefreshControls
        lastRefresh={lastRefresh}
        onRefresh={() => void fetchData(true)}
        isLoading={manualLoading}
        refreshSettings={refreshSettings}
        onUpdateSettings={updateRefreshSettings}
        onResetSettings={resetSettings}
      />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard
          title="CPU Usage"
          value={`${summary.avg_cpu_usage?.toFixed(1) ?? '0.0'}%`}
          subtext="Average over 24h"
          icon={Cpu}
          color="blue"
        />
        <StatCard
          title="Memory Usage"
          value={`${summary.avg_memory_usage?.toFixed(1) ?? '0.0'}%`}
          subtext="Average over 24h"
          icon={MemoryStick}
          color="green"
        />
        <StatCard
          title="Response Time"
          value={`${summary.avg_response_time?.toFixed(0) ?? '0'}ms`}
          subtext="Average latency"
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Error Rate"
          value={`${summary.error_rate?.toFixed(2) ?? '0.00'}%`}
          subtext="Last 24 hours"
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="Auth Rate"
          value={`${calculateAuthRate(
            summary.authenticated_connections ?? 0,
            summary.anonymous_connections ?? 0
          )}%`}
          subtext="Authenticated users"
          icon={Shield}
          color="indigo"
        />
        <StatCard
          title="Unique IPs"
          value={(summary.unique_ips ?? 0).toString()}
          subtext="Distinct sources"
          icon={Globe}
          color="pink"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemResourcesChart data={timeSeriesData} />
        <ConnectionMetricsChart data={connectionMetrics} />
        <AuthenticationChart data={authData} />
        <DurationChart data={timeSeriesData} />
        <EndpointStatsChart data={endpointStatsData} />
        <IpStatsChart data={ipStatsData} />
      </div>

      {/* System Status and Connection Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemStatus data={summary} />
        <ConnectionDetails data={summary} />
      </div>
    </div>
  );
};

export default DashboardOverview;