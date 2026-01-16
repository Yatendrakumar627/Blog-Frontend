import { Container, Title, Button, Group, Card, Text, Avatar, Stack, Center, Modal, Tabs, FileInput, TextInput, Textarea, Paper, Box, BackgroundImage, Flex, ActionIcon, Divider, Indicator, ScrollArea } from '@mantine/core';
import AppLoader from '../components/AppLoader';
import { useEffect, useState, useRef } from 'react';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { useParams } from 'react-router-dom';
// import { jsPDF } from 'jspdf'; // Dynamically imported
import { IconUserPlus, IconUserCheck, IconDownload, IconEdit, IconHeart, IconArticle, IconSettings, IconUpload, IconX, IconLink, IconBookmark, IconMessage } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import UserCard from '../components/UserCard';
import BlogCard from '../components/BlogCard';
import { usePosts } from '../hooks/usePosts';
import { useProfile } from '../hooks/useProfile';
import { Virtuoso } from 'react-virtuoso';

const Profile = () => {
    const { user: currentUser, login, logout } = useAuthStore(); // login function to update context user if needed
    const { username } = useParams();
    const navigate = useNavigate();
    const [followLoading, setFollowLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const isMobile = useMediaQuery('(max-width: 48em)');
    const [isFollowing, setIsFollowing] = useState(false);

    const profileId = username || currentUser?._id;
    const isOwnProfile = !username || (currentUser && username === currentUser.username);

    // React Query for profile
    const { data: profileUser, isLoading: profileLoading, refetch: refetchProfile } = useProfile(profileId);

    // React Query for blogs
    const postsFilter = activeTab === 'liked' ? { likedBy: profileId } : activeTab === 'saved' ? { savedBy: profileId } : { author: profileId };
    const {
        data,
        isLoading: blogsLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage
    } = usePosts(profileId ? postsFilter : null);

    // Extract blogs from infinite query structure
    const blogs = data?.pages?.flatMap(page => page.blogs) || [];

    // Network Modal State
    const [networkOpened, { open: openNetwork, close: closeNetwork }] = useDisclosure(false);
    const [networkType, setNetworkType] = useState('followers');
    const [networkUsers, setNetworkUsers] = useState([]);
    const [networkLoading, setNetworkLoading] = useState(false);

    // Edit Profile Modal State
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', displayName: '', bio: '', image: null, imageUrl: '', coverImage: null, coverImageUrl: '' });
    const [previewUrl, setPreviewUrl] = useState(null);

    // PDF Loading State
    const [pdfLoading, setPdfLoading] = useState(false);

    useEffect(() => {
        // Observer removed in favor of Virtuoso endReached
    }, []);

    useEffect(() => {
        if (!username && currentUser) {
            navigate(`/profile/${currentUser.username}`, { replace: true });
        } else if (profileId) {
            fetchProfileData();
        }
    }, [profileId, currentUser, username, navigate]);

    // Removed manual useEffects for posts fetching

    // Handle preview for profile image
    useEffect(() => {
        if (editForm.image) {
            const objectUrl = URL.createObjectURL(editForm.image);
            setPreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (editForm.imageUrl) {
            setPreviewUrl(editForm.imageUrl);
        } else if (!editForm.image && !editForm.imageUrl) {
            setPreviewUrl(null);
        }
    }, [editForm.image, editForm.imageUrl]);

    // Paste handler for profile image
    useEffect(() => {
        const handlePaste = (e) => {
            if (e.clipboardData.files.length) {
                const file = e.clipboardData.files[0];
                if (file.type.startsWith('image/')) {
                    setEditForm(prev => ({ ...prev, image: file, imageUrl: '' }));
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const clearImage = () => {
        setEditForm(prev => ({ ...prev, image: null, imageUrl: '' }));
        setPreviewUrl(null);
    };

    useEffect(() => {
        if (currentUser && profileUser && !isOwnProfile) {
            // Check if we have followers data (might be empty for private profiles)
            if (profileUser.followers && Array.isArray(profileUser.followers)) {
                const isCurrentlyFollowing = profileUser.followers.includes(currentUser._id);
                setIsFollowing(isCurrentlyFollowing);
            } else {
                // For private profiles or when followers data is not available
                setIsFollowing(false);
            }
        } else if (isOwnProfile) {
            // Own profile should never show follow button
            setIsFollowing(false);
        }
    }, [currentUser, profileUser, isOwnProfile]);

    const fetchProfileData = () => {
        // Now handled by useUser hook, but keeping this for form pre-fill logic if needed
        if (profileUser && isOwnProfile) {
            setEditForm({
                username: profileUser.username,
                displayName: profileUser.displayName || '',
                bio: profileUser.bio || '',
                image: null,
                imageUrl: '',
                coverImage: null,
                coverImageUrl: profileUser.coverPic || ''
            });
        }
    };

    useEffect(() => {
        if (profileUser) fetchProfileData();
    }, [profileUser]);

    // Removed fetchLikedPosts

    const handleShowNetwork = async (type) => {
        setNetworkType(type);
        setNetworkLoading(true);
        openNetwork();
        try {
            // Use the actual user ID from profileUser, not the username
            const targetUserId = profileUser._id;
            const { data } = await api.get(`/auth/${targetUserId}/network`);
            setNetworkUsers(data[type]);
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Error', message: 'Could not load users', color: 'red' });
        } finally {
            setNetworkLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUser) return;
        setFollowLoading(true);
        try {
            // Use the actual user ID from profileUser, not the username
            const targetUserId = profileUser._id;
            if (isFollowing) {
                await api.put(`/auth/${targetUserId}/unfollow`);
                notifications.show({ title: 'Unfollowed', message: `You unfollowed ${profileUser.displayName || profileUser.username}`, color: 'yellow' });
                setIsFollowing(false);
            } else {
                await api.put(`/auth/${targetUserId}/follow`);
                notifications.show({ title: 'Followed', message: `You are now following ${profileUser.displayName || profileUser.username}`, color: 'green' });
                setIsFollowing(true);
            }
            // Refresh profile data to ensure sync
            refetchProfile();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Action failed';

            // If backend says we're already following, update UI to reflect that
            if (errorMessage.includes('already follow')) {
                setIsFollowing(true);
                notifications.show({ title: 'Info', message: 'You are already following this user', color: 'blue' });
            } else if (errorMessage.includes('do not follow')) {
                setIsFollowing(false);
                notifications.show({ title: 'Info', message: 'You are not following this user', color: 'blue' });
            } else {
                notifications.show({ title: 'Error', message: errorMessage, color: 'red' });
            }

            // Always refresh profile data to sync with backend state
            refetchProfile();
        } finally {
            setFollowLoading(false);
        }
    };

    const handleMessageClick = async () => {
        if (!currentUser) {
            notifications.show({ title: 'Login Required', message: 'Please login to send messages', color: 'blue' });
            return;
        }

        if (!profileUser || !profileUser._id) {
            notifications.show({ title: 'Error', message: 'Profile user data not available', color: 'red' });
            return;
        }

        if (profileUser._id === currentUser._id) {
            notifications.show({ title: 'Error', message: 'You cannot message yourself', color: 'red' });
            return;
        }

        try {
            // Use the actual user ID from profileUser, not the username
            const recipientId = profileUser._id;

            const response = await api.post('/chat/conversation', { recipientId });

            navigate('/chat');
        } catch (error) {
            console.error('Error creating conversation:', error);
            const errorMessage = error.response?.data?.message || 'Could not initiate chat';
            notifications.show({ title: 'Error', message: errorMessage, color: 'red' });
        }
    };

    const handleEditSubmit = async () => {
        setEditLoading(true);

        try {
            let data;

            if (editForm.image || editForm.coverImage) {
                // File upload - use FormData with multer route
                const formData = new FormData();
                formData.append('username', editForm.username);
                formData.append('displayName', editForm.displayName);
                formData.append('bio', editForm.bio);
                if (editForm.image) formData.append('image', editForm.image);
                if (editForm.coverImage) formData.append('coverImage', editForm.coverImage);

                const response = await api.put('/auth/profile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                data = response.data;
            } else {
                // URL upload or no image - use JSON with URL route
                const response = await api.put('/auth/profile-url', {
                    username: editForm.username,
                    displayName: editForm.displayName,
                    bio: editForm.bio,
                    profilePic: editForm.imageUrl || '',
                    coverPic: editForm.coverImageUrl || ''
                });
                data = response.data;
            }

            // data is updated user
            // Invalidate user query to refresh profile data
            notifications.show({ title: 'Success', message: 'Profile updated', color: 'green' });
            refetchProfile();
        } catch (error) {
            console.error('Update error:', error);
            notifications.show({ title: 'Error', message: 'Update failed', color: 'red' });
        } finally {
            setEditLoading(false);
        }
    };


    // Helper function to convert image URL to base64
    const imageToBase64 = async (url) => {
        try {
            console.log('Attempting to convert image:', url);

            // Skip if it's already a data URL
            if (url.startsWith('data:')) {
                return url;
            }

            // Handle relative URLs (from your own server)
            if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
                const absoluteUrl = url.startsWith('/') ? url : `/${url}`;

                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';

                    img.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                            console.log('Successfully converted local image');
                            resolve(dataURL);
                        } catch (err) {
                            console.error('Canvas error:', err);
                            reject(err);
                        }
                    };

                    img.onerror = () => {
                        console.error('Failed to load local image:', absoluteUrl);
                        reject(new Error('Failed to load image'));
                    };

                    // Try to load with full URL
                    img.src = absoluteUrl;
                });
            }

            // For external URLs, we need to handle CORS differently
            // For now, return null and show placeholder
            if (url.startsWith('http')) {
                console.log('External image detected, using placeholder');
                return null;
            }

            console.log('Unknown image format, skipping');
            return null;
        } catch (error) {
            console.error('Error converting image:', error);
            return null;
        }
    };

    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            // Add custom font for better text support
            doc.setFontSize(20);
            doc.text(`Dil Ki Baatein - ${profileUser?.username}'s Blogs`, 10, 10);

            let y = 30;

            for (const blog of blogs) {
                // Check if we need a new page
                if (y > 240) {
                    doc.addPage();
                    y = 10;
                }

                // Add date
                doc.setFontSize(14);
                doc.text(new Date(blog.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), 10, y);
                y += 8;

                // Add title if available
                if (blog.title) {
                    doc.setFontSize(12);
                    doc.text(blog.title, 10, y);
                    y += 6;
                }

                // Process content with better text handling
                const cleanContent = blog.content
                    .replace(/<[^>]+>/g, '') // Remove HTML tags
                    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
                    .replace(/&amp;/g, '&') // Replace HTML entities
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&apos;/g, "'")
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();

                // Add content with proper text splitting
                doc.setFontSize(10);
                const lines = doc.splitTextToSize(cleanContent, 180);

                // Check if content fits on current page
                if (y + (lines.length * 4) > 280) {
                    doc.addPage();
                    y = 10;
                }

                doc.text(lines, 10, y);
                y += (lines.length * 4) + 8;

                // Handle images if present
                if (blog.mediaUrl && blog.mediaUrl.trim() !== '') {
                    try {
                        // Check if image needs a new page
                        if (y > 180) {
                            doc.addPage();
                            y = 10;
                        }

                        // Try to convert image to base64 and add it
                        const base64Image = await imageToBase64(blog.mediaUrl);

                        if (base64Image) {
                            // Add the actual image
                            const imgWidth = 50;
                            const imgHeight = 35;
                            doc.addImage(base64Image, 'JPEG', 10, y, imgWidth, imgHeight);
                            y += imgHeight + 8;
                        } else {
                            // Add placeholder for external images
                            doc.setFontSize(9);
                            doc.text('[Image: ' + (blog.mediaUrl.length > 40 ? blog.mediaUrl.substring(0, 40) + '...' : blog.mediaUrl) + ']', 10, y);
                            y += 10;
                        }
                    } catch (error) {
                        console.log('Could not add image to PDF:', error);
                        doc.setFontSize(9);
                        doc.text('[Image: Unable to load]', 10, y);
                        y += 10;
                    }
                }

                // Add spacing between posts
                y += 6;
            }

            doc.save(`${profileUser?.username}-blogs.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            notifications.show({ title: 'Error', message: 'Failed to generate PDF', color: 'red' });
        } finally {
            setPdfLoading(false);
        }
    };

    if (profileLoading) return <AppLoader fullHeight type="dots" />;
    if (!profileUser) return <Center h="100vh"><Text size="lg" fw={500}>User not found</Text></Center>;

    return (
        <Box style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            {/* Edit Profile Modal */}
            <Modal
                opened={editOpened}
                onClose={closeEdit}
                title={<Text fw={700} size="xl">Edit Profile</Text>}
                centered
                size={{ base: 'sm', sm: 'md', md: 'lg' }}
                radius="xl"
                overlayProps={{ backgroundOpacity: 0.7, blur: 5 }}
            >
                <ScrollArea.Autosize mah={{ base: '60vh', sm: '70vh' }} type="auto" scrollbarSize={8} offsetScrollbars>
                    <Stack p={{ base: 'md', sm: 'xl' }} gap="lg">
                        {/* Profile Picture Section */}
                        <Box style={{ position: 'relative' }}>
                            <Center>
                                <Stack align="center" gap="md">
                                    <Box style={{ position: 'relative' }}>
                                        <Indicator
                                            inline
                                            size={24}
                                            offset={20}
                                            position="bottom-end"
                                            color="green"
                                            withBorder
                                            disabled={!profileUser.isOnline}
                                            processing={profileUser.isOnline}
                                        >
                                            <Avatar
                                                src={previewUrl || profileUser.profilePic}
                                                size={{ base: 180, sm: 200, md: 220 }}
                                                radius={{ base: 180, sm: 200, md: 220 }}
                                                style={{
                                                    '--avatar-size': '180px',
                                                    width: 'var(--avatar-size) !important',
                                                    height: 'var(--avatar-size) !important',
                                                    minWidth: 'var(--avatar-size) !important',
                                                    minHeight: 'var(--avatar-size) !important',
                                                    border: '5px solid rgba(59, 130, 246, 0.3)',
                                                    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            />
                                        </Indicator>
                                        <ActionIcon
                                            variant="filled"
                                            color="blue"
                                            size="sm"
                                            radius="xl"
                                            style={{
                                                position: 'absolute',
                                                bottom: 5,
                                                right: 5,
                                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                                            }}
                                            onClick={() => document.getElementById('profile-pic-input')?.click()}
                                        >
                                            <IconUpload size={14} />
                                        </ActionIcon>
                                    </Box>

                                    <FileInput
                                        id="profile-pic-input"
                                        placeholder="Upload Profile Picture"
                                        accept="image/*"
                                        radius="md"
                                        size="md"
                                        clearable
                                        style={{ display: 'none' }}
                                        value={editForm.image}
                                        onChange={(file) => {
                                            setEditForm(prev => ({ ...prev, image: file, imageUrl: '' }));
                                        }}
                                    />

                                    <TextInput
                                        placeholder="Or paste image URL here"
                                        leftSection={<IconLink size={16} />}
                                        radius="md"
                                        size="sm"
                                        style={{ width: '100%' }}
                                        value={editForm.imageUrl}
                                        onChange={(e) => {
                                            setEditForm(prev => ({ ...prev, imageUrl: e.target.value, image: null }));
                                        }}
                                    />
                                </Stack>
                            </Center>
                        </Box>

                        {/* Cover Image Section */}
                        <Box style={{ position: 'relative' }}>
                            <Text fw={600} mb="sm" size="md">Cover Image</Text>
                            <Box
                                sx={(theme) => ({
                                    width: '100%',
                                    height: { base: 150, sm: 200 },
                                    borderRadius: theme.radius.lg,
                                    overflow: 'hidden',
                                    border: '2px solid',
                                    borderColor: theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3],
                                    backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[1],
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                                    transition: 'all 0.3s ease'
                                })}
                            >
                                {(editForm.coverImage || editForm.coverImageUrl || profileUser.coverPic) ? (
                                    <Box
                                        component="img"
                                        src={editForm.coverImage
                                            ? URL.createObjectURL(editForm.coverImage)
                                            : (editForm.coverImageUrl || profileUser.coverPic)}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block'
                                        }}
                                    />
                                ) : (
                                    <Stack align="center" gap="xs" c="dimmed">
                                        <IconUpload size={32} opacity={0.5} />
                                        <Text size="sm" opacity={0.7}>No cover image</Text>
                                    </Stack>
                                )}
                            </Box>

                            <Stack gap={{ base: 'xs', sm: 'sm' }} mt="md">
                                <FileInput
                                    placeholder="Change Cover Image"
                                    accept="image/*"
                                    leftSection={<IconUpload size={16} />}
                                    radius="md"
                                    size="sm"
                                    clearable
                                    value={editForm.coverImage}
                                    onChange={(file) => {
                                        setEditForm(prev => ({ ...prev, coverImage: file, coverImageUrl: '' }));
                                    }}
                                />
                                <TextInput
                                    placeholder="Or URL"
                                    leftSection={<IconLink size={16} />}
                                    radius="md"
                                    size="sm"
                                    value={editForm.coverImageUrl}
                                    onChange={(e) => {
                                        setEditForm(prev => ({ ...prev, coverImageUrl: e.target.value, coverImage: null }));
                                    }}
                                />
                            </Stack>
                        </Box>

                        {/* Form Fields */}
                        <Stack gap="md">
                            <TextInput
                                label="Username"
                                placeholder="Your unique username"
                                value={editForm.username}
                                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                radius="md"
                                size="md"
                                description="This is your unique identifier (3-20 characters, letters, numbers, underscores only)"
                            />

                            <TextInput
                                label="Display Name"
                                placeholder="How others will see you"
                                value={editForm.displayName}
                                onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                                radius="md"
                                size="md"
                                description="Can be your real name or any name you prefer"
                            />

                            <Textarea
                                label="Bio"
                                placeholder="Tell us about yourself..."
                                value={editForm.bio}
                                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                minRows={4}
                                maxRows={6}
                                radius="md"
                                size="md"
                            />
                        </Stack>

                        {/* Action Buttons */}
                        <Group gap="sm" mt="lg" align="stretch">
                            <Button
                                variant="outline"
                                onClick={closeEdit}
                                radius="md"
                                size="md"
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleEditSubmit}
                                loading={editLoading}
                                radius="md"
                                size="md"
                                style={{ flex: 2 }}
                                color="blue"
                            >
                                Save Changes
                            </Button>
                        </Group>
                    </Stack>
                </ScrollArea.Autosize>
            </Modal>


            {/* Network Modal */}
            <Modal
                opened={networkOpened}
                onClose={closeNetwork}
                title={<Text fw={900} size="lg" style={{ letterSpacing: '-0.5px' }}>{networkType === 'followers' ? 'Followers' : 'Following'}</Text>}
                centered
                size="md"
                radius="lg"
                padding="xl"
                overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 8,
                }}
                styles={{
                    header: { paddingBottom: 16, borderBottom: '1px solid var(--mantine-color-default-border)' },
                    body: { paddingTop: 16 }
                }}
                scrollAreaComponent={Box}
            >
                {networkLoading ? (
                    <AppLoader centered size="sm" />
                ) : (
                    <Stack gap="md" py="xs">
                        {networkUsers.length > 0 ? (
                            networkUsers.map(u => <UserCard key={u._id} user={u} />)
                        ) : (
                            <Text c="dimmed" ta="center" size="sm" py="xl">No {networkType} found.</Text>
                        )}
                    </Stack>
                )}
            </Modal>

            {/* Content Container */}
            <Box w="100%" h={{ base: 200, sm: 250 }} style={{ position: 'relative', overflow: 'hidden' }}>
                <Box
                    style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: profileUser.coverPic
                            ? `url(${profileUser.coverPic}) no-repeat center/cover`
                            : 'linear-gradient(135deg, #0b7285 0%, #15aabf 100%)',
                        opacity: 0.8
                    }}
                />
            </Box>

            <Container fluid px={0} style={{ marginTop: 20, position: 'relative' }} pb="xl">
                <Paper
                    radius="lg"
                    p={0}
                    withBorder
                    style={{
                        overflow: 'visible',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
                    }}
                >
                    {/* Top Section with Avatar & Actions */}
                    <Box p={{ base: 'md', md: 'xl' }} style={{ position: 'relative' }}>
                        <Flex
                            direction={{ base: 'column', md: 'row' }}
                            align={{ base: 'center', md: 'flex-end' }}
                            justify="space-between"
                            gap="md"
                        >
                            {/* Left: Avatar & Names */}
                            <Flex align={{ base: 'center', md: 'flex-end' }} direction={{ base: 'column', md: 'row' }} gap="lg" style={{ marginTop: -100 }}>
                                <Avatar
                                    src={profileUser.profilePic}
                                    size={200}
                                    radius="50%"
                                    style={{
                                        border: '5px solid var(--mantine-color-body)',
                                        backgroundColor: 'var(--mantine-color-body)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                        width: '200px !important',
                                        height: '200px !important',
                                        minWidth: '200px !important',
                                        minHeight: '200px !important',
                                        maxWidth: '200px !important',
                                        maxHeight: '200px !important',
                                    }}
                                >
                                    {profileUser.username?.[0]?.toUpperCase()}
                                </Avatar>

                                <Stack gap={0} align={{ base: 'center', md: 'flex-start' }} mb={{ base: 0, md: 10 }}>
                                    <Title order={1} style={{ fontSize: '2rem' }}>
                                        {profileUser.displayName || profileUser.username}
                                    </Title>
                                    <Text c="dimmed" size="md">
                                        @{profileUser.username?.toLowerCase()}
                                    </Text>
                                </Stack>
                            </Flex>

                            {/* Right: Actions */}
                            <Group gap="sm" mt={{ base: 'md', md: 0 }} mb={{ base: 0, md: 10 }} grow w={{ base: '100%', md: 'auto' }}>
                                {isOwnProfile ? (
                                    <>
                                        <Button variant="outline" color="gray" radius="md" size="sm" leftSection={<IconDownload size={16} />} onClick={handleDownloadPDF} loading={pdfLoading}>
                                            PDF
                                        </Button>
                                        <Button variant="filled" color="blue" radius="md" size="sm" leftSection={<IconEdit size={16} />} onClick={openEdit}>
                                            Edit Profile
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {profileUser.privacySettings?.allowMessages !== false && (
                                            <Button
                                                variant="light"
                                                color="pink"
                                                radius="md"
                                                size="sm"
                                                onClick={handleMessageClick}
                                                leftSection={<IconMessage size={16} />}
                                            >
                                                Message
                                            </Button>
                                        )}
                                        <Button
                                            variant={isFollowing ? "outline" : "filled"}
                                            color={isFollowing ? "gray" : "blue"}
                                            radius="md"
                                            size="sm"
                                            onClick={handleFollowToggle}
                                            loading={followLoading}
                                            leftSection={isFollowing ? <IconUserCheck size={16} /> : <IconUserPlus size={16} />}
                                        >
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </Button>
                                    </>
                                )}
                            </Group>
                        </Flex>

                        {/* Bio & Stats Row */}
                        <Box mt="xl">
                            <Text size="lg" lh={1.6} maw={800} mx={{ base: 'auto', md: 0 }} ta={{ base: 'center', md: 'left' }}>
                                {profileUser.bio || "No bio available."}
                            </Text>

                            <Flex mt="lg" gap={0} align="center" direction="row" w="100%">
                                <Stack gap={0} align="center" style={{ flex: 1, cursor: 'pointer', transition: 'opacity 0.2s' }} onClick={() => handleShowNetwork('followers')}>
                                    <Text fw={700} size="lg">{profileUser.followers?.length || 0}</Text>
                                    <Text c="dimmed" size="xs">Followers</Text>
                                </Stack>
                                <Stack gap={0} align="center" style={{ flex: 1, cursor: 'pointer', transition: 'opacity 0.2s' }} onClick={() => handleShowNetwork('following')}>
                                    <Text fw={700} size="lg">{profileUser.following?.length || 0}</Text>
                                    <Text c="dimmed" size="xs">Following</Text>
                                </Stack>
                                <Stack gap={0} align="center" style={{ flex: 1 }}>
                                    <Text fw={700} size="lg">{profileUser.totalPosts || 0}</Text>
                                    <Text c="dimmed" size="xs">Posts</Text>
                                </Stack>
                            </Flex>
                        </Box>
                    </Box>

                    <Divider />

                    <Box p="md">
                        <Tabs
                            value={activeTab}
                            onChange={setActiveTab}
                            variant="outline"
                            radius="md"
                            color="blue"
                            styles={(theme) => ({
                                root: { marginTop: theme.spacing.sm },
                                list: {
                                    borderBottom: 'none',
                                    marginBottom: theme.spacing.lg
                                },
                                tab: {
                                    backgroundColor: 'transparent',
                                    color: theme.colors.gray[5],
                                    border: '1px solid transparent',
                                    fontSize: theme.fontSizes.md,
                                    '&[data-active]': {
                                        backgroundColor: theme.colors.dark[6],
                                        color: theme.white,
                                        borderColor: theme.colors.dark[4],
                                    },
                                    '&:hover': {
                                        backgroundColor: theme.colors.dark[5]
                                    }
                                }
                            })}
                        >
                            <Tabs.List grow={isMobile} style={{ flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none' }}>
                                <Tabs.Tab value="posts" leftSection={<IconArticle size={18} />}>
                                    <Text span size="sm">My Posts</Text>
                                </Tabs.Tab>
                                <Tabs.Tab value="liked" leftSection={<IconHeart size={18} />}>
                                    <Text span size="sm">Liked Posts</Text>
                                </Tabs.Tab>
                                <Tabs.Tab value="saved" leftSection={<IconBookmark size={18} />}>
                                    <Text span size="sm">Saved</Text>
                                </Tabs.Tab>
                            </Tabs.List>

                            {/* Common Panel Content logic since structure is same for all tabs */}
                            <Tabs.Panel value={activeTab}>
                                {blogsLoading && blogs.length === 0 ? (
                                    <AppLoader centered />
                                ) : blogs.length === 0 ? (
                                    <Center py="xl" c="dimmed">
                                        No {activeTab === 'posts' ? 'posts' : activeTab === 'liked' ? 'liked posts' : 'saved posts'} found.
                                    </Center>
                                ) : (
                                    <Virtuoso
                                        useWindowScroll
                                        data={blogs}
                                        computeItemKey={(index, item) => item._id}
                                        itemContent={(index, blog) => (
                                            <div style={{ paddingBottom: '16px' }}>
                                                <BlogCard blog={blog} />
                                            </div>
                                        )}
                                        endReached={() => {
                                            if (hasNextPage && !isFetchingNextPage) {
                                                fetchNextPage();
                                            }
                                        }}
                                        components={{
                                            Footer: () => (
                                                <div style={{ height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    {isFetchingNextPage && <AppLoader size="sm" />}
                                                </div>
                                            )
                                        }}
                                    />
                                )}
                            </Tabs.Panel>
                        </Tabs>
                    </Box>
                </Paper>
            </Container>
        </Box >
    );
};

export default Profile;
