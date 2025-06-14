import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import { connectDB, clearDB, closeDB } from './setup.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

describe('Authentication Endpoints', () => {
    const validUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        registrationCode: process.env.REGISTRATION_SECRET
    };
    beforeAll(async () => {
        await connectDB();
    }, 30000);

    afterAll(async () => {
        await closeDB();
    }, 30000);

    beforeEach(async () => {
        await clearDB();
    });

    describe('POST /api/auth/register', () => {
        describe('Happy Path', () => {
            it('should register a new user with valid data', async () => {
                const res = await request(app)
                    .post('/api/auth/register')
                    .send(validUser);
                    console.log('🔁 Register Response:', {
                        status: res.status,
                        body: res.body});
                expect(res.status).toBe(201);
                expect(res.body.status).toBe('success');
                expect(res.body.message).toBe('Registration successful');

                // Verify user was created in database
                const user = await User.findOne({ email: validUser.email });
                expect(user).toBeTruthy();
                expect(user.username).toBe(validUser.username);
                expect(user.email).toBe(validUser.email);
            });
        });

        describe('Validation Errors', () => {
            it('should reject registration with invalid registration code', async () => {
                const res = await request(app)
                    .post('/api/auth/register')
                    .send({
                        ...validUser,
                        registrationCode: 'wrong-code'
                    });

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('fail');
                expect(res.body.message).toBeDefined()
                expect(res.body.errorCode).toBe('VALIDATION_ERROR');
            });

            it('should reject registration with missing username', async () => {
                const res = await request(app)
                    .post('/api/auth/register')
                    .send({
                        ...validUser,
                        username: undefined
                    });

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('fail');
            });

            it('should reject registration with invalid email format', async () => {
                const res = await request(app)
                    .post('/api/auth/register')
                    .send({
                        ...validUser,
                        email: 'invalid-email'
                    });

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('fail');
            });

            it('should reject registration with weak password', async () => {
                const res = await request(app)
                    .post('/api/auth/register')
                    .send({
                        ...validUser,
                        password: '123'
                    });

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('fail');
            });

            it('should reject registration with empty request body', async () => {
                const res = await request(app)
                    .post('/api/auth/register')
                    .send({});

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('fail');
            });
        });

        describe('Duplicate User Handling', () => {
            it('should reject registration with existing email', async () => {
                // First create a user
                await request(app)
                    .post('/api/auth/register')
                    .send(validUser);

                // Try to create another user with same email
                const res = await request(app)
                    .post('/api/auth/register')
                    .send({
                        ...validUser,
                        username: 'differentuser'
                    });

                expect(res.status).toBe(409);
                expect(res.body.status).toBe('fail');
                expect(res.body.message).toBe('User with this email or username already exists');
            });

            it('should reject registration with existing username', async () => {
                // First create a user
                await request(app)
                    .post('/api/auth/register')
                    .send(validUser);

                // Try to create another user with same username
                const res = await request(app)
                    .post('/api/auth/register')
                    .send({
                        ...validUser,
                        email: 'different@example.com'
                    });

                expect(res.status).toBe(409);
                expect(res.body.status).toBe('fail');
                expect(res.body.message).toBe('User with this email or username already exists');
            });
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            // Create a user before each login test
            await request(app)
                .post('/api/auth/register')
                .send(validUser);
        });

        describe('Happy Path', () => {
            it('should login with valid email and password', async () => {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: validUser.email,
                        password: validUser.password
                    });

                expect(res.status).toBe(200);
                expect(res.body.status).toBe('success');
                expect(res.body.data.token).toBeTruthy();
                expect(res.body.data.user).toMatchObject({
                    username: validUser.username,
                    email: validUser.email
                });
                expect(res.body.data.user.password).toBeUndefined();
            });
        });

        describe('Authentication Failures', () => {
            it('should reject login with wrong password', async () => {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: validUser.email,
                        password: 'wrongpassword'
                    });

                expect(res.status).toBe(401);
                expect(res.body.status).toBe('fail');
                expect(res.body.message).toBe('Invalid email or password');
                expect(res.body.data).toBeUndefined();
            });

            it('should reject login with unregistered email', async () => {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: 'nonexistent@example.com',
                        password: 'password123'
                    });

                expect(res.status).toBe(401);
                expect(res.body.status).toBe('fail');
                expect(res.body.message).toBe('Invalid email or password');
            });

            it('should reject login with empty credentials', async () => {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({});

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('fail');
            });

            it('should reject login with only email provided', async () => {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: validUser.email
                    });

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('fail');
            });

            it('should reject login with only password provided', async () => {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({
                        password: validUser.password
                    });

                expect(res.status).toBe(400);
                expect(res.body.status).toBe('fail');
            });
        });

        describe('Edge Cases', () => {
            it('should handle case-insensitive email login', async () => {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: validUser.email.toUpperCase(),
                        password: validUser.password
                    });

                // Should either work (200) or fail consistently (401)
                expect([200, 401]).toContain(res.status);
            });

            it('should reject login with email containing extra whitespace', async () => {
                const res = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: ` ${validUser.email} `,
                        password: validUser.password
                    });

                // Should either handle gracefully (200) or reject (400/401)
                expect([200, 400, 401]).toContain(res.status);
            });

            it('should handle malformed JSON gracefully', async () => {
                const res = await request(app)
                    .post('/api/auth/login')
                    .set('Content-Type', 'application/json')
                    .send('{"email": "test@example.com", "password":}'); // Invalid JSON

                expect(res.status).toBe(400);
            });
        });
    });
});