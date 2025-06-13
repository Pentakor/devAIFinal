import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const generateTestUser = (includePassword = false) => {
  const plainPassword = 'password123'; // Consistent test password
  const userData = {
    username: faker.internet.username().replace(/[^a-zA-Z0-9_-]/g, ''),
    email: faker.internet.email(),
    passwordHash: bcrypt.hashSync(plainPassword, 10),
    role: 'user',
    isActive: true
  };
  
  // Return plain password for login tests
  if (includePassword) {
    userData.password = plainPassword;
  }
  
  return userData;
};

export const generateTestSurvey = (creatorId) => ({
  creator: creatorId,
  area: faker.lorem.words(2), // e.g., "Public Transport"
  question: faker.lorem.sentence(10), // Ensure >10 characters
  guidelines: {
    permittedDomains: faker.lorem.words(5), // >2 characters
    permittedResponses: faker.lorem.sentences(1), // >10 characters
    summaryInstructions: faker.lorem.sentences(1) // >10 characters
  },
  expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) // valid future date
});

export const generateTestOpinion = (surveyId) => ({
  content: faker.lorem.paragraph(),
  sentiment: faker.helpers.arrayElement(['positive', 'negative', 'neutral'])
});

export const generateAuthToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

export const createTestUser = async (User, includePassword = false) => {
  const userData = generateTestUser(includePassword);
  const user = await User.create(userData);
  return { user, userData };
};

export const createTestSurvey = async (Survey, userId) => {
  const surveyData = generateTestSurvey(userId);
  const survey = await Survey.create(surveyData);
  return { survey, surveyData };
};