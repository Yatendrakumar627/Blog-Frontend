import { Card, Text, Badge, Group, ActionIcon, Indicator, Button, Collapse, TextInput, Stack, Avatar, Image, Modal, Title, TypographyStylesProvider, Paper, Textarea, Tooltip, UnstyledButton } from '@mantine/core';
import AppLoader from './AppLoader';

import { Heart, MessageCircle, MessageSquare, Share2, Trash2, Edit, Send, Bookmark, MoreHorizontal, Download } from 'lucide-react';
import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import PostForm from './PostForm';
import { useLikePost } from '../hooks/usePosts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
// import html2canvas from 'html2canvas'; // Dynamically imported

dayjs.extend(relativeTime);

const BlogCard = memo(({ blog }) => {
    // Debug: Log the entire blog object to see its structure
    console.log('Blog data received:', blog);
    console.log('Author data:', blog.author);
    const { user, updateUser } = useAuthStore();
    const navigate = useNavigate();
    const { mutate: likePost } = useLikePost();

    // Derived state from props
    const likes = blog?.likes || [];
    const isLiked = user && blog && likes.includes(user._id);
    const isBookmarked = user && user.bookmarks && blog && user.bookmarks.includes(blog._id);

    const [comments, setComments] = useState([]); // Initialize empty, fetch on demand
    const [commentsCount, setCommentsCount] = useState(blog?.commentsCount || 0);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState('');

    // Removed initial comments fetch to improve performance
    const [opened, { open, close }] = useDisclosure(false);
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [deletePostModalOpened, { open: openDeletePostModal, close: closeDeletePostModal }] = useDisclosure(false);

    // Inline Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [displayBlog, setDisplayBlog] = useState(blog);
    const [downloading, setDownloading] = useState(false);
    const cardRef = useState(null);

    const handleLike = () => {
        if (!user) {
            open();
            return;
        }
        likePost(blog._id);
    };

    const toggleComments = async () => {
        if (!user) {
            open();
            return;
        }

        // Only fetch if we don't have comments yet, count > 0, and we are opening
        if (!commentsOpen && comments.length === 0 && commentsCount > 0) {
            try {
                setLoadingComments(true);
                const { data } = await api.get(`/comments/${displayBlog._id}`);
                setComments(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingComments(false);
            }
        }
        setCommentsOpen(!commentsOpen);
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const { data } = await api.post(`/comments`, { content: commentText, blogId: displayBlog._id });
            setComments([data, ...comments]);
            setCommentsCount(prev => prev + 1);
            setCommentText('');
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error',
                message: 'Failed to post comment',
                color: 'red'
            });
        }
    };

    const handleDeleteComment = (commentId) => {
        setCommentToDelete(commentId);
        openDeleteModal();
    };

    const confirmDeleteComment = async () => {
        if (!commentToDelete) return;

        try {
            await api.delete(`/comments/${commentToDelete}`);
            setComments(comments.filter(c => c._id !== commentToDelete));
            setCommentsCount(prev => Math.max(0, prev - 1));
            notifications.show({
                title: 'Success',
                message: 'Comment deleted',
                color: 'green'
            });
            closeDeleteModal();
        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error',
                message: 'Failed to delete comment',
                color: 'red'
            });
        }
    };

    const handleShare = () => {
        const url = `${window.location.origin}/post/${displayBlog._id}`;
        navigator.clipboard.writeText(url);
        notifications.show({
            title: 'Link Copied',
            message: 'Share this post with your friends!',
            color: 'blue',
        });
    };

    const handleBookmark = async () => {
        if (!user) {
            open();
            return;
        }
        try {
            const { data } = await api.put(`/interactions/bookmark/${blog._id}`);
            // Update auth store
            if (data.isBookmarked) {
                updateUser({ bookmarks: [...(user.bookmarks || []), blog._id] });
                notifications.show({ message: 'Post saved', color: 'green' });
            } else {
                updateUser({ bookmarks: (user.bookmarks || []).filter(id => id !== blog._id) });
                notifications.show({ message: 'Post removed from saved', color: 'yellow' });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = () => {
        openDeletePostModal();
    };

    const handleMessageClick = async (e) => {
        e.stopPropagation();
        if (!user) {
            open();
            return;
        }
        if (user?._id === displayBlog.author?._id) return;

        try {
            await api.post('/chat/conversation', { recipientId: displayBlog.author._id });
            navigate('/chat');
        } catch (error) {
            notifications.show({ title: 'Error', message: error.response?.data?.message || 'Could not initiate chat', color: 'red' });
        }
    };

    const confirmDeletePost = async () => {
        try {
            await api.delete(`/blogs/${displayBlog._id}`);
            window.location.reload();
        } catch (error) {
            console.error('Error deleting post:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to delete post. Please try again.',
                color: 'red'
            });
        }
        closeDeletePostModal();
    };

    const handleUpdate = async (formData) => {
        try {
            const { data } = await api.put(`/blogs/${displayBlog._id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setDisplayBlog(data);
            setIsEditing(false);
            notifications.show({
                title: 'Success',
                message: 'Post updated successfully',
                color: 'green',
            });
        } catch (error) {
            console.error('Update error:', error);
            notifications.show({
                title: 'Error',
                message: 'Could not update post',
                color: 'red',
            });
        }
    };

    const handleDownloadImage = async () => {
        if (!user) {
            open();
            return;
        }

        setDownloading(true);
        try {
            const cardElement = document.getElementById(`blog-card-${displayBlog._id}`);
            if (!cardElement) {
                throw new Error('Card element not found');
            }

            // Create a wrapper for the premium download look
            const wrapper = document.createElement('div');
            wrapper.style.position = 'fixed';
            wrapper.style.left = '-9999px';
            wrapper.style.top = '0';
            wrapper.style.width = '1080px'; // Instagram Portrait match
            wrapper.style.minHeight = '1350px'; // 4:5 Aspect Ratio minimum
            wrapper.style.height = 'auto'; // Allow expansion
            wrapper.style.padding = '80px';
            wrapper.style.boxSizing = 'border-box'; // Ensure padding is included in width
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';
            wrapper.style.justifyContent = 'flex-start'; // Start from top to prevent clipping long content
            wrapper.style.fontFamily = "'Inter', sans-serif"; // Enforce font

            // Premium Gradient Background
            const isDarkMode = document.documentElement.classList.contains('dark') ||
                window.getComputedStyle(document.documentElement).getPropertyValue('color-scheme') === 'dark';

            if (isDarkMode) {
                // Spotlight effect: Lighter center, dark edges
                wrapper.style.background = 'radial-gradient(circle at 50% 30%, #2a2a2a 0%, #000000 100%)';
            } else {
                // Light mode spotlight: White center, soft grey edges
                wrapper.style.background = 'radial-gradient(circle at 50% 30%, #ffffff 0%, #e6e9f0 100%)';
            }

            // Clone the card
            const cardClone = cardElement.cloneNode(true);

            // Remove interactive elements from clone
            const interactiveElements = cardClone.querySelectorAll('button, [role="button"], .mantine-Collapse-root');
            interactiveElements.forEach(el => el.style.display = 'none');

            // Force larger font size for the content
            const contentDiv = cardClone.querySelector('.blog-post-content');
            if (contentDiv) {
                const textElements = contentDiv.querySelectorAll('*');
                textElements.forEach(el => {
                    el.style.fontSize = '30px'; // Massive scale up to fill space
                    el.style.lineHeight = '1.6';
                });
                // Also target the container itself in case text is direct
                contentDiv.style.fontSize = '30px';
                contentDiv.style.lineHeight = '1.6';
            }

            // Style the card clone inside the wrapper
            cardClone.style.width = '100%';
            cardClone.style.maxWidth = 'none'; // Unset max-width
            cardClone.style.flex = '0 0 auto'; // Don't shrink or stretch vertically
            cardClone.style.display = 'flex';
            cardClone.style.flexDirection = 'column';
            cardClone.style.marginTop = 'auto'; // Center vertically if space allows
            cardClone.style.marginBottom = 'auto'; // Center vertically if space allows
            // Enhance shadow for "floating" effect
            cardClone.style.boxShadow = isDarkMode
                ? '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)'
                : '0 40px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)';
            cardClone.style.borderRadius = '32px'; // Larger radius
            // Remove default border to let shadow/ring define edges
            cardClone.style.border = 'none';
            cardClone.style.overflow = 'visible'; // Allow content to show
            cardClone.style.transform = 'none';
            cardClone.style.margin = '0 auto';
            cardClone.style.padding = '80px'; // Massive internal padding to consume area

            if (isDarkMode) {
                cardClone.style.backgroundColor = '#161616'; // Slightly lighter than pure black bg
                cardClone.style.color = 'rgba(255, 255, 255, 0.9)';
            } else {
                cardClone.style.backgroundColor = '#ffffff';
                cardClone.style.color = '#1a1a1a';
            }

            // Add Branding / Footer
            const footer = document.createElement('div');
            footer.style.marginTop = '30px';
            footer.style.flexShrink = '0'; // Prevent footer compression
            footer.style.textAlign = 'center';
            footer.style.display = 'flex';
            footer.style.flexDirection = 'column';
            footer.style.alignItems = 'center';
            footer.style.gap = '10px';
            footer.style.opacity = '0.9'; // Subtle transparency

            // Elegant separator
            const separator = document.createElement('span');
            separator.innerHTML = '•';
            separator.style.color = isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)';
            separator.style.fontSize = '20px';
            separator.style.lineHeight = '1';

            const brandBox = document.createElement('div');
            brandBox.style.display = 'flex';
            brandBox.style.alignItems = 'center';
            brandBox.style.gap = '12px';

            const brandName = document.createElement('div');
            brandName.style.color = isDarkMode ? '#fff' : '#000';
            brandName.style.fontSize = '18px'; // Smaller, stronger
            brandName.style.fontWeight = '700';
            brandName.style.letterSpacing = '4px'; // High tracking
            brandName.style.textTransform = 'uppercase';
            brandName.innerHTML = 'BlogApp';

            const dateInfo = document.createElement('div');
            dateInfo.style.color = isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
            dateInfo.style.fontSize = '13px';
            dateInfo.style.fontWeight = '400';
            dateInfo.style.letterSpacing = '1px';
            dateInfo.style.fontFamily = "'Inter', sans-serif";
            dateInfo.innerHTML = dayjs().format('DD MMMM YYYY');

            brandBox.appendChild(brandName);

            footer.appendChild(separator);
            footer.appendChild(brandBox);
            footer.appendChild(dateInfo);

            wrapper.appendChild(cardClone);
            wrapper.appendChild(footer);
            document.body.appendChild(wrapper);

            // Measure the actual height needed
            const actualHeight = wrapper.offsetHeight;

            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(wrapper, {
                backgroundColor: null,
                scale: 2, // High resolution
                logging: false,
                useCORS: true,
                allowTaint: true,
                width: 1080,
                height: actualHeight,
                windowWidth: 1080,
                windowHeight: actualHeight,
                ignoreElements: (element) => element.classList.contains('no-export'), // Helper to ignore elements if needed
            });

            // Remove wrapper from body
            document.body.removeChild(wrapper);

            // Convert to blob and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `BlogApp-${(displayBlog.title || 'post').substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${dayjs().format('YYYYMMDD')}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                notifications.show({
                    title: 'Download Complete',
                    message: 'Your premium post image is ready!',
                    color: 'teal',
                    icon: <Download size={16} />,
                });
            }, 'image/png', 1.0);
        } catch (error) {
            console.error('Error downloading image:', error);
            notifications.show({
                title: 'Download Failed',
                message: 'Could not generate post image.',
                color: 'red',
            });
        } finally {
            setDownloading(false);
        }
    };

    const getDisplayName = (user) => {
        return user?.displayName || user?.username || 'Unknown';
    };

    const getUsername = (user) => {
        return user?.username || 'unknown';
    };

    const isAuthor = user && blog && blog.author && (user._id === (blog.author._id || blog.author));

    if (!blog) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            whileHover={{ y: -2 }}
        >
            <>
                <Modal opened={opened} onClose={close} title="Join the Conversation!" centered radius="md">
                    <Stack align="center" ta="center">
                        <Text>You need to be logged in to like, comment, or download posts.</Text>
                        <Group>
                            <Button component={Link} to="/login" variant="light">Login</Button>
                            <Button component={Link} to="/register" variant="filled">Create Account</Button>
                        </Group>
                    </Stack>
                </Modal>

                <Modal
                    opened={deleteModalOpened}
                    onClose={closeDeleteModal}
                    title="Delete Comment"
                    centered
                    radius="md"
                >
                    <Stack>
                        <Text size="sm">Are you sure you want to delete this comment? This action cannot be undone.</Text>
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeDeleteModal}>Cancel</Button>
                            <Button color="red" onClick={confirmDeleteComment}>Delete</Button>
                        </Group>
                    </Stack>
                </Modal>

                <Modal
                    opened={deletePostModalOpened}
                    onClose={closeDeletePostModal}
                    title="Delete Post"
                    centered
                    radius="md"
                >
                    <Stack>
                        <Text size="sm">Are you sure you want to delete this post? This action cannot be undone.</Text>
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeDeletePostModal}>Cancel</Button>
                            <Button color="red" onClick={confirmDeletePost}>Delete</Button>
                        </Group>
                    </Stack>
                </Modal>

                <Card
                    shadow="md"
                    p="lg"
                    radius="lg"
                    withBorder
                    mb="lg"
                    id={`blog-card-${displayBlog._id}`}
                    style={{
                        transition: 'all 0.3s ease',
                        width: '100%',
                        '&:hover': {
                            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                            transform: 'translateY(-2px)'
                        }
                    }}
                >
                    {isEditing ? (
                        <PostForm
                            initialData={{
                                ...displayBlog,
                                tags: displayBlog.tags ? displayBlog.tags.join(', ') : '',
                                // Ensure initialData structure matches what PostForm expects
                            }}
                            onSubmit={handleUpdate}
                            onCancel={() => setIsEditing(false)}
                            submitLabel="Save Changes"
                        />
                    ) : (
                        <>
                            {/* Header - Always outside for Poetry/Shayari */}
                            {(displayBlog.displayMode === 'Poetry' || displayBlog.displayMode === 'Shayari') ? (
                                <Group justify="space-between" mb="sm" p={0}>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    >
                                        <UnstyledButton
                                            onClick={() => navigate(`/profile/${displayBlog.author?.username}`)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                cursor: 'pointer',
                                                padding: '4px 8px',
                                                borderRadius: '8px',
                                                transition: 'background-color 0.2s ease',
                                                '&:hover': {
                                                    backgroundColor: 'var(--mantine-color-gray-1)'
                                                }
                                            }}
                                        >
                                            <Indicator
                                                inline
                                                size={10}
                                                offset={2}
                                                position="bottom-end"
                                                color="green"
                                                withBorder
                                                disabled={!displayBlog.author?.isOnline || displayBlog.isAnonymous}
                                                processing={displayBlog.author?.isOnline && !displayBlog.isAnonymous}
                                            >
                                                <Avatar
                                                    src={displayBlog.author?.profilePic}
                                                    radius="xl"
                                                    size="sm"
                                                    style={{
                                                        border: '2px solid var(--mantine-color-blue-6)',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                            </Indicator>
                                            <div>
                                                <Text
                                                    fw={600}
                                                    size="sm"
                                                    style={{
                                                        color: 'var(--mantine-color-text)',
                                                        lineHeight: 1.2
                                                    }}
                                                >
                                                    {displayBlog.isAnonymous ? 'Anonymous' : getDisplayName(displayBlog.author)}
                                                </Text>
                                                <Text
                                                    size="xs"
                                                    c="dimmed"
                                                    style={{
                                                        fontSize: '11px',
                                                        marginTop: '2px'
                                                    }}
                                                >
                                                    {dayjs(displayBlog.createdAt).fromNow()}
                                                </Text>
                                            </div>
                                        </UnstyledButton>
                                    </motion.div>
                                    <Group gap="xs">
                                        <Badge
                                            color="violet"
                                            variant="light"
                                            size="sm"
                                            style={{
                                                fontWeight: 600,
                                                textTransform: 'none'
                                            }}
                                        >
                                            {displayBlog.displayMode === 'Shayari' ? 'Shayari' : 'Poetry'}
                                        </Badge>
                                        <Badge
                                            color="pink"
                                            variant="light"
                                            size="sm"
                                            style={{
                                                fontWeight: 600,
                                                textTransform: 'none',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            {displayBlog.mood}
                                        </Badge>
                                        {!isAuthor && displayBlog.author?.privacySettings?.allowMessages !== false && (
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                            >
                                                <Tooltip label="Message Author" position="bottom" withArrow>
                                                    <ActionIcon
                                                        variant="transparent"
                                                        onClick={handleMessageClick}
                                                        size="lg"
                                                        style={{
                                                            color: 'var(--mantine-color-pink-6)',
                                                            '&:hover': {
                                                                backgroundColor: 'var(--mantine-color-pink-0)'
                                                            }
                                                        }}
                                                    >
                                                        <MessageSquare size={20} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </motion.div>
                                        )}
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        >
                                            <Tooltip label={isBookmarked ? "Remove bookmark" : "Bookmark"} position="bottom" withArrow>
                                                <ActionIcon
                                                    variant="transparent"
                                                    color={isBookmarked ? 'yellow' : 'gray'}
                                                    onClick={handleBookmark}
                                                    size="lg"
                                                    style={{
                                                        '&:hover': {
                                                            color: isBookmarked ? 'var(--mantine-color-yellow-7)' : 'var(--mantine-color-gray-7)',
                                                            backgroundColor: isBookmarked ? 'var(--mantine-color-yellow-0)' : 'var(--mantine-color-gray-0)'
                                                        }
                                                    }}
                                                >
                                                    <motion.div
                                                        animate={{ scale: isBookmarked ? [1, 1.2, 1] : 1 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <Bookmark fill={isBookmarked ? 'currentColor' : 'none'} size={20} />
                                                    </motion.div>
                                                </ActionIcon>
                                            </Tooltip>
                                        </motion.div>
                                    </Group>
                                </Group>
                            ) : (
                                <Group justify="space-between" mb="sm" p={0}>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    >
                                        <UnstyledButton
                                            onClick={() => navigate(`/profile/${displayBlog.author?.username}`)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                cursor: 'pointer',
                                                padding: '4px 8px',
                                                borderRadius: '8px',
                                                transition: 'background-color 0.2s ease',
                                                '&:hover': {
                                                    backgroundColor: 'var(--mantine-color-gray-1)'
                                                }
                                            }}
                                        >
                                            <Indicator
                                                inline
                                                size={12}
                                                offset={4}
                                                position="bottom-end"
                                                color="green"
                                                withBorder
                                                disabled={!displayBlog.author?.isOnline || displayBlog.isAnonymous}
                                                processing={displayBlog.author?.isOnline && !displayBlog.isAnonymous}
                                            >
                                                <Avatar
                                                    src={displayBlog.author?.profilePic}
                                                    radius="xl"
                                                    style={{
                                                        border: '2px solid var(--mantine-color-blue-6)',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                            </Indicator>
                                            <div>
                                                <Text
                                                    fw={600}
                                                    style={{
                                                        color: 'var(--mantine-color-text)',
                                                        lineHeight: 1.2
                                                    }}
                                                >
                                                    {displayBlog.isAnonymous ? 'Anonymous' : getDisplayName(displayBlog.author)}
                                                </Text>
                                                <Text
                                                    size="xs"
                                                    c="dimmed"
                                                    style={{
                                                        fontSize: '11px',
                                                        marginTop: '2px'
                                                    }}
                                                >
                                                    {dayjs(displayBlog.createdAt).fromNow()}
                                                </Text>
                                            </div>
                                        </UnstyledButton>
                                    </motion.div>
                                    <Group gap="xs">
                                        <Badge
                                            color="pink"
                                            variant="light"
                                            size="sm"
                                            style={{
                                                fontWeight: 600,
                                                textTransform: 'none',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            {displayBlog.mood}
                                        </Badge>
                                        {!isAuthor && displayBlog.author?.privacySettings?.allowMessages !== false && (
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                            >
                                                <Tooltip label="Message Author" position="bottom" withArrow>
                                                    <ActionIcon
                                                        variant="transparent"
                                                        onClick={handleMessageClick}
                                                        size="lg"
                                                        style={{
                                                            color: 'var(--mantine-color-pink-6)',
                                                            '&:hover': {
                                                                backgroundColor: 'var(--mantine-color-pink-0)'
                                                            }
                                                        }}
                                                    >
                                                        <MessageSquare size={20} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </motion.div>
                                        )}
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        >
                                            <Tooltip label={isBookmarked ? "Remove bookmark" : "Bookmark"} position="bottom" withArrow>
                                                <ActionIcon
                                                    variant="transparent"
                                                    color={isBookmarked ? 'yellow' : 'gray'}
                                                    onClick={handleBookmark}
                                                    size="lg"
                                                    style={{
                                                        '&:hover': {
                                                            color: isBookmarked ? 'var(--mantine-color-yellow-7)' : 'var(--mantine-color-gray-7)',
                                                            backgroundColor: isBookmarked ? 'var(--mantine-color-yellow-0)' : 'var(--mantine-color-gray-0)'
                                                        }
                                                    }}
                                                >
                                                    <motion.div
                                                        animate={{ scale: isBookmarked ? [1, 1.2, 1] : 1 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <Bookmark fill={isBookmarked ? 'currentColor' : 'none'} size={20} />
                                                    </motion.div>
                                                </ActionIcon>
                                            </Tooltip>
                                        </motion.div>
                                    </Group>
                                </Group>
                            )}

                            {/* Content */}
                            {/* Content */}
                            <div className="blog-post-content" style={{ fontSize: '14px', width: '100%' }}>
                                {(displayBlog.displayMode === 'Poetry' || displayBlog.displayMode === 'Shayari') ? (
                                    <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', minHeight: '300px' }}>
                                        <img
                                            src={displayBlog.backgroundImage || "/paper-bg.png"}
                                            alt="Background"
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                width: '100%',
                                                height: '100%',
                                                display: 'block',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: 'relative',
                                                zIndex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 'clamp(1.5rem, 5vw, 4rem)',
                                                width: '100%',
                                                // Add a subtle gradient overlay for better text readability
                                                background: 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 100%)',
                                                ...(displayBlog.displayMode === 'Poetry' ? {
                                                    fontFamily: "'Playfair Display', serif",
                                                    textAlign: 'justify',
                                                    whiteSpace: 'pre-line',
                                                    lineHeight: 1.8, // Increased for elegance
                                                    fontSize: 'clamp(0.85rem, 3vw, 1.5rem)',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.05)', // Soft shadow
                                                    letterSpacing: '0.01em',
                                                } : {
                                                    fontFamily: "'Dancing Script', cursive",
                                                    textAlign: 'justify',
                                                    whiteSpace: 'pre-line',
                                                    lineHeight: 1.6,
                                                    fontSize: 'clamp(1.1rem, 4.5vw, 2.5rem)',
                                                    textShadow: '0 2px 3px rgba(255,255,255,0.8), 0 1px 1px rgba(0,0,0,0.1)',
                                                })
                                            }}
                                        >
                                            {displayBlog.displayMode === 'Shayari' && (
                                                <div style={{
                                                    fontFamily: 'serif',
                                                    fontSize: '5rem',
                                                    position: 'absolute',
                                                    top: '10px',
                                                    left: '20px',
                                                    color: 'rgba(74, 4, 4, 0.2)',
                                                    lineHeight: 1,
                                                    pointerEvents: 'none'
                                                }}>
                                                    "
                                                </div>
                                            )}

                                            <div
                                                dangerouslySetInnerHTML={{ __html: displayBlog.content }}
                                                style={{
                                                    width: '100%',
                                                    maxWidth: '600px', // Constrain width for better readability on desktop
                                                    color: '#2c3e50',
                                                    position: 'relative',
                                                    zIndex: 1,
                                                    margin: '0 auto' // Ensure centering
                                                }}
                                            />

                                            {displayBlog.displayMode === 'Shayari' && (
                                                <div style={{
                                                    fontFamily: 'serif',
                                                    fontSize: '5rem',
                                                    position: 'absolute',
                                                    bottom: '-20px',
                                                    right: '20px',
                                                    color: 'rgba(74, 4, 4, 0.2)',
                                                    lineHeight: 1,
                                                    pointerEvents: 'none'
                                                }}>
                                                    "
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: displayBlog.content }}
                                        style={{
                                            textAlign: 'justify',
                                            lineHeight: 1.6,
                                            fontSize: '16px'
                                        }}
                                    />
                                )}
                            </div>

                            {displayBlog.mediaUrl && (
                                <Image
                                    src={displayBlog.mediaUrl}
                                    alt="Post image"
                                    mt="md"
                                    radius="md"
                                />
                            )}

                            {/* Actions - Enhanced with animations */}
                            <Group
                                mt={(displayBlog.displayMode === 'Poetry' || displayBlog.displayMode === 'Shayari') ? 'sm' : 'md'}
                                gap="sm"
                                px={0}
                                style={{
                                    borderTop: '1px solid var(--mantine-color-gray-2)',
                                    paddingTop: '12px'
                                }}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <Tooltip label={isLiked ? "Unlike" : "Like"} position="top" withArrow>
                                        <UnstyledButton
                                            onClick={handleLike}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                transition: 'all 0.2s ease',
                                                color: isLiked ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-gray-6)',
                                                '&:hover': {
                                                    backgroundColor: isLiked ? 'var(--mantine-color-red-0)' : 'var(--mantine-color-gray-0)',
                                                    color: isLiked ? 'var(--mantine-color-red-7)' : 'var(--mantine-color-gray-7)'
                                                }
                                            }}
                                        >
                                            <motion.div
                                                animate={{ scale: isLiked ? [1, 1.2, 1] : 1 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Heart fill={isLiked ? 'currentColor' : 'none'} size={20} />
                                            </motion.div>
                                            <Text size="sm" fw={500}>{likes.length}</Text>
                                        </UnstyledButton>
                                    </Tooltip>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <Tooltip label="Comments" position="top" withArrow>
                                        <UnstyledButton
                                            onClick={toggleComments}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                transition: 'all 0.2s ease',
                                                color: 'var(--mantine-color-gray-6)',
                                                '&:hover': {
                                                    backgroundColor: 'var(--mantine-color-blue-0)',
                                                    color: 'var(--mantine-color-blue-6)'
                                                }
                                            }}
                                        >
                                            <MessageCircle size={20} />
                                            <Text size="sm" fw={500}>{commentsCount}</Text>
                                        </UnstyledButton>
                                    </Tooltip>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <Tooltip label="Download as Image" position="top" withArrow>
                                        <ActionIcon
                                            variant="transparent"
                                            onClick={handleDownloadImage}
                                            loading={downloading}
                                            size="lg"
                                            style={{
                                                color: 'var(--mantine-color-gray-6)',
                                                '&:hover': {
                                                    color: 'var(--mantine-color-pink-6)',
                                                    backgroundColor: 'var(--mantine-color-pink-0)'
                                                }
                                            }}
                                        >
                                            <Download size={20} />
                                        </ActionIcon>
                                    </Tooltip>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <Tooltip label="Share Link" position="top" withArrow>
                                        <ActionIcon
                                            variant="transparent"
                                            onClick={handleShare}
                                            size="lg"
                                            style={{
                                                color: 'var(--mantine-color-gray-6)',
                                                '&:hover': {
                                                    color: 'var(--mantine-color-green-6)',
                                                    backgroundColor: 'var(--mantine-color-green-0)'
                                                }
                                            }}
                                        >
                                            <Share2 size={20} />
                                        </ActionIcon>
                                    </Tooltip>
                                </motion.div>



                                {isAuthor && (
                                    <>
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        >
                                            <Tooltip label="Edit post" position="top" withArrow>
                                                <ActionIcon
                                                    variant="transparent"
                                                    color="blue"
                                                    onClick={() => setIsEditing(true)}
                                                    size="lg"
                                                    style={{
                                                        '&:hover': {
                                                            color: 'var(--mantine-color-blue-7)',
                                                            backgroundColor: 'var(--mantine-color-blue-0)'
                                                        }
                                                    }}
                                                >
                                                    <Edit size={20} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </motion.div>

                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        >
                                            <Tooltip label="Delete post" position="top" withArrow>
                                                <ActionIcon
                                                    variant="transparent"
                                                    color="red"
                                                    onClick={handleDelete}
                                                    size="lg"
                                                    style={{
                                                        '&:hover': {
                                                            color: 'var(--mantine-color-red-7)',
                                                            backgroundColor: 'var(--mantine-color-red-0)'
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={20} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </motion.div>
                                    </>
                                )}
                            </Group>

                            <Collapse in={commentsOpen}>
                                <Stack mt="md" gap="md">
                                    <Title order={6} c="dimmed">Comments</Title>
                                    {loadingComments ? (
                                        <AppLoader centered size="sm" />
                                    ) : comments.length === 0 ? (
                                        <Text c="dimmed" size="sm" ta="center" py="sm">No comments yet. Be the first to share your thoughts!</Text>
                                    ) : (
                                        comments.map((c) => (
                                            <Paper key={c._id} p="sm" radius="md" bg="transparent" className="comment-item">
                                                <Group wrap="nowrap" align="flex-start">
                                                    <Indicator
                                                        inline
                                                        size={10}
                                                        offset={2}
                                                        position="bottom-end"
                                                        color="green"
                                                        withBorder
                                                        disabled={!c.author?.isOnline}
                                                        processing={c.author?.isOnline}
                                                    >
                                                        <Avatar
                                                            src={c.author?.profilePic}
                                                            radius="xl"
                                                            size="sm"
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => navigate(`/profile/${c.author?.username}`)}
                                                        />
                                                    </Indicator>
                                                    <div style={{ flex: 1 }}>
                                                        <Group justify="space-between" mb={4}>
                                                            <Group gap="xs">
                                                                <Text size="sm" fw={600} sx={(theme) => ({
                                                                    cursor: 'pointer',
                                                                    color: theme.colorScheme === 'dark' ? theme.white : theme.colors.dark[9]
                                                                })}
                                                                    onClick={() => navigate(`/profile/${c.author?.username}`)}
                                                                >
                                                                    {getDisplayName(c.author)}
                                                                </Text>
                                                                <Text size="xs" c="dimmed">•</Text>
                                                                <Text size="xs" c="dimmed">{dayjs(c.createdAt).fromNow()}</Text>
                                                            </Group>
                                                            {user && c.author && String(user._id) === String(c.author._id || c.author) && (
                                                                <ActionIcon
                                                                    variant="subtle"
                                                                    color="red"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteComment(c._id);
                                                                    }}
                                                                    title="Delete comment"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </ActionIcon>
                                                            )}
                                                        </Group>
                                                        <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>
                                                            {c.content}
                                                        </Text>
                                                    </div>
                                                </Group>
                                            </Paper>
                                        ))
                                    )}

                                    <Paper p="xs" radius="md" withBorder>
                                        <form onSubmit={handleComment}>
                                            <Group align="flex-start" gap="xs">
                                                <Avatar src={user?.profilePic} size="sm" radius="xl" />
                                                <Textarea
                                                    placeholder="Write a comment..."
                                                    variant="unstyled"
                                                    autosize
                                                    minRows={1}
                                                    maxRows={4}
                                                    style={{ flex: 1 }}
                                                    value={commentText}
                                                    onChange={(e) => setCommentText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleComment(e);
                                                        }
                                                    }}
                                                />
                                                <ActionIcon
                                                    variant="subtle"
                                                    color="blue"
                                                    type="submit"
                                                    disabled={!commentText.trim()}
                                                >
                                                    <Send size={18} />
                                                </ActionIcon>
                                            </Group>
                                        </form>
                                    </Paper>
                                </Stack>
                            </Collapse>
                        </>
                    )}
                </Card>
            </>
        </motion.div >
    );
});

export default BlogCard;
