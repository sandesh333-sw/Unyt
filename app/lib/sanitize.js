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

// Sanitize only the named string fields of an object, leaving everything else
// untouched. Use this for payloads that mix free text with values that must NOT
// be HTML-escaped (e.g. Cloudinary URLs, which validator.escape would mangle
// into "https:&#x2F;&#x2F;...").
export function sanitizeFields(obj, fields){
    const result = { ...obj };
    for (const field of fields){
        if (typeof result[field] === 'string'){
            result[field] = sanitizeInput(result[field]);
        }
    }
    return result;
}

export function sanitizeObject(obj){
    // Preserve arrays as arrays — recursing with Object.entries would otherwise
    // rebuild them as plain objects ({ "0": ..., "1": ... }).
    if (Array.isArray(obj)){
        return obj.map((item) => {
            if (typeof item === 'string') return sanitizeInput(item);
            if (typeof item === 'object' && item !== null) return sanitizeObject(item);
            return item;
        });
    }

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