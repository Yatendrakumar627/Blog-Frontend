import {
    Title, Button, Group, FileInput, Checkbox, TextInput, Box, Text, Image,
    Paper, ActionIcon, Stack, SegmentedControl, Chip, Tooltip, SimpleGrid, Center,
    Transition, Collapse, useMantineColorScheme, Menu, Divider, rem, Skeleton
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { X, Upload, Link as LinkIcon, Sparkles } from 'lucide-react';
import { RichTextEditor, Link as MantineLink } from '@mantine/tiptap';
import Underline from '@tiptap/extension-underline';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Select, ColorPicker, Popover } from '@mantine/core';
import { IconMoodSmile, IconMoodSad, IconMoodEmpty, IconHeart, IconRocket, IconMoodAngry, IconHash, IconPhoto, IconLink, IconFeather, IconQuote, IconAlignLeft, IconAlignCenter, IconAlignRight, IconAlignJustified, IconTextIncrease, IconTextDecrease, IconSpacingVertical, IconArrowBarToDown, IconArrowBarToUp, IconCheck, IconPalette } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOODS = [
    { value: 'Happy', icon: IconMoodSmile, color: 'yellow', label: 'Happy' },
    { value: 'Excited', icon: IconRocket, color: 'orange', label: 'Excited' },
    { value: 'Thoughtful', icon: IconMoodEmpty, color: 'violet', label: 'Thoughtful' },
    { value: 'Healing', icon: IconHeart, color: 'pink', label: 'Healing' },
    { value: 'Sad', icon: IconMoodSad, color: 'blue', label: 'Sad' },
    { value: 'Angry', icon: IconMoodAngry, color: 'red', label: 'Angry' },
];

const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return {
            types: ['textStyle'],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            };
                        },
                    },
                },
            },
        ];
    },
});

