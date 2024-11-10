interface PerformanceMetric {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  avg_connection_duration: number;
  active_connections: number;
  authenticated_connections: number;
  anonymous_connections: number;
}

export const formatDateTime = (isoString: string): string => {
  try {
    const hasTimezone = isoString.includes('Z') || isoString.includes('+') || isoString.includes('-');
    const date = hasTimezone ? new Date(isoString) : new Date(`${isoString}Z`);
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

export const calculateAuthRate = (authenticated: number, anonymous: number): string => {
  const total = (authenticated || 0) + (anonymous || 0);
  if (!total) return '0.0';
  const rate = (authenticated / total) * 100;
  return rate.toFixed(1);
};

export const processTimeSeriesData = (metrics: PerformanceMetric[] | undefined) => {
  if (!metrics) return [];
  return [...metrics]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(metric => ({
      timestamp: formatDateTime(metric.timestamp),
      cpu: metric.cpu_usage,
      memory: metric.memory_usage,
      disk: metric.disk_usage,
      duration: metric.avg_connection_duration,
    }))
    .slice(-24);
};

export const processConnectionMetrics = (metrics: PerformanceMetric[] | undefined) => {
  if (!metrics) return [];
  return [...metrics]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(metric => ({
      timestamp: formatDateTime(metric.timestamp),
      total: metric.active_connections,
      authenticated: metric.authenticated_connections,
      anonymous: metric.anonymous_connections,
    }))
    .slice(-24);
};