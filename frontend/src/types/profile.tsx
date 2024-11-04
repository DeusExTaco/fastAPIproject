// src/types/profile.ts
export interface Address {
  id?: number;
  user_id?: number;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface Profile {
  id?: number;
  user_id?: number;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  social_media?: {
    twitter?: string;
    linkedin?: string;
    GitHub?: string;
    Instagram?: string;
    [key: string]: string | undefined;
  };
  notification_preferences?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    [key: string]: boolean | undefined;
  };
  privacy_settings?: {
    profile_visibility?: string;
    show_email?: boolean;
    show_phone?: boolean;
    [key: string]: string | boolean | undefined;
  };
}