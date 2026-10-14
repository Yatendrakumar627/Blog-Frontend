import {
    Title, Button, Group, FileInput, Checkbox, TextInput, Box, Text, Image,
    Paper, ActionIcon, Stack, SegmentedControl, Chip, Tooltip, SimpleGrid, Center,
    Transition, Collapse, useMantineColorScheme, Menu, Divider, Skeleton, Select,
    Popover, Badge, UnstyledButton, ScrollArea
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
    X, Upload, Link as LinkIcon, Sparkles, Mic, MicOff,
    Maximize, Minimize, Eye, Edit3, Share2, Compass, Check,
    Plus, Minus
} from 'lucide-react';
import { RichTextEditor } from '@mantine/tiptap';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import {
    IconMoodSmile, IconMoodSad, IconMoodEmpty, IconHeart, IconRocket, IconMoodAngry,
    IconHash, IconPhoto, IconFeather, IconQuote, IconAlignLeft, IconAlignCenter,
    IconAlignRight, IconAlignJustified, IconTextIncrease, IconTextDecrease,
    IconSpacingVertical, IconArrowBarToDown, IconArrowBarToUp, IconCheck,
    IconPalette, IconHeartHandshake, IconDownload, IconVolume, IconTypography,
    IconChevronDown, IconChevronUp, IconBold, IconItalic, IconUnderline, IconLink
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notifications } from '@mantine/notifications';
import DOMPurify from 'dompurify';

import QuoteCardModal from './QuoteCardModal';
import SlashCommandMenu from './SlashCommandMenu';
import FloatingBubbleMenu from './FloatingBubbleMenu';
import {
    FONT_FAMILIES, QUICK_FONT_PRESETS, LINE_HEIGHT_OPTIONS
} from '../constants/typography';

const MOODS = [
    { value: 'Happy', icon: IconMoodSmile, color: 'yellow', hex: '#fab005', label: 'Happy' },
    { value: 'Excited', icon: IconRocket, color: 'orange', hex: '#fd7e14', label: 'Excited' },
    { value: 'Thoughtful', icon: IconMoodEmpty, color: 'violet', hex: '#7950f2', label: 'Thoughtful' },
    { value: 'Healing', icon: IconHeart, color: 'pink', hex: '#20c997', label: 'Healing' },
    { value: 'Sad', icon: IconMoodSad, color: 'blue', hex: '#339af0', label: 'Sad' },
    { value: 'Angry', icon: IconMoodAngry, color: 'red', hex: '#fa5252', label: 'Angry' },
];

const QUICK_TAGS = [
    '#DilKiBaat', '#Poetry', '#Shayari', '#Healing', '#Thoughts', '#Life', '#Love', '#Motivation'
];

const PRESET_BACKGROUNDS = [
    { label: 'Vintage Parchment', value: '/paper-bg.png' },
    { label: 'Starry Quote Canvas', value: '/quote-bg-1.png' },
    { label: 'Soft Sunset Glow', value: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80' },
    { label: 'Midnight Aurora', value: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80' }
];

const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return { types: ['textStyle'] };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) return {};
                            return { style: `font-size: ${attributes.fontSize}` };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize: (fontSize) => ({ chain }) => {
                return chain().setMark('textStyle', { fontSize }).run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain().setMark('textStyle', { fontSize: null }).run();
            },
        };
    },
});

