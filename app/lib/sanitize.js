import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input){
    if (typeof input !== 'string') return input;

    // Remove any HTML tags
    let sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: []});

    // Escape special characters
    sanitized = validator.escape(sanitized);

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
}

export function sanitizeObject(obj){
    const sanitized = { };

    for(const [key, value] of Object.entries(obj)){
        if (typeof value === 'string'){
            sanitized[key] = sanitizeInput(value);
        } else if (typeof value === 'object' && value !== null){
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}