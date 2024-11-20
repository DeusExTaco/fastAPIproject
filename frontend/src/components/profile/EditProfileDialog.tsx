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

interface NotificationPreferences {
  email?: boolean;
  push?: boolean;
  sms?: boolean;
  [key: string]: boolean | undefined;
}

interface PrivacySettings {
  profile_visibility?: string;
  show_email?: boolean;
  show_phone?: boolean;
  [key: string]: string | boolean | undefined;
}

interface SocialMedia {
  twitter?: string;
  linkedin?: string;
  GitHub?: string;
  Instagram?: string;
  [key: string]: string | undefined;
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

const isAddressEmpty = (address: Address): boolean => {
  return !address.street && !address.city && !address.state && !address.country && !address.postal_code;
};

// Profile service helpers
const profileUpdateHelpers = {
  handleProfileFields: (profile: Profile, changedFields: Set<keyof Profile>): Partial<Profile> => {
    const updatedData: Partial<Profile> = {};

    changedFields.forEach(field => {
      switch (field) {
        case 'website':
          updatedData.website = sanitizeWebsiteUrl(profile.website);
          break;
        case 'social_media':
          break; // Handled separately
        case 'notification_preferences':
          if (profile.notification_preferences) {
            updatedData.notification_preferences = {
              ...profile.notification_preferences
            } as NotificationPreferences;
          }
          break;
        case 'privacy_settings':
          if (profile.privacy_settings) {
            updatedData.privacy_settings = {
              ...profile.privacy_settings
            } as PrivacySettings;
          }
          break;
        default: {
          const value = profile[field];
          if (value !== undefined) {
            (updatedData[field] as Profile[keyof Profile]) = value;
          }
          break;
        }
      }
    });

    return updatedData;
  },

  handleSocialMediaUpdates: (
    changedSocials: Set<string>,
    socialMedia?: SocialMedia
  ): Partial<SocialMedia> => {
    if (changedSocials.size === 0 || !socialMedia) return {};

    const updatedSocials: SocialMedia = {};
    changedSocials.forEach(platform => {
      const value = socialMedia[platform];
      if (value !== undefined) {
        updatedSocials[platform] = value;
      }
    });

    return updatedSocials;
  },

  updateProfile: async (
    userId: number,
    token: string,
    profile: Profile,
    changedFields: Set<keyof Profile>,
    changedSocials: Set<string>,
    profileService: any
  ): Promise<Profile> => {
    const updatedProfileData = profileUpdateHelpers.handleProfileFields(profile, changedFields);
    const updatedSocials = profileUpdateHelpers.handleSocialMediaUpdates(changedSocials, profile.social_media);

    if (Object.keys(updatedSocials).length > 0) {
      updatedProfileData.social_media = updatedSocials;
    }

    return await profileService.updateProfile(userId, token, updatedProfileData);
  }
};

// Address service helpers
const addressUpdateHelpers = {
  handleAddressDeletions: async (
    userId: number,
    token: string,
    deletedAddresses: Set<number>,
    currentAddresses: Address[],
    profileService: any
  ): Promise<Address[]> => {
    if (deletedAddresses.size === 0) return currentAddresses;

    await Promise.all(
      Array.from(deletedAddresses).map(addressId =>
        profileService.deleteAddress(userId, addressId, token)
      )
    );

    return currentAddresses.filter(addr =>
      addr.id ? !deletedAddresses.has(addr.id) : true
    );
  },

  handleAddressModifications: async (
    userId: number,
    token: string,
    modifiedAddresses: Map<number, Set<AddressField>>,
    deletedAddresses: Set<number>,
    currentAddresses: Address[],
    profileService: any
  ): Promise<Address[]> => {
    if (modifiedAddresses.size === 0) return currentAddresses;

    const updatedAddresses = [...currentAddresses];

    await Promise.all(
      Array.from(modifiedAddresses.entries())
        .filter(([id]) => !deletedAddresses.has(id))
        .map(async ([id, fields]) => {
          const address = currentAddresses.find(a => a.id === id);
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

          const index = updatedAddresses.findIndex(a => a.id === id);
          if (index !== -1) {
            updatedAddresses[index] = updatedAddress;
          }
        })
    );

    return updatedAddresses;
  },

  handleAddressAdditions: async (
    userId: number,
    token: string,
    addedIndices: number[],
    currentAddresses: Address[],
    profileService: any
  ): Promise<Address[]> => {
    if (addedIndices.length === 0) return currentAddresses;

    const updatedAddresses = [...currentAddresses];

    const newAddresses = await Promise.all(
      currentAddresses
        .filter((_, index) => addedIndices.includes(index))
        .filter(address => !isAddressEmpty(address))
        .map(async address => {
          const { id, user_id, ...addressData } = address;
          return await profileService.createAddress(userId, token, addressData);
        })
    );

    // Replace temporary addresses with server responses
    newAddresses.forEach(newAddress => {
      const index = updatedAddresses.findIndex(addr =>
        addr.street === newAddress.street && !addr.id
      );
      if (index !== -1) {
        updatedAddresses[index] = newAddress;
      }
    });

    return updatedAddresses.filter(addr => !isAddressEmpty(addr));
  }
};

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
      fetchData();
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

  // Main save handler
  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Handle profile updates
      if (changedFields.profile.size > 0 || changedFields.socials.size > 0) {
        const updatedProfile = await profileUpdateHelpers.updateProfile(
          userId,
          token,
          profile,
          changedFields.profile,
          changedFields.socials,
          profileService
        );
        setProfile(updatedProfile);
      }

      // Handle address updates
      if (addressChanges.modified.size > 0 ||
          addressChanges.deleted.size > 0 ||
          addressChanges.added.length > 0) {

        let updatedAddresses = [...addresses];

        // Process address changes sequentially
        updatedAddresses = await addressUpdateHelpers.handleAddressDeletions(
          userId,
          token,
          addressChanges.deleted,
          updatedAddresses,
          profileService
        );

        updatedAddresses = await addressUpdateHelpers.handleAddressModifications(
          userId,
          token,
          addressChanges.modified,
          addressChanges.deleted,
          updatedAddresses,
          profileService
        );

        updatedAddresses = await addressUpdateHelpers.handleAddressAdditions(
          userId,
          token,
          addressChanges.added,
          updatedAddresses,
          profileService
        );

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