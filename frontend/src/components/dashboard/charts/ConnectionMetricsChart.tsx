import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';
import ChartSkeleton from '../ChartSkeleton';
import type { ChartDataPoint } from '@/types/dashboardTypes';

interface ConnectionMetricsChartProps {
  data?: ChartDataPoint[];
  loading?: boolean;
}

export const ConnectionMetricsChart: React.FC<ConnectionMetricsChartProps> = ({
  data,
  loading = false
}) => {
  if (loading || !data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Metrics</h3>
        <div className="h-80">
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  console.log('Connection metrics data:', data);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Metrics</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={30}
              angle={-45}
              textAnchor="end"
              height={60}
              stroke="#6B7280"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#6B7280"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#6366F1"
              name="Total Connections"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 4, strokeWidth: 2 }}
              animationDuration={300}
            />
            <Line
              type="monotone"
              dataKey="authenticated"
              stroke="#4F46E5"
              name="Authenticated"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 4, strokeWidth: 2 }}
              animationDuration={300}
            />
            <Line
              type="monotone"
              dataKey="anonymous"
              stroke="#E5E7EB"
              name="Anonymous"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 4, strokeWidth: 2 }}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(ConnectionMetricsChart);