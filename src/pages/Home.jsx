import { Container, Title, Tabs, ActionIcon, Group, Tooltip, Paper, Text, ThemeIcon } from '@mantine/core';
import { IconFlame } from '@tabler/icons-react';
import Feed from '../components/Feed';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { IconRefresh } from '@tabler/icons-react';

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

    const handleRefresh = () => {
        if (feedRefetch) {
            feedRefetch();
        }
    };

    if (!user) {
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Feed type="discover" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Paper p="md" radius="md" mb="xl" style={{ 
                background: 'linear-gradient(45deg, var(--mantine-color-blue-filled) 0%, var(--mantine-color-pink-filled) 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Group wrap="nowrap">
                    <ThemeIcon size="xl" radius="md" variant="white" color="pink">
                        <IconFlame size={24} />
                    </ThemeIcon>
                    <div>
                        <Text size="sm" fw={600} opacity={0.9} tt="uppercase" ls={1}>Daily Writing Challenge</Text>
                        <Text size="lg" fw={700} mt={4}>{getDailyPrompt()}</Text>
                    </div>
                </Group>
            </Paper>

            <Group justify="space-between" mb="md" align="center">
                <Tabs value={activeTab} onChange={setActiveTab} flex={1}>
                    <Tabs.List grow>
                        <Tabs.Tab value="discover">Discover</Tabs.Tab>
                        <Tabs.Tab value="following">Following</Tabs.Tab>
                    </Tabs.List>
                </Tabs>
                
                <Tooltip label="Refresh Feed" position="bottom" withArrow>
                    <ActionIcon
                        variant="light"
                        size="lg"
                        onClick={handleRefresh}
                        style={{
                            flexShrink: 0
                        }}
                    >
                        <IconRefresh size={16} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            <Feed 
                key={activeTab} 
                type={activeTab} 
                refetch={(refetchFn) => setFeedRefetch(() => refetchFn)}
            />
        </div>
    );
};

export default Home;
