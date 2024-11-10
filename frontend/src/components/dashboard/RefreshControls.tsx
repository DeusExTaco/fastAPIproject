import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Settings } from 'lucide-react';
import type { RefreshControlsProps } from '../../types/dashboardTypes';
import {
  Select,
  Option,
  Switch,
} from "@material-tailwind/react";

export const RefreshControls: React.FC<RefreshControlsProps> = ({
  lastRefresh,
  onRefresh,
  isLoading,
  refreshSettings,
  onUpdateSettings,
  onResetSettings
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [localSettings, setLocalSettings] = useState(refreshSettings);

  useEffect(() => {
    setLocalSettings(refreshSettings);
  }, [refreshSettings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSettingsUpdate = (updates: Partial<typeof refreshSettings>) => {
    const newSettings = { ...localSettings, ...updates };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  const formatLastRefresh = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const intervals = [
    { value: "1", label: "1 minute" },
    { value: "5", label: "5 minutes" },
    { value: "10", label: "10 minutes" },
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
  ];

  return (
    <div className="flex items-center justify-between mb-6 bg-white rounded-xl shadow-md p-4">
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-500">
          Last updated: {lastRefresh ? formatLastRefresh(lastRefresh) : 'Never'}
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md
                    hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>

        <div className="relative" ref={settingsRef}>
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
                <div className="flex items-center justify-between w-full">
                  <label className="text-sm font-medium text-gray-700">
                    Auto-refresh
                  </label>
                  <Switch
                      checked={localSettings.enabled}
                      onChange={() => handleSettingsUpdate({enabled: !localSettings.enabled})}
                      color="blue"
                      className="h-full"
                      onPointerEnterCapture={undefined}
                      onPointerLeaveCapture={undefined}
                      crossOrigin={undefined}
                  />
                </div>

                <div className="space-y-2">
                  <Select
                      disabled={!localSettings.enabled}
                      value={localSettings.interval.toString()}
                      onChange={(value) => value && handleSettingsUpdate({interval: parseInt(value)})}
                      variant="outlined"
                      color="blue"
                      className="w-full"
                      label="Refresh interval"
                      placeholder=""
                      onPointerEnterCapture={undefined}
                      onPointerLeaveCapture={undefined}>
                    {intervals.map((interval) => (
                        <Option key={interval.value} value={interval.value}>
                          {interval.label}
                        </Option>
                    ))}
                  </Select>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Settings are saved automatically
                  </span>
                  <button
                      onClick={onResetSettings}
                      className="text-xs text-red-600 hover:text-red-700
                            transition-colors duration-150"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>

              {/* Arrow */}
              <div
                  className="absolute -left-2 top-[13px] w-3 h-3 rotate-45 bg-white border-l border-t border-gray-200"/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};