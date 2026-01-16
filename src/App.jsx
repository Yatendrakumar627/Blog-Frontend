import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Container, LoadingOverlay } from '@mantine/core';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import PageNavigation from './components/PageNavigation';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthStore from './store/authStore';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const CreatePost = lazy(() => import('./pages/CreatePost'));
const Profile = lazy(() => import('./pages/Profile'));
const UserPosts = lazy(() => import('./pages/UserPosts'));
const Explore = lazy(() => import('./pages/Explore'));
const SinglePost = lazy(() => import('./pages/SinglePost'));
const Settings = lazy(() => import('./pages/Settings'));
const Chat = lazy(() => import('./pages/Chat'));

const queryClient = new QueryClient();

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/public-feed" replace />} />
        <Route path="/public-feed" element={
          <PageTransition>
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/post" element={
          <PageTransition>
            <ProtectedRoute>
              <UserPosts />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/create-post" element={
          <PageTransition>
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/edit-post/:id" element={
          <PageTransition>
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/explore" element={
          <PageTransition>
            <ProtectedRoute>
              <Explore />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/profile" element={
          <PageTransition>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/profile/:username" element={
          <PageTransition>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/post/:id" element={
          <PageTransition>
            <ProtectedRoute>
              <SinglePost />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/settings" element={
          <PageTransition>
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          </PageTransition>
        } />
        <Route path="/chat" element={
          <PageTransition>
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Navbar />
        <PageNavigation />
        <Container px="md" mt="md">
          <Suspense fallback={<LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'pink', type: 'bars' }} />}>
            <AnimatedRoutes />
          </Suspense>
        </Container>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
