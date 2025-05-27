import Survey from '../storage/models/Survey.js';
import { surveySchema, responseSchema } from '../validation/schemas.js';
import { getPrompt } from '../utils/promptLoader.js';

export const createSurvey = async (surveyData, userId) => {
    const { error } = surveySchema.validate(surveyData);
    if (error) {
        throw new Error(error.details[0].message);
    }

    const survey = new Survey({
        ...surveyData,
        creator: userId
    });

    await survey.save();
    return survey;
};

export const getAllSurveys = async () => {
    return Survey.find()
        .populate('creator', 'username')
        .sort('-createdAt');
};

export const getSurveyById = async (surveyId) => {
    const survey = await Survey.findById(surveyId)
        .populate('creator', 'username')
        .populate('responses.user', 'username');
    
    if (!survey) {
        throw new Error('Survey not found');
    }

    return survey;
};

export const updateSurvey = async (surveyId, surveyData, userId) => {
    const { error } = surveySchema.validate(surveyData);
    if (error) {
        throw new Error(error.details[0].message);
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
        throw new Error('Survey not found');
    }

    if (survey.creator.toString() !== userId.toString()) {
        throw new Error('Not authorized to update this survey');
    }

    if (new Date() > survey.expiryDate) {
        throw new Error('Survey has expired');
    }

    Object.assign(survey, surveyData);
    await survey.save();
    return survey;
};

export const closeSurvey = async (surveyId, userId) => {
    const survey = await Survey.findById(surveyId);
    if (!survey) {
        throw new Error('Survey not found');
    }

    if (survey.creator.toString() !== userId.toString()) {
        throw new Error('Not authorized to close this survey');
    }

    survey.isClosed = true;
    await survey.save();
    return survey;
};

