import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Allows safe formatting tags from the rich text editor but strips
 * scripts, event handlers, and dangerous elements.
 */
export const sanitizeHTML = (dirty) => {
    if (!dirty) return '';
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'em', 'u', 'b', 'i', 's', 'del',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'blockquote', 'pre', 'code',
            'a', 'img', 'span', 'div',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'hr', 'sub', 'sup',
        ],
        ALLOWED_ATTR: [
            'href', 'target', 'rel', 'src', 'alt', 'title',
            'class', 'style', 'id',
            'width', 'height',
        ],
        ALLOW_DATA_ATTR: false,
        ADD_ATTR: ['target'],
    });
};
