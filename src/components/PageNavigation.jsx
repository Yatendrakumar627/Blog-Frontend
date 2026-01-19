import { Group, Button, ScrollArea, Box, useComputedColorScheme, Indicator } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { IconHome, IconWriting, IconUser, IconMessage } from '@tabler/icons-react';
import useAuthStore from '../store/authStore';
import { useSocket } from '../contexts/SocketContext';
import { motion } from 'framer-motion';

const PageNavigation = () => {
    const { user } = useAuthStore();
    const location = useLocation();
    const { unreadCount } = useSocket();
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
    const isDark = computedColorScheme === 'dark';

    if (!user) return null;

    const links = [
        { label: 'Explore', path: '/explore', icon: IconHome },
        { label: 'Write', path: '/create-post', icon: IconWriting },
        { label: 'Messages', path: '/chat', icon: IconMessage, isMessage: true },
        { label: 'My Posts', path: '/post', icon: IconWriting },
        { label: 'Profile', path: `/profile/${user.username}`, icon: IconUser },
    ];

    return (
        <Box
            mt="md"
            mb={0}
            mx="auto"
            maw={{ base: 'calc(100% - 32px)', md: 'fit-content' }}
            px="md"
            style={{
                position: 'sticky',
                top: '70px',
                zIndex: 1000,
                borderRadius: '50px',
                backdropFilter: 'blur(20px) saturate(180%)',
                backgroundColor: isDark ? 'rgba(25, 25, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: isDark
                    ? '0 20px 40px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    : '0 20px 40px -10px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                transition: 'all 0.3s ease',
            }}
        >
            <ScrollArea
                type="scroll"
                scrollbarSize={0}
            >
                <Group gap={4} p={6} justify="center" miw="max-content" wrap="nowrap">
                    {links.map((link) => {
                        const isActive = location.pathname === link.path;

                        let IconComponent = <link.icon size={18} stroke={2.5} />;

                        if (link.isMessage && unreadCount > 0) {
                            IconComponent = (
                                <Indicator
                                    inline
                                    size={10}
                                    offset={1}
                                    position="top-end"
                                    color="red"
                                    withBorder
                                    processing
                                >
                                    <link.icon size={18} stroke={2.5} />
                                </Indicator>
                            );
                        }

                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{ textDecoration: 'none', position: 'relative' }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            borderRadius: '50px',
                                            backgroundColor: 'var(--mantine-primary-color-filled)',
                                            boxShadow: '0 0 20px -5px var(--mantine-primary-color-filled)',
                                            zIndex: 0,
                                        }}
                                        transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                                    />
                                )}
                                <Button
                                    variant="transparent"
                                    size="sm"
                                    radius="xl"
                                    px="xl"
                                    fw={700}
                                    leftSection={IconComponent}
                                    styles={(theme) => ({
                                        root: {
                                            height: '40px',
                                            color: isActive ? 'var(--mantine-color-white)' : (isDark ? 'var(--mantine-color-gray-4)' : 'var(--mantine-color-gray-7)'),
                                            '&:hover': {
                                                backgroundColor: isActive ? 'transparent' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
                                                color: isActive ? 'var(--mantine-color-white)' : (isDark ? 'var(--mantine-color-white)' : 'var(--mantine-color-black)'),
                                            },
                                            position: 'relative',
                                            zIndex: 1,
                                            transition: 'all 0.2s ease',
                                        },
                                        inner: {
                                            transform: isActive ? 'translateY(0)' : 'none',
                                            letterSpacing: '0.3px'
                                        }
                                    })}
                                >
                                    {link.label}
                                </Button>
                            </Link>
                        );
                    })}
                </Group>
            </ScrollArea>
        </Box>
    );
};

export default PageNavigation;
