import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../api/axios';
import { notifications } from '@mantine/notifications';
import useAuthStore from '../store/authStore';

// Fetch functions
const fetchPosts = async ({ queryKey, pageParam = 1 }) => {
    const [_, { type, search, likedBy, author, savedBy, limit }] = queryKey;
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (search) params.append('search', search);
    if (likedBy) params.append('likedBy', likedBy);
    if (author) params.append('author', author);
    if (savedBy) params.append('savedBy', savedBy);
    if (queryKey[1].startDate) params.append('startDate', queryKey[1].startDate);
    if (queryKey[1].endDate) params.append('endDate', queryKey[1].endDate);
    params.append('page', pageParam);
    params.append('limit', limit || '10');

    const { data } = await api.get(`/blogs?${params.toString()}`);
    return data;
};

const fetchUser = async ({ queryKey }) => {
    const [_, userId] = queryKey;
    if (!userId) return null;
    const { data } = await api.get(`/auth/public/${userId}`);
    return data;
};

export const useUser = (userId) => {
    return useQuery({
        queryKey: ['user', userId],
        queryFn: fetchUser,
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const usePosts = (filters) => {
    // Treat null filters as disabled query? Or just empty?
    // If filters is null, we shouldn't fetch probably.
    return useInfiniteQuery({
        queryKey: ['posts', filters || {}], // Ensure queryKey is always serializable
        queryFn: fetchPosts,
        enabled: !!filters, // Only run if filters exist
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5, // 5 minutes
        getNextPageParam: (lastPage) => {
            if (lastPage.hasMore) {
                return lastPage.currentPage + 1;
            }
            return undefined;
        },
        initialPageParam: 1,
    });
};

export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newPost) => {
            const { data } = await api.post('/blogs', newPost, {
                headers: { 'Content-Type': 'multipart/form-data' } // Important for file uploads
            });
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            if (data.author) {
                queryClient.invalidateQueries({ queryKey: ['user', typeof data.author === 'object' ? data.author._id : data.author] });
            }
            notifications.show({ title: 'Success', message: 'Post created successfully!', color: 'green' });
        },
        onError: (error) => {
            notifications.show({ title: 'Error', message: error.response?.data?.message || 'Failed to create post', color: 'red' });
        }
    });
};

export const useUpdatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, formData }) => {
            const { data } = await api.put(`/blogs/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            notifications.show({ title: 'Success', message: 'Post updated successfully!', color: 'green' });
        },
        onError: (error) => {
            notifications.show({ title: 'Error', message: error.response?.data?.message || 'Failed to update post', color: 'red' });
        }
    });
};

export const useLikePost = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (postId) => {
            const { data } = await api.put(`/blogs/${postId}/like`);
            return data;
        },
        onMutate: async (postId) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['posts'] });

            // Snapshot previous value
            const previousPosts = queryClient.getQueriesData({ queryKey: ['posts'] });

            // Optimistically update
            queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
                if (!old) return old;
                // old is an infinite query data object with pages
                return {
                    ...old,
                    pages: old.pages.map(page => ({
                        ...page,
                        blogs: page.blogs.map(blog => {
                            if (blog._id === postId) {
                                const isLiked = blog.likes.includes(user?._id);
                                let newLikes = [...blog.likes];
                                if (isLiked) {
                                    newLikes = newLikes.filter(id => id !== user?._id);
                                } else if (user?._id) {
                                    newLikes.push(user._id);
                                }
                                return { ...blog, likes: newLikes };
                            }
                            return blog;
                        })
                    }))
                };
            });

            return { previousPosts };
        },
        onError: (err, newTodo, context) => {
            // Rollback
            if (context?.previousPosts) {
                context.previousPosts.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSuccess: (data, postId) => {
            // We can optimize this later, but invalidation is safest for now to sync everything
            // queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });
};
