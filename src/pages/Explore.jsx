import { useState, useEffect, useRef } from 'react';
import { Container, Tabs, TextInput, Center, Grid, Text, Title, Stack, ActionIcon, rem, Tooltip, Badge, Button, Group, Skeleton } from '@mantine/core';
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
import dayjs from 'dayjs';
import './Explore.css';

const Explore = () => {
    const [search, setSearch] = useState('');
    const [debouncedSearch] = useDebouncedValue(search, 300);
    const [dateRange, setDateRange] = useState([null, null]);
    const [activeTab, setActiveTab] = useState('posts');
    const [users, setUsers] = useState([]);
    const [searching, setSearching] = useState(false);
    const [isFiltering, setIsFiltering] = useState(false);
    const dateInputRef = useRef(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(max-width: 1024px)');

    // Use infinite scroll for posts
    const { data, isLoading, hasNextPage, fetchNextPage, isRefetching } = usePosts(
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
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [dateRange]);

    return (
        <>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                {/* Search and Filter Container - Single Line */}
                <div style={{
                    marginBottom: 'md',
                    display: 'flex',
                    gap: isMobile ? '8px' : '12px',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: 'center'
                }}>
                    {/* Search Bar - Takes most space */}
                    <TextInput
                        placeholder="Search posts, people, and more..."
                        size="md"
                        radius="xl"
                        leftSection={<IconSearch size={18} stroke={1.5} />}
                        rightSection={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                {search && (
                                    <ActionIcon
                                        size="sm"
                                        variant="transparent"
                                        c="dimmed"
                                        onClick={() => setSearch('')}
                                    >
                                        <IconX size={14} />
                                    </ActionIcon>
                                )}
                            </div>
                        }
                        value={search}
                        onChange={(event) => setSearch(event.currentTarget.value)}
                        style={{ flex: 1 }}
                        styles={{
                            input: {
                                backgroundColor: 'var(--mantine-color-body)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                border: '1px solid var(--mantine-color-default-border)',
                                transition: 'all 0.2s ease',
                                '&:focus': {
                                    borderColor: 'var(--mantine-primary-color-filled)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                }
                            }
                        }}
                    />

                    {/* Date Filter - Compact on same line */}
                    <Tooltip
                        label={dateRange[0] && typeof dateRange[0] === 'object' ?
                            (dateRange[0].toDateString() === dateRange[1]?.toDateString() ?
                                `Filter by date: ${dateRange[0].toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} (Press Ctrl+D to focus, Esc to clear)` :
                                `Filter by date: ${dateRange[0].toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} - ${dateRange[1]?.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} (Press Ctrl+D to focus, Esc to clear)`)
                            : "Filter by date (Press Ctrl+D to focus)"}
                        position={isMobile ? "top" : "bottom"}
                        withArrow
                        openDelay={500}
                    >
                        <DatePickerInput
                            ref={dateInputRef}
                            type="range"
                            allowSingleDateInRange
                            placeholder="Filter by date"
                            valueFormat="DD MMMM YYYY"
                            onChange={(val) => {
                                if (val && val.length === 2) {
                                    if (val[0] && val[1]) {
                                        setDateRange([val[0], val[1]]);
                                    } else if (val[0] && !val[1]) {
                                        setDateRange([val[0], null]);
                                    } else {
                                        setDateRange([null, null]);
                                    }
                                } else {
                                    setDateRange([null, null]);
                                }
                            }}
                            clearable
                            leftSection={<IconCalendar size={isMobile ? 16 : 14} />}
                            maxDate={new Date()}
                            dropdownType="modal"
                            classNames={{
                                input: 'datePickerInput',
                                root: 'datePickerRoot',
                                section: 'datePickerSection',
                                inputWrapper: 'datePickerInputWrapper',
                                dropdown: 'datePickerDropdown',
                                calendar: 'datePickerCalendar',
                                calendarHeader: 'datePickerCalendarHeader',
                                calendarHeaderControl: 'datePickerCalendarHeaderControl',
                                weekday: 'datePickerWeekday',
                                day: 'datePickerDay',
                                month: 'datePickerMonth',
                                monthRow: 'datePickerMonthRow',
                                yearsList: 'datePickerYearsList',
                                monthPicker: 'datePickerMonthPicker',
                                yearPicker: 'datePickerYearPicker'
                            }}
                            styles={{
                                input: {
                                    width: dateRange[0] ? (isMobile ? '100%' : '280px') : (isMobile ? '100%' : '200px'),
                                    minWidth: isMobile ? '150px' : '200px',
                                    maxWidth: isMobile ? '100%' : '280px',
                                    height: isMobile ? '40px' : '40px',
                                    fontSize: isMobile ? '14px' : '13px',
                                },
                                root: {
                                    width: dateRange[0] ? (isMobile ? '100%' : 'auto') : (isMobile ? '100%' : 'auto'),
                                },
                                inputWrapper: {
                                    width: dateRange[0] ? (isMobile ? '100%' : 'auto') : (isMobile ? '100%' : 'auto'),
                                    backgroundColor: dateRange[0] ? 'var(--mantine-color-blue-light)' : 'transparent',
                                },
                                calendar: {
                                    padding: isMobile ? '15px' : '20px'
                                },
                                calendarHeaderControl: {
                                    width: isMobile ? '40px' : '32px',
                                    height: isMobile ? '40px' : '32px',
                                },
                                weekday: {
                                    fontSize: isMobile ? '14px' : '12px',
                                },
                                day: {
                                    padding: isMobile ? '15px' : '20px'
                                }
                            }}
                        />
                    </Tooltip>
                </div>

                {/* Preset Date Buttons - Second Line */}
                <div style={{
                    marginBottom: 'md',
                    display: 'flex',
                    gap: isMobile ? '8px' : '12px',
                    flexWrap: 'wrap',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'stretch' : 'center'
                }}>
                    <Group gap={isMobile ? 'xs' : 'sm'} style={{
                        flex: isMobile ? 1 : 'auto',
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: isMobile ? 'space-between' : 'flex-start'
                    }}>
                        <Button
                            size={isMobile ? 'xs' : 'xs'}
                            variant="subtle"
                            leftSection={<IconClock size={isMobile ? 10 : 12} />}
                            onClick={() => setPresetDateRange('today')}
                            style={{
                                fontSize: isMobile ? '10px' : '11px',
                                height: '32px',
                                padding: isMobile ? '0 12px' : '0 8px',
                                minWidth: isMobile ? '80px' : 'auto',
                                touchAction: 'manipulation'
                            }}
                        >
                            Today
                        </Button>
                        <Button
                            size={isMobile ? 'xs' : 'xs'}
                            variant="subtle"
                            leftSection={<IconCalendarEvent size={isMobile ? 10 : 12} />}
                            onClick={() => setPresetDateRange('thisWeek')}
                            style={{
                                fontSize: isMobile ? '10px' : '11px',
                                height: '32px',
                                padding: isMobile ? '0 12px' : '0 8px',
                                minWidth: isMobile ? '80px' : 'auto',
                                touchAction: 'manipulation'
                            }}
                        >
                            This Week
                        </Button>
                        <Button
                            size={isMobile ? 'xs' : 'xs'}
                            variant="subtle"
                            leftSection={<IconCalendarEvent size={isMobile ? 10 : 12} />}
                            onClick={() => setPresetDateRange('thisMonth')}
                            style={{
                                fontSize: isMobile ? '10px' : '11px',
                                height: '32px',
                                padding: isMobile ? '0 12px' : '0 8px',
                                minWidth: isMobile ? '80px' : 'auto',
                                touchAction: 'manipulation'
                            }}
                        >
                            This Month
                        </Button>
                    </Group>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', flexDirection: 'row', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Tabs value={activeTab} onChange={setActiveTab} variant="outline">
                        <Tabs.List mb="sm">
                            <Tabs.Tab value="posts" leftSection={<IconArticle size={16} />}>Posts</Tabs.Tab>
                            <Tabs.Tab value="people" leftSection={<IconUser size={16} />}>People</Tabs.Tab>
                        </Tabs.List>

                        <Tabs.Panel value="posts">
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
                                        <Group gap="xs" style={{ marginBottom: 'md' }}>
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
        </>
    );
};

export default Explore;
