import { ComponentType } from 'react';

export interface PerformanceMetric {
  timestamp: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  avg_connection_duration: number;
  active_connections: number;
  authenticated_connections: number;
  anonymous_connections: number;
}

export interface EndpointStat {
  requests: number;
  avg_duration: number;
  auth_rate: number;
}

export interface IpStat {
  requests: number;
  endpoints: string[];
  rate_limited_count: number;
}

export interface PerformanceSummary {
  last_24h: {
    avg_cpu_usage: number;
    avg_memory_usage: number;
    avg_response_time: number;
    error_rate: number;
    authenticated_connections: number;
    anonymous_connections: number;
    unique_ips: number;
    avg_active_connections: number;
    max_active_connections: number;
    total_unique_connections: number;
    endpoint_stats: Record<string, EndpointStat>;
    ip_stats: Record<string, IpStat>;
  };
}

export interface PerformanceData {
  metrics: PerformanceMetric[];
  summary: PerformanceSummary;
}

export interface RefreshSettings {
  enabled: boolean;
  interval: number;
}

export interface ChartDataPoint {
  timestamp: string;
  cpu?: number;
  memory?: number;
  disk?: number;
  duration?: number;
  total?: number;
  authenticated?: number;
  anonymous?: number;
}

export interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: ComponentType<any>;
  color: string;
}

export interface SystemStatusProps {
  data: PerformanceSummary['last_24h'];
}

export interface ConnectionDetailsProps {
  data: PerformanceSummary['last_24h'];
}