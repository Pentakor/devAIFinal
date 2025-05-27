import Joi from 'joi';
import { ValidationError } from '../utils/errors.js';
import sanitizeHtml from 'sanitize-html';

// Sanitization options
const sanitizeOptions = {
    allowedTags: ['b', 'i', 'em', 'strong', 'a'],
    allowedAttributes: {
        'a': ['href']
    },
    allowedIframeHostnames: []
};

// Sanitize request body
export const sanitizeBody = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeHtml(req.body[key], sanitizeOptions);
            }
        });
    }
    next();
};

// Custom error messages
const customMessages = {
    'string.empty': '{{#label}} cannot be empty',
    'string.min': '{{#label}} must be at least {{#limit}} characters long',
    'string.max': '{{#label}} cannot exceed {{#limit}} characters',
    'string.email': 'Please provide a valid email address',
    'string.pattern.base': '{{#label}} contains invalid characters',
    'number.base': '{{#label}} must be a number',
    'number.min': '{{#label}} must be at least {{#limit}}',
    'number.max': '{{#label}} cannot exceed {{#limit}}',
    'date.base': '{{#label}} must be a valid date',
    'date.min': '{{#label}} must be in the future',
    'date.max': '{{#label}} cannot be more than 1 year in the future',
    'object.unknown': '{{#label}} contains unknown fields',
    'array.min': '{{#label}} must contain at least {{#limit}} items',
    'any.required': '{{#label}} is required'
};

// Validate request body
export const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            messages: customMessages
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            throw new ValidationError('Validation failed', errors);
        }

        req.body = value;
        next();
    };
};

// Validate request parameters
export const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
            messages: customMessages
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            throw new ValidationError('Invalid parameters', errors);
        }

        req.params = value;
        next();
    };
};

// Validate query parameters
export const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            messages: customMessages
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));
            throw new ValidationError('Invalid query parameters', errors);
        }

        req.query = value;
        next();
    };
}; 