import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Anchor, Stack, Alert, Box, LoadingOverlay } from '@mantine/core';
import { useForm } from '@mantine/form';
import useAuthStore from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IconInfoCircle, IconMail, IconLock } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const Login = () => {
    const { login, loading: authLoading } = useAuthStore();
    const navigate = useNavigate();
    const [emailExists, setEmailExists] = useState(true);

    const form = useForm({
        initialValues: { email: '', password: '' },
        validate: {
            email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Invalid email'),
        },
    });

    // Reset alert when email changes
    useEffect(() => {
        if (!emailExists) {
            setEmailExists(true);
        }
    }, [form.values.email]);

    const handleSubmit = async (values) => {
        try {
            await login(values.email, values.password);
            navigate('/');
        } catch (error) {
            const errorMessage = error.message || 'Login failed';
            if (errorMessage === 'create the account') {
                setEmailExists(false);
            } else if (errorMessage === 'wrong user/password') {
                form.setFieldError('password', 'Incorrect password');
            } else {
                form.setErrors({ email: errorMessage, password: errorMessage });
            }
        }
    };

    return (
        <Container size={420} my={80}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                        marginBottom: '1rem'
                    }}
                >
                    Welcome back!
                </Title>

                <Paper withBorder shadow="xl" p={30} mt={30} radius="lg" style={{ position: 'relative', overflow: 'hidden' }}>
                    <LoadingOverlay visible={authLoading} overlayProps={{ blur: 2 }} />
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="md">
                            <TextInput
                                label="Email"
                                placeholder="you@example.com"
                                required
                                leftSection={<IconMail size={18} stroke={1.5} />}
                                {...form.getInputProps('email')}
                                error={form.errors.email}
                                styles={{ input: { transition: 'border-color 0.2s ease' } }}
                            />

                            <AnimatePresence>
                                {!emailExists && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Alert
                                            icon={<IconInfoCircle size={20} />}
                                            title="This email isn't registered yet."
                                            color="blue"
                                            radius="md"
                                            variant="light"
                                        >
                                            <Text size="sm" mb="sm">
                                                Create a new account to continue.
                                            </Text>
                                            <Button
                                                component={Link}
                                                to="/register"
                                                variant="filled"
                                                size="xs"
                                                radius="md"
                                            >
                                                Create a new account
                                            </Button>
                                        </Alert>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <PasswordInput
                                label="Password"
                                placeholder="Your password"
                                required
                                leftSection={<IconLock size={18} stroke={1.5} />}
                                {...form.getInputProps('password')}
                                styles={{ input: { transition: 'border-color 0.2s ease' } }}
                            />

                            <Button
                                fullWidth
                                mt="xl"
                                type="submit"
                                size="md"
                                radius="md"
                                loading={authLoading}
                                disabled={!emailExists}
                                style={{
                                    background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
                                    border: 0,
                                    transition: 'transform 0.2s ease'
                                }}
                                className="login-button"
                            >
                                Sign in
                            </Button>
                        </Stack>
                    </form>
                </Paper>

                <Box mt="xl" style={{ textAlign: 'center' }}>
                    <Text size="sm" c="dimmed">
                        Already have an account?{' '}
                        <Anchor component={Link} to="/register" size="sm" fw={700}>
                            Sign up
                        </Anchor>
                    </Text>
                </Box>
            </motion.div>
        </Container>
    );
};

export default Login;
