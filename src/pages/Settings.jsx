import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Title,
  Paper,
  Group,
  Button,
  Text,
  TextInput,
  PasswordInput,
  Switch,
  Select,
  Avatar,
  FileInput,
  Divider,
  Alert,
  Stack,
  Grid,
  Card,
  Badge,
  LoadingOverlay,
  ActionIcon,
  Tooltip,
  Box,
  ScrollArea,
  Modal
} from '@mantine/core';
import { IconUser, IconMail, IconLock, IconCamera, IconBell, IconShield, IconPalette, IconDeviceMobile, IconCheck, IconX, IconShieldLock, IconTrash, IconAlertTriangle } from '@tabler/icons-react';
import useAuthStore from '../store/authStore';
import { notifications } from '@mantine/notifications';
import api from '../api/axios';

const VAPID_PUBLIC_KEY = 'BAsAUTAA5WseSu0twq_8AngS-J5Fgmo_yn2fNBVJH3Iadgna8zKdo-EdZus9aVIHdx8TXnWTSxfkW5cWhiJdRIE';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const Settings = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Refs for file inputs
  const profilePicRef = useRef(null);
  const coverPicRef = useRef(null);

  // URL input visibility states
  const [showProfilePicUrl, setShowProfilePicUrl] = useState(false);
  const [showCoverPicUrl, setShowCoverPicUrl] = useState(false);

  // Profile Settings
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    profilePic: null,
    profilePicUrl: user?.profilePic || '',
    coverPic: null,
    coverPicUrl: user?.coverPic || ''
  });

  // Notification Settings
  const [isUsernameEditable, setIsUsernameEditable] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: user?.notificationSettings?.emailNotifications ?? true,
    pushNotifications: user?.notificationSettings?.pushNotifications ?? false,
    commentNotifications: user?.notificationSettings?.commentNotifications ?? true,
    likeNotifications: user?.notificationSettings?.likeNotifications ?? true,
    followNotifications: user?.notificationSettings?.followNotifications ?? true
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: user?.privacySettings?.profileVisibility || 'public',
    showEmail: user?.privacySettings?.showEmail ?? false,
    allowMessages: user?.privacySettings?.allowMessages ?? true,
    showOnlineStatus: user?.privacySettings?.showOnlineStatus ?? true
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Email Change
  const [emailData, setEmailData] = useState({
    currentPassword: '',
    newEmail: ''
  });

  // Delete Account State
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        profilePic: null,
        profilePicUrl: user.profilePic || '',
        coverPic: null,
        coverPicUrl: user.coverPic || ''
      });

      setNotificationSettings({
        emailNotifications: user.notificationSettings?.emailNotifications ?? true,
        pushNotifications: user.notificationSettings?.pushNotifications ?? false,
        commentNotifications: user.notificationSettings?.commentNotifications ?? true,
        likeNotifications: user.notificationSettings?.likeNotifications ?? true,
        followNotifications: user.notificationSettings?.followNotifications ?? true
      });

      setPrivacySettings({
        profileVisibility: user.privacySettings?.profileVisibility || 'public',
        showEmail: user.privacySettings?.showEmail ?? false,
        allowMessages: user.privacySettings?.allowMessages ?? true,
        showOnlineStatus: user.privacySettings?.showOnlineStatus ?? true
      });
    }
  }, [user]);

  // Handler functions
  const handleProfilePicUpload = () => {
    profilePicRef.current?.click();
  };

  const handleCoverPicUpload = () => {
    coverPicRef.current?.click();
  };

  const handleProfilePicFileChange = (file) => {
    if (file) {
      setProfileData(prev => ({
        ...prev,
        profilePic: file,
        profilePicUrl: URL.createObjectURL(file)
      }));
    }
  };

  const handleCoverPicFileChange = (file) => {
    if (file) {
      setProfileData(prev => ({
        ...prev,
        coverPic: file,
        coverPicUrl: URL.createObjectURL(file)
      }));
    }
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('username', profileData.username);
      formData.append('bio', profileData.bio);

      // Add profile picture if changed
      if (profileData.profilePic) {
        formData.append('image', profileData.profilePic);
      } else if (profileData.profilePicUrl && profileData.profilePicUrl !== user?.profilePic) {
        formData.append('profilePic', profileData.profilePicUrl);
      }

      // Add cover picture if changed
      if (profileData.coverPic) {
        formData.append('coverImage', profileData.coverPic);
      } else if (profileData.coverPicUrl && profileData.coverPicUrl !== user?.coverPic) {
        formData.append('coverPic', profileData.coverPicUrl);
      }

      // Make real API call
      const { data } = await api.put('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update local state with response data
      updateUser(data);

      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notifications.show({
        title: 'Error',
        message: 'Passwords do not match',
        color: 'red',
        icon: <IconX size={16} />
      });
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      notifications.show({
        title: 'Success',
        message: 'Password changed successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!emailData.newEmail || !emailData.newEmail.includes('@')) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a valid email address',
        color: 'red',
        icon: <IconX size={16} />
      });
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.put('/auth/email', {
        currentPassword: emailData.currentPassword,
        newEmail: emailData.newEmail
      });

      updateUser({ ...user, email: data.email });

      notifications.show({
        title: 'Success',
        message: 'Email updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });

      setEmailData({
        currentPassword: '',
        newEmail: ''
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change email';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSettingsUpdate = async () => {
    setLoading(true);
    try {
      // Logic for Push Subscription
      if (notificationSettings.pushNotifications && !user?.notificationSettings?.pushNotifications) {
          // User is enabling push notifications
          if ('serviceWorker' in navigator && 'PushManager' in window) {
              const permission = await Notification.requestPermission();
              if (permission === 'granted') {
                  const registration = await navigator.serviceWorker.ready;
                  const subscription = await registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                  });
                  
                  // Send subscription to backend
                  await api.post('/notifications/subscribe', subscription);
              } else {
                  notifications.show({
                      title: 'Permission Denied',
                      message: 'You need to grant permission to enable push notifications',
                      color: 'red'
                  });
                  setNotificationSettings(prev => ({ ...prev, pushNotifications: false }));
                  setLoading(false);
                  return;
              }
          }
      }

      const { data } = await api.put('/auth/notifications', notificationSettings);

      // Update user state with new settings
      updateUser({
        ...user,
        notificationSettings: data.notificationSettings
      });

      notifications.show({
        title: 'Success',
        message: 'Notification settings updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update notification settings';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacySettingsUpdate = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/privacy', privacySettings);

      // Update user state with new settings
      updateUser({
        ...user,
        privacySettings: data.privacySettings
      });

      notifications.show({
        title: 'Success',
        message: 'Privacy settings updated successfully',
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update privacy settings';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== user.username) {
      return;
    }

    setDeleteLoading(true);
    try {
      await api.delete('/auth/profile');
      notifications.show({
        title: 'Account Deleted',
        message: 'Your account has been permanently deleted.',
        color: 'red',
        zIndex: 9999
      });
      // The logout and navigation will be handled by the auth store automatically
      window.location.href = '/login';
    } catch (error) {
      console.error('Delete account error:', error);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete account',
        color: 'red',
        zIndex: 9999
      });
      setDeleteLoading(false);
    }
  };

  const TabButton = ({ tab, label, icon: Icon, mobile }) => (
    <Button
      variant={activeTab === tab ? 'filled' : 'subtle'}
      color={activeTab === tab ? 'pink' : 'gray'}
      onClick={() => setActiveTab(tab)}
      leftSection={<Icon size={16} />}
      fullWidth={!mobile}
      style={{
        justifyContent: mobile ? 'center' : 'flex-start',
        flexShrink: mobile ? 0 : 1
      }}
      radius={mobile ? "xl" : "sm"}
      size="sm"
    >
      {label}
    </Button>
  );

  return (
    <Container fluid px={0} py={{ base: 'sm', md: 'xl' }}>
      <Title order={2} mb={{ base: 'xs', md: 'lg' }}>Settings</Title>

      <Grid gutter={{ base: 5, md: 'md' }}>
        <Grid.Col span={{ base: 12, md: 3 }}>
          {/* Desktop Sidebar */}
          <Stack gap="xs" visibleFrom="md" style={{ position: 'sticky', top: '130px' }}>
            <TabButton tab="profile" label="Profile" icon={IconUser} />
            <TabButton tab="notifications" label="Notifications" icon={IconBell} />
            <TabButton tab="privacy" label="Privacy" icon={IconShield} />
            <TabButton tab="security" label="Security" icon={IconLock} />
          </Stack>

          {/* Mobile Horizontal Navigation */}
          <Box hiddenFrom="md" mb="xs">
            <ScrollArea type="never">
              <Group wrap="nowrap" gap="sm" px={2}>
                <TabButton tab="profile" label="Profile" icon={IconUser} mobile />
                <TabButton tab="notifications" label="Notifications" icon={IconBell} mobile />
                <TabButton tab="privacy" label="Privacy" icon={IconShield} mobile />
                <TabButton tab="security" label="Security" icon={IconLock} mobile />
              </Group>
            </ScrollArea>
          </Box>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 9 }}>
          <Paper shadow="sm" p={{ base: 'sm', md: 'xl' }} withBorder>
            <LoadingOverlay visible={loading} />

            {activeTab === 'profile' && (
              <Stack gap="lg">
                <Group justify="space-between" align="center">
                  <Title order={4}>Edit Profile</Title>
                  <ActionIcon variant="subtle" color="gray" size="lg">
                    <IconX size={18} />
                  </ActionIcon>
                </Group>

                {/* Profile Picture Section */}
                <Stack gap="md" align={{ base: 'center', md: 'flex-start' }}>
                  <Text fw={600} style={{ alignSelf: 'flex-start', width: '100%' }}>Profile Picture</Text>
                  <Group align="center" gap="xl" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Box>
                      <Avatar
                        src={profileData.profilePicUrl || user?.profilePic}
                        size={120}
                        radius="xl"
                        sx={{
                          border: '3px solid #2d3748',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                      />
                    </Box>
                    <Stack gap="sm" align="center" style={{ flex: 1, minWidth: '200px' }}>
                      <Group gap="sm" justify="center">
                        <Button variant="outline" size="sm" leftSection={<IconCamera size={14} />} onClick={handleProfilePicUpload}>
                          Change Profile Pic
                        </Button>
                        <Button variant="subtle" size="sm" onClick={() => setShowProfilePicUrl(!showProfilePicUrl)}>
                          Or Profile Pic URL
                        </Button>
                      </Group>
                      <FileInput
                        ref={profilePicRef}
                        placeholder="Upload profile picture"
                        accept="image/png,image/jpeg"
                        value={profileData.profilePic}
                        onChange={handleProfilePicFileChange}
                        style={{ display: 'none' }}
                      />
                      {showProfilePicUrl && (
                        <TextInput
                          placeholder="Enter profile picture URL"
                          value={profileData.profilePicUrl}
                          onChange={(e) => setProfileData({ ...profileData, profilePicUrl: e.target.value })}
                          size="sm"
                          style={{ width: '100%' }}
                        />
                      )}
                    </Stack>
                  </Group>
                </Stack>

                {/* Cover Image Section */}
                <Stack gap="md" align={{ base: 'center', md: 'flex-start' }}>
                  <Group gap="lg" align="center" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Box
                      sx={(theme) => ({
                        width: 120,
                        height: 120,
                        borderRadius: theme.radius.md,
                        overflow: 'hidden',
                        border: '3px solid #2d3748',
                        backgroundColor: theme.colorScheme === 'dark' ? '#2d3748' : '#f7fafc',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      })}
                    >
                      {profileData.coverPicUrl || user?.coverPic ? (
                        <Box
                          component="img"
                          src={profileData.coverPicUrl || user?.coverPic}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      ) : (
                        <Text c="dimmed" size="xs" ta="center">No Cover</Text>
                      )}
                    </Box>

                    <Stack gap="sm" align="center" style={{ flex: 1, minWidth: '200px' }}>
                      <Group gap="sm" justify="center">
                        <Button variant="outline" size="sm" leftSection={<IconCamera size={14} />} onClick={handleCoverPicUpload}>
                          Change Cover Image
                        </Button>
                        <Button variant="subtle" size="sm" onClick={() => setShowCoverPicUrl(!showCoverPicUrl)}>
                          Or Cover Image URL
                        </Button>
                      </Group>
                      <FileInput
                        ref={coverPicRef}
                        placeholder="Upload cover image"
                        accept="image/png,image/jpeg"
                        value={profileData.coverPic}
                        onChange={handleCoverPicFileChange}
                        style={{ display: 'none' }}
                      />
                      {showCoverPicUrl && (
                        <TextInput
                          placeholder="Enter cover image URL"
                          value={profileData.coverPicUrl}
                          onChange={(e) => setProfileData({ ...profileData, coverPicUrl: e.target.value })}
                          size="sm"
                          style={{ width: '100%' }}
                        />
                      )}
                    </Stack>
                  </Group>

                </Stack>

                {/* Email Section (Read-only) */}
                <Stack gap="sm">
                  <TextInput
                    label="Email Address"
                    value={user?.email || ''}
                    readOnly
                    description="To change your email, please go to the Security tab"
                    leftSection={<IconMail size={16} />}
                    size="md"
                    rightSection={
                      <Tooltip label="Go to Security settings">
                        <ActionIcon variant="subtle" onClick={() => setActiveTab('security')}>
                          <IconShield size={16} />
                        </ActionIcon>
                      </Tooltip>
                    }
                  />
                </Stack>

                {/* Username Section */}
                {/* Username Section */}
                <Stack gap="sm">
                  <Box onClick={() => setIsUsernameEditable(true)}>
                    <TextInput
                      label="Username"
                      placeholder="Enter username"
                      value={profileData.username}
                      onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                      description="This is your unique identifier (3-20 characters, letters, numbers, underscores only)"
                      leftSection={isUsernameEditable ? <IconUser size={16} /> : <IconShieldLock size={16} color="gray" />}
                      size="md"
                      disabled={!isUsernameEditable}
                      rightSection={
                        !isUsernameEditable && (
                          <Tooltip label="Click to edit">
                            <IconShield size={16} style={{ opacity: 0.5 }} />
                          </Tooltip>
                        )
                      }
                      onBlur={() => setIsUsernameEditable(false)}
                      autoFocus={isUsernameEditable}
                      ref={isUsernameEditable ? (input) => input && input.focus() : null}
                      styles={{
                        input: {
                          cursor: isUsernameEditable ? 'text' : 'pointer',
                          opacity: 1 // Ensure text is visible even when disabled
                        }
                      }}
                    />
                  </Box>
                </Stack>

                <Button onClick={handleProfileUpdate} color="pink" fullWidth size="md">
                  Save Profile Changes
                </Button>
              </Stack>
            )}

            {activeTab === 'notifications' && (
              <Stack gap="md">
                <Title order={4}>Notification Preferences</Title>

                <Switch
                  label="Email Notifications"
                  description="Receive email updates about your account activity"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.currentTarget.checked })}
                />

                <Switch
                  label="Push Notifications"
                  description="Receive push notifications in your browser"
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.currentTarget.checked })}
                />

                <Switch
                  label="Comment Notifications"
                  description="Get notified when someone comments on your posts"
                  checked={notificationSettings.commentNotifications}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, commentNotifications: e.currentTarget.checked })}
                />

                <Switch
                  label="Like Notifications"
                  description="Get notified when someone likes your posts"
                  checked={notificationSettings.likeNotifications}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, likeNotifications: e.currentTarget.checked })}
                />

                <Switch
                  label="Follow Notifications"
                  description="Get notified when someone follows you"
                  checked={notificationSettings.followNotifications}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, followNotifications: e.currentTarget.checked })}
                />

                <Button onClick={handleNotificationSettingsUpdate} color="pink" fullWidth>
                  Save Notification Settings
                </Button>
              </Stack>
            )}

            {activeTab === 'privacy' && (
              <Stack gap="md">
                <Title order={4}>Privacy Settings</Title>

                <Select
                  label="Profile Visibility"
                  placeholder="Choose visibility"
                  data={[
                    { value: 'public', label: 'Public - Everyone can see your profile' },
                    { value: 'friends', label: 'Friends - Only friends can see your profile' },
                    { value: 'private', label: 'Private - Only you can see your profile' }
                  ]}
                  value={privacySettings.profileVisibility}
                  onChange={(value) => setPrivacySettings({ ...privacySettings, profileVisibility: value })}
                />

                <Switch
                  label="Show Email Address"
                  description="Display your email on your public profile"
                  checked={privacySettings.showEmail}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, showEmail: e.currentTarget.checked })}
                />

                <Switch
                  label="Allow Messages"
                  description="Let other users send you messages"
                  checked={privacySettings.allowMessages}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, allowMessages: e.currentTarget.checked })}
                />

                <Switch
                  label="Show Online Status"
                  description="Let others see when you're online"
                  checked={privacySettings.showOnlineStatus}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, showOnlineStatus: e.currentTarget.checked })}
                />

                <Button onClick={handlePrivacySettingsUpdate} color="pink" fullWidth>
                  Save Privacy Settings
                </Button>
              </Stack>
            )}

            {activeTab === 'security' && (
              <Stack gap="md">
                <Title order={4}>Security Settings</Title>

                <Alert color="blue" title="Password Security">
                  Choose a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.
                </Alert>

                <PasswordInput
                  label="Current Password"
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  leftSection={<IconLock size={16} />}
                />

                <PasswordInput
                  label="New Password"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  leftSection={<IconLock size={16} />}
                />

                <PasswordInput
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  leftSection={<IconLock size={16} />}
                />

                <Button onClick={handlePasswordChange} color="pink" fullWidth>
                  Change Password
                </Button>

                <Divider my="lg" label="Email Settings" labelPosition="center" />

                <Stack gap="sm">
                  <Text fw={600}>Change Email Address</Text>
                  <Text size="sm" c="dimmed">Requires your current password for security</Text>

                  <PasswordInput
                    label="Current Password"
                    placeholder="Enter current password"
                    value={emailData.currentPassword}
                    onChange={(e) => setEmailData({ ...emailData, currentPassword: e.target.value })}
                    leftSection={<IconLock size={16} />}
                  />

                  <TextInput
                    label="New Email Address"
                    placeholder="Enter new email address"
                    value={emailData.newEmail}
                    onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                    leftSection={<IconMail size={16} />}
                  />

                  <Button onClick={handleEmailChange} variant="light" color="blue" fullWidth mt="xs">
                    Update Email
                  </Button>
                </Stack>

                <Divider my="lg" />

                <Card withBorder p="md">
                  <Group justify="space-between" align="center">
                    <div>
                      <Text fw={600}>Two-Factor Authentication</Text>
                      <Text size="sm" c="dimmed">
                        Add an extra layer of security to your account
                      </Text>
                    </div>
                    <Badge color="gray" variant="light">
                      Disabled
                    </Badge>
                  </Group>
                  <Button variant="outline" color="blue" fullWidth mt="md">
                    Enable 2FA
                  </Button>
                </Card>

                <Divider my="xl" label="Danger Zone" labelPosition="center" color="red" size="md" />

                <Card 
                  withBorder 
                  p="lg" 
                  style={{ 
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.05)',
                    borderWidth: 2
                  }}
                >
                  <Stack gap="md">
                    {/* Warning Header */}
                    <Group align="center" gap="md" c="red">
                      <Box
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 107, 107, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <IconTrash size={24} color="red" />
                      </Box>
                      <div style={{ flex: 1 }}>
                        <Text fw={700} size="lg" c="red">Delete Account</Text>
                        <Text size="sm" c="dimmed" mt={2}>
                          Permanently delete your account and all associated data
                        </Text>
                      </div>
                    </Group>

                    {/* Warning Details */}
                    <Alert 
                      color="red" 
                      variant="light" 
                      title="⚠️ Irreversible Action"
                      icon={<IconAlertTriangle size={20} />}
                    >
                      <Stack gap="xs">
                        <Text size="sm">
                          This action cannot be undone. The following will be permanently deleted:
                        </Text>
                        <Stack gap="xs" ml="sm">
                          <Group gap="xs">
                            <Text size="sm">•</Text>
                            <Text size="sm">All your blog posts and content</Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="sm">•</Text>
                            <Text size="sm">Profile information and settings</Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="sm">•</Text>
                            <Text size="sm">Comments and likes</Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="sm">•</Text>
                            <Text size="sm">Profile and cover images</Text>
                          </Group>
                          <Group gap="xs">
                            <Text size="sm">•</Text>
                            <Text size="sm">All notifications and conversations</Text>
                          </Group>
                        </Stack>
                      </Stack>
                    </Alert>

                    {/* Action Button */}
                    <Button
                      variant="outline"
                      color="red"
                      fullWidth
                      size="md"
                      onClick={() => setDeleteOpened(true)}
                      style={{
                        borderWidth: 2,
                        borderColor: '#ff6b6b',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 107, 107, 0.1)'
                        }
                      }}
                    >
                      Delete My Account
                    </Button>
                  </Stack>
                </Card>
              </Stack>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Delete Account Confirmation Modal */}
      <Modal
        opened={deleteOpened}
        onClose={() => setDeleteOpened(false)}
        title={<Text c="red" fw={700}>Delete Account</Text>}
        centered
        radius="md"
      >
        <Stack>
          <Stack align="center" gap="xs">
            <IconAlertTriangle size={48} color="red" />
            <Text fw={500} size="lg" c="red">Are you sure?</Text>
          </Stack>

          <Text size="sm" ta="center">
            This action is <b>irreversible</b>. All your posts, comments, profile data, and uploaded images will be permanently deleted.
          </Text>

          <Text size="sm" fw={500} mt="sm">
            Type your username <b>{user?.username}</b> below to confirm:
          </Text>

          <TextInput
            placeholder={user?.username}
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.currentTarget.value)}
            error={deleteConfirmation.length > 0 && deleteConfirmation !== user?.username}
          />

          <Group grow mt="md">
            <Button variant="default" onClick={() => setDeleteOpened(false)}>Cancel</Button>
            <Button
              color="red"
              disabled={deleteConfirmation !== user?.username}
              loading={deleteLoading}
              onClick={handleDeleteAccount}
            >
              Delete Permanently
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default Settings;
