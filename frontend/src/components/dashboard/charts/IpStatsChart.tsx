import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';
import ChartSkeleton from '../ChartSkeleton';
import type { ProcessedIpStats } from '@/types/dashboardTypes';

interface IpStatsChartProps {
  data?: ProcessedIpStats[];
  loading?: boolean;
}

export const IpStatsChart: React.FC<IpStatsChartProps> = ({
  data,
  loading = false
}) => {
  if (loading || !data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Source IP Activity</h3>
        <div className="h-80">
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Source IP Activity</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(0, 10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis type="number" stroke="#6B7280" />
            <YAxis
              dataKey="ip"
              type="category"
              width={150}
              tick={{ fontSize: 12 }}
              stroke="#6B7280"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Bar
              dataKey="requests"
              fill="#8B5CF6"
              name="Requests"
              radius={[0, 4, 4, 0]}
              animationDuration={300}
            />
            <Bar
              dataKey="rateLimited"
              fill="#EF4444"
              name="Rate Limited"
              radius={[0, 4, 4, 0]}
              animationDuration={300}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(IpStatsChart);