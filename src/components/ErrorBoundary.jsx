import React from 'react';
import { Container, Title, Text, Button, Stack, Paper, Group, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconRefresh, IconHome } from '@tabler/icons-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // You can log the error to an error reporting service here
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <Container size="sm" py={80}>
                    <Paper
                        radius="lg"
                        p="xl"
                        withBorder
                        style={{
                            textAlign: 'center',
                            backdropFilter: 'blur(10px)',
                            backgroundColor: 'light-dark(rgba(255,255,255,0.9), rgba(26,27,30,0.9))',
                        }}
                    >
                        <Stack align="center" gap="lg">
                            <ThemeIcon
                                size={80}
                                radius="xl"
                                variant="light"
                                color="red"
                                style={{ opacity: 0.9 }}
                            >
                                <IconAlertTriangle size={40} />
                            </ThemeIcon>

                            <Stack gap="xs" align="center">
                                <Title order={2} c="red.6">
                                    Something went wrong
                                </Title>
                                <Text c="dimmed" size="md" maw={400}>
                                    An unexpected error occurred. Don't worry — your data is safe. 
                                    Try refreshing or going back to the home page.
                                </Text>
                            </Stack>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <Paper
                                    p="md"
                                    radius="md"
                                    withBorder
                                    style={{
                                        width: '100%',
                                        textAlign: 'left',
                                        maxHeight: 200,
                                        overflow: 'auto',
                                        backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))',
                                    }}
                                >
                                    <Text size="xs" ff="monospace" c="red">
                                        {this.state.error.toString()}
                                    </Text>
                                    {this.state.errorInfo && (
                                        <Text size="xs" ff="monospace" c="dimmed" mt="xs">
                                            {this.state.errorInfo.componentStack?.slice(0, 500)}
                                        </Text>
                                    )}
                                </Paper>
                            )}

                            <Group>
                                <Button
                                    variant="light"
                                    color="blue"
                                    leftSection={<IconRefresh size={16} />}
                                    onClick={this.handleReset}
                                    radius="xl"
                                >
                                    Try Again
                                </Button>
                                <Button
                                    variant="gradient"
                                    gradient={{ from: 'pink', to: 'violet' }}
                                    leftSection={<IconHome size={16} />}
                                    onClick={this.handleGoHome}
                                    radius="xl"
                                >
                                    Go Home
                                </Button>
                            </Group>
                        </Stack>
                    </Paper>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
