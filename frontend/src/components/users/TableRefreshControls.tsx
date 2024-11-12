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

interface ExtendedTableRefreshProps extends TableRefreshProps {
  setIsPolling: (isPolling: boolean) => void;
}

const TableRefreshControls: React.FC<ExtendedTableRefreshProps> = ({
  onRefresh,
  isUpdating,
  lastUpdated,
  userId,
  setIsPolling
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [refreshSettings, setRefreshSettings] = useState(() =>
    loadRefreshSettings(userId)
  );
  const popoverRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const [dropdownStyles, setDropdownStyles] = useState({
    width: 0,
    left: '0px',
    transform: 'none'
  });

  // Initialize polling based on saved settings
  useEffect(() => {
    setIsPolling(refreshSettings.enabled);
  }, [setIsPolling, refreshSettings.enabled]);

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
    if (showSettings && parentRef.current) {
      const calculateDropdown = () => {
        const parentRect = parentRef.current?.getBoundingClientRect();
        if (parentRect) {
          const screenWidth = window.innerWidth;
          let width, left, transform;

          if (screenWidth < 768) {
            width = Math.min(400, parentRect.width - 32);
            left = '50%';
            transform = 'translateX(-50%)';
          } else {
            width = 280;
            left = 'auto';
            transform = 'none';
          }

          setDropdownStyles({
            width,
            left,
            transform
          });
        }
      };

      calculateDropdown();
      window.addEventListener('resize', calculateDropdown);
      return () => window.removeEventListener('resize', calculateDropdown);
    }
  }, [showSettings]);

  const handleSettingsUpdate = (updates: Partial<typeof refreshSettings>) => {
    const updatedSettings = { ...refreshSettings, ...updates };
    setRefreshSettings(updatedSettings);
    saveRefreshSettings(userId, updatedSettings);

    // Update polling state when auto-refresh is toggled
    if ('enabled' in updates) {
      setIsPolling(updates.enabled ?? false);
    }
  };

  const handleResetSettings = () => {
    clearRefreshSettings(userId);
    setRefreshSettings(DEFAULT_REFRESH_SETTINGS);
    setIsPolling(DEFAULT_REFRESH_SETTINGS.enabled);
  };

  return (
    <div ref={parentRef} className="w-full">
      {/* Main Controls Container */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        {/* Last Updated Text */}
        <div className="text-sm text-gray-500 whitespace-nowrap">
          Last updated: {lastUpdated ? formatLastRefresh(lastUpdated) : '00:00:00 AM'}
        </div>

        {/* Buttons Container */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => void onRefresh()}
            disabled={isUpdating}
            className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md
                    hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`}/>
            <span>Refresh</span>
          </button>

          {/* Settings Button and Dropdown */}
          <div ref={popoverRef} className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                showSettings 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings className="h-5 w-5" />
            </button>

            {showSettings && (
              <div
                style={{
                  width: `${dropdownStyles.width}px`,
                  left: dropdownStyles.left,
                  transform: dropdownStyles.transform
                }}
                className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200
                         transition-all duration-200 ease-in-out top-full mt-2 md:right-0"
              >
                <div className="p-3">
                  {/* Auto-refresh Toggle */}
                  <div className="mb-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium text-gray-700">
                        Auto-refresh
                      </span>
                      <Switch
                        checked={refreshSettings.enabled}
                        onChange={() => handleSettingsUpdate({enabled: !refreshSettings.enabled})}
                        color="blue"
                        placeholder={""}
                        crossOrigin={""}
                        onPointerEnterCapture={() => {}}
                        onPointerLeaveCapture={() => {}}
                      />
                    </div>
                  </div>

                  {/* Interval Selector */}
                  <div className="mb-3">
                    <Select
                      disabled={!refreshSettings.enabled}
                      value={refreshSettings.interval.toString()}
                      onChange={(value) => value && handleSettingsUpdate({interval: parseInt(value)})}
                      label="Refresh interval"
                      placeholder={""}
                      className="text-sm"
                      menuProps={{
                        className: "text-sm"
                      }}
                      labelProps={{
                        className: "text-sm"
                      }}
                      containerProps={{
                        className: "min-w-[120px]"
                      }}
                      onPointerEnterCapture={() => {}}
                      onPointerLeaveCapture={() => {}}
                    >
                      {REFRESH_INTERVALS.map(({value, label}) => (
                        <Option key={value} value={value} className="text-sm">
                          {label}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t border-gray-100">
                    <span className="block text-xs text-gray-500 mb-1.5">
                      Settings are saved automatically
                    </span>
                    <button
                      onClick={handleResetSettings}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableRefreshControls;