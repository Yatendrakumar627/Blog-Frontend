import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
import {
    Container,
    Paper,
    Text,
    TextInput,
    ActionIcon,
    ScrollArea,
    Avatar,
    Group,
    Stack,
    Box,
    Center,
    Badge,
    Indicator,
    Tooltip,
    Button,
    Title,
    useComputedColorScheme,
    Popover,
    Modal,
    Menu,
    Alert,
    SimpleGrid,
    UnstyledButton,
    ThemeIcon,
    Skeleton,
    ColorInput
} from '@mantine/core';
import AppLoader from '../components/AppLoader';
import { useDisclosure } from '@mantine/hooks';
import { useMediaQuery } from '@mantine/hooks';
import { IconSend, IconMessage2, IconArrowLeft, IconSearch, IconCheck, IconChecks, IconDotsVertical, IconPhone, IconVideo, IconMoodSmile, IconTrash, IconArrowBackUp, IconX, IconMessageX, IconRestore, IconTrashOff, IconPalette, IconInfoCircle, IconAlertTriangle, IconDownload } from '@tabler/icons-react';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import { useSocket } from '../contexts/SocketContext';
import { notifications } from '@mantine/notifications';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Virtuoso } from 'react-virtuoso';
import { memo } from 'react';
import { formatDateLabel, isSameDay } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { generateThemeFromColor } from '../utils/themeUtils';
import { ReactionRain } from '../components/ReactionRain';
import { TypingIndicator } from '../components/TypingIndicator';


// Memoized Message Item for performance
const MessageItem = memo(({ message, isOwn, isDark, onDelete, onReply, onReaction, onImageClick, showAvatar }) => {
    const reactionsCount = message.reactions?.reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
    }, {}) || {};
    return (
        <Group
            align="flex-end"
            justify={isOwn ? 'flex-end' : 'flex-start'}
            gap="xs"
            mb={2}
            style={{ position: 'relative', padding: '0 10px' }}
            onMouseEnter={(e) => {
                const btn = e.currentTarget.querySelector('.delete-btn');
                if (btn) btn.style.opacity = 1;
            }}
            onMouseLeave={(e) => {
                const btn = e.currentTarget.querySelector('.delete-btn');
                if (btn) btn.style.opacity = 0;
            }}
        >
            {!isOwn && (
                <Box w={28}>
                    {showAvatar && (
                        <Indicator
                            inline
                            size={8}
                            offset={2}
                            position="bottom-end"
                            color="green"
                            withBorder
                            disabled={!message.sender?.isOnline}
                            processing={message.sender?.isOnline}
                        >
                            <Avatar src={message.sender?.profilePic} size={28} radius="xl">
                                {message.sender?.username?.[0]}
                            </Avatar>
                        </Indicator>
                    )}
                </Box>
            )}

            <Stack gap={2} align={isOwn ? 'flex-end' : 'flex-start'} maw="75%">
                <Group gap={4} align="center">
                    {isOwn && (
                        <Menu shadow="md" width={120} position="bottom-end" withinPortal>
                            <Menu.Target>
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    size="xs"
                                    style={{ opacity: 0, transition: 'opacity 0.2s ease' }}
                                    className="delete-btn"
                                >
                                    <IconDotsVertical size={14} />
                                </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Item
                                    leftSection={<IconArrowBackUp size={14} />}
                                    onClick={onReply}
                                >
                                    Reply
                                </Menu.Item>
                                <Menu.Item
                                    color="red"
                                    leftSection={<IconTrash size={14} />}
                                    onClick={onDelete}
                                >
                                    Delete
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    )}
                    <Box
                        py={8}
                        px={12}
                        style={{
                            borderRadius: isOwn ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                            backgroundColor: isOwn
                                ? 'var(--mantine-primary-color-filled)'
                                : (isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-white)'),
                            color: isOwn
                                ? 'var(--mantine-primary-color-contrast)'
                                : 'var(--mantine-color-text)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            minWidth: 100
                        }}
                    >
                        {message.replyTo && (
                            <Box
                                mb={4}
                                p={6}
                                style={{
                                    backgroundColor: isOwn ? 'rgba(0,0,0,0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${isOwn ? 'white' : 'var(--mantine-primary-color-filled)'}`
                                }}
                            >
                                <Text size="xs" fw={700} style={{ opacity: 0.9 }}>
                                    {message.replyTo.sender?._id === message.sender?._id ? 'You' : message.replyTo.sender?.username}
                                </Text>
                                <Text size="xs" lineClamp={1} style={{ opacity: 0.8 }}>
                                    {message.replyTo.text}
                                </Text>
                            </Box>
                        )}
                        {message.mediaUrl && (
                            <Box mb={4} style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden' }} onClick={() => onImageClick(message.mediaUrl)}>
                                <motion.img
                                    layoutId={message.mediaUrl}
                                    src={message.mediaUrl}
                                    alt="Shared media"
                                    style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
                                />
                            </Box>
                        )}
                        <Text size="sm" style={{ wordBreak: 'break-word' }}>
                            {message.text}
                        </Text>
                    </Box>
                    <Box style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {!isOwn && (
                            <Menu shadow="md" width={120} position="bottom-end" withinPortal>
                                <Menu.Target>
                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        size="xs"
                                        style={{ opacity: 0, transition: 'opacity 0.2s ease' }}
                                        className="delete-btn"
                                    >
                                        <IconDotsVertical size={14} />
                                    </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Item
                                        leftSection={<IconArrowBackUp size={14} />}
                                        onClick={onReply}
                                    >
                                        Reply
                                    </Menu.Item>
                                    <Menu.Item
                                        leftSection={<Text size="xs">❤️</Text>}
                                        onClick={() => onReaction('❤️')}
                                    >
                                        Love
                                    </Menu.Item>
                                    <Menu.Item
                                        leftSection={<Text size="xs">👍</Text>}
                                        onClick={() => onReaction('👍')}
                                    >
                                        Like
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        )}
                        {/* Reactions Display */}
                        {Object.entries(reactionsCount).length > 0 && (
                            <Group gap={4} wrap="nowrap">
                                {Object.entries(reactionsCount).map(([emoji, count]) => (
                                    <Badge
                                        key={emoji}
                                        size="xs"
                                        variant="light"
                                        color="gray"
                                        px={4}
                                        style={{ height: 18, cursor: 'pointer' }}
                                        onClick={() => onReaction(emoji)}
                                    >
                                        {emoji} {count > 1 ? count : ''}
                                    </Badge>
                                ))}
                            </Group>
                        )}
                    </Box>
                </Group>
                <Group gap={4}>
                    <Text size="10px" c="dimmed">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {isOwn && (
                        message.isPending ? (
                            <div style={{ width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    border: '2px solid rgba(255,255,255,0.5)',
                                    borderTopColor: 'white',
                                    animation: 'spin 1s linear infinite'
                                }} />
                            </div>
                        ) : (
                            <IconCheck size={12} style={{ opacity: 0.5 }} />
                        )
                    )}
                </Group>
            </Stack>
        </Group>
    );
});

