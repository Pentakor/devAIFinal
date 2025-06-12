import Survey from '../models/Survey.js';
import Response from '../models/Response.js';
import { 
    ValidationError, 
    NotFoundError, 
    AuthorizationError,
    ConflictError,
    AuthenticationError
} from '../utils/errors.js';
import * as surveyService from '../service/surveyService.js';
import { asyncHandler } from '../utils/errors.js';
import { loadPrompts } from '../utils/promptLoader.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const promptsDir = path.join(__dirname, '..', 'prompts');

// Survey controllers
export const createSurvey = asyncHandler(async (req, res) => {
    const survey = await surveyService.createSurvey(req.body, req.user._id);
    res.status(201).json({
        status: 'success',
        data: survey
    });
});

export const getSurvey = asyncHandler(async (req, res) => {
    const survey = await surveyService.getSurveyById(req.params.id);
    if (!survey) {
        throw new NotFoundError('Survey not found');
    }
    res.status(200).json({
        status: 'success',
        data: survey
    });
});

export const deleteSurvey = asyncHandler(async (req, res) => {
    await surveyService.deleteSurvey(req.params.id, req.user._id);
    res.status(204).send(); 
});

export const listSurveys = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.query.user || null;

    const surveys = await surveyService.getAllSurveys(page, limit, userId);
    
    res.status(200).json({
        status: 'success',
        data: surveys
    });
});

export const searchSurveys = asyncHandler(async (req, res) => {
    if (!req.query.query) {
        throw new ValidationError('Search query is required');
    }

    const results = await surveyService.searchSurveys(req.query.query);
    
    res.status(200).json({
        status: 'success',
        data: {
            results: results.map(result => ({
                survey: result.survey,
                relevanceScore: result.relevanceScore,
                matchReason: result.matchReason
            }))
        }
    });
});

// Survey management operations
export const closeSurvey = asyncHandler(async (req, res) => {
    const survey = await surveyService.closeSurvey(req.params.id, req.user._id);
    if (!survey) {
        throw new NotFoundError('Survey not found');
    }
    res.status(200).json({
        status: 'success',
        data: survey
    });
});

export const getSurveyExpiry = asyncHandler(async (req, res) => {
    const survey = await surveyService.getSurveyById(req.params.id);
    if (!survey) {
        throw new NotFoundError('Survey not found');
    }
    res.status(200).json({
        status: 'success',
        data: {
            expiryDate: survey.expiryDate,
            isExpired: survey.isExpired()
        }
    });
});

export const updateSurveyExpiry = asyncHandler(async (req, res) => {
    const survey = await surveyService.updateSurveyExpiry(req.params.id, req.body.expiryDate, req.user._id);
    if (!survey) {
        throw new NotFoundError('Survey not found');
    }
    res.status(200).json({
        status: 'success',
        data: survey
    });
});

export const validateResponses = asyncHandler(async (req, res) => {
    const survey = await surveyService.getSurveyById(req.params.id);
    if (!survey) {
        throw new NotFoundError('Survey not found');
    }

    // Get the creator ID, handling both populated and unpopulated cases
    const creatorId = survey.creator._id ? survey.creator._id.toString() : survey.creator.toString();
    const requestingUserId = req.user._id.toString();

    if (creatorId !== requestingUserId) {
        throw new AuthenticationError('Only survey creator can validate responses');
    }

    const validationResults = await surveyService.validateSurveyResponsesWithAI(survey);
    
    res.status(200).json({
        status: 'success',
        data: {
            surveyId: survey._id,
            validationResults
        }
    });
});

export const generateSummary = asyncHandler(async (req, res) => {
    // Load prompts
    const prompts = await loadPrompts(promptsDir);
    
    const survey = await surveyService.generateSurveySummary(req.params.id, req.user._id, prompts);
    if (!survey) {
        throw new NotFoundError('Survey not found');
    }
    
    res.status(200).json({
        status: 'success',
        data: survey
    });
});

export const toggleSummary = asyncHandler(async (req, res) => {
    const survey = await surveyService.toggleSummaryVisibility(req.params.id, req.user._id, req.body.isSummaryVisible);
    if (!survey) {
        throw new NotFoundError('Survey not found');
    }
    res.status(200).json({
        status: 'success',
        data: survey
    });
});

// Response operations
export const submitResponse = asyncHandler(async (req, res) => {
    const survey = await surveyService.addResponse(req.params.id, req.body, req.user._id);
    res.status(201).json({
      status: 'success',
      data: survey
    });
  });
  

export const updateResponse = asyncHandler(async (req, res) => {
    const response = await surveyService.updateSurveyResponse(
        req.params.id,
        req.params.responseId,
        req.body,
        req.user._id
    );
    res.status(200).json({
        status: 'success',
        data: response
    });
});

export const deleteSurveyResponse = asyncHandler(async (req, res) => {
    await surveyService.removeResponse(
        req.params.id,
        req.params.responseId,
        req.user._id
    );
    res.status(204).send(); // No content
});

export const listResponses = asyncHandler(async (req, res) => {
    const survey = await surveyService.getSurveyById(req.params.id);
    if (!survey) {
        throw new NotFoundError('Survey not found');
    }
    // Fetch responses for this survey
    const responses = await Response.find({ survey: req.params.id })
        .populate('user', 'username')
        .sort({ createdAt: -1 });
    res.status(200).json({
        status: 'success',
        data: responses
    });
});

export const deleteBadResponses = asyncHandler(async (req, res) => {
    const result = await surveyService.deleteBadResponses(req.params.id, req.user._id);
    res.status(200).json({
        status: 'success',
        data: {
            deletedCount: result.deletedCount
        }
    });
});

export const getUserResponses = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    
    // Check if the requesting user is the same as the userId
    if (req.user._id.toString() !== userId) {
        throw new AuthenticationError('Not authorized to view these responses');
    }

    // Fetch responses for this user
    const responses = await Response.find({ user: userId })
        .populate('survey', 'title description')
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        data: responses
    });
}); 