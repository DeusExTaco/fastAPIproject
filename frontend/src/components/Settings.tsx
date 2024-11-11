import React, { useState, ReactNode } from 'react';
import {
  // Bell,
  Moon,
  Sun,
  // Globe,
  Lock,
  Shield,
  Mail,
  Smartphone,
  Eye,
  BellRing,
  // BellOff,
  Languages,
  UserCog
} from 'lucide-react';
import { Switch } from "@material-tailwind/react";
import ChangePasswordModal from './password/ChangePasswordModal.tsx';
import EditProfileDialog from './profile/EditProfileDialog.tsx';
import { useAuth } from '../UseAuth';
import { useTheme } from '../contexts/ThemeContexts';

interface SettingsSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

interface Settings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  securityAlerts: boolean;
  twoFactorAuth: boolean;
  activityLog: boolean;
  loginAlerts: boolean;
  language: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, children }) => {
  return (
    <div className="border-b border-gray-200 pb-6 mb-6 last:border-0">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {children}
    </div>
  );
};

const SettingsPage = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, token } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    pushNotifications: true,
    securityAlerts: true,
    twoFactorAuth: false,
    activityLog: true,
    loginAlerts: true,
    language: 'English',
  });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleSettingChange = (setting: keyof Settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handlePasswordModalOpen = () => {
    setIsPasswordModalOpen(true);
  };

  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
  };

  const handleProfileModalOpen = () => {
    setIsProfileModalOpen(true);
  };

  const handleProfileModalClose = () => {
    setIsProfileModalOpen(false);
  };

  return (
    <div className="space-y-6 dark:bg-gray-900">
      {/* Quick Actions Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleProfileModalOpen}
            className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors"
          >
            <UserCog className="w-5 h-5 text-blue-500 dark:text-blue-400"/>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Update Profile</span>
          </button>
          <button
            onClick={handlePasswordModalOpen}
            className="flex items-center space-x-2 p-4 bg-purple-50 dark:bg-gray-700 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-600 transition-colors"
          >
            <Lock className="w-5 h-5 text-purple-500 dark:text-purple-400"/>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Change Password</span>
          </button>
          <button
            className="flex items-center space-x-2 p-4 bg-green-50 dark:bg-gray-700 rounded-lg hover:bg-green-100 dark:hover:bg-gray-600 transition-colors"
          >
            <Languages className="w-5 h-5 text-green-500 dark:text-green-400"/>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Language Settings</span>
          </button>
        </div>
      </div>


        {/* General Settings Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>

          <SettingsSection
            title="Appearance"
            description="Customize how the dashboard looks and feels"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {darkMode ? <Moon className="w-5 h-5 dark:text-white"/> : <Sun className="w-5 h-5"/>}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Dark Mode</span>
              </div>
              <Switch
                checked={darkMode}
                onChange={toggleDarkMode}
                color="blue"
                placeholder=""
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
                crossOrigin=""
              />
            </div>
          </SettingsSection>

          <SettingsSection
              title="Notifications"
              description="Manage your notification preferences"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5"/>
                  <span className="text-sm font-medium text-gray-700">Email Notifications</span>
                </div>
                <Switch
                    checked={settings.emailNotifications}
                    onChange={() => handleSettingChange('emailNotifications')}
                    color="blue"
                    placeholder=""
                    onPointerEnterCapture={() => {
                    }}
                    onPointerLeaveCapture={() => {
                    }}
                    crossOrigin={undefined}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5"/>
                  <span className="text-sm font-medium text-gray-700">Push Notifications</span>
                </div>
                <Switch
                    checked={settings.pushNotifications}
                    onChange={() => handleSettingChange('pushNotifications')}
                    color="blue"
                    placeholder=""
                    onPointerEnterCapture={() => {
                    }}
                    onPointerLeaveCapture={() => {
                    }}
                    crossOrigin={undefined}
                />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
              title="Security"
              description="Configure your security preferences"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5"/>
                  <span className="text-sm font-medium text-gray-700">Security Alerts</span>
                </div>
                <Switch
                    checked={settings.securityAlerts}
                    onChange={() => handleSettingChange('securityAlerts')}
                    color="blue"
                    placeholder=""
                    onPointerEnterCapture={() => {
                    }}
                    onPointerLeaveCapture={() => {
                    }}
                    crossOrigin={undefined}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Lock className="w-5 h-5"/>
                  <span className="text-sm font-medium text-gray-700">Two-Factor Authentication</span>
                </div>
                <Switch
                    checked={settings.twoFactorAuth}
                    onChange={() => handleSettingChange('twoFactorAuth')}
                    color="blue"
                    placeholder=""
                    onPointerEnterCapture={() => {
                    }}
                    onPointerLeaveCapture={() => {
                    }}
                    crossOrigin={undefined}
                />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
              title="Activity"
              description="Manage activity monitoring and logging"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5"/>
                  <span className="text-sm font-medium text-gray-700">Activity Log</span>
                </div>
                <Switch
                    checked={settings.activityLog}
                    onChange={() => handleSettingChange('activityLog')}
                    color="blue"
                    placeholder=""
                    onPointerEnterCapture={() => {
                    }}
                    onPointerLeaveCapture={() => {
                    }}
                    crossOrigin={undefined}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BellRing className="w-5 h-5"/>
                  <span className="text-sm font-medium text-gray-700">Login Alerts</span>
                </div>
                <Switch
                    checked={settings.loginAlerts}
                    onChange={() => handleSettingChange('loginAlerts')}
                    color="blue"
                    placeholder=""
                    onPointerEnterCapture={() => {
                    }}
                    onPointerLeaveCapture={() => {
                    }}
                    crossOrigin={undefined}
                />
              </div>
            </div>
          </SettingsSection>
        </div>

        {/* Modals */}
        <ChangePasswordModal
          open={isPasswordModalOpen}
          onClose={handlePasswordModalClose}
          userId={user?.id ?? 0} // Changed from '' to 0
        />

        <EditProfileDialog
          open={isProfileModalOpen}
          onClose={handleProfileModalClose}
          userId={user?.id ?? 0} // Changed from '' to 0
          token={token ?? ''}
        />
      </div>
  );
};

export default SettingsPage;