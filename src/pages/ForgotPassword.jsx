import { TextInput, Button, Paper, Title, Container, Text, Stack, Anchor, Box, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconMail, IconInfoCircle, IconCheck } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import api from '../api/axios';

const ForgotPassword = () => {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const form = useForm({
        initialValues: { email: '' },
        validate: {
            email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Invalid email'),
        },
    });

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email: values.email });
            setSent(true);
        } catch (error) {
            // Always show success to not leak whether email exists
            setSent(true);
        } finally {
            setLoading(false);
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
                    Reset Password
                </Title>

                <Paper withBorder shadow="xl" p={30} mt={30} radius="lg">
                    {sent ? (
                        <Stack align="center" gap="md">
                            <Alert
                                icon={<IconCheck size={20} />}
                                title="Check your email"
                                color="green"
                                radius="md"
                                variant="light"
                            >
                                <Text size="sm">
                                    If an account with that email exists, we&apos;ve sent a password reset link.
                                    Check your inbox and spam folder.
                                </Text>
                            </Alert>
                            <Button component={Link} to="/login" variant="light" radius="md" fullWidth>
                                Back to Login
                            </Button>
                        </Stack>
                    ) : (
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Stack gap="md">
                                <Text size="sm" c="dimmed" ta="center">
                                    Enter your email address and we&apos;ll send you a link to reset your password.
                                </Text>

                                <TextInput
                                    label="Email"
                                    placeholder="you@example.com"
                                    required
                                    leftSection={<IconMail size={18} stroke={1.5} />}
                                    {...form.getInputProps('email')}
                                    styles={{ input: { transition: 'border-color 0.2s ease' } }}
                                />

                                <Button
                                    fullWidth
                                    type="submit"
                                    size="md"
                                    radius="md"
                                    loading={loading}
                                    style={{
                                        background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
                                        border: 0,
                                    }}
                                >
                                    Send Reset Link
                                </Button>
                            </Stack>
                        </form>
                    )}
                </Paper>

                <Box mt="xl" style={{ textAlign: 'center' }}>
                    <Text size="sm" c="dimmed">
                        Remember your password?{' '}
                        <Anchor component={Link} to="/login" size="sm" fw={700}>
                            Login
                        </Anchor>
                    </Text>
                </Box>
            </motion.div>
        </Container>
    );
};

export default ForgotPassword;
