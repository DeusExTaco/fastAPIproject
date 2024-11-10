import React from 'react';
import type { ConnectionDetailsProps } from '../../types/dashboardTypes';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend
}) => (
  <div className="bg-indigo-50 p-4 rounded-lg">
    <p className="text-sm font-medium text-indigo-800">{title}</p>
    <p className="text-2xl font-bold text-indigo-900">
      {typeof value === 'number' ? value.toLocaleString() : value}
    </p>
    {(subtitle || trend !== undefined) && (
      <div className="mt-1 flex items-center space-x-2">
        {subtitle && (
          <span className="text-xs text-indigo-600">{subtitle}</span>
        )}
        {trend !== undefined && (
          <span className={`text-xs ${
            trend > 0 ? 'text-green-600' : 
            trend < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    )}
  </div>
);

export const ConnectionDetails: React.FC<ConnectionDetailsProps> = ({ data }) => {
  // Calculate authentication rate
  const totalConnections = data.authenticated_connections + data.anonymous_connections;
  const authRate = totalConnections > 0
    ? (data.authenticated_connections / totalConnections) * 100
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Details</h3>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Average Active"
          value={Math.round(data.avg_active_connections)}
          subtitle="Concurrent users"
        />
        <MetricCard
          title="Peak Connections"
          value={data.max_active_connections}
          subtitle="Highest load"
        />
        <MetricCard
          title="Total Unique"
          value={data.total_unique_connections}
          subtitle="Distinct sessions"
        />
        <MetricCard
          title="Authentication Rate"
          value={`${authRate.toFixed(1)}%`}
          subtitle="Secured sessions"
        />
        <MetricCard
          title="Unique IPs"
          value={data.unique_ips}
          subtitle="Source addresses"
        />
        <MetricCard
          title="Health Score"
          value={calculateHealthScore(data)}
          subtitle="System health"
        />
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Connection Trends</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm">
            <span className="text-gray-500">Active vs Peak:</span>
            <span className="ml-2 font-medium">
              {((data.avg_active_connections / data.max_active_connections) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Utilization:</span>
            <span className="ml-2 font-medium">
              {calculateUtilization(data)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utility functions
const calculateHealthScore = (data: ConnectionDetailsProps['data']): string => {
  const metrics = [
    // CPU score (inverted as lower is better)
    100 - data.avg_cpu_usage,
    // Memory score (inverted as lower is better)
    100 - data.avg_memory_usage,
    // Error rate score (inverted as lower is better)
    100 - (data.error_rate * 20), // multiply by 20 to make it more significant
    // Response time score (inverse relationship)
    Math.max(0, 100 - (data.avg_response_time / 10)),
    // Connection utilization score
    100 - ((data.avg_active_connections / data.max_active_connections) * 100)
  ];

  const avgScore = metrics.reduce((a, b) => a + b, 0) / metrics.length;
  return `${Math.max(0, Math.min(100, avgScore)).toFixed(1)}%`;
};

const calculateUtilization = (data: ConnectionDetailsProps['data']): string => {
  const baseUtilization = (data.avg_active_connections / data.max_active_connections) * 100;
  return baseUtilization.toFixed(1);
};