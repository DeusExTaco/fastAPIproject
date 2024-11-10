import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';

interface EndpointStat {
  endpoint: string;
  requests: number;
  avgDuration: number;
  authRate: number;
}

interface EndpointStatsChartProps {
  data: EndpointStat[];
}

export const EndpointStatsChart: React.FC<EndpointStatsChartProps> = ({ data }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Endpoint Statistics</h3>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis
            dataKey="endpoint"
            type="category"
            width={150}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="requests"
            fill="#6366F1"
            name="Requests"
            radius={[0, 4, 4, 0]}
          />
          <Bar
            dataKey="authRate"
            fill="#4F46E5"
            name="Auth Rate %"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);