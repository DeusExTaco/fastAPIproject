import { useEffect, useState, useCallback, useMemo, useRef, RefObject  } from 'react';

import { useAuth } from '../UseAuth';
import { fetchPerformanceMetrics, type PerformanceResponse, type EndpointStat, type IpStat } from '../services/perfromanceService';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import {
  Cpu, Clock, AlertTriangle,
  MemoryStick, RefreshCw, Settings, Network, Shield, Globe
} from 'lucide-react';
import {
  loadRefreshSettings,
  saveRefreshSettings,
  DEFAULT_REFRESH_SETTINGS,
  clearRefreshSettings
} from '.././utils/dashboardSettings';

interface RefreshSettings {
  enabled: boolean;
  interval: number;
}

function DashboardOverview() {
  const { token, user } = useAuth(); // Make sure useAuth provides the user object
  const userId = user?.id; // Get user ID from auth context

  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);

  // Load user-specific saved settings on component mount
  const [refreshSettings, setRefreshSettings] = useState<RefreshSettings>(() =>
    loadRefreshSettings(userId)
  );

  // Update settings with persistence
  const updateRefreshSettings = useCallback((newSettings: Partial<RefreshSettings>) => {
    setRefreshSettings(current => {
      const updatedSettings = {
        ...current,
        ...newSettings
      };
      saveRefreshSettings(userId, updatedSettings);
      return updatedSettings;
    });
  }, [userId]);

  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    clearRefreshSettings(userId);
    setRefreshSettings(DEFAULT_REFRESH_SETTINGS);
  }, [userId]);

  // Effect to reload settings when user changes
  useEffect(() => {
    setRefreshSettings(loadRefreshSettings(userId));
  }, [userId]);

  function useClickOutside(ref: RefObject<HTMLDivElement>, handler: () => void) {
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          handler();
        }
      }

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [ref, handler]);
  }


  // Existing time formatting function
  const formatDateTime = (isoString: string) => {
    try {
      // Check if the timestamp includes timezone info
      const hasTimezone = isoString.includes('Z') || isoString.includes('+') || isoString.includes('-');

      // If no timezone info, assume it's local time
      const date = hasTimezone
        ? new Date(isoString)
        : new Date(`${isoString}Z`);

      // Convert to local time string
      return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
        .toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
    } catch (error) {
      console.error('Error formatting date:', error);
      return isoString;
    }
  };

  // Add this debug helper to verify the conversion
  const debugTimestamp = (isoString: string) => {
    const hasTimezone = isoString.includes('Z') || isoString.includes('+') || isoString.includes('-');
    const date = hasTimezone ? new Date(isoString) : new Date(`${isoString}Z`);
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

    console.log({
      originalIso: isoString,
      hasTimezone,
      localTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      parsedDate: date.toLocaleString(),
      adjustedLocal: localDate.toLocaleString(),
      formattedTime: formatDateTime(isoString)
    });
  };

  // Debug effect to verify timestamps
  useEffect(() => {
    if (performanceData?.metrics?.length) {
      const sampleTimestamp = performanceData.metrics[0].timestamp;
      debugTimestamp(sampleTimestamp);
    }
  }, [performanceData?.metrics]);

  // Add this helper function to your component for safe calculation
  const calculateAuthRate = (authenticated: number, anonymous: number): string => {
    const total = (authenticated || 0) + (anonymous || 0);
    if (!total) return '0.0';  // Return "0.0" if total is 0

    const rate = (authenticated / total) * 100;
    return rate.toFixed(1);  // Return formatted string with one decimal place
  };

  // Process endpoint statistics
  const endpointStatsData = useMemo(() => {
    if (!performanceData?.summary.last_24h.endpoint_stats) return [];
    return Object.entries(performanceData.summary.last_24h.endpoint_stats)
      .map(([endpoint, stats]) => ({
        endpoint,
        requests: stats.requests,
        avgDuration: stats.avg_duration,
        authRate: stats.auth_rate,
      }))
      .sort((a, b) => b.requests - a.requests);
  }, [performanceData?.summary.last_24h.endpoint_stats]);

  // Process IP statistics
  const ipStatsData = useMemo(() => {
    if (!performanceData?.summary.last_24h.ip_stats) return [];
    return Object.entries(performanceData.summary.last_24h.ip_stats)
      .map(([ip, stats]) => ({
        ip,
        requests: stats.requests,
        endpoints: stats.endpoints.length,
        rateLimited: stats.rate_limited_count,
      }))
      .sort((a, b) => b.requests - a.requests);
  }, [performanceData?.summary.last_24h.ip_stats]);

  // Process authentication data
  const authData = useMemo(() => {
    if (!performanceData?.summary.last_24h) return [];
    const { authenticated_connections, anonymous_connections } = performanceData.summary.last_24h;
    return [
      { name: 'Authenticated', value: authenticated_connections, color: '#4F46E5' },
      { name: 'Anonymous', value: anonymous_connections, color: '#E5E7EB' }
    ];
  }, [performanceData?.summary.last_24h]);

  // Your existing time series processing
  const timeSeriesData = useMemo(() => {
    if (!performanceData?.metrics) return [];
    return [...performanceData.metrics]
      .sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateA.getTime() - dateB.getTime();
      })
      .map(metric => ({
        timestamp: formatDateTime(metric.timestamp),
        cpu: metric.cpu_usage,
        memory: metric.memory_usage,
        disk: metric.disk_usage,
        duration: metric.avg_connection_duration,
      }))
      .slice(-24);
  }, [performanceData?.metrics]);

  // Process connection metrics
  const connectionMetrics = useMemo(() => {
    if (!performanceData?.metrics) return [];
    return [...performanceData.metrics]
      .sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateA.getTime() - dateB.getTime();
      })
      .map(metric => ({
        timestamp: formatDateTime(metric.timestamp),
        total: metric.active_connections,
        authenticated: metric.authenticated_connections,
        anonymous: metric.anonymous_connections,
      }))
      .slice(-24);
  }, [performanceData?.metrics]);

  // Fetch data function
  const fetchData = useCallback(async (isManualRefresh: boolean = false) => {
    try {
        if (isManualRefresh) {
            setManualLoading(true);
        }
        setLoading(true);
        const data = await fetchPerformanceMetrics(token!);
        setPerformanceData(data);
        setLastRefresh(new Date());
        setError(null);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
    } finally {
        setLoading(false);
        if (isManualRefresh) {
            setManualLoading(false);
        }
    }
}, [token])

  // Enhanced auto-refresh effect
 useEffect(() => {
    if (!refreshSettings.enabled || !token || !userId) return;

    const intervalId = setInterval(() => {
        void fetchData(false); // Pass false for auto-refresh
    }, refreshSettings.interval * 60 * 1000);

    return () => clearInterval(intervalId);
}, [refreshSettings.enabled, refreshSettings.interval, fetchData, token, userId]);


  // Initial fetch on mount
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  // Custom tooltip component (your existing implementation)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }} className="text-sm">
            {`${pld.name}: ${pld.value.toFixed(2)}${pld.unit || ''}`}
          </p>
        ))}
      </div>
    );
  };

  // Updated RefreshControls component with reset option
  const RefreshControls = () => {
    const popoverRef = useRef<HTMLDivElement>(null);
    useClickOutside(popoverRef, () => setShowSettings(false));

    return (
        <div className="flex items-center justify-between mb-6 bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                    Last updated: {lastRefresh ? lastRefresh.toLocaleTimeString() : 'Never'}
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => void fetchData(true)} // Pass true for manual refresh
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-md
                                hover:bg-blue-100 transition-colors disabled:opacity-50"
                        disabled={manualLoading}
                    >
                        <RefreshCw className={`w-4 h-4 ${manualLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>

                    {/* Settings button and popover container */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-2 rounded-md transition-colors ${
                                showSettings 
                                    ? 'text-blue-600 bg-blue-50' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Settings className="w-4 h-4" />
                        </button>

                        {/* Settings Popover */}
                        {showSettings && (
                            <div
                                ref={popoverRef}
                                className="absolute top-0 left-full ml-2 w-[240px] bg-white rounded-lg shadow-lg border border-gray-200
                                        transform transition-all duration-200 ease-in-out z-50"
                                style={{ marginTop: '-4px' }}
                            >
                                <div className="p-4 space-y-4">
                                    {/* Auto-refresh Toggle */}
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700">
                                            Auto-refresh
                                        </label>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                            <input
                                                type="checkbox"
                                                checked={refreshSettings.enabled}
                                                onChange={(e) => updateRefreshSettings({ enabled: e.target.checked })}
                                                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Interval Selection */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Refresh interval
                                        </label>
                                        <select
                                            value={refreshSettings.interval}
                                            onChange={(e) => updateRefreshSettings({
                                                interval: Number(e.target.value)
                                            })}
                                            className="block w-full rounded-md border border-gray-300 py-1.5 px-3
                                                    text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                                                    focus:border-blue-500 bg-white"
                                        >
                                            <option value="1">1 minute</option>
                                            <option value="5">5 minutes</option>
                                            <option value="10">10 minutes</option>
                                            <option value="15">15 minutes</option>
                                            <option value="30">30 minutes</option>
                                        </select>
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-2 flex justify-between items-center border-t border-gray-100">
                                        <span className="text-xs text-gray-500">
                                            User settings
                                        </span>
                                        <button
                                            onClick={resetSettings}
                                            className="text-xs text-red-600 hover:text-red-700
                                                    transition-colors duration-150"
                                        >
                                            Reset to Default
                                        </button>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="absolute -left-2 top-[13px] w-3 h-3 rotate-45 bg-white border-l border-t border-gray-200" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

  return (
    <div className="space-y-6">
      <RefreshControls/>

      {loading && !performanceData ? (
        <div className="text-center p-8">Loading performance metrics...</div>
      ) : error ? (
        <div className="text-center text-red-600 p-8">{error}</div>
      ) : performanceData && (
        <>
          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              {/* CPU Usage Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm text-gray-500 font-medium">CPU Usage</p>
                          <h3 className="text-2xl font-bold text-gray-900 mt-2">
                              {performanceData.summary.last_24h.avg_cpu_usage.toFixed(1)}%
                          </h3>
                          <p className="text-sm text-blue-600 mt-2">Average over 24h</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-full">
                          <Cpu className="w-6 h-6 text-blue-500"/>
                      </div>
                  </div>
              </div>


              {/* Memory Usage Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm text-gray-500 font-medium">Memory Usage</p>
                          <h3 className="text-2xl font-bold text-gray-900 mt-2">
                              {performanceData.summary.last_24h.avg_memory_usage.toFixed(1)}%
                          </h3>
                          <p className="text-sm text-green-600 mt-2">Average over 24h</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-full">
                          <MemoryStick className="w-6 h-6 text-green-500"/>
                      </div>
                  </div>
              </div>

              {/* Response Time Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm text-gray-500 font-medium">Response Time</p>
                          <h3 className="text-2xl font-bold text-gray-900 mt-2">
                              {performanceData.summary.last_24h.avg_response_time.toFixed(0)}ms
                          </h3>
                          <p className="text-sm text-purple-600 mt-2">Average latency</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-full">
                          <Clock className="w-6 h-6 text-purple-500"/>
                      </div>
                  </div>
              </div>

              {/* Error Rate Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm text-gray-500 font-medium">Error Rate</p>
                          <h3 className="text-2xl font-bold text-gray-900 mt-2">
                              {performanceData.summary.last_24h.error_rate.toFixed(2)}%
                          </h3>
                          <p className="text-sm text-yellow-600 mt-2">Last 24 hours</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-full">
                          <AlertTriangle className="w-6 h-6 text-yellow-500"/>
                      </div>
                  </div>
              </div>

              {/* Auth Status Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm text-gray-500 font-medium">Auth Rate</p>
                          <h3 className="text-2xl font-bold text-gray-900 mt-2">
                              {calculateAuthRate(
                                  performanceData.summary.last_24h.authenticated_connections,
                                  performanceData.summary.last_24h.anonymous_connections
                              )}%
                          </h3>
                          <p className="text-sm text-indigo-600 mt-2">Authenticated users</p>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-full">
                          <Shield className="w-6 h-6 text-indigo-500"/>
                      </div>
                  </div>
              </div>

              {/* Unique IPs Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-sm text-gray-500 font-medium">Unique IPs</p>
                          <h3 className="text-2xl font-bold text-gray-900 mt-2">
                              {performanceData.summary.last_24h.unique_ips}
                          </h3>
                          <p className="text-sm text-pink-600 mt-2">Distinct sources</p>
                      </div>
                      <div className="bg-pink-50 p-3 rounded-full">
                          <Globe className="w-6 h-6 text-pink-500"/>
                      </div>
                  </div>
              </div>
            </div>

          {/* Charts Grid - First Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Resources Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Resources</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis
                        dataKey="timestamp"
                        tick={{fontSize: 12}}
                        interval="preserveStartEnd"
                      minTickGap={30}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend/>
                    <Line
                      type="monotone"
                      dataKey="cpu"
                      stroke="#2196F3"
                      name="CPU"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="memory"
                      stroke="#4CAF50"
                      name="Memory"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="disk"
                      stroke="#FF9800"
                      name="Disk"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Enhanced Connection Metrics */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Metrics</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={connectionMetrics}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis
                      dataKey="timestamp"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                      minTickGap={30}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }}/>
                    <Tooltip content={<CustomTooltip />}/>
                    <Legend/>
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#6366F1"
                      name="Total Connections"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="authenticated"
                      stroke="#4F46E5"
                      name="Authenticated"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="anonymous"
                      stroke="#E5E7EB"
                      name="Anonymous"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Authentication Status */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication Status</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={authData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {authData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Connection Duration Chart */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Duration</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                      minTickGap={30}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="duration"
                      stroke="#EC4899"
                      name="Avg Duration (ms)"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Endpoint Statistics */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Endpoint Statistics</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={endpointStatsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="endpoint" type="category" width={150} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="requests" fill="#6366F1" name="Requests" />
                    <Bar dataKey="authRate" fill="#4F46E5" name="Auth Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* IP Statistics */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Source IP Activity</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ipStatsData.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="ip" type="category" width={150} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="requests" fill="#8B5CF6" name="Requests" />
                    <Bar dataKey="rateLimited" fill="#EF4444" name="Rate Limited" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* System Status Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
              <div className="grid grid-cols-1 gap-4">
                {/* CPU Status */}
                <div className={`flex items-center space-x-4 p-4 ${
                  performanceData.summary.last_24h.avg_cpu_usage > 80 ? 'bg-red-50' :
                    performanceData.summary.last_24h.avg_cpu_usage > 60 ? 'bg-yellow-50' : 'bg-green-50'
                } rounded-lg`}>
                  <Cpu className={`w-8 h-8 ${
                    performanceData.summary.last_24h.avg_cpu_usage > 80 ? 'text-red-500' :
                      performanceData.summary.last_24h.avg_cpu_usage > 60 ? 'text-yellow-500' : 'text-green-500'
                  }`}/>
                  <div>
                    <p className="font-medium">CPU Status</p>
                    <p className="text-sm">{
                      performanceData.summary.last_24h.avg_cpu_usage > 80 ? 'Critical Load' :
                        performanceData.summary.last_24h.avg_cpu_usage > 60 ? 'High Load' : 'Normal'
                    }</p>
                  </div>
                </div>

                {/* Memory Status */}
                <div className={`flex items-center space-x-4 p-4 ${
                  performanceData.summary.last_24h.avg_memory_usage > 80 ? 'bg-red-50' :
                    performanceData.summary.last_24h.avg_memory_usage > 60 ? 'bg-yellow-50' : 'bg-green-50'
                } rounded-lg`}>
                  <MemoryStick className={`w-8 h-8 ${
                    performanceData.summary.last_24h.avg_memory_usage > 80 ? 'text-red-500' :
                      performanceData.summary.last_24h.avg_memory_usage > 60 ? 'text-yellow-500' : 'text-green-500'
                  }`}/>
                  <div>
                    <p className="font-medium">Memory Status</p>
                    <p className="text-sm">{
                      performanceData.summary.last_24h.avg_memory_usage > 80 ? 'Critical Usage' :
                        performanceData.summary.last_24h.avg_memory_usage > 60 ? 'High Usage' : 'Normal'
                    }</p>
                  </div>
                </div>

                {/* Connection Status */}
                <div className={`flex items-center space-x-4 p-4 ${
                  performanceData.summary.last_24h.avg_active_connections > 1000 ? 'bg-red-50' :
                    performanceData.summary.last_24h.avg_active_connections > 500 ? 'bg-yellow-50' : 'bg-green-50'
                } rounded-lg`}>
                  <Network className={`w-8 h-8 ${
                    performanceData.summary.last_24h.avg_active_connections > 1000 ? 'text-red-500' :
                      performanceData.summary.last_24h.avg_active_connections > 500 ? 'text-yellow-500' : 'text-green-500'
                  }`}/>
                  <div>
                    <p className="font-medium">Connection Status</p>
                    <p className="text-sm">{
                      performanceData.summary.last_24h.avg_active_connections > 1000 ? 'High Traffic' :
                        performanceData.summary.last_24h.avg_active_connections > 500 ? 'Moderate Traffic' : 'Normal Traffic'
                    }</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Details */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-indigo-800">Average Active</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {performanceData.summary.last_24h.avg_active_connections.toFixed(0)}
                  </p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-indigo-800">Peak Connections</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {performanceData.summary.last_24h.max_active_connections}
                  </p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-indigo-800">Unique Endpoints</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {performanceData.summary.last_24h.total_unique_connections}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

}

export default DashboardOverview;