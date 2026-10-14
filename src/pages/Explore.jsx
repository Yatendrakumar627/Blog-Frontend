import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Tabs, TextInput, Center, Grid, Text, Title, Stack, ActionIcon, Tooltip, Badge, Button, Group, Skeleton, Box } from '@mantine/core';
import { useDebouncedValue, useMediaQuery } from '@mantine/hooks';
import AppLoader from '../components/AppLoader';
import { IconSearch, IconUser, IconArticle, IconX, IconCalendar, IconFilter, IconClock, IconCalendarEvent } from '@tabler/icons-react';
import { DatePickerInput } from '@mantine/dates';
import '@mantine/dates/styles.css';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import BlogCard from '../components/BlogCard';
import UserCard from '../components/UserCard';
import TrendingPosts from '../components/TrendingPosts';
import InfiniteScroll from 'react-infinite-scroll-component';
import { usePosts } from '../hooks/usePosts';
import './Explore.css';

const Explore = () => {
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [debouncedSearch] = useDebouncedValue(search, 300);
    const [dateRange, setDateRange] = useState([null, null]);
    const [activePreset, setActivePreset] = useState('all');
    const [activeTab, setActiveTab] = useState('posts');
    const [users, setUsers] = useState([]);
    const [searching, setSearching] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    const dateInputRef = useRef(null);
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Use infinite scroll for posts
    const { data, isLoading, hasNextPage, fetchNextPage } = usePosts(
        debouncedSearch || (dateRange && dateRange[0]) ? {
            search: debouncedSearch,
            startDate: dateRange && dateRange[0] ? new Date(dateRange[0]).toISOString() : undefined,
            endDate: (dateRange && dateRange[1]) ? (() => {
                const end = new Date(dateRange[1]);
                end.setHours(23, 59, 59, 999);
                return end.toISOString();
            })() : (dateRange && dateRange[0]) ? (() => {
                // For single date, set end time to end of that day
                const end = new Date(dateRange[0]);
                end.setHours(23, 59, 59, 999);
                return end.toISOString();
            })() : undefined,
            limit: (dateRange && dateRange[0]) ? 100 : 10
        } : { type: 'discover' }
    );

    // Track filtering state
    useEffect(() => {
        setIsFiltering(isLoading && (debouncedSearch || (dateRange && dateRange[0])));
    }, [isLoading, debouncedSearch, dateRange]);

    // Extract posts from infinite query structure
    const posts = data?.pages?.flatMap(page => Array.isArray(page?.blogs) ? page.blogs : []) || [];
    const uniquePosts = Array.from(
        new Map(posts.filter(post => post && post._id).map(post => [post._id, post])).values()
    );

    useEffect(() => {
        const fetchUsers = async () => {
            if (activeTab === 'people') {
                try {
                    setSearching(true);
                    const { data } = await api.get(`/auth/search?search=${debouncedSearch}`);
                    setUsers(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error(error);
                    setUsers([]);
                } finally {
                    setSearching(false);
                }
            }
        };

        fetchUsers();
    }, [debouncedSearch, activeTab]);

    const { data: trendingPosts } = useQuery({
        queryKey: ['trending-posts'],
        queryFn: async () => {
            const { data } = await api.get('/blogs');
            // Handle both old array format and new paginated format
            const posts = Array.isArray(data.blogs) ? data.blogs : (Array.isArray(data) ? data : []);
            return posts.filter(post => post && post.likes).sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)).slice(0, 5);
        },
        staleTime: 1000 * 60 * 5,
    });

    const hasTrending = trendingPosts && trendingPosts.length > 0;

    // Preset date ranges helper
    const setPresetDateRange = (preset) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let start, end;
        switch (preset) {
            case 'today':
                start = new Date(today);
                end = new Date(today);
                break;
            case 'yesterday':
                start = new Date(today);
                start.setDate(start.getDate() - 1);
                end = new Date(start);
                break;
            case 'thisWeek':
                start = new Date(today);
                start.setDate(today.getDate() - today.getDay());
                end = new Date(today);
                break;
            case 'thisMonth':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            default:
                return;
        }

        // Set end time to end of day
        end.setHours(23, 59, 59, 999);
        setDateRange([start, end]);
        setActivePreset(preset);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl/Cmd + D to focus date input
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                dateInputRef.current?.focus();
            }
            // Escape to clear date filter
            if (e.key === 'Escape' && dateRange[0]) {
                setDateRange([null, null]);
                setActivePreset('all');
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [dateRange]);

    return (
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
            {/* Unified Search Header */}
            <Box mb="md">
                <TextInput
                    placeholder="Search posts, people, and topics..."
                    size="md"
                    radius="xl"
                    className="explore-search-input"
                    leftSection={<IconSearch size={18} stroke={1.5} />}
                    rightSection={
                        search ? (
                            <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="gray"
                                onClick={() => setSearch('')}
                            >
                                <IconX size={14} />
                            </ActionIcon>
                        ) : null
                    }
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                />
            </Box>

            {/* Main Content Layout with Sticky Trending Sidebar */}
            <div style={{ display: 'flex', gap: '24px', flexDirection: 'row', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Tabs
                        value={activeTab}
                        onChange={setActiveTab}
                        className="explore-tabs"
                    >
                        <Tabs.List>
                            <Tabs.Tab value="posts" leftSection={<IconArticle size={16} />}>Posts</Tabs.Tab>
                            <Tabs.Tab value="people" leftSection={<IconUser size={16} />}>People</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="posts">
                            {/* Contextual Date Filter Chips for Posts */}
                            <Box mb="md">
                                <Group gap={8} wrap="nowrap" style={{ overflowX: 'auto', paddingBottom: 4 }}>
                                    <Button
                                        size="xs"
                                        radius="xl"
                                        variant={activePreset === 'all' && !dateRange[0] ? 'filled' : 'default'}
                                        color={activePreset === 'all' && !dateRange[0] ? 'blue' : 'gray'}
                                        onClick={() => {
                                            setDateRange([null, null]);
                                            setActivePreset('all');
                                        }}
                                        style={{
                                            fontWeight: 600,
                                            fontSize: '12px',
                                            height: 30,
                                            flexShrink: 0,
                                        }}
                                    >
                                        All Time
                                    </Button>

                                    <Button
                                        size="xs"
                                        radius="xl"
                                        variant={activePreset === 'today' ? 'filled' : 'default'}
                                        color={activePreset === 'today' ? 'blue' : 'gray'}
                                        leftSection={<IconClock size={12} />}
                                        onClick={() => setPresetDateRange('today')}
                                        style={{
                                            fontWeight: 600,
                                            fontSize: '12px',
                                            height: 30,
                                            flexShrink: 0,
                                        }}
                                    >
                                        Today
                                    </Button>

                                    <Button
                                        size="xs"
                                        radius="xl"
                                        variant={activePreset === 'thisWeek' ? 'filled' : 'default'}
                                        color={activePreset === 'thisWeek' ? 'blue' : 'gray'}
                                        leftSection={<IconCalendarEvent size={12} />}
                                        onClick={() => setPresetDateRange('thisWeek')}
                                        style={{
                                            fontWeight: 600,
                                            fontSize: '12px',
                                            height: 30,
                                            flexShrink: 0,
                                        }}
                                    >
                                        This Week
                                    </Button>

                                    <Button
                                        size="xs"
                                        radius="xl"
                                        variant={activePreset === 'thisMonth' ? 'filled' : 'default'}
                                        color={activePreset === 'thisMonth' ? 'blue' : 'gray'}
                                        leftSection={<IconCalendarEvent size={12} />}
                                        onClick={() => setPresetDateRange('thisMonth')}
                                        style={{
                                            fontWeight: 600,
                                            fontSize: '12px',
                                            height: 30,
                                            flexShrink: 0,
                                        }}
                                    >
                                        This Month
                                    </Button>

                                    <DatePickerInput
                                        ref={dateInputRef}
                                        type="range"
                                        allowSingleDateInRange
                                        placeholder="Custom date..."
                                        value={dateRange}
                                        valueFormat="DD MMM"
                                        size="xs"
                                        radius="xl"
                                        clearable
                                        leftSection={<IconCalendar size={13} />}
                                        maxDate={new Date()}
                                        dropdownType="modal"
                                        onChange={(val) => {
                                            if (val && val[0]) {
                                                setDateRange([val[0], val[1] || null]);
                                                setActivePreset('custom');
                                            } else {
                                                setDateRange([null, null]);
                                                setActivePreset('all');
                                            }
                                        }}
                                        styles={{
                                            input: {
                                                height: 30,
                                                minHeight: 30,
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                width: dateRange[0] ? '180px' : '135px',
                                                backgroundColor: dateRange[0] ? 'var(--mantine-color-blue-light)' : 'transparent',
                                                borderColor: dateRange[0] ? 'var(--mantine-color-blue-filled)' : 'var(--mantine-color-default-border)',
                                                color: dateRange[0] ? 'var(--mantine-color-blue-filled)' : 'inherit',
                                                cursor: 'pointer',
                                            }
                                        }}
                                    />
                                </Group>
                            </Box>

                            {isLoading && uniquePosts.length === 0 ? (
                                <Stack gap="md">
                                    {isFiltering ? (
                                        // Show skeleton cards when filtering
                                        [1, 2, 3].map((i) => (
                                            <Skeleton key={i} height={200} radius="lg" mb="lg" />
                                        ))
                                    ) : (
                                        <AppLoader centered />
                                    )}
                                </Stack>
                            ) : (
                                <Stack>
                                    {isFiltering && (
                                        <Group gap="xs" style={{ marginBottom: '16px' }}>
                                            <AppLoader size="sm" />
                                            <Text size="sm" c="dimmed">Filtering posts...</Text>
                                        </Group>
                                    )}
                                    {uniquePosts.length > 0 ? (
                                        <InfiniteScroll
                                            dataLength={uniquePosts.length}
                                            next={fetchNextPage}
                                            hasMore={hasNextPage}
                                            loader={<AppLoader centered my="md" />}
                                            endMessage={
                                                <Center c="dimmed" my="md">
                                                    No more posts to show
                                                </Center>
                                            }
                                        >
                                            {uniquePosts.map(post => <BlogCard key={post._id} blog={post} />)}
                                        </InfiniteScroll>
                                    ) : (
                                        <Text c="dimmed" ta="center">
                                            {isFiltering ? 'No posts found for the selected filters.' : 'No posts found.'}
                                        </Text>
                                    )}
                                </Stack>
                            )}
                        </Tabs.Panel>

                        <Tabs.Panel value="people">
                            {searching ? (
                                <AppLoader centered />
                            ) : (
                                <Grid>
                                    {users.length > 0 ? (
                                        users.map(user => (
                                            <Grid.Col key={user._id} span={{ base: 12, sm: 6, md: 4 }}>
                                                <UserCard user={user} />
                                            </Grid.Col>
                                        ))
                                    ) : (
                                        <div style={{ padding: '40px 0' }}>
                                            <Text c="dimmed" ta="center">No users found.</Text>
                                            {debouncedSearch && (
                                                <Text size="sm" c="dimmed" ta="center" mt="xs">
                                                    Try searching for something else
                                                </Text>
                                            )}
                                        </div>
                                    )}
                                </Grid>
                            )}
                        </Tabs.Panel>
                    </Tabs>
                </div>
                {hasTrending && (
                    <div style={{ width: '320px', flexShrink: 0, position: 'sticky', top: 20, height: 'fit-content' }} className="mantine-visible-from-md">
                        <TrendingPosts posts={trendingPosts} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Explore;
