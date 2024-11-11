// src/components/forms/SocialsForm.tsx
import React from 'react';
import { Input } from "@material-tailwind/react";
import { Profile } from '../../types/profile';
import { SocialIcon } from 'react-social-icons';

interface SocialsFormProps {
  socialMedia: Profile['social_media'];
  onChange: (field: string, value: string) => void;
}

const SocialsForm: React.FC<SocialsFormProps> = ({
  socialMedia = {},
  onChange,
}) => {
  const socialPlatforms = [
    { id: 'twitter', label: 'Twitter Username', placeholder: '@username' },
    { id: 'linkedin', label: 'LinkedIn Profile', placeholder: 'LinkedIn profile URL' },
    { id: 'GitHub', label: 'GitHub Username', placeholder: 'GitHub username' },
    { id: 'Instagram', label: 'Instagram Username', placeholder: '@username' }
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-4">
      {socialPlatforms.map((platform) => (
        <div
          key={platform.id}
          className="flex items-center gap-4"
        >
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
            <SocialIcon
              network={platform.id.toLowerCase()}
              style={{ height: 24, width: 24 }}
              className="!h-5 !w-5"
            />
          </div>
          <Input
            label={platform.label}
            color={"blue"}
            value={socialMedia?.[platform.id] ?? ''}
            onChange={(e) => onChange(platform.id, e.target.value)}
            className="w-full"
            crossOrigin={undefined}
            placeholder={platform.placeholder}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />
        </div>
      ))}
    </div>
  );
};

export default SocialsForm;