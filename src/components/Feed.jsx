import { usePosts } from '../hooks/usePosts';
import BlogCard from './BlogCard';
import { Center, Alert, Skeleton, Stack, Group, Paper } from '@mantine/core';
import AppLoader from './AppLoader';

import InfiniteScroll from 'react-infinite-scroll-component';
import { useEffect } from 'react';

// Skeleton card that mimics the BlogCard layout for smooth loading
const BlogCardSkeleton = () => (
    <Paper
        radius="lg"
        p="md"
        withBorder
        mb="md"
        style={{
            backgroundColor: 'light-dark(rgba(255,255,255,0.6), rgba(26,27,30,0.6))',
        }}
    >
        <Group mb="sm" gap="sm">
            <Skeleton height={40} circle />
            <Stack gap={4} style={{ flex: 1 }}>
                <Skeleton height={12} width="30%" radius="xl" />
                <Skeleton height={10} width="20%" radius="xl" />
            </Stack>
        </Group>
        <Stack gap="xs">
            <Skeleton height={14} radius="xl" />
            <Skeleton height={14} radius="xl" />
            <Skeleton height={14} width="70%" radius="xl" />
        </Stack>
        <Skeleton height={200} radius="md" mt="sm" />
        <Group mt="sm" gap="lg">
            <Skeleton height={24} width={60} radius="xl" />
            <Skeleton height={24} width={60} radius="xl" />
            <Skeleton height={24} width={60} radius="xl" />
        </Group>
    </Paper>
);

const Feed = ({ type = 'discover', refetch: externalRefetch }) => {
    const { data, isLoading, error, refetch, hasNextPage, fetchNextPage } = usePosts({ type });

    // Expose refetch function to parent component
    useEffect(() => {
        if (externalRefetch) {
            externalRefetch(refetch);
        }
    }, [refetch, externalRefetch]);

    if (isLoading) {
        return (
            <Stack gap={0}>
                {[1, 2, 3].map((i) => (
                    <BlogCardSkeleton key={i} />
                ))}
            </Stack>
        );
    }

    if (error) return <Center><Alert color="red">Failed to load feed</Alert></Center>;

    // Flatten all pages of blogs and remove duplicates
    const allBlogs = data?.pages?.flatMap(page => Array.isArray(page?.blogs) ? page.blogs : []) || [];
    const uniqueBlogs = Array.from(
        new Map(allBlogs.filter(blog => blog && blog._id).map(blog => [blog._id, blog])).values()
    );

    return (
        <div>
            {uniqueBlogs.length === 0 && !isLoading ? (
                <Center c="dimmed" my="xl">No posts found</Center>
            ) : (
                <InfiniteScroll
                    dataLength={uniqueBlogs.length}
                    next={fetchNextPage}
                    hasMore={hasNextPage}
                    loader={<AppLoader centered my="md" />}
                    endMessage={
                        <Center c="dimmed" my="md">
                            No more posts to show
                        </Center>
                    }
                >
                    {uniqueBlogs.map((blog) => (
                        <BlogCard key={blog._id} blog={blog} />
                    ))}
                </InfiniteScroll>
            )}
        </div>
    );
};

export default Feed;
