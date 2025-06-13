// __mocks__/llmService.js
const mockLLMService = {
    generateSummary: () => Promise.resolve({
        summary: "This is a mock summary of the survey responses.",
        insights: ["Mock insight 1", "Mock insight 2"],
        sentiment: "positive"
    }),
    
    validateResponses: () => Promise.resolve({
        violations: [
            {
                responseId: "mock-response-id",
                reason: "Mock violation reason"
            }
        ]
    }),
    
    analyzeSentiment: () => Promise.resolve({
        sentiment: "positive",
        score: 0.8
    }),

    generateSurveyQuestions: (topic) => Promise.resolve([
        `What aspects of ${topic} do you find most valuable?`,
        `How could ${topic} be improved?`,
        `What challenges have you faced with ${topic}?`
    ])
};

// Named exports for individual functions
export const generateSummary = mockLLMService.generateSummary;
export const validateResponses = mockLLMService.validateResponses;
export const analyzeSentiment = mockLLMService.analyzeSentiment;
export const generateSurveyQuestions = mockLLMService.generateSurveyQuestions;

// Default export for the whole service
export default mockLLMService;