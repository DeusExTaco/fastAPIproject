import React from 'react';

interface TooltipData {
  name: string;
  value: number;
  color: string;
  unit?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipData[];
  label?: string;
  formatter?: (value: number) => string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatter = (value) => value.toFixed(2)
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm min-w-[150px]">
      {label && (
        <p className="font-medium text-gray-900 mb-1 pb-1 border-b border-gray-100">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center space-x-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
            </span>
            <span className="font-medium" style={{ color: entry.color }}>
              {formatter(entry.value)}
              {entry.unit || ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Optional: Export specific formatters that can be used with the CustomTooltip
export const formatters = {
  percentage: (value: number) => `${value.toFixed(1)}%`,
  integer: (value: number) => Math.round(value).toLocaleString(),
  decimal: (value: number) => value.toFixed(2),
  milliseconds: (value: number) => `${Math.round(value)}ms`,
  bytes: (value: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)}${units[unitIndex]}`;
  }
};