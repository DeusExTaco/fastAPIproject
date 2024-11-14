// src/types/profile.ts

/**
 * Address information structure
 */
export interface Address {
  id?: number;
  user_id?: number;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

/**
 * Social media links configuration
 */
export interface SocialMedia {
  twitter?: string;
  linkedin?: string;
  GitHub?: string;
  Instagram?: string;
  [key: string]: string | undefined;
}

/**
 * User notification preferences configuration
 */
export interface NotificationPreferences {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  [key: string]: boolean | undefined;
}

/**
 * Privacy settings configuration
 */
export interface PrivacySettings {
  profile_visibility?: 'public' | 'private' | 'contacts';
  show_email?: 'yes' | 'no';
  show_phone?: 'yes' | 'no';
  [key: string]: string | undefined;
}

/**
 * Complete user profile structure
 */
export interface Profile {
  id?: number;
  user_id?: number;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  avatar_url?: string | null;
  bio?: string;
  website?: string | null;
  social_media?: SocialMedia;
  notification_preferences?: NotificationPreferences;
  privacy_settings?: PrivacySettings;
}

/**
 * API request configuration
 */
export interface RequestConfig {
  endpoint: string;
  method?: string;
  token: string;
  body?: unknown;
  timeout?: number;
  retry?: boolean;
  useCache?: boolean;
}

/**
 * API validation error structure
 */
export interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
}

/**
 * API error response structure
 */
export interface ErrorResponse {
  detail?: string;
  errors?: ValidationError[];
}