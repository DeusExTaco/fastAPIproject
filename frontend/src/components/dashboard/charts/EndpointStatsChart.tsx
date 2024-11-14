import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { CustomTooltip } from './CustomTooltip';
import ChartSkeleton from '../ChartSkeleton';
import type { ProcessedEndpointStats } from '@/types/dashboardTypes';

interface EndpointStatsChartProps {
  data?: ProcessedEndpointStats[];
  loading?: boolean;
  hoursToShow?: number;
  topPercentage?: number;
}

const EXCLUDED_ENDPOINTS = [
  "system_monitor",
  "/api/performance/metrics"
];

const normalizeEndpoint = (endpoint: string): string => {
  const segments = endpoint.split('/');
  const normalizedSegments = segments.map(segment => {
    return /^\d+$/.test(segment) ? '*' : segment;
  });
  return normalizedSegments.join('/');
};

const isValidDate = (timestamp: any): boolean => {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
};

const filterByTimeRange = (data: ProcessedEndpointStats[], hoursToShow: number) => {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hoursToShow);

  // Log first item for debugging
  if (data.length > 0) {
    console.debug('[EndpointStatsChart] First data item:', {
      item: data[0],
      hasTimestamp: 'timestamp' in data[0],
      timestampType: typeof data[0].timestamp
    });
  }

  // Initially assume all data is valid for this time period if we can't validate timestamps
  if (!data.some(stat => 'timestamp' in stat && isValidDate(stat.timestamp))) {
    console.debug('[EndpointStatsChart] No valid timestamps found, returning all data');
    return data;
  }

  const filtered = data.filter(stat => {
    if (!stat.timestamp || !isValidDate(stat.timestamp)) {
      console.debug('[EndpointStatsChart] Invalid timestamp for endpoint:', {
        endpoint: stat.endpoint,
        timestamp: stat.timestamp
      });
      return true; // Include items with invalid timestamps
    }

    const statTime = new Date(stat.timestamp);
    return statTime >= cutoffTime;
  });

  console.debug('[EndpointStatsChart] Time filtering results:', {
    total: data.length,
    filtered: filtered.length,
    hoursToShow,
    cutoffTime: cutoffTime.toISOString()
  });

  return filtered;
};

const aggregateEndpointData = (
  data: ProcessedEndpointStats[],
  topPercentage: number
): ProcessedEndpointStats[] => {
  console.debug('[EndpointStatsChart] Starting aggregation:', {
    inputLength: data.length,
    topPercentage
  });

  const aggregatedMap = new Map<string, ProcessedEndpointStats>();

  // Aggregate the data
  data.forEach(stat => {
    const normalizedEndpoint = normalizeEndpoint(stat.endpoint);

    if (aggregatedMap.has(normalizedEndpoint)) {
      const existing = aggregatedMap.get(normalizedEndpoint)!;
      existing.requests += stat.requests;
      existing.authRate = (
        (existing.authRate * existing.requests + stat.authRate * stat.requests) /
        (existing.requests + stat.requests)
      );
    } else {
      aggregatedMap.set(normalizedEndpoint, {
        ...stat,
        endpoint: normalizedEndpoint
      });
    }
  });

  // Sort by requests and take top percentage
  const sortedData = Array.from(aggregatedMap.values())
    .sort((a, b) => b.requests - a.requests);

  const numToShow = Math.max(1, Math.ceil(sortedData.length * (topPercentage / 100)));
  const result = sortedData.slice(0, numToShow);

  console.debug('[EndpointStatsChart] Aggregation complete:', {
    aggregatedCount: aggregatedMap.size,
    sortedLength: sortedData.length,
    numToShow,
    resultLength: result.length,
    firstResult: result[0]
  });

  return result;
};

export const EndpointStatsChart: React.FC<EndpointStatsChartProps> = ({
  data,
  loading = false,
  hoursToShow = 24,
  topPercentage = 20
}) => {
  console.debug('[EndpointStatsChart] Component received props:', {
    hasData: !!data,
    dataLength: data?.length,
    firstItem: data?.[0],
    loading,
    hoursToShow,
    topPercentage
  });

  const processedData = React.useMemo(() => {
    if (!data) {
      console.debug('[EndpointStatsChart] No data provided');
      return [];
    }

    // Filter excluded endpoints
    const filteredData = data.filter(stat =>
      !EXCLUDED_ENDPOINTS.includes(stat.endpoint)
    );

    console.debug('[EndpointStatsChart] Filtered excluded endpoints:', {
      before: data.length,
      after: filteredData.length
    });

    // Filter by time range
    const timeFilteredData = filterByTimeRange(filteredData, hoursToShow);

    // Aggregate and get top percentage
    return aggregateEndpointData(timeFilteredData, topPercentage);
  }, [data, hoursToShow, topPercentage]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900">Endpoint Statistics</h3>
        <div className="h-64">
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (!processedData || processedData.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900">
          No endpoint statistics available
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available for the selected time range
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Top {topPercentage}% Endpoints (Last {hoursToShow}h)
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            layout="vertical"
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid stroke="#E5E7EB" />
            <XAxis
              type="number"
              tickFormatter={(value) => value.toLocaleString()}
            />
            <YAxis
              dataKey="endpoint"
              type="category"
              width={120}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="requests"
              fill="#6366F1"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(EndpointStatsChart);