const themes = {
    default: {
        name: 'Default',
        light: 'radial-gradient(circle at 0% 0%, rgba(250, 208, 196, 0.4) 0%, transparent 50%), radial-gradient(circle at 100% 0%, rgba(161, 196, 253, 0.4) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(255, 209, 255, 0.4) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(161, 196, 253, 0.1) 0%, transparent 50%)',
        dark: 'radial-gradient(circle at 0% 0%, rgba(255, 0, 153, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 0%, rgba(0, 212, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(73, 50, 64, 0.3) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(255, 0, 153, 0.05) 0%, transparent 50%)',
        bgLight: '#fdfbfb',
        bgDark: '#0f0c29'
    },
    love: {
        name: 'Love',
        light: 'radial-gradient(circle at 0% 0%, rgba(255, 182, 193, 0.6) 0%, transparent 50%), radial-gradient(circle at 100% 0%, rgba(255, 192, 203, 0.6) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(255, 228, 225, 0.6) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(255, 160, 122, 0.2) 0%, transparent 50%)',
        dark: 'radial-gradient(circle at 0% 0%, rgba(255, 20, 147, 0.2) 0%, transparent 50%), radial-gradient(circle at 100% 0%, rgba(255, 0, 50, 0.2) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(128, 0, 32, 0.4) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(219, 112, 147, 0.1) 0%, transparent 50%)',
        bgLight: '#fff0f5',
        bgDark: '#1a0505'
    },
    ocean: {
        name: 'Ocean',
        light: 'radial-gradient(circle at 0% 0%, rgba(179, 229, 252, 0.4) 0%, transparent 50%), radial-gradient(circle at 100% 0%, rgba(29, 233, 182, 0.2) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(41, 182, 246, 0.2) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(224, 247, 250, 0.5) 0%, transparent 50%)',
        dark: 'radial-gradient(circle at 0% 0%, rgba(1, 87, 155, 0.3) 0%, transparent 50%), radial-gradient(circle at 100% 0%, rgba(0, 77, 64, 0.3) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(0, 96, 100, 0.3) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(0, 0, 0, 0.2) 0%, transparent 50%)',
        bgLight: '#e0f7fa',
        bgDark: '#001e1e'
    },
    sunset: {
        name: 'Sunset',
        light: 'radial-gradient(circle at 0% 0%, rgba(255, 204, 128, 0.4) 0%, transparent 50%), radial-gradient(circle at 100% 0%, rgba(255, 171, 145, 0.4) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(239, 154, 154, 0.4) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(255, 224, 178, 0.4) 0%, transparent 50%)',
        dark: 'radial-gradient(circle at 0% 0%, rgba(230, 81, 0, 0.2) 0%, transparent 50%), radial-gradient(circle at 100% 0%, rgba(191, 54, 12, 0.2) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(136, 14, 79, 0.2) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(74, 20, 140, 0.2) 0%, transparent 50%)',
        bgLight: '#fff3e0',
        bgDark: '#1a0f00'
    },
    midnight: {
        name: 'Midnight',
        light: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.05) 0%, transparent 100%)',
        dark: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 100%)',
        bgLight: '#f5f5f5',
        bgDark: '#000000'
    }
};

