// src/utils/dashboardSettings.ts

interface RefreshSettings {
  enabled: boolean;
  interval: number; // in minutes
}

export const DEFAULT_REFRESH_SETTINGS: RefreshSettings = {
  enabled: true,
  interval: 1
};

const getDashboardSettingsKey = (userId: number | string | undefined): string => {
  return `dashboard_refresh_settings_user_${userId}`;
};

export const loadRefreshSettings = (userId: number | string): RefreshSettings => {
  if (!userId) return DEFAULT_REFRESH_SETTINGS;

  try {
    const savedSettings = localStorage.getItem(getDashboardSettingsKey(userId));
    if (!savedSettings) return DEFAULT_REFRESH_SETTINGS;

    const parsedSettings = JSON.parse(savedSettings) as RefreshSettings;
    return {
      enabled: parsedSettings.enabled ?? DEFAULT_REFRESH_SETTINGS.enabled,
      interval: parsedSettings.interval ?? DEFAULT_REFRESH_SETTINGS.interval
    };
  } catch (error) {
    console.error('Error loading refresh settings:', error);
    return DEFAULT_REFRESH_SETTINGS;
  }
};

export const saveRefreshSettings = (
  userId: number | string,
  settings: RefreshSettings
): void => {
  if (!userId) return;

  try {
    localStorage.setItem(
      getDashboardSettingsKey(userId),
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error('Error saving refresh settings:', error);
  }
};

export const clearRefreshSettings = (userId: number | string): void => {
  if (!userId) return;

  try {
    localStorage.removeItem(getDashboardSettingsKey(userId));
  } catch (error) {
    console.error('Error clearing refresh settings:', error);
  }
};