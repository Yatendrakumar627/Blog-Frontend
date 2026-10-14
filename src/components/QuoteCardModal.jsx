import React, { useState, useRef } from 'react';
import {
    Modal, Box, Text, Group, Button, SegmentedControl, ActionIcon,
    Stack, Tooltip, Badge, CopyButton, Loader
} from '@mantine/core';
import {
    IconDownload, IconCopy, IconCheck, IconShare, IconSparkles,
    IconHeart, IconMoon, IconSun, IconFeather
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import DOMPurify from 'dompurify';

const THEMES = [
    {
        id: 'midnight',
        name: 'Midnight Aura',
        bg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        textColor: '#f8fafc',
        accentColor: '#38bdf8',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        cardStyle: {
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)',
        }
    },
    {
        id: 'parchment',
        name: 'Royal Poetry',
        bg: 'linear-gradient(135deg, #fdfbf7 0%, #f4ede4 100%)',
        textColor: '#292524',
        accentColor: '#b45309',
        borderColor: 'rgba(180, 83, 9, 0.3)',
        cardStyle: {
            border: '2px solid #e7dfd5',
            boxShadow: '0 15px 30px rgba(60, 40, 20, 0.1)',
            fontFamily: 'Georgia, serif'
        }
    },
    {
        id: 'sunset',
        name: 'Sunset Glow',
        bg: 'linear-gradient(135deg, #4a154b 0%, #9e1c4a 50%, #e06c3a 100%)',
        textColor: '#ffffff',
        accentColor: '#ffd166',
        borderColor: 'rgba(255, 209, 102, 0.4)',
        cardStyle: {
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 20px 40px rgba(158, 28, 74, 0.35)'
        }
    },
    {
        id: 'healing',
        name: 'Emerald Zen',
        bg: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #0f766e 100%)',
        textColor: '#ecfdf5',
        accentColor: '#34d399',
        borderColor: 'rgba(52, 211, 153, 0.3)',
        cardStyle: {
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 20px 40px rgba(4, 120, 87, 0.3)'
        }
    },
    {
        id: 'minimal',
        name: 'Obsidian Minimal',
        bg: '#09090b',
        textColor: '#fafafa',
        accentColor: '#e4e4e7',
        borderColor: 'rgba(255,255,255,0.15)',
        cardStyle: {
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)'
        }
    }
];