const LineHeight = Extension.create({
    name: 'lineHeight',
    addOptions() {
        return {
            types: ['paragraph', 'heading'],
            defaultLineHeight: 'normal',
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    lineHeight: {
                        default: this.options.defaultLineHeight,
                        parseHTML: element => element.style.lineHeight || this.options.defaultLineHeight,
                        renderHTML: attributes => {
                            if (!attributes.lineHeight) return {};
                            return {
                                style: `line-height: ${attributes.lineHeight}`,
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setLineHeight: (lineHeight) => ({ commands }) => {
                return this.options.types
                    .map(type => commands.updateAttributes(type, { lineHeight }))
                    .some(result => result);
            },
            unsetLineHeight: () => ({ commands }) => {
                return this.options.types
                    .map(type => commands.resetAttributes(type, 'lineHeight'))
                    .some(result => result);
            },
        };
    },
});

const ParagraphSpacing = Extension.create({
    name: 'paragraphSpacing',
    addOptions() {
        return {
            types: ['paragraph', 'heading'],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    marginTop: {
                        default: null,
                        parseHTML: element => element.style.marginTop || null,
                        renderHTML: attributes => {
                            if (!attributes.marginTop) return {};
                            return {
                                style: `margin-top: ${attributes.marginTop}`,
                            };
                        },
                    },
                    marginBottom: {
                        default: null,
                        parseHTML: element => element.style.marginBottom || null,
                        renderHTML: attributes => {
                            if (!attributes.marginBottom) return {};
                            return {
                                style: `margin-bottom: ${attributes.marginBottom}`,
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setMarginTop: (marginTop) => ({ commands }) => {
                return this.options.types
                    .map(type => commands.updateAttributes(type, { marginTop }))
                    .some(result => result);
            },
            setMarginBottom: (marginBottom) => ({ commands }) => {
                return this.options.types
                    .map(type => commands.updateAttributes(type, { marginBottom }))
                    .some(result => result);
            },
        };
    },
});

const PostForm = ({ initialData, onSubmit, onCancel, submitLabel = "Post", loading = false, isLoading = false }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [focusedField, setFocusedField] = useState(null);

    const form = useForm({
        initialValues: {
            content: initialData?.content || '',
            mood: initialData?.mood || 'Thoughtful',
            tags: initialData?.tags || '',
            isAnonymous: initialData?.isAnonymous || false,
            displayMode: initialData?.displayMode || 'Standard',
            image: null,
            imageUrl: initialData?.mediaUrl || '',
            backgroundImage: null,
            backgroundImageUrl: initialData?.backgroundImage || ''
        },
    });

    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Remove the default Link extension from StarterKit
                link: false,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    target: '_blank',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            FontFamily,
            FontSize,
            LineHeight,
            ParagraphSpacing,
            Color,
        ],
        content: initialData?.content || '',
        onUpdate({ editor }) {
            form.setFieldValue('content', editor.getHTML());
        },
        editorProps: {
            attributes: {
                style: `min-height: 150px; padding: 0.75rem; outline: none; color: ${isDark ? 'white' : 'black'};`,
            },
        },
    });

    // Update editor content if initialData changes
    useEffect(() => {
        if (editor && initialData?.content && editor.getHTML() !== initialData.content) {
            editor.commands.setContent(initialData.content);
        }
    }, [initialData?.content, editor]);

    // Handle preview
    useEffect(() => {
        if (form.values.image) {
            const objectUrl = URL.createObjectURL(form.values.image);
            setPreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (form.values.imageUrl) {
            setPreviewUrl(form.values.imageUrl);
        } else {
            setPreviewUrl(null);
        }
    }, [form.values.image, form.values.imageUrl]);

    // Paste handler
    useEffect(() => {
        const handlePaste = (e) => {
            if (e.clipboardData.files.length) {
                const file = e.clipboardData.files[0];
                if (file.type.startsWith('image/')) {
                    form.setFieldValue('image', file);
                    form.setFieldValue('imageUrl', '');
                }
            }
        };
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [form]);

    const clearImage = () => {
        form.setFieldValue('image', null);
        form.setFieldValue('imageUrl', '');
        setPreviewUrl(null);
    };

    const handleSubmitFn = (values) => {
        if (!values.content || values.content === '<p></p>') {
            // Toast notification would be better here, but alert is fail-safe
            return;
        }

        const formData = new FormData();
        Object.keys(values).forEach(key => {
            if (values[key] !== null) formData.append(key, values[key]);
        });
        if (!values.image && !values.imageUrl) formData.append('mediaUrl', '');
        if (!values.backgroundImageUrl) formData.append('backgroundImage', '');

        // Special mapping for file objects if needed, but the loop covers if it's in values
        // Actually, we need to map cleanly:
        const data = new FormData();
        data.append('content', values.content);
        data.append('mood', values.mood);
        data.append('displayMode', values.displayMode);
        data.append('tags', values.tags);
        data.append('isAnonymous', values.isAnonymous);

        if (values.image) data.append('image', values.image);
        else if (values.imageUrl) data.append('mediaUrl', values.imageUrl);
        else data.append('mediaUrl', '');

        if (values.backgroundImageUrl) data.append('backgroundImage', values.backgroundImageUrl);
        else data.append('backgroundImage', '');

        onSubmit(data);
    };

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <Paper
                    radius="lg"
                    p={{ base: 'xs', sm: 'lg' }}
                    withBorder
                    bg={isDark ? "rgba(30, 30, 30, 0.6)" : "rgba(255, 255, 255, 0.7)"}
                    style={{
                        backdropFilter: 'blur(10px)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <Stack gap={{ base: 'sm', sm: 'md' }}>
                        <Box>
                            <Skeleton height={14} width={120} mb={6} radius="xs" />
                            <Skeleton height={200} radius="md" />
                        </Box>
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'xs', md: 'md' }}>
                            <Box>
                                <Skeleton height={14} width={100} mb={6} radius="xs" />
                                <Skeleton height={80} radius="md" />
                            </Box>
                            <Box>
                                <Skeleton height={14} width={80} mb={6} radius="xs" />
                                <Skeleton height={40} radius="md" />
                            </Box>
                        </SimpleGrid>
                        <Skeleton height={40} radius="md" />
                        <Group grow gap="sm">
                            <Skeleton height={36} radius="md" />
                            <Skeleton height={36} radius="md" />
                        </Group>
                        <Group justify="space-between" mt="xs">
                            <Skeleton height={20} width={150} radius="xl" />
                            <Skeleton height={36} width={100} radius="xl" />
                        </Group>
                    </Stack>
                </Paper>
            </motion.div>
        );
    }

    return (
        <form onSubmit={form.onSubmit(handleSubmitFn)}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <Paper
                    radius="lg"
                    p={{ base: 'xs', sm: 'lg' }}
                    withBorder
                    bg={isDark ? "rgba(28, 28, 28, 0.7)" : "rgba(255, 255, 255, 0.8)"}
                    style={{
                        backdropFilter: 'blur(16px)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: isDark ? '0 12px 40px rgba(0, 0, 0, 0.4)' : '0 12px 40px rgba(0, 0, 0, 0.1)',
                        color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-dark-9)'
                    }}
                >
                    <Stack gap={{ base: 'sm', sm: 'md' }}>
                        {/* Editor Section */}
                        <Box>
                            <Text fw={600} mb={6} c={isDark ? "dimmed" : "dark.3"} size="xs" tt="uppercase" ls={1} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Sparkles size={14} /> Express Yourself
                            </Text>
                            <RichTextEditor
                                editor={editor}
                                variant="subtle"
                                style={{
                                    border: focusedField === 'editor' ? '1px solid var(--mantine-color-blue-5)' : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'),
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    transition: 'all 0.25s ease',
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)',
                                    boxShadow: focusedField === 'editor' ? '0 0 0 2px rgba(34, 139, 230, 0.15)' : 'none'
                                }}
                                onFocus={() => setFocusedField('editor')}
                                onBlur={() => setFocusedField(null)}
                            >
                                <RichTextEditor.Toolbar style={{ backgroundColor: 'transparent', borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', padding: '6px' }}>
                                    <Group gap="4px" wrap="wrap" align="center" justify="center">
                                        {/* Row 1: Core Text Styling */}
                                        <RichTextEditor.ControlsGroup>
                                            <RichTextEditor.Bold />
                                            <RichTextEditor.Italic />
                                            <RichTextEditor.Underline />
                                            <RichTextEditor.Link />
                                        </RichTextEditor.ControlsGroup>

                                        <RichTextEditor.ControlsGroup>
                                            <Select
                                                placeholder="Font"
                                                data={[
                                                    { value: 'Great Vibes', label: 'G. Vibes' },
                                                    { value: 'Satisfy', label: 'Satisfy' },
                                                    { value: 'Impact', label: 'Impact' },
                                                    { value: 'Dancing Script', label: 'Dancing' },
                                                    { value: 'Lora', label: 'Lora' },
                                                    { value: 'Playfair Display', label: 'Playfair' },
                                                    { value: 'Arial', label: 'Arial' },
                                                ]}
                                                renderOption={({ option, checked }) => (
                                                    <Group flex="1" gap="xs">
                                                        <Text size="xs" style={{ fontFamily: option.value }}>
                                                            {option.label}
                                                        </Text>
                                                        {checked && <IconCheck style={{ marginInlineStart: 'auto' }} size={10} />}
                                                    </Group>
                                                )}
                                                value={editor?.getAttributes('textStyle').fontFamily || ''}
                                                onChange={(value) => {
                                                    if (value) {
                                                        editor?.chain().focus().setFontFamily(value).run();
                                                    } else {
                                                        editor?.chain().focus().unsetFontFamily().run();
                                                    }
                                                }}
                                                size="xs"
                                                w={90}
                                                styles={{
                                                    input: {
                                                        border: 'none',
                                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                                        color: isDark ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-dark-7)',
                                                        fontSize: '10px',
                                                        height: '24px',
                                                        padding: '0 4px',
                                                        borderRadius: '6px',
                                                        minHeight: '24px'
                                                    },
                                                    dropdown: {
                                                        backgroundColor: isDark ? 'rgba(20, 20, 20, 0.98)' : 'white',
                                                        backdropFilter: 'blur(10px)',
                                                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                                        borderRadius: '8px'
                                                    },
                                                    option: {
                                                        color: isDark ? 'var(--mantine-color-gray-3)' : 'var(--mantine-color-dark-4)',
                                                        fontSize: '11px',
                                                        padding: '4px'
                                                    }
                                                }}
                                            />
                                            <RichTextEditor.Control
                                                onClick={() => {
                                                    const currentSize = editor.getAttributes('textStyle').fontSize;
                                                    let size = 16;
                                                    if (currentSize) {
                                                        size = parseInt(currentSize.replace('px', ''));
                                                    }
                                                    editor.chain().focus().setMark('textStyle', { fontSize: `${size + 2}px` }).run();
                                                }}
                                                aria-label="Increase font size"
                                                title="Increase font size"
                                            >
                                                <IconTextIncrease size={14} stroke={1.5} />
                                            </RichTextEditor.Control>
                                            <RichTextEditor.Control
                                                onClick={() => {
                                                    const currentSize = editor.getAttributes('textStyle').fontSize;
                                                    let size = 16;
                                                    if (currentSize) {
                                                        size = parseInt(currentSize.replace('px', ''));
                                                    }
                                                    if (size > 10) {
                                                        editor.chain().focus().setMark('textStyle', { fontSize: `${size - 2}px` }).run();
                                                    }
                                                }}
                                                aria-label="Decrease font size"
                                                title="Decrease font size"
                                            >
                                                <IconTextDecrease size={14} stroke={1.5} />
                                            </RichTextEditor.Control>
                                        </RichTextEditor.ControlsGroup>

                                        {/* Row 2: Secondary Tools & Para */}
                                        <RichTextEditor.ControlsGroup>
                                            <Popover position="bottom" withArrow shadow="md">
                                                <Popover.Target>
                                                    <RichTextEditor.Control
                                                        aria-label="Text color"
                                                        title="Text color"
                                                    >
                                                        <IconPalette size={14} stroke={1.5} color={editor?.getAttributes('textStyle').color || (isDark ? 'white' : 'black')} />
                                                    </RichTextEditor.Control>
                                                </Popover.Target>
                                                <Popover.Dropdown p="xs">
                                                    <Stack gap="xs">
                                                        <Text size="xs" fw={700}>TEXT COLOR</Text>
                                                        <SimpleGrid cols={5} spacing="xs">
                                                            {[
                                                                '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
                                                                '#FFFF00', '#00FFFF', '#FF00FF', '#C0C0C0', '#808080',
                                                                '#fab005', '#fd7e14', '#fa5252', '#e64980', '#be4bdb',
                                                                '#7950f2', '#4c6ef5', '#228be6', '#15aabf', '#12b886',
                                                            ].map((color) => (
                                                                <ActionIcon
                                                                    key={color}
                                                                    size="sm"
                                                                    onClick={() => editor?.chain().focus().setColor(color).run()}
                                                                    style={{ backgroundColor: color, border: '1px solid rgba(0,0,0,0.1)' }}
                                                                    variant="filled"
                                                                >
                                                                    {editor?.getAttributes('textStyle').color === color && <IconCheck size={10} color={color === '#FFFFFF' ? 'black' : 'white'} />}
                                                                </ActionIcon>
                                                            ))}
                                                        </SimpleGrid>
                                                        <Divider />
                                                        <Button
                                                            variant="subtle"
                                                            size="xs"
                                                            fullWidth
                                                            onClick={() => editor?.chain().focus().unsetColor().run()}
                                                        >
                                                            Reset
                                                        </Button>
                                                    </Stack>
                                                </Popover.Dropdown>
                                            </Popover>
                                            <RichTextEditor.Control
                                                onClick={() => {
                                                    const { from, to, empty } = editor.state.selection;
                                                    if (empty) {
                                                        editor.chain().focus().insertContent('“”').setTextSelection(from + 1).run();
                                                    } else {
                                                        editor.chain().focus().insertContentAt(to, '”').insertContentAt(from, '“').run();
                                                    }
                                                }}
                                                aria-label="Insert quotes"
                                                title="Insert quotes"
                                            >
                                                <IconQuote size={14} stroke={1.5} />
                                            </RichTextEditor.Control>
                                            <RichTextEditor.BulletList />
                                            <Menu shadow="md" width={200} withinPortal>
                                                <Menu.Target>
                                                    <RichTextEditor.Control aria-label="Spacing" title="Spacing">
                                                        <IconSpacingVertical size={14} stroke={1.5} />
                                                    </RichTextEditor.Control>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Label>Line Spacing</Menu.Label>
                                                    {[
                                                        { label: '1.0', value: '1.0' },
                                                        { label: '1.5', value: '1.5' },
                                                        { label: '2.0', value: '2.0' },
                                                    ].map((item) => (
                                                        <Menu.Item
                                                            key={item.value}
                                                            onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).setLineHeight(item.value).run()}
                                                            rightSection={editor.isActive({ lineHeight: item.value }) ? <IconCheck size={12} /> : null}
                                                        >
                                                            {item.label}
                                                        </Menu.Item>
                                                    ))}
                                                    <Divider my="5px" />
                                                    <Menu.Item
                                                        leftSection={<IconArrowBarToDown size={12} />}
                                                        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).setMarginTop('16px').run()}
                                                    >
                                                        Add Space Before
                                                    </Menu.Item>
                                                    <Menu.Item
                                                        leftSection={<IconArrowBarToUp size={12} />}
                                                        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).setMarginBottom('16px').run()}
                                                    >
                                                        Add Space After
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        </RichTextEditor.ControlsGroup>
                                        <RichTextEditor.ControlsGroup>
                                            <RichTextEditor.AlignLeft />
                                            <RichTextEditor.AlignCenter />
                                            <RichTextEditor.AlignRight />
                                            <RichTextEditor.AlignJustify />
                                        </RichTextEditor.ControlsGroup>
                                    </Group>
                                </RichTextEditor.Toolbar>
                                <RichTextEditor.Content />
                            </RichTextEditor>
                        </Box>

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'xs', md: 'md' }}>
                            {/* Mood Selection */}
                            <Box>
                                <Text fw={600} mb={6} c={isDark ? "dimmed" : "dark.3"} size="xs" tt="uppercase" ls={1}>Vibe Check</Text>
                                <Paper p="xs" radius="md" bg={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} withBorder style={{ borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                    <Group gap={8} justify="center">
                                        {MOODS.map((mood) => {
                                            const isSelected = form.values.mood === mood.value;
                                            return (
                                                <Tooltip key={mood.value} label={mood.label} withArrow position="top">
                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                                        <ActionIcon
                                                            variant={isSelected ? 'gradient' : 'subtle'}
                                                            gradient={{ from: mood.color, to: 'pink', deg: 45 }}
                                                            size="lg"
                                                            radius="xl"
                                                            onClick={() => form.setFieldValue('mood', mood.value)}
                                                            style={{
                                                                opacity: isSelected ? 1 : 0.7,
                                                                transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
                                                                border: isSelected ? 'none' : (isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)'),
                                                                color: isSelected ? 'white' : (isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-dark-4)'),
                                                                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                                                                boxShadow: isSelected ? `0 0 15px var(--mantine-color-${mood.color}-9)` : 'none'
                                                            }}
                                                        >
                                                            <mood.icon size={20} />
                                                        </ActionIcon>
                                                    </motion.div>
                                                </Tooltip>
                                            );
                                        })}
                                    </Group>
                                    <Text ta="center" size="xs" c={MOODS.find(m => m.value === form.values.mood)?.color || (isDark ? 'dimmed' : 'dimmed')} mt={4} fw={700}>
                                        {form.values.mood}
                                    </Text>
                                </Paper>
                            </Box>

                            {/* Display Mode */}
                            <Box>
                                <Text fw={600} mb={6} c={isDark ? "dimmed" : "dark.3"} size="xs" tt="uppercase" ls={1}>Format</Text>
                                <SegmentedControl
                                    value={form.values.displayMode}
                                    onChange={(val) => form.setFieldValue('displayMode', val)}
                                    fullWidth
                                    size="sm"
                                    radius="md"
                                    data={[
                                        { label: <Group gap={4} justify="center"><IconAlignLeft size={14} /> Normal</Group>, value: 'Standard' },
                                        { label: <Group gap={4} justify="center"><IconQuote size={14} /> Poetry</Group>, value: 'Poetry' },
                                        { label: <Group gap={4} justify="center"><IconFeather size={14} /> Shayari</Group>, value: 'Shayari' },
                                    ]}
                                    styles={{
                                        root: { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)' },
                                        indicator: {
                                            background: 'linear-gradient(45deg, #4dabf7, #da77f2)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                        },
                                        label: {
                                            color: isDark ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-dark-9)',
                                            fontWeight: 600,
                                            fontSize: '13px'
                                        },
                                        control: {
                                            border: 'none !important'
                                        }
                                    }}
                                />
                            </Box>
                        </SimpleGrid>

                        {/* Tags */}
                        <TextInput
                            label={<Text fw={600} mb={4} c={isDark ? "dimmed" : "dark.3"} size="xs" tt="uppercase" ls={1}>Tags</Text>}
                            placeholder="#healing, #hope, #life"
                            leftSection={<IconHash size={14} />}
                            {...form.getInputProps('tags')}
                            radius="md"
                            size="sm"
                            variant="filled"
                            styles={{
                                input: {
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                                    color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-dark-9)',
                                    borderRadius: '10px'
                                }
                            }}
                        />

                        {/* Media Section */}
                        <Box>
                            <Text fw={600} mb={6} c={isDark ? "dimmed" : "dark.3"} size="xs" tt="uppercase" ls={1}>Media</Text>
                            <Group grow gap="sm">
                                <FileInput
                                    placeholder="Upload Image"
                                    leftSection={<Upload size={14} />}
                                    accept="image/*"
                                    radius="md"
                                    size="sm"
                                    variant="filled"
                                    clearable
                                    {...form.getInputProps('image')}
                                    onChange={(file) => {
                                        form.setFieldValue('image', file);
                                        form.setFieldValue('imageUrl', '');
                                    }}
                                    styles={{
                                        input: {
                                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                                            color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-dark-9)',
                                            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                                            borderRadius: '10px'
                                        },
                                        placeholder: {
                                            color: isDark ? 'var(--mantine-color-gray-6)' : 'var(--mantine-color-gray-5)'
                                        }
                                    }}
                                />
                                <TextInput
                                    placeholder="Or paste image URL"
                                    leftSection={<LinkIcon size={14} />}
                                    radius="md"
                                    size="sm"
                                    variant="filled"
                                    {...form.getInputProps('imageUrl')}
                                    onChange={(e) => {
                                        form.setFieldValue('imageUrl', e.target.value);
                                        form.setFieldValue('image', null);
                                    }}
                                    styles={{
                                        input: {
                                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                                            color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-dark-9)',
                                            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                                            borderRadius: '10px'
                                        },
                                        placeholder: {
                                            color: isDark ? 'var(--mantine-color-gray-6)' : 'var(--mantine-color-gray-5)'
                                        }
                                    }}
                                />
                            </Group>

                            {/* Background Image - Conditional */}
                            <Collapse in={form.values.displayMode === 'Poetry' || form.values.displayMode === 'Shayari'}>
                                <TextInput
                                    mt="sm"
                                    label={<Text size="xs" c="dimmed" tt="uppercase">Background URL (Optional)</Text>}
                                    placeholder="https://example.com/bg.jpg"
                                    leftSection={<IconPhoto size={14} />}
                                    radius="md"
                                    size="sm"
                                    variant="filled"
                                    {...form.getInputProps('backgroundImageUrl')}
                                    styles={{
                                        input: {
                                            backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                                            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                                            color: isDark ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-dark-9)',
                                            borderRadius: '10px'
                                        }
                                    }}
                                />
                            </Collapse>
                        </Box>

                        <AnimatePresence>
                            {previewUrl && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <Paper
                                        withBorder
                                        radius="md"
                                        p="xs"
                                        pos="relative"
                                        bg="rgba(0,0,0,0.2)"
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <Image
                                            src={previewUrl}
                                            alt="Preview"
                                            radius="sm"
                                            h={200}
                                            fit="contain"
                                        />
                                        <ActionIcon
                                            color="red"
                                            variant="filled"
                                            radius="xl"
                                            size="sm"
                                            pos="absolute"
                                            top={8}
                                            right={8}
                                            onClick={clearImage}
                                        >
                                            <X size={14} />
                                        </ActionIcon>
                                    </Paper>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Group justify="space-between" align="center" mt="xs">
                            <Checkbox
                                label="Post Anonymously"
                                checked={form.values.isAnonymous}
                                {...form.getInputProps('isAnonymous', { type: 'checkbox' })}
                                styles={{ label: { cursor: 'pointer', userSelect: 'none', fontSize: '13px' } }}
                            />
                            <Group>
                                {onCancel && (
                                    <Button variant="subtle" color="gray" onClick={onCancel} size="sm">Cancel</Button>
                                )}
                                <Button
                                    type="submit"
                                    size="sm"
                                    radius="xl"
                                    loading={loading}
                                    gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
                                    variant="gradient"
                                    style={{
                                        boxShadow: '0 4px 15px rgba(34, 184, 207, 0.3)',
                                        transition: 'transform 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    {submitLabel}
                                </Button>
                            </Group>
                        </Group>
                    </Stack>
                </Paper>
            </motion.div>
        </form>
    );
};

export default PostForm;
