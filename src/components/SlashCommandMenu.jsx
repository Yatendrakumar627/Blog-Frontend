import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Paper, Stack, Group, Text, Box, ActionIcon, UnstyledButton } from '@mantine/core';
import {
    IconH1, IconH2, IconH3, IconQuote, IconList, IconListNumbers,
    IconSparkles, IconFeather, IconMinus, IconTypography, IconCrown
} from '@tabler/icons-react';

export const COMMANDS = [
    {
        id: 'shayari',
        title: 'Shayari Couplet',
        description: 'Dancing Script, centered, emotional rhythm',
        icon: IconFeather,
        color: 'pink',
        action: (editor) => {
            editor.chain().focus()
                .setTextAlign('center')
                .setFontFamily('Dancing Script')
                .setLineHeight('1.6')
                .run();
        }
    },
    {
        id: 'poetry',
        title: 'Poetry Stanza',
        description: 'Playfair Display serif, centered verse style',
        icon: IconTypography,
        color: 'violet',
        action: (editor) => {
            editor.chain().focus()
                .setTextAlign('center')
                .setFontFamily('Playfair Display')
                .setLineHeight('1.8')
                .run();
        }
    },
    {
        id: 'royal',
        title: 'Royal Font (Cinzel)',
        description: 'Regal classical Roman font for majestic lines',
        icon: IconCrown,
        color: 'yellow',
        action: (editor) => {
            editor.chain().focus()
                .setTextAlign('center')
                .setFontFamily('Cinzel')
                .run();
        }
    },
    {
        id: 'modern',
        title: 'Modern Sans (Outfit)',
        description: 'Crisp geometric 2026 clean aesthetic font',
        icon: IconTypography,
        color: 'cyan',
        action: (editor) => {
            editor.chain().focus()
                .setFontFamily('Outfit')
                .run();
        }
    },
    {
        id: 'typewriter',
        title: 'Typewriter (Courier)',
        description: 'Vintage monospace raw diary journal style',
        icon: IconTypography,
        color: 'gray',
        action: (editor) => {
            editor.chain().focus()
                .setFontFamily('Courier New')
                .run();
        }
    },
    {
        id: 'h1',
        title: 'Heading 1',
        description: 'Large title or section opening',
        icon: IconH1,
        color: 'blue',
        action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()
    },
    {
        id: 'h2',
        title: 'Heading 2',
        description: 'Medium subsection title',
        icon: IconH2,
        color: 'cyan',
        action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
    {
        id: 'h3',
        title: 'Heading 3',
        description: 'Subtle paragraph heading',
        icon: IconH3,
        color: 'teal',
        action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()
    },
    {
        id: 'ornament',
        title: 'Ornamental Divider',
        description: 'Aesthetic verse separator (✦ ─── ❦ ─── ✦)',
        icon: IconSparkles,
        color: 'orange',
        action: (editor) => {
            editor.chain().focus()
                .insertContent('<p style="text-align: center; margin: 1.5rem 0; opacity: 0.7; font-size: 1.1rem; letter-spacing: 4px;">✦ ─── ❦ ─── ✦</p><p></p>')
                .run();
        }
    },
    {
        id: 'quote',
        title: 'Dil Ki Baat Quote',
        description: 'Emphasized emotional blockquote',
        icon: IconQuote,
        color: 'violet',
        action: (editor) => editor.chain().focus().toggleBlockquote().run()
    },
    {
        id: 'bullet_list',
        title: 'Bullet List',
        description: 'Simple bulleted list',
        icon: IconList,
        color: 'gray',
        action: (editor) => editor.chain().focus().toggleBulletList().run()
    },
    {
        id: 'ordered_list',
        title: 'Numbered List',
        description: 'Sequential ordered list',
        icon: IconListNumbers,
        color: 'indigo',
        action: (editor) => editor.chain().focus().toggleOrderedList().run()
    },
    {
        id: 'divider',
        title: 'Divider Line',
        description: 'Clean visual horizontal break',
        icon: IconMinus,
        color: 'gray',
        action: (editor) => editor.chain().focus().setHorizontalRule().run()
    }
];

const SlashCommandMenu = ({
    editor,
    isOpen,
    onClose,
    position = { top: 0, left: 0 },
    query = ''
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const menuRef = useRef(null);

    const filtered = COMMANDS.filter(cmd =>
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase()) ||
        cmd.id.includes(query.toLowerCase())
    );

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const executeCommand = useCallback((cmd) => {
        if (!editor) return;
        // Delete the slash trigger character if typed
        const { state } = editor;
        const { from } = state.selection;
        const textBefore = state.doc.textBetween(Math.max(0, from - 20), from, '\n');
        const slashIndex = textBefore.lastIndexOf('/');
        if (slashIndex !== -1) {
            const deleteCount = textBefore.length - slashIndex;
            editor.chain().focus().deleteRange({ from: from - deleteCount, to: from }).run();
        }

        cmd.action(editor);
        onClose();
    }, [editor, onClose]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filtered[selectedIndex]) {
                    executeCommand(filtered[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, filtered, executeCommand, onClose]);

    if (!isOpen || filtered.length === 0) return null;

    return (
        <Paper
            ref={menuRef}
            shadow="xl"
            radius="md"
            withBorder
            p={6}
            style={{
                position: 'absolute',
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex: 1050,
                width: '300px',
                maxHeight: '340px',
                overflowY: 'auto',
                backgroundColor: 'rgba(24, 24, 27, 0.96)',
                backdropFilter: 'blur(16px)',
                borderColor: 'rgba(255, 255, 255, 0.12)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
        >
            <Box px="xs" py={4} mb={4} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Text size="10px" fw={700} tt="uppercase" ls={1} c="dimmed">
                    Insert Block or Typography Style
                </Text>
            </Box>
            <Stack gap={3}>
                {filtered.map((cmd, index) => {
                    const isSelected = index === selectedIndex;
                    const IconComponent = cmd.icon;
                    return (
                        <UnstyledButton
                            key={cmd.id}
                            onClick={() => executeCommand(cmd)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            p="xs"
                            style={{
                                borderRadius: '8px',
                                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                transition: 'background-color 0.15s ease',
                                display: 'block',
                                width: '100%',
                                cursor: 'pointer'
                            }}
                        >
                            <Group gap="sm" wrap="nowrap">
                                <ActionIcon
                                    size="md"
                                    radius="md"
                                    variant={isSelected ? 'filled' : 'light'}
                                    color={cmd.color}
                                >
                                    <IconComponent size={16} />
                                </ActionIcon>
                                <Box style={{ flex: 1, minWidth: 0 }}>
                                    <Text size="xs" fw={600} c={isSelected ? 'white' : 'gray.3'} truncate>
                                        {cmd.title}
                                    </Text>
                                    <Text size="11px" c="dimmed" truncate>
                                        {cmd.description}
                                    </Text>
                                </Box>
                            </Group>
                        </UnstyledButton>
                    );
                })}
            </Stack>
        </Paper>
    );
};

export default SlashCommandMenu;
