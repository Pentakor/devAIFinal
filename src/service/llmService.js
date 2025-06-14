import { generateAISummary, validateSurveyResponses, searchSurveys } from './aiService.js';

// This service acts as a wrapper around aiService.js
// It provides the same interface but allows for mocking in tests
export const generateSummary = generateAISummary;
export const validateResponses = validateSurveyResponses;
export const searchSurveysByQuery = searchSurveys;

export default {
    generateSummary,
    validateResponses,
    searchSurveysByQuery
}; 