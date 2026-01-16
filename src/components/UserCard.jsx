import { Card, Avatar, Text, Button, Group, Indicator, useMantineColorScheme } from '@mantine/core';
import { IconUserPlus, IconUserCheck } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { notifications } from '@mantine/notifications';
import useAuthStore from '../store/authStore';

const UserCard = ({ user, initialIsFollowing = false, onFollowToggle }) => {
    const { user: currentUser } = useAuthStore();
    const navigate = useNavigate();
    const { colorScheme } = useMantineColorScheme();

    if (!user) return null;

    // Check if current user is in the followers list or if the target user is in the current user's following list
    const isAlreadyFollowing = (
        (user.followers && currentUser && (
            user.followers.includes(currentUser._id) ||
            user.followers.some(f => f._id === currentUser._id || f === currentUser._id)
        )) ||
        (currentUser && currentUser.following && (
            currentUser.following.includes(user._id) ||
            currentUser.following.some(f => f === user._id || f._id === user._id)
        ))
    );

    const [isFollowing, setIsFollowing] = useState(initialIsFollowing || isAlreadyFollowing);

    // Update state if user prop changes or currentUser loads
    useEffect(() => {
        if (user && currentUser) {
            const following = (
                (user.followers && (
                    user.followers.includes(currentUser._id) ||
                    user.followers.some(f => f._id === currentUser._id || f === currentUser._id)
                )) ||
                (currentUser.following && (
                    currentUser.following.includes(user._id) ||
                    currentUser.following.some(f => f === user._id || f._id === user._id)
                ))
            );
            setIsFollowing(following);
        }
    }, [user, currentUser]);

    const [loading, setLoading] = useState(false);

    const handleFollow = async (e) => {
        e.stopPropagation(); // Prevent card click
        setLoading(true);
        try {
            // Optimistic update
            const prevIsFollowing = isFollowing;
            setIsFollowing(!prevIsFollowing);
            if (onFollowToggle) onFollowToggle(!prevIsFollowing);

            if (prevIsFollowing) { // Was following, now unfollowing
                await api.put(`/auth/${user.username}/unfollow`);
                notifications.show({
                    title: 'Unfollowed',
                    message: `You unfollowed ${user.username}`,
                    color: 'yellow',
                    withBorder: true,
                });
            } else { // Was not following, now following
                await api.put(`/auth/${user.username}/follow`);
                notifications.show({
                    title: 'Followed',
                    message: `You are now following ${user.username}`,
                    color: 'green',
                    withBorder: true,
                });
            }
        } catch (error) {
            // Revert on error
            setIsFollowing(!isFollowing);
            if (onFollowToggle) onFollowToggle(!isFollowing);

            notifications.show({
                title: 'Error',
                message: error.response?.data?.message || 'Something went wrong',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            shadow="sm"
            padding="lg"
            radius="lg"
            withBorder
            styles={(theme) => ({
                root: {
                    backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : theme.white,
                    borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : theme.colors.gray[2],
                    backdropFilter: 'blur(10px)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows.md,
                        borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : theme.colors.gray[3],
                    }
                }
            })}
        >
            <Group wrap="nowrap" align="center">
                <Indicator
                    inline
                    size={14}
                    offset={5}
                    position="bottom-end"
                    color="green"
                    withBorder
                    disabled={!user.isOnline}
                    processing={user.isOnline}
                    styles={{ indicator: { border: '2px solid var(--mantine-color-body)' } }}
                >
                    <Avatar
                        src={user.profilePic}
                        alt={user.username}
                        size={54}
                        radius="100%"
                        component={Link}
                        to={`/profile/${user.username}`}
                        style={{ cursor: 'pointer', border: '1px solid var(--mantine-color-default-border)' }}
                    />
                </Indicator>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <Text
                        size="sm"
                        fw={700}
                        component={Link}
                        to={`/profile/${user.username}`}
                        truncate
                        style={{
                            textDecoration: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            display: 'block',
                            lineHeight: 1.2
                        }}
                    >
                        {user.username}
                    </Text>
                    {user.displayName && (
                        <Text size="xs" c="dimmed" truncate>
                            {user.displayName}
                        </Text>
                    )}
                    <Text size="xs" c="dimmed" lineClamp={1} style={{ lineHeight: 1.4, marginTop: 2 }}>
                        {user.bio || 'Writer, thinker, and creator.'}
                    </Text>
                </div>

                <Button
                    variant={isFollowing ? "outline" : "gradient"}
                    gradient={!isFollowing ? { from: 'blue', to: 'cyan', deg: 90 } : undefined}
                    color={isFollowing ? "gray" : "blue"}
                    size="xs"
                    radius="xl"
                    onClick={handleFollow}
                    loading={loading}
                    leftSection={!isFollowing && <IconUserPlus size={14} />}
                    styles={{
                        root: {
                            height: 32,
                            paddingLeft: isFollowing ? 8 : 14,
                            paddingRight: isFollowing ? 8 : 14,
                            minWidth: isFollowing ? 32 : undefined,
                            backgroundColor: isFollowing ? 'transparent' : undefined,
                            '&:hover': {
                                backgroundColor: isFollowing ? 'rgba(255, 255, 255, 0.05)' : undefined
                            }
                        }
                    }}
                >
                    {isFollowing ? <IconUserCheck size={16} /> : 'Follow'}
                </Button>
            </Group>
        </Card>
    );
};

export default UserCard;
