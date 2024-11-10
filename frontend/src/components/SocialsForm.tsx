// SocialsForm.tsx
// noinspection XmlDeprecatedElement

import React from 'react';
import { Input } from "@material-tailwind/react";
import { Profile } from '../types/profile';
import { SocialIcon } from 'react-social-icons';

interface SocialsFormProps {
  socialMedia: Profile['social_media'];
  onChange: (field: string, value: string) => void;
}

const SocialsForm: React.FC<SocialsFormProps> = ({
  socialMedia = {},
  onChange,
}) => {

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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-8 h-8">
              <SocialIcon
                  network="twitter"
                  style={{height: 25, width: 25}}
                  className="!h-6 !w-6"
              />
            </div>
            <Input
                label="Twitter Username"
                value={socialMedia?.twitter ?? ''}
                onChange={(e) => onChange('twitter', e.target.value)}
                {...commonProps}
                crossOrigin={undefined}
                placeholder={"@username"}
                onPointerEnterCapture={() => {
                }}
                onPointerLeaveCapture={() => {
                }}
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-8 h-8">
              <SocialIcon
                  network="linkedin"
                  style={{height: 25, width: 25}}
                  className="!h-6 !w-6"
              />
            </div>
            <Input
                label="LinkedIn Profile"
                value={socialMedia?.linkedin ?? ''}
                onChange={(e) => onChange('linkedin', e.target.value)}
                {...commonProps}
                crossOrigin={undefined}
                placeholder={"LinkedIn profile URL"}
                onPointerEnterCapture={() => {
                }}
                onPointerLeaveCapture={() => {
                }}
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-8 h-8">
              <SocialIcon
                  network="github"
                  style={{height: 25, width: 25}}
                  className="!h-6 !w-6"
              />
            </div>
            <Input
                label="GitHub Username"
                value={socialMedia?.GitHub ?? ''}
                onChange={(e) => onChange('GitHub', e.target.value)}
                {...commonProps}
                crossOrigin={undefined}
                placeholder={"GitHub username"}
                onPointerEnterCapture={() => {
                }}
                onPointerLeaveCapture={() => {
                }}
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-8 h-8">
              <SocialIcon
                  network="instagram"
                  style={{height: 25, width: 25}}
                  className="!h-6 !w-6"
              />
            </div>
            <Input
                label="Instagram Username"
                value={socialMedia?.Instagram ?? ''}
                onChange={(e) => onChange('Instagram', e.target.value)}
                {...commonProps}
                crossOrigin={undefined}
                placeholder={"@username"}
                onPointerEnterCapture={() => {
                }}
                onPointerLeaveCapture={() => {
                }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialsForm;