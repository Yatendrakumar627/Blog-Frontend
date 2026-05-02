import { Paper, Text, Stack, Group, Avatar, Image, Title, Skeleton, UnstyledButton, Indicator } from '@mantine/core';
import { IconTrendingUp, IconHeart } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

const TrendingPosts = ({ posts }) => {
    const navigate = useNavigate();

    // Pre-strip HTML from all posts once, not on every render
    const processedPosts = useMemo(() => {
        if (!posts) return [];
        return posts.map(post => ({
            ...post,
            plainContent: post.content.replace(/<[^>]+>/g, ''),
        }));
    }, [posts]);

    if (!processedPosts || processedPosts.length === 0) return null;

    return (
        <Paper p="md" radius="md" withBorder>
            <Group mb="md">
                <IconTrendingUp size={20} color="#339af0" />
                <Title order={5}>Trending Now</Title>
            </Group>
            <Stack gap="sm">
                {processedPosts.map((post, index) => (
                    <UnstyledButton key={post._id} onClick={() => navigate(`/post/${post._id}`)}>
                        <Group wrap="nowrap" align="flex-start">
                            <Text size="lg" fw={700} c="dimmed" style={{ width: 20 }}>{index + 1}</Text>
                            <Stack gap={4} style={{ flex: 1 }}>
                                <Text size="sm" fw={600} lineClamp={2}>
                                    {post.plainContent}
                                </Text>
                                <Group gap="xs">
                                    <Indicator
                                        inline
                                        size={8}
                                        offset={2}
                                        position="bottom-end"
                                        color="green"
                                        withBorder
                                        disabled={!post.author?.isOnline}
                                        processing={post.author?.isOnline}
                                    >
                                        <Avatar src={post.author?.profilePic} size={16} radius="xl" />
                                    </Indicator>
                                    <Text size="xs" c="dimmed">{post.author?.username}</Text>
                                    <Group gap={2}>
                                        <IconHeart size={12} />
                                        <Text size="xs">{post.likes.length}</Text>
                                    </Group>
                                </Group>
                            </Stack>
                            {post.mediaUrl && (
                                <Image src={post.mediaUrl} w={50} h={50} radius="md" />
                            )}
                        </Group>
                    </UnstyledButton>
                ))}
            </Stack>
        </Paper>
    );
};

export default TrendingPosts;
