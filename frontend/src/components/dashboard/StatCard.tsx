import React from 'react';
import { StatCardProps } from '../../types/dashboardTypes';

interface ExtendedStatCardProps extends StatCardProps {
  loading?: boolean;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: 'text-blue-500'
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    icon: 'text-green-500'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    icon: 'text-purple-500'
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    icon: 'text-yellow-500'
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    icon: 'text-indigo-500'
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    icon: 'text-pink-500'
  }
};

export const StatCard: React.FC<ExtendedStatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color,
  loading = false
}) => {
  const colors = colorMap[color as keyof typeof colorMap];

  return (
    <div className="bg-white rounded-xl shadow-md p-6 relative min-h-[144px]">
      <div className="flex items-center justify-between">
        <div className="w-full">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h3 className={`text-2xl font-bold text-gray-900 mt-2 ${loading ? 'opacity-50' : ''}`}>
            {value}
          </h3>
          <p className={`text-sm ${colors.text} mt-2`}>{subtext}</p>
        </div>
        <div className={`${colors.bg} p-3 rounded-full shrink-0 ml-4`}>
          <Icon className={`w-6 h-6 ${colors.icon}`}/>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/50 rounded-xl">
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-blue-500 animate-pulse w-1/2"
            />
          </div>
        </div>
      )}
    </div>
  );
};