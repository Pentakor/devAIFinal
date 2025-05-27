import { expect } from 'chai';
import { describe, it, beforeAll, afterAll } from '@jest/globals';
import { connect, closeDatabase } from './setup.js';
import { generateSummary, analyzeSentiment, generateSurveyQuestions } from '../src/__mocks__/llmService.js';

describe('LLM Service', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('generateSummary', () => {
    it('should generate a summary from opinions', async () => {
      const opinions = [
        { text: 'Great experience', sentiment: 'positive' },
        { text: 'Could be better', sentiment: 'neutral' }
      ];

      const result = await generateSummary(opinions);

      expect(result).to.have.property('summary');
      expect(result).to.have.property('keyPoints');
      expect(result).to.have.property('sentiment');
      expect(result.keyPoints).to.be.an('array');
    });
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment of text', async () => {
      const text = 'This is a positive review about the product';

      const result = await analyzeSentiment(text);

      expect(result).to.have.property('sentiment');
      expect(result).to.have.property('confidence');
      expect(result.confidence).to.be.a('number');
      expect(result.confidence).to.be.within(0, 1);
    });
  });

  describe('generateSurveyQuestions', () => {
    it('should generate questions for a topic', async () => {
      const topic = 'Product Feedback';

      const questions = await generateSurveyQuestions(topic);

      expect(questions).to.be.an('array');
      expect(questions.length).to.be.greaterThan(0);
      questions.forEach(question => {
        expect(question).to.be.a('string');
        expect(question).to.include(topic);
      });
    });
  });
}); 