import React from 'react';
import { Cpu, MemoryStick, Network } from 'lucide-react';
import type { SystemStatusProps } from '../../types/dashboardTypes';

interface StatusIndicatorProps {
  label: string;
  value: number;
  threshold: {
    warning: number;
    critical: number;
  };
  icon: React.ComponentType<any>;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  label,
  value,
  threshold,
  icon: Icon
}) => {
  const getStatus = () => {
    if (value > threshold.critical) return { color: 'red', text: 'Critical' };
    if (value > threshold.warning) return { color: 'yellow', text: 'Warning' };
    return { color: 'green', text: 'Normal' };
  };

  const status = getStatus();

  return (
    <div
      className={`flex items-center space-x-4 p-4 bg-${status.color}-50 rounded-lg 
                transition-colors duration-200`}
    >
      <Icon className={`w-8 h-8 text-${status.color}-500`} />
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm">{`${value.toFixed(1)}% - ${status.text}`}</p>
      </div>
    </div>
  );
};

export const SystemStatus: React.FC<SystemStatusProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
      <div className="grid grid-cols-1 gap-4">
        <StatusIndicator
          label="CPU Status"
          value={data.avg_cpu_usage}
          threshold={{ warning: 60, critical: 80 }}
          icon={Cpu}
        />
        <StatusIndicator
          label="Memory Status"
          value={data.avg_memory_usage}
          threshold={{ warning: 60, critical: 80 }}
          icon={MemoryStick}
        />
        <StatusIndicator
          label="Connection Status"
          value={(data.avg_active_connections / data.max_active_connections) * 100}
          threshold={{ warning: 70, critical: 90 }}
          icon={Network}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-sm">
            <span className="text-gray-500">Error Rate:</span>
            <span className={`ml-2 font-medium ${
              data.error_rate > 5 ? 'text-red-600' : 
              data.error_rate > 1 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {data.error_rate.toFixed(2)}%
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Response Time:</span>
            <span className={`ml-2 font-medium ${
              data.avg_response_time > 1000 ? 'text-red-600' :
              data.avg_response_time > 500 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {data.avg_response_time.toFixed(0)}ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};