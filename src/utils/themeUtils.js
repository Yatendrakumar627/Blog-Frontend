// No external dependencies for basic color math

// Note: You'll need to install chroma-js if not present, but for now I'll use standard color math
// Actually, I'll implement a simple hex-to-hsl and hsl-to-hex to avoid dependencies if possible.

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Simple lighten/darken
const adjustColor = (hex, amount) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const r = Math.min(255, Math.max(0, rgb.r + amount));
    const g = Math.min(255, Math.max(0, rgb.g + amount));
    const b = Math.min(255, Math.max(0, rgb.b + amount));
    return rgbToHex(r, g, b);
};

export const generateThemeFromColor = (primaryColor) => {
    const isLight = (hex) => {
        const rgb = hexToRgb(hex);
        if (!rgb) return true;
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128;
    };

    const lightColor = adjustColor(primaryColor, 180);
    const darkColor = adjustColor(primaryColor, -180);

    return {
        name: 'Custom',
        light: `radial-gradient(circle at 0% 0%, ${adjustColor(primaryColor, 150)}66 0%, transparent 50%), 
                radial-gradient(circle at 100% 0%, ${adjustColor(primaryColor, 100)}44 0%, transparent 50%), 
                radial-gradient(circle at 100% 100%, ${adjustColor(primaryColor, 120)}33 0%, transparent 50%), 
                radial-gradient(circle at 0% 100%, ${adjustColor(primaryColor, 80)}22 0%, transparent 50%)`,
        dark: `radial-gradient(circle at 0% 0%, ${adjustColor(primaryColor, -100)}44 0%, transparent 50%), 
               radial-gradient(circle at 100% 0%, ${adjustColor(primaryColor, -120)}33 0%, transparent 50%), 
               radial-gradient(circle at 100% 100%, ${adjustColor(primaryColor, -150)}22 0%, transparent 50%), 
               radial-gradient(circle at 0% 100%, ${adjustColor(primaryColor, -80)}11 0%, transparent 50%)`,
        bgLight: adjustColor(primaryColor, 230),
        bgDark: adjustColor(primaryColor, -240)
    };
};
