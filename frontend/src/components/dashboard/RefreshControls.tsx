import { useState, useRef, useEffect } from 'react';
import { RefreshCw, Settings } from 'lucide-react';
import { Select, Option, Switch } from "@material-tailwind/react";

interface RefreshSettings {
  enabled: boolean;
  interval: number;
}

interface RefreshControlsProps {
  lastRefresh: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
  refreshSettings: RefreshSettings;
  onUpdateSettings: (settings: RefreshSettings) => void;
  onResetSettings: () => void;
}

interface DropdownStyles {
  width: number;
  left: string;
  transform: string;
}

const RefreshControls = ({
  lastRefresh,
  onRefresh,
  isLoading,
  refreshSettings,
  onUpdateSettings,
  onResetSettings
}: RefreshControlsProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const [localSettings, setLocalSettings] = useState(refreshSettings);
  const [dropdownStyles, setDropdownStyles] = useState<DropdownStyles>({
    width: 0,
    left: 'auto',
    transform: 'none'
  });

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

  useEffect(() => {
    if (showSettings && parentRef.current) {
      const calculateDropdown = () => {
        const parentRect = parentRef.current?.getBoundingClientRect();
        if (parentRect) {
          const screenWidth = window.innerWidth;
          let width, left, transform;

          if (screenWidth < 768) {
            // For mobile, use container width minus padding
            width = Math.min(400, parentRect.width - 32);
            left = '50%';
            transform = 'translateX(-50%)';
          } else {
            width = 280; // Fixed width for desktop
            left = 'auto';
            transform = 'none';
          }

          setDropdownStyles({ width, left, transform });
        }
      };

      calculateDropdown();
      window.addEventListener('resize', calculateDropdown);
      return () => window.removeEventListener('resize', calculateDropdown);
    }
  }, [showSettings]);

  const handleSettingsUpdate = (updates: Partial<typeof refreshSettings>) => {
    const newSettings = { ...localSettings, ...updates };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  const formatLastRefresh = (date: Date): string => {
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
    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-6 bg-white rounded-xl shadow-md p-4">
      <div className="text-sm text-gray-500">
        Last updated: {lastRefresh ? formatLastRefresh(lastRefresh) : 'Never'}
      </div>

      <div ref={parentRef} className="flex items-center gap-2">
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
                <div className="mb-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-gray-700">
                      Auto-refresh
                    </span>
                    <Switch
                      checked={localSettings.enabled}
                      onChange={() => handleSettingsUpdate({enabled: !localSettings.enabled})}
                      color="blue"
                      crossOrigin={""}
                      placeholder={""}
                      onPointerEnterCapture={() => {}}
                      onPointerLeaveCapture={() => {}}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <Select
                    disabled={!localSettings.enabled}
                    value={localSettings.interval.toString()}
                    onChange={(value) => value && handleSettingsUpdate({interval: parseInt(value)})}
                    label="Refresh interval"
                    placeholder={""}
                    onPointerEnterCapture={() => {}}
                    onPointerLeaveCapture={() => {}}
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
                  >
                    {intervals.map(({value, label}) => (
                      <Option key={value} value={value} className="text-sm">
                        {label}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="block text-xs text-gray-500 mb-1.5">
                    Settings are saved automatically
                  </span>
                  <button
                    onClick={onResetSettings}
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
  );
};

export default RefreshControls;