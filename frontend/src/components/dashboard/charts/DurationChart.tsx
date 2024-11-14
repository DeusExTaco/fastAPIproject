import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';
import ChartSkeleton from '../ChartSkeleton';
import type { ChartDataPoint } from '@/types/dashboardTypes';

interface DurationChartProps {
  data?: ChartDataPoint[];
  loading?: boolean;
}

export const DurationChart: React.FC<DurationChartProps> = ({
  data,
  loading = false
}) => {
  if (loading || !data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Duration</h3>
        <div className="h-80">
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Duration</h3>
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
              dataKey="duration"
              stroke="#EC4899"
              name="Avg Duration (ms)"
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

export default React.memo(DurationChart);