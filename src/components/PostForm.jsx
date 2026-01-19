import { Title, Button, Group, FileInput, Checkbox, TextInput, Box, Text, Image,
    Paper, ActionIcon, Stack, SegmentedControl, Chip, Tooltip, SimpleGrid, Center,
    Transition, Collapse, useMantineColorScheme, Menu, Divider, rem, Skeleton, Select, ColorPicker, Popover
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { X, Upload, Link as LinkIcon, Sparkles } from 'lucide-react';
import { RichTextEditor, Link as MantineLink } from '@mantine/tiptap';
import Underline from '@tiptap/extension-underline';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
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
            defaultLineHeight: '1.2',
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
                // Configure paragraph spacing
                paragraph: {
                    HTMLAttributes: {
                        class: 'editor-paragraph',
                    },
                },
                // Configure heading spacing
                heading: {
                    HTMLAttributes: {
                        class: 'editor-heading',
                    },
                },
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
        editorProps: {
            attributes: {
                style: `min-height: 150px; padding: 0.75rem; outline: none; color: ${isDark ? 'white' : 'black'};`,
            },
            // Add custom styles for better paragraph spacing
            transformPastedHTML: (html) => {
                // Convert double line breaks to proper paragraphs
                return html.replace(/\n\s*\n/g, '</p><p>').replace(/^(.*)$/, '<p>$1</p>');
            },
        },
        onUpdate({ editor }) {
            form.setFieldValue('content', editor.getHTML());
        },
    });

    // Memoize spacing options to prevent re-renders
    const spacingOptions = useMemo(() => [
        { label: 'Compact', value: '0.8' },
        { label: 'Tight', value: '0.9' },
        { label: '1.0', value: '1.0' },
        { label: '1.1', value: '1.1' },
        { label: '1.2', value: '1.2' },
        { label: '1.3', value: '1.3' },
        { label: '1.4', value: '1.4' },
        { label: '1.5', value: '1.5' },
        { label: '1.6', value: '1.6' },
        { label: '1.8', value: '1.8' },
        { label: '2.0', value: '2.0' },
        { label: '2.5', value: '2.5' },
        { label: '3.0', value: '3.0' },
    ], []);

    // Memoize current line height to prevent excessive checks
    const currentLineHeight = useMemo(() => {
        return editor?.getAttributes('paragraph').lineHeight || '1.2';
    }, [editor?.state.selection, editor?.state.doc.content, editor?.state.doc.attrs]);

    // Memoized spacing handlers
    const handleLineSpacingChange = useCallback((value) => {
        editor?.chain().focus(undefined, { scrollIntoView: false }).setLineHeight(value).run();
    }, [editor]);

    const handleMarginTopChange = useCallback((value) => {
        editor?.chain().focus(undefined, { scrollIntoView: false }).setMarginTop(value).run();
    }, [editor]);

    const handleMarginBottomChange = useCallback((value) => {
        editor?.chain().focus(undefined, { scrollIntoView: false }).setMarginBottom(value).run();
    }, [editor]);

    const handleResetSpacing = useCallback(() => {
        editor?.chain().focus(undefined, { scrollIntoView: false }).unsetLineHeight().run();
        editor?.chain().focus(undefined, { scrollIntoView: false }).setMarginTop(null).run();
        editor?.chain().focus(undefined, { scrollIntoView: false }).setMarginBottom(null).run();
    }, [editor]);

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

        // Keyboard shortcuts for line spacing
        const handleKeyDown = (e) => {
            // Handle soft line breaks (Shift+Enter)
            if (e.key === 'Enter' && e.shiftKey) {
                e.preventDefault();
                editor?.chain().focus().command(({ tr }) => {
                    const { selection } = tr;
                    const { $from } = selection;
                    tr.replaceSelectionWith(editor.schema.text('\n'));
                    tr.setSelection(TextSelection.create(tr.doc, $from.pos + 1));
                    return true;
                }).run();
                return;
            }
            
            if (e.ctrlKey || e.metaKey) {
                // Font shortcuts
                if (e.shiftKey) {
                    switch(e.key) {
                        case 's':
                            e.preventDefault();
                            editor?.chain().focus().setFontFamily('Arial').run();
                            break;
                        case 'r':
                            e.preventDefault();
                            editor?.chain().focus().setFontFamily('Times New Roman').run();
                            break;
                        case 'd':
                            e.preventDefault();
                            editor?.chain().focus().setFontFamily('Dancing Script').run();
                            break;
                        case 'i':
                            e.preventDefault();
                            editor?.chain().focus().setFontFamily('Impact').run();
                            break;
                        case 'c':
                            e.preventDefault();
                            editor?.chain().focus().setFontFamily('Courier New').run();
                            break;
                    }
                }
                // Ctrl/Cmd + Alt + 1: Set line height to 1.0
                else if (e.altKey && e.key === '1') {
                    e.preventDefault();
                    editor?.chain().focus().setLineHeight('1.0').run();
                }
                // Ctrl/Cmd + Alt + 2: Set line height to 1.5
                else if (e.altKey && e.key === '2') {
                    e.preventDefault();
                    editor?.chain().focus().setLineHeight('1.5').run();
                }
                // Ctrl/Cmd + Alt + 3: Set line height to 2.0
                else if (e.altKey && e.key === '3') {
                    e.preventDefault();
                    editor?.chain().focus().setLineHeight('2.0').run();
                }
                // Ctrl/Cmd + Alt + 0: Reset line height
                else if (e.altKey && e.key === '0') {
                    e.preventDefault();
                    editor?.chain().focus().unsetLineHeight().run();
                }
                // Ctrl/Cmd + Alt + Up: Decrease line spacing
                else if (e.altKey && e.key === 'ArrowUp') {
                    e.preventDefault();
                    const currentHeight = editor?.getAttributes('paragraph').lineHeight || '1.2';
                    const newHeight = Math.max(0.8, parseFloat(currentHeight) - 0.1).toFixed(1);
                    editor?.chain().focus().setLineHeight(newHeight).run();
                }
                // Ctrl/Cmd + Alt + Down: Increase line spacing
                else if (e.altKey && e.key === 'ArrowDown') {
                    e.preventDefault();
                    const currentHeight = editor?.getAttributes('paragraph').lineHeight || '1.2';
                    const newHeight = Math.min(3.0, parseFloat(currentHeight) + 0.1).toFixed(1);
                    editor?.chain().focus().setLineHeight(newHeight).run();
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('paste', handlePaste);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [form, editor]);

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
                                styles={{
                                    content: {
                                        '& .ProseMirror': {
                                            '& p': {
                                                marginBottom: '0.8em',
                                                lineHeight: '1.2',
                                            },
                                            '& p:last-child': {
                                                marginBottom: '0',
                                            },
                                            '& h1, & h2, & h3, & h4, & h5, & h6': {
                                                marginBottom: '0.6em',
                                                marginTop: '1.2em',
                                            },
                                            '& h1:first-child, & h2:first-child, & h3:first-child, & h4:first-child, & h5:first-child, & h6:first-child': {
                                                marginTop: '0',
                                            },
                                        }
                                    }
                                }}
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
                                            <Tooltip 
                                                    label="Font shortcuts: Ctrl+Shift+S (Sans), Ctrl+Shift+R (Serif), Ctrl+Shift+D (Decorative), Ctrl+Shift+I (Impact), Ctrl+Shift+C (Code)"
                                                    position="bottom"
                                                    withArrow
                                                    multiline
                                                    w={180}
                                                >
                                                    <Select
                                                        placeholder="Font"
                                                        data={[
                                                    // Serif Fonts
                                                    { group: 'Serif', items: [
                                                        { value: 'Georgia', label: 'Georgia' },
                                                        { value: 'Times New Roman', label: 'Times' },
                                                        { value: 'Playfair Display', label: 'Playfair' },
                                                        { value: 'Lora', label: 'Lora' },
                                                        { value: 'Merriweather', label: 'Merriweather' },
                                                        { value: 'Baskerville', label: 'Baskerville' },
                                                    ]},
                                                    // Sans-serif Fonts
                                                    { group: 'Sans-serif', items: [
                                                        { value: 'Arial', label: 'Arial' },
                                                        { value: 'Helvetica', label: 'Helvetica' },
                                                        { value: 'Verdana', label: 'Verdana' },
                                                        { value: 'Tahoma', label: 'Tahoma' },
                                                        { value: 'Trebuchet MS', label: 'Trebuchet' },
                                                        { value: 'Open Sans', label: 'Open Sans' },
                                                        { value: 'Roboto', label: 'Roboto' },
                                                        { value: 'Lato', label: 'Lato' },
                                                        { value: 'Montserrat', label: 'Montserrat' },
                                                    ]},
                                                    // Display/Decorative Fonts
                                                    { group: 'Display', items: [
                                                        { value: 'Impact', label: 'Impact' },
                                                        { value: 'Great Vibes', label: 'G. Vibes' },
                                                        { value: 'Dancing Script', label: 'Dancing' },
                                                        { value: 'Satisfy', label: 'Satisfy' },
                                                        { value: 'Pacifico', label: 'Pacifico' },
                                                        { value: 'Lobster', label: 'Lobster' },
                                                        { value: 'Caveat', label: 'Caveat' },
                                                        { value: 'Kalam', label: 'Kalam' },
                                                    ]},
                                                    // Monospace Fonts
                                                    { group: 'Monospace', items: [
                                                        { value: 'Courier New', label: 'Courier' },
                                                        { value: 'Monaco', label: 'Monaco' },
                                                        { value: 'Consolas', label: 'Consolas' },
                                                        { value: 'Menlo', label: 'Menlo' },
                                                    ]},
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
                                                w={120}
                                                styles={{
                                                    input: {
                                                        border: 'none',
                                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                                        color: isDark ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-dark-7)',
                                                        fontSize: '10px',
                                                        height: '24px',
                                                        padding: '0 6px',
                                                        borderRadius: '6px',
                                                        minHeight: '24px',
                                                        fontFamily: editor?.getAttributes('textStyle').fontFamily || 'inherit'
                                                    },
                                                    dropdown: {
                                                        backgroundColor: isDark ? 'rgba(20, 20, 20, 0.98)' : 'white',
                                                        backdropFilter: 'blur(10px)',
                                                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                                        borderRadius: '8px',
                                                        maxHeight: '300px',
                                                        overflowY: 'auto'
                                                    },
                                                    option: {
                                                        color: isDark ? 'var(--mantine-color-gray-3)' : 'var(--mantine-color-dark-4)',
                                                        fontSize: '11px',
                                                        padding: '6px 8px',
                                                        fontFamily: 'inherit',
                                                        '&:hover': {
                                                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                                                        }
                                                    },
                                                    label: {
                                                        color: isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-gray-6)',
                                                        fontSize: '9px',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                        padding: '4px 8px',
                                                        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                                                    }
                                                }}
                                            />
                                                </Tooltip>
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
                                            <Menu shadow="md" width={250} withinPortal>
                                                <Menu.Target>
                                                    <Tooltip 
                                                        label="Keyboard shortcuts: Ctrl+Alt+1/2/3 for spacing, Ctrl+Alt+↑/↓ to adjust, Ctrl+Alt+0 to reset"
                                                        position="bottom"
                                                        withArrow
                                                        multiline
                                                        w={200}
                                                    >
                                                        <RichTextEditor.Control aria-label="Spacing" title="Spacing">
                                                            <IconSpacingVertical size={14} stroke={1.5} />
                                                        </RichTextEditor.Control>
                                                    </Tooltip>
                                                </Menu.Target>
                                                <Menu.Dropdown style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                    <Menu.Label>Line Spacing</Menu.Label>
                                                    {spacingOptions.map((item) => (
                                                        <Menu.Item
                                                            key={item.value}
                                                            onClick={() => handleLineSpacingChange(item.value)}
                                                            rightSection={currentLineHeight === item.value ? <IconCheck size={12} /> : null}
                                                            style={{
                                                                fontSize: item.value === '0.8' || item.value === '0.9' ? '11px' : '12px',
                                                                color: item.value === '0.8' || item.value === '0.9' ? 'var(--mantine-color-blue-6)' : undefined
                                                            }}
                                                        >
                                                            {item.label}
                                                        </Menu.Item>
                                                    ))}
                                                    <Divider my="5px" />
                                                    <Menu.Label>Paragraph Spacing</Menu.Label>
                                                    <Menu.Item
                                                        leftSection={<IconArrowBarToDown size={12} />}
                                                        onClick={() => handleMarginTopChange('8px')}
                                                    >
                                                        Small Space Before
                                                    </Menu.Item>
                                                    <Menu.Item
                                                        leftSection={<IconArrowBarToDown size={12} />}
                                                        onClick={() => handleMarginTopChange('16px')}
                                                    >
                                                        Medium Space Before
                                                    </Menu.Item>
                                                    <Menu.Item
                                                        leftSection={<IconArrowBarToDown size={12} />}
                                                        onClick={() => handleMarginTopChange('24px')}
                                                    >
                                                        Large Space Before
                                                    </Menu.Item>
                                                    <Menu.Item
                                                        leftSection={<IconArrowBarToUp size={12} />}
                                                        onClick={() => handleMarginBottomChange('8px')}
                                                    >
                                                        Small Space After
                                                    </Menu.Item>
                                                    <Menu.Item
                                                        leftSection={<IconArrowBarToUp size={12} />}
                                                        onClick={() => handleMarginBottomChange('16px')}
                                                    >
                                                        Medium Space After
                                                    </Menu.Item>
                                                    <Menu.Item
                                                        leftSection={<IconArrowBarToUp size={12} />}
                                                        onClick={() => handleMarginBottomChange('24px')}
                                                    >
                                                        Large Space After
                                                    </Menu.Item>
                                                    <Divider my="5px" />
                                                    <Menu.Item
                                                        onClick={handleResetSpacing}
                                                        style={{ color: 'var(--mantine-color-red-6)' }}
                                                    >
                                                        Reset All Spacing
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
