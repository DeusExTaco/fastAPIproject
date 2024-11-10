import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';
import type { ChartDataPoint } from '@/types/dashboardTypes.tsx';

interface SystemResourcesChartProps {
  data: ChartDataPoint[];
}

export const SystemResourcesChart: React.FC<SystemResourcesChartProps> = ({ data }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Resources</h3>
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
          <YAxis
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="cpu"
            stroke="#2196F3"
            name="CPU"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="memory"
            stroke="#4CAF50"
            name="Memory"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="disk"
            stroke="#FF9800"
            name="Disk"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);