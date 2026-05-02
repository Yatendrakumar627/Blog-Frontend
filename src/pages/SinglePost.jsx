import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Center, Group, ActionIcon, Text, Tooltip } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
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

    // SEO: Update document title based on post content
    useEffect(() => {
        if (blog) {
            const plainText = blog.content?.replace(/<[^>]+>/g, '').trim() || '';
            const title = plainText.substring(0, 60) || 'Post';
            document.title = `${title} — Dil Ki Baatein`;

            // Update/create meta description
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.name = 'description';
                document.head.appendChild(metaDesc);
            }
            metaDesc.content = plainText.substring(0, 160);

            // Open Graph tags for link previews
            const ogTags = {
                'og:title': title,
                'og:description': plainText.substring(0, 160),
                'og:type': 'article',
                'og:url': window.location.href,
            };
            if (blog.mediaUrl) {
                ogTags['og:image'] = blog.mediaUrl;
            }

            Object.entries(ogTags).forEach(([property, content]) => {
                let tag = document.querySelector(`meta[property="${property}"]`);
                if (!tag) {
                    tag = document.createElement('meta');
                    tag.setAttribute('property', property);
                    document.head.appendChild(tag);
                }
                tag.content = content;
            });

            return () => {
                document.title = 'Dil Ki Baatein';
            };
        }
    }, [blog]);

    if (loading) return <AppLoader centered height="50vh" />;
    if (!blog) return null;

    return (
        <Container size="md" py="xl">
            <Group mb="md">
                <Tooltip label="Go back" position="right" withArrow>
                    <ActionIcon
                        variant="light"
                        size="lg"
                        radius="xl"
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                    >
                        <IconArrowLeft size={20} />
                    </ActionIcon>
                </Tooltip>
                <Text size="sm" c="dimmed" fw={500}>Back</Text>
            </Group>
            <BlogCard blog={blog} />
        </Container>
    );
};

export default SinglePost;
