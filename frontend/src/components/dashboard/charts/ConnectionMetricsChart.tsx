import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';
import type { ChartDataPoint } from '@/types/dashboardTypes.tsx';

interface ConnectionMetricsChartProps {
  data: ChartDataPoint[];
}

export const ConnectionMetricsChart: React.FC<ConnectionMetricsChartProps> = ({ data }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Metrics</h3>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            minTickGap={30}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#6366F1"
            name="Total Connections"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="authenticated"
            stroke="#4F46E5"
            name="Authenticated"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="anonymous"
            stroke="#E5E7EB"
            name="Anonymous"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);