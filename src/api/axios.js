import axios from 'axios';

const getBaseURL = () => {
    let url = import.meta.env.VITE_API_URL;
    if (!url) {
        url = import.meta.env.PROD
            ? 'https://blog-backend-1-5enc.onrender.com'
            : 'http://localhost:5100';
    }
    // Ensure it ends with /api
    return url.replace(/\/$/, '') + '/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
});

// Add a request interceptor to add the token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle expired tokens
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const token = localStorage.getItem('token');
            // Only auto-logout if user HAD a token (expired session), not on login/register failures
            if (token && !error.config.url?.includes('/auth/login') && !error.config.url?.includes('/auth/register')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
