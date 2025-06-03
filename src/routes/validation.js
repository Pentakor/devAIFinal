import express from 'express';
import { validateSurveyResponses } from '../controllers/validationController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { surveyResponsesSchema } from '../validation/schemas.js';
import { asyncHandler } from '../utils/errors.js';

const router = express.Router();

// Validate survey responses
router.post('/validate',
    validateRequest(surveyResponsesSchema),
    asyncHandler(validateSurveyResponses)
);

export default router; 