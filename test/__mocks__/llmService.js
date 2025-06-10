// __mocks__/llmService.js
const mockLLMService = {
    generateSummary: jest.fn().mockResolvedValue({
        summary: "This is a mock summary of the survey responses.",
        insights: ["Mock insight 1", "Mock insight 2"],
        sentiment: "positive"
    }),
    
    analyzeSentiment: jest.fn().mockResolvedValue({
        sentiment: 'positive',
        confidence: 0.85
    }),
    
    generateSurveyQuestions: jest.fn().mockResolvedValue([
        "What did you like most about Product Feedback?",
        "How would you improve Product Feedback?",
        "Would you recommend Product Feedback to others?"
    ])
};

// Named exports for individual functions
export const generateSummary = mockLLMService.generateSummary;
export const analyzeSentiment = mockLLMService.analyzeSentiment;
export const generateSurveyQuestions = mockLLMService.generateSurveyQuestions;

// Default export for the whole service
export default mockLLMService;