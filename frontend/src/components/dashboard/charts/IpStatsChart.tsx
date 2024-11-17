import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';

interface IpStat {
  ip: string;
  requests: number;
  endpoints: number;
  rateLimited: number;
}

interface IpStatsChartProps {
  data: IpStat[];
}

export const IpStatsChart: React.FC<IpStatsChartProps> = ({ data }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Source IP Activity</h3>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.slice(0, 10)} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis
            dataKey="ip"
            type="category"
            width={150}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="requests"
            fill="#8B5CF6"
            name="Requests"
            radius={[0, 4, 4, 0]}
          />
          <Bar
            dataKey="rateLimited"
            fill="#EF4444"
            name="Rate Limited"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);