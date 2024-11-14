// src/workers/dashboard.worker.ts

type WorkerContext = Worker & typeof globalThis;

interface PerformanceMetric {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_connections: number;
  authenticated_connections: number;
  anonymous_connections: number;
  avg_connection_duration: number;
  response_time: number;
  unique_ips: number;
}

interface EndpointStat {
  requests: number;
  avg_duration: number;
  auth_rate: number;
}

interface IpStat {
  requests: number;
  endpoints: string[];
  rate_limited_count: number;
}

interface ChartDataPoint {
  timestamp: string;
  cpu?: number;
  memory?: number;
  disk?: number;
  duration?: number;
  total?: number;
  authenticated?: number;
  anonymous?: number;
}

interface AuthData {
  name: string;
  value: number;
  color: string;
}

interface ProcessedEndpointStats {
  endpoint: string;
  requests: number;
  avgDuration: number;
  authRate: number;
  timestamp: string;
}

interface ProcessedIpStats {
  ip: string;
  requests: number;
  endpoints: number;
  rateLimited: number;
}

interface ProcessedData {
  timeSeriesData: ChartDataPoint[];
  connectionMetrics: ChartDataPoint[];
  authData: AuthData[];
  endpointStats: ProcessedEndpointStats[];
  ipStats: ProcessedIpStats[];
  summary: {
    last_24h: Record<string, any>;
  };
}

interface WorkerMessage {
  type: 'PROCESS_DATA';
  data: {
    metrics: PerformanceMetric[];
    summary?: {
      last_24h?: Record<string, any>;
    };
  };
}

class DataProcessor {
  private static readonly BATCH_SIZE = 25;
  private static readonly YIELD_INTERVAL = 8;

  static async processInBatches<T, R>(
    items: T[],
    processFn: (item: T) => R,
    onProgress?: (progress: number) => void
  ): Promise<R[]> {
    if (!items?.length) return [];

    const results: R[] = new Array(items.length);
    const totalItems = items.length;
    let processedItems = 0;
    const startTime = performance.now();

    for (let i = 0; i < totalItems; i += this.BATCH_SIZE) {
      const batchEnd = Math.min(i + this.BATCH_SIZE, totalItems);

      // Process current batch
      for (let j = i; j < batchEnd; j++) {
        results[j] = processFn(items[j]);
        processedItems++;
      }

      // Report progress
      if (onProgress) {
        onProgress((processedItems / totalItems) * 100);
      }

      // Yield to main thread if we've been processing for too long
      if (performance.now() - startTime > 50) {
        await new Promise(resolve => setTimeout(resolve, this.YIELD_INTERVAL));
      }
    }

    return results;
  }
}

class PerformanceCache {
  private cache = new Map<string, ProcessedData>();
  private keys: string[] = [];
  private readonly maxSize: number;
  private readonly maxAge: number;

  constructor(maxSize = 5, maxAgeMinutes = 5) {
    this.maxSize = maxSize;
    this.maxAge = maxAgeMinutes * 60 * 1000;
  }

  get(key: string): ProcessedData | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Update access order
    const index = this.keys.indexOf(key);
    if (index > -1) {
      this.keys.splice(index, 1);
      this.keys.push(key);
    }

    return entry;
  }

  set(key: string, data: ProcessedData): void {
    // Clear expired items first
    this.clearExpired();

    // Remove the oldest if at capacity
    if (this.cache.size >= this.maxSize && this.keys.length > 0) {
      const oldest = this.keys.shift();
      if (oldest) this.cache.delete(oldest);
    }

    this.cache.set(key, data);
    this.keys.push(key);
  }

  private clearExpired(): void {
    const now = Date.now();
    const expired = this.keys.filter(key => {
      const entry = this.cache.get(key);
      if (!entry) return true;

      const timestamp = new Date(entry.timeSeriesData[0]?.timestamp ?? 0).getTime();
      return (now - timestamp) > this.maxAge;
    });

    expired.forEach(key => {
      this.cache.delete(key);
      const index = this.keys.indexOf(key);
      if (index > -1) this.keys.splice(index, 1);
    });
  }
}

