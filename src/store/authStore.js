import { create } from 'zustand';
import api from '../api/axios';

const getInitialUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
};

const initialToken = localStorage.getItem('token');
const initialUser = getInitialUser();

const useAuthStore = create((set) => ({
    user: initialUser,
    // Only block with loading if a token exists but user details are not yet hydrated
    loading: !!initialToken && !initialUser,
    error: null,

    // Initialize auth state & validate session against backend
    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            localStorage.removeItem('user');
            set({ user: null, loading: false });
            return;
        }

        try {
            const { data } = await api.get('/auth/profile');
            // Ensure token is attached to user object if returned
            const userWithToken = { ...data, token };
            localStorage.setItem('user', JSON.stringify(userWithToken));
            set({ user: userWithToken, loading: false, error: null });
        } catch (error) {
            console.error("Auth check failed:", error);
            // If session is expired/invalid, purge stored credentials
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({ user: null, loading: false });
            } else {
                // If it's a transient network error, keep hydrated user so offline/slow network doesn't kick them out
                set({ loading: false });
            }
        }
    },

    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            set({ user: data, loading: false, error: null });
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
            localStorage.setItem('user', JSON.stringify(data));
            set({ user: data, loading: false, error: null });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            set({ error: message, loading: false });
            throw new Error(message);
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, loading: false, error: null });
    },

    updateUser: (userData) => {
        set((state) => {
            const updated = { ...state.user, ...userData };
            localStorage.setItem('user', JSON.stringify(updated));
            return { user: updated };
        });
    },
}));

export default useAuthStore;