const QuoteCardModal = ({
    opened,
    onClose,
    content,
    mood = 'Thoughtful',
    displayMode = 'Standard',
    isAnonymous = false,
    authorName = 'Dil Ki Baat'
}) => {
    const [selectedTheme, setSelectedTheme] = useState('midnight');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const cardRef = useRef(null);

    const theme = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

    // Sanitize HTML
    const sanitizedContent = DOMPurify.sanitize(content || '<p>Write your thoughts...</p>', {
        ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'span', 'br', 'h1', 'h2', 'h3', 'blockquote', 'hr'],
        ALLOWED_ATTR: ['style', 'class']
    });

    const generateCanvas = async () => {
        if (!cardRef.current) return null;
        const html2canvas = (await import('html2canvas')).default;
        return await html2canvas(cardRef.current, {
            scale: 2, // High resolution for Retina/Instagram Story
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false
        });
    };

    const handleDownload = async () => {
        try {
            setIsDownloading(true);
            const canvas = await generateCanvas();
            if (!canvas) return;

            const link = document.createElement('a');
            link.download = `dil-ki-baat-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            notifications.show({
                title: 'Story Card Ready!',
                message: 'Downloaded in ultra-crisp resolution. Share it on Instagram or WhatsApp!',
                color: 'teal',
                icon: <IconCheck size={16} />
            });
        } catch (error) {
            console.error('Download error:', error);
            notifications.show({
                title: 'Export Failed',
                message: 'Unable to render card. Please try again.',
                color: 'red'
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCopyImage = async () => {
        try {
            setIsCopying(true);
            const canvas = await generateCanvas();
            if (!canvas) return;

            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error('Blob generation failed');
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                notifications.show({
                    title: 'Copied to Clipboard!',
                    message: 'Image is ready to paste directly into chats or documents.',
                    color: 'teal',
                    icon: <IconCopy size={16} />
                });
            }, 'image/png');
        } catch (error) {
            console.error('Clipboard copy error:', error);
            notifications.show({
                title: 'Copy Failed',
                message: 'Your browser may restrict copying image data. Try download instead.',
                color: 'yellow'
            });
        } finally {
            setIsCopying(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconSparkles size={18} color="#e64980" />
                    <Text fw={700} size="sm">Export Aesthetic Story & Quote Card</Text>
                    <Badge variant="light" color="pink" size="xs">2026 Ready</Badge>
                </Group>
            }
            size="lg"
            radius="lg"
            centered
            styles={{
                header: { borderBottom: '1px solid rgba(255,255,255,0.08)' },
                body: { padding: '1.25rem' }
            }}
        >
            <Stack gap="md">
                {/* Theme Selector */}
                <Box>
                    <Text size="xs" fw={600} c="dimmed" tt="uppercase" ls={1} mb={6}>
                        Card Aesthetic Theme
                    </Text>
                    <SegmentedControl
                        value={selectedTheme}
                        onChange={setSelectedTheme}
                        fullWidth
                        size="xs"
                        data={THEMES.map(t => ({ label: t.name, value: t.id }))}
                    />
                </Box>

                {/* Live Card Preview */}
                <Box
                    p="md"
                    style={{
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '16px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                    }}
                >
                    <div
                        ref={cardRef}
                        style={{
                            width: '100%',
                            maxWidth: '420px',
                            minHeight: '380px',
                            background: theme.bg,
                            color: theme.textColor,
                            borderRadius: '24px',
                            padding: '2rem 1.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                            overflow: 'hidden',
                            boxSizing: 'border-box',
                            ...theme.cardStyle
                        }}
                    >
                        {/* Background Ornament Glow */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '-20%',
                                right: '-20%',
                                width: '200px',
                                height: '200px',
                                background: theme.accentColor,
                                opacity: 0.12,
                                filter: 'blur(50px)',
                                borderRadius: '50%',
                                pointerEvents: 'none'
                            }}
                        />

                        {/* Top Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    letterSpacing: '1.5px',
                                    textTransform: 'uppercase',
                                    color: theme.accentColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                ✦ Dil Ki Baat
                            </span>
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    padding: '3px 10px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(10px)',
                                    color: theme.textColor,
                                    fontWeight: 500,
                                    border: `1px solid ${theme.borderColor}`
                                }}
                            >
                                {mood} {displayMode !== 'Standard' ? `• ${displayMode}` : ''}
                            </span>
                        </div>

                        {/* Main Content Body */}
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                margin: '1rem 0'
                            }}
                        >
                            <div
                                style={{
                                    fontSize: displayMode === 'Shayari' || displayMode === 'Poetry' ? '1.15rem' : '1.05rem',
                                    lineHeight: '1.7',
                                    textAlign: displayMode === 'Shayari' || displayMode === 'Poetry' ? 'center' : 'left',
                                    fontStyle: displayMode === 'Shayari' ? 'italic' : 'normal',
                                    wordBreak: 'break-word',
                                    opacity: 0.96
                                }}
                                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                            />
                        </div>

                        {/* Bottom Author Signature */}
                        <div
                            style={{
                                borderTop: `1px solid ${theme.borderColor}`,
                                paddingTop: '1rem',
                                marginTop: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div>
                                <span style={{ fontSize: '0.72rem', opacity: 0.65, display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Words by
                                </span>
                                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: theme.accentColor }}>
                                    {isAnonymous ? 'Anonymous Soul' : (authorName || 'Dil Ki Baat Author')}
                                </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', opacity: 0.6, fontStyle: 'italic' }}>
                                dilkibaat.app
                            </span>
                        </div>
                    </div>
                </Box>

                {/* Actions */}
                <Group justify="flex-end" gap="sm">
                    <Button
                        variant="default"
                        size="sm"
                        radius="md"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                    <Button
                        variant="light"
                        color="blue"
                        size="sm"
                        radius="md"
                        leftSection={isCopying ? <Loader size={14} /> : <IconCopy size={16} />}
                        onClick={handleCopyImage}
                        disabled={isDownloading || isCopying}
                    >
                        Copy Card
                    </Button>
                    <Button
                        variant="gradient"
                        gradient={{ from: 'pink', to: 'orange', deg: 45 }}
                        size="sm"
                        radius="md"
                        leftSection={isDownloading ? <Loader size={14} color="white" /> : <IconDownload size={16} />}
                        onClick={handleDownload}
                        disabled={isDownloading || isCopying}
                    >
                        Download PNG
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default QuoteCardModal;
