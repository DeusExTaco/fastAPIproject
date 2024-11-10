export interface UserPreferences {
  id: number;
  user_id: number;
  dark_mode: boolean;
  theme_preferences: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferencesUpdate {
  dark_mode?: boolean;
  theme_preferences?: Record<string, unknown>;
}