class DashboardWorker {
  private readonly cache: PerformanceCache;
  private isProcessing = false;
  private lastProgressUpdate = 0;
  private static readonly PROGRESS_THROTTLE = 100;
  private static readonly DEBOUNCE_TIME = 50;
  private debounceTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.cache = new PerformanceCache();
  }

  private createCacheKey(data: WorkerMessage['data']): string {
    const lastMetric = data.metrics[data.metrics.length - 1];
    return JSON.stringify({
      metricsLength: data.metrics.length,
      lastMetricTimestamp: lastMetric?.timestamp ?? new Date().toISOString(),
      summaryHash: JSON.stringify(data.summary?.last_24h ?? {})
    });
  }

  private async processMetrics(
    metrics: PerformanceMetric[],
    onProgress?: (progress: number) => void
  ): Promise<{ timeSeriesData: ChartDataPoint[]; connectionMetrics: ChartDataPoint[] }> {
    if (!metrics?.length) {
      return {
        timeSeriesData: [],
        connectionMetrics: []
      };
    }

    const updateProgress = (progress: number) => {
      const now = Date.now();
      if (now - this.lastProgressUpdate >= DashboardWorker.PROGRESS_THROTTLE) {
        onProgress?.(progress);
        this.lastProgressUpdate = now;
      }
    };

    // Process time series data
    const timeSeriesData = await DataProcessor.processInBatches(
      metrics,
      (metric): ChartDataPoint => ({
        timestamp: new Date(metric.timestamp).toLocaleString(),
        cpu: Number(metric.cpu_usage),
        memory: Number(metric.memory_usage),
        disk: Number(metric.disk_usage),
        duration: Number(metric.avg_connection_duration)
      }),
      progress => updateProgress(progress / 2)
    );

    // Process connection metrics
    const connectionMetrics = await DataProcessor.processInBatches(
      metrics,
      (metric): ChartDataPoint => ({
        timestamp: new Date(metric.timestamp).toLocaleString(),
        total: Number(metric.active_connections),
        authenticated: Number(metric.authenticated_connections),
        anonymous: Number(metric.anonymous_connections)
      }),
      progress => updateProgress(50 + progress / 2)
    );

    return { timeSeriesData, connectionMetrics };
  }

  private calculateAuthData(summary: Record<string, any> = {}): AuthData[] {
    const authenticated = summary.authenticated_connections ?? 0;
    const anonymous = summary.anonymous_connections ?? 0;
    const total = authenticated + anonymous;

    if (total === 0) {
      return [
        { name: 'Authenticated', value: 0, color: '#4F46E5' },
        { name: 'Anonymous', value: 0, color: '#E5E7EB' }
      ];
    }

    const authRate = (authenticated / total) * 100;
    const anonRate = (anonymous / total) * 100;

    return [
      { name: 'Authenticated', value: Math.round(authRate * 10) / 10, color: '#4F46E5' },
      { name: 'Anonymous', value: Math.round(anonRate * 10) / 10, color: '#E5E7EB' }
    ];
  }

  private processEndpointStats(stats: Record<string, EndpointStat> = {}): ProcessedEndpointStats[] {
    return Object.entries(stats)
      .map(([endpoint, stat]): ProcessedEndpointStats => ({
        endpoint,
        requests: Math.round(stat.requests),
        avgDuration: Math.round(stat.avg_duration * 100) / 100,
        authRate: Math.round(stat.auth_rate * 100) / 100,
      }) as ProcessedEndpointStats)
      .sort((a, b) => b.requests - a.requests);
  }

  private processIpStats(stats: Record<string, IpStat> = {}): ProcessedIpStats[] {
    return Object.entries(stats)
      .map(([ip, stat]): ProcessedIpStats => ({
        ip,
        requests: Math.round(stat.requests),
        endpoints: stat.endpoints.length,
        rateLimited: Math.round(stat.rate_limited_count),
      }))
      .sort((a, b) => b.requests - a.requests);
  }

 async processData(message: WorkerMessage): Promise<ProcessedData> {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    return new Promise((resolve, reject) => {
      this.debounceTimeout = setTimeout(() => {
        // Remove the async/await here since we're already in a Promise
        this.processDataImpl(message)
          .then(resolve)
          .catch(reject);
      }, DashboardWorker.DEBOUNCE_TIME);
    });
  }

  private async processDataImpl(message: WorkerMessage): Promise<ProcessedData> {
    if (this.isProcessing) {
      throw new Error('Already processing data');
    }

    this.isProcessing = true;

    try {
      console.log('Starting data processing', message.data); // Debug log

      // Validate data before processing
      const metrics = message.data?.metrics;
      if (!Array.isArray(metrics) || metrics.length === 0) {
        return Promise.reject(new Error('Invalid input data: metrics must be a non-empty array'));
      }

      const cacheKey = this.createCacheKey(message.data);
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        console.log('Returning cached data'); // Debug log
        return cachedData;
      }

      const { summary } = message.data;
      const { timeSeriesData, connectionMetrics } = await this.processMetrics(
        metrics,
        progress => {
          self.postMessage({
            type: 'PROGRESS_UPDATE',
            data: { progress: Math.round(progress) }
          });
        }
      );

      const processedData: ProcessedData = {
        timeSeriesData,
        connectionMetrics,
        authData: this.calculateAuthData(summary?.last_24h),
        endpointStats: this.processEndpointStats(summary?.last_24h?.endpoint_stats),
        ipStats: this.processIpStats(summary?.last_24h?.ip_stats),
        summary: { last_24h: summary?.last_24h ?? {} }
      };

      console.log('Processed data:', processedData); // Debug log

      this.cache.set(cacheKey, processedData);

      return processedData;
    } catch (error) {
      console.error('Processing error:', error); // Debug log
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }
}


// Worker initialization
const ctx: WorkerContext = self as any;
const worker = new DashboardWorker();
let currentAnimationFrame: number | null = null;

ctx.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  // Cancel any pending animation frame
  if (currentAnimationFrame !== null) {
    cancelAnimationFrame(currentAnimationFrame);
  }

  // Validate message type
  if (event.data.type !== 'PROCESS_DATA') {
    ctx.postMessage({
      type: 'PROCESS_ERROR',
      error: 'Invalid message type'
    });
    return;
  }

  // Schedule processing for next frame
  currentAnimationFrame = requestAnimationFrame(() => {
    currentAnimationFrame = null;
    void worker.processData(event.data)
      .then((processedData) => {
        ctx.postMessage({
          type: 'PROCESSED_DATA',
          data: processedData
        });
      })
      .catch((error: unknown) => {
        ctx.postMessage({
          type: 'PROCESS_ERROR',
          error: error instanceof Error ? error.message : 'Unknown error in worker'
        });
      });
  });
});