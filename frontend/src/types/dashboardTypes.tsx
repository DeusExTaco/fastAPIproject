// src/types/dashboardTypes.ts

// import React from 'react';
import { LucideIcon } from 'lucide-react';

// Color variants for components
export type ColorVariant = 'blue' | 'green' | 'purple' | 'yellow' | 'indigo' | 'pink';

// Base metric interface to reduce duplication
export interface BaseMetric {
  timestamp: string;
}

// Performance Metrics
export interface PerformanceMetric extends BaseMetric {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  avg_connection_duration: number;
  active_connections: number;
  authenticated_connections: number;
  anonymous_connections: number;
}

// Statistics interfaces
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

// Summary interfaces
export interface Last24HSummary {
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
}

export interface PerformanceSummary {
  last_24h: Last24HSummary;
}

export interface PerformanceData {
  metrics: PerformanceMetric[];
  summary: PerformanceSummary;
}

// Chart data interfaces
export interface ChartDataPoint extends BaseMetric {
  cpu?: number;
  memory?: number;
  disk?: number;
  duration?: number;
  total?: number;
  authenticated?: number;
  anonymous?: number;
}

export interface AuthData {
  name: string;
  value: number;
  color: string;
}

export interface ProcessedEndpointStats {
  endpoint: string;
  requests: number;
  avgDuration: number;
  authRate: number;
  timestamp: string;
}

export interface ProcessedIpStats {
  ip: string;
  requests: number;
  endpoints: number;
  rateLimited: number;
}

// Processed data container
export interface ProcessedData {
  timeSeriesData: ChartDataPoint[];
  connectionMetrics: ChartDataPoint[];
  authData: AuthData[];
  endpointStats: ProcessedEndpointStats[];
  ipStats: ProcessedIpStats[];
  summary: PerformanceSummary;
}

// Component props interfaces
export interface RefreshSettings {
  enabled: boolean;
  interval: number;
}

export interface StatCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  color: ColorVariant;
  loading?: boolean;
}

export interface BaseComponentProps {
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export interface SystemStatusProps extends BaseComponentProps {
  data: Last24HSummary;
}

export interface ConnectionDetailsProps extends BaseComponentProps {
  data: Last24HSummary;
}

export interface ChartSkeletonProps {
  height?: string;
}