const LineHeight = Extension.create({
    name: 'lineHeight',
    addOptions() {
        return {
            types: ['paragraph', 'heading'],
            defaultLineHeight: null,
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    lineHeight: {
                        default: null,
                        parseHTML: element => element.style.lineHeight || null,
                        renderHTML: attributes => {
                            if (attributes.lineHeight === null || attributes.lineHeight === undefined || attributes.lineHeight === '') return {};
                            return { style: `line-height: ${attributes.lineHeight}` };
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
        return { types: ['paragraph', 'heading'] };
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
                            if (attributes.marginTop === null || attributes.marginTop === undefined || attributes.marginTop === '') return {};
                            return { style: `margin-top: ${attributes.marginTop}` };
                        },
                    },
                    marginBottom: {
                        default: null,
                        parseHTML: element => element.style.marginBottom || null,
                        renderHTML: attributes => {
                            if (attributes.marginBottom === null || attributes.marginBottom === undefined || attributes.marginBottom === '') return {};
                            return { style: `margin-bottom: ${attributes.marginBottom}` };
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
            setParagraphSpacing: ({ marginTop, marginBottom }) => ({ commands }) => {
                return this.options.types
                    .map(type => commands.updateAttributes(type, { marginTop, marginBottom }))
                    .some(result => result);
            },
        };
    },
});

const PostForm = ({
    initialData,
    onSubmit,
    onCancel,
    submitLabel = "Post",
    loading = false,
    isLoading = false
}) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [bgPreviewUrl, setBgPreviewUrl] = useState(null);
    const [focusedField, setFocusedField] = useState(null);
    const [hasDraft, setHasDraft] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [showSupport, setShowSupport] = useState(false);
    const [studioTab, setStudioTab] = useState('canvas'); // 'canvas' | 'preview'
    const [zenMode, setZenMode] = useState(false);
    const [showToolbar, setShowToolbar] = useState(true);
    const [quoteCardModalOpen, setQuoteCardModalOpen] = useState(false);
    const [canvasTextureEnabled, setCanvasTextureEnabled] = useState(true);
    
    // Slash commands state
    const [slashOpen, setSlashOpen] = useState(false);
    const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
    const [slashQuery, setSlashQuery] = useState('');

    // Audio Dictation state
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const DRAFT_KEY = 'blog_draft';
    const editorContainerRef = useRef(null);

    const form = useForm({
        initialValues: {
            content: initialData?.content || '',
            mood: initialData?.mood || 'Thoughtful',
            tags: initialData?.tags || '',
            isAnonymous: initialData?.isAnonymous || false,
            displayMode: initialData?.displayMode || 'Standard',
            image: null,
            imageUrl: initialData?.mediaUrl || initialData?.imageUrl || '',
            backgroundImage: null,
            backgroundImageUrl: initialData?.backgroundImage || initialData?.backgroundImageUrl || ''
        },
    });

    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    // TipTap Editor instance
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                link: false,
                underline: false,
                paragraph: {
                    HTMLAttributes: {
                        class: 'editor-paragraph',
                    },
                },
                heading: {
                    HTMLAttributes: {
                        class: 'editor-heading',
                    },
                },
            }),
            Placeholder.configure({
                placeholder: ({ node }) => {
                    if (node.type.name === 'heading') {
                        return 'Enter title or verse heading...';
                    }
                    return 'Likhiye apne dil ki baat... (Type poetry, shayari, or thoughts — press / for styles or highlight text)';
                },
                emptyEditorClass: 'is-editor-empty',
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { target: '_blank' },
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
                style: `min-height: ${zenMode ? '420px' : '260px'}; outline: none; font-size: 1.05rem; line-height: 1.7; color: ${isDark ? '#f8f9fa' : '#1a1b1e'}; caret-color: #339af0;`,
            },
            transformPastedHTML: (html) => {
                return html.replace(/\n\s*\n/g, '</p><p>').replace(/^(.*)$/, '<p>$1</p>');
            },
        },
        onUpdate({ editor }) {
            const html = editor.getHTML();
            form.setFieldValue('content', html);

            // Handle slash command detection
            const { state, view } = editor;
            const { from } = state.selection;
            const textBefore = state.doc.textBetween(Math.max(0, from - 20), from, '\n');
            const slashMatch = textBefore.match(/\/([a-zA-Z0-9]*)$/);

            if (slashMatch) {
                const query = slashMatch[1];
                setSlashQuery(query);
                const coords = view.coordsAtPos(from);
                const containerRect = editorContainerRef.current?.getBoundingClientRect();

                if (containerRect) {
                    setSlashPosition({
                        top: coords.bottom - containerRect.top + 8,
                        left: Math.max(10, coords.left - containerRect.left)
                    });
                }
                setSlashOpen(true);
            } else {
                setSlashOpen(false);
            }
        },
    });

    // Spacing options memoized
    const spacingOptions = useMemo(() => [
        { label: 'Compact', value: '0.8' },
        { label: 'Tight', value: '0.9' },
        { label: '1.0', value: '1.0' },
        { label: '1.2 (Standard)', value: '1.2' },
        { label: '1.5 (Relaxed)', value: '1.5' },
        { label: '2.0 (Double)', value: '2.0' },
    ], []);

    const currentLineHeight = editor?.getAttributes('paragraph').lineHeight || editor?.getAttributes('heading').lineHeight || '1.2';
    const currentFontSize = editor?.getAttributes('textStyle').fontSize || '18px';
    const currentAlignment = editor?.isActive({ textAlign: 'center' })
        ? 'center'
        : editor?.isActive({ textAlign: 'right' })
            ? 'right'
            : editor?.isActive({ textAlign: 'justify' })
                ? 'justify'
                : 'left';

    // Current Mood Details
    const currentMoodObj = useMemo(() => {
        return MOODS.find(m => m.value === form.values.mood) || MOODS[2];
    }, [form.values.mood]);

    // Live Reading Stats
    const stats = useMemo(() => {
        const text = editor ? editor.getText() : (form.values.content?.replace(/<[^>]*>/g, '') || '');
        const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
        const characters = text.length;
        const readTime = Math.max(1, Math.ceil(words / 200));
        const stanzas = text.split(/\n\s*\n/).filter(Boolean).length;
        return { words, characters, readTime, stanzas };
    }, [form.values.content, editor]);

    // Spacing handlers
    const handleLineSpacingChange = useCallback((value, applyToAll = false, autoCollapseMargin = true) => {
        if (!editor) return;
        const num = parseFloat(value);
        const collapseMargin = autoCollapseMargin && num <= 1.0;

        if (applyToAll) {
            const { from, to } = editor.state.selection;
            const chain = editor.chain().focus(undefined, { scrollIntoView: false }).selectAll().setLineHeight(value);
            if (collapseMargin) {
                chain.setParagraphSpacing({ marginTop: '0px', marginBottom: '0px' });
            }
            chain.setTextSelection({ from, to }).run();
        } else {
            const chain = editor.chain().focus(undefined, { scrollIntoView: false }).setLineHeight(value);
            if (collapseMargin) {
                chain.setParagraphSpacing({ marginTop: '0px', marginBottom: '0px' });
            }
            chain.run();
        }
    }, [editor]);

    const handleStepLineSpacing = useCallback((delta) => {
        if (!editor) return;
        const curr = editor.getAttributes('paragraph').lineHeight || editor.getAttributes('heading').lineHeight || '1.2';
        const num = parseFloat(curr) || 1.2;
        // Allows deeper stepping down to 0.0 with 0.05 precision
        const next = Math.max(0.0, Math.min(3.0, Math.round((num + delta) * 100) / 100)).toFixed(2);
        handleLineSpacingChange(next, false, true);
    }, [editor, handleLineSpacingChange]);

    const handleDeepZeroSpacing = useCallback((applyToAll = true) => {
        if (!editor) return;
        if (applyToAll) {
            const { from, to } = editor.state.selection;
            editor.chain().focus(undefined, { scrollIntoView: false })
                .selectAll()
                .setLineHeight('0.0')
                .setParagraphSpacing({ marginTop: '0px', marginBottom: '0px' })
                .setTextSelection({ from, to })
                .run();
        } else {
            editor.chain().focus(undefined, { scrollIntoView: false })
                .setLineHeight('0.0')
                .setParagraphSpacing({ marginTop: '0px', marginBottom: '0px' })
                .run();
        }
    }, [editor]);

    const handleApplySpacingToAll = useCallback((lineHeight) => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        editor.chain().focus(undefined, { scrollIntoView: false })
            .selectAll()
            .setLineHeight(lineHeight)
            .setTextSelection({ from, to })
            .run();
    }, [editor]);

    const handleMarginTopChange = useCallback((value) => {
        editor?.chain().focus(undefined, { scrollIntoView: false }).setMarginTop(value).run();
    }, [editor]);

    const handleMarginBottomChange = useCallback((value) => {
        editor?.chain().focus(undefined, { scrollIntoView: false }).setMarginBottom(value).run();
    }, [editor]);

    const handleZeroStanzaSpacing = useCallback((applyToAll = false) => {
        if (!editor) return;
        if (applyToAll) {
            const { from, to } = editor.state.selection;
            editor.chain().focus(undefined, { scrollIntoView: false })
                .selectAll()
                .setParagraphSpacing({ marginTop: '0px', marginBottom: '0px' })
                .setTextSelection({ from, to })
                .run();
        } else {
            editor.chain().focus(undefined, { scrollIntoView: false })
                .setParagraphSpacing({ marginTop: '0px', marginBottom: '0px' })
                .run();
        }
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

    // Media preview
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

    // Background Image Preview (supports both uploaded File and URL/Preset)
    useEffect(() => {
        if (form.values.backgroundImage) {
            const objectUrl = URL.createObjectURL(form.values.backgroundImage);
            setBgPreviewUrl(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (form.values.backgroundImageUrl) {
            setBgPreviewUrl(form.values.backgroundImageUrl);
        } else {
            setBgPreviewUrl(null);
        }
    }, [form.values.backgroundImage, form.values.backgroundImageUrl]);

    // Paste handler for direct image paste
    useEffect(() => {
        const handlePaste = (e) => {
            if (e.clipboardData.files.length) {
                const file = e.clipboardData.files[0];
                if (file.type.startsWith('image/')) {
                    form.setFieldValue('image', file);
                    form.setFieldValue('imageUrl', '');
                    notifications.show({
                        title: 'Image Attached',
                        message: 'Pasted image ready for upload.',
                        color: 'teal'
                    });
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [form]);

    // Draft management
    useEffect(() => {
        if (!initialData) {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                setHasDraft(true);
            }
        }
    }, [initialData]);

    useEffect(() => {
        if (!initialData && form.values.content && form.values.content !== '<p></p>') {
            // Emotional distress safeguard check
            const lowerContent = form.values.content.toLowerCase();
            const negativeWords = ['suicide', 'kill myself', 'depressed', 'end it all', 'hopeless', 'meaningless', 'hurt myself', 'give up'];
            const hasNegativeVibes = negativeWords.some(word => lowerContent.includes(word));
            if (hasNegativeVibes && !showSupport) setShowSupport(true);
            if (!hasNegativeVibes && showSupport) setShowSupport(false);

            // Debounced local autosave
            const timer = setTimeout(() => {
                const draft = {
                    content: form.values.content,
                    mood: form.values.mood,
                    tags: form.values.tags,
                    isAnonymous: form.values.isAnonymous,
                    displayMode: form.values.displayMode,
                    imageUrl: form.values.imageUrl,
                    backgroundImageUrl: form.values.backgroundImageUrl
                };
                localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
                setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [form.values, initialData, showSupport]);

    const loadDraft = () => {
        try {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                const draft = JSON.parse(savedDraft);
                form.setValues({ ...form.values, ...draft });
                if (editor) {
                    editor.commands.setContent(draft.content);
                }
                setHasDraft(false);
                notifications.show({
                    title: 'Draft Restored',
                    message: 'Your creative progress has been recovered.',
                    color: 'teal',
                    icon: <Check size={16} />
                });
            }
        } catch (e) {
            console.error('Failed to load draft:', e);
        }
    };

    const clearDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setHasDraft(false);
    };

    // Speech-to-Text Dictation System
    const toggleSpeechRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            notifications.show({
                title: 'Speech Not Supported',
                message: 'Your browser does not support native speech dictation. Try Chrome or Edge.',
                color: 'yellow'
            });
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = navigator.language || 'en-US';

            recognition.onstart = () => {
                setIsListening(true);
                notifications.show({
                    title: 'Listening...',
                    message: 'Speak from your heart. Speech is transcribed directly into the canvas.',
                    color: 'pink',
                    icon: <Mic size={16} />
                });
            };

            recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        const transcript = event.results[i][0].transcript;
                        editor?.chain().focus().insertContent(` ${transcript.trim()} `).run();
                    }
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
            recognition.start();
        } catch (err) {
            console.error('Speech setup error:', err);
            setIsListening(false);
        }
    };

    // Quick tag adder
    const handleAddTag = (tag) => {
        const currentTags = form.values.tags ? form.values.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        if (!currentTags.includes(tag)) {
            const newTags = [...currentTags, tag].join(', ');
            form.setFieldValue('tags', newTags);
        }
    };

    // Format presets handler
    const handleFormatChange = (val) => {
        form.setFieldValue('displayMode', val);
        if (val === 'Shayari' || val === 'Poetry') {
            editor?.chain().focus().setTextAlign('center').run();
            // Background is left blank by default; user can select a preset or upload if they wish
        } else {
            editor?.chain().focus().setTextAlign('left').run();
        }
    };

    const clearImage = () => {
        form.setFieldValue('image', null);
        form.setFieldValue('imageUrl', '');
        setPreviewUrl(null);
    };

    const clearBackgroundImage = () => {
        form.setFieldValue('backgroundImage', null);
        form.setFieldValue('backgroundImageUrl', '');
        setBgPreviewUrl(null);
    };

    const handleFormSubmit = (values) => {
        if (!values.content || values.content === '<p></p>') {
            notifications.show({
                title: 'Empty Canvas',
                message: 'Please write your thoughts before posting.',
                color: 'orange'
            });
            return;
        }

        if (!initialData) clearDraft();

        const data = new FormData();
        data.append('content', values.content);
        data.append('mood', values.mood);
        data.append('displayMode', values.displayMode);
        data.append('tags', values.tags);
        data.append('isAnonymous', values.isAnonymous);

        if (values.image) data.append('image', values.image);
        else if (values.imageUrl) data.append('mediaUrl', values.imageUrl);
        else data.append('mediaUrl', '');

        if (values.backgroundImage) data.append('backgroundImage', values.backgroundImage);
        else if (values.backgroundImageUrl) data.append('backgroundImage', values.backgroundImageUrl);
        else data.append('backgroundImage', '');

        onSubmit(data);
    };

    if (isLoading) {
        return (
            <Paper radius="lg" p="lg" withBorder bg={isDark ? "rgba(30, 30, 30, 0.6)" : "rgba(255, 255, 255, 0.7)"}>
                <Stack gap="md">
                    <Skeleton height={20} width={180} radius="xs" />
                    <Skeleton height={260} radius="md" />
                    <SimpleGrid cols={2}>
                        <Skeleton height={60} radius="md" />
                        <Skeleton height={60} radius="md" />
                    </SimpleGrid>
                </Stack>
            </Paper>
        );
    }

    return (
        <form onSubmit={form.onSubmit(handleFormSubmit)}>
            {/* Ambient Aura Canvas Wrapper */}
            <Box
                style={{
                    position: zenMode ? 'fixed' : 'relative',
                    inset: zenMode ? 0 : 'auto',
                    zIndex: zenMode ? 9999 : 'auto',
                    backgroundColor: zenMode ? (isDark ? '#090a0f' : '#f8f9fa') : 'transparent',
                    overflowY: zenMode ? 'auto' : 'visible',
                    padding: zenMode ? '2rem 1rem' : 0,
                    transition: 'all 0.3s ease'
                }}
            >
                {/* Dynamic Emotional Aura Mesh */}
                <Box
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '100%',
                        maxWidth: '900px',
                        height: '400px',
                        background: `radial-gradient(circle at 50% 15%, ${currentMoodObj.hex}22 0%, transparent 70%)`,
                        filter: 'blur(40px)',
                        pointerEvents: 'none',
                        zIndex: 0,
                        transition: 'background 0.8s ease'
                    }}
                />

                <Paper
                    p={{ base: 8, sm: 'xl' }}
                    radius={{ base: '12px', sm: '24px' }}
                    withBorder
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        maxWidth: '860px',
                        width: '100%',
                        margin: '0 auto',
                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        backgroundColor: isDark ? 'rgba(22, 23, 28, 0.75)' : 'rgba(255, 255, 255, 0.88)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: zenMode
                            ? '0 30px 60px rgba(0,0,0,0.5)'
                            : (isDark ? '0 12px 36px rgba(0,0,0,0.4)' : '0 12px 36px rgba(0,0,0,0.06)')
                    }}
                >
                    <Stack gap={{ base: 'sm', sm: 'lg' }}>
                        {/* 2026 Creative Studio Top Navigation Bar */}
                        <Group justify="space-between" align="center" wrap="wrap" gap={{ base: 8, sm: 'md' }}>
                            <Group gap="xs" align="center">
                                <Title
                                    order={3}
                                    fw={900}
                                    fz={{ base: '1.15rem', sm: '1.4rem' }}
                                    style={{
                                        background: 'linear-gradient(45deg, #339af0, #e64980)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        letterSpacing: '-0.5px'
                                    }}
                                >
                                    {initialData ? 'Edit your thoughts' : 'Share your Dil Ki Baat'}
                                </Title>

                                {hasDraft && !initialData && (
                                    <Badge
                                        variant="light"
                                        color="orange"
                                        size="sm"
                                        radius="xl"
                                        style={{ cursor: 'pointer', textTransform: 'none', fontWeight: 600 }}
                                        onClick={loadDraft}
                                    >
                                        Restore Draft
                                    </Badge>
                                )}
                            </Group>

                            {/* Studio Action Tools Bar */}
                            <Group gap={6} align="center" wrap="nowrap">
                                <SegmentedControl
                                    size="xs"
                                    radius="xl"
                                    value={studioTab}
                                    onChange={setStudioTab}
                                    data={[
                                        {
                                            label: (
                                                <Group gap={4} wrap="nowrap" align="center">
                                                    <Edit3 size={13} />
                                                    <span>Canvas</span>
                                                </Group>
                                            ),
                                            value: 'canvas'
                                        },
                                        {
                                            label: (
                                                <Group gap={4} wrap="nowrap" align="center">
                                                    <Eye size={13} />
                                                    <span>Preview</span>
                                                </Group>
                                            ),
                                            value: 'preview'
                                        },
                                    ]}
                                    classNames={{ label: 'seg-label-canvas-preview' }}
                                    styles={{
                                        root: {
                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                                            padding: '2px',
                                            height: '30px'
                                        },
                                        indicator: {
                                            background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                                            boxShadow: '0 2px 10px rgba(168, 85, 247, 0.35)',
                                            borderRadius: '50px'
                                        },
                                        label: {
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            padding: '2px 8px',
                                            color: isDark ? '#9ca3af' : '#71717a',
                                            transition: 'color 0.15s ease',
                                        }
                                    }}
                                />

                                {/* Grouped Action Icons */}
                                <Group
                                    gap={2}
                                    p={2}
                                    style={{
                                        borderRadius: '24px',
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)',
                                        height: '30px'
                                    }}
                                    align="center"
                                    wrap="nowrap"
                                >
                                    {/* Voice Dictation Button */}
                                    <Tooltip label={isListening ? "Listening... click to stop" : "Audio Dictation"} position="bottom" withArrow>
                                        <ActionIcon
                                            variant={isListening ? "filled" : "subtle"}
                                            color={isListening ? "red" : "pink"}
                                            size="sm"
                                            radius="xl"
                                            onClick={toggleSpeechRecognition}
                                            style={{
                                                boxShadow: isListening ? '0 0 14px rgba(250, 82, 82, 0.6)' : 'none'
                                            }}
                                        >
                                            {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                                        </ActionIcon>
                                    </Tooltip>

                                    {/* Export Social Story Card */}
                                    <Tooltip label="Export Aesthetic Quote Card" position="bottom" withArrow>
                                        <ActionIcon
                                            variant="subtle"
                                            color="violet"
                                            size="sm"
                                            radius="xl"
                                            onClick={() => setQuoteCardModalOpen(true)}
                                        >
                                            <Share2 size={14} />
                                        </ActionIcon>
                                    </Tooltip>

                                    {/* Zen / Focus Mode Toggle */}
                                    <Tooltip label={zenMode ? "Exit Zen Mode" : "Distraction-Free Zen Mode"} position="bottom" withArrow>
                                        <ActionIcon
                                            variant={zenMode ? "filled" : "subtle"}
                                            color="blue"
                                            size="sm"
                                            radius="xl"
                                            onClick={() => setZenMode(z => !z)}
                                        >
                                            {zenMode ? <Minimize size={14} /> : <Maximize size={14} />}
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Group>
                        </Group>

                        {/* Live Reading Metrics & Status Ribbon */}
                        <Group justify="space-between" align="center" px={4} py={2}>
                            <Group gap="xs" align="center">
                                <Badge variant="dot" color={currentMoodObj.color} size="sm">
                                    Vibe: {currentMoodObj.label}
                                </Badge>
                                <Text size="11px" c="dimmed">
                                    {stats.words} words • {stats.readTime} min read {stats.stanzas > 1 ? `• ${stats.stanzas} stanzas` : ''}
                                </Text>
                            </Group>

                            <Group gap="sm" align="center">
                                {lastSaved && (
                                    <Text size="11px" c="dimmed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#20c997' }} />
                                        Autosaved {lastSaved}
                                    </Text>
                                )}
                                <Text size="10px" c="dimmed" visibleFrom="xs" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Sparkles size={11} color={currentMoodObj.hex} />
                                    <span>Type</span>
                                    <code style={{ padding: '0px 4px', borderRadius: '3px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>/</code>
                                    <span>for styles</span>
                                </Text>
                            </Group>
                        </Group>

                        {/* STUDIO TAB: CANVAS VIEW */}
                        {studioTab === 'canvas' ? (
                            <Box ref={editorContainerRef} style={{ position: 'relative' }}>
                                {/* Floating Selection Bubble Menu */}
                                <FloatingBubbleMenu editor={editor} />

                                {/* Slash Command Palette */}
                                <SlashCommandMenu
                                    editor={editor}
                                    isOpen={slashOpen}
                                    onClose={() => setSlashOpen(false)}
                                    position={slashPosition}
                                    query={slashQuery}
                                />

                                {/* Minimalist Canvas Container with Atmospheric Texture */}
                                <Box
                                    style={{
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: focusedField === 'editor'
                                            ? `1px solid ${currentMoodObj.hex}`
                                            : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)'),
                                        boxShadow: focusedField === 'editor'
                                            ? `0 0 0 3px ${currentMoodObj.hex}25`
                                            : (isDark ? '0 8px 30px rgba(0,0,0,0.3)' : '0 8px 30px rgba(0,0,0,0.03)'),
                                        transition: 'all 0.25s ease',
                                        backgroundImage: (bgPreviewUrl && canvasTextureEnabled) ? `url(${bgPreviewUrl})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        position: 'relative',
                                        width: '100%'
                                    }}
                                    onFocus={() => setFocusedField('editor')}
                                    onBlur={() => setFocusedField(null)}
                                >
                                    {/* Translucent background scrim for high readability when canvas background is active */}
                                    {bgPreviewUrl && canvasTextureEnabled && (
                                        <Box
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                backgroundColor: isDark ? 'rgba(12, 13, 18, 0.84)' : 'rgba(255, 255, 255, 0.90)',
                                                backdropFilter: 'blur(6px)',
                                                zIndex: 0,
                                                pointerEvents: 'none'
                                            }}
                                        />
                                    )}

                                    <RichTextEditor editor={editor} variant="subtle" style={{ position: 'relative', zIndex: 1 }}>
                                        {/* Pro Studio Unified Toolbar */}
                                        <Collapse in={showToolbar}>
                                            <RichTextEditor.Toolbar
                                                style={{
                                                    backgroundColor: isDark ? 'rgba(16, 18, 25, 0.94)' : 'rgba(250, 251, 252, 0.96)',
                                                    backdropFilter: 'blur(16px)',
                                                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.07)',
                                                    padding: '4px 6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-start',
                                                    gap: '6px',
                                                    overflowX: 'auto',
                                                    scrollbarWidth: 'none',
                                                    flexWrap: 'nowrap',
                                                    width: '100%',
                                                    boxSizing: 'border-box'
                                                }}
                                            >
                                                {/* 1. Font Type Menu */}
                                                <Menu shadow="xl" width={290} withinPortal position="bottom-start">
                                                    <Menu.Target>
                                                        <Tooltip label="Font Type" withArrow>
                                                            <Button
                                                                size="compact-xs"
                                                                variant="subtle"
                                                                color="violet"
                                                                radius="md"
                                                                leftSection={<IconTypography size={13} />}
                                                                rightSection={<IconChevronDown size={11} />}
                                                                style={{
                                                                    fontFamily: editor?.getAttributes('textStyle').fontFamily ? `${editor.getAttributes('textStyle').fontFamily}, serif` : 'inherit',
                                                                    fontSize: '11px',
                                                                    fontWeight: 600,
                                                                    height: '28px',
                                                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                                    whiteSpace: 'nowrap',
                                                                    padding: '0 8px',
                                                                    flexShrink: 0
                                                                }}
                                                            >
                                                                {editor?.getAttributes('textStyle').fontFamily || 'Font Type'}
                                                            </Button>
                                                        </Tooltip>
                                                    </Menu.Target>
                                                    <Menu.Dropdown
                                                        p={8}
                                                        style={{
                                                            backgroundColor: isDark ? 'rgba(20, 20, 26, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                                                            backdropFilter: 'blur(16px)',
                                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.1)'
                                                        }}
                                                    >
                                                        <Menu.Label>Quick Presets</Menu.Label>
                                                        <SimpleGrid cols={2} spacing={5} mb="xs" px={2}>
                                                            {QUICK_FONT_PRESETS.map((preset) => {
                                                                const isActive = editor?.getAttributes('textStyle').fontFamily === preset.font;
                                                                return (
                                                                    <Button
                                                                        key={preset.id}
                                                                        size="compact-xs"
                                                                        variant={isActive ? 'filled' : 'light'}
                                                                        color={isActive ? 'pink' : 'gray'}
                                                                        radius="md"
                                                                        justify="flex-start"
                                                                        px={8}
                                                                        style={{
                                                                            fontSize: '11px',
                                                                            fontFamily: `${preset.font}, serif`,
                                                                            height: '28px'
                                                                        }}
                                                                        onClick={() => {
                                                                            editor?.chain().focus().setFontFamily(preset.font).run();
                                                                            notifications.show({
                                                                                title: `${preset.label} Font Applied`,
                                                                                message: `Set canvas typeface to ${preset.font}`,
                                                                                color: 'pink',
                                                                                autoClose: 1400
                                                                            });
                                                                        }}
                                                                    >
                                                                        {preset.icon} {preset.label}
                                                                    </Button>
                                                                );
                                                            })}
                                                        </SimpleGrid>

                                                        <Divider my={4} color={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} />
                                                        <Menu.Label>Curated Expressive Typefaces</Menu.Label>
                                                        <ScrollArea.Autosize mah={220}>
                                                            {FONT_FAMILIES.map((group) => (
                                                                <Box key={group.category} mb={4}>
                                                                    <Text size="10px" fw={700} c="dimmed" px="xs" py={2} tt="uppercase">
                                                                        {group.category}
                                                                    </Text>
                                                                    {group.fonts.map((f) => (
                                                                        <Menu.Item
                                                                            key={f.value}
                                                                            onClick={() => {
                                                                                if (f.value) {
                                                                                    editor?.chain().focus().setFontFamily(f.value).run();
                                                                                } else {
                                                                                    editor?.chain().focus().unsetFontFamily().run();
                                                                                }
                                                                            }}
                                                                            rightSection={editor?.getAttributes('textStyle').fontFamily === f.value ? <IconCheck size={12} color="#4dabf7" /> : null}
                                                                            style={{ padding: '4px 8px', borderRadius: '6px' }}
                                                                        >
                                                                            <Text size="xs" style={{ fontFamily: `${f.value}, serif` }}>
                                                                                {f.label}
                                                                            </Text>
                                                                            <Text size="10px" c="dimmed">{f.desc}</Text>
                                                                        </Menu.Item>
                                                                    ))}
                                                                </Box>
                                                            ))}
                                                        </ScrollArea.Autosize>
                                                        <Divider my={4} color={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} />
                                                        <Menu.Item
                                                            color="red"
                                                            onClick={() => editor?.chain().focus().unsetFontFamily().run()}
                                                            style={{ fontSize: '11px' }}
                                                        >
                                                            Reset to Default Font
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>

                                                {/* 2. Font Size Menu Button */}
                                                <Menu shadow="md" width={110} withinPortal position="bottom-start">
                                                    <Menu.Target>
                                                        <Tooltip label="Font Size" withArrow>
                                                            <Button
                                                                size="compact-xs"
                                                                variant="subtle"
                                                                color="gray"
                                                                radius="md"
                                                                rightSection={<IconChevronDown size={10} />}
                                                                style={{
                                                                    height: '28px',
                                                                    fontSize: '11px',
                                                                    fontWeight: 600,
                                                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                                    padding: '0 8px',
                                                                    fontVariantNumeric: 'tabular-nums',
                                                                    flexShrink: 0
                                                                }}
                                                            >
                                                                {currentFontSize}
                                                            </Button>
                                                        </Tooltip>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Label>Font Size</Menu.Label>
                                                        {['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '42px'].map((sz) => {
                                                            const isSelected = currentFontSize === sz;
                                                            return (
                                                                <Menu.Item
                                                                    key={sz}
                                                                    onClick={() => editor?.chain().focus().setMark('textStyle', { fontSize: sz }).run()}
                                                                    rightSection={isSelected ? <IconCheck size={12} color="#339af0" /> : null}
                                                                    style={{ fontSize: '11px', fontWeight: isSelected ? 600 : 400, padding: '4px 8px' }}
                                                                >
                                                                    {sz} {sz === '18px' ? '(Default)' : ''}
                                                                </Menu.Item>
                                                            );
                                                        })}
                                                    </Menu.Dropdown>
                                                </Menu>

                                                <Divider orientation="vertical" h={16} color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} />

                                                {/* 3. Format Style Menu - Dedicated Single Button */}
                                                <Menu shadow="md" width={160} withinPortal position="bottom-start">
                                                    <Menu.Target>
                                                        <Tooltip label="Text Formatting (B, I, U, Link)" withArrow>
                                                            <Button
                                                                size="compact-xs"
                                                                variant={(editor?.isActive('bold') || editor?.isActive('italic') || editor?.isActive('underline') || editor?.isActive('link')) ? 'light' : 'subtle'}
                                                                color={(editor?.isActive('bold') || editor?.isActive('italic') || editor?.isActive('underline') || editor?.isActive('link')) ? 'violet' : 'gray'}
                                                                radius="md"
                                                                leftSection={
                                                                    <Group gap={3} wrap="nowrap" align="center">
                                                                        <IconBold size={13} />
                                                                        <IconItalic size={13} />
                                                                    </Group>
                                                                }
                                                                rightSection={<IconChevronDown size={10} />}
                                                                style={{
                                                                    height: '28px',
                                                                    fontSize: '11px',
                                                                    fontWeight: 600,
                                                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                                    padding: '0 8px',
                                                                    flexShrink: 0
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Label>Formatting Styles</Menu.Label>
                                                        <Menu.Item
                                                            leftSection={<IconBold size={14} />}
                                                            onClick={() => editor?.chain().focus().toggleBold().run()}
                                                            rightSection={editor?.isActive('bold') ? <IconCheck size={12} color="#339af0" /> : null}
                                                            style={{ fontSize: '11px', fontWeight: editor?.isActive('bold') ? 700 : 400 }}
                                                        >
                                                            Bold
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconItalic size={14} />}
                                                            onClick={() => editor?.chain().focus().toggleItalic().run()}
                                                            rightSection={editor?.isActive('italic') ? <IconCheck size={12} color="#339af0" /> : null}
                                                            style={{ fontSize: '11px', fontStyle: 'italic' }}
                                                        >
                                                            Italic
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconUnderline size={14} />}
                                                            onClick={() => editor?.chain().focus().toggleUnderline().run()}
                                                            rightSection={editor?.isActive('underline') ? <IconCheck size={12} color="#339af0" /> : null}
                                                            style={{ fontSize: '11px', textDecoration: 'underline' }}
                                                        >
                                                            Underline
                                                        </Menu.Item>
                                                        <Divider my={4} />
                                                        <Menu.Item
                                                            leftSection={<IconLink size={14} />}
                                                            onClick={() => {
                                                                const previousUrl = editor?.getAttributes('link').href;
                                                                const url = window.prompt('URL', previousUrl);
                                                                if (url === null) return;
                                                                if (url === '') {
                                                                    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
                                                                    return;
                                                                }
                                                                editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                                                            }}
                                                            rightSection={editor?.isActive('link') ? <IconCheck size={12} color="#339af0" /> : null}
                                                            style={{ fontSize: '11px' }}
                                                        >
                                                            {editor?.isActive('link') ? 'Edit Link' : 'Add Link'}
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>

                                                <Divider orientation="vertical" h={16} color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} />

                                                {/* 4. Text Alignment - Button in Option */}
                                                <Menu shadow="md" width={140} withinPortal position="bottom-start">
                                                    <Menu.Target>
                                                        <Tooltip label={`Alignment: ${currentAlignment}`} withArrow>
                                                            <Button
                                                                size="compact-xs"
                                                                variant="subtle"
                                                                color="gray"
                                                                radius="md"
                                                                leftSection={
                                                                    currentAlignment === 'center' ? (
                                                                        <IconAlignCenter size={14} />
                                                                    ) : currentAlignment === 'right' ? (
                                                                        <IconAlignRight size={14} />
                                                                    ) : currentAlignment === 'justify' ? (
                                                                        <IconAlignJustified size={14} />
                                                                    ) : (
                                                                        <IconAlignLeft size={14} />
                                                                    )
                                                                }
                                                                rightSection={<IconChevronDown size={10} />}
                                                                style={{
                                                                    height: '28px',
                                                                    fontSize: '11px',
                                                                    fontWeight: 600,
                                                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                                    padding: '0 8px',
                                                                    flexShrink: 0
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Label>Alignment</Menu.Label>
                                                        <Menu.Item
                                                            leftSection={<IconAlignLeft size={14} />}
                                                            onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                                                            rightSection={currentAlignment === 'left' ? <IconCheck size={12} color="#339af0" /> : null}
                                                            style={{ fontSize: '11px' }}
                                                        >
                                                            Align Left
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconAlignCenter size={14} />}
                                                            onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                                                            rightSection={currentAlignment === 'center' ? <IconCheck size={12} color="#339af0" /> : null}
                                                            style={{ fontSize: '11px' }}
                                                        >
                                                            Align Center
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconAlignRight size={14} />}
                                                            onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                                                            rightSection={currentAlignment === 'right' ? <IconCheck size={12} color="#339af0" /> : null}
                                                            style={{ fontSize: '11px' }}
                                                        >
                                                            Align Right
                                                        </Menu.Item>
                                                        <Menu.Item
                                                            leftSection={<IconAlignJustified size={14} />}
                                                            onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                                                            rightSection={currentAlignment === 'justify' ? <IconCheck size={12} color="#339af0" /> : null}
                                                            style={{ fontSize: '11px' }}
                                                        >
                                                            Justify
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>

                                                <Divider orientation="vertical" h={16} color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} />

                                                {/* 5. Line Spacing - Stays on Button */}
                                                <Menu shadow="md" width={210} withinPortal position="bottom-start">
                                                    <Menu.Target>
                                                        <Tooltip label={`Line Spacing: ${parseFloat(currentLineHeight).toFixed(1)}x`} withArrow>
                                                            <Button
                                                                size="compact-xs"
                                                                variant="subtle"
                                                                color="blue"
                                                                radius="md"
                                                                leftSection={<IconSpacingVertical size={13} />}
                                                                rightSection={<IconChevronDown size={10} />}
                                                                style={{
                                                                    height: '28px',
                                                                    fontSize: '11px',
                                                                    fontWeight: 600,
                                                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                                    padding: '0 8px',
                                                                    whiteSpace: 'nowrap',
                                                                    flexShrink: 0
                                                                }}
                                                            >
                                                                {parseFloat(currentLineHeight).toFixed(1)}x
                                                            </Button>
                                                        </Tooltip>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Label>Line Spacing</Menu.Label>
                                                        {[
                                                            { label: '⚡ 0.0 (True Zero Spacing)', value: '0.0' },
                                                            { label: '0.4 (Deep Minimal)', value: '0.4' },
                                                            { label: '0.8 (Compact)', value: '0.8' },
                                                            { label: '1.0 (Tight / Solid)', value: '1.0' },
                                                            { label: '1.2 (Standard)', value: '1.2' },
                                                            { label: '1.5 (Relaxed)', value: '1.5' },
                                                            { label: '1.8 (Open)', value: '1.8' },
                                                            { label: '2.0 (Double)', value: '2.0' },
                                                        ].map((item) => {
                                                            const isSelected = Math.abs(parseFloat(currentLineHeight) - parseFloat(item.value)) < 0.05;
                                                            return (
                                                                <Menu.Item
                                                                    key={item.value}
                                                                    onClick={() => handleLineSpacingChange(item.value, false, true)}
                                                                    rightSection={isSelected ? <IconCheck size={12} color="#339af0" /> : null}
                                                                    style={{ fontSize: '11px', fontWeight: isSelected ? 600 : 400, padding: '5px 8px' }}
                                                                >
                                                                    {item.label}
                                                                </Menu.Item>
                                                            );
                                                        })}
                                                        <Divider my={4} />
                                                        <Group justify="space-between" px={8} py={3}>
                                                            <Tooltip label="Deeper (-0.05)" withArrow>
                                                                <Button
                                                                    size="compact-xs"
                                                                    variant="light"
                                                                    color="red"
                                                                    leftSection={<Minus size={11} />}
                                                                    style={{ fontSize: '10px', height: '22px' }}
                                                                    onClick={(e) => { e.stopPropagation(); handleStepLineSpacing(-0.05); }}
                                                                    disabled={parseFloat(currentLineHeight) <= 0.0}
                                                                >
                                                                    -0.05
                                                                </Button>
                                                            </Tooltip>
                                                            <Tooltip label="Expand (+0.05)" withArrow>
                                                                <Button
                                                                    size="compact-xs"
                                                                    variant="light"
                                                                    color="blue"
                                                                    rightSection={<Plus size={11} />}
                                                                    style={{ fontSize: '10px', height: '22px' }}
                                                                    onClick={(e) => { e.stopPropagation(); handleStepLineSpacing(0.05); }}
                                                                    disabled={parseFloat(currentLineHeight) >= 3.0}
                                                                >
                                                                    +0.05
                                                                </Button>
                                                            </Tooltip>
                                                            <Button
                                                                size="compact-xs"
                                                                variant="subtle"
                                                                color="gray"
                                                                style={{ fontSize: '10px', height: '22px' }}
                                                                onClick={(e) => { e.stopPropagation(); handleApplySpacingToAll(currentLineHeight); }}
                             >
                                                                Apply All
                                                            </Button>
                                                        </Group>
                                                        <Divider my={4} />
                                                        <Menu.Item onClick={handleResetSpacing} color="gray" style={{ fontSize: '11px' }}>
                                                            Reset Spacing to Default
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>

                                                {/* 6. End Utilities (Texture Toggle & Hide Tools) */}
                                                <Group gap={4} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
                                                    {bgPreviewUrl && (
                                                        <Tooltip label={canvasTextureEnabled ? "Hide background texture on canvas" : "Show background texture on canvas"} withArrow>
                                                            <ActionIcon
                                                                size="sm"
                                                                radius="md"
                                                                variant={canvasTextureEnabled ? 'light' : 'subtle'}
                                                                color={canvasTextureEnabled ? 'pink' : 'gray'}
                                                                onClick={() => setCanvasTextureEnabled(c => !c)}
                                                                style={{ height: '28px', width: '28px' }}
                                                            >
                                                                <IconPhoto size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}

                                                    <Tooltip label="Hide Formatting Toolbar" withArrow>
                                                        <ActionIcon
                                                            size="sm"
                                                            radius="md"
                                                            variant="subtle"
                                                            color="gray"
                                                            onClick={() => setShowToolbar(false)}
                                                            style={{ height: '28px', width: '28px' }}
                                                        >
                                                            <IconChevronUp size={14} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </RichTextEditor.Toolbar>
                                        </Collapse>
                                        {/* Subtle Floating Expand Button when toolbar is hidden */}
                                        {!showToolbar && (
                                            <Box pos="absolute" top={6} right={6} style={{ zIndex: 10 }}>
                                                <Tooltip label="Show formatting toolbar" withArrow position="left">
                                                    <ActionIcon
                                                        size="sm"
                                                        radius="md"
                                                        variant="light"
                                                        color="blue"
                                                        onClick={() => setShowToolbar(true)}
                                                        style={{
                                                            backgroundColor: isDark ? 'rgba(25, 27, 36, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                                                            backdropFilter: 'blur(8px)',
                                                            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
                                                            height: '26px',
                                                            width: '26px'
                                                        }}
                                                    >
                                                        <IconChevronDown size={14} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Box>
                                        )}

                                        {/* Main Prose Canvas */}
                                        <RichTextEditor.Content />
                                    </RichTextEditor>
                                </Box>
                            </Box>
                        ) : (
                            /* STUDIO TAB: LIVE FEED PREVIEW */
                            <Box
                                p="lg"
                                style={{
                                    borderRadius: '18px',
                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                    backgroundColor: isDark ? 'rgba(16, 17, 22, 0.9)' : '#ffffff',
                                    backgroundImage: bgPreviewUrl ? `url(${bgPreviewUrl})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    minHeight: '280px',
                                    position: 'relative'
                                }}
                            >
                                <Group justify="space-between" mb="md">
                                    <Group gap="xs">
                                        <Box style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(45deg, #339af0, #e64980)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '13px' }}>
                                            {form.values.isAnonymous ? '?' : 'You'}
                                        </Box>
                                        <Box>
                                            <Text size="sm" fw={700}>
                                                {form.values.isAnonymous ? 'Anonymous Soul' : 'Your Feed Persona'}
                                            </Text>
                                            <Text size="11px" c="dimmed">Just now • Dil Ki Baat</Text>
                                        </Box>
                                    </Group>
                                    <Badge variant="filled" color={currentMoodObj.color} radius="xl">
                                        {currentMoodObj.label}
                                    </Badge>
                                </Group>

                                <Box
                                    className="blog-content-display"
                                    my="md"
                                    p={bgPreviewUrl ? 'md' : 0}
                                    style={{
                                        backgroundColor: bgPreviewUrl ? (isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)') : 'transparent',
                                        borderRadius: '12px',
                                        backdropFilter: bgPreviewUrl ? 'blur(8px)' : 'none',
                                        textAlign: form.values.displayMode === 'Shayari' || form.values.displayMode === 'Poetry' ? 'center' : 'left'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.values.content || '<p>Nothing written yet...</p>') }}
                                />

                                {previewUrl && (
                                    <Image src={previewUrl} radius="md" h={200} fit="cover" mb="md" />
                                )}

                                {form.values.tags && (
                                    <Group gap={6} mt="sm">
                                        {form.values.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                                            <Badge key={tag} variant="light" size="xs" color="gray">
                                                {tag.startsWith('#') ? tag : `#${tag}`}
                                            </Badge>
                                        ))}
                                    </Group>
                                )}
                            </Box>
                        )}

                        {/* Vibe & Format Controls */}
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={{ base: 'xs', sm: 'md' }}>
                            {/* Mood Selection */}
                            <Box>
                                <Text fw={700} mb={4} c="dimmed" size="xs" tt="uppercase" ls={1}>
                                    Vibe Check
                                </Text>
                                <Paper p={{ base: 6, sm: 'xs' }} radius="md" bg={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} withBorder style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                                    <Group gap={{ base: 4, sm: 8 }} justify="center" wrap="nowrap">
                                        {MOODS.map((mood) => {
                                            const isSelected = form.values.mood === mood.value;
                                            return (
                                                <Tooltip key={mood.value} label={mood.label} withArrow position="top">
                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                                        <ActionIcon
                                                            variant={isSelected ? 'gradient' : 'subtle'}
                                                            gradient={{ from: mood.color, to: 'pink', deg: 45 }}
                                                            size={{ base: 'md', sm: 'lg' }}
                                                            radius="xl"
                                                            onClick={() => form.setFieldValue('mood', mood.value)}
                                                            style={{
                                                                opacity: isSelected ? 1 : 0.7,
                                                                border: isSelected ? 'none' : (isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)'),
                                                                color: isSelected ? 'white' : (isDark ? 'var(--mantine-color-gray-5)' : 'var(--mantine-color-dark-4)'),
                                                                boxShadow: isSelected ? `0 0 15px ${mood.hex}88` : 'none'
                                                            }}
                                                        >
                                                            <mood.icon size={20} />
                                                        </ActionIcon>
                                                    </motion.div>
                                                </Tooltip>
                                            );
                                        })}
                                    </Group>
                                    <Text ta="center" size="xs" c={currentMoodObj.color} mt={4} fw={700}>
                                        {form.values.mood}
                                    </Text>
                                </Paper>
                            </Box>

                            {/* Format Presets */}
                            <Box>
                                <Text fw={700} mb={6} c="dimmed" size="xs" tt="uppercase" ls={1}>
                                    Format Preset
                                </Text>
                                <SegmentedControl
                                    value={form.values.displayMode}
                                    onChange={handleFormatChange}
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
                                        }
                                    }}
                                />
                            </Box>
                        </SimpleGrid>

                        {/* Background Presets (Conditional for Poetry & Shayari) */}
                        <Collapse in={form.values.displayMode === 'Poetry' || form.values.displayMode === 'Shayari'}>
                            <Paper
                                p="md"
                                radius="lg"
                                withBorder
                                style={{
                                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                                }}
                            >
                                <Group justify="space-between" align="center" mb={8}>
                                    <Text size="xs" fw={700} c="dimmed" tt="uppercase" ls={1} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <IconPhoto size={14} /> Aesthetic Poetry & Shayari Background
                                    </Text>
                                    {bgPreviewUrl && (
                                        <Button
                                            variant="subtle"
                                            color="red"
                                            size="compact-xs"
                                            onClick={clearBackgroundImage}
                                        >
                                            Remove Background
                                        </Button>
                                    )}
                                </Group>

                                {/* Preset Chips */}
                                <Box mb="sm">
                                    <Text size="11px" c="dimmed" mb={6}>Curated Atmospheric Presets:</Text>
                                    <Group gap="xs" wrap="wrap">
                                        {PRESET_BACKGROUNDS.map((bg) => {
                                            const isChecked = form.values.backgroundImageUrl === bg.value && !form.values.backgroundImage;
                                            return (
                                                <Chip
                                                    key={bg.value}
                                                    size="xs"
                                                    radius="xl"
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        form.setFieldValue('backgroundImage', null);
                                                        if (isChecked) {
                                                            form.setFieldValue('backgroundImageUrl', '');
                                                        } else {
                                                            form.setFieldValue('backgroundImageUrl', bg.value);
                                                        }
                                                    }}
                                                >
                                                    {bg.label}
                                                </Chip>
                                            );
                                        })}
                                    </Group>
                                </Box>

                                {/* Dual Input: Upload File or Paste Image URL */}
                                <Group grow gap="sm" mb={bgPreviewUrl ? 'sm' : 0}>
                                    <FileInput
                                        placeholder="Upload background image"
                                        leftSection={<Upload size={14} />}
                                        accept="image/*"
                                        radius="md"
                                        size="xs"
                                        variant="filled"
                                        clearable
                                        value={form.values.backgroundImage}
                                        onChange={(file) => {
                                            form.setFieldValue('backgroundImage', file);
                                            if (file) form.setFieldValue('backgroundImageUrl', '');
                                        }}
                                    />
                                    <TextInput
                                        placeholder="Or paste background image URL (https://...)"
                                        leftSection={<LinkIcon size={14} />}
                                        radius="md"
                                        size="xs"
                                        variant="filled"
                                        value={form.values.backgroundImageUrl}
                                        onChange={(e) => {
                                            form.setFieldValue('backgroundImageUrl', e.target.value);
                                            form.setFieldValue('backgroundImage', null);
                                        }}
                                    />
                                </Group>

                                {/* Live Visual Thumbnail Card Preview */}
                                <AnimatePresence>
                                    {bgPreviewUrl && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                            exit={{ opacity: 0, height: 0, scale: 0.98 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            <Paper
                                                withBorder
                                                radius="md"
                                                p="sm"
                                                pos="relative"
                                                mt="xs"
                                                style={{
                                                    backgroundImage: `url(${bgPreviewUrl})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    minHeight: '120px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'space-between',
                                                    overflow: 'hidden',
                                                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                                                    boxShadow: '0 8px 20px rgba(0,0,0,0.25)'
                                                }}
                                            >
                                                {/* Translucent Backdrop Scrim */}
                                                <Box
                                                    style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        background: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.25)',
                                                        backdropFilter: 'blur(2px)',
                                                        zIndex: 0
                                                    }}
                                                />

                                                {/* Top Badge & Close Action Icon */}
                                                <Group justify="space-between" align="center" style={{ position: 'relative', zIndex: 1 }}>
                                                    <Badge
                                                        size="xs"
                                                        variant="filled"
                                                        color="dark"
                                                        style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.65)' }}
                                                    >
                                                        {form.values.backgroundImage ? 'Uploaded Image' : (PRESET_BACKGROUNDS.find(p => p.value === form.values.backgroundImageUrl)?.label || 'Custom Web URL')}
                                                    </Badge>

                                                    <ActionIcon
                                                        color="red"
                                                        variant="filled"
                                                        radius="xl"
                                                        size="xs"
                                                        onClick={clearBackgroundImage}
                                                        title="Remove background"
                                                    >
                                                        <X size={12} />
                                                    </ActionIcon>
                                                </Group>

                                                {/* Live Stanza Typography Preview */}
                                                <Center my="xs" style={{ position: 'relative', zIndex: 1 }}>
                                                    <Text
                                                        size="sm"
                                                        fw={700}
                                                        c="#ffffff"
                                                        style={{
                                                            fontFamily: 'Georgia, serif',
                                                            fontStyle: 'italic',
                                                            textShadow: '0 2px 8px rgba(0,0,0,0.85)',
                                                            letterSpacing: '0.8px',
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        ✦ दिल की बात — Live Background Preview ✦
                                                    </Text>
                                                </Center>

                                                <Text size="10px" c="#ffffff" opacity={0.8} ta="right" style={{ position: 'relative', zIndex: 1 }}>
                                                    Applies to Poetry & Shayari canvas
                                                </Text>
                                            </Paper>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Paper>
                        </Collapse>

                        {/* Tags & Quick Suggestions */}
                        <Box>
                            <TextInput
                                label={<Text fw={700} mb={4} c="dimmed" size="xs" tt="uppercase" ls={1}>Tags</Text>}
                                placeholder="#healing, #hope, #life, #dilkibaat"
                                leftSection={<IconHash size={14} />}
                                {...form.getInputProps('tags')}
                                radius="md"
                                size="sm"
                                variant="filled"
                            />
                            <Group gap={6} mt={6} wrap="wrap">
                                <Text size="10px" c="dimmed">Suggestions:</Text>
                                {QUICK_TAGS.map(tag => (
                                    <Badge
                                        key={tag}
                                        size="xs"
                                        variant="light"
                                        color="gray"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleAddTag(tag)}
                                    >
                                        + {tag}
                                    </Badge>
                                ))}
                            </Group>
                        </Box>

                        {/* Media Section */}
                        <Box>
                            <Text fw={700} mb={6} c="dimmed" size="xs" tt="uppercase" ls={1}>Attach Media</Text>
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
                                />
                            </Group>
                        </Box>

                        {/* Image Preview */}
                        <AnimatePresence>
                            {previewUrl && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                                    <Paper withBorder radius="md" p="xs" pos="relative" bg="rgba(0,0,0,0.2)" style={{ overflow: 'hidden' }}>
                                        <Image src={previewUrl} alt="Preview" radius="sm" h={200} fit="contain" />
                                        <ActionIcon color="red" variant="filled" radius="xl" size="sm" pos="absolute" top={8} right={8} onClick={clearImage}>
                                            <X size={14} />
                                        </ActionIcon>
                                    </Paper>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Publishing Footer */}
                        <Group justify="space-between" align="center" mt="xs">
                            <Group gap="xs">
                                <Checkbox
                                    label="Post Anonymously"
                                    checked={form.values.isAnonymous}
                                    {...form.getInputProps('isAnonymous', { type: 'checkbox' })}
                                    styles={{ label: { cursor: 'pointer', userSelect: 'none', fontSize: '13px' } }}
                                />

                                {/* Suicide Prevention Popover */}
                                <Transition mounted={showSupport} transition="scale" duration={400}>
                                    {(styles) => (
                                        <Box style={styles}>
                                            <Popover width={280} position="top" withArrow shadow="xl" radius="md">
                                                <Popover.Target>
                                                    <Tooltip label="We're here for you" position="top" withArrow>
                                                        <ActionIcon variant="light" color="pink" radius="xl" size="md">
                                                            <IconHeartHandshake size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Popover.Target>
                                                <Popover.Dropdown p="md" style={{ border: '1px solid var(--mantine-color-pink-2)' }}>
                                                    <Group gap="xs" mb={8}>
                                                        <IconHeartHandshake size={20} color="var(--mantine-color-pink-6)" />
                                                        <Text size="sm" fw={700} c="pink">Dil Ki Baat is with you</Text>
                                                    </Group>
                                                    <Text size="xs" mb="md" lh={1.5}>
                                                        It sounds like you might be going through a heavy moment. You don't have to carry it alone.
                                                    </Text>
                                                    <Button component="a" href="https://blog.opencounseling.com/suicide-hotlines/" target="_blank" variant="gradient" gradient={{ from: 'pink', to: 'grape' }} size="xs" fullWidth radius="md">
                                                        Find a Local Helpline
                                                    </Button>
                                                </Popover.Dropdown>
                                            </Popover>
                                        </Box>
                                    )}
                                </Transition>
                            </Group>

                            <Group>
                                {onCancel && (
                                    <Button variant="subtle" color="gray" onClick={onCancel} size="sm">
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    size="sm"
                                    radius="xl"
                                    loading={loading}
                                    gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
                                    variant="gradient"
                                    style={{
                                        boxShadow: '0 4px 15px rgba(34, 184, 207, 0.35)',
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
            </Box>

            {/* Social Quote Card Exporter Modal */}
            <QuoteCardModal
                opened={quoteCardModalOpen}
                onClose={() => setQuoteCardModalOpen(false)}
                content={form.values.content}
                mood={form.values.mood}
                displayMode={form.values.displayMode}
                isAnonymous={form.values.isAnonymous}
            />
        </form>
    );
};

export default PostForm;
