import {
    Container, Title, Paper, Center, Box
} from '@mantine/core';
import api from '../api/axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PostForm from '../components/PostForm';
import { useCreatePost, useUpdatePost } from '../hooks/usePosts';

const CreatePost = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams(); // Get post ID if editing
    const [fetching, setFetching] = useState(!!id); // Fetching state if editing
    const [initialData, setInitialData] = useState(null);

    // Mutations
    const createPostMutation = useCreatePost();
    const updatePostMutation = useUpdatePost();

    const loading = createPostMutation.isPending || updatePostMutation.isPending;

    // Fetch existing post if editing
    useEffect(() => {
        if (id) {
            const fetchPost = async () => {
                try {
                    const { data } = await api.get(`/blogs/${id}`);
                    setInitialData({
                        content: data.content,
                        mood: data.mood,
                        tags: data.tags.join(', '), // Assuming PostForm expects a comma-separated string
                        displayMode: data.displayMode,
                        isAnonymous: data.isAnonymous,
                        imageUrl: data.mediaUrl || '',
                        image: null // No file object when fetching from backend
                    });
                } catch (error) {
                    console.error('Error fetching post:', error);
                    alert('Could not fetch post details');
                    navigate('/public-feed');
                } finally {
                    setFetching(false);
                }
            };
            fetchPost();
        } else {
            if (location.state?.prompt) {
                setInitialData({
                    content: `<p><strong>${location.state.prompt}</strong></p><p></p>`,
                    mood: 'Thoughtful',
                    tags: 'DailyChallenge, DilKiBaat'
                });
            }
            // If not editing, ensure fetching is false immediately
            setFetching(false);
        }
    }, [id, navigate, location.state]);

    const handleSubmit = async (formData) => {
        // formData is already populated by PostForm

        const options = {
            onSuccess: () => {
                navigate('/public-feed');
                // Ensure cache is invalidated by the hook
            }
        };

        if (id) {
            updatePostMutation.mutate({ id, formData }, options);
        } else {
            createPostMutation.mutate(formData, options);
        }
    };

    return (
        <Box w="100%" px={0} py={{ base: 4, sm: 'md' }} style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            <PostForm
                initialData={initialData}
                onSubmit={handleSubmit}
                submitLabel={id ? 'Update Post' : 'Post My Thoughts'}
                loading={loading}
                isLoading={fetching}
            />
        </Box>
    );
};

export default CreatePost;
