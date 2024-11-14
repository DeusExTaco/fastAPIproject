// src/components/dashboard/ChartSkeleton.tsx

import { ChartSkeletonProps } from '../../types/dashboardTypes';

const ChartSkeleton = ({ height = 'h-64' }: ChartSkeletonProps) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 w-full">
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
      <div className={`${height} bg-gray-200 dark:bg-gray-700 rounded-lg`}></div>
    </div>
  </div>
);

export default ChartSkeleton;