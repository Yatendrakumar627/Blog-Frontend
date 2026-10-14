export const FONT_FAMILIES = [
    {
        category: '🌸 Shayari & Script',
        fonts: [
            { label: 'Dancing Script', value: 'Dancing Script', preview: 'Dil Ki Awaz (Shayari)', desc: 'Calligraphic & Soulful' },
            { label: 'Great Vibes', value: 'Great Vibes', preview: 'Nazm o Ghazal', desc: 'Flowing Classical Cursive' },
            { label: 'Satisfy', value: 'Satisfy', preview: 'Soulful Whispers', desc: 'Warm Casual Script' },
            { label: 'Pacifico', value: 'Pacifico', preview: 'Expressive Heart', desc: 'Bold Handwritten Brush' }
        ]
    },
    {
        category: '📜 Poetry & Literary Serif',
        fonts: [
            { label: 'Playfair Display', value: 'Playfair Display', preview: 'Classic Editorial Poetry', desc: 'Elegant High-Contrast Serif' },
            { label: 'Lora', value: 'Lora', preview: 'Memoirs & Reflections', desc: 'Warm Literary Book Serif' },
            { label: 'Merriweather', value: 'Merriweather', preview: 'Deep Longform Prose', desc: 'Sturdy & Readable Serif' },
            { label: 'Georgia', value: 'Georgia', preview: 'Traditional Antiqua', desc: 'Standard Editorial' }
        ]
    },
    {
        category: '✨ Clean Modern Sans',
        fonts: [
            { label: 'Outfit', value: 'Outfit', preview: 'Modern Minimalist 2026', desc: 'Geometric & Crisp' },
            { label: 'Inter', value: 'Inter', preview: 'High-Clarity Thoughts', desc: 'Ultra-Clean Screen Sans' },
            { label: 'Montserrat', value: 'Montserrat', preview: 'Bold Statement Lines', desc: 'Modern Urban Sans' },
            { label: 'Josefin Sans', value: 'Josefin Sans', preview: 'Airy Vintage Geometric', desc: 'Light & Stylized' }
        ]
    },
    {
        category: '👑 Royal Heritage',
        fonts: [
            { label: 'Cinzel', value: 'Cinzel', preview: 'SHAHI DIL KI BAAT', desc: 'Royal Roman Lapidary' }
        ]
    },
    {
        category: '⌨️ Typewriter / Monospace',
        fonts: [
            { label: 'Courier New', value: 'Courier New', preview: 'Drafts & Diary Notes', desc: 'Vintage Mechanical Type' }
        ]
    }
];

export const ALL_FONTS = FONT_FAMILIES.flatMap(group => group.fonts);

export const QUICK_FONT_PRESETS = [
    { id: 'shayari', label: 'Shayari', font: 'Dancing Script', icon: '🌸', desc: 'Flowing Urdu/Hindi Calligraphy' },
    { id: 'poetry', label: 'Poetry', font: 'Playfair Display', icon: '📜', desc: 'Classic High-Contrast Serif' },
    { id: 'modern', label: 'Modern', font: 'Outfit', icon: '✨', desc: 'Sleek 2026 Geometric Sans' },
    { id: 'royal', label: 'Royal', font: 'Cinzel', icon: '👑', desc: 'Lapidary Monumental' },
    { id: 'typewriter', label: 'Typewriter', font: 'Courier New', icon: '⌨️', desc: 'Raw Diary Monospace' }
];

export const FONT_SIZES = [
    { label: 'Small (14px)', value: '14px', num: 14 },
    { label: 'Regular (16px)', value: '16px', num: 16 },
    { label: 'Reading (18px)', value: '18px', num: 18 },
    { label: 'Large (21px)', value: '21px', num: 21 },
    { label: 'Verse Title (26px)', value: '26px', num: 26 },
    { label: 'Shayari Header (32px)', value: '32px', num: 32 }
];

export const LINE_HEIGHT_OPTIONS = [
    { label: '1.2 (Couplets / Shayari)', value: '1.2' },
    { label: '1.4 (Compact Prose)', value: '1.4' },
    { label: '1.6 (Standard Reading)', value: '1.6' },
    { label: '1.9 (Spacious Poetry)', value: '1.9' },
    { label: '2.2 (Double Spaced)', value: '2.2' }
];
