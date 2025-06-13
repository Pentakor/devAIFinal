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
  title: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  area: faker.lorem.words(2),
  question: faker.lorem.sentence(),
  guidelines: {
    permittedDomains: faker.lorem.words(5),
    permittedResponses: faker.lorem.sentence(),
    summaryInstructions: faker.lorem.sentence()
  },
  expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
  isClosed: false,
  questions: [
    {
      type: 'multiple-choice',
      question: faker.lorem.sentence(),
      options: ['Red', 'Blue', 'Green']
    },
    {
      type: 'text',
      question: faker.lorem.sentence()
    }
  ]
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