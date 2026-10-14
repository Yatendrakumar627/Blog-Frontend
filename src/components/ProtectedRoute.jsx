import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Center, Loader } from '@mantine/core';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <Center style={{ height: '60vh' }}>
        <Loader color="pink" type="bars" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
