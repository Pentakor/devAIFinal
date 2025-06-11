// __mocks__/llmService.js
const mockLLMService = {
    generateSummary: jest.fn().mockResolvedValue({
        summary: "This is a mock summary of the survey responses.",
        insights: ["Mock insight 1", "Mock insight 2"],
        sentiment: "positive"
    }),
    
    validateResponses: jest.fn().mockResolvedValue({
        violations: [
            {
                responseId: "mock-response-id",
                explanation: "Mock violation explanation"
            }
        ]
    }),
    
    searchSurveysByQuery: jest.fn().mockResolvedValue({
        matches: [
            {
                surveyid: "mock-survey-id",
                relevanceScore: 0.95,
                matchReason: "Mock match reason"
            }
        ]
    })
};

// Named exports for individual functions
export const generateSummary = mockLLMService.generateSummary;
export const validateResponses = mockLLMService.validateResponses;
export const searchSurveysByQuery = mockLLMService.searchSurveysByQuery;

// Default export for the whole service
export default mockLLMService;