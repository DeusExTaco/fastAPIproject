import React from 'react';
import { Input, Textarea, Select, Option } from "@material-tailwind/react";
import { Profile } from '../../types/profile';
import { ProfileServiceError } from '../../types/errors/ProfileServiceError';
import ErrorBoundary from '../errors/ErrorBoundary';
import ProfileErrorFallback from '../errors/ProfileErrorFallback';

type PrivacyVisibility = 'public' | 'private' | 'contacts';
type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

type EditableProfileFields = keyof Pick<Profile,
  'date_of_birth' |
  'gender' |
  'phone' |
  'website' |
  'bio' |
  'privacy_settings' |
  'notification_preferences'
>;

interface ProfileFormProps {
  profile: Partial<Profile>;
  onChange: (field: EditableProfileFields, value: unknown) => void;
}

interface CommonInputProps {
  color: "blue";
  className: string;
  placeholder: string;
  onPointerEnterCapture: () => void;
  onPointerLeaveCapture: () => void;
}

const commonInputProps: CommonInputProps = {
  color: "blue",
  className: "w-full",
  placeholder: "",
  onPointerEnterCapture: () => {},
  onPointerLeaveCapture: () => {}
} as const;

const genderOptions: Gender[] = [
  'male',
  'female',
  'other',
  'prefer_not_to_say'
];

const privacyOptions: PrivacyVisibility[] = [
  'public',
  'private',
  'contacts'
];

const formatFieldName = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');

const ProfileForm: React.FC<ProfileFormProps> = ({
  profile = {},
  onChange,
}) => {
  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
  try {
    const url = e.target.value;
    if (!url) {
      onChange('website', null);
      return;
    }

    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    onChange('website', formattedUrl);
  } catch (error) {
    if (error instanceof Error) {
      throw new ProfileServiceError('Failed to update website URL', {
        originalError: error,
        field: 'website',
        requestInfo: {
          timestamp: new Date().toISOString()
        },
        validationErrors: {
          website: ['Invalid URL format']
        }
      });
    }
    throw error;
  }
};

  const handlePrivacySettingsChange = (value: string | undefined): void => {
    if (value && privacyOptions.includes(value as PrivacyVisibility)) {
      onChange('privacy_settings', {
        ...profile.privacy_settings,
        profile_visibility: value as PrivacyVisibility
      });
    }
  };

  const handleGenderChange = (value: string | undefined): void => {
    if (value && genderOptions.includes(value as Gender)) {
      onChange('gender', value);
    }
  };

  const renderSection = (
    title: string,
    children: React.ReactNode
  ): React.ReactElement => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium dark:text-white">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallbackComponent={ProfileErrorFallback}>
      <div className="space-y-6 max-w-2xl mx-auto p-4">
        {/* Basic Information */}
        {renderSection("Basic Information",
          <>
            <Input
              {...commonInputProps}
              label="Date of Birth"
              type="date"
              value={profile?.date_of_birth ?? ''}
              onChange={(e) => onChange('date_of_birth', e.target.value)}
              crossOrigin={undefined}
            />
            <Select
              {...commonInputProps}
              label="Gender"
              value={profile?.gender ?? ''}
              onChange={handleGenderChange}
            >
              {genderOptions.map(option => (
                <Option key={option} value={option}>
                  {formatFieldName(option)}
                </Option>
              ))}
            </Select>
          </>
        )}

        {/* Contact Information */}
        {renderSection("Contact Information",
          <>
            <Input
              {...commonInputProps}
              label="Phone"
              type="tel"
              value={profile?.phone ?? ''}
              onChange={(e) => onChange('phone', e.target.value)}
              crossOrigin={undefined}
            />
            <Input
              {...commonInputProps}
              label="Website"
              type="url"
              value={profile?.website ?? ''}
              onChange={handleWebsiteChange}
              crossOrigin={undefined}
            />
          </>
        )}

        {/* Bio */}
        {renderSection("About You",
          <Textarea
            {...commonInputProps}
            label="Bio"
            value={profile?.bio ?? ''}
            onChange={(e) => onChange('bio', e.target.value)}
            rows={3}
          />
        )}

        {/* Privacy Settings */}
        {renderSection("Privacy Settings",
          <Select
            {...commonInputProps}
            label="Profile Visibility"
            value={profile?.privacy_settings?.profile_visibility ?? 'private'}
            onChange={handlePrivacySettingsChange}
          >
            {privacyOptions.map(option => (
              <Option key={option} value={option}>
                {formatFieldName(option)}
              </Option>
            ))}
          </Select>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ProfileForm;