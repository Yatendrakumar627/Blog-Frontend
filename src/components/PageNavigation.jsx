import { Group, Box, useComputedColorScheme, Indicator, UnstyledButton, Text } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { IconHome, IconCompass, IconCirclePlus, IconMessageCircle, IconUser } from '@tabler/icons-react';
import useAuthStore from '../store/authStore';
import { useSocket } from '../contexts/SocketContext';
import { useEffect } from 'react';

const PageNavigation = () => {
    const { user } = useAuthStore();
    const location = useLocation();
    const { hasNewMessage, setHasNewMessage } = useSocket();
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
    const isDark = computedColorScheme === 'dark';

    useEffect(() => {
        if (location.pathname === '/chat') {
            setHasNewMessage(false);
        }
    }, [location.pathname, setHasNewMessage]);

    if (!user) return null;

    const links = [
        { label: 'Home', path: '/public-feed', icon: IconHome },
        { label: 'Explore', path: '/explore', icon: IconCompass },
        { label: 'Create', path: '/create-post', icon: IconCirclePlus },
        { label: 'Chat', path: '/chat', icon: IconMessageCircle, isMessage: true },
        { label: 'Profile', path: `/profile/${user.username}`, icon: IconUser },
    ];

    return (
        <Box
            component="nav"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 2000,
                backgroundColor: isDark ? 'rgba(15, 14, 23, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(20px) saturate(180%)',
                borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                boxShadow: isDark ? '0 -10px 30px rgba(0, 0, 0, 0.5)' : '0 -10px 25px rgba(0, 0, 0, 0.05)',
                transition: 'background-color 0.3s ease',
            }}
        >
            <Group
                justify="space-around"
                align="center"
                wrap="nowrap"
                style={{
                    maxWidth: '640px',
                    margin: '0 auto',
                    height: '58px',
                    padding: '0 8px',
                }}
            >
                {links.map((link) => {
                    const isActive = location.pathname === link.path || (link.path === '/public-feed' && location.pathname === '/');

                    const activeColor = '#ec4899';
                    const inactiveColor = isDark ? '#71717a' : '#8e8ea0';
                    const currentColor = isActive ? activeColor : inactiveColor;

                    let IconComponent = <link.icon size={22} stroke={isActive ? 2.2 : 1.7} color={currentColor} />;

                    if (link.isMessage && hasNewMessage && location.pathname !== '/chat') {
                        IconComponent = (
                            <Indicator
                                inline
                                size={8}
                                offset={2}
                                position="top-end"
                                color="red"
                                withBorder
                                processing
                            >
                                {IconComponent}
                            </Indicator>
                        );
                    }

                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            style={{
                                textDecoration: 'none',
                                flex: 1,
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <UnstyledButton
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '3px',
                                    width: '100%',
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s ease',
                                }}
                            >
                                {IconComponent}
                                <Text
                                    size="11px"
                                    fw={isActive ? 700 : 500}
                                    style={{
                                        color: currentColor,
                                        letterSpacing: '0.2px',
                                        lineHeight: 1,
                                        transition: 'color 0.2s ease',
                                    }}
                                >
                                    {link.label}
                                </Text>
                            </UnstyledButton>
                        </Link>
                    );
                })}
            </Group>
        </Box>
    );
};

export default PageNavigation;
