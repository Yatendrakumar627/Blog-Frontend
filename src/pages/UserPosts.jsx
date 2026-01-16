import { Center, Title, Text, Container } from '@mantine/core';
import AppLoader from '../components/AppLoader';
import BlogCard from '../components/BlogCard';
import useAuthStore from '../store/authStore';
import { usePosts } from '../hooks/usePosts';

const UserPosts = () => {
    const { user } = useAuthStore();
    const { data, isLoading } = usePosts({ author: user?._id });

    if (isLoading) return <AppLoader centered />;

    if (!user) return <Center>Please login</Center>;

    // Extract blogs from infinite query structure
    const posts = data?.pages?.flatMap(page => page.blogs) || [];

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {posts.length === 0 ? (
                <Text color="dimmed" ta="center" mt="xl">
                    You haven't posted anything yet. <a href="/create-post">Create your first post</a>
                </Text>
            ) : (
                posts.map((post) => (
                    <BlogCard key={post._id} blog={post} />
                ))
            )}
        </div>
    );
};

export default UserPosts;
