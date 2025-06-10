import Survey from '../models/Survey.js';
import { surveySchema, responseSchema } from '../validation/schemas.js';
import { getPrompt } from '../utils/promptLoader.js';
import Response from '../models/Response.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';
import { generateAISummary, validateSurveyResponses } from './aiService.js';
import path from 'path';
import { loadPrompts } from '../utils/promptLoader.js';

export const createSurvey = async (surveyData, userId) => {
    const { error } = surveySchema.validate(surveyData);
    if (error) {
        throw new ValidationError(error.details[0].message);
    }

    try {
        const survey = new Survey({
            ...surveyData,
            creator: userId
        });

        await survey.save();
        return survey;
    } catch (err) {
        if (err.code === 11000) {
            throw new ConflictError('A survey with the same question and guidelines already exists');
        }
        throw err;
    }
};

export const getAllSurveys = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const surveys = await Survey.find()
        .populate('creator', 'username')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean();

    // Parse summary content for each survey and remove if not visible
    surveys.forEach(survey => {
        if (survey.summary) {
            if (survey.summary.isVisible && survey.summary.content) {
                try {
                    survey.summary.content = JSON.parse(survey.summary.content);
                } catch (error) {
                    console.error('Error parsing summary content:', error);
                }
            } else {
                // Remove summary if not visible
                delete survey.summary;
            }
        }
    });

    return surveys;
};

export const getSurveyById = async (surveyId) => {
    const survey = await Survey.findById(surveyId)
        .populate('creator', 'username'); 

    if (!survey) {
        throw new NotFoundError('Survey not found');
    }

    const responses = await Response.find({ survey: surveyId })
        .populate('user', 'username');

    // Convert to plain object to modify
    const surveyObj = survey.toObject();
    
    // Remove summary if not visible
    if (surveyObj.summary && !surveyObj.summary.isVisible) {
        delete surveyObj.summary;
    } else if (surveyObj.summary && surveyObj.summary.content) {
        try {
            surveyObj.summary.content = JSON.parse(surveyObj.summary.content);
        } catch (error) {
            console.error('Error parsing summary content:', error);
        }
    }

    return surveyObj;
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
            validation: 'pending',
            violationExplanation: '',
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
        getTime())) {
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

    // Find the response in the Response collection
    const response = await Response.findOne({ _id: responseId, survey: surveyId, user: userId });
    if (!response) {
        throw new NotFoundError('Response not found');
    }

    response.content = responseData.content;
    response.updatedAt = new Date();
    await response.save();

    // Optionally, return the updated response or the survey with all responses
    return response;
};

export const removeResponse = async (surveyId, responseId, userId) => {
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

    // Find the response in the Response collection
    const response = await Response.findOne({ _id: responseId, survey: surveyId });
    if (!response) {
        throw new NotFoundError('Response not found');
    }

    // Only the owner of the response or the survey creator can delete
    if (response.user.toString() !== userId.toString() && survey.creator.toString() !== userId.toString()) {
        throw new ValidationError('Not authorized to delete this response');
    }

    await Response.deleteOne({ _id: responseId });

    // Optionally, return a success message or nothing
    return { success: true };
};

