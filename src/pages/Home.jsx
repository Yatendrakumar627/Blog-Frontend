import { Container, Title, Tabs, ActionIcon, Group, Tooltip } from '@mantine/core';
import Feed from '../components/Feed';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import { IconRefresh } from '@tabler/icons-react';

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
