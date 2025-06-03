import { ValidationError } from '../utils/errors.js';
import { asyncHandler } from '../utils/errors.js';
import * as validationService from '../service/validationService.js';

export const validateSurveyResponses = asyncHandler(async (req, res) => {
    const { surveyResponses } = req.body;

    if (!surveyResponses || !Array.isArray(surveyResponses)) {
        throw new ValidationError('Survey responses must be provided as an array');
    }

    const validationResults = await validationService.validateSurveyResponses(surveyResponses);

    res.status(200).json({
        status: 'success',
        data: validationResults
    });
}); 