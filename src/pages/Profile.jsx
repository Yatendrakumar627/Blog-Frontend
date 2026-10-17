import {
    Container, Title, Button, Group, Text, Avatar, Stack, Center, Modal,
    Tabs, FileInput, TextInput, Textarea, Box, Flex, ActionIcon,
    Indicator, ScrollArea, Menu, Progress, Switch, Select, SegmentedControl,
    Paper, Badge, ThemeIcon, Divider, Tooltip
} from '@mantine/core';
import AppLoader from '../components/AppLoader';
import { useEffect, useState, useCallback } from 'react';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { useParams, useNavigate } from 'react-router-dom';
import {
    IconUserPlus, IconUserCheck, IconDownload, IconEdit, IconHeart,
    IconArticle, IconSettings, IconUpload, IconX, IconLink, IconBookmark,
    IconMessage, IconPhoto, IconShare, IconDotsVertical,
    IconLayoutGrid, IconListDetails, IconCamera, IconCheck,
    IconArrowLeft, IconBook, IconSparkles, IconFileDownload
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import UserCard from '../components/UserCard';
import BlogCard from '../components/BlogCard';
import { usePosts } from '../hooks/usePosts';
import { useProfile } from '../hooks/useProfile';
import { sanitizeHTML } from '../utils/sanitize';

const Profile = () => {
    const { user: currentUser } = useAuthStore();
    const { username } = useParams();
    const navigate = useNavigate();
    const [followLoading, setFollowLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'feed'
    const [selectedPostIndex, setSelectedPostIndex] = useState(null);
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

    // PDF Anthology Export State
    const [pdfModalOpened, { open: openPdfModal, close: closePdfModal }] = useDisclosure(false);
    const [pdfExportState, setPdfExportState] = useState({ active: false, step: 'idle', progress: 0, message: '' });
    const [pdfOptions, setPdfOptions] = useState({
        includeImages: true,
        sortOrder: 'desc', // 'desc' | 'asc'
        moodFilter: 'all'
    });

    const fetchProfileData = useCallback(() => {
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
    }, [profileUser, isOwnProfile]);

    useEffect(() => {
        if (!username && currentUser) {
            navigate(`/profile/${currentUser.username}`, { replace: true });
        } else if (profileId) {
            fetchProfileData();
        }
    }, [profileId, currentUser, username, navigate, fetchProfileData]);

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

    useEffect(() => {
        if (currentUser && profileUser && !isOwnProfile) {
            if (profileUser.followers && Array.isArray(profileUser.followers)) {
                const isCurrentlyFollowing = profileUser.followers.includes(currentUser._id);
                setIsFollowing(isCurrentlyFollowing);
            } else {
                setIsFollowing(false);
            }
        } else if (isOwnProfile) {
            setIsFollowing(false);
        }
    }, [currentUser, profileUser, isOwnProfile]);

    useEffect(() => {
        if (profileUser) fetchProfileData();
    }, [profileUser, fetchProfileData]);

    const handleShowNetwork = async (type) => {
        setNetworkType(type);
        setNetworkLoading(true);
        openNetwork();
        try {
            const targetUserId = profileUser._id;
            const { data } = await api.get(`/auth/${targetUserId}/network`);
            setNetworkUsers(data[type] || []);
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Error', message: 'Could not load users', color: 'red' });
        } finally {
            setNetworkLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUser) {
            notifications.show({ title: 'Login Required', message: 'Please login to follow creators', color: 'blue' });
            return;
        }
        setFollowLoading(true);
        try {
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
            refetchProfile();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Action failed';
            if (errorMessage.includes('already follow')) {
                setIsFollowing(true);
            } else if (errorMessage.includes('do not follow')) {
                setIsFollowing(false);
            } else {
                notifications.show({ title: 'Error', message: errorMessage, color: 'red' });
            }
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
            const recipientId = profileUser._id;
            await api.post('/chat/conversation', { recipientId });
            navigate('/chat');
        } catch (error) {
            console.error('Error creating conversation:', error);
            const errorMessage = error.response?.data?.message || 'Could not initiate chat';
            notifications.show({ title: 'Error', message: errorMessage, color: 'red' });
        }
    };

    const handleShareProfile = async () => {
        const profileUrl = window.location.href;
        const name = profileUser?.displayName || profileUser?.username || 'User';
        const shareData = {
            title: `${name} on Khamosh Alfaaz`,
            text: profileUser?.bio ? `${name}: "${profileUser.bio}"` : `Check out ${name}'s profile on Khamosh Alfaaz!`,
            url: profileUrl,
        };

        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                return;
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.log('Share dismissed or failed:', err);
                }
                return;
            }
        }

        try {
            await navigator.clipboard.writeText(profileUrl);
            notifications.show({
                title: 'Link Copied',
                message: 'Profile link copied to clipboard',
                color: 'teal',
                icon: <IconCheck size={16} />
            });
        } catch {
            notifications.show({
                title: 'Error',
                message: 'Could not copy link to clipboard',
                color: 'red'
            });
        }
    };

    const handleEditSubmit = async () => {
        setEditLoading(true);

        try {
            if (editForm.image || editForm.coverImage) {
                const formData = new FormData();
                formData.append('username', editForm.username);
                formData.append('displayName', editForm.displayName);
                formData.append('bio', editForm.bio);
                if (editForm.image) formData.append('image', editForm.image);
                if (editForm.coverImage) formData.append('coverImage', editForm.coverImage);

                await api.put('/auth/profile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await api.put('/auth/profile-url', {
                    username: editForm.username,
                    displayName: editForm.displayName,
                    bio: editForm.bio,
                    profilePic: editForm.imageUrl || '',
                    coverPic: editForm.coverImageUrl || ''
                });
            }

            notifications.show({ title: 'Success', message: 'Profile updated', color: 'green' });
            closeEdit();
            refetchProfile();
        } catch (error) {
            console.error('Update error:', error);
            notifications.show({ title: 'Error', message: error.response?.data?.message || 'Update failed', color: 'red' });
        } finally {
            setEditLoading(false);
        }
    };

    const MOOD_META = {
        'Thoughtful': { label: 'Thoughtful', emoji: '💭', color: '#3182CE', bg: '#EBF8FF', border: '#BEE3F8' },
        'Sad': { label: 'Sad', emoji: '🥀', color: '#E53E3E', bg: '#FFF5F5', border: '#FED7D7' },
        'Healing': { label: 'Healing', emoji: '🌿', color: '#38A169', bg: '#F0FFF4', border: '#C6F6D5' },
        'Poetry': { label: 'Poetry', emoji: '✨', color: '#805AD5', bg: '#FAF5FF', border: '#E9D8FD' },
        'Romantic': { label: 'Romantic', emoji: '❤️', color: '#D53F8C', bg: '#FFF5F7', border: '#FED7E2' },
        'Photos': { label: 'Photos', emoji: '📸', color: '#DD6B20', bg: '#FFFAF0', border: '#FEEBC8' },
        'Default': { label: 'Musings', emoji: '✍️', color: '#4A5568', bg: '#F7FAFC', border: '#E2E8F0' }
    };

    const toDataURL = async (url) => {
        if (!url) return null;
        if (url.startsWith('data:')) return url;

        try {
            let fetchUrl = url;
            const apiBase = api.defaults.baseURL || 'http://localhost:5100/api';
            const serverOrigin = apiBase.replace(/\/api\/?$/, '');

            if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
                fetchUrl = `${serverOrigin}/${url.replace(/^\//, '')}`;
            }

            // Direct fetch first
            try {
                const res = await fetch(fetchUrl, { mode: 'cors' });
                if (res.ok) {
                    const blob = await res.blob();
                    return await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                }
            } catch {
                // Continue to proxy fallback
            }

            // Proxy fallback for external images to avoid CORS taint
            if (fetchUrl.startsWith('https://') || fetchUrl.startsWith('http://')) {
                try {
                    const parsed = new URL(fetchUrl);
                    if (!parsed.port || parsed.port === '80' || parsed.port === '443') {
                        const proxyUrl = `${apiBase}/proxy?url=${encodeURIComponent(fetchUrl)}`;
                        const res = await fetch(proxyUrl);
                        if (res.ok) {
                            const blob = await res.blob();
                            return await new Promise((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(blob);
                            });
                        }
                    }
                } catch {
                    // Ignore proxy error
                }
            }

            return fetchUrl;
        } catch {
            return null;
        }
    };

    const createCoverPageElement = (user, totalPosts, exportDate, moodFilter, authorAvatarDataUrl) => {
        const coverEl = document.createElement('div');
        coverEl.style.width = '700px';
        coverEl.style.height = '985px';
        coverEl.style.boxSizing = 'border-box';
        coverEl.style.padding = '42px 38px';
        coverEl.style.background = '#FFFFFF';
        coverEl.style.position = 'relative';
        coverEl.style.display = 'flex';
        coverEl.style.flexDirection = 'column';
        coverEl.style.justifyContent = 'space-between';
        coverEl.style.alignItems = 'center';
        coverEl.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Devanagari', 'Georgia', serif";
        coverEl.style.color = '#1A202C';

        coverEl.innerHTML = `
            <div style="position: absolute; inset: 12px; border: 1.5px solid #C8A97E; pointer-events: none;"></div>
            <div style="position: absolute; inset: 16px; border: 0.8px solid #E2D3BE; pointer-events: none;"></div>

            <div style="text-align: center; margin-top: 14px;">
                <div style="font-weight: 700; font-size: 13.5px; letter-spacing: 0.28em; color: #8C6D46; text-transform: uppercase;">
                    K H A M O S H &nbsp; A L F A A Z
                </div>
                <div style="font-style: italic; font-size: 11.5px; color: #718096; margin-top: 5px;">
                    A Sanctuary of Quiet Words & Timeless Musings
                </div>
                <div style="width: 140px; height: 1px; background: #E2D3BE; margin: 12px auto 0 auto;"></div>
            </div>

            <div style="text-align: center; max-width: 540px; margin: auto 0;">
                <div style="font-size: 38px; font-weight: 700; color: #1A202C; letter-spacing: 0.02em; line-height: 1.15; font-family: 'Georgia', serif;">
                    Dil Ki Baatein
                </div>
                <div style="font-style: italic; font-size: 15px; color: #718096; margin-top: 8px;">
                    The Collected Writings & Poetry of ${user.displayName || user.username}
                </div>
                <div style="font-size: 16px; color: #C8A97E; margin: 12px 0 22px 0;">
                    ~ &nbsp; ❖ &nbsp; ~
                </div>

                <div style="display: flex; justify-content: center; margin-bottom: 16px;">
                    ${authorAvatarDataUrl ? `
                        <img src="${authorAvatarDataUrl}" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2.5px solid #C8A97E; box-shadow: 0 4px 14px rgba(200, 169, 126, 0.25);" />
                    ` : `
                        <div style="width: 72px; height: 72px; border-radius: 50%; background: #F7FAFC; border: 2.5px solid #C8A97E; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #8C6D46;">
                            ${(user.displayName || user.username || 'A')[0].toUpperCase()}
                        </div>
                    `}
                </div>

                <div style="font-size: 20px; font-weight: 700; color: #2D3748;">
                    ${user.displayName || user.username}
                </div>
                <div style="font-size: 13px; color: #718096; margin-top: 2px;">
                    @${user.username?.toLowerCase()}
                </div>

                ${user.bio ? `
                    <div style="font-style: italic; font-size: 13.5px; line-height: 1.6; color: #4A5568; margin-top: 16px; padding: 0 10px; word-break: break-word; font-family: -apple-system, BlinkMacSystemFont, 'Noto Sans Devanagari', 'Georgia', serif;">
                        “${user.bio}”
                    </div>
                ` : ''}
            </div>

            <div style="width: 100%; max-width: 480px; margin-bottom: 16px;">
                <div style="background: #FAF8F5; border: 1px solid #E2D3BE; border-radius: 10px; padding: 14px 20px; text-align: center;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.12em; color: #8C6D46; text-transform: uppercase;">
                        ARCHIVAL COLLECTION DETAILS
                    </div>
                    <div style="display: flex; justify-content: space-around; margin-top: 8px; font-size: 12px; color: #4A5568;">
                        <div><strong>${totalPosts}</strong> Writings</div>
                        <div>•</div>
                        <div>Compiled <strong>${exportDate}</strong></div>
                        <div>•</div>
                        <div>${moodFilter === 'all' ? 'Complete Collection' : moodFilter}</div>
                    </div>
                </div>

                <div style="text-align: center; font-style: italic; font-size: 11px; color: #A0AEC0; margin-top: 14px;">
                    Preserved and published from Khamosh Alfaaz Community Edition
                </div>
            </div>
        `;

        return coverEl;
    };

    const createPostCardElement = (blog, user, options = {}) => {
        const moodMeta = MOOD_META[blog.mood] || MOOD_META['Default'];
        const cardEl = document.createElement('div');
        cardEl.style.width = '680px';
        cardEl.style.background = '#FFFFFF';
        cardEl.style.borderRadius = '16px';
        cardEl.style.border = '1.5px solid #E2E8F0';
        cardEl.style.padding = '22px 24px';
        cardEl.style.boxSizing = 'border-box';
        cardEl.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Devanagari', 'Outfit', 'Inter', sans-serif";
        cardEl.style.color = '#1A202C';
        cardEl.style.position = 'relative';
        cardEl.style.overflow = 'hidden';

        // Left accent stripe
        const stripe = document.createElement('div');
        stripe.style.position = 'absolute';
        stripe.style.top = '0';
        stripe.style.left = '0';
        stripe.style.bottom = '0';
        stripe.style.width = '5px';
        stripe.style.background = moodMeta.color;
        cardEl.appendChild(stripe);

        // Header (Author Avatar, Names, Date, Mood Badge)
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.marginBottom = '14px';

        const authorBox = document.createElement('div');
        authorBox.style.display = 'flex';
        authorBox.style.alignItems = 'center';
        authorBox.style.gap = '12px';

        if (options.authorAvatarDataUrl) {
            const avatarImg = document.createElement('img');
            avatarImg.style.width = '42px';
            avatarImg.style.height = '42px';
            avatarImg.style.borderRadius = '50%';
            avatarImg.style.objectFit = 'cover';
            avatarImg.style.border = '1.5px solid #EDF2F7';
            avatarImg.src = options.authorAvatarDataUrl;
            authorBox.appendChild(avatarImg);
        } else {
            const avatarInitial = document.createElement('div');
            avatarInitial.style.width = '42px';
            avatarInitial.style.height = '42px';
            avatarInitial.style.borderRadius = '50%';
            avatarInitial.style.backgroundColor = '#EDF2F7';
            avatarInitial.style.display = 'flex';
            avatarInitial.style.alignItems = 'center';
            avatarInitial.style.justifyContent = 'center';
            avatarInitial.style.fontWeight = '700';
            avatarInitial.style.color = '#4A5568';
            avatarInitial.innerText = (user.displayName || user.username || 'A')[0].toUpperCase();
            authorBox.appendChild(avatarInitial);
        }

        const nameCol = document.createElement('div');
        const nameDiv = document.createElement('div');
        nameDiv.style.fontWeight = '700';
        nameDiv.style.fontSize = '14.5px';
        nameDiv.style.color = '#2D3748';
        nameDiv.style.lineHeight = '1.2';
        nameDiv.innerText = user.displayName || user.username;

        const dateDiv = document.createElement('div');
        dateDiv.style.fontSize = '11.5px';
        dateDiv.style.color = '#718096';
        dateDiv.style.lineHeight = '1.2';
        dateDiv.style.marginTop = '2px';
        const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
        dateDiv.innerText = `@${user.username?.toLowerCase()} • ${formattedDate}`;

        nameCol.appendChild(nameDiv);
        nameCol.appendChild(dateDiv);
        authorBox.appendChild(nameCol);
        header.appendChild(authorBox);

        // Mood Badge Pill
        const moodBadge = document.createElement('div');
        moodBadge.style.display = 'inline-flex';
        moodBadge.style.alignItems = 'center';
        moodBadge.style.gap = '5px';
        moodBadge.style.padding = '4px 10px';
        moodBadge.style.borderRadius = '9999px';
        moodBadge.style.fontSize = '11.5px';
        moodBadge.style.fontWeight = '600';
        moodBadge.style.background = moodMeta.bg;
        moodBadge.style.color = moodMeta.color;
        moodBadge.style.border = `1px solid ${moodMeta.border}`;
        moodBadge.innerHTML = `<span>${moodMeta.emoji}</span><span>${moodMeta.label.toUpperCase()}</span>`;
        header.appendChild(moodBadge);
        cardEl.appendChild(header);

        // Optional Title
        if (blog.title && blog.title.trim()) {
            const titleEl = document.createElement('div');
            titleEl.style.fontWeight = '700';
            titleEl.style.fontSize = '16.5px';
            titleEl.style.color = '#1A202C';
            titleEl.style.marginBottom = '10px';
            titleEl.style.lineHeight = '1.3';
            titleEl.innerText = blog.title.trim();
            cardEl.appendChild(titleEl);
        }

        // Content (Rich HTML with full Devanagari Hindi, English, emojis, and styling)
        const contentEl = document.createElement('div');
        contentEl.style.fontSize = '14px';
        contentEl.style.lineHeight = '1.7';
        contentEl.style.color = '#2D3748';
        contentEl.style.wordBreak = 'break-word';
        contentEl.style.marginBottom = '14px';
        contentEl.innerHTML = sanitizeHTML(blog.content);

        const pTags = contentEl.querySelectorAll('p');
        pTags.forEach(p => {
            p.style.margin = '0 0 8px 0';
            p.style.lineHeight = '1.7';
        });
        const blockquotes = contentEl.querySelectorAll('blockquote');
        blockquotes.forEach(bq => {
            bq.style.borderLeft = '3px solid #CBD5E0';
            bq.style.paddingLeft = '12px';
            bq.style.margin = '8px 0';
            bq.style.color = '#4A5568';
            bq.style.fontStyle = 'italic';
        });
        cardEl.appendChild(contentEl);

        // Attached Media Image (if requested and present)
        if (options.includeImages && options.mediaDataUrl) {
            const imgBox = document.createElement('div');
            imgBox.style.marginBottom = '14px';
            imgBox.style.borderRadius = '12px';
            imgBox.style.overflow = 'hidden';
            imgBox.style.border = '1px solid #EDF2F7';
            imgBox.style.textAlign = 'center';
            imgBox.style.background = '#F7FAFC';

            const postImg = document.createElement('img');
            postImg.style.maxWidth = '100%';
            postImg.style.maxHeight = '340px';
            postImg.style.objectFit = 'contain';
            postImg.style.display = 'block';
            postImg.style.margin = '0 auto';
            postImg.src = options.mediaDataUrl;
            imgBox.appendChild(postImg);
            cardEl.appendChild(imgBox);
        }

        // Tags
        if (blog.tags && blog.tags.length > 0) {
            const tagsBox = document.createElement('div');
            tagsBox.style.display = 'flex';
            tagsBox.style.flexWrap = 'wrap';
            tagsBox.style.gap = '6px';
            tagsBox.style.marginBottom = '12px';

            blog.tags.forEach(tag => {
                const cleanTag = tag.trim().replace(/^#/, '');
                if (cleanTag) {
                    const tagSpan = document.createElement('span');
                    tagSpan.style.fontSize = '11px';
                    tagSpan.style.color = '#718096';
                    tagSpan.style.background = '#F7FAFC';
                    tagSpan.style.padding = '2px 8px';
                    tagSpan.style.borderRadius = '4px';
                    tagSpan.style.border = '1px solid #EDF2F7';
                    tagSpan.innerText = `#${cleanTag}`;
                    tagsBox.appendChild(tagSpan);
                }
            });
            cardEl.appendChild(tagsBox);
        }

        // Card Footer (Likes, Comments, Platform Watermark)
        const footer = document.createElement('div');
        footer.style.display = 'flex';
        footer.style.alignItems = 'center';
        footer.style.justifyContent = 'space-between';
        footer.style.paddingTop = '10px';
        footer.style.borderTop = '1px solid #EDF2F7';
        footer.style.fontSize = '12px';
        footer.style.color = '#718096';
        footer.style.fontWeight = '500';

        const likesCount = (blog.likes && Array.isArray(blog.likes)) ? blog.likes.length : 0;
        const commentsCount = blog.commentsCount || 0;

        footer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 14px;">
                <span>❤️ ${likesCount} Likes</span>
                <span>💬 ${commentsCount} Comments</span>
            </div>
            <div style="font-size: 10.5px; color: #A0AEC0; letter-spacing: 0.05em; font-weight: 600;">
                KHAMOSH ALFAAZ
            </div>
        `;
        cardEl.appendChild(footer);

        return cardEl;
    };

    const fetchAllAuthorBlogs = async (authorId, moodFilter, onProgress) => {
        let allBlogs = [];
        let page = 1;
        const limit = 50;
        let hasMore = true;
        let total = 0;

        while (hasMore) {
            onProgress?.({
                step: 'fetching',
                message: `Connecting to archives... page ${page}`,
                current: allBlogs.length,
                total
            });

            const params = {
                author: authorId,
                page,
                limit
            };
            if (moodFilter && moodFilter !== 'all') {
                params.mood = moodFilter;
            }

            const res = await api.get('/blogs', { params });
            const resData = res.data;
            const pageBlogs = resData.blogs || [];
            total = resData.total || pageBlogs.length;

            allBlogs = allBlogs.concat(pageBlogs);

            onProgress?.({
                step: 'fetching',
                message: `Retrieved ${allBlogs.length} of ${total} writings...`,
                current: allBlogs.length,
                total
            });

            if (pageBlogs.length < limit || allBlogs.length >= total || !resData.hasMore) {
                hasMore = false;
            } else {
                page++;
            }
        }

        return allBlogs;
    };

    const handleGenerateAnthologyPDF = async () => {
        const targetUserId = profileUser?._id || profileId;
        if (!targetUserId) {
            notifications.show({ title: 'Error', message: 'User profile not identified', color: 'red' });
            return;
        }

        setPdfExportState({ active: true, step: 'fetching', progress: 5, message: 'Initiating archive connection...' });

        // Hidden mount container for high-DPI rendering
        const mountContainer = document.createElement('div');
        mountContainer.id = 'pdf-render-mount';
        mountContainer.style.position = 'fixed';
        mountContainer.style.top = '0';
        mountContainer.style.left = '-9999px';
        mountContainer.style.width = '720px';
        mountContainer.style.zIndex = '-9999';
        mountContainer.style.pointerEvents = 'none';
        mountContainer.style.opacity = '1';
        document.body.appendChild(mountContainer);

        try {
            // 1. Fetch ALL posts from server archive
            const allFetchedBlogs = await fetchAllAuthorBlogs(targetUserId, pdfOptions.moodFilter, (progress) => {
                const pct = 5 + Math.round((progress.current / (progress.total || 1)) * 25);
                setPdfExportState({
                    active: true,
                    step: 'fetching',
                    progress: Math.min(pct, 30),
                    message: progress.message
                });
            });

            if (!allFetchedBlogs || allFetchedBlogs.length === 0) {
                notifications.show({ title: 'No Posts Found', message: 'There are no writings to export for this filter.', color: 'yellow' });
                setPdfExportState({ active: false, step: 'idle', progress: 0, message: '' });
                document.body.removeChild(mountContainer);
                return;
            }

            // 2. Sort posts
            if (pdfOptions.sortOrder === 'asc') {
                allFetchedBlogs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            } else {
                allFetchedBlogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }

            setPdfExportState({ active: true, step: 'typesetting', progress: 32, message: 'Loading typography & media assets...' });

            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = 210;
            const margin = 16;
            const cardWidthMm = pageWidth - (margin * 2); // 178mm
            const maxY = 274;

            // Pre-convert author avatar to data URL
            let authorAvatarDataUrl = null;
            if (profileUser.profilePic) {
                authorAvatarDataUrl = await toDataURL(profileUser.profilePic);
            }

            // ----------------------------------------------------
            // PAGE 1: ARCHIVAL BOOK COVER (DOM Rendered)
            // ----------------------------------------------------
            setPdfExportState({ active: true, step: 'typesetting', progress: 35, message: 'Binding archival book cover...' });

            const exportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
            const coverEl = createCoverPageElement(profileUser, allFetchedBlogs.length, exportDate, pdfOptions.moodFilter, authorAvatarDataUrl);
            mountContainer.appendChild(coverEl);

            const coverCanvas = await html2canvas(coverEl, {
                scale: 1.5,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#FFFFFF',
                logging: false
            });
            mountContainer.removeChild(coverEl);

            const coverImgData = coverCanvas.toDataURL('image/jpeg', 0.94);
            doc.addImage(coverImgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

            // ----------------------------------------------------
            // PAGE 2+: CONTENT ANTHOLOGY (DOM Rendered Cards)
            // ----------------------------------------------------
            doc.addPage();
            let currentY = 24;

            for (let i = 0; i < allFetchedBlogs.length; i++) {
                const blog = allFetchedBlogs[i];
                const pct = 38 + Math.round(((i + 1) / allFetchedBlogs.length) * 58);
                setPdfExportState({
                    active: true,
                    step: 'rendering',
                    progress: Math.min(pct, 96),
                    message: `Rendering writing ${i + 1} of ${allFetchedBlogs.length}...`
                });

                // Pre-convert post media image if present
                let mediaDataUrl = null;
                if (pdfOptions.includeImages && blog.mediaUrl) {
                    mediaDataUrl = await toDataURL(blog.mediaUrl);
                }

                // Create card DOM element
                const cardEl = createPostCardElement(blog, profileUser, {
                    authorAvatarDataUrl,
                    includeImages: pdfOptions.includeImages,
                    mediaDataUrl
                });
                mountContainer.appendChild(cardEl);

                // Wait for any embedded images in the card to finish decoding
                const cardImages = Array.from(cardEl.querySelectorAll('img'));
                if (cardImages.length > 0) {
                    await Promise.all(cardImages.map(img => {
                        if (img.complete) return Promise.resolve();
                        return new Promise(res => {
                            img.onload = res;
                            img.onerror = res;
                            setTimeout(res, 1200);
                        });
                    }));
                }

                // Capture high-DPI card canvas
                const canvas = await html2canvas(cardEl, {
                    scale: 1.5,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#FFFFFF',
                    logging: false
                });
                mountContainer.removeChild(cardEl);

                const cardHeightMm = (canvas.height / canvas.width) * cardWidthMm;

                // Page break check
                if (currentY + cardHeightMm > maxY) {
                    doc.addPage();
                    currentY = 24;
                }

                // If single card is extraordinarily long (> 245mm), slice across pages
                if (cardHeightMm > 248) {
                    let remainingHeightMm = cardHeightMm;
                    let sourceYPx = 0;

                    while (remainingHeightMm > 0) {
                        const availableHeightMm = maxY - currentY;
                        const sliceHeightMm = Math.min(remainingHeightMm, availableHeightMm);
                        const sliceHeightPx = (sliceHeightMm / cardHeightMm) * canvas.height;

                        const sliceCanvas = document.createElement('canvas');
                        sliceCanvas.width = canvas.width;
                        sliceCanvas.height = sliceHeightPx;
                        const sliceCtx = sliceCanvas.getContext('2d');
                        sliceCtx.drawImage(canvas, 0, sourceYPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

                        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);
                        doc.addImage(sliceData, 'JPEG', margin, currentY, cardWidthMm, sliceHeightMm, undefined, 'FAST');

                        remainingHeightMm -= sliceHeightMm;
                        sourceYPx += sliceHeightPx;
                        currentY += sliceHeightMm + 7;

                        if (remainingHeightMm > 0) {
                            doc.addPage();
                            currentY = 24;
                        }
                    }
                } else {
                    const cardImgData = canvas.toDataURL('image/jpeg', 0.92);
                    doc.addImage(cardImgData, 'JPEG', margin, currentY, cardWidthMm, cardHeightMm, undefined, 'FAST');
                    currentY += cardHeightMm + 7;
                }

                // Yield briefly to main thread so UI stays 100% smooth
                await new Promise(r => setTimeout(r, 0));
            }

            // ----------------------------------------------------
            // TWO-PASS RUNNING HEADERS & FOOTERS WITH PAGE NUMBERS
            // ----------------------------------------------------
            const totalPages = doc.internal.getNumberOfPages();
            const usernameDisplay = `@${profileUser.username?.toLowerCase() || 'author'}`;

            for (let p = 2; p <= totalPages; p++) {
                doc.setPage(p);

                // Running Header
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(140, 140, 145);
                doc.text(`DIL KI BAATEIN  •  ${usernameDisplay}`, margin, 14);
                doc.text('KHAMOSH ALFAAZ ANTHOLOGY', pageWidth - margin, 14, { align: 'right' });
                doc.setDrawColor(220, 215, 205);
                doc.setLineWidth(0.2);
                doc.line(margin, 16, pageWidth - margin, 16);

                // Running Footer
                doc.line(margin, 282, pageWidth - margin, 282);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.setTextColor(140, 140, 145);
                doc.text('Personal Archive Edition', margin, 287);
                doc.text(`— Page ${p} of ${totalPages} —`, 105, 287, { align: 'center' });
                doc.text('khamoshalfaaz.com', pageWidth - margin, 287, { align: 'right' });
            }

            // Finalize & Save
            setPdfExportState({ active: true, step: 'done', progress: 100, message: 'Anthology bound successfully! Downloading...' });

            const sanitizedUsername = (profileUser.username || 'writings').toLowerCase().replace(/[^a-z0-9]/g, '-');
            const fileName = `${sanitizedUsername}-dil-ki-baatein-anthology.pdf`;
            doc.save(fileName);

            notifications.show({
                title: 'Anthology Downloaded',
                message: `Successfully compiled all ${allFetchedBlogs.length} writings into ${fileName}`,
                color: 'teal'
            });

            setTimeout(() => {
                closePdfModal();
                setPdfExportState({ active: false, step: 'idle', progress: 0, message: '' });
            }, 1200);
        } catch (error) {
            console.error('Error generating PDF Anthology:', error);
            notifications.show({ title: 'Export Failed', message: error.message || 'Could not compile PDF', color: 'red' });
            setPdfExportState({ active: false, step: 'idle', progress: 0, message: '' });
        } finally {
            if (mountContainer.parentNode) {
                mountContainer.parentNode.removeChild(mountContainer);
            }
        }
    };

    if (profileLoading) return <AppLoader fullHeight type="dots" />;
    if (!profileUser) return <Center h="100vh"><Text size="lg" fw={500}>User not found</Text></Center>;

    return (
        <Box
            style={{
                minHeight: '100vh',
                paddingBottom: '60px',
                background: 'var(--mantine-color-body)',
                maxWidth: isMobile ? '100%' : '860px',
                margin: '0 auto',
                width: '100%'
            }}
        >
            {/* ── EXPORT ANTHOLOGY (PDF) MODAL ── */}
            <Modal
                opened={pdfModalOpened}
                onClose={pdfExportState.active ? () => {} : closePdfModal}
                closeOnClickOutside={!pdfExportState.active}
                closeOnEscape={!pdfExportState.active}
                withCloseButton={!pdfExportState.active}
                title={
                    <Group gap="xs">
                        <ThemeIcon size={28} radius="md" variant="light" color="indigo">
                            <IconBook size={16} />
                        </ThemeIcon>
                        <div>
                            <Text fw={700} size="sm" lh={1.2}>Export Anthology (PDF)</Text>
                            <Text size="11px" c="dimmed">Preserve all writings in an archival book format</Text>
                        </div>
                    </Group>
                }
                centered
                size="md"
                radius="md"
                padding="md"
                overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
            >
                <Stack gap="md">
                    {/* Book Cover Miniature Card */}
                    <Paper
                        p="md"
                        radius="md"
                        withBorder
                        style={{
                            background: 'linear-gradient(135deg, rgba(140, 109, 70, 0.08) 0%, rgba(20, 20, 25, 0.02) 100%)',
                            borderColor: 'var(--mantine-color-default-border)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                            <Stack gap={4} style={{ flex: 1 }}>
                                <Badge size="xs" variant="outline" color="yellow" style={{ alignSelf: 'flex-start', letterSpacing: '0.05em' }}>
                                    DIL KI BAATEIN
                                </Badge>
                                <Text fw={700} size="sm" mt={2}>
                                    {profileUser.displayName || profileUser.username}'s Collection
                                </Text>
                                <Text size="xs" c="dimmed" lineClamp={2}>
                                    {profileUser.bio || 'A personal anthology of quiet words, thoughts, and reflections.'}
                                </Text>
                                <Group gap="xs" mt={4}>
                                    <Text size="11px" fw={600} c="dimmed">
                                        📚 {profileUser.totalPosts || blogs.length || 0} total writings in archive
                                    </Text>
                                </Group>
                            </Stack>
                            <Avatar
                                src={profileUser.profilePic}
                                size={46}
                                radius="50%"
                                style={{ border: '2px solid rgba(140, 109, 70, 0.4)', flexShrink: 0 }}
                            >
                                {profileUser.username?.[0]?.toUpperCase()}
                            </Avatar>
                        </Group>
                    </Paper>

                    {/* Export Settings */}
                    {!pdfExportState.active ? (
                        <Stack gap="xs">
                            <Text fw={600} size="xs" c="dimmed" style={{ letterSpacing: '0.05em' }}>
                                EXPORT SETTINGS
                            </Text>

                            <Group justify="space-between" p="xs" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: '8px' }}>
                                <Stack gap={1}>
                                    <Text size="xs" fw={500}>Include Attached Photos</Text>
                                    <Text size="11px" c="dimmed">Embed post illustrations and photo memories</Text>
                                </Stack>
                                <Switch
                                    size="sm"
                                    checked={pdfOptions.includeImages}
                                    onChange={(e) => setPdfOptions(prev => ({ ...prev, includeImages: e.currentTarget.checked }))}
                                />
                            </Group>

                            <Group justify="space-between" p="xs" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: '8px' }}>
                                <Stack gap={1}>
                                    <Text size="xs" fw={500}>Chronological Order</Text>
                                    <Text size="11px" c="dimmed">
                                        {pdfOptions.sortOrder === 'desc' ? 'Newest to oldest (Recent first)' : 'Oldest to newest (Timeline order)'}
                                    </Text>
                                </Stack>
                                <SegmentedControl
                                    size="xs"
                                    value={pdfOptions.sortOrder}
                                    onChange={(val) => setPdfOptions(prev => ({ ...prev, sortOrder: val }))}
                                    data={[
                                        { label: 'Newest', value: 'desc' },
                                        { label: 'Timeline', value: 'asc' }
                                    ]}
                                />
                            </Group>

                            <Group justify="space-between" p="xs" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: '8px' }}>
                                <Stack gap={1}>
                                    <Text size="xs" fw={500}>Filter by Mood</Text>
                                    <Text size="11px" c="dimmed">Export specific genre or full archive</Text>
                                </Stack>
                                <Select
                                    size="xs"
                                    w={140}
                                    value={pdfOptions.moodFilter}
                                    onChange={(val) => setPdfOptions(prev => ({ ...prev, moodFilter: val || 'all' }))}
                                    data={[
                                        { label: 'All Moods', value: 'all' },
                                        { label: 'Thoughtful', value: 'Thoughtful' },
                                        { label: 'Sad', value: 'Sad' },
                                        { label: 'Healing', value: 'Healing' },
                                        { label: 'Poetry', value: 'Poetry' },
                                        { label: 'Romantic', value: 'Romantic' }
                                    ]}
                                />
                            </Group>
                        </Stack>
                    ) : (
                        /* Active Live Progress Container */
                        <Stack gap="xs" p="md" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: '8px', background: 'var(--mantine-color-body)' }}>
                            <Group justify="space-between">
                                <Text size="xs" fw={600} c="dimmed" style={{ letterSpacing: '0.04em' }}>
                                    BINDING ANTHOLOGY
                                </Text>
                                <Badge size="xs" variant="light" color={pdfExportState.step === 'done' ? 'teal' : 'indigo'}>
                                    {pdfExportState.progress}%
                                </Badge>
                            </Group>

                            <Progress
                                value={pdfExportState.progress}
                                size="sm"
                                radius="xl"
                                animated={pdfExportState.step !== 'done'}
                                color={pdfExportState.step === 'done' ? 'teal' : 'indigo'}
                            />

                            <Group gap="xs" mt={2}>
                                <Text size="xs" fw={500}>
                                    {pdfExportState.message || 'Preparing book...'}
                                </Text>
                            </Group>

                            <Text size="11px" c="dimmed">
                                Please do not close this window while all posts are being compiled and typeset.
                            </Text>
                        </Stack>
                    )}

                    {/* Modal Action Buttons */}
                    <Group justify="flex-end" gap="xs" mt="sm">
                        <Button
                            variant="subtle"
                            size="xs"
                            radius="md"
                            disabled={pdfExportState.active}
                            onClick={closePdfModal}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="filled"
                            size="xs"
                            radius="md"
                            leftSection={pdfExportState.active ? undefined : <IconDownload size={14} />}
                            loading={pdfExportState.active}
                            onClick={handleGenerateAnthologyPDF}
                        >
                            {pdfExportState.active ? 'Compiling PDF...' : 'Download PDF Book'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal
                opened={editOpened}
                onClose={closeEdit}
                title={<Text fw={600} size="lg">Edit Profile</Text>}
                centered
                size="md"
                radius="md"
                padding="lg"
                overlayProps={{ backgroundOpacity: 0.6, blur: 4 }}
            >
                <ScrollArea.Autosize mah="75vh" type="auto" scrollbarSize={6} offsetScrollbars>
                    <Stack gap="md">
                        {/* Profile Picture */}
                        <Box>
                            <Text fw={600} size="xs" c="dimmed" mb={6}>PROFILE PICTURE</Text>
                            <Center>
                                <Stack align="center" gap="xs">
                                    <Avatar
                                        src={previewUrl || profileUser.profilePic}
                                        size={90}
                                        radius="50%"
                                        style={{ border: '2px solid var(--mantine-color-default-border)' }}
                                    />
                                    <Group gap="xs">
                                        <FileInput
                                            id="profile-pic-input"
                                            placeholder="Change Photo"
                                            accept="image/*"
                                            radius="md"
                                            size="xs"
                                            clearable
                                            value={editForm.image}
                                            onChange={(file) => setEditForm(prev => ({ ...prev, image: file, imageUrl: '' }))}
                                        />
                                    </Group>
                                    <TextInput
                                        placeholder="Or paste image URL"
                                        leftSection={<IconLink size={13} />}
                                        radius="md"
                                        size="xs"
                                        w="100%"
                                        value={editForm.imageUrl}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, imageUrl: e.target.value, image: null }))}
                                    />
                                </Stack>
                            </Center>
                        </Box>

                        {/* Cover Image */}
                        <Box>
                            <Text fw={600} size="xs" c="dimmed" mb={6}>COVER PHOTO</Text>
                            <Group gap="xs" grow>
                                <FileInput
                                    placeholder="Upload Cover"
                                    accept="image/*"
                                    leftSection={<IconUpload size={13} />}
                                    radius="md"
                                    size="xs"
                                    clearable
                                    value={editForm.coverImage}
                                    onChange={(file) => setEditForm(prev => ({ ...prev, coverImage: file, coverImageUrl: '' }))}
                                />
                                <TextInput
                                    placeholder="Or paste cover URL"
                                    leftSection={<IconLink size={13} />}
                                    radius="md"
                                    size="xs"
                                    value={editForm.coverImageUrl}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, coverImageUrl: e.target.value, coverImage: null }))}
                                />
                            </Group>
                        </Box>

                        {/* Profile Info */}
                        <TextInput
                            label="Display Name"
                            placeholder="Your Name"
                            value={editForm.displayName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                            radius="md"
                            size="sm"
                        />

                        <TextInput
                            label="Username"
                            placeholder="username"
                            value={editForm.username}
                            onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                            radius="md"
                            size="sm"
                        />

                        <Box>
                            <Flex justify="space-between" align="center" mb={4}>
                                <Text size="sm" fw={500}>Bio</Text>
                                <Text size="xs" c="dimmed">{editForm.bio?.length || 0}/200</Text>
                            </Flex>
                            <Textarea
                                placeholder="Write a short bio or quote..."
                                value={editForm.bio}
                                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value.slice(0, 200) }))}
                                minRows={3}
                                maxRows={5}
                                radius="md"
                                size="sm"
                            />
                        </Box>

                        <Group gap="sm" mt="sm">
                            <Button variant="default" onClick={closeEdit} radius="md" size="sm" style={{ flex: 1 }}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditSubmit} loading={editLoading} radius="md" size="sm" style={{ flex: 1 }}>
                                Save
                            </Button>
                        </Group>
                    </Stack>
                </ScrollArea.Autosize>
            </Modal>

            {/* Network Modal (Followers / Following) */}
            <Modal
                opened={networkOpened}
                onClose={closeNetwork}
                title={<Text fw={600} size="md">{networkType === 'followers' ? 'Followers' : 'Following'}</Text>}
                centered
                size="sm"
                radius="md"
                padding="md"
                overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
            >
                {networkLoading ? (
                    <AppLoader centered size="sm" />
                ) : (
                    <ScrollArea.Autosize mah="55vh" type="auto">
                        <Stack gap="xs" py="xs">
                            {networkUsers.length > 0 ? (
                                networkUsers.map(u => <UserCard key={u._id} user={u} />)
                            ) : (
                                <Center py={30}>
                                    <Text c="dimmed" size="sm">No {networkType} found.</Text>
                                </Center>
                            )}
                        </Stack>
                    </ScrollArea.Autosize>
                )}
            </Modal>

            {/* ── SEAMLESS HERO COVER BANNER ── */}
            <Box
                w="100%"
                h={{ base: 140, sm: 180, md: 210 }}
                style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: isMobile ? 0 : '16px',
                    marginTop: isMobile ? 0 : '8px',
                    background: profileUser.coverPic
                        ? `url(${profileUser.coverPic}) no-repeat center/cover`
                        : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                }}
            >
                {/* Subtle top bar controls */}
                <Group
                    justify="space-between"
                    p="sm"
                    style={{ position: 'relative', zIndex: 2 }}
                >
                    <ActionIcon
                        className="profile-cover-action-btn"
                        variant="subtle"
                        radius="xl"
                        size="md"
                        onClick={() => navigate(-1)}
                        aria-label="Back"
                    >
                        <IconArrowLeft size={18} />
                    </ActionIcon>

                    <Menu shadow="md" width={200} radius="md" position="bottom-end">
                        <Menu.Target>
                            <ActionIcon
                                className="profile-cover-action-btn"
                                variant="subtle"
                                radius="xl"
                                size="md"
                                aria-label="More"
                            >
                                <IconDotsVertical size={18} />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item leftSection={<IconShare size={15} />} onClick={handleShareProfile}>
                                Share Profile
                            </Menu.Item>
                            <Menu.Item leftSection={<IconBook size={15} />} onClick={openPdfModal}>
                                Export Anthology (PDF)
                            </Menu.Item>
                            {isOwnProfile && (
                                <>
                                    <Menu.Item leftSection={<IconCamera size={15} />} onClick={openEdit}>
                                        Change Cover
                                    </Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Item leftSection={<IconSettings size={15} />} onClick={() => navigate('/settings')}>
                                        Settings
                                    </Menu.Item>
                                </>
                            )}
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </Box>

            {/* ── MERGED FULL-WIDTH PROFILE (No narrow container / edge-to-edge content) ── */}
            <Box w="100%" style={{ position: 'relative' }}>
                {/* Centered Avatar smoothly overlapping the banner */}
                <Center style={{ marginTop: isMobile ? -48 : -55 }}>
                    <Indicator
                        inline
                        size={12}
                        offset={6}
                        position="bottom-end"
                        color="teal"
                        withBorder
                        disabled={!profileUser.isOnline}
                    >
                        <Avatar
                            src={profileUser.profilePic}
                            size={isMobile ? 96 : 112}
                            radius="50%"
                            style={{
                                border: '3px solid var(--mantine-color-body)',
                                backgroundColor: 'var(--mantine-color-body)',
                                display: 'block',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                            }}
                        >
                            {profileUser.username?.[0]?.toUpperCase()}
                        </Avatar>
                    </Indicator>
                </Center>

                {/* Identity, Bio, Stats & Actions Container with clean padding */}
                <Box px={{ base: 'xs', sm: 'md' }}>
                    {/* Name & Handle */}
                    <Stack gap={2} mt="xs" align="center">
                        <Title order={2} style={{ fontSize: '1.35rem', fontWeight: 700 }} ta="center">
                            {profileUser.displayName || profileUser.username}
                        </Title>
                        <Text c="dimmed" size="xs" ta="center">
                            @{profileUser.username?.toLowerCase()}
                            {profileUser.createdAt && ` · Joined ${new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                        </Text>
                    </Stack>

                    {/* Bio (Poetic, clean, natural line-height) */}
                    {profileUser.bio ? (
                        <Text
                            size="sm"
                            lh={1.6}
                            ta="center"
                            w="100%"
                            mx="auto"
                            mt={10}
                            c="var(--mantine-color-text)"
                            style={{ whiteSpace: 'pre-line', wordBreak: 'break-word', opacity: 0.92 }}
                        >
                            {profileUser.bio}
                        </Text>
                    ) : isOwnProfile ? (
                        <Text
                            size="xs"
                            c="dimmed"
                            ta="center"
                            mt={8}
                            style={{ cursor: 'pointer' }}
                            onClick={openEdit}
                        >
                            + Add a bio
                        </Text>
                    ) : null}

                    {/* Clean Full-Width Stats (Posts | Followers | Following) */}
                    <Flex
                        w="100%"
                        justify="space-around"
                        align="center"
                        mt="md"
                        py={8}
                        style={{
                            borderTop: '1px solid var(--mantine-color-default-border)',
                            borderBottom: '1px solid var(--mantine-color-default-border)'
                        }}
                    >
                        <Box ta="center" style={{ flex: 1, cursor: 'pointer' }} onClick={() => setActiveTab('posts')}>
                            <Text fw={700} size="sm" lh={1.2}>
                                {profileUser.totalPosts ?? blogs.length ?? 0}
                            </Text>
                            <Text c="dimmed" size="xs">
                                posts
                            </Text>
                        </Box>
                        <Box ta="center" style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleShowNetwork('followers')}>
                            <Text fw={700} size="sm" lh={1.2}>
                                {profileUser.followers?.length || 0}
                            </Text>
                            <Text c="dimmed" size="xs">
                                followers
                            </Text>
                        </Box>
                        <Box ta="center" style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleShowNetwork('following')}>
                            <Text fw={700} size="sm" lh={1.2}>
                                {profileUser.following?.length || 0}
                            </Text>
                            <Text c="dimmed" size="xs">
                                following
                            </Text>
                        </Box>
                    </Flex>

                    {/* Full-Width Action Buttons */}
                    <Group gap="xs" mt="md" grow w="100%">
                        {isOwnProfile ? (
                            <>
                                <Button
                                    className="profile-action-btn"
                                    variant="default"
                                    radius="md"
                                    size="xs"
                                    onClick={openEdit}
                                    style={{ height: 36, fontSize: '0.84rem' }}
                                >
                                    Edit Profile
                                </Button>
                                <Button
                                    className="profile-action-btn"
                                    variant="default"
                                    radius="md"
                                    size="xs"
                                    onClick={handleShareProfile}
                                    style={{ height: 36, fontSize: '0.84rem' }}
                                >
                                    Share Profile
                                </Button>
                                <Button
                                    className="profile-action-btn"
                                    variant="default"
                                    radius="md"
                                    size="xs"
                                    onClick={openPdfModal}
                                    leftSection={<IconBook size={14} />}
                                    style={{ height: 36, fontSize: '0.84rem' }}
                                >
                                    Export PDF
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant={isFollowing ? "default" : "filled"}
                                    color={isFollowing ? undefined : "blue"}
                                    radius="md"
                                    size="xs"
                                    onClick={handleFollowToggle}
                                    loading={followLoading}
                                    style={{ height: 36, fontSize: '0.84rem' }}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </Button>
                                {profileUser.privacySettings?.allowMessages !== false && (
                                    <Button
                                        className="profile-action-btn"
                                        variant="default"
                                        radius="md"
                                        size="xs"
                                        onClick={handleMessageClick}
                                        style={{ height: 36, fontSize: '0.84rem' }}
                                    >
                                        Message
                                    </Button>
                                )}
                                <ActionIcon
                                    className="profile-action-btn"
                                    variant="default"
                                    radius="md"
                                    size={36}
                                    onClick={openPdfModal}
                                    title="Export Writings as PDF"
                                    aria-label="Export PDF"
                                >
                                    <IconBook size={15} />
                                </ActionIcon>
                                <ActionIcon
                                    className="profile-action-btn"
                                    variant="default"
                                    radius="md"
                                    size={36}
                                    onClick={handleShareProfile}
                                    aria-label="Share"
                                >
                                    <IconShare size={15} />
                                </ActionIcon>
                            </>
                        )}
                    </Group>
                </Box>

                {/* ── SIMPLE UNDERLINE TABS (Full Width) ── */}
                <Box mt="md" w="100%">
                    <Flex justify="space-between" align="center" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                        <Tabs
                            value={activeTab}
                            onChange={setActiveTab}
                            variant="default"
                            style={{ flex: 1 }}
                            classNames={{ list: 'profile-tabs' }}
                            styles={{
                                list: {
                                    borderBottom: 'none',
                                    justifyContent: 'center',
                                    gap: 16
                                },
                                tab: {
                                    fontSize: '0.84rem',
                                    fontWeight: 600,
                                    padding: '10px 16px',
                                    color: 'var(--mantine-color-dimmed)',
                                    borderBottomWidth: 2,
                                    borderColor: 'transparent',
                                    backgroundColor: 'transparent'
                                }
                            }}
                        >
                            <Tabs.List grow>
                                <Tabs.Tab value="posts" leftSection={<IconArticle size={15} />}>
                                    Posts
                                </Tabs.Tab>
                                {isOwnProfile && (
                                    <>
                                        <Tabs.Tab value="liked" leftSection={<IconHeart size={15} />}>
                                            Liked
                                        </Tabs.Tab>
                                        <Tabs.Tab value="saved" leftSection={<IconBookmark size={15} />}>
                                            Saved
                                        </Tabs.Tab>
                                    </>
                                )}
                            </Tabs.List>
                        </Tabs>

                        {/* Quiet view mode toggle */}
                        <Group gap={2} pr="xs">
                            <ActionIcon
                                variant="subtle"
                                color={viewMode === 'grid' ? 'gray' : 'dark'}
                                size="xs"
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid View"
                            >
                                <IconLayoutGrid size={15} opacity={viewMode === 'grid' ? 1 : 0.4} />
                            </ActionIcon>
                            <ActionIcon
                                variant="subtle"
                                color={viewMode === 'feed' ? 'gray' : 'dark'}
                                size="xs"
                                onClick={() => setViewMode('feed')}
                                aria-label="Feed View"
                            >
                                <IconListDetails size={15} opacity={viewMode === 'feed' ? 1 : 0.4} />
                            </ActionIcon>
                        </Group>
                    </Flex>
                </Box>

                {/* ── CONTENT AREA ── */}
                <Box mt="xs">
                    {/* Fullscreen feed modal on tap */}
                    <Modal
                        opened={selectedPostIndex !== null}
                        onClose={() => setSelectedPostIndex(null)}
                        fullScreen
                        zIndex={3000}
                        padding={0}
                        withCloseButton={false}
                        overlayProps={{ backgroundOpacity: 0, blur: 0 }}
                        styles={{
                            content: {
                                background: 'var(--mantine-color-body)',
                                display: 'flex',
                                flexDirection: 'column',
                            },
                            body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
                        }}
                    >
                        <Box style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 16px',
                            borderBottom: '1px solid var(--mantine-color-default-border)',
                            flexShrink: 0,
                            position: 'sticky', top: 0, zIndex: 10,
                            background: 'var(--mantine-color-body)',
                        }}>
                            <ActionIcon variant="subtle" color="gray" radius="xl" size="lg" onClick={() => setSelectedPostIndex(null)}>
                                <IconX size={20} />
                            </ActionIcon>
                            <Text fw={600} size="sm">Posts</Text>
                        </Box>

                        <Box style={{ flex: 1, overflowY: 'auto' }} pt="sm">
                            {selectedPostIndex !== null && blogs.slice(selectedPostIndex).map((blog) => (
                                <Box key={blog._id} pb="xs">
                                    <BlogCard blog={blog} />
                                </Box>
                            ))}
                            {hasNextPage && !isFetchingNextPage && (
                                <Center py="md">
                                    <Button variant="subtle" size="xs" onClick={() => fetchNextPage()}>Load more</Button>
                                </Center>
                            )}
                            {isFetchingNextPage && <Center py="md"><AppLoader size="sm" /></Center>}
                        </Box>
                    </Modal>

                    {/* Posts Display */}
                    {blogsLoading && blogs.length === 0 ? (
                        <AppLoader centered />
                    ) : blogs.length === 0 ? (
                        <Center py={40}>
                            <Stack align="center" gap={4}>
                                <Text c="dimmed" size="sm">
                                    {activeTab === 'posts'
                                        ? "No posts yet"
                                        : activeTab === 'liked'
                                        ? "No liked posts"
                                        : "No saved posts"}
                                </Text>
                                {activeTab === 'posts' && isOwnProfile && (
                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        onClick={() => navigate('/create')}
                                    >
                                        Create your first post
                                    </Button>
                                )}
                            </Stack>
                        </Center>
                    ) : viewMode === 'feed' ? (
                        <Stack gap="sm" mt="xs">
                            {blogs.map((blog) => (
                                <BlogCard key={blog._id} blog={blog} />
                            ))}
                            {hasNextPage && !isFetchingNextPage && (
                                <Center mt="xs" mb="md">
                                    <Button variant="subtle" size="xs" onClick={() => fetchNextPage()}>Load more</Button>
                                </Center>
                            )}
                            {isFetchingNextPage && <Center py="md"><AppLoader size="sm" /></Center>}
                        </Stack>
                    ) : (
                        <>
                            {/* Seamless 3-column Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', marginTop: '6px' }}>
                                {blogs.map((blog, index) => {
                                    const thumb = blog.backgroundImageUrl || blog.mediaUrl || null;
                                    const gradient = blog.backgroundGradient || 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)';
                                    const text = blog.title || blog.content?.replace(/<[^>]+>/g, '').trim().slice(0, 80) || '';

                                    return (
                                        <div
                                            key={blog._id}
                                            onClick={() => setSelectedPostIndex(index)}
                                            className="profile-grid-cell"
                                            style={{
                                                position: 'relative',
                                                aspectRatio: '1 / 1',
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                background: thumb ? 'transparent' : gradient,
                                            }}
                                        >
                                            {thumb ? (
                                                <img
                                                    src={thumb}
                                                    alt={blog.title || 'post'}
                                                    style={{
                                                        width: '100%', height: '100%',
                                                        objectFit: 'cover',
                                                        display: 'block',
                                                        transition: 'transform 0.25s ease',
                                                    }}
                                                    className="profile-grid-img"
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '100%', height: '100%',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    padding: '8px',
                                                    background: gradient,
                                                }}>
                                                    <p style={{
                                                        color: '#ffffff',
                                                        fontSize: 'clamp(9px, 1.8vw, 12px)',
                                                        fontWeight: 500,
                                                        textAlign: 'center',
                                                        lineHeight: 1.35,
                                                        margin: 0,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 4,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                                                    }}>
                                                        {text}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="profile-grid-overlay" style={{
                                                position: 'absolute', inset: 0,
                                                background: 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                gap: '12px',
                                                opacity: 0,
                                                transition: 'opacity 0.2s ease, background 0.2s ease',
                                            }}>
                                                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <IconHeart size={14} fill="white" stroke={0} /> {blog.likes?.length || 0}
                                                </span>
                                                <span style={{ color: '#fff', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <IconPhoto size={14} /> {blog.commentsCount || 0}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {isFetchingNextPage && (
                                <Center py="md"><AppLoader size="sm" /></Center>
                            )}
                            {hasNextPage && !isFetchingNextPage && (
                                <Center mt="sm" mb="md">
                                    <Button variant="subtle" size="xs" onClick={() => fetchNextPage()}>Load more</Button>
                                </Center>
                            )}
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default Profile;
