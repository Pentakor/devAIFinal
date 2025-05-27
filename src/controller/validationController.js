import validationService from '../service/validationService.js';

export const validateSurveyResponses = async (req, res) => {
    try {
        const { surveyResponses } = req.body;

        if (!surveyResponses || !Array.isArray(surveyResponses)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request. Survey responses must be provided as an array.'
            });
        }

        const validationResults = await validationService.validateSurveyResponses(surveyResponses);

        return res.status(200).json({
            success: true,
            data: validationResults
        });
    } catch (error) {
        console.error('Error in validateSurveyResponses:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to validate survey responses',
            error: error.message
        });
    }
}; 