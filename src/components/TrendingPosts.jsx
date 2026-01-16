import { Paper, Text, Stack, Group, Avatar, Image, Title, Skeleton, UnstyledButton, Indicator } from '@mantine/core';
import { IconTrendingUp, IconHeart } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

const TrendingPosts = ({ posts }) => {
    const navigate = useNavigate();

    if (!posts || posts.length === 0) return null;



    return (
        <Paper p="md" radius="md" withBorder>
            <Group mb="md">
                <IconTrendingUp size={20} color="#339af0" />
                <Title order={5}>Trending Now</Title>
            </Group>
            <Stack gap="sm">
                {posts.map((post, index) => (
                    <UnstyledButton key={post._id} onClick={() => navigate(`/post/${post._id}`)}>
                        <Group wrap="nowrap" align="flex-start">
                            <Text size="lg" fw={700} c="dimmed" style={{ width: 20 }}>{index + 1}</Text>
                            <Stack gap={4} style={{ flex: 1 }}>
                                <Text size="sm" fw={600} lineClamp={2}>
                                    {post.content.replace(/<[^>]+>/g, '') /* Basic strip HTML */}
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
