import Survey from '../models/Survey.js';
import { surveySchema, responseSchema } from '../validation/schemas.js';
import { getPrompt } from '../utils/promptLoader.js';
import validationService from './validationService.js';
import Response from '../models/Response.js';

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

export const getAllSurveys = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    return Survey.find()
        .populate('creator', 'username')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit);
};

export const getSurveyById = async (surveyId) => {
    const survey = await Survey.findById(surveyId)
        .populate('creator', 'username'); 

    if (!survey) {
        throw new Error('Survey not found');
    }

    const responses = await Response.find({ survey: surveyId })
        .populate('user', 'username');

    return { ...survey.toObject() }; 
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
export const deleteSurvey = async (surveyId, userId) => {
  

    const survey = await Survey.findById(surveyId);
    if (!survey) {
        throw new Error('Survey not found');
    }

    if (!survey.creator.equals(userId)) {
     
        throw new Error('Not authorized to delete this survey');
    }

    await Response.deleteMany({ survey: surveyId });

    await Survey.deleteOne({ _id: surveyId });

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
    if (isNaN(expiryDate.
        Time())) {
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

export const validateSurveyResponses = async (survey) => {
    try {
        const validationPrompt = getPrompt('validatePrompt');
        const validationResult = await validationService.validateSurveyResponses(survey.responses);
        return validationResult;
    } catch (error) {
        console.error('Error validating survey responses:', error);
        throw new Error('Failed to validate survey responses');
    }
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
    try {
        const searchPrompt = getPrompt('searchPrompt');
        const searchResults = await validationService.validateSurveyResponses(query);
        return searchResults;
    } catch (error) {
        console.error('Error searching surveys:', error);
        throw new Error('Failed to search surveys');
    }
};

export const searchByQuery = async (query) => {
    if (!query || typeof query !== 'string') {
        throw new Error('Valid search query is required');
    }

    // First get all surveys for context
    const allSurveys = await Survey.find({})
        .select('_id area question guidelines')
        .lean();

    // Use LLM to analyze the query and find relevant surveys
    const searchPrompt = {
        query,
        surveys: allSurveys.map(survey => ({
            id: survey._id,
            area: survey.area,
            question: survey.question,
            domains: survey.guidelines.permittedDomains
        }))
    };

    try {
        const searchResults = await aiService.searchSurveys(searchPrompt);
        
        // Get full survey details for matching surveys
        const matchingSurveys = await Survey.find({
            _id: { $in: searchResults.map(result => result.surveyId) }
        }).populate('creator', 'username');

        // Combine LLM results with survey details
        return matchingSurveys.map(survey => {
            const result = searchResults.find(r => r.surveyId.toString() === survey._id.toString());
            return {
                survey,
                relevance: result.relevance,
                explanation: result.explanation
            };
        });
    } catch (error) {
        console.error('Error in semantic search:', error);
        throw new Error('Failed to perform semantic search');
    }
}; 