export const validateSurveyResponsesWithAI = async (survey) => {
    try {
        console.log('Starting validation for survey:', survey._id);
        
        // Get responses for the survey
        const responses = await Response.find({ survey: survey._id })
            .populate('user', 'username');
        
        console.log(`Found ${responses.length} responses to validate`);

        // Load prompts
        const promptsDir = path.join(process.cwd(), 'src', 'prompts');
        const prompts = await loadPrompts(promptsDir);
        console.log('Loaded prompts successfully');

        // Get the validation prompt template
        const validationPrompt = getPrompt(prompts, 'validatePrompt');
        if (!validationPrompt) {
            throw new Error('Validation prompt template not found');
        }

        // Prepare survey guidelines
        const permittedDomains = Array.isArray(survey.guidelines?.permittedDomains) 
            ? survey.guidelines.permittedDomains 
            : [];
        const permittedResponses = Array.isArray(survey.guidelines?.permittedResponses)
            ? survey.guidelines.permittedResponses
            : [];

        // Prepare the prompt with survey data
        const filledPrompt = validationPrompt
            .replace('{question}', survey.question || '')
            .replace('{permittedDomains}', permittedDomains.join(', ') || 'No specific domains required')
            .replace('{permittedResponses}', permittedResponses.join(', ') || 'No specific response format required')
            .replace('{surveyResponses}', JSON.stringify(responses.map(r => ({
                id: r._id,
                content: r.content,
                user: r.user.username
            }))));

        console.log('Prepared validation prompt');

        // Use AI service to validate responses
        const validationResults = await validateSurveyResponses(filledPrompt);
        console.log('Received validation results:', validationResults);
        
        // First, mark all responses as approved by default
        console.log('Marking all responses as approved by default');
        for (const response of responses) {
            await response.markAsApproved();
        }

        // Then, mark only the responses in violations list as violations
        if (validationResults && validationResults.violations && Array.isArray(validationResults.violations)) {
            console.log(`Processing ${validationResults.violations.length} violations`);
            for (const violation of validationResults.violations) {
                const response = responses.find(r => r._id.toString() === violation.responseId);
                if (response) {
                    console.log(`Marking response ${violation.responseId} as violation`);
                    await response.markAsViolation(violation.explanation);
                } else {
                    console.warn(`Response ${violation.responseId} not found in survey responses`);
                }
            }
        } else {
            console.log('No violations found in validation results');
        }

        return {
            totalResponses: responses.length,
            validatedResponses: responses.length,
            violations: validationResults?.violations || []
        };
    } catch (error) {
        console.error('Error in validateSurveyResponsesWithAI:', error);
        if (error.response) {
            console.error('API error details:', error.response.data);
        }
        throw new Error(`Failed to validate survey responses: ${error.message}`);
    }
};

export const generateSurveySummary = async (surveyId, userId, prompts) => {
    // First get the survey
    const survey = await Survey.findById(surveyId)
        .populate('creator', 'username');
    
    if (!survey) {
        throw new Error('Survey not found');
    }

    // Get the creator ID, handling both populated and unpopulated cases
    const creatorId = survey.creator._id ? survey.creator._id.toString() : survey.creator.toString();
    const requestingUserId = userId.toString();

    // Debug logging
    console.log('Creator ID:', creatorId);
    console.log('Requesting User ID:', requestingUserId);

    if (creatorId !== requestingUserId) {
        throw new Error('Not authorized to generate summary for this survey');
    }

    // Get responses separately
    const responses = await Response.find({ survey: surveyId })
        .populate('user', 'username');

    if (responses.length === 0) {
        throw new Error('No responses available for summarization');
    }

    // Prepare survey data for the prompt
    const surveyData = {
        area: survey.area,
        question: survey.question,
        guidelines: survey.guidelines,
        responses: responses.map(r => ({
            content: r.content,
            user: r.user.username
        }))
    };

    // Get the summary prompt template from loaded prompts
    const summaryPrompt = prompts.summaryPrompt;
    if (!summaryPrompt) {
        throw new Error('Summary prompt template not found');
    }
    
    // Replace placeholders in the prompt
    const filledPrompt = summaryPrompt
        .replace('{area}', surveyData.area)
        .replace('{question}', surveyData.question)
        .replace('{guidelines}', JSON.stringify(surveyData.guidelines))
        .replace('{responses}', JSON.stringify(surveyData.responses));

    // Generate summary using AI service
    const summary = await generateAISummary(filledPrompt);

    // Stringify the summary content before saving
    const summaryContent = JSON.stringify(summary);

    // Get the survey document
    const surveyToUpdate = await Survey.findById(surveyId);
    if (!surveyToUpdate) {
        throw new Error('Survey not found');
    }

    // Update the summary fields
    surveyToUpdate.summary = {
        content: summaryContent,
        lastUpdated: new Date(),
        isVisible: false
    };

    // Save the updated survey
    const updatedSurvey = await surveyToUpdate.save();
    if (!updatedSurvey) {
        throw new Error('Failed to update survey summary');
    }

    // Get the final survey with populated responses
    const finalSurvey = await Survey.findById(surveyId)
        .populate('creator', 'username')
        .populate({
            path: 'responses',
            populate: {
                path: 'user',
                select: 'username'
            }
        })
        .lean();

    // Parse the summary content back to an object for the response
    if (finalSurvey.summary && finalSurvey.summary.content) {
        finalSurvey.summary.content = JSON.parse(finalSurvey.summary.content);
    }

    return finalSurvey;
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
        const searchResults = await validateSurveyResponses(query);
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