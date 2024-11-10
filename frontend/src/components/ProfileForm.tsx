import React from 'react';
import { Input, Textarea, Select, Option } from "@material-tailwind/react";
import { Profile } from '../types/profile';
import { ProfileServiceError } from '../types/errors/ProfileServiceError';
import ErrorBoundary from '../components/errors/ErrorBoundary';
import ProfileErrorFallback from '../components/errors/ProfileErrorFallback';

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
        { value: e.target.value }
      );
    }
  };

  // Common props for all form elements
  const commonProps = {
    className: "w-full dark:text-white",
    labelProps: {
      className: "!text-gray-900 dark:!text-gray-200 peer-focus:!text-blue-500 dark:peer-focus:!text-white peer-disabled:!text-blue-gray-400",
    },
    containerProps: {
      className: "min-w-[100px]",
    },
  };

  // Special styles for date input
  const dateInputProps = {
    ...commonProps,
    containerProps: {
      className: "min-w-[100px] dark:[&>input]:text-white dark:[&>input::-webkit-calendar-picker-indicator]:invert",
    },
  };

  return (
    <ErrorBoundary fallbackComponent={ProfileErrorFallback}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date of Birth"
            type="date"
            value={profile?.date_of_birth ?? ''}
            onChange={(e) => onChange('date_of_birth', e.target.value)}
            {...dateInputProps}
            crossOrigin={undefined}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />
          <Input
            label="Phone"
            type="tel"
            value={profile?.phone ?? ''}
            onChange={(e) => onChange('phone', e.target.value)}
            {...commonProps}
            crossOrigin={undefined}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />
          <Input
            label="Website"
            type="url"
            value={profile?.website ?? ''}
            onChange={handleWebsiteChange}
            {...commonProps}
            crossOrigin={undefined}
            placeholder="https://example.com"
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />
          <Select
            label="Gender"
            value={profile?.gender ?? ''}
            onChange={(value) => onChange('gender', value)}
            {...commonProps}
            menuProps={{
              className: "dark:bg-gray-800 dark:border-gray-700",
            }}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            <Option value="male" className="dark:text-gray-200 dark:hover:bg-gray-700">Male</Option>
            <Option value="female" className="dark:text-gray-200 dark:hover:bg-gray-700">Female</Option>
            <Option value="other" className="dark:text-gray-200 dark:hover:bg-gray-700">Other</Option>
            <Option value="prefer_not_to_say" className="dark:text-gray-200 dark:hover:bg-gray-700">Prefer not to say</Option>
          </Select>
        </div>
        <Textarea
          label="Bio"
          value={profile?.bio ?? ''}
          onChange={(e) => onChange('bio', e.target.value)}
          rows={4}
          {...commonProps}
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
        <div className="space-y-4">
          <h4 className="font-medium dark:text-gray-200">Privacy Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Profile Visibility"
              value={profile?.privacy_settings?.profile_visibility ?? 'private'}
              onChange={(value) => onChange('privacy_settings', {
                ...profile.privacy_settings,
                profile_visibility: value
              })}
              {...commonProps}
              menuProps={{
                className: "dark:bg-gray-800 dark:border-gray-700",
              }}
              placeholder={""}
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
            >
              <Option value="public" className="dark:text-gray-200 dark:hover:bg-gray-700">Public</Option>
              <Option value="private" className="dark:text-gray-200 dark:hover:bg-gray-700">Private</Option>
              <Option value="contacts" className="dark:text-gray-200 dark:hover:bg-gray-700">Contacts Only</Option>
            </Select>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProfileForm;