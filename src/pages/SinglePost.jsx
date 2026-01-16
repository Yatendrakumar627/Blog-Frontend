import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Center } from '@mantine/core';
import AppLoader from '../components/AppLoader';
import api from '../api/axios';
import BlogCard from '../components/BlogCard';
import { notifications } from '@mantine/notifications';

const SinglePost = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const { data } = await api.get(`/blogs/${id}`);
                setBlog(data);
            } catch (error) {
                console.error(error);
                notifications.show({ title: 'Error', message: 'Post not found', color: 'red' });
                navigate('/public-feed');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBlog();
        }
    }, [id, navigate]);

    if (loading) return <AppLoader centered height="50vh" />;
    if (!blog) return null;

    return (
        <Container size="md" py="xl">
            <BlogCard blog={blog} />
        </Container>
    );
};

export default SinglePost;
