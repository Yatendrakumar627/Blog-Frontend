import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Stack, Anchor, Box, LoadingOverlay } from '@mantine/core';
import AppLoader from '../components/AppLoader';
import { useForm } from '@mantine/form';
import useAuthStore from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IconCheck, IconX, IconUser, IconMail, IconLock, IconSignature } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const Register = () => {
    const { register, loading: authLoading } = useAuthStore();
    const navigate = useNavigate();
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [usernameError, setUsernameError] = useState('');

    const form = useForm({
        initialValues: { username: '', email: '', password: '', displayName: '' },
        validate: {
            username: (value) => {
                if (!value) return 'Username is required';
                if (value.length < 3) return 'Username must be at least 3 characters';
                if (value.length > 20) return 'Username must be less than 20 characters';
                if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
                if (usernameError) return usernameError;
                return null;
            },
            displayName: (value) => {
                if (value && value.length > 50) return 'Display name must be less than 50 characters';
                return null;
            },
            email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Invalid email'),
            password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
        },
    });

    // Check username availability
    const checkUsernameAvailability = async (username) => {
        if (!username || username.length < 3) {
            setUsernameAvailable(null);
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setUsernameAvailable(false);
            return;
        }

        setCheckingUsername(true);
        try {
            const { data } = await api.get(`/auth/check-username/${encodeURIComponent(username)}`);
            setUsernameAvailable(data.available);
            setUsernameError(data.available ? '' : 'Username is already taken');
            if (!data.available) {
                form.setFieldError('username', 'Username is already taken');
            } else if (form.errors.username === 'Username is already taken') {
                form.clearFieldError('username');
            }
        } catch (error) {
            setUsernameAvailable(null);
        } finally {
            setCheckingUsername(false);
        }
    };

    // Debounced username check
    useEffect(() => {
        const timer = setTimeout(() => {
            if (form.values.username && form.values.username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(form.values.username)) {
                checkUsernameAvailability(form.values.username);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [form.values.username]);

    const handleSubmit = async (values) => {
        try {
            if (usernameAvailable === false) {
                form.setFieldError('username', 'Username is already taken');
                return;
            }

            await register(values.username, values.email, values.password, values.displayName);
            navigate('/');
        } catch (error) {
            const errorMessage = error.message || 'Registration failed';
            if (errorMessage.toLowerCase().includes('username')) {
                form.setFieldError('username', errorMessage);
            } else if (errorMessage.toLowerCase().includes('email')) {
                form.setFieldError('email', errorMessage);
            } else {
                form.setErrors({ username: errorMessage, email: errorMessage });
            }
        }
    };

    return (
        <Container size={500} my={40}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Title
                    align="center"
                    style={{
                        fontFamily: 'Greycliff CF, sans-serif',
                        fontWeight: 900,
                        background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontSize: '2.5rem'
                    }}
                >
                    Join Dil Ki Baatein
                </Title>
                <Text c="dimmed" size="sm" ta="center" mt={5}>
                    Create your account to start sharing your thoughts
                </Text>

                <Paper withBorder shadow="xl" p={30} mt={30} radius="lg" style={{ position: 'relative', overflow: 'hidden' }}>
                    <LoadingOverlay visible={authLoading} overlayProps={{ blur: 2 }} />
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="md">
                            <TextInput
                                label="Username"
                                placeholder="Choose a unique username"
                                required
                                leftSection={<IconUser size={18} stroke={1.5} />}
                                {...form.getInputProps('username')}
                                error={form.errors.username || (usernameAvailable === false && 'Username is already taken')}
                                rightSection={
                                    checkingUsername ? (
                                        <AppLoader size="xs" />
                                    ) : usernameAvailable === true ? (
                                        <IconCheck size={16} color="green" />
                                    ) : usernameAvailable === false ? (
                                        <IconX size={16} color="red" />
                                    ) : null
                                }
                                description="Unique identifier (letters, numbers, underscores)"
                                styles={{ input: { transition: 'border-color 0.2s ease' } }}
                            />

                            <TextInput
                                label="Display Name (Optional)"
                                placeholder="How others will see you"
                                leftSection={<IconSignature size={18} stroke={1.5} />}
                                {...form.getInputProps('displayName')}
                                styles={{ input: { transition: 'border-color 0.2s ease' } }}
                            />

                            <TextInput
                                label="Email"
                                placeholder="you@example.com"
                                required
                                leftSection={<IconMail size={18} stroke={1.5} />}
                                {...form.getInputProps('email')}
                                styles={{ input: { transition: 'border-color 0.2s ease' } }}
                            />

                            <PasswordInput
                                label="Password"
                                placeholder="Choose a strong password"
                                required
                                leftSection={<IconLock size={18} stroke={1.5} />}
                                {...form.getInputProps('password')}
                                description="Must be at least 6 characters"
                                styles={{ input: { transition: 'border-color 0.2s ease' } }}
                            />

                            <Button
                                fullWidth
                                type="submit"
                                mt="xl"
                                size="md"
                                radius="md"
                                loading={authLoading}
                                style={{
                                    background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
                                    border: 0,
                                    transition: 'transform 0.2s ease'
                                }}
                                className="signup-button"
                            >
                                Sign up
                            </Button>
                        </Stack>
                    </form>
                </Paper>

                <Box mt="xl" style={{ textAlign: 'center' }}>
                    <Text size="sm" c="dimmed">
                        Already have an account?{' '}
                        <Anchor component={Link} to="/login" size="sm" fw={700}>
                            Login
                        </Anchor>
                    </Text>
                </Box>
            </motion.div>
        </Container>
    );
};

export default Register;
