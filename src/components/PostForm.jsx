import {
    Title, Button, Group, FileInput, Checkbox, TextInput, Box, Text, Image,
    Paper, ActionIcon, Stack, SegmentedControl, Chip, Tooltip, SimpleGrid, Center,
    Transition, Collapse, useMantineColorScheme, Menu, Divider, rem
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
import { Select } from '@mantine/core';
import { IconMoodSmile, IconMoodSad, IconMoodEmpty, IconHeart, IconRocket, IconMoodAngry, IconHash, IconPhoto, IconLink, IconFeather, IconQuote, IconAlignLeft, IconAlignCenter, IconAlignRight, IconAlignJustified, IconTextIncrease, IconTextDecrease, IconSpacingVertical, IconArrowBarToDown, IconArrowBarToUp, IconCheck } from '@tabler/icons-react';
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

const PostForm = ({ initialData, onSubmit, onCancel, submitLabel = "Post", loading = false }) => {
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
            Underline,
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
                    bg={isDark ? "rgba(30, 30, 30, 0.6)" : "rgba(255, 255, 255, 0.7)"}
                    style={{
                        backdropFilter: 'blur(10px)',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
                        boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)' : '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                        color: isDark ? 'white' : 'black'
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
                                    border: focusedField === 'editor' ? '1px solid var(--mantine-color-blue-500)' : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'),
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)'
                                }}
                                onFocus={() => setFocusedField('editor')}
                                onBlur={() => setFocusedField(null)}
                            >
                                <RichTextEditor.Toolbar style={{ backgroundColor: 'transparent', borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', padding: '4px' }}>
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
                                                { value: 'Dancing Script', label: 'Dancing Script' },
                                                { value: 'Great Vibes', label: 'Great Vibes' },
                                                { value: 'Satisfy', label: 'Satisfy' },
                                                { value: 'Merriweather', label: 'Merriweather' },
                                                { value: 'Arial', label: 'Arial' },
                                                { value: 'Times New Roman', label: 'Times New Roman' },
                                                { value: 'Georgia', label: 'Georgia' },
                                                { value: 'Courier New', label: 'Courier New' },
                                                { value: 'Verdana', label: 'Verdana' },
                                                { value: 'Comic Sans MS', label: 'Comic Sans MS' },
                                                { value: 'Impact', label: 'Impact' },
                                                { value: 'Trebuchet MS', label: 'Trebuchet MS' },
                                                { value: 'Palatino', label: 'Palatino' },
                                                { value: 'Tahoma', label: 'Tahoma' },
                                            ]}
                                            value={editor?.getAttributes('textStyle').fontFamily || ''}
                                            onChange={(value) => {
                                                if (value) {
                                                    editor?.chain().focus().setFontFamily(value).run();
                                                } else {
                                                    editor?.chain().focus().unsetFontFamily().run();
                                                }
                                            }}
                                            size="xs"
                                            w={120}
                                            styles={{
                                                input: {
                                                    border: 'none',
                                                    backgroundColor: 'transparent',
                                                    color: isDark ? 'white' : 'black',
                                                    fontSize: '12px',
                                                    height: '28px',
                                                    padding: '0 8px'
                                                },
                                                dropdown: {
                                                    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'white',
                                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'
                                                },
                                                option: {
                                                    color: isDark ? 'white' : 'black'
                                                }
                                            }}
                                        />
                                    </RichTextEditor.ControlsGroup>
                                    <RichTextEditor.ControlsGroup>
                                        <RichTextEditor.Control
                                            onClick={() => {
                                                const currentSize = editor.getAttributes('textStyle').fontSize;
                                                let size = 16; // default
                                                if (currentSize) {
                                                    size = parseInt(currentSize.replace('px', ''));
                                                }
                                                editor.chain().focus().setMark('textStyle', { fontSize: `${size + 2}px` }).run();
                                            }}
                                            aria-label="Increase font size"
                                            title="Increase font size"
                                        >
                                            <IconTextIncrease size={16} stroke={1.5} />
                                        </RichTextEditor.Control>
                                        <RichTextEditor.Control
                                            onClick={() => {
                                                const currentSize = editor.getAttributes('textStyle').fontSize;
                                                let size = 16; // default
                                                if (currentSize) {
                                                    size = parseInt(currentSize.replace('px', ''));
                                                }
                                                // Prevent going too small, e.g., below 10px
                                                if (size > 10) {
                                                    editor.chain().focus().setMark('textStyle', { fontSize: `${size - 2}px` }).run();
                                                }
                                            }}
                                            aria-label="Decrease font size"
                                            title="Decrease font size"
                                        >
                                            <IconTextDecrease size={16} stroke={1.5} />
                                        </RichTextEditor.Control>
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
                                            <IconQuote size={16} stroke={1.5} />
                                        </RichTextEditor.Control>
                                        <RichTextEditor.BulletList />
                                    </RichTextEditor.ControlsGroup>
                                    <RichTextEditor.ControlsGroup>
                                        <Menu shadow="md" width={250} withinPortal>
                                            <Menu.Target>
                                                <RichTextEditor.Control aria-label="Line & Paragraph Spacing" title="Line & Paragraph Spacing">
                                                    <IconSpacingVertical size={16} stroke={1.5} />
                                                </RichTextEditor.Control>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Label>Line Spacing</Menu.Label>
                                                {[
                                                    { label: '1.0', value: '1.0' },
                                                    { label: '1.15', value: '1.15' },
                                                    { label: '1.5', value: '1.5' },
                                                    { label: '2.0', value: '2.0' },
                                                    { label: '2.5', value: '2.5' },
                                                    { label: '3.0', value: '3.0' },
                                                ].map((item) => (
                                                    <Menu.Item
                                                        key={item.value}
                                                        onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).setLineHeight(item.value).run()}
                                                        rightSection={editor.isActive({ lineHeight: item.value }) ? <IconCheck size={14} /> : null}
                                                    >
                                                        {item.label}
                                                    </Menu.Item>
                                                ))}
                                                <Divider my="xs" />
                                                <Menu.Label>Paragraph Spacing</Menu.Label>
                                                <Menu.Item
                                                    leftSection={<IconArrowBarToDown size={14} />}
                                                    onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).setMarginTop('0').run()}
                                                    color="red"
                                                >
                                                    Remove Space Before Paragraph
                                                </Menu.Item>
                                                <Menu.Item
                                                    leftSection={<IconArrowBarToDown size={14} />}
                                                    onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).setMarginTop('16px').run()}
                                                >
                                                    Add Space Before Paragraph
                                                </Menu.Item>
                                                <Menu.Item
                                                    leftSection={<IconArrowBarToUp size={14} />}
                                                    onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).setMarginBottom('0').run()}
                                                    color="red"
                                                >
                                                    Remove Space After Paragraph
                                                </Menu.Item>
                                                <Menu.Item
                                                    leftSection={<IconArrowBarToUp size={14} />}
                                                    onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).setMarginBottom('16px').run()}
                                                >
                                                    Add Space After Paragraph
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
                                                                opacity: isSelected ? 1 : 0.5,
                                                                transition: 'all 0.2s',
                                                                border: isSelected ? 'none' : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'),
                                                                color: isDark ? undefined : (isSelected ? 'white' : 'black')
                                                            }}
                                                        >
                                                            <mood.icon size={18} />
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
                                        root: { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)' },
                                        indicator: {
                                            background: 'linear-gradient(45deg, #4dabf7, #da77f2)',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                        },
                                        label: { color: isDark ? 'white' : 'black', fontWeight: 500 }
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
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                    border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.1)',
                                    color: isDark ? 'white' : 'black'
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
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                            color: isDark ? 'white' : 'black',
                                            border: isDark ? undefined : '1px solid rgba(0,0,0,0.1)'
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
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                            color: isDark ? 'white' : 'black',
                                            border: isDark ? undefined : '1px solid rgba(0,0,0,0.1)'
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
                                    styles={{ input: { backgroundColor: 'rgba(255,255,255,0.03)' } }}
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
