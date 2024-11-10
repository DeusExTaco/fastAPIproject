import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Settings } from 'lucide-react';
import { Select, Option, Switch } from "@material-tailwind/react";
import { TableRefreshProps } from '../../types/usersTypes';
import {
  DEFAULT_REFRESH_SETTINGS,
  loadRefreshSettings,
  saveRefreshSettings,
  clearRefreshSettings,
  formatLastRefresh
} from '../../utils/usersUtils';

const REFRESH_INTERVALS = [
  { value: "1", label: "1 minute" },
  { value: "5", label: "5 minutes" },
  { value: "10", label: "10 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
];

export const TableRefreshControls: React.FC<TableRefreshProps> = ({
  onRefresh,
  isUpdating,
  lastUpdated,
  userId
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [refreshSettings, setRefreshSettings] = useState(() =>
    loadRefreshSettings(userId)
  );
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setRefreshSettings(loadRefreshSettings(userId));
  }, [userId]);

  const handleSettingsUpdate = (updates: Partial<typeof refreshSettings>) => {
    setRefreshSettings(current => {
      const updatedSettings = { ...current, ...updates };
      saveRefreshSettings(updatedSettings, userId);
      return updatedSettings;
    });
  };

  const resetSettings = () => {
    clearRefreshSettings(userId);
    setRefreshSettings(DEFAULT_REFRESH_SETTINGS);
  };

  return (
    <div className="flex items-center justify-between mb-6 bg-white rounded-xl shadow-md p-4">
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated ? formatLastRefresh(lastUpdated) : 'Never'}
        </div>

        <button
          onClick={() => void onRefresh()}
          disabled={isUpdating}
          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md
                    hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>

        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-md transition-colors ${
              showSettings 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {showSettings && (
            <div className="absolute top-0 left-full ml-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200
                          transform transition-all duration-200 ease-in-out z-50"
                 style={{ marginTop: '-4px' }}
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="auto-refresh" className="text-sm font-medium text-gray-700">
                    Auto-refresh
                  </label>
                  <Switch
                      id="auto-refresh"
                      checked={refreshSettings.enabled}
                      onChange={() => handleSettingsUpdate({enabled: !refreshSettings.enabled})}
                      color="blue"
                      className="h-full"
                      crossOrigin={undefined}
                      onPointerEnterCapture={undefined}
                      onPointerLeaveCapture={undefined}
                  />
                </div>

                <div className="space-y-2">
                  <Select
                      disabled={!refreshSettings.enabled}
                      value={refreshSettings.interval.toString()}
                      onChange={(value) => value && handleSettingsUpdate({interval: parseInt(value)})}
                      variant="outlined"
                      color="blue"
                      label="Refresh interval"
                      className="w-full"
                      placeholder={undefined}
                      onPointerEnterCapture={undefined}
                      onPointerLeaveCapture={undefined}                  >
                    {REFRESH_INTERVALS.map(({ value, label }) => (
                      <Option key={value} value={value}>
                        {label}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Settings are saved automatically
                  </span>
                  <button
                    onClick={resetSettings}
                    className="text-xs text-red-600 hover:text-red-700
                            transition-colors duration-150"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>

              <div className="absolute -left-2 top-[13px] w-3 h-3 rotate-45 bg-white border-l border-t border-gray-200" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableRefreshControls;