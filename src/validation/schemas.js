import Joi from 'joi';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import Response from '../models/Response.js';
import Survey from '../models/Survey.js';

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
        .required(),
    question: Joi.string()
        .min(10)
        .max(1000)
        .required(),
    guidelines: Joi.object({
        permittedDomains: Joi.string()
            .min(2)
            .max(500)
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

export const updateExpirySchema = Joi.object({
    expiryDate: Joi.date()
        .min(new Date())
        .max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) // 1 year from now
        .required()
});

export const summaryVisibilitySchema = Joi.object({
    isSummaryVisible: Joi.boolean()
        .required()
});

export const responseSchema = Joi.object({
    content: Joi.string()
        .min(10)
        .max(2000)
        .required()
        .trim(),
    metadata: Joi.object({
        ipAddress: Joi.string().trim(),
        userAgent: Joi.string().trim()
    }).optional()
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

// Survey response validation schema
export const surveyResponsesSchema = Joi.object({
    surveyResponses: Joi.array()
        .items(
            Joi.object({
                surveyId: Joi.string()
                    .required()
                    .pattern(/^[0-9a-fA-F]{24}$/)
                    .messages({
                        'string.pattern.base': 'Invalid survey ID format'
                    }),
                responseId: Joi.string()
                    .required()
                    .pattern(/^[0-9a-fA-F]{24}$/)
                    .messages({
                        'string.pattern.base': 'Invalid response ID format'
                    }),
                content: Joi.string()
                    .required()
                    .min(10)
                    .max(2000)
                    .trim()
            })
        )
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one survey response is required'
        })
});

// Natural language search schema
export const naturalSearchSchema = Joi.object({
    query: Joi.string()
        .min(2)
        .max(200)  // Longer max length for natural language queries
        .required()
        .trim()
        .custom((value, helpers) => {
            // Ensure the query is not just a single word
            if (value.split(/\s+/).length < 2) {
                return helpers.message('Natural language search requires at least two words');
            }
            return value;
        })
});

export const addResponse = async (surveyId, responseData, userId) => {
    const { error } = responseSchema.validate(responseData);
    if (error) {
        throw new ValidationError(error.details[0].message);
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
        throw new NotFoundError('Survey not found');
    }

    if (survey.isClosed) {
        throw new ValidationError('Survey is closed');
    }

    if (survey.isExpired()) {
        throw new ValidationError('Survey has expired');
    }

    // Use findOneAndUpdate with upsert for atomic operation
    const response = await Response.findOneAndUpdate(
        { survey: surveyId, user: userId },
        {
            content: responseData.content,
            metadata: {
                ipAddress: responseData.metadata?.ipAddress,
                userAgent: responseData.metadata?.userAgent,
                submissionTime: new Date()
            },
            updatedAt: new Date()
        },
        {
            new: true,
            upsert: true,
            runValidators: true
        }
    );

    // Get the updated survey with responses
    const updatedSurvey = await Survey.findById(surveyId)
        .populate('creator', 'username');

    const responses = await Response.find({ survey: surveyId })
        .populate('user', 'username');

    const result = updatedSurvey.toObject();
    result.responses = responses;
    return result;
}; 