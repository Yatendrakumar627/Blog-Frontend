import { SegmentedControl, Group, Paper, Text, Button, Box, ThemeIcon, ActionIcon, Tooltip, useComputedColorScheme } from '@mantine/core';
import { IconFlame, IconArrowUpRight, IconAdjustmentsHorizontal, IconRefresh } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import Feed from '../components/Feed';
import { useState, useMemo } from 'react';
import useAuthStore from '../store/authStore';

const DAILY_PROMPTS = [
    "Write about a scent that reminds you of childhood.",
    "Describe a heartbreak in 4 words.",
    "What does healing look like to you today?",
    "If your current mood were a color, what would it be?",
    "Write a letter to your past self.",
    "What is a memory that always makes you smile?",
    "Describe a quiet moment that brought you peace.",
    "Write about a time you felt completely understood."
];

const getDailyPrompt = () => {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length];
};

const Home = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('discover');
    const [feedRefetch, setFeedRefetch] = useState(null);
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
    const isDark = computedColorScheme === 'dark';

    const currentPrompt = useMemo(() => getDailyPrompt(), []);

    const handleRefresh = () => {
        if (feedRefetch) {
            feedRefetch();
        }
    };

    if (!user) {
        return (
            <div style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
                <Feed type="discover" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
            {/* Daily Writing Challenge - Sleek, Subtle & Professional Card */}
            <Paper
                p={{ base: 'sm', sm: 'md' }}
                radius="md"
                mb="md"
                style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.025)' : '#ffffff',
                    background: isDark
                        ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.07) 0%, rgba(168, 85, 247, 0.07) 50%, rgba(236, 72, 153, 0.07) 100%)'
                        : 'linear-gradient(135deg, rgba(37, 99, 235, 0.03) 0%, rgba(168, 85, 247, 0.03) 50%, rgba(236, 72, 153, 0.03) 100%)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                }}
            >
                <Group justify="space-between" align="center" wrap="nowrap" gap="md">
                    <Group align="center" wrap="nowrap" gap="sm" style={{ flex: 1, minWidth: 0 }}>
                        <Box
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isDark ? 'rgba(236, 72, 153, 0.14)' : 'rgba(236, 72, 153, 0.1)',
                                border: isDark ? '1px solid rgba(236, 72, 153, 0.25)' : '1px solid rgba(236, 72, 153, 0.2)',
                                flexShrink: 0,
                            }}
                        >
                            <IconFlame size={18} color="#ec4899" />
                        </Box>

                        <Box style={{ flex: 1, minWidth: 0 }}>
                            <Text
                                size="10px"
                                fw={700}
                                style={{
                                    color: '#ec4899',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.8px',
                                    lineHeight: 1.2,
                                    marginBottom: 2,
                                }}
                            >
                                Daily Prompt
                            </Text>
                            <Text
                                size="sm"
                                fw={600}
                                c={isDark ? '#f4f4f5' : '#18181b'}
                                style={{
                                    lineHeight: 1.4,
                                }}
                            >
                                {currentPrompt}
                            </Text>
                        </Box>
                    </Group>

                    <Button
                        component={Link}
                        to="/create-post"
                        state={{ prompt: currentPrompt }}
                        size="xs"
                        radius="xl"
                        variant="light"
                        color="pink"
                        rightSection={<IconArrowUpRight size={13} />}
                        style={{
                            fontWeight: 600,
                            fontSize: '12px',
                            height: '32px',
                            padding: '0 14px',
                            flexShrink: 0,
                        }}
                    >
                        Write now
                    </Button>
                </Group>
            </Paper>

            {/* "Your feed" Header with Filter and Refresh */}
            <Group justify="space-between" align="center" mt="md" mb={10}>
                <Text size="md" fw={700} c={isDark ? '#f4f4f5' : '#18181b'} style={{ fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                    Your feed
                </Text>
                <Group gap={4}>
                    <Tooltip label="Refresh Feed" position="bottom" withArrow zIndex={10000} withinPortal>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            radius="md"
                            onClick={handleRefresh}
                            style={{
                                color: isDark ? '#9ca3af' : '#6b7280',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <IconRefresh size={15} />
                        </ActionIcon>
                    </Tooltip>
                    <Button
                        component={Link}
                        to="/explore"
                        variant="subtle"
                        color="gray"
                        size="compact-xs"
                        radius="md"
                        leftSection={<IconAdjustmentsHorizontal size={13} />}
                        style={{
                            fontSize: '12px',
                            color: isDark ? '#9ca3af' : '#6b7280',
                            fontWeight: 600,
                        }}
                    >
                        Filter
                    </Button>
                </Group>
            </Group>

            {/* Discover / Following - Clean, Professional Segmented Tabs */}
            <Paper
                p={3}
                radius="lg"
                mb="md"
                className="feed-segmented-control"
                style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.06)',
                }}
            >
                <SegmentedControl
                    value={activeTab}
                    onChange={setActiveTab}
                    fullWidth
                    radius="md"
                    size="sm"
                    data={[
                        { label: 'Discover', value: 'discover' },
                        { label: 'Following', value: 'following' }
                    ]}
                    styles={{
                        root: {
                            backgroundColor: 'transparent',
                            padding: 0,
                        },
                        control: {
                            border: 'none',
                        },
                        indicator: {
                            backgroundColor: isDark ? '#27272a' : '#ffffff',
                            borderRadius: '8px',
                            boxShadow: isDark ? '0 2px 6px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        },
                        label: {
                            fontWeight: 600,
                            fontSize: '13px',
                            paddingTop: '6px',
                            paddingBottom: '6px',
                            color: isDark ? '#828290' : '#64748b',
                            transition: 'color 0.2s ease',
                        }
                    }}
                />
            </Paper>

            <Feed
                key={activeTab}
                type={activeTab}
                refetch={(refetchFn) => setFeedRefetch(() => refetchFn)}
            />
        </div>
    );
};

export default Home;
