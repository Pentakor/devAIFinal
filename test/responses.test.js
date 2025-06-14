import request from 'supertest';
import app from '../src/app.js';
import Survey from '../src/models/Survey.js';
import User from '../src/models/User.js';
import Response from '../src/models/Response.js';
import { connectDB, clearDB, closeDB } from './setup.js';
import { generateTestUser, generateTestSurvey, generateTestOpinion } from './helpers.js';

describe('Response Endpoints', () => {
    let authToken;
    let testUser;
    let testSurvey;
    let testResponse;

    const validResponse = {
        content: 'I would like to improve the playground by adding more swings and a climbing wall. The current equipment is getting old and needs replacement.'
    };

    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await closeDB();
    });

    beforeEach(async () => {
        await clearDB();
        // Create test user and get auth token
        const user = await User.create(generateTestUser());
        testUser = user;

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'password123'
            });
        authToken = loginRes.body.data.token;

        // Create a test survey
        const survey = await Survey.create({
            ...generateTestSurvey(testUser._id),
            questions: [
                {
                    type: 'multiple-choice',
                    question: 'What is your favorite color?',
                    options: ['Red', 'Blue', 'Green']
                },
                {
                    type: 'text',
                    question: 'Why do you like this color?'
                }
            ]
        });
        testSurvey = survey;

        // Create a test response
        const response = await Response.create({
            survey: survey._id,
            user: user._id,
            content: validResponse.content
        });
        testResponse = response;
    });

    describe('POST /api/surveys/:id/responses', () => {
        it('should submit a new response', async () => {
            const testOpinion = generateTestOpinion(testSurvey._id);
            const responseData = {
                content: testOpinion.content
            };

            const res = await request(app)
                .post(`/api/surveys/${testSurvey._id}/responses`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(responseData);

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('success');
        });

        it('should not submit response to closed survey', async () => {
            // Close the survey first
            await Survey.findByIdAndUpdate(testSurvey._id, { isClosed: true });

            const res = await request(app)
                .post(`/api/surveys/${testSurvey._id}/responses`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(validResponse);

            expect(res.status).toBe(400);
            expect(res.body.message).toContain('closed');
        });

        it('should not submit response with invalid content', async () => {
            const res = await request(app)
                .post(`/api/surveys/${testSurvey._id}/responses`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    content: 'Too short' // Less than 10 characters
                });

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/surveys/:id/responses', () => {
        it('should list all responses for a survey', async () => {
            const res = await request(app)
                .get(`/api/surveys/${testSurvey._id}/responses`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('success');
            expect(Array.isArray(res.body.data)).toBeTruthy();
            expect(res.body.data.length).toBeGreaterThan(0);
        });

        it('should return 404 for non-existent survey', async () => {
            const res = await request(app)
                .get('/api/surveys/507f1f77bcf86cd799439011/responses')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(404);
        });

        it('should not list responses without authentication', async () => {
            const res = await request(app)
                .get(`/api/surveys/${testSurvey._id}/responses`);

            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/surveys/:id/responses/:responseId', () => {
        it('should update an existing response', async () => {
            const updatedResponse = {
                content: 'I would like to improve the playground by adding a water feature and more shade areas. The current equipment is good but needs more variety.'
            };

            const res = await request(app)
                .put(`/api/surveys/${testSurvey._id}/responses/${testResponse._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updatedResponse);

            expect(res.status).toBe(200);
            expect(res.body.data.content).toBe(updatedResponse.content);
        });

        it('should not update response of another user', async () => {
            // Create another user
            const otherUser = await User.create(generateTestUser());

            const otherLoginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: otherUser.email,
                    password: 'password123'
                });
            const otherAuthToken = otherLoginRes.body.data.token;

            const res = await request(app)
                .put(`/api/surveys/${testSurvey._id}/responses/${testResponse._id}`)
                .set('Authorization', `Bearer ${otherAuthToken}`)
                .send(validResponse);

            expect(res.status).toBe(404);
        });

        it('should not update response with invalid content', async () => {
            const res = await request(app)
                .put(`/api/surveys/${testSurvey._id}/responses/${testResponse._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    content: 'Too short' // Less than 10 characters
                });

            expect(res.status).toBe(400);
        });
    });

    describe('DELETE /api/surveys/:id/responses/:responseId', () => {
        it('should delete a response', async () => {
            const res = await request(app)
                .delete(`/api/surveys/${testSurvey._id}/responses/${testResponse._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(204);
        });

        it('should not delete response of another user', async () => {
            // Create another user
            const otherUser = await User.create(generateTestUser());

            const otherLoginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: otherUser.email,
                    password: 'password123'
                });
            const otherAuthToken = otherLoginRes.body.data.token;

            const res = await request(app)
                .delete(`/api/surveys/${testSurvey._id}/responses/${testResponse._id}`)
                .set('Authorization', `Bearer ${otherAuthToken}`);

            expect(res.status).toBe(403);
        });

        it('should return 404 for non-existent response', async () => {
            const res = await request(app)
                .delete(`/api/surveys/${testSurvey._id}/responses/507f1f77bcf86cd799439011`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(404);
        });
    });
}); 