import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';
import ChartSkeleton from '../ChartSkeleton';
import type { ChartDataPoint } from '@/types/dashboardTypes';

interface SystemResourcesChartProps {
  data?: ChartDataPoint[];
  loading?: boolean;
}

export const SystemResourcesChart: React.FC<SystemResourcesChartProps> = ({
  data,
  loading = false
}) => {
  // Handle loading and empty states
  if (loading || !data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Resources</h3>
        <div className="h-80">
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Resources</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
            />
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
              domain={[0, 100]}
              stroke="#6B7280"
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: '3 3' }}
            />
            <Legend
              verticalAlign="top"
              height={36}
            />
            <Line
              type="monotone"
              dataKey="cpu"
              stroke="#2196F3"
              name="CPU Usage"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="memory"
              stroke="#4CAF50"
              name="Memory Usage"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="disk"
              stroke="#FF9800"
              name="Disk Usage"
              dot={false}
              strokeWidth={2}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Memoize the component for better performance
export default React.memo(SystemResourcesChart);