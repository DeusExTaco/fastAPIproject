import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';

interface AuthDataPoint {
  name: string;
  value: number;
  color: string;
}

interface AuthenticationChartProps {
  data: AuthDataPoint[];
}

export const AuthenticationChart: React.FC<AuthenticationChartProps> = ({ data }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication Status</h3>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
);