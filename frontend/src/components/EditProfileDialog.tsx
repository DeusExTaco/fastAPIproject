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
  Share2
} from 'lucide-react';
import { profileService } from '../services/profileService';
import { Profile, Address } from '../types/profile';
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
  const [error, setError] = useState<string | null>(null);

  // Fetch profile and addresses data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileData, addressesData] = await Promise.all([
          profileService.getProfile(userId, token),
          profileService.getAddresses(userId, token)
        ]);
        console.log('Fetched profile data:', profileData);
        console.log('Fetched addresses:', addressesData);
        setProfile(profileData || {});
        setAddresses(addressesData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
    fetchData().catch(err => {
      console.error('Unexpected error in fetchData:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    });
  }
}, [userId, token, open]);

  useEffect(() => {
  if (open) {
    setActiveTab('profile');
  }
}, [open]);

  const handleProfileChange = (field: keyof Profile, value: any) => {
    console.log('Profile change:', field, value);
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (index: number, field: keyof Address, value: string) => {
    setAddresses(prev => {
      const newAddresses = [...prev];
      newAddresses[index] = {
        ...newAddresses[index],
        [field]: value
      };
      return newAddresses;
    });
  };

  const handleAddAddress = () => {
    setAddresses(prev => [...prev, {
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    }]);
  };

  const handleRemoveAddress = (index: number) => {
    setAddresses(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setError(null);

      // Create a sanitized version of the profile object
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

      // Update profile
      const updatedProfile = await profileService.updateProfile(userId, token, sanitizedProfile);
      setProfile(updatedProfile);

      // Handle addresses
      if (addresses.length > 0) {
        const addressPromises = addresses.map(address => {
          const { id, user_id, ...addressData } = address;

          if (id) {
            return profileService.updateAddress(userId, id, token, addressData);
          } else {
            return profileService.createAddress(userId, token, addressData);
          }
        });

        const updatedAddresses = await Promise.all(addressPromises);
        setAddresses(updatedAddresses);
      }

      onClose();
    } catch (err) {
      console.error('Save error details:', err);
      let errorMessage = 'Failed to save changes';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      }

      setError(errorMessage);
    }
  };

  const handleSocialMediaChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [field]: value
      }
    }));
  };

  const handleSaveSocialMedia = async () => {
    try {
      setError(null);
      const socialMediaUpdate = {
        social_media: profile.social_media || {} // Ensure we're not sending undefined
      };

      console.log('Saving social media with data:', JSON.stringify(socialMediaUpdate, null, 2));

      const updatedProfile = await profileService.updateProfile(userId, token, socialMediaUpdate);
      setProfile(prev => ({
        ...prev,
        social_media: updatedProfile.social_media
      }));

      onClose();
    } catch (err) {
      console.error('Social media save error details:', err);
      let errorMessage = 'Failed to save social media changes';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      }

      setError(errorMessage);
    }
  };

  return (
    <Dialog
      open={open}
      handler={onClose}
      size="xl"
      className="min-h-[80vh]"
      placeholder=""
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
    >
      <div className="flex flex-col h-full">
        <DialogHeader
          className="flex justify-between items-center border-b"
          placeholder=""
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <IconButton
            variant="text"
            color="blue-gray"
            onClick={onClose}
            className="rounded-full"
            placeholder=""
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            <X className="h-5 w-5" />
          </IconButton>
        </DialogHeader>

        <DialogBody
          className="flex flex-1 p-0"
          placeholder=""
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          {/* Left Side Navigation */}
          <div className="w-64 border-r border-gray-200 p-4">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left ${
                  activeTab === 'profile'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                <UserCircle className="h-5 w-5"/>
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left ${
                  activeTab === 'addresses'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                <MapPin className="h-5 w-5"/>
                <span>Addresses</span>
              </button>
              <button
                onClick={() => setActiveTab('socials')}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left ${
                  activeTab === 'socials'
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50'
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                      {error}
                    </div>
                  )}

                  {activeTab === 'profile' ? (
                    <ProfileForm
                      profile={profile}
                      onChange={handleProfileChange}
                    />
                  ) : activeTab === 'addresses' ? (
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
                        className="w-full flex items-center justify-center space-x-2"
                        placeholder=""
                        onPointerEnterCapture={() => {}}
                        onPointerLeaveCapture={() => {}}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Address</span>
                      </Button>
                    </div>
                  ) : (
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

        <div className="flex justify-end space-x-3 p-4 border-t">
          <Button
            variant="outlined"
            color="gray"
            onClick={onClose}
            placeholder=""
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            Cancel
          </Button>
          <Button
            color="blue"
            onClick={activeTab === 'socials' ? handleSaveSocialMedia : handleSave}
            placeholder=""
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default EditProfileDialog;