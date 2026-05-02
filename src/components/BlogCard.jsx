import { Card, Text, Badge, Group, ActionIcon, Indicator, Button, Collapse, TextInput, Stack, Avatar, Image, Modal, Title, TypographyStylesProvider, Paper, Textarea, Tooltip, UnstyledButton, useMantineColorScheme, Menu } from '@mantine/core';
import AppLoader from './AppLoader';
import './BlogCard.css';

import { Heart, MessageCircle, MessageSquare, Share2, Trash2, Edit, Send, Bookmark, MoreHorizontal, Download } from 'lucide-react';
import { useState, useEffect, useRef, memo } from 'react';
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
import { sanitizeHTML } from '../utils/sanitize';

dayjs.extend(relativeTime);

const REACTIONS = [
    { label: 'I feel this', icon: '❤️', value: 'I feel this', color: 'red' },
    { label: 'Sending hugs', icon: '🤗', value: 'Sending hugs', color: 'pink' },
    { label: 'Resonates', icon: '✨', value: 'Resonates', color: 'yellow' },
    { label: 'Snaps', icon: '👏', value: 'Snaps', color: 'violet' },
];

const BlogCard = memo(({ blog }) => {
    const { user, updateUser } = useAuthStore();
    const navigate = useNavigate();
    const { mutate: likePost } = useLikePost();
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    // Derived state from props
    const likes = blog?.likes || [];
    const reactions = blog?.reactions || [];
    const userReaction = user && reactions.find(r => (r.user?._id || r.user) === user._id)?.type;
    const isLiked = !!userReaction || (user && blog && likes.includes(user._id));
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
    const cardRef = useRef(null);

    const handleLike = (reactionType = null) => {
        if (!user) {
            navigate('/login');
            return;
        }
        likePost({ id: blog._id, reactionType });
    };

    const toggleComments = async () => {
        if (!user) {
            navigate('/login');
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
        if (!user) {
            navigate('/login');
            return;
        }
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
            navigate('/login');
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
            navigate('/login');
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
            navigate('/login');
            return;
        }

        setDownloading(true);
        try {
            const cardElement = document.getElementById(`blog-card-${displayBlog._id}`);
            if (!cardElement) {
                throw new Error('Card element not found');
            }

            // Create a wrapper for the premium download look
            const isTextOnly = displayBlog.displayMode !== 'Poetry' && displayBlog.displayMode !== 'Shayari';

            // Create a wrapper for the premium download look
            const wrapper = document.createElement('div');
            wrapper.style.position = 'fixed';
            wrapper.style.left = '-9999px';
            wrapper.style.top = '0';
            wrapper.style.width = '480px'; // Slimmer width matches reference
            wrapper.style.minHeight = isTextOnly ? '405px' : '675px'; // 4:3 for text, 4:5 for poetry
            wrapper.style.height = 'auto'; // Allow expansion
            wrapper.style.padding = '20px';
            wrapper.style.paddingBottom = '25px';
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
                // Simple solid dark background
                wrapper.style.background = '#15151a';
            } else {
                // Simple solid light background
                wrapper.style.background = '#f4f4f8';
            }

            // Clone the card
            const cardClone = cardElement.cloneNode(true);

            // Helper: Convert an image URL to a base64 data URL via the server proxy
            const toDataURL = async (url) => {
                if (!url || url.startsWith('data:')) return url;
                try {
                    // Create an absolute URL for the proxy
                    const absoluteUrl = new URL(url, window.location.origin).href;
                    const fetchUrl = `${api.defaults.baseURL}/proxy?url=${encodeURIComponent(absoluteUrl)}`;

                    const response = await fetch(fetchUrl);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const blob = await response.blob();
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } catch (err) {
                    console.warn('Failed to convert image to data URL via proxy:', url, err);
                    // Fallback to direct fetch if proxy fails
                    try {
                        const response = await fetch(url, { mode: 'cors' });
                        if (!response.ok) throw new Error(`Direct fetch failed: ${response.status}`);
                        const blob = await response.blob();
                        return new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        });
                    } catch (directErr) {
                        console.warn('Fallback direct fetch also failed:', url, directErr);
                        return url;
                    }
                }
            };

            // Helper to fix html2canvas object-fit distortion
            const applyObjectFitFix = (imgElem, srcUrl) => {
                if (imgElem.style.objectFit === 'cover' || imgElem.alt === 'Background') {
                    const div = document.createElement('div');
                    div.style.cssText = imgElem.style.cssText;
                    div.style.backgroundImage = `url("${srcUrl}")`;
                    div.style.backgroundSize = imgElem.style.objectFit || 'cover';
                    div.style.backgroundPosition = imgElem.style.objectPosition || 'center';
                    div.style.backgroundRepeat = 'no-repeat';
                    div.style.objectFit = '';
                    div.style.objectPosition = '';
                    if (imgElem.className) div.className = imgElem.className;
                    if (imgElem.parentNode) {
                        imgElem.parentNode.replaceChild(div, imgElem);
                    }
                }
            };

            // Pre-convert ALL images in the clone to base64 data URLs
            const allImages = cardClone.querySelectorAll('img');
            await Promise.all(
                Array.from(allImages).map(async (img) => {
                    if (img.src && !img.src.startsWith('data:')) {
                        const originalSrc = img.src;
                        const dataUrl = await toDataURL(originalSrc);
                        
                        return new Promise((resolve) => {
                            const tempImg = new window.Image();
                            tempImg.onload = () => {
                                img.src = dataUrl;
                                applyObjectFitFix(img, dataUrl);
                                resolve();
                            };
                            tempImg.onerror = () => {
                                img.src = dataUrl;
                                applyObjectFitFix(img, dataUrl);
                                resolve();
                            };
                            tempImg.src = dataUrl;
                        });
                    } else if (img.src && img.src.startsWith('data:')) {
                        applyObjectFitFix(img, img.src);
                    }
                })
            );

            // Fix vw units for Poetry/Shayari natively for 540px
            if (!isTextOnly) {
                const contentDiv = cardClone.querySelector('.blog-post-content');
                if (contentDiv) {
                    const innerFlex = Array.from(contentDiv.querySelectorAll('div')).find(el => String(el.style.zIndex) === '1' && String(el.style.display) === 'flex');
                    if (innerFlex) {
                        innerFlex.style.padding = '30px';
                    }

                    const quotes = Array.from(contentDiv.querySelectorAll('div')).filter(el => String(el.style.pointerEvents) === 'none');
                    quotes.forEach(quote => {
                        if (quote.textContent.includes('"')) {
                            quote.style.fontSize = '80px';
                            if (quote.style.top) quote.style.top = '10px';
                            if (quote.style.bottom) quote.style.bottom = '10px';
                            if (quote.style.left) quote.style.left = '10px';
                            if (quote.style.right) quote.style.right = '10px';
                        }
                    });
                    
                    const contentDisplay = contentDiv.querySelector('.blog-content-display');
                    if (contentDisplay) {
                        const newFontSize = displayBlog.displayMode === 'Poetry' ? '12px' : '16px';
                        contentDisplay.style.fontSize = newFontSize;
                        contentDisplay.querySelectorAll('*').forEach(el => {
                            el.style.fontSize = newFontSize;
                        });
                    }
                }
            } else {
                // Simple Text Post aesthetic match
                const contentDiv = cardClone.querySelector('.blog-post-content');
                if (contentDiv) {
                    const textContainer = contentDiv.querySelector('div') || contentDiv;
                    if (textContainer) {
                        textContainer.style.fontSize = '12px';
                        textContainer.style.lineHeight = '1.6';
                        textContainer.style.color = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)';
                        textContainer.style.textAlign = 'left';
                        textContainer.style.paddingLeft = '15px';
                        textContainer.style.borderLeft = '2px solid #e64980'; // Pink line
                        
                        // Add subtle aesthetic quotes
                        const quoteIcon = document.createElement('div');
                        quoteIcon.innerHTML = '”';
                        quoteIcon.style.position = 'absolute';
                        quoteIcon.style.top = '15px';
                        quoteIcon.style.right = '25px';
                        quoteIcon.style.fontSize = '60px';
                        quoteIcon.style.fontFamily = 'Georgia, serif';
                        quoteIcon.style.color = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
                        quoteIcon.style.zIndex = '0';
                        quoteIcon.style.pointerEvents = 'none';
                        quoteIcon.style.lineHeight = '1';
                        
                        cardClone.style.position = 'relative';
                        cardClone.appendChild(quoteIcon);
                    }
                }
            }

            // Style the card clone inside the wrapper
            cardClone.style.width = '100%';
            cardClone.style.maxWidth = 'none'; // Unset max-width
            cardClone.style.flex = '0 0 auto'; // Don't shrink or stretch vertically
            cardClone.style.display = 'flex';
            cardClone.style.flexDirection = 'column';
            cardClone.style.marginTop = 'auto'; // Center vertically if space allows
            cardClone.style.marginBottom = 'auto'; // Center vertically if space allows
            // Simple flat aesthetic
            cardClone.style.boxShadow = 'none';
            cardClone.style.borderRadius = '16px'; 
            cardClone.style.border = isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)';
            cardClone.style.overflow = 'visible'; // Allow content to show
            cardClone.style.transform = 'none';
            cardClone.style.margin = '0 auto';
            cardClone.style.padding = '30px'; // Standard internal padding

            if (isDarkMode) {
                cardClone.style.backgroundColor = '#121215'; // Very dark background like image
                cardClone.style.color = 'rgba(255, 255, 255, 0.9)';
            } else {
                cardClone.style.backgroundColor = '#ffffff';
                cardClone.style.color = '#1a1a1a';
            }

            // Add Branding / Footer
            const footer = document.createElement('div');
            footer.style.marginTop = '15px';
            footer.style.flexShrink = '0'; // Prevent footer compression
            footer.style.textAlign = 'center';
            footer.style.display = 'flex';
            footer.style.flexDirection = 'column';
            footer.style.alignItems = 'center';
            footer.style.gap = '5px';
            
            // Heart Icon
            const heartIcon = document.createElement('div');
            heartIcon.innerHTML = '♥';
            heartIcon.style.color = '#e64980'; // Pink heart
            heartIcon.style.fontSize = '10px';
            heartIcon.style.marginBottom = '2px';

            const brandName = document.createElement('div');
            brandName.style.color = '#e64980'; // Pink brand text
            brandName.style.fontSize = '12px';
            brandName.style.fontWeight = '800';
            brandName.style.letterSpacing = '5px';
            brandName.style.textTransform = 'uppercase';
            brandName.innerHTML = 'DIL KI BAAT';

            const dateInfo = document.createElement('div');
            dateInfo.style.color = isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
            dateInfo.style.fontSize = '9px';
            dateInfo.style.fontWeight = '500';
            dateInfo.style.letterSpacing = '1px';
            dateInfo.style.fontFamily = "'Inter', sans-serif";
            dateInfo.innerHTML = `- ${dayjs().format('DD MMM YYYY')} -`;

            footer.appendChild(heartIcon);
            footer.appendChild(brandName);
            footer.appendChild(dateInfo);

            wrapper.appendChild(cardClone);
            wrapper.appendChild(footer);
            document.body.appendChild(wrapper);

            // Fix for aspectRatio which html2canvas ignores, and make it auto-adjustable
            const elementsWithAspectRatio = wrapper.querySelectorAll('*');
            elementsWithAspectRatio.forEach(el => {
                if (el.style.aspectRatio && el.style.aspectRatio !== 'auto') {
                    const match = el.style.aspectRatio.match(/(\d+)\s*\/\s*(\d+)/);
                    if (match) {
                        const w = parseFloat(match[1]);
                        const h = parseFloat(match[2]);
                        const width = el.offsetWidth;
                        const expectedHeight = width * (h / w);
                        
                        // Set height to max of expected aspect ratio height or the actual scrollHeight to be auto-adjustable
                        const finalHeight = Math.max(expectedHeight, el.scrollHeight);
                        el.style.height = `${finalHeight}px`;
                        el.style.aspectRatio = 'auto';
                    }
                }
            });

            // Measure the actual height needed
            const actualHeight = wrapper.offsetHeight;

            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(wrapper, {
                backgroundColor: isDarkMode ? '#15151a' : '#f4f4f8',
                scale: 2, // High resolution (480px * 2 = 960px output)
                logging: true,
                useCORS: true,
                allowTaint: true,
                width: 480,
                windowWidth: 480,
                ignoreElements: (element) => element.classList.contains('no-export'),
            });

            // Remove wrapper from body
            document.body.removeChild(wrapper);

            // Convert to blob and download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `BlogApp-${(displayBlog.title || 'post').substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${dayjs().format('YYYYMMDD_HHmmss')}.png`;
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

    // Calculate reading time based on word count (avg 200 words per minute)
    const getReadingTime = (content) => {
        if (!content) return '< 1 min read';
        const text = content.replace(/<[^>]+>/g, '').trim();
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        const minutes = Math.ceil(wordCount / 200);
        return minutes < 1 ? '< 1 min read' : `${minutes} min read`;
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
                                <Group justify="space-between" wrap="nowrap" mb="sm" p={0}>
                                    <motion.div
                                        className="no-export"
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    >
                                        <UnstyledButton
                                            onClick={() => { if (user) navigate(`/profile/${displayBlog.author?.username}`); else navigate('/login'); }}
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
                                                    src={(!user || displayBlog.isAnonymous) ? null : displayBlog.author?.profilePic}
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
                                                    {(!user || displayBlog.isAnonymous) ? 'Anonymous' : getDisplayName(displayBlog.author)}
                                                </Text>
                                                <Text
                                                    size="xs"
                                                    c="dimmed"
                                                    style={{
                                                        fontSize: '11px',
                                                        marginTop: '2px'
                                                    }}
                                                >
                                                    {dayjs(displayBlog.createdAt).fromNow()} · {getReadingTime(displayBlog.content)}
                                                </Text>
                                            </div>
                                        </UnstyledButton>
                                    </motion.div>
                                    <Group gap="xs" wrap="nowrap">
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
                                                className="no-export"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                            >
                                                <Tooltip label="Message Author" position="bottom" withArrow zIndex={10000} withinPortal>
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
                                            className="no-export"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        >
                                            <Tooltip label={isBookmarked ? "Remove bookmark" : "Bookmark"} position="bottom" withArrow zIndex={10000} withinPortal>
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
                                <Group justify="space-between" wrap="nowrap" mb="sm" p={0}>
                                    <motion.div
                                        className="no-export"
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    >
                                        <UnstyledButton
                                            onClick={() => { if (user) navigate(`/profile/${displayBlog.author?.username}`); else navigate('/login'); }}
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
                                                    src={(!user || displayBlog.isAnonymous) ? null : displayBlog.author?.profilePic}
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
                                                    {(!user || displayBlog.isAnonymous) ? 'Anonymous' : getDisplayName(displayBlog.author)}
                                                </Text>
                                                <Text
                                                    size="xs"
                                                    c="dimmed"
                                                    style={{
                                                        fontSize: '11px',
                                                        marginTop: '2px'
                                                    }}
                                                >
                                                    {dayjs(displayBlog.createdAt).fromNow()} · {getReadingTime(displayBlog.content)}
                                                </Text>
                                            </div>
                                        </UnstyledButton>
                                    </motion.div>
                                    <Group gap="xs" wrap="nowrap">
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
                                                className="no-export"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                            >
                                                <Tooltip label="Message Author" position="bottom" withArrow zIndex={10000} withinPortal>
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
                                            className="no-export"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                        >
                                            <Tooltip label={isBookmarked ? "Remove bookmark" : "Bookmark"} position="bottom" withArrow zIndex={10000} withinPortal>
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
                                    <div style={{ 
                                        position: 'relative', 
                                        width: '100%', 
                                        borderRadius: '12px', 
                                        overflow: 'hidden',
                                        aspectRatio: '3/4',
                                        minHeight: '180px'
                                    }}>
                                        <img
                                            src={displayBlog.backgroundImage || "/paper-bg.png"}
                                            alt="Background"
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                width: '100%',
                                                height: '100%',
                                                display: 'block',
                                                objectFit: 'cover',
                                                objectPosition: 'center'
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: 'relative',
                                                zIndex: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 'clamp(0.3rem, 2vw, 1.2rem)',
                                                width: '100%',
                                                height: '100%',
                                                // Add a subtle gradient overlay for better text readability
                                                background: isDark 
                                                    ? 'radial-gradient(circle, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 100%)'
                                                    : 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 100%)',
                                                ...(displayBlog.displayMode === 'Poetry' ? {
                                                    fontFamily: "'Playfair Display', serif",
                                                    textAlign: 'justify',
                                                    whiteSpace: 'pre-line',
                                                    lineHeight: 1.2,
                                                    fontSize: 'clamp(0.45rem, 2.5vw, 0.85rem)',
                                                    textShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                    letterSpacing: '0.01em',
                                                } : {
                                                    fontFamily: "'Dancing Script', cursive",
                                                    textAlign: 'justify',
                                                    whiteSpace: 'pre-line',
                                                    lineHeight: 1.0,
                                                    fontSize: 'clamp(0.5rem, 2.8vw, 1.2rem)',
                                                    textShadow: '0 2px 3px rgba(255,255,255,0.8), 0 1px 1px rgba(0,0,0,0.1)',
                                                })
                                            }}
                                        >
                                            {displayBlog.displayMode === 'Shayari' && (
                                                <div style={{
                                                    fontFamily: 'serif',
                                                    fontSize: 'clamp(0.8rem, 4vw, 2.5rem)',
                                                    position: 'absolute',
                                                    top: '8px',
                                                    left: '5px',
                                                    color: 'rgba(74, 4, 4, 0.08)',
                                                    lineHeight: 1,
                                                    pointerEvents: 'none'
                                                }}>
                                                    "
                                                </div>
                                            )}

                                            <div
                                                dangerouslySetInnerHTML={{ __html: sanitizeHTML(displayBlog.content) }}
                                                className="blog-content-display"
                                                style={{
                                                    width: '100%',
                                                    maxWidth: '90%',
                                                    color: isDark ? 'rgba(255,255,255,0.9)' : '#2c3e50',
                                                    position: 'relative',
                                                    zIndex: 1,
                                                    margin: '0 auto',
                                                    textAlign: 'center'
                                                }}
                                            />

                                            {displayBlog.displayMode === 'Shayari' && (
                                                <div style={{
                                                    fontFamily: 'serif',
                                                    fontSize: 'clamp(0.8rem, 4vw, 2.5rem)',
                                                    position: 'absolute',
                                                    bottom: '8px',
                                                    right: '5px',
                                                    color: 'rgba(74, 4, 4, 0.08)',
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
                                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(displayBlog.content) }}
                                        style={{
                                            textAlign: 'justify',
                                            lineHeight: 1.6,
                                            fontSize: '16px'
                                        }}
                                    />
                                )}
                            </div>

                            {displayBlog.mediaUrl && (
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
                                    <img
                                        src={displayBlog.mediaUrl}
                                        alt="Post image"
                                        style={{
                                            maxWidth: '100%',
                                            height: 'auto',
                                            display: 'block',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                </div>
                            )}

                            {/* Clickable Tags */}
                            {displayBlog.tags && displayBlog.tags.length > 0 && (
                                <Group gap={6} mt="xs" wrap="wrap">
                                    {displayBlog.tags.map((tag, index) => (
                                        <Badge
                                            key={index}
                                            variant="light"
                                            color="blue"
                                            size="sm"
                                            radius="xl"
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                textTransform: 'lowercase',
                                            }}
                                            onClick={() => navigate(`/explore?search=${encodeURIComponent(tag)}`)}
                                        >
                                            #{tag}
                                        </Badge>
                                    ))}
                                </Group>
                            )}

                            {/* Actions - Enhanced with animations */}
                            <Group
                                className="no-export"
                                mt={(displayBlog.displayMode === 'Poetry' || displayBlog.displayMode === 'Shayari') ? 'sm' : 'md'}
                                gap="sm"
                                px={0}
                                style={{
                                    borderTop: '1px solid var(--mantine-color-gray-2)',
                                    paddingTop: '12px'
                                }}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <Menu shadow="md" width={200} trigger="hover" openDelay={100} closeDelay={400} position="top-start" withArrow withinPortal>
                                        <Menu.Target>
                                            <UnstyledButton
                                                onClick={() => handleLike()}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '8px 12px',
                                                    borderRadius: '12px',
                                                    transition: 'all 0.2s ease',
                                                    backgroundColor: isLiked ? (isDark ? 'rgba(230, 73, 128, 0.15)' : 'var(--mantine-color-pink-0)') : 'transparent',
                                                    color: userReaction ? `var(--mantine-color-${REACTIONS.find(r => r.value === userReaction)?.color}-6)` : (isLiked ? 'var(--mantine-color-pink-6)' : 'var(--mantine-color-gray-6)'),
                                                    border: isLiked ? `1px solid ${isDark ? 'rgba(230, 73, 128, 0.3)' : 'var(--mantine-color-pink-2)'}` : '1px solid transparent',
                                                    '&:hover': {
                                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'var(--mantine-color-gray-0)',
                                                    }
                                                }}
                                            >
                                                <motion.div
                                                    animate={{ scale: isLiked ? [1, 1.2, 1] : 1 }}
                                                    transition={{ duration: 0.3 }}
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, fontSize: 18 }}
                                                >
                                                    {userReaction ? (
                                                        REACTIONS.find(r => r.value === userReaction)?.icon
                                                    ) : (
                                                        <Heart fill={isLiked ? 'currentColor' : 'none'} size={20} />
                                                    )}
                                                </motion.div>
                                                <Text size="sm" fw={700}>{likes.length}</Text>
                                            </UnstyledButton>
                                        </Menu.Target>

                                        <Menu.Dropdown p="xs" style={{ borderRadius: '16px' }}>
                                            <Menu.Label>Empathy Reactions</Menu.Label>
                                            <Group gap="xs" p="xs">
                                                {REACTIONS.map((reaction) => (
                                                    <Tooltip key={reaction.value} label={reaction.label} position="top" withArrow>
                                                        <ActionIcon
                                                            variant={userReaction === reaction.value ? 'light' : 'subtle'}
                                                            color={reaction.color}
                                                            size="xl"
                                                            radius="md"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleLike(reaction.value);
                                                            }}
                                                            style={{
                                                                fontSize: '22px',
                                                                transition: 'transform 0.2s ease',
                                                                '&:hover': { transform: 'scale(1.2)' }
                                                            }}
                                                        >
                                                            {reaction.icon}
                                                        </ActionIcon>
                                                    </Tooltip>
                                                ))}
                                            </Group>
                                        </Menu.Dropdown>
                                    </Menu>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <Tooltip label="Comments" position="top" withArrow zIndex={10000} withinPortal>
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

                                {user && (
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    >
                                        <Tooltip label="Download as Image" position="top" withArrow zIndex={10000} withinPortal>
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
                                )}

                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <Tooltip label="Share Link" position="top" withArrow zIndex={10000} withinPortal>
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
                                            <Tooltip label="Edit post" position="top" withArrow zIndex={10000} withinPortal>
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
                                            <Tooltip label="Delete post" position="top" withArrow zIndex={10000} withinPortal>
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

                            <Collapse in={commentsOpen} className="no-export">
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
