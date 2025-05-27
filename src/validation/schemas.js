import Joi from 'joi';

export const registerSchema = Joi.object({
    username: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    registrationCode: Joi.string().required()
});

export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

export const surveySchema = Joi.object({
    area: Joi.string().required(),
    question: Joi.string().required(),
    guidelines: Joi.object({
        permittedDomains: Joi.array().items(Joi.string()).min(1).required(),
        permittedResponses: Joi.string().required(),
        summaryInstructions: Joi.string().required()
    }).required(),
    expiryDate: Joi.date().min('now').required()
});

export const responseSchema = Joi.object({
    content: Joi.string().required()
});

export const searchSchema = Joi.object({
    query: Joi.string().required()
}); 