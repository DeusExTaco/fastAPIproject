import type {
  PerformanceData,
  PerformanceMetric,
  Last24HSummary,
  PerformanceSummary
} from '@/types/dashboardTypes';

interface RawMetric {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_connections: number;
  authenticated_connections: number;
  anonymous_connections: number;
  avg_connection_duration: number;
  response_time: number;
  endpoint: string;
  http_status: number;
  unique_ips: number;
}

// Custom error class for API-specific errors
class APIError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

const defaultSummary: Last24HSummary = {
  avg_cpu_usage: 0,
  avg_memory_usage: 0,
  avg_response_time: 0,
  error_rate: 0,
  authenticated_connections: 0,
  anonymous_connections: 0,
  unique_ips: 0,
  avg_active_connections: 0,
  max_active_connections: 0,
  total_unique_connections: 0,
  endpoint_stats: {},
  ip_stats: {}
} as const;

// Type guard for raw metric validation
const validateMetric = (metric: unknown): metric is RawMetric => {
  const requiredNumberFields = [
    'cpu_usage',
    'memory_usage',
    'disk_usage',
    'active_connections',
    'authenticated_connections',
    'anonymous_connections',
    'avg_connection_duration'
  ] as const;

  if (!metric || typeof metric !== 'object') {
    return false;
  }

  const m = metric as Record<string, unknown>;

  if (typeof m.timestamp !== 'string') {
    return false;
  }

  return requiredNumberFields.every(field =>
    typeof m[field] === 'number' ||
    (typeof m[field] === 'string' && !isNaN(Number(m[field])))
  );
};

// Helper function to safely convert to number
const safeNumber = (value: unknown, defaultValue = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

// Process raw metric into performance metric
const processMetric = (metric: RawMetric): PerformanceMetric => ({
  timestamp: metric.timestamp,
  cpu_usage: safeNumber(metric.cpu_usage),
  memory_usage: safeNumber(metric.memory_usage),
  disk_usage: safeNumber(metric.disk_usage),
  avg_connection_duration: safeNumber(metric.avg_connection_duration),
  active_connections: safeNumber(metric.active_connections),
  authenticated_connections: safeNumber(metric.authenticated_connections),
  anonymous_connections: safeNumber(metric.anonymous_connections)
});

// Process summary data
const processSummary = (rawSummary: unknown): PerformanceSummary => {
  const summary = (rawSummary as Record<string, unknown>)?.last_24h || defaultSummary;

  return {
    last_24h: {
      ...defaultSummary,
      ...Object.fromEntries(
        Object.entries(summary).map(([key, value]) => [
          key,
          typeof value === 'number' ? value :
          key.endsWith('_stats') ? value :
          safeNumber(value)
        ])
      )
    }
  };
};

// Fetch and handle API response
async function handleAPIResponse(response: Response): Promise<any> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new APIError(
      response.status,
      errorData.detail || `HTTP error! status: ${response.status}`
    );
  }
  return response.json();
}

export const fetchPerformanceMetrics = async (
  token: string,
  signal?: AbortSignal
): Promise<PerformanceData> => {
  try {
    const response = await fetch('http://localhost:8000/api/performance/metrics', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      signal
    });

    const rawData = await handleAPIResponse(response);
    console.log('Raw API Response:', rawData);

    const processedMetrics = (rawData.metrics || [])
      .filter(validateMetric)
      .map(processMetric);

    const processedSummary = processSummary(rawData.summary);

    console.log('Processed Data:', { metrics: processedMetrics, summary: processedSummary });

    return {
      metrics: processedMetrics,
      summary: processedSummary
    };

  } catch (error) {
    // Re-throw APIErrors to be handled by the caller
    if (error instanceof APIError) {
      throw error;
    }

    // Log other unexpected errors and return default data
    console.error('Error fetching performance metrics:', error);
    return {
      metrics: [],
      summary: {
        last_24h: defaultSummary
      }
    };
  }
};

export type {
  PerformanceMetric,
  PerformanceSummary,
  PerformanceData,
  APIError
};