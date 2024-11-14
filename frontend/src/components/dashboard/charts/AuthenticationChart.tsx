import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';
import ChartSkeleton from '../ChartSkeleton';
import type { AuthData } from '@/types/dashboardTypes';

interface AuthenticationChartProps {
  data?: AuthData[];
  loading?: boolean;
}

export const AuthenticationChart: React.FC<AuthenticationChartProps> = ({
  data,
  loading = false
}) => {
  if (loading || !data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication Status</h3>
        <div className="h-80">
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  // console.log('Auth data:', data);

  return (
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
              animationDuration={300}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="middle" align="right" layout="vertical" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(AuthenticationChart);