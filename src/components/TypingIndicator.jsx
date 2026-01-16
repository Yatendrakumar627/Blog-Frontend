import { motion } from 'framer-motion';
import { Group, Box, Text } from '@mantine/core';

export const TypingIndicator = ({ username }) => {
    return (
        <Group gap={6} align="center" py={4} px={12} style={{ opacity: 0.8 }}>
            <Box style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ y: [0, -6, 0] }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut"
                        }}
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: 'var(--mantine-primary-color-filled)',
                        }}
                    />
                ))}
            </Box>
            <Text size="xs" fw={500} c="dimmed">
                {username} is typing...
            </Text>
        </Group>
    );
};
