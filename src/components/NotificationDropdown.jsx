import { Menu, ActionIcon, Indicator, Text, Group, Avatar, ScrollArea, Stack, Badge, Button, Paper } from '@mantine/core';
import { IconBell, IconCheck } from '@tabler/icons-react';
import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { notifications as mantineNotifications } from '@mantine/notifications';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { SocketContext, useSocket } from '../contexts/SocketContext';
import notificationSound from '../assets/notification.mp3';

dayjs.extend(relativeTime);

const NotificationDropdown = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const audioRef = useRef(new Audio(notificationSound));

    const getNotificationContent = (n) => {
        let text = '';
        let link = '';
        switch (n.type) {
            case 'like':
                text = `liked your post "${n.blog?.title || 'post'}"`;
                link = `/post/${n.blog?._id || n.blog}`;
                break;
            case 'comment':
                text = `commented on your post "${n.blog?.title || 'post'}"`;
                link = `/post/${n.blog?._id || n.blog}`;
                break;
            case 'follow':
                text = `started following you`;
                link = `/profile/${n.sender.username}`;
                break;
            default:
                text = 'interacted with you';
        }

        return { text, link };
    };

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const { data } = await api.get('/notifications');
            const notificationsArray = Array.isArray(data) ? data : [];
            setNotifications(notificationsArray);
            setUnreadCount(notificationsArray.filter(n => n && !n.read).length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    // Initial fetch on mount
    useEffect(() => {
        fetchNotifications();
    }, [user]);

    // Real-time notification listener
    useEffect(() => {
        if (socket) {
            socket.on('notification', (newNotification) => {
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Play sound
                audioRef.current.play().catch(e => console.log('Audio play failed', e));

                // Show toast
                const { text } = getNotificationContent(newNotification);
                mantineNotifications.show({
                    title: 'New Notification',
                    message: `${newNotification.sender.username} ${text}`,
                    icon: <Avatar src={newNotification.sender.profilePic} size="sm" radius="xl" />,
                    autoClose: 5000,
                    style: { cursor: 'pointer' },
                    onClick: () => {
                        window.location.href = getNotificationContent(newNotification).link;
                    }
                });
            });

            return () => {
                socket.off('notification');
            };
        }
    }, [socket]);

    const handleMarkRead = async (id, link) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (link) navigate(link);
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error(error);
        }
    };



    return (
        <Menu shadow="md" width={320} position="bottom-end" onOpen={fetchNotifications} zIndex={3000}>
            <Menu.Target>
                <Indicator inline label={unreadCount} size={16} color="red" disabled={unreadCount === 0} offset={2} withBorder processing>
                    <ActionIcon variant="transparent" size="lg" color="gray" aria-label="Notifications">
                        <IconBell size={20} stroke={1.5} />
                    </ActionIcon>
                </Indicator>
            </Menu.Target>

            <Menu.Dropdown p={0}>
                <Paper p="xs" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                    <Group justify="space-between">
                        <Text size="sm" fw={700}>Notifications</Text>
                        {unreadCount > 0 && (
                            <Button variant="subtle" size="xs" compact="true" onClick={handleMarkAllRead} leftSection={<IconCheck size={14} />}>
                                Mark all read
                            </Button>
                        )}
                    </Group>
                </Paper>

                <ScrollArea h={350}>
                    {notifications.length === 0 ? (
                        <Text c="dimmed" size="sm" ta="center" py="xl">No notifications yet</Text>
                    ) : (
                        <Stack gap={0}>
                            {Array.isArray(notifications) && notifications.map((n) => {
                                const { text, link } = getNotificationContent(n);
                                return (
                                    <Menu.Item
                                        key={n._id}
                                        onClick={() => handleMarkRead(n._id, link)}
                                        style={{
                                            backgroundColor: n.read ? 'transparent' : 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-blue-9))',
                                            borderBottom: '1px solid var(--mantine-color-default-border)'
                                        }}
                                    >
                                        <Group wrap="nowrap" align="flex-start">
                                            <Indicator
                                                inline
                                                size={10}
                                                offset={2}
                                                position="bottom-end"
                                                color="green"
                                                withBorder
                                                disabled={!n.sender?.isOnline}
                                                processing={n.sender?.isOnline}
                                            >
                                                <Avatar src={n.sender.profilePic} radius="xl" size="sm" />
                                            </Indicator>
                                            <Stack gap={2} style={{ flex: 1 }}>
                                                <Text size="sm" lh={1.3}>
                                                    <Text span fw={600}>{n.sender.username}</Text> {text}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {dayjs(n.createdAt).fromNow()}
                                                </Text>
                                            </Stack>
                                            {!n.read && <Badge size="xs" circle p={4} color="blue" />}
                                        </Group>
                                    </Menu.Item>
                                );
                            })}
                        </Stack>
                    )}
                </ScrollArea>
            </Menu.Dropdown>
        </Menu>
    );
};

export default NotificationDropdown;
