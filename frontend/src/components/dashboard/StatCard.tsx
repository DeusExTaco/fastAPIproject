import React from 'react';
import { StatCardProps } from '../../types/dashboardTypes';

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color
}) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
        <p className={`text-sm text-${color}-600 mt-2`}>{subtext}</p>
      </div>
      <div className={`bg-${color}-50 p-3 rounded-full`}>
        <Icon className={`w-6 h-6 text-${color}-500`}/>
      </div>
    </div>
  </div>
);