import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

// Fetch profile data for logged-in users viewing other profiles
const fetchProfile = async ({ queryKey }) => {
    const [_, userId] = queryKey;
    if (!userId) return null;
    const { data } = await api.get(`/auth/profile-view/${userId}`);
    return data;
};

export const useProfile = (userId) => {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: fetchProfile,
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
    });
};
