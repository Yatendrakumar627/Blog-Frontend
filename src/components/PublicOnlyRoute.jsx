import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Center, Loader } from '@mantine/core';

/**
 * PublicOnlyRoute / GuestRoute
 * Prevents authenticated users from accessing guest-only auth pages
 * (e.g. /login, /register, /forgot-password, /reset-password).
 * If already logged in, seamlessly redirects to /public-feed or their intended destination.
 */
const PublicOnlyRoute = ({ children }) => {
    const { user, loading } = useAuthStore();
    const location = useLocation();

    if (loading) {
        return (
            <Center style={{ height: '60vh' }}>
                <Loader color="pink" type="bars" />
            </Center>
        );
    }

    if (user) {
        const from = location.state?.from?.pathname || '/public-feed';
        return <Navigate to={from} replace />;
    }

    return children;
};

export default PublicOnlyRoute;
