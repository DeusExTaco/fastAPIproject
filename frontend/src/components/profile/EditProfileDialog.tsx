import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

interface ProfileData {
  profile: Profile;
  addresses: Address[];
  originalProfile: Profile;
  originalAddresses: Address[];
}

type Tab = 'profile' | 'addresses' | 'socials';
type EditableProfileFields = 'date_of_birth' | 'gender' | 'phone' | 'website' | 'bio' | 'privacy_settings' | 'notification_preferences';

// Custom hooks to separate concerns
const useProfileData = (userId: number, token: string, open: boolean) => {
  const [data, setData] = useState({
    profile: { social_media: {} } as Profile,
    addresses: [] as Address[],
    originalProfile: { social_media: {} } as Profile,
    originalAddresses: [] as Address[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ProfileServiceError | null>(null);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('userId', userId, 'token', token)

        const [profileData, addressesData] = await Promise.all([
          profileService.getProfile(userId, token),
          profileService.getAddresses(userId, token),
        ]);

        console.log('profileData', profileData)

        if (!mounted) return;

        const initialProfile = profileData || { social_media: {} };
        const initialAddresses = addressesData || [];

        setData({
          profile: initialProfile,
          addresses: initialAddresses,
          originalProfile: JSON.parse(JSON.stringify(initialProfile)),
          originalAddresses: JSON.parse(JSON.stringify(initialAddresses))
        });
      } catch (err) {
        if (!mounted) return;
        console.error('Error fetching data:', err);
        setError(err instanceof ProfileServiceError ? err :
          new ProfileServiceError('Failed to load profile data', { originalError: err }));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchData();
    return () => { mounted = false; };
  }, [userId, token, open]);

  return { ...data, loading, error, setData, setError };
};

// Separate component for navigation menu
const NavigationMenu = React.memo(({ activeTab, setActiveTab, isNavExpanded }: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isNavExpanded: boolean;
}) => {
  const menuItems = useMemo(() => [
    { id: 'profile' as Tab, icon: UserCircle, label: 'Profile' },
    { id: 'addresses' as Tab, icon: MapPin, label: 'Addresses' },
    { id: 'socials' as Tab, icon: Share2, label: 'Social Media' },
  ], []);

  return (
    <nav className="mt-4 px-3">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className="w-full text-left group"
        >
          <div className="h-14 flex items-center relative">
            {!isNavExpanded && (
              <div className="absolute left-0 w-16 -ml-3 flex justify-center">
                <div className={`p-2 rounded-lg transition-colors duration-150
                  ${activeTab === item.id
                    ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-200 group-hover:bg-gray-100 dark:group-hover:bg-gray-700'}`}>
                  <item.icon className="w-5 h-5"/>
                </div>
              </div>
            )}

            {isNavExpanded && (
              <div className={`w-full flex items-center rounded-lg transition-colors duration-150 relative
                ${activeTab === item.id
                  ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-200 group-hover:bg-gray-100 dark:group-hover:bg-gray-700'}`}>
                {activeTab === item.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg
                    bg-blue-600 dark:bg-blue-400 transition-colors duration-150"/>
                )}
                <div className="w-16 flex justify-center p-2">
                  <item.icon className="w-5 h-5"/>
                </div>
                <div className={`transition-[width,opacity] duration-200 ease-out
                  overflow-hidden whitespace-nowrap delay-[0ms,100ms]
                  ${isNavExpanded ? 'w-40 opacity-100' : 'w-0 opacity-0'}`}>
                  {item.label}
                </div>
              </div>
            )}
          </div>
        </button>
      ))}
    </nav>
  );
});

