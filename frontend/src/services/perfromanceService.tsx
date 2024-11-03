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

export const fetchPerformanceMetrics = async (token: string, startTime?: Date, endTime?: Date) => {
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
      throw new Error('Failed to fetch performance metrics');
    }

    return await response.json() as PerformanceResponse;
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
};

export type {
  PerformanceMetric,
  PerformanceSummary,
  PerformanceResponse,
  EndpointStat,
  IpStat
};