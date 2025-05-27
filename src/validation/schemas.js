import Joi from 'joi';

// Common schemas
export const idSchema = Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
        'string.pattern.base': 'Invalid ID format'
    });

export const paginationSchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10),
    sort: Joi.string()
        .valid('createdAt', 'updatedAt', 'expiryDate')
        .default('createdAt'),
    order: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
});

// Auth schemas
export const registerSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(30)
        .required()
        .pattern(/^[a-zA-Z0-9_-]+$/)
        .messages({
            'string.pattern.base': 'Username can only contain letters, numbers, underscores, and hyphens'
        }),
    email: Joi.string()
        .email()
        .required()
        .lowercase(),
    password: Joi.string()
        .min(6)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/)
        .messages({
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        }),
    registrationCode: Joi.string()
        .required()
        .length(6)
        .pattern(/^[A-Z0-9]+$/)
        .messages({
            'string.pattern.base': 'Registration code must be 6 characters long and contain only uppercase letters and numbers'
        })
});

export const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .lowercase(),
    password: Joi.string()
        .required()
});

// Survey schemas
export const surveySchema = Joi.object({
    area: Joi.string()
        .min(3)
        .max(100)
        .required()
        .pattern(/^[a-zA-Z0-9\s-_]+$/)
        .messages({
            'string.pattern.base': 'Area can only contain letters, numbers, spaces, hyphens, and underscores'
        }),
    question: Joi.string()
        .min(10)
        .max(1000)
        .required()
        .custom((value, helpers) => {
            if (!value.endsWith('?')) {
                return helpers.error('string.custom', { message: 'Question must end with a question mark' });
            }
            return value;
        }),
    guidelines: Joi.object({
        permittedDomains: Joi.array()
            .items(
                Joi.string()
                    .pattern(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
                    .messages({
                        'string.pattern.base': 'Invalid domain format'
                    })
            )
            .min(1)
            .required(),
        permittedResponses: Joi.string()
            .min(10)
            .max(500)
            .required(),
        summaryInstructions: Joi.string()
            .min(10)
            .max(500)
            .required()
    }).required(),
    expiryDate: Joi.date()
        .min(new Date())
        .max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) // 1 year from now
        .required()
});

export const responseSchema = Joi.object({
    content: Joi.string()
        .min(10)
        .max(2000)
        .required()
        .trim()
});

export const searchSchema = Joi.object({
    query: Joi.string()
        .min(2)
        .max(100)
        .required()
        .trim(),
    type: Joi.string()
        .valid('exact', 'fuzzy', 'semantic')
        .default('fuzzy')
});

// Parameter schemas
export const idParamSchema = Joi.object({
    id: idSchema
});

export const responseIdParamSchema = Joi.object({
    id: idSchema,
    responseId: idSchema
});

// Query schemas
export const searchQuerySchema = Joi.object({
    query: Joi.string()
        .min(2)
        .max(100)
        .required()
        .trim(),
    type: Joi.string()
        .valid('exact', 'fuzzy', 'semantic')
        .default('fuzzy')
});

// LLM schemas
export const llmRequestSchema = Joi.object({
    prompt: Joi.string()
        .min(1)
        .max(2000)
        .required(),
    temperature: Joi.number()
        .min(0)
        .max(2)
        .default(0.7),
    maxTokens: Joi.number()
        .integer()
        .min(1)
        .max(4000)
        .default(1000)
});

// Database schemas
export const databaseQuerySchema = Joi.object({
    filter: Joi.object()
        .pattern(Joi.string(), Joi.any())
        .default({}),
    sort: Joi.object()
        .pattern(Joi.string(), Joi.number().valid(-1, 1))
        .default({ createdAt: -1 }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(1000)
        .default(100),
    skip: Joi.number()
        .integer()
        .min(0)
        .default(0)
}); 