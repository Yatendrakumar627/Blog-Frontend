import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Container, LoadingOverlay, Box } from '@mantine/core';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import PageNavigation from './components/PageNavigation';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import useAuthStore from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';

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
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const queryClient = new QueryClient();

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    style={{ height: '100%', width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
  >
    <Suspense fallback={<LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} loaderProps={{ color: 'pink', type: 'bars' }} />}>
      {children}
    </Suspense>
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
            <Home />
          </PageTransition>
        } />
        <Route path="/login" element={
          <PageTransition>
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          </PageTransition>
        } />
        <Route path="/register" element={
          <PageTransition>
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          </PageTransition>
        } />
        <Route path="/forgot-password" element={
          <PageTransition>
            <PublicOnlyRoute>
              <ForgotPassword />
            </PublicOnlyRoute>
          </PageTransition>
        } />
        <Route path="/reset-password" element={
          <PageTransition>
            <PublicOnlyRoute>
              <ResetPassword />
            </PublicOnlyRoute>
          </PageTransition>
        } />
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
            <Profile />
          </PageTransition>
        } />
        <Route path="/post/:id" element={
          <PageTransition>
            <SinglePost />
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

const AppContent = () => {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat');

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        height: isChat ? '100dvh' : 'auto',
        overflowY: isChat ? 'hidden' : 'visible',
        overflowX: 'hidden',
        width: '100%',
        maxWidth: '100vw'
      }}
    >
      <Navbar />
      {isChat ? (
        <Box
          component="main"
          style={{
            flex: 1,
            minHeight: 0,
            width: '100%',
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: 'calc(58px + env(safe-area-inset-bottom, 0px))',
            overflow: 'hidden'
          }}
        >
          <AnimatedRoutes />
        </Box>
      ) : (
        <Container
          px={{ base: 6, sm: 'md' }}
          mt={{ base: 'xs', sm: 'md' }}
          pb={80}
          size="md"
          style={{
            width: '100%',
            overflowX: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          <AnimatedRoutes />
        </Container>
      )}
      <PageNavigation />
    </Box>
  );
};

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <AppContent />
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
