import { Stack, Title, Group, Text, Paper, Avatar, Textarea, ActionIcon, Indicator } from '@mantine/core';
import AppLoader from './AppLoader';
import { Send, Trash2 } from 'lucide-react'; // Added Trash2 import for future delete capability
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const CommentSection = ({ blogId }) => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState('');

    const fetchComments = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/comments/${blogId}`);
            setComments(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (blogId) {
            fetchComments();
        }
    }, [blogId]);

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const { data } = await api.post('/comments', { content: commentText, blogId });
            setComments([data, ...comments]); // Prepend new comment
            setCommentText('');
        } catch (error) {
            console.error(error);
            // Optionally show notification
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        try {
            await api.delete(`/comments/${commentId}`);
            setComments(comments.filter(c => c._id !== commentId));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Stack mt="xl" gap="md">
            <Title order={4}>Comments ({comments.length})</Title>

            {/* Comment Form */}
            {user ? (
                <Paper p="sm" radius="md" withBorder>
                    <form onSubmit={handleComment}>
                        <Group align="flex-start" gap="xs">
                            <Avatar src={user?.profilePic} size="sm" radius="xl" />
                            <Textarea
                                placeholder="Write a comment..."
                                variant="unstyled"
                                autosize
                                minRows={1}
                                maxRows={4}
                                style={{ flex: 1 }}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleComment(e);
                                    }
                                }}
                            />
                            <ActionIcon
                                variant="subtle"
                                color="blue"
                                type="submit"
                                disabled={!commentText.trim()}
                            >
                                <Send size={18} />
                            </ActionIcon>
                        </Group>
                    </form>
                </Paper>
            ) : (
                <Text c="dimmed" size="sm" ta="center">Login to join the conversation.</Text>
            )}

            {/* Comments List */}
            {loading ? (
                <AppLoader centered size="sm" />
            ) : comments.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="sm">No comments yet. Be the first to share your thoughts!</Text>
            ) : (
                <Stack gap="md">
                    {comments.map((c) => (
                        <Paper key={c._id} p="sm" radius="md" bg="var(--mantine-color-gray-0)">
                            <Group wrap="nowrap" align="flex-start">
                                <Indicator
                                    inline
                                    size={10}
                                    offset={2}
                                    position="bottom-end"
                                    color="green"
                                    withBorder
                                    disabled={!c.author?.isOnline}
                                    processing={c.author?.isOnline}
                                >
                                    <Avatar
                                        src={c.author?.profilePic}
                                        radius="xl"
                                        size="sm"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/profile/${c.author?.username}`)}
                                    />
                                </Indicator>
                                <div style={{ flex: 1 }}>
                                    <Group justify="space-between" mb={4}>
                                        <Group gap="xs">
                                            <Text
                                                size="sm"
                                                fw={600}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => navigate(`/profile/${c.author?.username}`)}
                                            >
                                                {c.author?.username || 'Unknown'}
                                            </Text>
                                            <Text size="xs" c="dimmed">•</Text>
                                            <Text size="xs" c="dimmed">{dayjs(c.createdAt).fromNow()}</Text>
                                        </Group>

                                        {user && c.author && String(user._id) === String(c.author._id || c.author) && (
                                            <ActionIcon
                                                variant="subtle"
                                                color="red"
                                                size="sm"
                                                onClick={() => handleDeleteComment(c._id)}
                                                title="Delete comment"
                                            >
                                                <Trash2 size={14} />
                                            </ActionIcon>
                                        )}
                                    </Group>
                                    <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>
                                        {c.content}
                                    </Text>
                                </div>
                            </Group>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Stack>
    );
};

export default CommentSection;
