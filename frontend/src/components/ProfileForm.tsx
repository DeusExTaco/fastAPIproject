import React from 'react';
import { Input, Textarea, Select, Option } from "@material-tailwind/react";
import { Profile } from '../types/profile';

interface ProfileFormProps {
  profile: Profile;
  onChange: (field: keyof Profile, value: any) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  profile = {},
  onChange,
}) => {
  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let url = e.target.value;
    if (url && !RegExp(/^https?:\/\//).exec(url)) {
      url = `https://${url}`;
    }
    onChange('website', url);
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date of Birth"
          type="date"
          value={profile?.date_of_birth ?? ''}
          onChange={(e) => onChange('date_of_birth', e.target.value)}
          className="w-full"
          crossOrigin={undefined}
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
        <Input
          label="Phone"
          type="tel"
          value={profile?.phone ?? ''}
          onChange={(e) => onChange('phone', e.target.value)}
          className="w-full"
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
          className="w-full"
          crossOrigin={undefined}
          placeholder="https://example.com"
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
        <Select
          label="Gender"
          value={profile?.gender ?? ''}
          onChange={(value) => onChange('gender', value)}
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <Option value="male">Male</Option>
          <Option value="female">Female</Option>
          <Option value="other">Other</Option>
          <Option value="prefer_not_to_say">Prefer not to say</Option>
        </Select>
      </div>
      <Textarea
        label="Bio"
        value={profile?.bio ?? ''}
        onChange={(e) => onChange('bio', e.target.value)}
        rows={4}
        placeholder={""}
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      />
      <div className="space-y-4">
        <h4 className="font-medium">Privacy Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Profile Visibility"
            value={profile?.privacy_settings?.profile_visibility ?? 'private'}
            onChange={(value) => onChange('privacy_settings', {
              ...profile.privacy_settings,
              profile_visibility: value
            })}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            <Option value="public">Public</Option>
            <Option value="private">Private</Option>
            <Option value="contacts">Contacts Only</Option>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;