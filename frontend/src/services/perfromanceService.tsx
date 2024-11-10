interface EndpointStat {
  requests: number;
  avg_duration: number;
  auth_rate: number;
  total_requests: number;
}

interface IpStat {
  requests: number;
  endpoints: string[];
  last_request: string;
  rate_limited_count: number;
}

interface PerformanceMetric {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_connections: number;
  response_time: number;
  endpoint: string;
  http_status: number;
  authenticated_connections: number;
  anonymous_connections: number;
  avg_connection_duration: number;
  unique_ips: number;
}

interface PerformanceSummary {
  last_24h: {
    avg_cpu_usage: number;
    avg_memory_usage: number;
    avg_disk_usage: number;
    avg_response_time: number;
    total_requests: number;
    error_rate: number;
    avg_active_connections: number;
    max_active_connections: number;
    total_unique_connections: number;
    authenticated_connections: number;
    anonymous_connections: number;
    avg_connection_duration: number;
    unique_ips: number;
    endpoint_stats: Record<string, EndpointStat>;
    ip_stats: Record<string, IpStat>;
  };
}

interface PerformanceResponse {
  metrics: PerformanceMetric[];
  summary: PerformanceSummary;
}

class PerformanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PerformanceError';
    Object.setPrototypeOf(this, PerformanceError.prototype);
  }
}

export const fetchPerformanceMetrics = async (
  token: string,
  startTime?: Date,
  endTime?: Date
): Promise<PerformanceResponse> => {
  if (!token) {
    return Promise.reject(new PerformanceError('Authentication token is required'));
  }

  try {
    const params = new URLSearchParams();
    if (startTime) params.append('start_time', startTime.toISOString());
    if (endTime) params.append('end_time', endTime.toISOString());

    const response = await fetch(`http://localhost:8000/api/performance/metrics?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorMessage = await response.text().then(text => {
        try {
          const data = JSON.parse(text);
          return `${data.message || 'Failed to fetch performance metrics'} (Status: ${response.status})`;
        } catch {
          return `Failed to fetch performance metrics (Status: ${response.status})`;
        }
      });

      return Promise.reject(new PerformanceError(errorMessage));
    }

    const data = await response.json();
    return data as PerformanceResponse;
  } catch (error) {
    if (error instanceof PerformanceError) {
      return Promise.reject(error);
    }

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return Promise.reject(new PerformanceError(errorMessage));
  }
};

export type {
  PerformanceMetric,
  PerformanceSummary,
  PerformanceResponse,
  EndpointStat,
  IpStat,
  PerformanceError
};