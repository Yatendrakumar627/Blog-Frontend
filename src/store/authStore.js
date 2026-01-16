import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    error: null,

    // Initialize auth state (check local storage)
    checkAuth: async () => {
        set({ loading: true });
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const { data } = await api.get('/auth/profile');
                set({ user: data, loading: false });
            } catch (error) {
                console.error("Auth check failed:", error);
                localStorage.removeItem('token');
                set({ user: null, loading: false });
            }
        } else {
            set({ user: null, loading: false });
        }
    },

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            set({ user: data, loading: false });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            set({ error: message, loading: false });
            throw new Error(message);
        }
    },

    register: async (username, email, password, displayName = null) => {
        set({ loading: true, error: null });
        try {
            const { data } = await api.post('/auth/register', { username, email, password, displayName });
            localStorage.setItem('token', data.token);
            set({ user: data, loading: false });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            set({ error: message, loading: false });
            throw new Error(message);
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null });
    },

    updateUser: (userData) => {
        set((state) => ({ user: { ...state.user, ...userData } }));
    },
}));

export default useAuthStore;
