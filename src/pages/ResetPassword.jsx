import { PasswordInput, Button, Paper, Title, Container, Text, Stack, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { IconLock, IconCheck, IconX } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import api from '../api/axios';

const ResetPassword = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const form = useForm({
        initialValues: { password: '', confirmPassword: '' },
        validate: {
            password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
            confirmPassword: (value, values) =>
                value !== values.password ? 'Passwords do not match' : null,
        },
    });

    const handleSubmit = async (values) => {
        if (!token) {
            setError('Invalid or missing reset token.');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            await api.post('/auth/reset-password', {
                token,
                newPassword: values.password
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. The link might have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <Container size={420} my={80}>
                <Paper withBorder shadow="xl" p={30} radius="lg">
                    <Stack align="center" gap="md">
                        <IconX size={50} color="red" />
                        <Title order={3}>Invalid Link</Title>
                        <Text size="sm" c="dimmed" ta="center">
                            This password reset link is invalid or missing the required token.
                        </Text>
                        <Button component={Link} to="/forgot-password" variant="light" mt="md" fullWidth>
                            Request New Link
                        </Button>
                    </Stack>
                </Paper>
            </Container>
        );
    }

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
                    Create New Password
                </Title>

                <Paper withBorder shadow="xl" p={30} mt={30} radius="lg">
                    {success ? (
                        <Stack align="center" gap="md">
                            <Alert
                                icon={<IconCheck size={20} />}
                                title="Password Updated"
                                color="green"
                                radius="md"
                                variant="light"
                                style={{ width: '100%' }}
                            >
                                <Text size="sm">
                                    Your password has been successfully reset. Redirecting to login...
                                </Text>
                            </Alert>
                            <Button component={Link} to="/login" variant="light" radius="md" fullWidth>
                                Go to Login
                            </Button>
                        </Stack>
                    ) : (
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Stack gap="md">
                                {error && (
                                    <Alert icon={<IconX size={16} />} color="red" variant="light" p="sm">
                                        {error}
                                    </Alert>
                                )}

                                <Text size="sm" c="dimmed" ta="center" mb="sm">
                                    Please enter your new password below.
                                </Text>

                                <PasswordInput
                                    label="New Password"
                                    placeholder="Strong password"
                                    required
                                    leftSection={<IconLock size={18} stroke={1.5} />}
                                    {...form.getInputProps('password')}
                                    styles={{ input: { transition: 'border-color 0.2s ease' } }}
                                />

                                <PasswordInput
                                    label="Confirm Password"
                                    placeholder="Type it again"
                                    required
                                    leftSection={<IconLock size={18} stroke={1.5} />}
                                    {...form.getInputProps('confirmPassword')}
                                    styles={{ input: { transition: 'border-color 0.2s ease' } }}
                                />

                                <Button
                                    fullWidth
                                    type="submit"
                                    size="md"
                                    radius="md"
                                    loading={loading}
                                    mt="md"
                                    style={{
                                        background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
                                        border: 0,
                                    }}
                                >
                                    Reset Password
                                </Button>
                            </Stack>
                        </form>
                    )}
                </Paper>
            </motion.div>
        </Container>
    );
};

export default ResetPassword;
