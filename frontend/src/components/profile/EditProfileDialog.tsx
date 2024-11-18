import React, { useState, useEffect, useCallback } from 'react';
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

interface FormChanges {
  profile: Set<keyof Profile>;
  addresses: Map<number, Set<keyof Address>>;
  socials: Set<string>;
}

type AddressField = Exclude<keyof Address, 'id' | 'user_id'>;

interface AddressChanges {
  modified: Map<number, Set<AddressField>>;
  deleted: Set<number>;
  added: number[];
}

type TabType = 'profile' | 'addresses' | 'socials';

interface MenuItem {
  id: TabType;
  icon: React.FC<{ className?: string }>;
  label: string;
}

// Helper Functions
const sanitizeWebsiteUrl = (website: string | undefined): string | undefined => {
  if (!website) return undefined;
  const hasProtocol = /^https?:\/\//.test(website);
  return hasProtocol ? website : `https://${website}`;
};

const createInitialFormChanges = (): FormChanges => ({
  profile: new Set<keyof Profile>(),
  addresses: new Map<number, Set<keyof Address>>(),
  socials: new Set<string>()
});

const createInitialAddressChanges = (): AddressChanges => ({
  modified: new Map(),
  deleted: new Set(),
  added: []
});

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onClose,
  userId,
  token
}) => {
  // State Management
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [profile, setProfile] = useState<Profile>({ social_media: {} });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ProfileServiceError | null>(null);
  const [isNavExpanded, setIsNavExpanded] = useState(window.innerWidth >= 1024);
  const [changedFields, setChangedFields] = useState<FormChanges>(createInitialFormChanges());
  const [addressChanges, setAddressChanges] = useState<AddressChanges>(createInitialAddressChanges());

  // Menu Configuration
  const menuItems: MenuItem[] = [
    { id: 'profile', icon: UserCircle, label: 'Profile' },
    { id: 'addresses', icon: MapPin, label: 'Addresses' },
    { id: 'socials', icon: Share2, label: 'Social Media' }
  ];

  // Window Resize Handler
  useEffect(() => {
    const handleResize = () => setIsNavExpanded(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data Fetching
  const fetchData = useCallback(async () => {
    if (!open) return;

    try {
      setLoading(true);
      setError(null);

      const [profileData, addressesData] = await Promise.all([
        profileService.getProfile(userId, token),
        profileService.getAddresses(userId, token)
      ]);

      setProfile(profileData || { social_media: {} });
      setAddresses(addressesData || []);
      setChangedFields(createInitialFormChanges());
      setAddressChanges(createInitialAddressChanges());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(
        err instanceof ProfileServiceError
          ? err
          : new ProfileServiceError('Failed to load profile data', { originalError: err })
      );
    } finally {
      setLoading(false);
    }
  }, [userId, token, open]);

  useEffect(() => {
    if (open) {
      setActiveTab('profile');
      void fetchData();
    }
  }, [open, fetchData]);

  // Profile Handlers
  const handleProfileChange = useCallback((field: keyof Profile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setChangedFields(prev => ({
      ...prev,
      profile: new Set(prev.profile).add(field)
    }));
  }, []);

  // Address Handlers
  const handleAddressChange = useCallback((index: number, field: AddressField, value: string) => {
    setAddresses(prev => {
      const newAddresses = [...prev];
      if (index >= 0 && index < newAddresses.length) {
        newAddresses[index] = { ...newAddresses[index], [field]: value };
      }
      return newAddresses;
    });

    setAddressChanges(prev => {
      const newModified = new Map(prev.modified);
      const address = addresses[index];

      if (address?.id) {
        const addressFields = newModified.get(address.id) || new Set<AddressField>();
        addressFields.add(field);
        newModified.set(address.id, addressFields);
      }

      return { ...prev, modified: newModified };
    });
  }, [addresses]);

  const handleAddAddress = useCallback(() => {
    const newAddress: Address = {
      id: undefined,
      user_id: userId,
      street: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    };

    setAddresses(prev => [...prev, newAddress]);
    setAddressChanges(prev => ({
      ...prev,
      added: [...prev.added, addresses.length]
    }));
  }, [userId, addresses.length]);

  const handleRemoveAddress = useCallback((index: number) => {
    const address = addresses[index];
    if (!address) return;

    if (address.id) {
      setAddressChanges(prev => ({
        ...prev,
        deleted: new Set([...prev.deleted, address.id as number])
      }));
    } else {
      setAddresses(prev => prev.filter((_, i) => i !== index));
      setAddressChanges(prev => ({
        ...prev,
        added: prev.added.filter(idx => idx !== index)
      }));
    }
  }, [addresses]);

  const handleSocialMediaChange = useCallback((platform: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      social_media: {
        ...(prev.social_media || {}),
        [platform]: value
      }
    }));
    setChangedFields(prev => ({
      ...prev,
      socials: new Set(prev.socials).add(platform)
    }));
  }, []);

  const hasChanges = changedFields.profile.size > 0 ||
    addressChanges.modified.size > 0 ||
    addressChanges.deleted.size > 0 ||
    addressChanges.added.length > 0 ||
    changedFields.socials.size > 0;

const isAddressEmpty = (address: Address): boolean => {
  return !address.street && !address.city && !address.state && !address.country && !address.postal_code;
};

const handleSave = async () => {
  if (!hasChanges) {
    onClose();
    return;
  }

  try {
    setSaving(true);
    setError(null);

    // Handle Profile Updates
    if (changedFields.profile.size > 0 || changedFields.socials.size > 0) {
      const updatedProfileData: Partial<Profile> = {};

      changedFields.profile.forEach(field => {
        switch (field) {
          case 'website':
            updatedProfileData.website = sanitizeWebsiteUrl(profile.website);
            break;
          case 'social_media':
            // Skip this as it's handled in the socials section
            break;
          case 'notification_preferences':
            if (profile.notification_preferences) {
              updatedProfileData.notification_preferences = {
                ...profile.notification_preferences
              };
            }
            break;
          case 'privacy_settings':
            if (profile.privacy_settings) {
              updatedProfileData.privacy_settings = {
                ...profile.privacy_settings
              };
            }
            break;
          default: {
            // Handle all other simple fields
            const value = profile[field];
            if (value !== undefined) {
              (updatedProfileData[field] as Profile[keyof Profile]) = value;
            }
            break;
          }
        }
      });

      if (changedFields.socials.size > 0) {
        const updatedSocialMedia: NonNullable<Profile['social_media']> = {};
        changedFields.socials.forEach(platform => {
          const value = profile.social_media?.[platform];
          if (value !== undefined) {
            updatedSocialMedia[platform] = value;
          }
        });

        if (Object.keys(updatedSocialMedia).length > 0) {
          updatedProfileData.social_media = updatedSocialMedia;
        }
      }

      const updatedProfile = await profileService.updateProfile(
        userId,
        token,
        updatedProfileData
      );
      setProfile(updatedProfile);
    }

    // Handle Address Updates
    let updatedAddresses = [...addresses];
    if (addressChanges.modified.size > 0 || addressChanges.deleted.size > 0 || addressChanges.added.length > 0) {
      // Handle deletions
      if (addressChanges.deleted.size > 0) {
        await Promise.all(
          Array.from(addressChanges.deleted).map(addressId =>
            profileService.deleteAddress(userId, addressId, token)
          )
        );
        // Update local state by filtering out deleted addresses
        updatedAddresses = updatedAddresses.filter(addr =>
          addr.id ? !addressChanges.deleted.has(addr.id) : true
        );
      }

      // Handle modifications
      if (addressChanges.modified.size > 0) {
        const modificationPromises = Array.from(addressChanges.modified.entries())
          .filter(([id]) => !addressChanges.deleted.has(id))
          .map(async ([id, fields]) => {
            const address = addresses.find(a => a.id === id);
            if (!address?.id || isAddressEmpty(address)) return null;

            const updateData: Partial<Address> = {};
            fields.forEach(field => {
              updateData[field] = address[field];
            });

            const updatedAddress = await profileService.updateAddress(
              userId,
              address.id,
              token,
              updateData
            );

            // Update the address in our local state
            const index = updatedAddresses.findIndex(a => a.id === id);
            if (index !== -1) {
              updatedAddresses[index] = updatedAddress;
            }
          });

        await Promise.all(modificationPromises);
      }

      // Handle additions - filter out empty addresses
      if (addressChanges.added.length > 0) {
        const additionPromises = addresses
          .filter((_, index) => addressChanges.added.includes(index))
          .filter(address => !isAddressEmpty(address)) // Filter out empty addresses
          .map(async address => {
            const { id, user_id, ...addressData } = address;
            const newAddress = await profileService.createAddress(
              userId,
              token,
              addressData
            );
            // Replace the temporary address with the new one from the server
            updatedAddresses = updatedAddresses.map(addr =>
              addr === address ? newAddress : addr
            );
            return newAddress;
          });

        await Promise.all(additionPromises);
      }

      // Remove any empty addresses from local state
      updatedAddresses = updatedAddresses.filter(addr => !isAddressEmpty(addr));

      // Update state with our locally tracked changes
      setAddresses(updatedAddresses);
    }

    setChangedFields(createInitialFormChanges());
    setAddressChanges(createInitialAddressChanges());
    onClose();
  } catch (err) {
    console.error('Save error:', err);
    setError(
      err instanceof ProfileServiceError
        ? err
        : new ProfileServiceError('Failed to save changes', { originalError: err })
    );
  } finally {
    setSaving(false);
  }
};

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
            className="dark:text-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={saving}
            ripple={false}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            Cancel
          </Button>
          <Button
            color="blue"
            size="sm"
            onClick={handleSave}
            className="dark:text-white flex items-center gap-2"
            disabled={saving || !hasChanges}
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
        {/* Navigation */}
        <div
          className={`
            bg-white dark:bg-gray-800 
            border-r border-gray-200 dark:border-gray-700 
            flex-shrink-0 transition-[width] duration-200 ease-out
            ${isNavExpanded ? 'w-48' : 'w-12'}
          `}
        >
          <nav className="mt-4 px-3">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full text-left group"
              >
                <div className="h-14 flex items-center relative">
                  <div
                    className={`
                      p-2 rounded-lg transition-colors duration-150 flex items-center
                      ${activeTab === item.id
                        ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <item.icon className={`w-5 h-5 ${!isNavExpanded ? 'mr-0' : 'mr-3'}`} />
                    {isNavExpanded && <span>{item.label}</span>}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
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
                  {addresses.map((address, index) => {
                    const isDeleted = address.id ? addressChanges.deleted.has(address.id) : false;

                    return (
                      <div
                        key={address.id ?? `new-address-${index}`}
                        className={isDeleted ? 'opacity-50' : ''}
                      >
                        <AddressForm
                          address={address}
                          index={index}
                          onChange={(field, value) => handleAddressChange(index, field, value)}
                          onRemove={() => handleRemoveAddress(index)}
                          isDeleted={isDeleted}
                        />
                      </div>
                    );
                  })}
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