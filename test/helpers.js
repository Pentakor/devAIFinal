import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const generateTestUser = () => ({
  username: faker.internet.username().replace(/[^a-zA-Z0-9_-]/g, ''),
  email: faker.internet.email(),
  passwordHash: bcrypt.hashSync(faker.internet.password(), 10),
  role: 'creator',
  isActive: true
});

export const generateTestSurvey = (creatorId) => ({
  creator: creatorId,
  area: faker.lorem.words(3),
  question: faker.lorem.sentence() + '?',
  guidelines: {
    permittedDomains: ['example.com'],
    permittedResponses: 'Please provide detailed feedback about your experience. Include specific examples and suggestions for improvement.',
    summaryInstructions: 'Summarize the key points from all responses, focusing on common themes and unique insights.'
  },
  expiryDate: faker.date.future({ years: 1 }),
  isClosed: false
});

export const generateTestOpinion = (surveyId) => ({
  content: faker.lorem.paragraph(),
  sentiment: faker.helpers.arrayElement(['positive', 'negative', 'neutral'])
});

export const generateAuthToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

export const createTestUser = async (User) => {
  const userData = generateTestUser();
  const user = await User.create(userData);
  return { user, userData };
};

export const createTestSurvey = async (Survey, userId) => {
  const surveyData = generateTestSurvey(userId);
  const survey = await Survey.create(surveyData);
  return { survey, surveyData };
}; 