import request from 'supertest';
import app from '../src/app.js';
import Survey from '../src/models/Survey.js';
import User from '../src/models/User.js';
import { connectDB, clearDB, closeDB } from './setup.js';
import { generateTestUser, generateTestSurvey } from './helpers.js';
import Response from '../src/models/Response.js';

// Mock the LLM service
jest.mock('../src/service/aiService.js', () => ({
    generateAISummary: jest.fn().mockResolvedValue({
        summary: "This is a mock summary of the survey responses.",
        insights: ["Mock insight 1", "Mock insight 2"],
        sentiment: "positive"
    })
}));

describe('Survey Management API', () => {
    let authToken;
    let testUser;
    let testSurvey;
    

    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await closeDB();
    });

    beforeEach(async () => {
        await clearDB();
        
        // Create test user and get auth token
        const userData = generateTestUser();
        testUser = await User.create(userData);

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'Password123!'
            });
        authToken = loginRes.body.data.token;

        // Create a test survey
        const surveyData = generateTestSurvey(testUser._id);
        testSurvey = await Survey.create(surveyData);
    });

    describe('POST /api/surveys - Create Survey', () => {
        describe('Happy Path', () => {
            it('should create a new survey with valid data', async () => {
                const surveyData = {
                    title: 'Customer Satisfaction Survey',
                    description: 'Please provide your feedback',
                    area: 'Customer Service',
                    questions: [
                        {
                            type: 'multiple-choice',
                            question: 'How satisfied are you?',
                            options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied']
                        },
                        {
                            type: 'text',
                            question: 'Any additional comments?'
                        }
                    ]
                };

                const res = await request(app)
                    .post('/api/surveys')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(surveyData);

                expect(res.status).toBe(201);
                expect(res.body.status).toBe('success');
                expect(res.body.data.title).toBe(surveyData.title);
                expect(res.body.data.creator.toString()).toBe(testUser._id.toString());
                expect(res.body.data.questions).toHaveLength(2);
            });
        });

        describe('Authentication & Authorization', () => {
            it('should reject survey creation without authentication', async () => {
                const res = await request(app)
                    .post('/api/surveys')
                    .send(generateTestSurvey(testUser._id));

                expect(res.status).toBe(401);
                expect(res.body.status).toBe('error');
            });

            it('should reject survey creation with invalid token', async () => {
                const res = await request(app)
                    .post('/api/surveys')
                    .set('Authorization', 'Bearer invalid-token')
                    .send(generateTestSurvey(testUser._id));

                expect(res.status).toBe(401);
                expect(res.body.status).toBe('error');
            });
        });

        describe('Validation Errors', () => {
            it('should reject survey with empty title', async () => {
                const res = await request(app)
                    .post('/api/surveys')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        title: '',
                        description: 'Test description'
                    });

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('error');
            });

            it('should reject survey with missing required fields', async () => {
                const res = await request(app)
                    .post('/api/surveys')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        title: 'Test Survey'
                        // Missing description and other required fields
                    });

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('error');
            });

            it('should reject survey with invalid question format', async () => {
                const res = await request(app)
                    .post('/api/surveys')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        title: 'Test Survey',
                        description: 'Test description',
                        questions: [
                            {
                                type: 'invalid-type',
                                question: 'Test question?'
                            }
                        ]
                    });

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('error');
            });

            it('should reject survey with multiple-choice question missing options', async () => {
                const res = await request(app)
                    .post('/api/surveys')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        title: 'Test Survey',
                        description: 'Test description',
                        questions: [
                            {
                                type: 'multiple-choice',
                                question: 'Choose one?'
                                // Missing options array
                            }
                        ]
                    });

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('error');
            });
        });
    });

    describe('GET /api/surveys - List Surveys', () => {
        describe('Happy Path', () => {
            it('should list all surveys with authentication', async () => {
                const res = await request(app)
                    .get('/api/surveys')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('success');
                expect(Array.isArray(res.body.data)).toBeTruthy();
                expect(res.body.data.length).toBeGreaterThan(0);
            });

            it('should support pagination', async () => {
                // Create multiple surveys
                for (let i = 0; i < 5; i++) {
                    await Survey.create(generateTestSurvey(testUser._id));
                }

                const res = await request(app)
                    .get('/api/surveys?page=1&limit=3')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(200);
                expect(res.body.data.length).toBeLessThanOrEqual(3);
            });
        });

        describe('Authentication', () => {
            it('should require authentication to list surveys', async () => {
                const res = await request(app)
                    .get('/api/surveys');

                expect(res.status).toBe(401);
                expect(res.body.status).toBe('error');
            });
        });

        describe('Edge Cases', () => {
            it('should handle invalid pagination parameters gracefully', async () => {
                const res = await request(app)
                    .get('/api/surveys?page=-1&limit=abc')
                    .set('Authorization', `Bearer ${authToken}`);

                // Should either use defaults or return validation error
                expect([200, 400]).toContain(res.status);
            });
        });
    });

    describe('GET /api/surveys/:id - Get Survey by ID', () => {
        describe('Happy Path', () => {
            it('should retrieve survey by valid ID', async () => {
                const res = await request(app)
                    .get(`/api/surveys/${testSurvey._id}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('success');
                expect(res.body.data._id.toString()).toBe(testSurvey._id.toString());
                expect(res.body.data.title).toBe(testSurvey.title);
            });
        });

        describe('Error Cases', () => {
            it('should return 404 for non-existent survey', async () => {
                const res = await request(app)
                    .get('/api/surveys/507f1f77bcf86cd799439011')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(404);
                expect(res.body.status).toBe('error');
            });

            it('should return 400 for invalid ObjectId format', async () => {
                const res = await request(app)
                    .get('/api/surveys/invalid-id')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('error');
            });
        });
    });

    describe('DELETE /api/surveys/:id - Delete Survey', () => {
        describe('Happy Path', () => {
            it('should delete survey successfully', async () => {
                const res = await request(app)
                    .delete(`/api/surveys/${testSurvey._id}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(204);

                // Verify survey is deleted
                const deletedSurvey = await Survey.findById(testSurvey._id);
                expect(deletedSurvey).toBeNull();
            });
        });

        describe('Authorization', () => {
            it('should not allow deleting another user\'s survey', async () => {
                // Create another user
                const otherUser = await User.create(generateTestUser());
                const otherSurvey = await Survey.create(generateTestSurvey(otherUser._id));

                const res = await request(app)
                    .delete(`/api/surveys/${otherSurvey._id}`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(403);
                expect(res.body.status).toBe('error');
            });
        });

        describe('Error Cases', () => {
            it('should return 404 for non-existent survey', async () => {
                const res = await request(app)
                    .delete('/api/surveys/507f1f77bcf86cd799439011')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(404);
                expect(res.body.status).toBe('error');
            });
        });
    });

    describe('GET /api/surveys/search - Search Surveys', () => {
        beforeEach(async () => {
            // Create surveys with different titles for search testing
            await Survey.create({
                ...generateTestSurvey(testUser._id),
                title: 'Customer Feedback Survey'
            });
            await Survey.create({
                ...generateTestSurvey(testUser._id),
                title: 'Employee Satisfaction Survey'
            });
        });

        describe('Happy Path', () => {
            it('should search surveys by title', async () => {
                const res = await request(app)
                    .get('/api/surveys/search?query=Customer')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('success');
                expect(Array.isArray(res.body.data)).toBeTruthy();
            });
        });

        describe('Validation Errors', () => {
            it('should return 400 without query parameter', async () => {
                const res = await request(app)
                    .get('/api/surveys/search')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('error');
            });

            it('should handle empty query string', async () => {
                const res = await request(app)
                    .get('/api/surveys/search?query=')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('error');
            });
        });
    });

    describe('POST /api/surveys/:id/close - Close Survey', () => {
        describe('Happy Path', () => {
            it('should close survey successfully', async () => {
                const res = await request(app)
                    .post(`/api/surveys/${testSurvey._id}/close`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('success');
                expect(res.body.data.isClosed).toBe(true);

                // Verify in database
                const updatedSurvey = await Survey.findById(testSurvey._id);
                expect(updatedSurvey.isClosed).toBe(true);
            });
        });

        describe('Error Cases', () => {
            it('should return 404 for non-existent survey', async () => {
                const res = await request(app)
                    .post('/api/surveys/507f1f77bcf86cd799439011/close')
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(404);
            });

            it('should handle already closed survey', async () => {
                // Close the survey first
                await Survey.findByIdAndUpdate(testSurvey._id, { isClosed: true });

                const res = await request(app)
                    .post(`/api/surveys/${testSurvey._id}/close`)
                    .set('Authorization', `Bearer ${authToken}`);

                // Should either succeed (200) or indicate already closed (400)
                expect([200, 400]).toContain(res.status);
            });
        });
    });

    describe('Survey Expiry Management', () => {
        describe('GET /api/surveys/:id/expiry - Get Expiry', () => {
            it('should return survey expiry information', async () => {
                const res = await request(app)
                    .get(`/api/surveys/${testSurvey._id}/expiry`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('success');
                expect(res.body.data).toHaveProperty('expiryDate');
                expect(res.body.data).toHaveProperty('isExpired');
            });
        });

        describe('PUT /api/surveys/:id/expiry - Update Expiry', () => {
            it('should update survey expiry date', async () => {
                const newExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
                
                const res = await request(app)
                    .put(`/api/surveys/${testSurvey._id}/expiry`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ expiryDate: newExpiry });

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('success');
                expect(new Date(res.body.data.expiryDate)).toEqual(newExpiry);
            });

            it('should reject invalid expiry date', async () => {
                const res = await request(app)
                    .put(`/api/surveys/${testSurvey._id}/expiry`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ expiryDate: 'invalid-date' });

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('error');
            });

            it('should reject past expiry date', async () => {
                const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
                
                const res = await request(app)
                    .put(`/api/surveys/${testSurvey._id}/expiry`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ expiryDate: pastDate });

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('error');
            });
        });
    });

    describe('GET /api/surveys/:id/validate-responses - Validate Responses', () => {
        describe('Happy Path', () => {
            it('should validate survey responses', async () => {
                const res = await request(app)
                    .get(`/api/surveys/${testSurvey._id}/validate-responses`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('success');
                expect(res.body.data).toHaveProperty('validationResults');
            });
        });
    });

    describe('AI Summary Generation', () => {
        describe('POST /api/surveys/:id/summary - Generate Summary', () => {
            it('should generate summary with mocked LLM when responses exist', async () => {
                // Create a response first
                await Response.create({
                    survey: testSurvey._id,
                    user: testUser._id,
                    answers: [
                        { questionId: 0, answer: 'Blue' },
                        { questionId: 1, answer: 'Because it reminds me of the ocean' }
                    ]
                });

                const res = await request(app)
                    .post(`/api/surveys/${testSurvey._id}/summary`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('success');
                expect(res.body.data).toHaveProperty('summary');
                expect(res.body.data.summary).toBe("This is a mock summary of the survey responses.");
                expect(res.body.data.insights).toEqual(["Mock insight 1", "Mock insight 2"]);
                expect(res.body.data.sentiment).toBe("positive");
            });

            it('should return 400 for survey with no responses', async () => {
                const res = await request(app)
                    .post(`/api/surveys/${testSurvey._id}/summary`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('error');
                expect(res.body.message).toContain('no responses');
            });
        });

        describe('PUT /api/surveys/:id/summary/visibility - Toggle Summary Visibility', () => {
            it('should toggle summary visibility', async () => {
                const res = await request(app)
                    .put(`/api/surveys/${testSurvey._id}/summary/visibility`)
                    .set('Authorization', `Bearer ${authToken}`);

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('success');
                expect(res.body.data).toHaveProperty('isSummaryVisible');
            });
        });
    });
});

// Add this before your routes
app.use(express.json());

// Add this after your routes
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError) {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid request format'
        });
    }
    
    console.error('Error:', err);
    res.status(500).json({
        status: 'fail',
        message: 'Internal server error'
    });
});