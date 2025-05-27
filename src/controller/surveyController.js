import {
    createSurvey,
    getAllSurveys,
    getSurveyById,
    updateSurvey,
    closeSurvey,
    addResponse,
    searchSurveys,
    updateSurveyExpiry,
    updateSurveyResponse,
    removeResponse,
    validateSurveyResponses,
    generateSurveySummary,
    toggleSummaryVisibility,
    searchSurveysByQuery
} from '../service/surveyService.js';

export const create = async (req, res) => {
    try {
        const survey = await createSurvey(req.body, req.user._id);
        res.status(201).json(survey);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAll = async (req, res) => {
    try {
        const surveys = await getAllSurveys();
        res.json(surveys);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getById = async (req, res) => {
    try {
        const survey = await getSurveyById(req.params.id);
        res.json(survey);
    } catch (error) {
        if (error.message === 'Survey not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

export const update = async (req, res) => {
    try {
        const survey = await updateSurvey(req.params.id, req.body, req.user._id);
        res.json(survey);
    } catch (error) {
        if (error.message === 'Survey not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to update this survey') {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

export const close = async (req, res) => {
    try {
        const survey = await closeSurvey(req.params.id, req.user._id);
        res.json(survey);
    } catch (error) {
        if (error.message === 'Survey not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to close this survey') {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

export const addSurveyResponse = async (req, res) => {
    try {
        const survey = await addResponse(req.params.id, req.body, req.user._id);
        res.status(201).json(survey);
    } catch (error) {
        if (error.message === 'Survey not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Survey is closed') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Survey has expired') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message.includes('content')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

export const search = async (req, res) => {
    try {
        const surveys = await searchSurveys(req.query.query);
        res.json(surveys);
    } catch (error) {
        if (error.message === 'Search query is required') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateExpiry = async (req, res) => {
    try {
        const survey = await updateSurveyExpiry(req.params.id, req.body.expiryDate, req.user._id);
        res.json({
            status: 'success',
            data: { survey }
        });
    } catch (error) {
        if (error.message === 'Survey not found') {
            return res.status(404).json({
                status: 'error',
                errorCode: 'NOT_FOUND',
                message: error.message
            });
        }
        if (error.message === 'Not authorized to update this survey') {
            return res.status(403).json({
                status: 'error',
                errorCode: 'UNAUTHORIZED',
                message: error.message
            });
        }
        if (error.message === 'Invalid expiry date') {
            return res.status(400).json({
                status: 'error',
                errorCode: 'INVALID_DATE',
                message: error.message
            });
        }
        res.status(500).json({
            status: 'error',
            errorCode: 'SERVER_ERROR',
            message: 'Server error'
        });
    }
};

export const updateResponse = async (req, res) => {
    try {
        const survey = await updateSurveyResponse(
            req.params.surveyId,
            req.params.responseId,
            req.body,
            req.user._id
        );
        res.json(survey);
    } catch (error) {
        if (error.message === 'Survey not found' || error.message === 'Response not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to update this response') {
            return res.status(403).json({ message: error.message });
        }
        if (error.message === 'Survey is closed' || error.message === 'Survey has expired') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message.includes('content')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteSurveyResponse = async (req, res) => {
    try {
        const survey = await removeResponse(
            req.params.surveyId,
            req.params.responseId,
            req.user._id
        );
        res.json(survey);
    } catch (error) {
        if (error.message === 'Survey not found' || error.message === 'Response not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to remove this response') {
            return res.status(403).json({ message: error.message });
        }
        if (error.message === 'Survey is closed' || error.message === 'Survey has expired') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

export const validateResponses = async (req, res) => {
    try {
        const validationResult = await validateSurveyResponses(req.params.id, req.user._id);
        res.json(validationResult);
    } catch (error) {
        if (error.message === 'Survey not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to validate responses for this survey') {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

export const generateSummary = async (req, res) => {
    try {
        const survey = await generateSurveySummary(req.params.id, req.user._id, req.app.locals.prompts);
        res.json(survey);
    } catch (error) {
        if (error.message === 'Survey not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to generate summary for this survey') {
            return res.status(403).json({ message: error.message });
        }
        if (error.message === 'No responses available for summarization') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

export const toggleSummary = async (req, res) => {
    try {
        const survey = await toggleSummaryVisibility(req.params.id, req.user._id);
        res.json(survey);
    } catch (error) {
        if (error.message === 'Survey not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Not authorized to modify this survey') {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

export const searchByQuery = async (req, res) => {
    try {
        const results = await searchSurveysByQuery(req.query.query, req.app.locals.prompts);
        res.json(results);
    } catch (error) {
        if (error.message === 'Search query is required') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

export const removeInvalidResponse = async (req, res) => {
    try {
        const { id: surveyId, responseId } = req.params;
        const userId = req.user._id;

        const survey = await Survey.findById(surveyId);
        if (!survey) {
            return res.status(404).json({ message: 'Survey not found' });
        }

        if (survey.creator.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to remove responses from this survey' });
        }

        const response = await Response.findOneAndDelete({
            _id: responseId,
            survey: surveyId
        });

        if (!response) {
            return res.status(404).json({ message: 'Response not found' });
        }

        res.json({
            message: 'Response removed successfully',
            responseId: response._id
        });
    } catch (error) {
        console.error('Error removing response:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 