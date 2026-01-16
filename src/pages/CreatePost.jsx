import {
    Container, Title, Paper, Center
} from '@mantine/core';
import api from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PostForm from '../components/PostForm';
import { useCreatePost, useUpdatePost } from '../hooks/usePosts';

const CreatePost = () => {
    const navigate = useNavigate();
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
            // If not editing, ensure fetching is false immediately
            setFetching(false);
        }
    }, [id, navigate]);

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
        <Container fluid px={0} mt={{ base: 'xs', sm: 'xl' }}>
            <Title order={2} mb="lg" ta="center" fw={900} variant="gradient" gradient={{ from: 'blue', to: 'cyan', deg: 90 }}>
                {id ? 'Edit Post' : 'Share your Dil Ki Baat'}
            </Title>

            <PostForm
                initialData={initialData}
                onSubmit={handleSubmit}
                submitLabel={id ? 'Update Post' : 'Post My Thoughts'}
                loading={loading}
                isLoading={fetching}
            />
        </Container>
    );
};

export default CreatePost;
