import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogBody,
  Button,
  IconButton,
} from "@material-tailwind/react";
import {
  UserCircle,
  MapPin,
  X,
  Plus,
  Share2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { profileService } from '../services/profileService';
import { Profile, Address } from '../types/profile';
import { ProfileServiceError } from '../types/errors/ProfileServiceError';
import ErrorBoundary from '../components/errors/ErrorBoundary';
import ProfileErrorFallback from '../components/errors/ProfileErrorFallback';
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

        console.log('Fetched profile data:', profileData);
        console.log('Fetched addresses:', addressesData);
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
      // Using void operator to explicitly ignore the promise
      void fetchData();
    }

    return () => {
      mounted = false;
    };
  }, [userId, token, open]);

  const handleProfileChange = (field: keyof Profile, value: any) => {
    try {
      console.log('Profile change:', field, value);
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

      console.log('Saving profile with data:', JSON.stringify(sanitizedProfile, null, 2));

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
      console.error('Save error details:', err);
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

      console.log('Saving social media with data:', JSON.stringify(socialMediaUpdate, null, 2));

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

  return (
    <Dialog
      open={open}
      handler={onClose}
      size="xl"
      className="min-h-[80vh] dark:bg-gray-800"
      placeholder=" "
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
    >
      <ErrorBoundary fallbackComponent={ProfileErrorFallback}>
        <div className="flex flex-col h-full">
          <DialogHeader
              className="flex justify-between items-center border-b dark:border-gray-700"
              placeholder=" "
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
          >
            <h2 className="text-xl font-bold dark:text-white">Edit Profile</h2>
            <IconButton
              variant="text"
              color="blue-gray"
              onClick={onClose}
              className="rounded-full"
              placeholder=" "
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
            >
              <X className="h-5 w-5" />
            </IconButton>
          </DialogHeader>

          <DialogBody
              className="flex flex-1 p-0 dark:text-white"
              placeholder=" "
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
          >
            {/* Left Side Navigation */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  <UserCircle className="h-5 w-5"/>
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left ${
                    activeTab === 'addresses'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  <MapPin className="h-5 w-5"/>
                  <span>Addresses</span>
                </button>
                <button
                  onClick={() => setActiveTab('socials')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left ${
                    activeTab === 'socials'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200'
                  }`}
                >
                  <Share2 className="h-5 w-5"/>
                  <span>Social Media</span>
                </button>
              </div>
            </div>

            {/* Right Side Content */}
            <div className="flex-1 overflow-auto">
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <>
                    {error && (
                      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-200 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 mt-0.5" />
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
                    )}

                    {activeTab === 'profile' && (
                      <ProfileForm
                        profile={profile}
                        onChange={handleProfileChange}
                      />
                    )}

                    {activeTab === 'addresses' && (
                      <div className="space-y-6">
                        {addresses.map((address, index) => (
                          <AddressForm
                            key={address.id ?? `address-${index}-${address.street}-${address.postal_code}`}
                            address={address}
                            index={index}
                            onChange={handleAddressChange}
                            onRemove={handleRemoveAddress}
                          />
                        ))}
                        <Button
                          onClick={handleAddAddress}
                          variant="outlined"
                          className="w-full flex items-center justify-center space-x-2 dark:border-gray-600 dark:text-gray-200"
                          placeholder=" "
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
                  </>
                )}
              </div>
            </div>
          </DialogBody>

          <div className="flex justify-end space-x-3 p-4 border-t dark:border-gray-700">
            <Button
              variant="outlined"
              color="gray"
              onClick={onClose}
              className="dark:text-white dark:border-gray-600"
              disabled={saving}
              placeholder=" "
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
            >
              Cancel
            </Button>
            <Button
              color="blue"
              onClick={activeTab === 'socials' ? handleSaveSocialMedia : handleSave}
              className="dark:text-white flex items-center gap-2"
              disabled={saving}
              placeholder=" "
              onPointerEnterCapture={() => {}}
              onPointerLeaveCapture={() => {}}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </ErrorBoundary>
    </Dialog>
  );
};

export default EditProfileDialog;