const Chat = () => {
    const { user } = useAuthStore();
    const { socket, setUnreadCount } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [trashedConversations, setTrashedConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [pendingMessages, setPendingMessages] = useState(new Set());
    const [replyingTo, setReplyingTo] = useState(null);
    const inputRef = useRef(null);
    const virtuosoRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [trashLoading, setTrashLoading] = useState(false);
    const [showTrash, setShowTrash] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(max-width: 1024px)');
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
    const isDark = computedColorScheme === 'dark';

    // Advanced Visuals State
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [reactionBurst, setReactionBurst] = useState({ emoji: '', trigger: 0 });
    const [customColor, setCustomColor] = useState('#e64980');
    const [selectedImage, setSelectedImage] = useState(null); // For Shared Element Transition

    // Modal states
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
    const [deleteConvModalOpened, { open: openDeleteConvModal, close: closeDeleteConvModal }] = useDisclosure(false);
    const [themeModalOpened, { open: openThemeModal, close: closeThemeModal }] = useDisclosure(false);

    // Deletion targets
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [conversationToDelete, setConversationToDelete] = useState(null);

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prev => prev + emojiObject.native);
        setShowEmojiPicker(false);
        // Focus back to input
        inputRef.current?.focus();
    };

    // Instant input handler - single state update
    const handleInputChange = useCallback((e) => {
        setNewMessage(e.target.value);

        if (socket && activeConversation) {
            const recipient = activeConversation.participants.find(p => p._id !== user._id);
            socket.emit('typing', {
                conversationId: activeConversation._id,
                recipientId: recipient._id
            });

            // Stop typing after 2 seconds of inactivity
            if (window.typingTimeout) clearTimeout(window.typingTimeout);
            window.typingTimeout = setTimeout(() => {
                socket.emit('stop_typing', {
                    conversationId: activeConversation._id,
                    recipientId: recipient._id
                });
            }, 2000);
        }
    }, [socket, activeConversation, user]);

    // Helper functions that need to be defined before use
    const fetchConversations = async () => {
        try {
            const { data } = await api.get('/chat/conversations');
            // Filter out conversations where the other user is deleted or conversation is in trash
            const filteredConversations = data.filter(conv => {
                const otherUser = conv.participants.find(p => p._id !== user._id);
                const isUserDeleted = !otherUser || !otherUser.username;
                const isInTrash = conv.isDeleted && conv.isDeleted.some(deletion => deletion.user === user._id);
                return !isUserDeleted && !isInTrash; // Only include if user exists and not in trash
            });
            setConversations(filteredConversations);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            setLoading(false);
        }
    };

    const fetchTrashedConversations = async () => {
        try {
            setTrashLoading(true);
            const { data } = await api.get('/chat/trash');
            setTrashedConversations(data);
        } catch (error) {
            console.error('Error fetching trashed conversations:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to fetch trashed conversations',
                color: 'red'
            });
        } finally {
            setTrashLoading(false);
        }
    };

    const markAsReadLocal = async (conversationId) => {
        try {
            await api.put(`/chat/read/${conversationId}`);
            const { data } = await api.get('/chat/unread-count');
            setUnreadCount(data.count);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const { data } = await api.get(`/chat/messages/${conversationId}`);
            setMessages(data);
            // Scroll will happen automatically via Virtuoso followOutput or effect
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSelectConversation = (conv) => {
        setActiveConversation(conv);
        fetchMessages(conv._id);
        markAsReadLocal(conv._id);
    };

    const handleBackToList = () => {
        setActiveConversation(null);
    };

    // Scroll to bottom helper
    const scrollToBottom = () => {
        setTimeout(() => {
            virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, align: 'end' });
        }, 100);
    };

    // Instant conversation fetch - no debouncing
    const debouncedFetchConversations = useCallback(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Optimized socket event handler
    const handleNewMessage = useCallback((message) => {
        if (activeConversation && message.conversationId === activeConversation._id) {
            setMessages(prev => [...prev, message]);
            scrollToBottom();
            markAsReadLocal(activeConversation._id);
        }
        debouncedFetchConversations();
    }, [activeConversation, debouncedFetchConversations]);

    // Optimized send handler
    const handleSendMessage = useCallback(async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || isSending) return;

        const recipient = activeConversation.participants.find(p => p._id !== user._id);
        const messageText = newMessage.trim();
        const tempId = `temp-${Date.now()}-${Math.random()}`;

        // Optimistic UI update - show message immediately
        const tempMessage = {
            _id: tempId,
            text: messageText,
            sender: user,
            recipient,
            conversationId: activeConversation._id,
            replyTo: replyingTo?._id,
            createdAt: new Date().toISOString(),
            isPending: true
        };

        setMessages(prev => [...prev, tempMessage]);
        setNewMessage(''); // Clear input instantly
        setReplyingTo(null);
        setIsSending(true);
        setPendingMessages(prev => new Set(prev).add(tempId));
        scrollToBottom();

        try {
            const { data } = await api.post('/chat/message', {
                conversationId: activeConversation._id,
                recipientId: recipient._id,
                text: messageText,
                replyTo: replyingTo?._id
            });

            // Replace temp message with real one
            setMessages(prev => prev.map(msg =>
                msg._id === tempId ? data : msg
            ));
            setPendingMessages(prev => {
                const newSet = new Set(prev);
                newSet.delete(tempId);
                return newSet;
            });

            // Debounced conversation fetch
            debouncedFetchConversations();
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove temp message on error
            setMessages(prev => prev.filter(msg => msg._id !== tempId));
            setPendingMessages(prev => {
                const newSet = new Set(prev);
                newSet.delete(tempId);
                return newSet;
            });

            notifications.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to send message',
                color: 'red'
            });
        } finally {
            setIsSending(false);
            // Focus back to input
            inputRef.current?.focus();
        }
    }, [newMessage, activeConversation, isSending, user, replyingTo, debouncedFetchConversations]);

    useEffect(() => {
        if (user && socket) {
            socket.emit('join', user._id);
            fetchConversations();
            fetchTrashedConversations();
        }

        if (socket) {
            socket.on('new_message', handleNewMessage);

            socket.on('message_deleted', (messageId) => {
                setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
                fetchConversations(); // Update last message in sidebar potentially
            });

            socket.on('user_deleted', (deletedUserId) => {
                // Refresh conversations to remove deleted user conversations
                fetchConversations();
                fetchTrashedConversations();

                // If currently chatting with deleted user, clear the conversation
                if (activeConversation) {
                    const otherUser = activeConversation.participants.find(p => p._id !== user._id);
                    if (otherUser && otherUser._id === deletedUserId) {
                        setActiveConversation(null);
                        setMessages([]);
                        notifications.show({
                            title: 'User Deleted',
                            message: 'The user you were chatting with has deleted their account.',
                            color: 'orange',
                            zIndex: 9999
                        });
                    }
                }
            });

            socket.on('conversation_moved_to_trash', (data) => {
                fetchConversations();
                fetchTrashedConversations();
            });

            socket.on('conversation_restored', (data) => {
                fetchConversations();
                fetchTrashedConversations();
            });

            socket.on('message_in_trashed_chat', (data) => {
                // Show notification for message in trashed conversation
                notifications.show({
                    title: `New message from ${data.sender.displayName || data.sender.username}`,
                    message: `"${data.text}" - This conversation is in trash. Restore to reply.`,
                    color: 'orange',
                    autoClose: 8000,
                    actions: [
                        {
                            label: 'Restore Chat',
                            onClick: () => {
                                restoreConversation(data.conversationId);
                                // Switch to chats view and select the restored conversation
                                setShowTrash(false);
                                // Fetch updated conversations and then select the restored one
                                setTimeout(() => {
                                    fetchConversations();
                                }, 500);
                            }
                        }
                    ]
                });

                // Refresh trash list to show new message indicator
                fetchTrashedConversations();
            });

            return () => {
                socket.off('new_message');
                socket.off('message_deleted');
                socket.off('user_deleted');
                socket.off('conversation_moved_to_trash');
                socket.off('conversation_restored');
                socket.off('conversation_permanently_deleted');
                socket.off('message_in_trashed_chat');
                socket.off('message_in_trashed_chat');
                socket.off('conversation_theme_updated');
                socket.off('user_online');
                socket.off('user_offline');
            };
        }
    }, [user, socket, activeConversation]);

    useEffect(() => {
        if (socket) {
            socket.on('conversation_theme_updated', ({ conversationId, theme }) => {
                if (activeConversation && activeConversation._id === conversationId) {
                    setActiveConversation(prev => ({ ...prev, theme }));
                    notifications.show({
                        title: 'Theme Updated',
                        message: `Chat theme changed to ${theme}`,
                        color: 'blue'
                    });
                }
                // Update in list
                setConversations(prev => prev.map(c =>
                    c._id === conversationId ? { ...c, theme } : c
                ));
            });

            // Listen for online status updates
            socket.on('user_online', ({ userId }) => {
                setConversations(prev => prev.map(conv => ({
                    ...conv,
                    participants: conv.participants.map(participant =>
                        participant._id === userId ? { ...participant, isOnline: true, lastSeen: null } : participant
                    )
                })));

                // Update active conversation if the user is a participant
                setActiveConversation(prev => {
                    if (!prev) return prev;
                    const isParticipant = prev.participants.some(p => p._id === userId);
                    if (!isParticipant) return prev;
                    return {
                        ...prev,
                        participants: prev.participants.map(p =>
                            p._id === userId ? { ...p, isOnline: true, lastSeen: null } : p
                        )
                    };
                });
            });

            socket.on('user_offline', ({ userId, lastSeen }) => {
                setConversations(prev => prev.map(conv => ({
                    ...conv,
                    participants: conv.participants.map(participant =>
                        participant._id === userId ? { ...participant, isOnline: false, lastSeen: lastSeen || new Date() } : participant
                    )
                })));

                // Update active conversation if the user is a participant
                setActiveConversation(prev => {
                    if (!prev) return prev;
                    const isParticipant = prev.participants.some(p => p._id === userId);
                    if (!isParticipant) return prev;
                    return {
                        ...prev,
                        participants: prev.participants.map(p =>
                            p._id === userId ? { ...p, isOnline: false, lastSeen: lastSeen || new Date() } : p
                        )
                    };
                });
            });
            socket.on('message_reaction', ({ messageId, reactions, emoji }) => {
                setMessages(prev => prev.map(msg =>
                    msg._id === messageId ? { ...msg, reactions } : msg
                ));
                if (emoji === '❤️') {
                    setReactionBurst({ emoji, trigger: Date.now() });
                }
            });

            socket.on('user_typing', ({ conversationId, userId }) => {
                if (activeConversation && activeConversation._id === conversationId) {
                    setTypingUsers(prev => new Set(prev).add(userId));
                }
            });

            socket.on('user_stop_typing', ({ conversationId, userId }) => {
                setTypingUsers(prev => {
                    const next = new Set(prev);
                    next.delete(userId);
                    return next;
                });
            });

            return () => {
                socket.off('new_message');
                socket.off('message_deleted');
                socket.off('user_deleted');
                socket.off('conversation_moved_to_trash');
                socket.off('conversation_restored');
                socket.off('conversation_permanently_deleted');
                socket.off('message_in_trashed_chat');
                socket.off('conversation_theme_updated');
                socket.off('user_online');
                socket.off('user_offline');
                socket.off('message_reaction');
                socket.off('user_typing');
                socket.off('user_stop_typing');
            };
        }
    }, [user, socket, activeConversation]);

    const handleReaction = async (messageId, emoji) => {
        try {
            await api.post('/chat/reaction', { messageId, emoji });
        } catch (error) {
            console.error('Error toggling reaction:', error);
        }
    };

    const promptDeleteMessage = (messageId) => {
        setMessageToDelete(messageId);
        openDeleteModal();
    };

    const confirmDeleteMessage = async () => {
        if (!messageToDelete) return;

        try {
            await api.delete(`/chat/message/${messageToDelete}`);
            setMessages((prev) => prev.filter((msg) => msg._id !== messageToDelete));
            fetchConversations();
            closeDeleteModal();
            notifications.show({
                title: 'Success',
                message: 'Message deleted',
                color: 'green'
            });
        } catch (error) {
            console.error('Error deleting message:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to delete message',
                color: 'red'
            });
        }
    };

    const promptDeleteConversation = (conversation) => {
        setConversationToDelete(conversation);
        openDeleteConvModal();
    };

    const confirmDeleteConversation = async () => {
        if (!conversationToDelete) return;

        try {
            const response = await api.delete(`/chat/conversation/${conversationToDelete._id}`);

            // Clear active conversation if it's the one being deleted
            if (activeConversation?._id === conversationToDelete._id) {
                setActiveConversation(null);
                setMessages([]);
            }

            fetchConversations();
            closeDeleteConvModal();
            notifications.show({
                title: 'Moved to Trash',
                message: `Conversation will be permanently deleted on ${new Date(response.data.willBePermanentlyDeleted).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`,
                color: 'orange',
                zIndex: 9999,
                autoClose: 8000
            });
        } catch (error) {
            console.error('Error deleting conversation:', error);
            notifications.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to delete conversation',
                color: 'red'
            });
        }
    };

    const permanentDeleteConversation = async (conversationId) => {
        try {
            await api.delete(`/chat/permanent-delete/${conversationId}`);

            // Remove from trashed conversations list
            setTrashedConversations((prev) => prev.filter((conv) => conv._id !== conversationId));

            // Clear active conversation if it's the one being deleted
            if (activeConversation?._id === conversationId) {
                setActiveConversation(null);
                setMessages([]);
            }

            notifications.show({
                title: 'Deleted Forever',
                message: 'Conversation has been permanently deleted',
                color: 'green',
                zIndex: 9999
            });
        } catch (error) {
            console.error('Error permanently deleting conversation:', error);
            notifications.show({
                title: 'Error',
                message: error.response?.data?.message || 'Failed to permanently delete conversation',
                color: 'red'
            });
        }
    };

    const handleDownloadChat = async (format = 'doc') => {
        if (!activeConversation) return;

        try {
            const response = await api.get(`/chat/download/${activeConversation._id}?format=${format}`, {
                responseType: 'blob'
            });

            // Create filename
            const otherUser = activeConversation.participants.find(p => p._id !== user._id);
            const userName = otherUser?.displayName || otherUser?.username || 'unknown';
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `chat_${userName}_${timestamp}.${format}`;

            // Handle blob response for all formats
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            notifications.show({
                title: 'Download Started',
                message: `Chat exported as ${format.toUpperCase()} format`,
                color: 'green'
            });
        } catch (error) {
            console.error('Error downloading chat:', error);
            notifications.show({
                title: 'Download Failed',
                message: error.response?.data?.message || 'Failed to download chat',
                color: 'red'
            });
        }
    };

    const handleReplyMessage = (message) => {
        setReplyingTo(message);
        inputRef.current?.focus();
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const restoreConversation = async (conversationId) => {
        try {
            await api.put(`/chat/restore/${conversationId}`);
            fetchConversations();
            fetchTrashedConversations();
            notifications.show({
                title: 'Restored',
                message: 'Conversation has been restored to your chats',
                color: 'green'
            });
        } catch (error) {
            console.error('Error restoring conversation:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to restore conversation',
                color: 'red'
            });
        }
    };

    const handleUpdateTheme = async (theme) => {
        try {
            let themeToSave = theme;
            if (theme === 'custom') {
                themeToSave = `custom:${customColor}`;
            }

            await api.put(`/chat/theme/${activeConversation._id}`, { theme: themeToSave });
            setActiveConversation(prev => ({ ...prev, theme: themeToSave }));
            closeThemeModal();
            notifications.show({
                title: 'Theme Saved',
                message: 'Your chat theme preference has been updated',
                color: 'green'
            });
        } catch (error) {
            console.error('Error updating theme:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to update chat theme',
                color: 'red'
            });
        }
    };

    if (loading) {
        return (
            <Container
                fluid
                px={0}
                h="calc(100dvh - 160px)"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                <Paper
                    shadow="sm"
                    radius={{ base: 0, md: 'md' }}
                    withBorder={!isMobile}
                    style={{
                        display: 'flex',
                        height: '100%',
                        overflow: 'hidden',
                        backgroundColor: 'var(--mantine-color-body)',
                        borderColor: isDark ? 'var(--mantine-color-gray-7)' : 'var(--mantine-color-gray-3)',
                        flexDirection: isMobile ? 'column' : 'row'
                    }}
                >
                    {/* Skeleton Sidebar */}
                    <Box
                        w={{ base: '100%', sm: 300, md: 350 }}
                        style={{
                            display: isMobile ? 'flex' : 'flex',
                            flexDirection: 'column',
                            borderRight: isMobile ? 'none' : '1px solid var(--mantine-color-default-border)',
                            backgroundColor: isDark ? 'var(--mantine-color-dark-7)' : 'white',
                            order: isMobile ? 2 : 1,
                            height: '100%'
                        }}
                    >
                        <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                            <Group justify="space-between" mb="sm">
                                <Skeleton height={28} width={100} radius="sm" />
                                <Skeleton height={28} width={28} circle />
                            </Group>
                            <Skeleton height={36} radius="xl" />
                        </Box>
                        <Stack gap={0} p={0}>
                            {[...Array(8)].map((_, i) => (
                                <Box key={i} p="md" style={{ borderBottom: `1px solid ${isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)'}` }}>
                                    <Group wrap="nowrap">
                                        <Skeleton height={48} width={48} circle />
                                        <Stack gap={6} style={{ flex: 1 }}>
                                            <Group justify="space-between">
                                                <Skeleton height={14} width="40%" radius="xl" />
                                                <Skeleton height={10} width={40} radius="xl" />
                                            </Group>
                                            <Skeleton height={10} width="70%" radius="xl" />
                                        </Stack>
                                    </Group>
                                </Box>
                            ))}
                        </Stack>
                    </Box>

                    {/* Skeleton Chat Area - Hidden on mobile if checking list */}
                    <Box
                        style={{
                            flex: 1,
                            display: isMobile ? 'none' : 'flex',
                            flexDirection: 'column',
                            backgroundColor: isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)',
                            order: isMobile ? 1 : 2,
                            height: '100%'
                        }}
                    >
                        <Paper p="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)', backgroundColor: isDark ? 'var(--mantine-color-dark-7)' : 'white' }}>
                            <Group justify="space-between">
                                <Group>
                                    <Skeleton height={40} width={40} circle />
                                    <Stack gap={4}>
                                        <Skeleton height={14} width={120} radius="xl" />
                                        <Skeleton height={10} width={60} radius="xl" />
                                    </Stack>
                                </Group>
                            </Group>
                        </Paper>
                        <Stack p="md" gap="lg" style={{ flex: 1 }}>
                            {[...Array(5)].map((_, i) => (
                                <Group key={i} justify={i % 2 === 0 ? 'flex-start' : 'flex-end'} w="100%">
                                    <Skeleton height={40} width={i % 2 === 0 ? "40%" : "30%"} radius="md" />
                                </Group>
                            ))}
                        </Stack>
                        <Box p="md" style={{ backgroundColor: isDark ? 'var(--mantine-color-dark-7)' : 'white' }}>
                            <Skeleton height={42} radius="xl" />
                        </Box>
                    </Box>
                </Paper>
            </Container>
        );
    }

    // Add CSS for spinning animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    if (!document.head.querySelector('style[data-chat-spin]')) {
        style.setAttribute('data-chat-spin', 'true');
        document.head.appendChild(style);
    }

    return (
        <Container
            fluid
            px={0}
            h="calc(100dvh - 160px)"
            style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            <ReactionRain emoji={reactionBurst.emoji} trigger={reactionBurst.trigger} />
            <Modal
                opened={deleteModalOpened}
                onClose={closeDeleteModal}
                title="Delete Message"
                centered
                overlayProps={{
                    backgroundOpacity: 0.55,
                }}
            >
                <Stack>
                    <Text size="sm">Are you sure you want to delete this message? This action cannot be undone.</Text>
                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeDeleteModal}>Cancel</Button>
                        <Button color="red" onClick={confirmDeleteMessage}>Delete</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Delete Conversation Confirmation Modal */}
            <Modal
                opened={deleteConvModalOpened}
                onClose={closeDeleteConvModal}
                title="Move to Trash"
                centered
                overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 3,
                }}
            >
                <Stack gap="md">
                    <Group align="flex-start" wrap="nowrap">
                        <ThemeIcon size={40} radius="md" color="orange" variant="light">
                            <IconTrash size={22} />
                        </ThemeIcon>
                        <Stack gap={2}>
                            <Text size="lg" fw={700}>Move to Trash?</Text>
                            <Text size="sm" c="dimmed" lh={1.4}>
                                This conversation will be moved to the trash and hidden from your main chat list.
                            </Text>
                        </Stack>
                    </Group>

                    <Alert variant="light" color="orange" title="Auto-Deletion" icon={<IconInfoCircle size={16} />}>
                        Items in trash are permanently deleted after <Text span fw={700}>7 days</Text>. You can restore them anytime before then.
                    </Alert>

                    <Group justify="flex-end" mt="xs">
                        <Button variant="default" onClick={closeDeleteConvModal}>Cancel</Button>
                        <Button
                            color="red"
                            variant="filled"
                            onClick={confirmDeleteConversation}
                            leftSection={<IconTrash size={16} />}
                        >
                            Move to Trash
                        </Button>
                    </Group>
                </Stack>
            </Modal>


            {/* Theme Selector Modal */}
            <Modal
                opened={themeModalOpened}
                onClose={closeThemeModal}
                title="Choose Theme"
                centered
            >
                <Stack gap="md">
                    <SimpleGrid cols={3} spacing="md">
                        {Object.entries(themes).map(([key, theme]) => (
                            <UnstyledButton
                                key={key}
                                onClick={() => handleUpdateTheme(key)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 8
                                }}
                            >
                                <Box
                                    w={60}
                                    h={60}
                                    style={{
                                        borderRadius: '50%',
                                        background: isDark ? theme.bgDark : theme.bgLight,
                                        backgroundImage: isDark ? theme.dark : theme.light,
                                        border: activeConversation?.theme === key || (!activeConversation?.theme && key === 'default')
                                            ? `3px solid var(--mantine-primary-color-filled)`
                                            : '1px solid var(--mantine-color-default-border)',
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Text size="xs" fw={500}>{theme.name}</Text>
                            </UnstyledButton>
                        ))}
                    </SimpleGrid>

                    <Box p="sm" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
                        <Text size="sm" fw={600} mb="xs">Custom Theme</Text>
                        <Group align="flex-end">
                            <ColorInput
                                label="Pick a color"
                                placeholder="Pick color"
                                value={customColor}
                                onChange={setCustomColor}
                                format="hex"
                                swatches={['#25262b', '#868e96', '#fa5252', '#e64980', '#be4bdb', '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886', '#40c057', '#82c91e', '#fab005', '#fd7e14']}
                                style={{ flex: 1 }}
                            />
                            <Button
                                onClick={() => {
                                    const theme = generateThemeFromColor(customColor);
                                    // We'll store the color in the theme field as "custom:HEX"
                                    handleUpdateTheme(`custom:${customColor}`);
                                }}
                            >
                                Apply
                            </Button>
                        </Group>
                    </Box>
                </Stack>
            </Modal>

            <Paper
                shadow="sm"
                radius={{ base: 0, md: 'md' }}
                withBorder={!isMobile}
                style={{
                    display: 'flex',
                    height: '100%',
                    overflow: 'hidden',
                    backgroundColor: 'var(--mantine-color-body)',
                    borderColor: isDark ? 'var(--mantine-color-gray-7)' : 'var(--mantine-color-gray-3)',
                    flexDirection: isMobile ? 'column' : 'row'
                }}
            >
                {/* --- LEFT SIDEBAR (CONVERSATIONS) --- */}
                <Box
                    w={{ base: '100%', sm: 300, md: 350 }}
                    style={{
                        display: isMobile && activeConversation ? 'none' : 'flex',
                        flexDirection: 'column',
                        borderRight: isMobile ? 'none' : '1px solid var(--mantine-color-default-border)',
                        borderBottom: isMobile && activeConversation ? 'none' : '1px solid var(--mantine-color-default-border)',
                        backgroundColor: isDark ? 'var(--mantine-color-dark-7)' : 'white',
                        order: isMobile ? 2 : 1,
                        height: '100%' // Fill the available space
                    }}
                >
                    {/* Sidebar Header */}
                    <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                        <Group justify="space-between" mb="sm" wrap="nowrap">
                            <Group gap="xs">
                                {showTrash && (
                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        onClick={() => setShowTrash(false)}
                                        size="lg"
                                    >
                                        <IconArrowLeft size={20} />
                                    </ActionIcon>
                                )}
                                <Stack gap={0}>
                                    <Text fw={700} size="lg" lh={1.2}>
                                        {showTrash ? 'Trash' : 'Chats'}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {showTrash
                                            ? `${trashedConversations.length} conversation${trashedConversations.length !== 1 ? 's' : ''}`
                                            : 'Recent conversations'
                                        }
                                    </Text>
                                </Stack>
                            </Group>

                            {!showTrash && (
                                <Tooltip label="View Trash">
                                    <ActionIcon
                                        variant="subtle"
                                        color={trashedConversations.length > 0 ? "orange" : "gray"}
                                        onClick={() => setShowTrash(true)}
                                        size="lg"
                                    >
                                        <IconTrash size={20} />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </Group>

                        <TextInput
                            placeholder={showTrash ? 'Search trash...' : 'Search messages...'}
                            leftSection={<IconSearch size={16} />}
                            variant="filled"
                            radius="xl"
                            styles={{
                                input: {
                                    backgroundColor: isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)',
                                    border: 'none'
                                }
                            }}
                        />
                    </Box>

                    {/* Conversation List */}
                    <ScrollArea style={{ flex: 1 }}>
                        <Stack gap={0}>
                            {showTrash ? (
                                // Trashed Conversations
                                trashLoading ? (
                                    <Center py={40}>
                                        <Stack align="center" gap="xs">
                                            <AppLoader size="sm" />
                                            <Text size="sm" c="dimmed">Loading trash...</Text>
                                        </Stack>
                                    </Center>
                                ) : trashedConversations.length === 0 ? (
                                    <Center py={60} px="lg">
                                        <Stack align="center" gap="md">
                                            <ThemeIcon size={60} radius="xl" color="gray" variant="light" style={{ opacity: 0.5 }}>
                                                <IconTrashOff size={32} />
                                            </ThemeIcon>
                                            <Stack gap={4} align="center">
                                                <Text size="md" fw={600} ta="center">Trash is Empty</Text>
                                                <Text size="sm" c="dimmed" ta="center" lh={1.4}>
                                                    Conversations you delete will appear here. They are automatically removed after 7 days.
                                                </Text>
                                            </Stack>
                                        </Stack>
                                    </Center>
                                ) : (
                                    trashedConversations.map((conv) => {
                                        const otherUser = conv.participants.find(p => p._id !== user._id);
                                        const deletionInfo = conv.isDeleted.find(d => d.user === user._id);
                                        const daysUntilDeletion = deletionInfo ?
                                            Math.max(0, 7 - Math.floor((Date.now() - new Date(deletionInfo.deletedAt)) / (1000 * 60 * 60 * 24)))
                                            : 0;

                                        return (
                                            <Box
                                                key={conv._id}
                                                p={{ base: 'sm', md: 'md' }}
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: isDark ? 'rgba(255, 107, 107, 0.08)' : 'rgba(255, 107, 107, 0.04)',
                                                    borderLeft: '4px solid #fa5252',
                                                    transition: 'all 0.2s',
                                                    minHeight: isMobile ? '60px' : 'auto',
                                                    borderBottom: `1px solid ${isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)'}`
                                                }}
                                                sx={(theme) => ({
                                                    '&:hover': {
                                                        backgroundColor: isDark ? 'rgba(255, 107, 107, 0.15)' : 'rgba(255, 107, 107, 0.1)'
                                                    }
                                                })}
                                            >
                                                <Group wrap="nowrap" justify="space-between" gap="sm">
                                                    <Group wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                                        <Indicator
                                                            inline
                                                            size={isMobile ? 8 : 12}
                                                            offset={4}
                                                            position="bottom-end"
                                                            color="orange"
                                                            withBorder
                                                            disabled={!conv.hasNewMessages}
                                                        >
                                                            <Avatar
                                                                src={otherUser?.profilePic}
                                                                radius="xl"
                                                                size={isMobile ? 'md' : 'lg'}
                                                                color="gray"
                                                            >
                                                                {otherUser?.displayName?.[0] || otherUser?.username?.[0]?.toUpperCase()}
                                                            </Avatar>
                                                        </Indicator>

                                                        <Box style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                                            <Group justify="space-between" align="center" mb={2} wrap="nowrap">
                                                                <Group gap="xs" style={{ minWidth: 0 }}>
                                                                    <Text
                                                                        fw={600}
                                                                        size={isMobile ? 'xs' : 'sm'}
                                                                        truncate
                                                                        c="dimmed"
                                                                        style={{ minWidth: 0 }}
                                                                    >
                                                                        {otherUser?.displayName || otherUser?.username}
                                                                    </Text>
                                                                    {conv.hasNewMessages && (
                                                                        <Badge size="xs" color="orange" variant="filled">New</Badge>
                                                                    )}
                                                                </Group>
                                                                {!isMobile && (
                                                                    <Text size="xs" c="orange" style={{ whiteSpace: 'nowrap' }}>
                                                                        {daysUntilDeletion === 0 ? 'Expires today' : `${daysUntilDeletion} days left`}
                                                                    </Text>
                                                                )}
                                                            </Group>
                                                            <Text size="xs" c="dimmed" truncate lineClamp={1}>
                                                                {conv.lastMessage?.text
                                                                    ? `${conv.lastMessage.sender?.displayName || conv.lastMessage.sender?.username || 'Someone'}: ${conv.lastMessage.text}`
                                                                    : conv.hasNewMessages
                                                                        ? 'New message received'
                                                                        : `Moved to trash ${deletionInfo ? new Date(deletionInfo.deletedAt).toLocaleDateString() : 'recently'}`}
                                                            </Text>
                                                        </Box>
                                                    </Group>

                                                    <Menu shadow="md" width={140} position="bottom-end" withinPortal>
                                                        <Menu.Target>
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color="gray"
                                                                size="sm"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <IconDotsVertical size={16} />
                                                            </ActionIcon>
                                                        </Menu.Target>
                                                        <Menu.Dropdown>
                                                            <Menu.Item
                                                                leftSection={<IconRestore size={14} />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    restoreConversation(conv._id);
                                                                }}
                                                            >
                                                                Restore
                                                            </Menu.Item>
                                                            <Menu.Item
                                                                color="red"
                                                                leftSection={<IconTrash size={14} />}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    permanentDeleteConversation(conv._id);
                                                                }}
                                                            >
                                                                Delete Forever
                                                            </Menu.Item>
                                                        </Menu.Dropdown>
                                                    </Menu>
                                                </Group>
                                            </Box>
                                        );
                                    })
                                )
                            ) : (
                                // Normal Conversations
                                conversations.length === 0 ? (
                                    <Center py="xl" c="dimmed">
                                        <Stack align="center" gap="xs">
                                            <IconMessage2 size={32} style={{ opacity: 0.5 }} />
                                            <Text size="sm">No conversations yet</Text>
                                        </Stack>
                                    </Center>
                                ) : (
                                    conversations.map((conv) => {
                                        const otherUser = conv.participants.find(p => p._id !== user._id);
                                        const isActive = activeConversation?._id === conv._id;
                                        const isUserDeleted = !otherUser || !otherUser.username;

                                        return (
                                            <Box
                                                key={conv._id}
                                                p="md"
                                                onClick={() => !isUserDeleted && handleSelectConversation(conv)}
                                                style={{
                                                    cursor: isUserDeleted ? 'not-allowed' : 'pointer',
                                                    backgroundColor: isActive
                                                        ? (isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-pink-light)')
                                                        : 'transparent',
                                                    borderLeft: isActive ? '4px solid var(--mantine-color-pink-filled)' : '4px solid transparent',
                                                    transition: 'background-color 0.2s',
                                                    opacity: isUserDeleted ? 0.6 : 1
                                                }}
                                                sx={(theme) => ({
                                                    '&:hover': {
                                                        backgroundColor: isUserDeleted
                                                            ? 'transparent'
                                                            : isActive
                                                                ? (isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-pink-light)')
                                                                : theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0]
                                                    }
                                                })}
                                            >
                                                <Group wrap="nowrap" justify="space-between">
                                                    <Group wrap="nowrap" style={{ flex: 1 }}>
                                                        <Indicator
                                                            inline
                                                            size={12}
                                                            offset={4}
                                                            position="bottom-end"
                                                            color={otherUser?.isOnline ? "green" : "gray"}
                                                            withBorder={otherUser?.isOnline}
                                                            disabled={!otherUser?.isOnline}
                                                            processing={otherUser?.isOnline}
                                                        >
                                                            <Avatar
                                                                src={isUserDeleted ? null : otherUser?.profilePic}
                                                                radius="xl"
                                                                size="lg"
                                                                color="gray"
                                                            >
                                                                {isUserDeleted ? '?' : (otherUser?.displayName?.[0] || otherUser?.username?.[0]?.toUpperCase())}
                                                            </Avatar>
                                                        </Indicator>

                                                        <Box style={{ flex: 1, overflow: 'hidden' }}>
                                                            <Group justify="space-between" align="center" mb={2}>
                                                                <Text fw={600} size="sm" c={isUserDeleted ? 'dimmed' : undefined}>
                                                                    {isUserDeleted ? 'Deleted User' : (otherUser?.displayName || otherUser?.username)}
                                                                </Text>
                                                                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                                                    {conv.lastMessage?.createdAt && new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </Text>
                                                            </Group>
                                                            <Text size="xs" c="dimmed" truncate lineClamp={1}>
                                                                {isUserDeleted
                                                                    ? 'This conversation is no longer available'
                                                                    : (conv.lastMessage?.sender === user._id ? 'You: ' : '') +
                                                                    (conv.lastMessage?.text || 'No messages')
                                                                }
                                                            </Text>
                                                        </Box>
                                                    </Group>

                                                    {!isUserDeleted && (
                                                        <Menu shadow="md" width={140} position="bottom-end" withinPortal>
                                                            <Menu.Target>
                                                                <ActionIcon
                                                                    variant="subtle"
                                                                    color="gray"
                                                                    size="sm"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <IconDotsVertical size={16} />
                                                                </ActionIcon>
                                                            </Menu.Target>
                                                            <Menu.Dropdown>
                                                                <Menu.Item
                                                                    color="red"
                                                                    leftSection={<IconMessageX size={14} />}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        promptDeleteConversation(conv);
                                                                    }}
                                                                >
                                                                    Delete Chat
                                                                </Menu.Item>
                                                            </Menu.Dropdown>
                                                        </Menu>
                                                    )}
                                                </Group>
                                            </Box>
                                        );
                                    })
                                )
                            )}
                        </Stack>
                    </ScrollArea>
                </Box>

                {/* --- RIGHT MAIN CHAT AREA --- */}
                <Box
                    style={{
                        flex: 1,
                        display: isMobile && !activeConversation ? 'none' : 'flex',
                        flexDirection: 'column',
                        backgroundColor: isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)',
                        order: isMobile ? 1 : 2,
                        height: '100%', // Fill the available space
                        overflow: 'hidden' // Prevent entire container from scrolling
                    }}
                >
                    {activeConversation ? (
                        (() => {
                            const otherUser = activeConversation.participants.find(p => p._id !== user._id);
                            const isUserDeleted = !otherUser || !otherUser.username;
                            const isMessagingDisabled = isUserDeleted || otherUser?.privacySettings?.allowMessages === false;

                            if (isUserDeleted) {
                                return (
                                    <>
                                        {/* Chat Header for Deleted User */}
                                        <Paper
                                            p={{ base: 'xs', md: 'sm' }}
                                            radius={0}
                                            style={{
                                                borderBottom: '1px solid var(--mantine-color-default-border)',
                                                zIndex: 10,
                                                backgroundColor: isDark ? 'var(--mantine-color-dark-7)' : 'white',
                                                flexShrink: 0 // Prevent header from shrinking
                                            }}
                                        >
                                            <Group justify="space-between">
                                                <Group gap="sm">
                                                    {isMobile && (
                                                        <ActionIcon variant="subtle" color="gray" onClick={handleBackToList}>
                                                            <IconArrowLeft size={20} />
                                                        </ActionIcon>
                                                    )}
                                                    <Avatar radius="xl" size="lg" color="gray">
                                                        ?
                                                    </Avatar>
                                                    <Stack gap={0}>
                                                        <Text fw={600} size="sm" c="dimmed" style={{ lineHeight: 1.2 }}>
                                                            Deleted User
                                                        </Text>
                                                        <Text size="xs" c="red" fw={500}>Account Deleted</Text>
                                                    </Stack>
                                                </Group>

                                                <Group gap="xs">
                                                    <ActionIcon variant="subtle" color="gray" disabled>
                                                        <IconPhone size={20} />
                                                    </ActionIcon>
                                                    <ActionIcon variant="subtle" color="gray" disabled>
                                                        <IconVideo size={20} />
                                                    </ActionIcon>
                                                    <ActionIcon variant="subtle" color="gray">
                                                        <IconDotsVertical size={20} />
                                                    </ActionIcon>
                                                </Group>
                                            </Group>
                                        </Paper>

                                        {/* Deleted User Message Area */}
                                        <Box
                                            flex={1}
                                            p={{ base: 'sm', md: 'md' }}
                                            style={{
                                                backgroundColor: isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)',
                                                backgroundImage: `radial-gradient(${isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-3)'} 1px, transparent 1px)`,
                                                backgroundSize: '20px 20px',
                                                overflow: 'auto' // Allow this area to scroll
                                            }}
                                        >
                                            <Center h="100%">
                                                <Stack align="center" gap="md" c="dimmed">
                                                    <Avatar size={80} radius="xl" color="gray" style={{ opacity: 0.5 }}>
                                                        ?
                                                    </Avatar>
                                                    <Text size="lg" fw={600} c="dimmed">No messages</Text>
                                                    <Text size="sm" ta="center" maw={300}>
                                                        This conversation is no longer available because the user has deleted their account.
                                                    </Text>
                                                    <Button
                                                        variant="outline"
                                                        color="red"
                                                        size="sm"
                                                        onClick={handleBackToList}
                                                    >
                                                        Back to Conversations
                                                    </Button>
                                                </Stack>
                                            </Center>
                                        </Box>
                                    </>
                                );
                            }

                            return (
                                <>
                                    {/* Chat Header */}
                                    <Paper
                                        p={{ base: 'xs', md: 'sm' }}
                                        radius={0}
                                        style={{
                                            borderBottom: '1px solid var(--mantine-color-default-border)',
                                            zIndex: 10,
                                            backgroundColor: isDark ? 'var(--mantine-color-dark-7)' : 'white',
                                            flexShrink: 0 // Prevent header from shrinking
                                        }}
                                    >
                                        <Group justify="space-between" wrap="nowrap">
                                            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                                                {isMobile && (
                                                    <ActionIcon variant="subtle" color="gray" onClick={handleBackToList}>
                                                        <IconArrowLeft size={20} />
                                                    </ActionIcon>
                                                )}
                                                {otherUser?.isOnline ? (
                                                    <Indicator
                                                        inline
                                                        size={10}
                                                        offset={4}
                                                        position="bottom-end"
                                                        color="green"
                                                        withBorder
                                                    >
                                                        <Avatar
                                                            src={isUserDeleted ? null : otherUser?.profilePic}
                                                            radius="xl"
                                                            size={isMobile ? 'md' : 'lg'}
                                                            color="pink"
                                                        >
                                                            {isUserDeleted ? '?' : (otherUser?.displayName?.[0] || otherUser?.username?.[0]?.toUpperCase())}
                                                        </Avatar>
                                                    </Indicator>
                                                ) : (
                                                    <Avatar
                                                        src={isUserDeleted ? null : otherUser?.profilePic}
                                                        radius="xl"
                                                        size={isMobile ? 'md' : 'lg'}
                                                        color="pink"
                                                    >
                                                        {isUserDeleted ? '?' : (otherUser?.displayName?.[0] || otherUser?.username?.[0]?.toUpperCase())}
                                                    </Avatar>
                                                )}
                                                <Stack gap={0} style={{ minWidth: 0 }}>
                                                    <Text
                                                        fw={600}
                                                        size="sm"
                                                        truncate
                                                        style={{ lineHeight: 1.2, maxWidth: isMobile ? '120px' : '200px' }}
                                                    >
                                                        {isUserDeleted ? 'Deleted User' : (otherUser?.displayName || otherUser?.username)}
                                                    </Text>
                                                    {!isUserDeleted && (
                                                        <Text size="xs" color={otherUser?.isOnline ? "green" : "dimmed"} fw={otherUser?.isOnline ? 500 : 400}>
                                                            {otherUser?.isOnline ? (
                                                                "Online"
                                                            ) : otherUser?.lastSeen ? (
                                                                `Last seen ${dayjs(otherUser.lastSeen).fromNow()}`
                                                            ) : (
                                                                "Offline"
                                                            )}
                                                        </Text>
                                                    )}
                                                </Stack>
                                            </Group>

                                            <Group gap="xs">
                                                <ActionIcon variant="subtle" color="gray" disabled>
                                                    <IconPhone size={20} />
                                                </ActionIcon>
                                                <ActionIcon variant="subtle" color="gray" disabled>
                                                    <IconVideo size={20} />
                                                </ActionIcon>

                                                <Menu shadow="lg" width={250} position="bottom-end" withinPortal transitionProps={{ duration: 150, transition: 'pop' }}>
                                                    <Menu.Target>
                                                        <ActionIcon
                                                            variant="light"
                                                            color="gray"
                                                            size="lg"
                                                            radius="md"
                                                            style={{
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            <IconDotsVertical size={20} />
                                                        </ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Label>Export Chat</Menu.Label>
                                                        <Menu.Item
                                                            leftSection={<IconDownload size={16} />}
                                                            onClick={() => handleDownloadChat('doc')}
                                                            justify="flex-start"
                                                        >
                                                            <Text fw={500}>Download as Word</Text>
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconDownload size={16} />}
                                                            onClick={() => handleDownloadChat('txt')}
                                                            justify="flex-start"
                                                        >
                                                            <Text fw={500}>Download as TXT</Text>
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconDownload size={16} />}
                                                            onClick={() => handleDownloadChat('csv')}
                                                            justify="flex-start"
                                                        >
                                                            <Text fw={500}>Download as CSV</Text>
                                                        </Menu.Item>
                                                        <Menu.Divider />
                                                        <Menu.Label>Customize</Menu.Label>
                                                        <Menu.Item
                                                            leftSection={<IconPalette size={16} />}
                                                            onClick={openThemeModal}
                                                            justify="flex-start"
                                                        >
                                                            <Text fw={500}>Change Theme</Text>
                                                        </Menu.Item>
                                                        <Menu.Divider />
                                                        <Menu.Item
                                                            color="red"
                                                            leftSection={<IconAlertTriangle size={16} c="red" />}
                                                            onClick={() => promptDeleteConversation(activeConversation)}
                                                            justify="flex-start"
                                                        >
                                                            <Text fw={600} c="red">Delete Chat</Text>
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                            </Group>
                                        </Group>
                                    </Paper>

                                    {/* Messages Scroll Area - Virtualized */}
                                    <Box
                                        flex={1}
                                        p={{ base: 'sm', md: 'md' }}
                                        style={{
                                            backgroundColor: isDark
                                                ? (activeConversation?.theme?.startsWith('custom:')
                                                    ? generateThemeFromColor(activeConversation.theme.split(':')[1]).bgDark
                                                    : themes[activeConversation?.theme || 'default']?.bgDark || themes.default.bgDark)
                                                : (activeConversation?.theme?.startsWith('custom:')
                                                    ? generateThemeFromColor(activeConversation.theme.split(':')[1]).bgLight
                                                    : themes[activeConversation?.theme || 'default']?.bgLight || themes.default.bgLight),
                                            backgroundImage: isDark
                                                ? (activeConversation?.theme?.startsWith('custom:')
                                                    ? generateThemeFromColor(activeConversation.theme.split(':')[1]).dark
                                                    : themes[activeConversation?.theme || 'default']?.dark || themes.default.dark)
                                                : (activeConversation?.theme?.startsWith('custom:')
                                                    ? generateThemeFromColor(activeConversation.theme.split(':')[1]).light
                                                    : themes[activeConversation?.theme || 'default']?.light || themes.default.light),
                                            backgroundSize: '100% 100%',
                                            backgroundAttachment: 'fixed',
                                            overflow: 'hidden',
                                            position: 'relative'
                                        }}
                                    >
                                        <Virtuoso
                                            ref={virtuosoRef}
                                            style={{ height: '100%' }}
                                            data={messages}
                                            initialTopMostItemIndex={{ index: messages.length - 1, align: 'end' }}
                                            followOutput="auto"
                                            itemContent={(index, msg) => {
                                                const isOwn = msg.sender?._id === user._id;
                                                const showAvatar = !isOwn && (index === messages.length - 1 || messages[index + 1]?.sender?._id !== msg.sender?._id);

                                                const previousMsg = messages[index - 1];
                                                const showDateSeparator = !previousMsg || !isSameDay(previousMsg.createdAt, msg.createdAt);
                                                const dateLabel = showDateSeparator ? formatDateLabel(msg.createdAt) : '';

                                                return (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        style={{ paddingBottom: '2px' }}
                                                    >
                                                        {showDateSeparator && (
                                                            <Center pb="sm" pt={index === 0 ? "xs" : "lg"}>
                                                                <Badge
                                                                    variant={isDark ? "filled" : "light"}
                                                                    color="gray"
                                                                    size="sm"
                                                                    bg={isDark ? 'var(--mantine-color-dark-6)' : 'rgba(255, 255, 255, 0.6)'}
                                                                    style={{ backdropFilter: 'blur(4px)' }}
                                                                >
                                                                    {dateLabel}
                                                                </Badge>
                                                            </Center>
                                                        )}
                                                        <MessageItem
                                                            key={msg._id || index}
                                                            message={msg}
                                                            isOwn={isOwn}
                                                            isDark={isDark}
                                                            showAvatar={showAvatar}
                                                            onDelete={() => promptDeleteMessage(msg._id)}
                                                            onReply={() => handleReplyMessage(msg)}
                                                            onReaction={(emoji) => handleReaction(msg._id, emoji)}
                                                            onImageClick={setSelectedImage}
                                                        />
                                                    </motion.div>
                                                );
                                            }}
                                        />

                                        <AnimatePresence>
                                            {selectedImage && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    onClick={() => setSelectedImage(null)}
                                                    style={{
                                                        position: 'fixed',
                                                        top: 0,
                                                        left: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        backgroundColor: 'rgba(0,0,0,0.9)',
                                                        zIndex: 10000,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'zoom-out'
                                                    }}
                                                >
                                                    <motion.img
                                                        layoutId={selectedImage}
                                                        src={selectedImage}
                                                        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </Box>

                                    {/* Input Area */}
                                    <Box style={{
                                        borderTop: '1px solid var(--mantine-color-default-border)',
                                        backgroundColor: isDark ? 'var(--mantine-color-dark-7)' : 'white',
                                        flexShrink: 0
                                    }}>
                                        {/* Typing Indicators */}
                                        <AnimatePresence>
                                            {Array.from(typingUsers).map(userId => {
                                                const typingUser = activeConversation.participants.find(p => p._id === userId);
                                                return typingUser && (
                                                    <motion.div
                                                        key={userId}
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                    >
                                                        <TypingIndicator username={typingUser.displayName || typingUser.username} />
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>

                                        {replyingTo && (
                                            <Group justify="space-between" p="xs" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderLeft: '4px solid var(--mantine-color-pink-filled)' }}>
                                                <Box>
                                                    <Text size="xs" c="pink" fw={700}>Replying to {replyingTo.sender._id === user._id ? 'Yourself' : replyingTo.sender.username}</Text>
                                                    <Text size="sm" lineClamp={1} c="dimmed">{replyingTo.text}</Text>
                                                </Box>
                                                <ActionIcon variant="subtle" color="gray" onClick={cancelReply}>
                                                    <IconX size={18} />
                                                </ActionIcon>
                                            </Group>
                                        )}
                                        <Box p={{ base: 'xs', md: 'sm' }} style={{ flex: 1, minWidth: 0 }}>
                                            <form onSubmit={handleSendMessage}>
                                                <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                                    <Popover opened={showEmojiPicker} onChange={setShowEmojiPicker} position="top-start" withArrow shadow="md">
                                                        <Popover.Target>
                                                            <ActionIcon variant="subtle" color="gray" size={isMobile ? 'md' : 'lg'} radius="xl" onClick={() => setShowEmojiPicker((o) => !o)}>
                                                                <IconMoodSmile size={isMobile ? 20 : 24} />
                                                            </ActionIcon>
                                                        </Popover.Target>
                                                        <Popover.Dropdown p={0}>
                                                            <Picker data={data} onEmojiSelect={onEmojiClick} theme={isDark ? 'dark' : 'light'} />
                                                        </Popover.Dropdown>
                                                    </Popover>

                                                    <TextInput
                                                        ref={inputRef}
                                                        key={activeConversation?._id}
                                                        placeholder={isMessagingDisabled ? "Messaging is disabled" : "Type a message..."}
                                                        value={newMessage}
                                                        onChange={handleInputChange}
                                                        radius="xl"
                                                        size={isMobile ? 'sm' : 'md'}
                                                        disabled={isMessagingDisabled || isSending}
                                                        style={{ flex: 1 }}
                                                        styles={{
                                                            input: {
                                                                backgroundColor: isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)',
                                                                border: 'none',
                                                                transition: 'none',
                                                                fontSize: isMobile ? '14px' : '16px',
                                                                lineHeight: 1.4,
                                                                padding: isMobile ? '8px 16px' : '12px 20px'
                                                            }
                                                        }}
                                                        rightSection={
                                                            <ActionIcon
                                                                variant="filled"
                                                                color="pink"
                                                                size={isMobile ? 'md' : 'lg'}
                                                                radius="xl"
                                                                type="submit"
                                                                disabled={isMessagingDisabled || isSending || !newMessage.trim()}
                                                                loading={isSending}
                                                            >
                                                                {!isSending && <IconSend size={isMobile ? 18 : 20} />}
                                                            </ActionIcon>
                                                        }
                                                    />
                                                </Box>
                                            </form>
                                        </Box>
                                    </Box>
                                </>
                            );
                        })()
                    ) : (
                        <Center h="100%">
                            <Stack align="center" gap="md">
                                <Box p="xl" bg="var(--mantine-color-gray-1)" style={{ borderRadius: '50%' }}>
                                    <IconMessage2 size={64} color="var(--mantine-color-gray-5)" />
                                </Box>
                                <Title order={3} fw={600} c="dimmed">Your Messages</Title>
                                <Text c="dimmed" size="lg">Select a conversation to start chatting</Text>
                                <Button variant="filled" color="pink" radius="xl" size="md">
                                    Start New Chat
                                </Button>
                            </Stack>
                        </Center>
                    )}
                </Box >
            </Paper>
        </Container>
    );
};

export default Chat;
