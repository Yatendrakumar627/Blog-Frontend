import { Group, Button, Title, Box, ActionIcon, useMantineColorScheme, useComputedColorScheme, Indicator, Tooltip, Avatar, Text, Menu, UnstyledButton, Badge } from '@mantine/core';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { IconSun, IconMoon, IconBell, IconBellRinging, IconWriting, IconHome, IconUser, IconLogout, IconLogin, IconUserPlus, IconSettings, IconChevronDown, IconCrown, IconShield, IconMessage } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

import NotificationDropdown from './NotificationDropdown';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    const toggleColorScheme = () => {
        setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Box
            component="header"
            py="sm"
            px={{ base: 'md', md: 'xl' }}
            style={{
                borderBottom: '1px solid var(--mantine-color-default-border)',
                backgroundColor: 'rgba(var(--mantine-color-body-rgb), 0.8)', // More subtle background for glass effect
                backdropFilter: 'blur(16px) saturate(180%)', // Stronger blur
                position: 'sticky',
                top: 0,
                zIndex: 200,
                transition: 'all 0.3s ease'
            }}
        >
            <Group justify="space-between" align="center" wrap="nowrap" h="100%">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Title
                        order={2}
                        component={Link}
                        to="/public-feed"
                        fz={{ base: '1.4rem', sm: '1.6rem' }}
                        style={{
                            textDecoration: 'none',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #6366f1 100%)', // More vibrant gradient
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: 'drop-shadow(0 2px 10px rgba(236, 72, 153, 0.2))',
                            position: 'relative',
                            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                        }}
                    >
                        Dil Ki Baatein
                    </Title>
                </motion.div>

                <Group gap="sm" align="center" wrap="nowrap">
                    {user && (
                        <Group gap={8}>
                            <NotificationDropdown />
                        </Group>
                    )}

                    <Tooltip label={computedColorScheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} position="bottom" withArrow>
                        <ActionIcon
                            onClick={toggleColorScheme}
                            variant="subtle"
                            color="gray"
                            size="lg"
                            radius="xl"
                            aria-label="Toggle color scheme"
                            className="nav-icon"
                        >
                            <AnimatePresence mode="wait">
                                {computedColorScheme === 'dark' ? (
                                    <motion.div
                                        key="sun"
                                        initial={{ rotate: -90, scale: 0 }}
                                        animate={{ rotate: 0, scale: 1 }}
                                        exit={{ rotate: 90, scale: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <IconSun size={22} stroke={1.5} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="moon"
                                        initial={{ rotate: 90, scale: 0 }}
                                        animate={{ rotate: 0, scale: 1 }}
                                        exit={{ rotate: -90, scale: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <IconMoon size={22} stroke={1.5} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </ActionIcon>
                    </Tooltip>

                    {user ? (
                        <Menu
                            shadow="xl"
                            width={240}
                            position="bottom-end"
                            offset={2}
                            withArrow
                            arrowPosition="center"
                            transitionProps={{ transition: 'pop-top-right', duration: 200 }}
                        >
                            <Menu.Target>
                                <UnstyledButton
                                    style={{
                                        padding: '4px',
                                        borderRadius: 'var(--mantine-radius-xl)',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Group gap={10} align="center" wrap="nowrap">
                                        <Indicator
                                            inline
                                            size={12}
                                            offset={2}
                                            position="bottom-end"
                                            color="green"
                                            withBorder
                                            disabled={!user.isOnline}
                                            processing={user.isOnline}
                                        >
                                            <Avatar
                                                src={user.profilePic}
                                                size="md"
                                                radius="xl"
                                                alt={user.username}
                                                style={{
                                                    border: '2px solid var(--mantine-color-body)',
                                                    boxShadow: '0 0 0 2px var(--mantine-color-primary-filled, #ec4899)'
                                                }}
                                            />
                                        </Indicator>

                                        <Box visibleFrom="sm">
                                            <Text
                                                size="sm"
                                                fw={600}
                                                style={{ color: 'var(--mantine-color-text)' }}
                                            >
                                                {user.username}
                                            </Text>
                                        </Box>
                                        <IconChevronDown
                                            size={16}
                                            color="var(--mantine-color-dimmed)"
                                            style={{ marginLeft: -4 }}
                                        />
                                    </Group>
                                </UnstyledButton>
                            </Menu.Target>

                            <Menu.Dropdown p={8} style={{ borderRadius: '16px' }}>
                                <Group p="xs" gap="xs">
                                    <Avatar src={user.profilePic} size="md" radius="xl" />
                                    <Box style={{ flex: 1 }}>
                                        <Text size="sm" fw={600} lineClamp={1}>{user.username}</Text>
                                        <Text size="xs" c="dimmed" lineClamp={1}>{user.email || 'User'}</Text>
                                    </Box>
                                </Group>

                                <Menu.Divider my={4} />

                                <Menu.Item
                                    component={Link}
                                    to={`/profile/${user.username}`}
                                    leftSection={<IconUser size={18} stroke={1.5} />}
                                    style={{ borderRadius: '8px' }}
                                >
                                    My Profile
                                </Menu.Item>

                                <Menu.Item
                                    component={Link}
                                    to="/chat"
                                    leftSection={<IconMessage size={18} stroke={1.5} />}
                                    style={{ borderRadius: '8px' }}
                                >
                                    Messages
                                </Menu.Item>

                                <Menu.Item
                                    component={Link}
                                    to="/settings"
                                    leftSection={<IconSettings size={18} stroke={1.5} />}
                                    style={{ borderRadius: '8px' }}
                                >
                                    Settings
                                </Menu.Item>

                                {user.isPremium && (
                                    <Menu.Item
                                        leftSection={<IconCrown size={18} stroke={1.5} />}
                                        color="yellow"
                                        style={{ borderRadius: '8px' }}
                                    >
                                        Premium Member
                                    </Menu.Item>
                                )}

                                {user.isAdmin && (
                                    <Menu.Item
                                        component={Link}
                                        to="/admin"
                                        leftSection={<IconShield size={18} stroke={1.5} />}
                                        color="blue"
                                        style={{ borderRadius: '8px' }}
                                    >
                                        Admin Panel
                                    </Menu.Item>
                                )}

                                <Menu.Divider my={4} />

                                <Menu.Item
                                    leftSection={<IconLogout size={18} stroke={1.5} />}
                                    color="red"
                                    onClick={handleLogout}
                                    style={{ borderRadius: '8px' }}
                                >
                                    Logout
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    ) : (
                        <Button
                            component={Link}
                            to="/login"
                            variant="filled"
                            color="pink"
                            size="sm"
                            radius="xl"
                            leftSection={<IconLogin size={18} />}
                            style={{
                                boxShadow: '0 4px 14px rgba(236, 72, 153, 0.4)',
                                transition: 'transform 0.2s ease'
                            }}
                        >
                            Login
                        </Button>
                    )}
                </Group>
            </Group>
        </Box>
    );
};

export default Navbar;
