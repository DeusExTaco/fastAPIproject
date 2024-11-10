import { DetailedUser, SortSettings, RefreshSettings } from '../types/usersTypes';

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });
};

export const formatLastRefresh = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const getBadgeClass = (roles: string | string[]): string => {
  const roleList = Array.isArray(roles)
    ? roles.map(r => r.toLowerCase())
    : roles.toString().toLowerCase().split(',').map(r => r.trim());

  if (roleList.includes('admin')) return 'bg-red-100 text-red-800';
  if (roleList.includes('moderator')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};

export const getStatusBadgeClass = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'inactive': return 'bg-gray-100 text-gray-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Settings management
export const DEFAULT_REFRESH_SETTINGS: RefreshSettings = {
  enabled: false,
  interval: 5
};

export const loadRefreshSettings = (userId?: string | number): RefreshSettings => {
  try {
    const key = userId ? `users_refresh_settings_${userId}` : 'users_refresh_settings';
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : DEFAULT_REFRESH_SETTINGS;
  } catch {
    return DEFAULT_REFRESH_SETTINGS;
  }
};

export const saveRefreshSettings = (settings: RefreshSettings, userId?: string | number): void => {
  const key = userId ? `users_refresh_settings_${userId}` : 'users_refresh_settings';
  localStorage.setItem(key, JSON.stringify(settings));
};

export const clearRefreshSettings = (userId?: string | number): void => {
  const key = userId ? `users_refresh_settings_${userId}` : 'users_refresh_settings';
  localStorage.removeItem(key);
};

export const loadSortSettings = (userId?: string | number): SortSettings => {
  try {
    const key = userId ? `users_sort_settings_${userId}` : 'users_sort_settings';
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : { field: 'user_name', direction: 'asc' };
  } catch {
    return { field: 'user_name', direction: 'asc' };
  }
};

export const saveSortSettings = (settings: SortSettings, userId?: string | number): void => {
  const key = userId ? `users_sort_settings_${userId}` : 'users_sort_settings';
  localStorage.setItem(key, JSON.stringify(settings));
};

export const sortUsers = (users: DetailedUser[], sort: SortSettings): DetailedUser[] => {
  return [...users].sort((a, b) => {
    let aValue = a[sort.field];
    let bValue = b[sort.field];

    if (aValue === null || aValue === undefined) return sort.direction === 'asc' ? -1 : 1;
    if (bValue === null || bValue === undefined) return sort.direction === 'asc' ? 1 : -1;

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = (bValue as string).toLowerCase();
    }

    if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
};