import request from 'supertest';
import { expect } from 'chai';
import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { connectDB, clearDB, closeDB } from './setup.js';
import { createTestUser, createTestSurvey, generateTestOpinion, generateAuthToken } from './helpers.js';
import User from '../src/models/User.js';
import Survey from '../src/models/Survey.js';
import app from '../src/app.js';

describe('Survey API Endpoints', () => {
  let testUser;
  let testSurvey;
  let authToken;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();
    // Create test user and get auth token
    const { user } = await createTestUser(User);
    testUser = user;
    authToken = generateAuthToken(user._id);
    
    // Create test survey
    const { survey } = await createTestSurvey(Survey, user._id);
    testSurvey = survey;
  });

  afterEach(async () => {
    await clearDB();
  });

  describe('POST /api/surveys', () => {
    it('should create a new survey', async () => {
      const surveyData = {
        area: 'Test Area',
        question: 'What is your opinion on testing?',
        guidelines: {
          permittedDomains: ['example.com'],
          permittedResponses: 'Please provide detailed feedback about your experience.',
          summaryInstructions: 'Summarize the key points from all responses.'
        },
        expiryDate: new Date(Date.now() + 86400000) // 1 day from now
      };

      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${authToken}`)
        .send(surveyData);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('_id');
      expect(response.body.area).to.equal(surveyData.area);
      expect(response.body.question).to.equal(surveyData.question);
    });

    it('should validate survey data', async () => {
      const invalidSurvey = {
        area: 'Te', // Too short
        question: 'No question mark', // Missing question mark
        guidelines: {
          permittedDomains: ['invalid'], // Invalid domain
          permittedResponses: 'Too short', // Too short
          summaryInstructions: 'Too short' // Too short
        },
        expiryDate: new Date(Date.now() - 86400000) // Past date
      };

      const response = await request(app)
        .post('/api/surveys')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSurvey);

      expect(response.status).to.equal(400);
    });
  });

  describe('GET /api/surveys', () => {
    it('should get all surveys', async () => {
      const response = await request(app)
        .get('/api/surveys')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.at.least(1);
    });
  });

  describe('GET /api/surveys/:id', () => {
    it('should get a specific survey', async () => {
      const response = await request(app)
        .get(`/api/surveys/${testSurvey._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(200);
      expect(response.body._id).to.equal(testSurvey._id.toString());
    });

    it('should return 404 for non-existent survey', async () => {
      const response = await request(app)
        .get('/api/surveys/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).to.equal(404);
    });
  });

  describe('POST /api/surveys/:id/responses', () => {
    it('should submit a response to a survey', async () => {
      const responseData = generateTestOpinion(testSurvey._id);

      const response = await request(app)
        .post(`/api/surveys/${testSurvey._id}/responses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(responseData);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('_id');
      expect(response.body.surveyId).to.equal(testSurvey._id.toString());
    });

    it('should enforce maximum responses limit', async () => {
      // Create a survey with maxResponses = 1
      const limitedSurvey = await Survey.create({
        ...testSurvey.toObject(),
        _id: undefined,
        maxResponses: 1
      });

      // Submit first response
      await request(app)
        .post(`/api/surveys/${limitedSurvey._id}/responses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestOpinion(limitedSurvey._id));

      // Try to submit second response
      const response = await request(app)
        .post(`/api/surveys/${limitedSurvey._id}/responses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateTestOpinion(limitedSurvey._id));

      expect(response.status).to.equal(400);
      expect(response.body.message).to.include('maximum number of responses');
    });
  });
}); 