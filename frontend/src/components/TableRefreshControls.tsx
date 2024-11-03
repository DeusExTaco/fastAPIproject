import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Settings } from 'lucide-react';

interface RefreshSettings {
  enabled: boolean;
  interval: number;
}

interface TableRefreshControlsProps {
  onRefresh: () => Promise<void>; // Update the type to match fetchUsers
  isUpdating: boolean;
  lastUpdated: string | null;
  userId?: string | number;
}


const DEFAULT_REFRESH_SETTINGS: RefreshSettings = {
  enabled: false,
  interval: 5
};

// Utility functions for settings persistence
const loadRefreshSettings = (userId?: string | number): RefreshSettings => {
  try {
    const key = userId ? `table_refresh_settings_${userId}` : 'table_refresh_settings';
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : DEFAULT_REFRESH_SETTINGS;
  } catch {
    return DEFAULT_REFRESH_SETTINGS;
  }
};

const saveRefreshSettings = (settings: RefreshSettings, userId?: string | number) => {
  const key = userId ? `table_refresh_settings_${userId}` : 'table_refresh_settings';
  localStorage.setItem(key, JSON.stringify(settings));
};

const clearRefreshSettings = (userId?: string | number) => {
  const key = userId ? `table_refresh_settings_${userId}` : 'table_refresh_settings';
  localStorage.removeItem(key);
};

const TableRefreshControls: React.FC<TableRefreshControlsProps> = ({
  onRefresh,
  isUpdating,
  lastUpdated,
  userId
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [refreshSettings, setRefreshSettings] = useState<RefreshSettings>(() =>
    loadRefreshSettings(userId)
  );
  const popoverRef = useRef<HTMLDivElement>(null);

  // Effect to handle clicks outside settings popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effect to reload settings when user changes
  useEffect(() => {
    setRefreshSettings(loadRefreshSettings(userId));
  }, [userId]);

  // Update settings with persistence
  const updateRefreshSettings = (newSettings: Partial<RefreshSettings>) => {
    setRefreshSettings(current => {
      const updatedSettings = {
        ...current,
        ...newSettings
      };
      saveRefreshSettings(updatedSettings, userId);
      return updatedSettings;
    });
  };

  // Reset settings to defaults
  const resetSettings = () => {
    clearRefreshSettings(userId);
    setRefreshSettings(DEFAULT_REFRESH_SETTINGS);
  };

  return (
    <div className="flex items-center justify-between mb-6 bg-white rounded-xl shadow-md p-4">
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
        </div>
        <div className="flex items-center space-x-2">
          <button
              onClick={() => void onRefresh()} // Use void to handle the Promise
              className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-md
           hover:bg-blue-100 transition-colors disabled:opacity-50"
              disabled={isUpdating}
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`}/>
            <span>Refresh</span>
          </button>

          {/* Settings button and popover container */}
          <div className="relative">
            <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-md transition-colors ${
                    showSettings
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
              <Settings className="w-4 h-4"/>
            </button>

            {/* Settings Popover */}
            {showSettings && (
                <div
                    ref={popoverRef}
                    className="absolute top-0 left-full ml-2 w-[240px] bg-white rounded-lg shadow-lg border border-gray-200
                         transform transition-all duration-200 ease-in-out z-50"
                    style={{marginTop: '-4px'}}
                >
                  <div className="p-4 space-y-4">
                    {/* Auto-refresh Toggle */}
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="auto-refresh-toggle"
                        className="text-sm font-medium text-gray-700"
                      >
                        Auto-refresh
                      </label>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          id="auto-refresh-toggle"
                          type="checkbox"
                          checked={refreshSettings.enabled}
                          onChange={(e) => updateRefreshSettings({ enabled: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Interval Selection */}
                    <div className="space-y-2">
                      <label
                        htmlFor="refresh-interval"
                        className="text-sm font-medium text-gray-700"
                      >
                        Refresh interval
                      </label>
                      <select
                        id="refresh-interval"
                        value={refreshSettings.interval}
                        onChange={(e) => updateRefreshSettings({
                          interval: Number(e.target.value)
                        })}
                        className="block w-full rounded-md border border-gray-300 py-1.5 px-3
                                   text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                                   focus:border-blue-500 bg-white"
                      >
                        <option value="1">1 minute</option>
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                      </select>
                    </div>

                    {/* Footer */}
                    <div className="pt-2 flex justify-between items-center border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      User settings
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

                  {/* Arrow */}
                  <div
                      className="absolute -left-2 top-[13px] w-3 h-3 rotate-45 bg-white border-l border-t border-gray-200"/>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableRefreshControls;