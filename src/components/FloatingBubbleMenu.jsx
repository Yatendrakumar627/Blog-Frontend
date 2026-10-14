import React, { useState, useEffect, useRef } from 'react';
import {
    Paper, Group, ActionIcon, Divider, Popover, TextInput, Button,
    SimpleGrid, Tooltip, Box, Menu, Text, ScrollArea
} from '@mantine/core';
import {
    IconBold, IconItalic, IconUnderline, IconLink, IconQuote,
    IconAlignCenter, IconAlignLeft, IconPalette, IconH1, IconH2,
    IconCheck, IconTypography, IconTextIncrease, IconTextDecrease
} from '@tabler/icons-react';
import { FONT_FAMILIES } from '../constants/typography';

const SWATCHES = [
    '#FFFFFF', '#fa5252', '#fd7e14', '#fab005', '#12b886',
    '#228be6', '#7950f2', '#be4bdb', '#e64980', '#000000'
];

const FloatingBubbleMenu = ({ editor }) => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [linkUrl, setLinkUrl] = useState('');
    const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
    const [fontMenuOpen, setFontMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!editor) return;

        const updatePosition = () => {
            const { state, view } = editor;
            const { selection } = state;

            if (selection.empty) {
                setVisible(false);
                return;
            }

            // Get viewport coordinates of the selection
            const { from, to } = selection;
            const startCoord = view.coordsAtPos(from);
            const endCoord = view.coordsAtPos(to);

            // Compute center of selection
            const left = (startCoord.left + endCoord.right) / 2;
            const top = Math.min(startCoord.top, endCoord.top) - 52; // 52px above

            // Keep in bounds
            const safeLeft = Math.max(10, Math.min(window.innerWidth - 380, left - 180));
            const safeTop = Math.max(10, top);

            setPosition({ top: safeTop, left: safeLeft });
            setVisible(true);
        };

        editor.on('selectionUpdate', updatePosition);
        editor.on('blur', () => {
            // Keep visible if popovers are open
            if (!linkPopoverOpen && !fontMenuOpen) {
                setTimeout(() => {
                    if (!document.activeElement?.closest('.floating-bubble-menu')) {
                        setVisible(false);
                    }
                }, 150);
            }
        });

        return () => {
            editor.off('selectionUpdate', updatePosition);
        };
    }, [editor, linkPopoverOpen, fontMenuOpen]);

    if (!visible || !editor) return null;

    const handleSetLink = () => {
        if (linkUrl.trim()) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim(), target: '_blank' }).run();
        } else {
            editor.chain().focus().unsetLink().run();
        }
        setLinkPopoverOpen(false);
        setLinkUrl('');
    };

    const handleApplyFont = (fontFamily) => {
        if (fontFamily) {
            editor.chain().focus().setFontFamily(fontFamily).run();
        } else {
            editor.chain().focus().unsetFontFamily().run();
        }
    };

    const handleIncreaseFontSize = () => {
        const currentSize = editor.getAttributes('textStyle').fontSize;
        let size = currentSize ? parseInt(currentSize.replace('px', '')) : 16;
        if (size < 48) {
            editor.chain().focus().setMark('textStyle', { fontSize: `${size + 2}px` }).run();
        }
    };

    const handleDecreaseFontSize = () => {
        const currentSize = editor.getAttributes('textStyle').fontSize;
        let size = currentSize ? parseInt(currentSize.replace('px', '')) : 16;
        if (size > 12) {
            editor.chain().focus().setMark('textStyle', { fontSize: `${size - 2}px` }).run();
        }
    };

    const currentFont = editor.getAttributes('textStyle').fontFamily || '';
    const currentColor = editor.getAttributes('textStyle').color || '#FFFFFF';

    return (
        <Paper
            ref={menuRef}
            className="floating-bubble-menu"
            shadow="xl"
            radius="xl"
            px={8}
            py={4}
            style={{
                position: 'fixed',
                top: `${position.top}px`,
                left: `${position.left}px`,
                zIndex: 1100,
                backgroundColor: 'rgba(18, 18, 22, 0.94)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(77, 171, 247, 0.15)',
                display: 'flex',
                alignItems: 'center',
                transition: 'top 0.1s ease, left 0.1s ease'
            }}
        >
            <Group gap={4} wrap="nowrap">
                {/* Font Family Menu */}
                <Menu
                    opened={fontMenuOpen}
                    onChange={setFontMenuOpen}
                    position="top"
                    withArrow
                    shadow="xl"
                    width={240}
                >
                    <Menu.Target>
                        <Tooltip label={currentFont ? `Font: ${currentFont}` : "Font Type"} position="top" withArrow>
                            <ActionIcon
                                size="sm"
                                variant={currentFont ? 'filled' : 'subtle'}
                                color={currentFont ? 'violet' : 'gray'}
                            >
                                <IconTypography size={14} />
                            </ActionIcon>
                        </Tooltip>
                    </Menu.Target>
                    <Menu.Dropdown
                        p={6}
                        style={{
                            backgroundColor: 'rgba(20, 20, 26, 0.98)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.12)'
                        }}
                    >
                        <Menu.Label>Selected Text Typography</Menu.Label>
                        <ScrollArea.Autosize mah={260}>
                            {FONT_FAMILIES.map((group) => (
                                <Box key={group.category} mb={6}>
                                    <Text size="10px" fw={700} c="dimmed" px="xs" py={2} tt="uppercase">
                                        {group.category}
                                    </Text>
                                    {group.fonts.map((f) => (
                                        <Menu.Item
                                            key={f.value}
                                            onClick={() => handleApplyFont(f.value)}
                                            rightSection={currentFont === f.value ? <IconCheck size={12} color="#4dabf7" /> : null}
                                            style={{
                                                padding: '4px 8px',
                                                borderRadius: '6px'
                                            }}
                                        >
                                            <Text
                                                size="sm"
                                                style={{
                                                    fontFamily: `${f.value}, serif`,
                                                    color: currentFont === f.value ? '#4dabf7' : 'inherit'
                                                }}
                                            >
                                                {f.label}
                                            </Text>
                                        </Menu.Item>
                                    ))}
                                </Box>
                            ))}
                        </ScrollArea.Autosize>
                        <Divider my={4} color="rgba(255,255,255,0.08)" />
                        <Menu.Item
                            color="red"
                            onClick={() => handleApplyFont('')}
                            style={{ fontSize: '11px' }}
                        >
                            Reset to Default Font
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>

                {/* Font Size Adjusters */}
                <Tooltip label="Smaller Text" position="top" withArrow>
                    <ActionIcon size="sm" variant="subtle" color="gray" onClick={handleDecreaseFontSize}>
                        <IconTextDecrease size={13} />
                    </ActionIcon>
                </Tooltip>
                <Tooltip label="Larger Text" position="top" withArrow>
                    <ActionIcon size="sm" variant="subtle" color="gray" onClick={handleIncreaseFontSize}>
                        <IconTextIncrease size={13} />
                    </ActionIcon>
                </Tooltip>

                <Divider orientation="vertical" my={4} color="rgba(255,255,255,0.15)" />

                {/* Bold */}
                <Tooltip label="Bold" position="top" withArrow>
                    <ActionIcon
                        size="sm"
                        variant={editor.isActive('bold') ? 'filled' : 'subtle'}
                        color={editor.isActive('bold') ? 'blue' : 'gray'}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <IconBold size={14} />
                    </ActionIcon>
                </Tooltip>

                {/* Italic */}
                <Tooltip label="Italic" position="top" withArrow>
                    <ActionIcon
                        size="sm"
                        variant={editor.isActive('italic') ? 'filled' : 'subtle'}
                        color={editor.isActive('italic') ? 'blue' : 'gray'}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <IconItalic size={14} />
                    </ActionIcon>
                </Tooltip>

                {/* Underline */}
                <Tooltip label="Underline" position="top" withArrow>
                    <ActionIcon
                        size="sm"
                        variant={editor.isActive('underline') ? 'filled' : 'subtle'}
                        color={editor.isActive('underline') ? 'blue' : 'gray'}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                    >
                        <IconUnderline size={14} />
                    </ActionIcon>
                </Tooltip>

                <Divider orientation="vertical" my={4} color="rgba(255,255,255,0.15)" />

                {/* Heading 1 */}
                <Tooltip label="Heading 1" position="top" withArrow>
                    <ActionIcon
                        size="sm"
                        variant={editor.isActive('heading', { level: 1 }) ? 'filled' : 'subtle'}
                        color="cyan"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    >
                        <IconH1 size={14} />
                    </ActionIcon>
                </Tooltip>

                {/* Heading 2 */}
                <Tooltip label="Heading 2" position="top" withArrow>
                    <ActionIcon
                        size="sm"
                        variant={editor.isActive('heading', { level: 2 }) ? 'filled' : 'subtle'}
                        color="cyan"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    >
                        <IconH2 size={14} />
                    </ActionIcon>
                </Tooltip>

                {/* Poetry / Center Align */}
                <Tooltip label="Center / Poetry Style" position="top" withArrow>
                    <ActionIcon
                        size="sm"
                        variant={editor.isActive({ textAlign: 'center' }) ? 'filled' : 'subtle'}
                        color="pink"
                        onClick={() => {
                            if (editor.isActive({ textAlign: 'center' })) {
                                editor.chain().focus().setTextAlign('left').run();
                            } else {
                                editor.chain().focus().setTextAlign('center').run();
                            }
                        }}
                    >
                        <IconAlignCenter size={14} />
                    </ActionIcon>
                </Tooltip>

                {/* Quote */}
                <Tooltip label="Blockquote" position="top" withArrow>
                    <ActionIcon
                        size="sm"
                        variant={editor.isActive('blockquote') ? 'filled' : 'subtle'}
                        color="violet"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    >
                        <IconQuote size={14} />
                    </ActionIcon>
                </Tooltip>

                <Divider orientation="vertical" my={4} color="rgba(255,255,255,0.15)" />

                {/* Text Color Popover */}
                <Popover position="top" withArrow shadow="md">
                    <Popover.Target>
                        <Tooltip label="Text Color" position="top" withArrow>
                            <ActionIcon size="sm" variant="subtle" color="gray">
                                <IconPalette size={14} color={currentColor} />
                            </ActionIcon>
                        </Tooltip>
                    </Popover.Target>
                    <Popover.Dropdown p="xs" style={{ backgroundColor: 'rgba(20,20,24,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <SimpleGrid cols={5} spacing={6}>
                            {SWATCHES.map((color) => (
                                <ActionIcon
                                    key={color}
                                    size="sm"
                                    onClick={() => editor.chain().focus().setColor(color).run()}
                                    style={{
                                        backgroundColor: color,
                                        border: currentColor === color ? '2px solid #339af0' : '1px solid rgba(255,255,255,0.2)'
                                    }}
                                >
                                    {currentColor === color && <IconCheck size={10} color={color === '#FFFFFF' ? 'black' : 'white'} />}
                                </ActionIcon>
                            ))}
                        </SimpleGrid>
                    </Popover.Dropdown>
                </Popover>

                {/* Link Popover */}
                <Popover
                    opened={linkPopoverOpen}
                    onChange={setLinkPopoverOpen}
                    position="top"
                    withArrow
                    shadow="md"
                >
                    <Popover.Target>
                        <Tooltip label="Link" position="top" withArrow>
                            <ActionIcon
                                size="sm"
                                variant={editor.isActive('link') ? 'filled' : 'subtle'}
                                color={editor.isActive('link') ? 'blue' : 'gray'}
                                onClick={() => setLinkPopoverOpen((o) => !o)}
                            >
                                <IconLink size={14} />
                            </ActionIcon>
                        </Tooltip>
                    </Popover.Target>
                    <Popover.Dropdown p="xs" style={{ backgroundColor: 'rgba(20,20,24,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Group gap="xs">
                            <TextInput
                                placeholder="https://..."
                                size="xs"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSetLink()}
                                autoFocus
                            />
                            <Button size="xs" variant="filled" color="blue" onClick={handleSetLink}>
                                Apply
                            </Button>
                        </Group>
                    </Popover.Dropdown>
                </Popover>
            </Group>
        </Paper>
    );
};

export default FloatingBubbleMenu;
