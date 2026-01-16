import { usePosts } from '../hooks/usePosts';
import BlogCard from './BlogCard';
import { ActionIcon, Center, Alert } from '@mantine/core';
import AppLoader from './AppLoader';

import InfiniteScroll from 'react-infinite-scroll-component';
import { IconRefresh } from '@tabler/icons-react';
import { useEffect } from 'react';

const Feed = ({ type = 'discover', refetch: externalRefetch }) => {
    const { data, isLoading, error, refetch, hasNextPage, fetchNextPage } = usePosts({ type });

    // Expose refetch function to parent component
    useEffect(() => {
        if (externalRefetch) {
            externalRefetch(refetch);
        }
    }, [refetch, externalRefetch]);

    if (isLoading) return <AppLoader centered />;
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
