// src/components/EditProfileDialog.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@material-tailwind/react";
import {
  UserCircle,
  MapPin,
  Share2,
  AlertTriangle,
  Loader2,
  Plus
} from 'lucide-react';
import DialogLayout from '../layouts/DialogLayout';
import { profileService } from '../../services/profileService';
import { Profile, Address } from '../../types/profile';
import { ProfileServiceError } from '../../types/errors/ProfileServiceError';
import ProfileForm from './ProfileForm';
import AddressForm from './AddressForm';
import SocialsForm from './SocialsForm';

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  token: string;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onClose,
  userId,
  token
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'socials'>('profile');
  const [profile, setProfile] = useState<Profile>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ProfileServiceError | null>(null);
  const [isNavExpanded, setIsNavExpanded] = useState(window.innerWidth >= 1024);

  // Handle responsive navigation
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setIsNavExpanded(true);
      } else {
        setIsNavExpanded(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!open) return;

      try {
        setLoading(true);
        setError(null);
        const [profileData, addressesData] = await Promise.all([
          profileService.getProfile(userId, token),
          profileService.getAddresses(userId, token)
        ]);

        if (!mounted) return;

        setProfile(profileData || {});
        setAddresses(addressesData || []);
      } catch (err) {
        if (!mounted) return;

        console.error('Error fetching data:', err);
        if (err instanceof ProfileServiceError) {
          setError(err);
        } else {
          setError(new ProfileServiceError(
            'Failed to load profile data',
            { originalError: err }
          ));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (open) {
      setActiveTab('profile');
      void fetchData();
    }

    return () => {
      mounted = false;
    };
  }, [userId, token, open]);

  const handleProfileChange = (field: keyof Profile, value: any) => {
    try {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    } catch (err) {
      setError(new ProfileServiceError(
        'Failed to update profile field',
        { field, value, error: err }
      ));
    }
  };

  const handleAddressChange = (index: number, field: keyof Address, value: string) => {
    try {
      setAddresses(prev => {
        const newAddresses = [...prev];
        newAddresses[index] = {
          ...newAddresses[index],
          [field]: value
        };
        return newAddresses;
      });
    } catch (err) {
      setError(new ProfileServiceError(
        'Failed to update address field',
        { index, field, value, error: err }
      ));
    }
  };

  const handleAddAddress = () => {
    try {
      setAddresses(prev => [...prev, {
        street: '',
        city: '',
        state: '',
        country: '',
        postal_code: ''
      }]);
    } catch (err) {
      setError(new ProfileServiceError(
        'Failed to add new address',
        { error: err }
      ));
    }
  };

  const handleRemoveAddress = (index: number) => {
    try {
      setAddresses(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      setError(new ProfileServiceError(
        'Failed to remove address',
        { index, error: err }
      ));
    }
  };

  const handleSocialMediaChange = (field: string, value: string) => {
    try {
      setProfile(prev => ({
        ...prev,
        social_media: {
          ...prev.social_media,
          [field]: value
        }
      }));
    } catch (err) {
      setError(new ProfileServiceError(
        'Failed to update social media field',
        { field, value, error: err }
      ));
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSaving(true);

      const sanitizedProfile = {
        ...profile,
        website: profile.website ? (RegExp(/^https?:\/\//).exec(profile.website) ? profile.website : `https://${profile.website}`) : null,
        date_of_birth: profile.date_of_birth ?? null,
        phone: profile.phone ?? null,
        bio: profile.bio ?? null,
        gender: profile.gender ?? null,
        social_media: profile.social_media || {},
        privacy_settings: profile.privacy_settings || {}
      };

      const updatedProfile = await profileService.updateProfile(userId, token, sanitizedProfile);
      setProfile(updatedProfile);

      if (addresses.length > 0) {
        const addressPromises = addresses.map(address => {
          const { id, user_id, ...addressData } = address;
          return id
            ? profileService.updateAddress(userId, id, token, addressData)
            : profileService.createAddress(userId, token, addressData);
        });

        const updatedAddresses = await Promise.all(addressPromises);
        setAddresses(updatedAddresses);
      }

      onClose();
    } catch (err) {
      console.error('Save error:', err);
      if (err instanceof ProfileServiceError) {
        setError(err);
      } else {
        setError(new ProfileServiceError(
          'Failed to save profile changes',
          { originalError: err }
        ));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocialMedia = async () => {
    try {
      setError(null);
      setSaving(true);

      const socialMediaUpdate = {
        social_media: profile.social_media || {}
      };

      const updatedProfile = await profileService.updateProfile(userId, token, socialMediaUpdate);
      setProfile(prev => ({
        ...prev,
        social_media: updatedProfile.social_media
      }));

      onClose();
    } catch (err) {
      console.error('Social media save error:', err);
      if (err instanceof ProfileServiceError) {
        setError(err);
      } else {
        setError(new ProfileServiceError(
          'Failed to save social media changes',
          { originalError: err }
        ));
      }
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    { id: 'profile', icon: UserCircle, label: 'Profile' },
    { id: 'addresses', icon: MapPin, label: 'Addresses' },
    { id: 'socials', icon: Share2, label: 'Social Media' },
  ];

  return (
    <DialogLayout
      open={open}
      title="Edit Profile"
      onClose={onClose}
      footer={
        <>
          <Button
            variant="outlined"
            color="gray"
            size="sm"
            onClick={onClose}
            className="dark:text-white dark:border-gray-600"
            disabled={saving}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            Cancel
          </Button>
          <Button
            color="blue"
            size="sm"
            onClick={activeTab === 'socials' ? handleSaveSocialMedia : handleSave}
            className="dark:text-white flex items-center gap-2"
            disabled={saving}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
      error={error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-200 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-medium">{error.message}</p>
              {error.details && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                  {typeof error.details === 'string'
                    ? error.details
                    : JSON.stringify(error.details, null, 2)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    >
      <div className="flex h-full">
        {/* Left Navigation */}
        <div
          className={`
            bg-white dark:bg-gray-800 
            border-r border-gray-200 dark:border-gray-700 
            flex-shrink-0 transition-[width] duration-200 ease-out
            ${isNavExpanded ? 'w-48' : 'w-12'}
          `}
        >
          <nav className="mt-4 px-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className="w-full text-left group"
              >
                <div className="h-14 flex items-center relative">
                  {/* Collapsed state */}
                  {!isNavExpanded && (
                    <div className="absolute left-0 w-12 -ml-3 flex justify-center">
                      <div
                        className={`
                          p-2 rounded-lg transition-colors duration-150
                          ${activeTab === item.id
                            ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-200 group-hover:bg-gray-100 dark:group-hover:bg-gray-700'
                          }
                        `}
                      >
                        <item.icon className="w-5 h-5"/>
                      </div>
                    </div>
                  )}

                  {/* Expanded state */}
                  {isNavExpanded && (
                    <div
                      className={`
                        w-full flex items-center rounded-lg transition-colors duration-150 relative
                        ${activeTab === item.id
                          ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-200 group-hover:bg-gray-100 dark:group-hover:bg-gray-700'
                        }
                      `}
                    >
                      {activeTab === item.id && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-blue-600 dark:bg-blue-400" />
                      )}
                      <div className="w-12 flex justify-center p-2">
                        <item.icon className="w-5 h-5"/>
                      </div>
                      <div
                        className={`
                          transition-[width,opacity] duration-200 ease-out
                          overflow-hidden whitespace-nowrap delay-[0ms,100ms]
                          ${isNavExpanded ? 'w-32 opacity-100' : 'w-0 opacity-0'}
                        `}
                      >
                        {item.label}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Scrollable Form Container */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="h-full flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="h-full overflow-y-auto px-4">
              {activeTab === 'profile' && (
                <ProfileForm
                  profile={profile}
                  onChange={handleProfileChange}
                />
              )}

              {activeTab === 'addresses' && (
                <div className="py-4 space-y-4">
                  {addresses.map((address, index) => (
                    <AddressForm
                      key={address.id ?? `address-${index}`}
                      address={address}
                      index={index}
                      onChange={handleAddressChange}
                      onRemove={handleRemoveAddress}
                    />
                  ))}
                  <Button
                    onClick={handleAddAddress}
                    variant="outlined"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2 dark:border-gray-600 dark:text-gray-200"
                    placeholder={""}
                    onPointerEnterCapture={() => {}}
                    onPointerLeaveCapture={() => {}}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Address</span>
                  </Button>
                </div>
              )}

              {activeTab === 'socials' && (
                <SocialsForm
                  socialMedia={profile.social_media}
                  onChange={handleSocialMediaChange}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </DialogLayout>
  );
};

export default EditProfileDialog;