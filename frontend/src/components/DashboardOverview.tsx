// src/components/DashboardOverview.tsx

import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../UseAuth';
import { fetchPerformanceMetrics } from '../services/perfromanceService';
import { DEFAULT_REFRESH_SETTINGS, loadRefreshSettings, saveRefreshSettings } from '../utils/dashboardSettings';
import { ProcessedData, RefreshSettings } from '../types/dashboardTypes';
import { Alert } from '@/components/ui/alert';
import { AlertTriangle, Clock, Cpu, Globe, MemoryStick, Shield } from 'lucide-react';
import ErrorBoundary from './errors/ErrorBoundary';
import {ConnectionDetails} from "@/components/dashboard/ConnectionDetails.tsx";
import {SystemStatus} from "@/components/dashboard/SystemStatus.tsx";
import {StatCard} from "@/components/dashboard/StatCard.tsx";
import ChartSkeleton from "@/components/dashboard/ChartSkeleton.tsx";
import RefreshControls from "@/components/dashboard/RefreshControls.tsx";


const renderTimeSeriesChart = (
  key: string,
  Component: React.ComponentType<{ data?: ChartDataPoint[]; loading?: boolean }>,
  data: ChartDataPoint[] | undefined,
  loading: boolean
) => (
  <ErrorBoundary key={key}>
    <Suspense fallback={<ChartSkeleton />}>
      <Component data={data} loading={loading} />
    </Suspense>
  </ErrorBoundary>
);

const renderAuthChart = (
  key: string,
  Component: React.ComponentType<{ data?: AuthData[]; loading?: boolean }>,
  data: AuthData[] | undefined,
  loading: boolean
) => (
  <ErrorBoundary key={key}>
    <Suspense fallback={<ChartSkeleton />}>
      <Component data={data} loading={loading} />
    </Suspense>
  </ErrorBoundary>
);

const renderEndpointStatsChart = (
  key: string,
  Component: React.ComponentType<{
    data?: ProcessedEndpointStats[];
    loading?: boolean;
    hoursToShow?: number;
    topPercentage?: number;
  }>,
  data: ProcessedEndpointStats[] | undefined,
  loading: boolean,
  hoursToShow?: number,
  topPercentage?: number
) => {
  console.debug('[DashboardOverview] Rendering EndpointStatsChart:', {
    key,
    hasData: !!data,
    dataLength: data?.length,
    loading,
    hoursToShow,
    topPercentage
  });

  return (
    <ErrorBoundary key={key}>
      <Component
        data={data}
        loading={loading}
        hoursToShow={hoursToShow}
        topPercentage={topPercentage}
      />
    </ErrorBoundary>
  );
};


const renderIpStatsChart = (
  key: string,
  Component: React.ComponentType<{ data?: ProcessedIpStats[]; loading?: boolean }>,
  data: ProcessedIpStats[] | undefined,
  loading: boolean
) => (
  <ErrorBoundary key={key}>
    <Suspense fallback={<ChartSkeleton />}>
      <Component data={data} loading={loading} />
    </Suspense>
  </ErrorBoundary>
);

// Lazy load chart components
const SystemResourcesChart = lazy(() =>
  import('./dashboard/charts/SystemResourcesChart')
    .then(module => ({ default: module.SystemResourcesChart }))
);

const ConnectionMetricsChart = lazy(() =>
  import('./dashboard/charts/ConnectionMetricsChart')
    .then(module => ({ default: module.ConnectionMetricsChart }))
);

const AuthenticationChart = lazy(() =>
  import('./dashboard/charts/AuthenticationChart')
    .then(module => ({ default: module.AuthenticationChart }))
);

const DurationChart = lazy(() =>
  import('./dashboard/charts/DurationChart')
    .then(module => ({ default: module.DurationChart }))
);

const EndpointStatsChart = lazy(() =>
  import('./dashboard/charts/EndpointStatsChart')
    .then(module => ({ default: module.EndpointStatsChart }))
);

const IpStatsChart = lazy(() =>
  import('./dashboard/charts/IpStatsChart')
    .then(module => ({ default: module.IpStatsChart }))
);

const LOADING_PLACEHOLDERS = Array.from({ length: 6 }, (_, i) => ({ id: `placeholder-${i}` }));

const EMPTY_SUMMARY = {
  avg_cpu_usage: 0,
  avg_memory_usage: 0,
  avg_response_time: 0,
  error_rate: 0,
  authenticated_connections: 0,
  anonymous_connections: 0,
  unique_ips: 0
};



const useDashboard = () => {
  const { token, user } = useAuth();
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshSettings, setRefreshSettings] = useState<RefreshSettings>(() =>
    loadRefreshSettings(user?.id ?? '')
  );


  // Refs for managing component lifecycle and data fetching
  const workerRef = useRef<Worker | null>(null);
  const isRefreshing = useRef(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const minFetchInterval = 2000;

  // Initialize worker with error handling
  useEffect(() => {
    if (!workerRef.current && typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker(
          new URL('../workers/dashboard.worker', import.meta.url),
          { type: 'module' }
        );
        console.log('Worker initialized successfully');
        setupWorkerHandlers(workerRef.current);
      } catch (error) {
        console.error('Worker initialization failed:', error);
        setError('Failed to initialize worker');
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Setup worker message handlers
  const setupWorkerHandlers = useCallback((worker: Worker) => {
    worker.addEventListener('message', (event: MessageEvent) => {
      const { type, data, error: workerError } = event.data;

      switch (type) {
        case 'PROCESSED_DATA':
          if (data) {
            setProcessedData(data);
            setLastRefresh(new Date());
            setError(null);
            setLoading(false);
            setManualLoading(false);
            isRefreshing.current = false;
            setIsProcessing(false);
          }
          break;

        case 'PROCESS_ERROR':
          console.error('Worker processing error:', workerError);
          setError(workerError ?? 'Unknown error processing data');
          setLoading(false);
          setManualLoading(false);
          isRefreshing.current = false;
          setIsProcessing(false);
          break;

        case 'PROGRESS_UPDATE':
          setProgress(data.progress);
          break;
      }
    });

    worker.addEventListener('error', (error: ErrorEvent) => {
      console.error('Worker error:', error);
      setError('Worker error: ' + error.message);
      setLoading(false);
      setManualLoading(false);
      isRefreshing.current = false;
      setIsProcessing(false);
    });
  }, []);

  // Fetch data function
  const fetchData = useCallback(async (isManualRefresh: boolean) => {
    if (!token || isRefreshing.current || !workerRef.current) {
      return;
    }

    const now = Date.now();
    if (!isManualRefresh && now - lastFetchTimeRef.current < minFetchInterval) {
      return;
    }

    try {
      isRefreshing.current = true;

      // Only set loading states for manual refresh
      if (isManualRefresh) {
        setManualLoading(true);
        setIsProcessing(true);
      }

      // Only set loading true on initial load
      if (!processedData) {
        setLoading(true);
      }

      setError(null);
      setProgress(0);

      const data = await fetchPerformanceMetrics(token);

      workerRef.current.postMessage({
        type: 'PROCESS_DATA',
        data
      });

      lastFetchTimeRef.current = now;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
      setLoading(false);
      setManualLoading(false);
      isRefreshing.current = false;
      setIsProcessing(false);
    }
  }, [token, processedData]);

  // Combined data fetching and refresh effect
  useEffect(() => {
    if (!token || !user?.id) {
      console.log('Skip fetch - no token or user');
      return;
    }

    console.log('Setting up data fetching and refresh');
    fetchData(false);

    if (refreshSettings.enabled) {
      console.log('Setting up auto-refresh interval:', refreshSettings.interval);

      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      refreshIntervalRef.current = setInterval(() => {
        fetchData(false);
      }, refreshSettings.interval * 60 * 1000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      };
    }
  }, [token, user?.id, refreshSettings.enabled, refreshSettings.interval, fetchData]);

  // Handle settings updates
  const handleUpdateSettings = useCallback((newSettings: RefreshSettings) => {
    console.log('Updating refresh settings:', newSettings);
    setRefreshSettings(newSettings);
    saveRefreshSettings(user?.id ?? '', newSettings);
  }, [user?.id]);

  const handleResetSettings = useCallback(() => {
    console.log('Resetting to default settings');
    const defaultSettings = DEFAULT_REFRESH_SETTINGS;
    setRefreshSettings(defaultSettings);
    saveRefreshSettings(user?.id ?? '', defaultSettings);
  }, [user?.id]);

  // Progress indicator component
  const renderProgress = () => {
    if (!isProcessing) return null;

    return (
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    );
  };

  return {
    state: {
      loading,
      error,
      processedData,
      manualLoading,
      isProcessing,
      progress,
      lastRefresh,
      refreshSettings,
      handleUpdateSettings,
      handleResetSettings,
      fetchData
    },
    renderProgress
  };
};

const DashboardOverview: React.FC = () => {
  const { state, renderProgress } = useDashboard();
  const [hoursToShow, setHoursToShow] = useState(24);
  const [topPercentage, setTopPercentage] = useState(20);
  const {
    loading,
    error,
    processedData,
    manualLoading,
    isProcessing,
    lastRefresh,
    refreshSettings,
    handleUpdateSettings,
    handleResetSettings,
    fetchData
  } = state;

  useEffect(() => {
    console.debug('[DashboardOverview] ProcessedData updated:', {
      hasData: !!processedData,
      endpointStatsLength: processedData?.endpointStats?.length,
      loading,
      manualLoading,
      isProcessing
    });
  }, [processedData, loading, manualLoading, isProcessing]);

  const renderChartControls = () => (
    <div className="flex gap-4 items-center mb-4">
      <div className="flex items-center gap-2">
        <label htmlFor="hoursToShow" className="text-sm font-medium">
          Hours to Show:
        </label>
        <select
          id="hoursToShow"
          value={hoursToShow}
          onChange={(e) => setHoursToShow(Number(e.target.value))}
          className="rounded-md border border-gray-300 px-2 py-1"
        >
          <option value={6}>6 hours</option>
          <option value={12}>12 hours</option>
          <option value={24}>24 hours</option>
          <option value={48}>48 hours</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="topPercentage" className="text-sm font-medium">
          Top Endpoints:
        </label>
        <select
          id="topPercentage"
          value={topPercentage}
          onChange={(e) => setTopPercentage(Number(e.target.value))}
          className="rounded-md border border-gray-300 px-2 py-1"
        >
          <option value={10}>Top 10%</option>
          <option value={20}>Top 20%</option>
          <option value={30}>Top 30%</option>
          <option value={50}>Top 50%</option>
        </select>
      </div>
    </div>
  );

  // Loading state
  if (loading && !processedData && !manualLoading) {
    return (
      <div className="space-y-6">
        <div className="text-sm text-gray-500 mb-4">
          Loading dashboard data...
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {LOADING_PLACEHOLDERS.map(({ id }) => (
            <div key={id} className="animate-pulse bg-white rounded-xl shadow-md p-4 h-24"/>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {LOADING_PLACEHOLDERS.map(({ id }) => (
            <ChartSkeleton key={id} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 bg-red-50 rounded-xl max-w-2xl w-full">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => fetchData(true)}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!processedData?.summary?.last_24h) {
    return null;
  }

  const summary = processedData?.summary?.last_24h || EMPTY_SUMMARY;

  const showProcessingProgress = manualLoading && isProcessing;


  return (
    <div className="space-y-6">
      <RefreshControls
        lastRefresh={lastRefresh}
        onRefresh={() => fetchData(true)}
        isLoading={manualLoading}
        refreshSettings={refreshSettings}
        onUpdateSettings={handleUpdateSettings}
        onResetSettings={handleResetSettings}
      />

      {/* Only show loading alert for manual refresh */}
      {showProcessingProgress && (
        <Alert>
          Processing data... {Math.round(state.progress)}% complete
        </Alert>
      )}

      {error ? (
        <div className="flex items-center justify-center p-6">
          <div className="text-center p-8 bg-red-50 rounded-xl max-w-2xl w-full">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Dashboard</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => fetchData(true)}
              className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <StatCard
                  title="CPU Usage"
                  value={`${summary.avg_cpu_usage?.toFixed(1) ?? '0.0'}%`}
                  subtext="Average over 24h"
                  icon={Cpu}
                  color="blue"
                  loading={loading || manualLoading}
              />
              <StatCard
                  title="Memory Usage"
                  value={`${summary.avg_memory_usage?.toFixed(1) ?? '0.0'}%`}
                  subtext="Average over 24h"
                  icon={MemoryStick}
                  color="green"
                  loading={loading || manualLoading}
              />
              <StatCard
                  title="Response Time"
                  value={`${summary.avg_response_time?.toFixed(0) ?? '0'}ms`}
                  subtext="Average latency"
                  icon={Clock}
                  color="purple"
                  loading={loading || manualLoading}
              />
              <StatCard
                  title="Error Rate"
                  value={`${summary.error_rate?.toFixed(2) ?? '0.00'}%`}
                  subtext="Last 24 hours"
                  icon={AlertTriangle}
                  color="yellow"
                  loading={loading || manualLoading}
              />
              <StatCard
                  title="Auth Rate"
                  value={`${(processedData?.authData?.[0]?.value || 0).toFixed(1)}%`}
                  subtext="Authenticated users"
                  icon={Shield}
                  color="indigo"
                  loading={loading || manualLoading}
              />
              <StatCard
                  title="Unique IPs"
                  value={summary.unique_ips?.toString() ?? '0'}
                  subtext="Distinct sources"
                  icon={Globe}
                  color="pink"
                  loading={loading || manualLoading}
              />
            </div>

           {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderTimeSeriesChart(
                  'system-resources',
                  SystemResourcesChart,
                  processedData?.timeSeriesData,
                  loading || manualLoading
              )}
              {renderTimeSeriesChart(
                  'connection-metrics',
                  ConnectionMetricsChart,
                  processedData?.connectionMetrics,
                  loading || manualLoading
              )}
              {renderAuthChart(
                  'authentication',
                  AuthenticationChart,
                  processedData?.authData,
                  loading || manualLoading
              )}
              {renderTimeSeriesChart(
                  'duration',
                  DurationChart,
                  processedData?.timeSeriesData,
                  loading || manualLoading
              )}
              <div className="bg-white rounded-lg p-4">
                {renderChartControls()}
                {renderEndpointStatsChart(
                    'endpoint-stats',
                    EndpointStatsChart,
                    processedData?.endpointStats,
                    false, // Changed from loading || manualLoading
                    hoursToShow,
                    topPercentage
                )}
              </div>
              {renderIpStatsChart(
                  'ip-stats',
                  IpStatsChart,
                  processedData?.ipStats,
                  loading || manualLoading
              )}
            </div>

            {/* System Status and Connection Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ErrorBoundary>
                <SystemStatus
                    data={summary}
                    loading={loading || manualLoading}
                />
              </ErrorBoundary>
              <ErrorBoundary>
                <ConnectionDetails
                    data={summary}
                    loading={loading || manualLoading}
                />
              </ErrorBoundary>
            </div>
          </>
      )}

      {/* Floating progress indicator for background updates */}
      {renderProgress()}
    </div>
  );
};

export default React.memo(DashboardOverview);