export const addResponse = async (surveyId, responseData, userId) => {
    const { error } = responseSchema.validate(responseData);
    if (error) {
        throw new Error(error.details[0].message);
    }

    const survey = await Survey.findById(surveyId)
        .populate('creator', 'username')
        .populate('responses.user', 'username');
    
    if (!survey) {
        throw new Error('Survey not found');
    }

    if (survey.isClosed) {
        throw new Error('Survey is closed');
    }

    if (new Date() > survey.expiryDate) {
        throw new Error('Survey has expired');
    }

    // Check if user has already submitted a response
    const existingResponse = survey.responses.find(
        r => r.user.toString() === userId.toString()
    );

    if (existingResponse) {
        existingResponse.content = responseData.content;
        existingResponse.updatedAt = new Date();
    } else {
        survey.responses.push({
            user: userId,
            content: responseData.content,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    await survey.save();
    return survey;
};

export const searchSurveys = async (query) => {
    if (!query) {
        throw new Error('Search query is required');
    }

    return Survey.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .populate('creator', 'username');
};

export const updateSurveyExpiry = async (surveyId, newExpiryDate, userId) => {
    const survey = await Survey.findById(surveyId);
    if (!survey) {
        throw new Error('Survey not found');
    }

    if (survey.creator.toString() !== userId.toString()) {
        throw new Error('Not authorized to update this survey');
    }

    // Validate the new expiry date
    const expiryDate = new Date(newExpiryDate);
    if (isNaN(expiryDate.getTime())) {
        throw new Error('Invalid expiry date');
    }

    // Only allow updating expiry if the survey is not already closed
    if (survey.isClosed) {
        throw new Error('Cannot update expiry date of a closed survey');
    }

    survey.expiryDate = expiryDate;
    await survey.save();
    return survey;
};

export const updateSurveyResponse = async (surveyId, responseId, responseData, userId) => {
    const { error } = responseSchema.validate(responseData);
    if (error) {
        throw new Error(error.details[0].message);
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
        throw new Error('Survey not found');
    }

    if (new Date() > survey.expiryDate) {
        throw new Error('Survey has expired');
    }

    const response = survey.responses.id(responseId);
    if (!response) {
        throw new Error('Response not found');
    }

    if (response.user.toString() !== userId.toString()) {
        throw new Error('Not authorized to update this response');
    }

    response.content = responseData.content;
    response.updatedAt = new Date();
    await survey.save();
    return survey;
};

export const removeResponse = async (surveyId, responseId, userId) => {
    const survey = await Survey.findById(surveyId);
    if (!survey) {
        throw new Error('Survey not found');
    }

    if (new Date() > survey.expiryDate) {
        throw new Error('Survey has expired');
    }

    const response = survey.responses.id(responseId);
    if (!response) {
        throw new Error('Response not found');
    }

    if (response.user.toString() !== userId.toString()) {
        throw new Error('Not authorized to delete this response');
    }

    survey.responses.pull(responseId);
    await survey.save();
    return survey;
};

export const validateSurveyResponses = async (surveyId, userId) => {
    const survey = await Survey.findById(surveyId)
        .populate('creator', 'username')
        .populate('responses.user', 'username');
    
    if (!survey) {
        throw new Error('Survey not found');
    }

    if (survey.creator.toString() !== userId.toString()) {
        throw new Error('Not authorized to validate responses for this survey');
    }

    const violations = [];
    
    // Check each response against guidelines
    survey.responses.forEach(response => {
        const content = response.content.toLowerCase();
        
        // Check for offensive content
        const offensiveWords = ['offensive', 'inappropriate', 'spam']; // Add more as needed
        if (offensiveWords.some(word => content.includes(word))) {
            violations.push({
                responseId: response._id,
                userId: response.user._id,
                reason: 'Contains offensive or inappropriate content'
            });
        }

        // Check for relevance
        if (!content.includes(survey.area.toLowerCase())) {
            violations.push({
                responseId: response._id,
                userId: response.user._id,
                reason: 'Response not relevant to survey area'
            });
        }

        // Check for spam patterns
        if (content.length < 10 || content.length > 1000) {
            violations.push({
                responseId: response._id,
                userId: response.user._id,
                reason: 'Response length suggests spam'
            });
        }
    });

    return {
        surveyId,
        totalResponses: survey.responses.length,
        violations
    };
};

export const generateSurveySummary = async (surveyId, userId, prompts) => {
    const survey = await Survey.findById(surveyId)
        .populate('creator', 'username')
        .populate('responses.user', 'username');
    
    if (!survey) {
        throw new Error('Survey not found');
    }

    if (survey.creator.toString() !== userId.toString()) {
        throw new Error('Not authorized to generate summary for this survey');
    }

    if (survey.responses.length === 0) {
        throw new Error('No responses available for summarization');
    }

    // Prepare survey data for the prompt
    const surveyData = {
        area: survey.area,
        question: survey.question,
        guidelines: survey.guidelines,
        responses: survey.responses.map(r => ({
            content: r.content,
            user: r.user.username
        }))
    };

    // Get the summary prompt template
    const summaryPrompt = getPrompt(prompts, 'summaryPrompt');
    
    // Replace placeholders in the prompt
    const filledPrompt = summaryPrompt
        .replace('{area}', surveyData.area)
        .replace('{question}', surveyData.question)
        .replace('{guidelines}', JSON.stringify(surveyData.guidelines))
        .replace('{responses}', JSON.stringify(surveyData.responses));

    // TODO: Call AI service to generate summary
    // For now, return a mock summary
    const summary = {
        themes: ['Theme 1', 'Theme 2'],
        keyInsights: ['Insight 1', 'Insight 2'],
        recommendations: ['Recommendation 1', 'Recommendation 2'],
        concerns: ['Concern 1', 'Concern 2']
    };

    // Update survey with the new summary
    survey.summary = {
        content: summary,
        isVisible: true,
        lastUpdated: new Date()
    };

    await survey.save();
    return survey;
};

export const toggleSummaryVisibility = async (surveyId, userId) => {
    const survey = await Survey.findById(surveyId);
    if (!survey) {
        throw new Error('Survey not found');
    }

    if (survey.creator.toString() !== userId.toString()) {
        throw new Error('Not authorized to modify this survey');
    }

    // Toggle the visibility
    survey.summary.isVisible = !survey.summary.isVisible;
    survey.summary.lastUpdated = new Date();
    
    await survey.save();
    return survey;
};

export const searchSurveysByQuery = async (query, prompts) => {
    if (!query) {
        throw new Error('Search query is required');
    }

    // Get all surveys
    const surveys = await Survey.find()
        .populate('creator', 'username')
        .sort('-createdAt');

    // Prepare survey data for the prompt
    const surveyData = surveys.map(survey => ({
        uri: `/api/surveys/${survey._id}`,
        area: survey.area,
        question: survey.question,
        guidelines: survey.guidelines,
        createdAt: survey.createdAt,
        creator: survey.creator.username
    }));

    // Get the search prompt template
    const searchPrompt = getPrompt(prompts, 'searchPrompt');
    
    // Replace placeholders in the prompt
    const filledPrompt = searchPrompt
        .replace('{query}', query)
        .replace('{surveyData}', JSON.stringify(surveyData));

    // TODO: Call AI service to process the prompt and get matches
    // For now, return a mock response
    const matches = surveyData
        .filter(survey => 
            survey.area.toLowerCase().includes(query.toLowerCase()) ||
            survey.question.toLowerCase().includes(query.toLowerCase())
        )
        .map(survey => ({
            surveyUri: survey.uri,
            relevanceScore: 0.8,
            matchReason: `Matches query in ${survey.area} area`
        }));

    return {
        query,
        totalMatches: matches.length,
        matches
    };
}; 