// ProfileForm.tsx
import React from 'react';
import { Input, Textarea } from "@material-tailwind/react";
import { Profile } from '../../types/profile';
import { ProfileServiceError } from '../../types/errors/ProfileServiceError';
import ErrorBoundary from '../errors/ErrorBoundary';
import ProfileErrorFallback from '../errors/ProfileErrorFallback';
import { GenderSelect, PrivacySelect } from '../custom/CustomDropdown';

interface ProfileFormProps {
  profile: Profile;
  onChange: (field: keyof Profile, value: any) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  profile = {},
  onChange,
}) => {
  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      let url = e.target.value;
      if (url && !RegExp(/^https?:\/\//).exec(url)) {
        url = `https://${url}`;
      }
      onChange('website', url);
    } catch (error) {
      throw new ProfileServiceError(
        'Failed to update website URL',
        { value: e.target.value, error }
      );
    }
  };

  return (
      <ErrorBoundary fallbackComponent={ProfileErrorFallback}>
        <div className="space-y-6 max-w-2xl mx-auto p-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium dark:text-white">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                  label="Date of Birth"
                  type="date"
                  color={"blue"}
                  value={profile?.date_of_birth ?? ''}
                  onChange={(e) => onChange('date_of_birth', e.target.value)}
                  className="w-full dark:text-white"
                  crossOrigin={undefined}
                  placeholder={""}
                  onPointerEnterCapture={() => {}}
                  onPointerLeaveCapture={() => {}}
              />
              <GenderSelect
                  value={profile?.gender ?? ''}
                  onChange={(value) => onChange('gender', value)}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium dark:text-white">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                  label="Phone"
                  type="tel"
                  color={"blue"}
                  value={profile?.phone ?? ''}
                  onChange={(e) => onChange('phone', e.target.value)}
                  className="w-full dark:text-white"
                  crossOrigin={undefined}
                  placeholder={""}
                  onPointerEnterCapture={() => {}}
                  onPointerLeaveCapture={() => {}}
              />
              <Input
                  label="Website"
                  type="url"
                  color={"blue"}
                  value={profile?.website ?? ''}
                  onChange={handleWebsiteChange}
                  className="w-full dark:text-white"
                  crossOrigin={undefined}
                  placeholder={""}
                  onPointerEnterCapture={() => {}}
                  onPointerLeaveCapture={() => {}}
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium dark:text-white">About You</h3>
            <Textarea
                label="Bio"
                color={"blue"}
                value={profile?.bio ?? ''}
                onChange={(e) => onChange('bio', e.target.value)}
                rows={3}
                className="w-full dark:text-white"
                placeholder={""}
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
            />
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium dark:text-white">Privacy Settings</h3>
            <PrivacySelect
                value={profile?.privacy_settings?.profile_visibility ?? 'private'}
                onChange={(value) => onChange('privacy_settings', {
                    ...profile.privacy_settings,
                    profile_visibility: value
                })}
            />
          </div>
        </div>
      </ErrorBoundary>
  );
};

export default ProfileForm;