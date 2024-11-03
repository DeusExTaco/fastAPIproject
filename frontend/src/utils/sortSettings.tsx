// utils/sortSettings.ts

import { DetailedUser } from '../types/types';

interface SortSettings {
    field: keyof DetailedUser;
    direction: 'asc' | 'desc';
}

const DEFAULT_SORT_SETTINGS: SortSettings = {
    field: 'user_name',
    direction: 'asc'
};

export const loadSortSettings = (userId?: string | number): SortSettings => {
    try {
        const key = userId ? `table_sort_settings_${userId}` : 'table_sort_settings';
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : DEFAULT_SORT_SETTINGS;
    } catch {
        return DEFAULT_SORT_SETTINGS;
    }
};

export const saveSortSettings = (settings: SortSettings, userId?: string | number) => {
    const key = userId ? `table_sort_settings_${userId}` : 'table_sort_settings';
    localStorage.setItem(key, JSON.stringify(settings));
};

export const clearSortSettings = (userId?: string | number) => {
    const key = userId ? `table_sort_settings_${userId}` : 'table_sort_settings';
    localStorage.removeItem(key);
};