// Main component
const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onClose,
  userId,
  token
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isNavExpanded, setIsNavExpanded] = useState(window.innerWidth >= 1024);
  const [saving, setSaving] = useState(false);

  // Reset activeTab to 'profile' whenever the dialog opens
  useEffect(() => {
    if (open) {
      setActiveTab('profile');
    }
  }, [open]);



  const {
    profile,
    addresses,
    originalProfile,
    originalAddresses,
    loading,
    error,
    setData,
    setError
  } = useProfileData(userId, token, open);

  // Memoized change detection
  const changes = useMemo(() => ({
    profile: JSON.stringify(profile) !== JSON.stringify(originalProfile),
    addresses: JSON.stringify(addresses) !== JSON.stringify(originalAddresses),
    social: JSON.stringify(profile.social_media) !== JSON.stringify(originalProfile.social_media)
  }), [profile, addresses, originalProfile, originalAddresses]);

  // Handlers
  const handleProfileChange = useCallback((field: EditableProfileFields, value: any) => {
    setData(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  }, []);

  const handleAddressChange = useCallback((index: number, field: keyof Address, value: string) => {
    setData(prev => ({
      ...prev,
      addresses: prev.addresses.map((addr, i) =>
        i === index ? { ...addr, [field]: value } : addr
      )
    }));
  }, []);

  const handleSocialMediaChange = useCallback((field: string, value: string) => {
    setData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        social_media: { ...(prev.profile.social_media || {}), [field]: value }
      }
    }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      const updates = [];

      if (changes.profile || changes.social) {
        updates.push(profileService.updateProfile(userId, token, {
          ...profile,
          social_media: profile.social_media || {}
        }));
      }

      if (changes.addresses) {
        // Handle address updates
        const addressUpdates = addresses.map(address => {
          const original = originalAddresses.find(a => a.id === address.id);
          if (!original) {
            return profileService.createAddress(userId, token, address);
          }
          if (JSON.stringify(address) !== JSON.stringify(original)) {
            return profileService.updateAddress(userId, address.id!, token, address);
          }
          return null;
        }).filter(Boolean);

        // Handle deletions
        const deletions = originalAddresses
          .filter(original => !addresses.some(addr => addr.id === original.id))
          .map(address => profileService.deleteAddress(userId, address.id!, token));

        updates.push(...addressUpdates, ...deletions);
      }

      await Promise.all(updates);
      onClose();
    } catch (err) {
      setError(err instanceof ProfileServiceError ? err :
        new ProfileServiceError('Failed to save changes', { originalError: err }));
    } finally {
      setSaving(false);
    }
  }, [userId, token, profile, addresses, originalAddresses, changes, onClose]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => setIsNavExpanded(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const handleAddressRemoval = (
    index: number,
    data: ProfileData
  ): ProfileData => {
    return {
      ...data,
      addresses: data.addresses.filter((_, i: number) => i !== index)
    };
  };


  return (
    <DialogLayout
      open={open}
      title="Edit Profile"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="outlined"
            color="gray"
            size="sm"
            onClick={onClose}
            disabled={saving}
            className="dark:text-white dark:border-gray-600"
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
            disabled={saving || !Object.values(changes).some(Boolean)}
            className="dark:text-white flex items-center gap-2"
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      }
      error={error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div className="text-red-700 dark:text-red-200">
              <p className="font-medium">{error.message}</p>
              {error.details && (
                <p className="mt-1 text-sm">{JSON.stringify(error.details)}</p>
              )}
            </div>
          </div>
        </div>
      )}
    >
      <div className="flex h-full">
        <aside className={`
          bg-white dark:bg-gray-800 
          border-r border-gray-200 dark:border-gray-700 
          flex-shrink-0 transition-[width] duration-200 ease-out
          ${isNavExpanded ? 'w-52' : 'w-16'}
        `}>
          <NavigationMenu
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isNavExpanded={isNavExpanded}
          />
        </aside>


        <main className="flex-1 overflow-hidden">
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
                              onRemove={() => setData(prev => handleAddressRemoval(index, prev))}
                          />
                      ))}
                      <Button
                          onClick={() => setData(prev => ({
                            ...prev,
                            addresses: [...prev.addresses, {
                              street: '',
                              city: '',
                              state: '',
                              country: '',
                              postal_code: ''
                            }]
                          }))}
                          variant="outlined"
                          size="sm"
                          className="w-full flex items-center justify-center gap-2"
                          placeholder={""}
                          onPointerEnterCapture={() => {
                          }}
                          onPointerLeaveCapture={() => {
                          }}
                      >
                        <Plus className="h-4 w-4"/>
                        Add Address
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
        </main>
      </div>
    </DialogLayout>
  );
};

export default EditProfileDialog;