import { expect } from 'chai';
import { describe, it, beforeAll, afterAll } from '@jest/globals';
import { connect, closeDatabase } from './setup.js';
import { generateSummary, analyzeSentiment, generateSurveyQuestions } from './__mocks__/llmService.js';

describe('LLM Service', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('generateSummary', () => {
    it('should generate a summary with insights and sentiment', async () => {
      const responses = [
        { answer: 'Great experience!' },
        { answer: 'Could be better' }
      ];

      const result = await generateSummary(responses);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('sentiment');
      expect(result.summary).toBe("This is a mock summary of the survey responses.");
      expect(result.insights).toEqual(["Mock insight 1", "Mock insight 2"]);
      expect(result.sentiment).toBe("positive");
    });
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment with confidence score', async () => {
      const text = "This is a great product!";
      const result = await analyzeSentiment(text);

      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('confidence');
      expect(result.sentiment).toBe('positive');
      expect(result.confidence).toBe(0.85);
    });
  });

  describe('generateSurveyQuestions', () => {
    it('should generate relevant survey questions', async () => {
      const topic = "Product Feedback";
      const questions = await generateSurveyQuestions(topic);

      expect(Array.isArray(questions)).toBeTruthy();
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toContain("Product Feedback");
    });
  });
}); 